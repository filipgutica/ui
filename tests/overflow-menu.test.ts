import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import UiOverflowMenu from '../src/components/UiOverflowMenu.vue'

import type { UiOverflowMenuItem } from '../src/components/UiOverflowMenu.vue'

enableAutoUnmount(afterEach)

// Reka moves focus and runs close handlers in macrotasks.
const settle = async () => {
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 0))
  await flushPromises()
}

// The danger item comes first, so the test shows the component moves it last.
const items: UiOverflowMenuItem[] = [
  { id: 'delete', label: 'Delete…', tone: 'danger' },
  { id: 'rename', label: 'Rename' },
  { id: 'export', label: 'Export', disabled: true },
]

const openMenu = async (props: { items?: UiOverflowMenuItem[] } = {}) => {
  const wrapper = mount(UiOverflowMenu, {
    attachTo: document.body,
    props: { label: 'More actions for API latency', items, ...props },
  })
  await wrapper.get('button').trigger('click')
  await settle()
  return wrapper
}

const menuItem = (name: string) => {
  const element = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(item => item.textContent?.trim() === name)
  if (!element) throw new Error(`Missing menu item: ${name}`)
  return element
}

describe('UiOverflowMenu', () => {
  it('renders a named menu button with an SVG icon and no menu until it opens', async () => {
    const wrapper = mount(UiOverflowMenu, { attachTo: document.body, props: { label: 'More actions for API latency', items } })
    const trigger = wrapper.get('button')
    expect(trigger.attributes()).toMatchObject({ 'aria-label': 'More actions for API latency', 'aria-haspopup': 'menu', 'aria-expanded': 'false' })
    expect(trigger.find('svg[aria-hidden="true"]').exists()).toBe(true)
    expect(trigger.text()).toBe('')
    expect(document.querySelector('[role="menu"]')).toBeNull()

    await wrapper.setProps({ disabled: true })
    expect(trigger.attributes('disabled')).toBeDefined()
  })

  it('puts a danger item last, after a separator, and disables a disabled item natively', async () => {
    const wrapper = await openMenu()
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    const rows = [...document.querySelector('[role="menu"]')!.children].map(row =>
      row.getAttribute('role') === 'separator' ? '---' : row.textContent?.trim())
    expect(rows).toEqual(['Rename', 'Export', '---', 'Delete…'])
    expect(menuItem('Delete…').dataset.tone).toBe('danger')
    expect(menuItem('Export').hasAttribute('disabled')).toBe(true)
  })

  it('draws no separator when every item is destructive or none is', async () => {
    for (const only of [[items[0]!], [items[1]!]]) {
      const wrapper = await openMenu({ items: only })
      expect(document.querySelector('[role="separator"]')).toBeNull()
      wrapper.unmount()
      await settle()
    }
  })

  it('emits the selected id after the menu closes', async () => {
    const wrapper = await openMenu()
    menuItem('Delete…').click()
    await settle()
    expect(wrapper.emitted('select')).toEqual([['delete']])
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('emits nothing for a disabled item', async () => {
    const wrapper = await openMenu()
    const exportItem = menuItem('Export')
    exportItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    exportItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await settle()
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(document.querySelector('[role="menu"]')).not.toBeNull()
  })
})
