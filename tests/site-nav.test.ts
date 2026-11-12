import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, h, nextTick } from 'vue'

import { UiSiteHeader, UiSiteNav } from '../src/site/index.js'
import type { UiSiteNavGroup } from '../src/site/index.js'

const groups: readonly UiSiteNavGroup[] = [
  {
    items: [
      { label: 'Install', href: '#install' },
      { label: 'Commands', href: '#commands' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'wtree ui', href: '/cli/ui', current: true, code: true },
      { label: 'Guide', href: '/guide' },
    ],
  },
]

const settleDialog = async () => {
  await flushPromises()
  // Reka registers outside-pointer listeners and cleans up focus in a macrotask.
  await new Promise(resolve => setTimeout(resolve, 0))
}

const mockViewport = ({ mobile }: { mobile: boolean }) => {
  // Listeners get a change event, as VueUse's media queries in the site header read one.
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const media = {
    get matches() { return mobile },
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.delete(listener),
  }
  vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList)
  return {
    resize: ({ mobile: next }: { mobile: boolean }) => {
      mobile = next
      listeners.forEach(listener => listener({ matches: mobile }))
    },
  }
}

const mountNav = async () => {
  const wrapper = mount(UiSiteNav, { attachTo: document.body, props: { label: 'On this page', groups } })
  await nextTick()
  return wrapper
}

afterEach(async () => {
  await settleDialog()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})
// Hooks run in reverse order, so components unmount before the page is cleared.
enableAutoUnmount(afterEach)

describe('UiSiteNav', () => {
  it('renders a labelled native menu with page, location, and code markers without scripts', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp({ render: () => h(UiSiteNav, { label: 'On this page', groups }) }))

    const nav = container.querySelector('nav')
    expect(container.querySelector('details:not([open]) > summary')?.textContent?.trim()).toBe('On this page: wtree ui')
    expect(container.querySelector(`[id="${nav?.getAttribute('aria-labelledby')}"]`)?.textContent?.trim()).toBe('On this page')
    expect(container.querySelector('[aria-current="location"]')?.getAttribute('href')).toBe('#install')
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe('/cli/ui')
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(2)
    expect(container.querySelector('a[href="/cli/ui"] > code')?.textContent).toBe('wtree ui')
    expect(container.querySelector('a[href="/guide"] code')).toBeNull()
    const group = container.querySelector('[role="group"]')
    expect(container.querySelector(`[id="${group?.getAttribute('aria-labelledby')}"]`)?.textContent).toBe('Reference')
  })

  it('hydrates the server markup without mismatches and opens the desktop rail', async () => {
    mockViewport({ mobile: false })
    const app = () => createSSRApp({ render: () => h(UiSiteNav, { label: 'On this page', groups }) })
    const container = document.body.appendChild(document.createElement('div'))
    container.innerHTML = await renderToString(app())
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const hydrated = app()
    hydrated.mount(container)
    await nextTick()

    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(container.querySelector('details')?.open).toBe(true)
    hydrated.unmount()
  })

  it('opens the rail on desktop and replaces it with a drawer trigger on phones', async () => {
    const viewport = mockViewport({ mobile: false })
    const wrapper = await mountNav()

    expect(wrapper.get('details').attributes('open')).toBeDefined()
    expect(wrapper.find('button').exists()).toBe(false)

    const link = wrapper.get<HTMLAnchorElement>('a[href="#install"]').element
    link.focus()
    viewport.resize({ mobile: true })
    await nextTick()
    await nextTick()

    expect(wrapper.find('details').exists()).toBe(false)
    const trigger = wrapper.get('button')
    expect(trigger.text()).toBe('On this page: wtree ui')
    expect(document.activeElement).toBe(trigger.element)

    // Back on desktop, focus moves from the trigger to the rail's first row.
    viewport.resize({ mobile: false })
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(wrapper.get('.fg-site-nav a').element)
  })

  it('closes the drawer on navigation and focuses the destination section', async () => {
    mockViewport({ mobile: true })
    const destination = document.body.appendChild(document.createElement('h2'))
    destination.id = 'commands'
    const wrapper = await mountNav()

    await wrapper.get('button').trigger('click')
    await settleDialog()
    const dialog = document.querySelector('[role="dialog"]')
    const link = dialog?.querySelector<HTMLAnchorElement>('a[href="#commands"]')
    expect(link).toBeTruthy()
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    await settleDialog()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(destination)
    expect(destination.tabIndex).toBe(-1)
  })

  it('stops tracking a Find field once the drawer that held it closes', async () => {
    const viewport = mockViewport({ mobile: false })
    const wrapper = mount(UiSiteNav, { attachTo: document.body, props: { label: 'On this page', groups, find: { label: 'Find a section' } } })
    await nextTick()
    viewport.resize({ mobile: true })
    await nextTick()

    for (let round = 0; round < 4; round += 1) {
      await wrapper.get('button').trigger('click')
      await settleDialog()
      expect(document.querySelector('[role="dialog"] .fg-site-find__input')).not.toBeNull()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await settleDialog()
      expect(document.querySelector('[role="dialog"]')).toBeNull()
    }

    // The component's own record of its fields, read through the test instance, not a public API.
    const { findFields } = wrapper.vm as unknown as { findFields: Iterable<HTMLInputElement> | Map<string, HTMLInputElement> }
    const tracked = findFields instanceof Map ? [...findFields.values()] : [...findFields]
    expect(tracked.length).toBeLessThanOrEqual(2)
    expect(tracked.every(field => field.isConnected)).toBe(true)
  })
})

describe('UiSiteNav with headerMenu', () => {
  it('keeps every row in place without scripts, with no disclosure to open', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp({ render: () => h(UiSiteNav, { label: 'On this page', groups, headerMenu: true }) }))

    expect(container.querySelector('details')?.hasAttribute('open')).toBe(true)
    expect(container.querySelector('.fg-site-rail')?.hasAttribute('data-header-menu')).toBe(true)
  })

  it('shows the labelled trigger on phones and puts nothing in the site header', async () => {
    mockViewport({ mobile: true })
    const container = document.body.appendChild(document.createElement('div'))
    const app = createApp({
      render: () => [
        h(UiSiteHeader, { project: 'ui', links: [{ label: 'Guide', href: '#guide' }] }),
        h(UiSiteNav, { label: 'On this page', groups, headerMenu: true, find: { label: 'Find a section' } }),
      ],
    })
    app.mount(container)
    await nextTick()
    await nextTick()

    expect(container.querySelector('.fg-site-rail button.fg-site-rail__toggle')?.textContent?.trim()).toBe('On this page: wtree ui')
    expect(container.querySelectorAll('.fg-site-header button:not(.fg-segmented__item)')).toHaveLength(0)
    app.unmount()
  })
})
