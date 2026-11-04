import { renderToString } from 'vue/server-renderer'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useActiveSection } from '../src/use-active-section.js'

const PageNavigation = defineComponent({
  props: { targetIds: { type: Array<string>, default: () => ['missing', 'overview', 'commands', 'details'] } },
  setup(props) {
    const active = useActiveSection({ targetIds: props.targetIds })
    return () => h('nav', ['overview', 'commands', 'details'].map(id => h('a', {
      href: `#${id}`,
      'aria-current': active.value === id ? 'location' : undefined,
    }, id)))
  },
})

describe('useActiveSection', () => {
  let pending: Map<number, FrameRequestCallback>
  let nextFrame: number
  let resized: ResizeObserverCallback | undefined
  const disconnect = vi.fn()
  let cleanups: (() => void)[]
  const mountPage = () => {
    const wrapper = mount(PageNavigation)
    cleanups.push(() => wrapper.unmount())
    return wrapper
  }
  const positions = { overview: 0, commands: 500, details: 1000 }
  const flushFrame = (): void => {
    const callbacks = [...pending.values()]
    pending.clear()
    callbacks.forEach(callback => callback(0))
  }

  beforeEach(() => {
    pending = new Map()
    nextFrame = 0
    resized = undefined
    cleanups = []
    disconnect.mockReset()
    positions.overview = 0
    positions.commands = 500
    positions.details = 1000
    document.body.innerHTML = '<main><h1 id="overview">Overview</h1><h2 id="commands">Commands</h2><h2 id="details">Details</h2></main>'
    document.documentElement.style.scrollPaddingTop = '24px'
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000)
    for (const id of ['overview', 'commands', 'details'] as const) {
      const element = document.getElementById(id)
      if (element) vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, positions[id], 200, 40))
    }
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextFrame
      pending.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { pending.delete(id) })
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { resized = callback }
      observe = vi.fn()
      disconnect = disconnect
    })
  })

  afterEach(() => {
    cleanups.forEach(cleanup => cleanup())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.documentElement.style.scrollPaddingTop = ''
  })

  it('keeps an SSR initial value without accessing browser globals', async () => {
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    expect(await renderToString(createSSRApp(PageNavigation, { targetIds: ['overview', 'commands'] }))).toContain('aria-current="location"')
    vi.unstubAllGlobals()
  })

  it('ignores missing IDs and follows the last heading above the CSS inset', async () => {
    const wrapper = mountPage()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('overview')
    positions.commands = 24
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    expect(pending.size).toBe(1)
    flushFrame()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('commands')
    positions.commands = 26
    window.dispatchEvent(new Event('scroll'))
    flushFrame()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('overview')
    wrapper.unmount()
  })

  it('updates after transformed headings and layout changes without scrolling', async () => {
    const wrapper = mountPage()
    positions.commands = 20
    document.body.dispatchEvent(new Event('transitionend'))
    flushFrame()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('commands')
    positions.details = 24
    resized?.([], new ResizeObserver(() => {}))
    flushFrame()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('details')
    wrapper.unmount()
  })

  describe('after a jump to a section', () => {
    // Document offsets; each heading's viewport top follows the mocked scroll position.
    let offsets = { overview: 0, commands: 1300, details: 1700 }
    let scrolled = 0
    const scrollTo = (y: number): void => {
      scrolled = y
      window.dispatchEvent(new Event('scroll'))
      flushFrame()
    }
    const mountAttached = () => {
      const host = document.createElement('div')
      document.body.append(host)
      const wrapper = mount(PageNavigation, { attachTo: host })
      cleanups.push(() => wrapper.unmount())
      return wrapper
    }
    const current = (wrapper: ReturnType<typeof mountAttached>) => wrapper.get('[aria-current="location"]').text()

    beforeEach(() => {
      offsets = { overview: 0, commands: 1300, details: 1700 }
      scrolled = 0
      vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrolled)
      for (const id of ['overview', 'commands', 'details'] as const) {
        const element = document.getElementById(id)
        if (element) vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, offsets[id] - scrolled, 200, 40))
      }
    })

    it('keeps a clicked section current on a page too short to scroll', async () => {
      vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(800)
      offsets.commands = 300
      offsets.details = 600
      const wrapper = mountAttached()
      const details = wrapper.get('a[href="#details"]').element
      // A modified click opens another tab, so this page is not jumping.
      details.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }))
      flushFrame()
      await wrapper.vm.$nextTick()
      expect(current(wrapper)).toBe('overview')
      details.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      flushFrame()
      window.dispatchEvent(new Event('resize'))
      flushFrame()
      await wrapper.vm.$nextTick()
      expect(current(wrapper)).toBe('details')
    })

    it('holds through a smooth scroll to the page bottom and releases when the reader scrolls away', async () => {
      const wrapper = mountAttached()
      wrapper.get('a[href="#commands"]').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      // Commands cannot reach the top: the scroll stops at the bottom, where Details would be marked.
      for (const y of [0, 300, 700, 1000, 1200]) scrollTo(y)
      await wrapper.vm.$nextTick()
      expect(current(wrapper)).toBe('commands')
      scrollTo(1100)
      await wrapper.vm.$nextTick()
      expect(current(wrapper)).toBe('overview')
    })
  })

  it('selects the final section at the document bottom and cleans up queued work', async () => {
    const wrapper = mountPage()
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1200)
    window.dispatchEvent(new Event('pageshow'))
    flushFrame()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[aria-current="location"]').text()).toBe('details')
    window.dispatchEvent(new Event('resize'))
    expect(pending.size).toBe(1)
    wrapper.unmount()
    expect(pending.size).toBe(0)
    expect(disconnect).toHaveBeenCalledOnce()
    window.dispatchEvent(new Event('scroll'))
    document.body.dispatchEvent(new Event('transitionend'))
    expect(pending.size).toBe(0)
  })
})
