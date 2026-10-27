import { flushPromises, mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import { UiCapture } from '../src/site/index.js'
import type { UiCaptureItem } from '../src/site/index.js'

const items: readonly UiCaptureItem[] = [
  { id: 'read', label: 'Read', command: 'annoterm notes.md', html: '<pre class="term">read screen</pre>' },
  { id: 'mark', label: 'Mark', command: 'a, then Enter', html: '<pre class="term">mark screen</pre>' },
  { id: 'send', label: 'Send', html: '<pre class="term">send screen</pre>' },
]

const caption = ({ item }: { item: UiCaptureItem }) => h('p', `About ${item.label}`)

const settleDialog = async () => {
  await flushPromises()
  // Reka registers outside-pointer listeners and cleans up focus in a macrotask.
  await new Promise(resolve => setTimeout(resolve, 0))
}

const mountCapture = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(UiCapture, {
    attachTo: document.body,
    props: { items, label: 'Steps', ...props },
    slots: { caption },
  })
  await nextTick()
  return wrapper
}

const visibleFigure = () => document.querySelector('[role="tabpanel"]:not([hidden]) figure')

let cleanups: (() => void)[] = []

beforeEach(() => {
  cleanups = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0)
    return 0
  })
})

afterEach(async () => {
  cleanups.forEach(cleanup => cleanup())
  await settleDialog()
  vi.restoreAllMocks()
  history.replaceState(null, '', '/')
  document.body.replaceChildren()
})

describe('UiCapture', () => {
  it('lists every capture with its command and caption without scripts', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp({
      render: () => h(UiCapture, { items, label: 'Steps' }, { caption }),
    }))

    expect(container.querySelector('[role="tablist"]')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect([...container.querySelectorAll('figure')].map(figure => figure.id)).toEqual(['frame-read', 'frame-mark', 'frame-send'])
    expect(container.querySelector('#frame-read figcaption code')?.textContent).toBe('annoterm notes.md')
    expect(container.querySelector('#frame-read figcaption p')?.textContent).toBe('About Read')
    expect(container.querySelector('#frame-send figcaption code')).toBeNull()
    // Without scaling, a wide capture scrolls and must be reachable from the keyboard.
    expect(container.querySelector('#frame-read [role="region"]')?.getAttribute('tabindex')).toBe('0')
  })

  it('hydrates the server markup without mismatches, then adds tabs and expand buttons', async () => {
    const app = () => createSSRApp({ render: () => h(UiCapture, { items, label: 'Steps' }, { caption }) })
    const container = document.body.appendChild(document.createElement('div'))
    container.innerHTML = await renderToString(app())
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const hydrated = app()
    hydrated.mount(container)
    cleanups.push(() => hydrated.unmount())
    await nextTick()

    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3)
    expect(container.querySelectorAll('[aria-haspopup="dialog"]')).toHaveLength(3)
    expect(visibleFigure()?.id).toBe('frame-read')
  })

  it('selects a capture from its tab and reports the change', async () => {
    const wrapper = await mountCapture()
    expect(visibleFigure()?.id).toBe('frame-read')

    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['mark']])
    expect(visibleFigure()?.id).toBe('frame-mark')
    cleanups.push(() => wrapper.unmount())
  })

  it('selects the capture named by a deep link on load and on hash change', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
    history.replaceState(null, '', '#frame-mark')
    const wrapper = await mountCapture({ idPrefix: 'frame-' })
    await flushPromises()

    expect(visibleFigure()?.id).toBe('frame-mark')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })

    history.replaceState(null, '', '#frame-send')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await flushPromises()

    expect(visibleFigure()?.id).toBe('frame-send')
    expect(wrapper.emitted('update:modelValue')).toEqual([['mark'], ['send']])
    cleanups.push(() => wrapper.unmount())
  })

  it('opens the full-size capture and returns focus to its trigger on close', async () => {
    const wrapper = await mountCapture({ modelValue: 'mark' })
    const expand = wrapper.get<HTMLButtonElement>('[aria-label="Expand Mark capture"]')
    expect(expand.attributes('aria-haspopup')).toBe('dialog')

    expand.element.focus()
    await expand.trigger('click')
    await settleDialog()

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const titleId = dialog?.getAttribute('aria-labelledby') ?? ''
    expect(document.getElementById(titleId)?.textContent?.trim()).toBe('Mark capture')
    expect(dialog?.querySelector('[role="region"]')?.textContent).toBe('mark screen')
    expect(dialog?.querySelector('[role="region"]')?.getAttribute('tabindex')).toBe('0')

    const close = [...dialog?.querySelectorAll('button') ?? []].find(button => button.textContent?.trim() === 'Close capture')
    close?.click()
    await settleDialog()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(expand.element)
    cleanups.push(() => wrapper.unmount())
  })

  it('scales a wide capture down to the panel width', async () => {
    const observed = new Map<Element, () => void>()
    vi.stubGlobal('ResizeObserver', class implements ResizeObserver {
      callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) { this.callback = callback }
      observe(target: Element) { observed.set(target, () => this.callback([], this)) }
      unobserve() {}
      disconnect() {}
    })
    cleanups.push(() => vi.unstubAllGlobals())
    const wrapper = await mountCapture()
    const screen = wrapper.get<HTMLElement>('#frame-read [role="region"]').element
    const capture = screen.firstElementChild
    if (!(capture instanceof HTMLElement)) throw new Error('Missing capture markup')
    vi.spyOn(screen, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(screen, 'clientHeight', 'get').mockReturnValue(300)
    vi.spyOn(screen, 'offsetHeight', 'get').mockReturnValue(302)
    vi.spyOn(capture, 'offsetWidth', 'get').mockReturnValue(1000)
    vi.spyOn(capture, 'offsetHeight', 'get').mockReturnValue(600)

    observed.get(screen)?.()
    await nextTick()

    expect(screen.style.getPropertyValue('--capture-scale')).toBe('0.5')
    expect(screen.style.height).toBe('302px')
    expect(screen.hasAttribute('tabindex')).toBe(false)
    cleanups.push(() => wrapper.unmount())
  })

  it('remeasures when a capture keeps its ID but gets new markup', async () => {
    vi.stubGlobal('ResizeObserver', class implements ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    cleanups.push(() => vi.unstubAllGlobals())
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.textContent?.includes('wide') ? 2000 : 1000
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
    cleanups.push(() => vi.restoreAllMocks())
    const wrapper = await mountCapture()
    const screen = () => wrapper.get<HTMLElement>('#frame-read [role="region"]').element
    await nextTick()
    expect(screen().style.getPropertyValue('--capture-scale')).toBe('0.5')

    await wrapper.setProps({ items: [{ ...items[0], html: '<pre class="term">wide read screen</pre>' }, ...items.slice(1)] })
    await nextTick()

    expect(screen().style.getPropertyValue('--capture-scale')).toBe('0.25')
    cleanups.push(() => wrapper.unmount())
  })
})
