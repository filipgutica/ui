import { mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import { SITE_APPEARANCE_KEY, SITE_PROJECTS, UiSiteHeader } from '../src/site/index.js'

const links = [
  { label: 'User guide', href: 'https://example.test/guide' },
  { label: 'Releases', href: 'https://example.test/releases' },
]

const mountHeader = async (slots?: Record<string, () => unknown>) => {
  const wrapper = mount(UiSiteHeader, {
    attachTo: document.body,
    props: { project: 'wtree', links },
    ...(slots ? { slots } : {}),
  })
  await nextTick()
  const menu = wrapper.get<HTMLDetailsElement>('details').element
  const trigger = wrapper.get<HTMLElement>('summary').element
  return { wrapper, menu, trigger }
}

describe('site header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.classList.remove('dark')
    delete document.documentElement.dataset.theme
  })

  it('renders the project menu and page links without scripts', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(UiSiteHeader, { project: 'devps', links }) }))

    for (const project of SITE_PROJECTS) {
      expect(html).toContain(`href="${project.href}"`)
    }
    expect(html).toMatch(/aria-current="page"[^>]*>devps</)
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    for (const link of links) {
      expect(html).toContain(`href="${link.href}"`)
    }
    expect(html).not.toContain('aria-label="Color theme"')
  })

  it('updates its identity when the current project changes', async () => {
    const { wrapper } = await mountHeader()
    await wrapper.setProps({ project: 'devps' })
    expect(wrapper.get('summary').attributes('aria-label')).toBe('Project: devps')
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('devps')
    wrapper.unmount()
  })

  it('shows the shared picker after mount and writes the shared choice', async () => {
    localStorage.setItem(SITE_APPEARANCE_KEY, 'light')
    const { wrapper } = await mountHeader()
    const picker = wrapper.get('[aria-label="Color theme"]')

    expect(picker.findAll('button').map(button => button.attributes('aria-label'))).toEqual(['System theme', 'Light theme', 'Dark theme'])
    expect(picker.get('[aria-label="Light theme"]').attributes('aria-pressed')).toBe('true')

    await picker.get('[aria-label="Dark theme"]').trigger('click')
    expect(picker.get('[aria-label="Dark theme"]').attributes('aria-pressed')).toBe('true')
    expect(picker.get('[aria-label="Light theme"]').attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem(SITE_APPEARANCE_KEY)).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    wrapper.unmount()
  })

  it('lets a page replace the picker with its own appearance control', async () => {
    const { wrapper } = await mountHeader({ default: () => h('button', { type: 'button' }, 'Theme: Custom') })

    expect(wrapper.find('[aria-label="Color theme"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Theme: Custom')
    wrapper.unmount()
  })

  it('closes the project menu with Escape and returns focus to its trigger', async () => {
    const { wrapper, menu, trigger } = await mountHeader()
    menu.open = true
    const current = wrapper.get<HTMLAnchorElement>('a[aria-current="page"]').element
    current.focus()

    current.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(menu.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('closes the project menu when focus moves outside it or a click lands elsewhere', async () => {
    const { wrapper, menu } = await mountHeader()
    const inside = wrapper.get<HTMLAnchorElement>('nav a').element
    const outside = document.body.appendChild(document.createElement('button'))

    menu.open = true
    inside.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: wrapper.findAll<HTMLAnchorElement>('nav a')[1]?.element ?? null }))
    expect(menu.open).toBe(true)

    inside.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    expect(menu.open).toBe(false)

    menu.open = true
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(menu.open).toBe(false)
    wrapper.unmount()
  })
})
