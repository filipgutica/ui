import { flushPromises, mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'

import { UiCommandList } from '../src/site/index.js'
import type { UiCommandItem } from '../src/site/index.js'

const items: readonly UiCommandItem[] = [
  { command: 'wtree ui', description: 'Browse worktrees.' },
  { command: 'wtree clean --dry-run', description: 'Print the cleanup plan.' },
]

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('UiCommandList', () => {
  it('renders a labelled command table and adds copy buttons only once interactive', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp({ render: () => h(UiCommandList, { items }) }))

    expect([...container.querySelectorAll('th')].map(cell => cell.textContent?.trim())).toEqual(['Command', 'What it does'])
    expect([...container.querySelectorAll('tbody code')].map(code => code.textContent)).toEqual(['wtree ui', 'wtree clean --dry-run'])
    expect(container.querySelector('button')).toBeNull()

    const wrapper = mount(UiCommandList, { props: { items } })
    await flushPromises()
    expect(wrapper.findAll('button').map(button => button.attributes('aria-label'))).toEqual(['Copy wtree ui', 'Copy wtree clean --dry-run'])
  })

  it('accepts custom headers, rich commands and descriptions, and no copy column', () => {
    const wrapper = mount(UiCommandList, {
      props: { items, copyable: false, commandHeader: 'Key', descriptionHeader: 'Action' },
      slots: {
        command: ({ item }: { item: UiCommandItem }) => h('kbd', item.command),
        description: ({ item }: { item: UiCommandItem }) => h('span', [h('kbd', 'q'), ` ${item.command}`]),
      },
    })

    expect(wrapper.findAll('th').map(cell => cell.text())).toEqual(['Key', 'Action'])
    expect(wrapper.findAll('tbody tr td:first-child kbd').map(key => key.text())).toEqual(['wtree ui', 'wtree clean --dry-run'])
    expect(wrapper.find('tbody tr td:first-child code').exists()).toBe(false)
    expect(wrapper.get('tbody tr td:nth-child(2) kbd').text()).toBe('q')
    expect(wrapper.findAll('tbody tr')[0]?.findAll('td')).toHaveLength(2)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('copies a row command and announces it', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const wrapper = mount(UiCommandList, { props: { items } })
    await flushPromises()

    await wrapper.get('[aria-label="Copy wtree clean --dry-run"]').trigger('click')
    await flushPromises()

    expect(write).toHaveBeenCalledWith('wtree clean --dry-run')
    const status = wrapper.get('[role="status"]')
    expect(status.text()).toBe('wtree clean --dry-run copied to clipboard.')
    expect(status.classes()).toContain('fg-site-sr-only')
    expect(wrapper.get('[aria-label="Copy wtree clean --dry-run"] path').attributes('d')).toBe('m5 12 4 4L19 6')
    expect(wrapper.find('[aria-label="Copy wtree ui"] rect').exists()).toBe(true)
  })

  it('shows a visible fallback when copying fails', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    const wrapper = mount(UiCommandList, { props: { items } })
    await flushPromises()

    await wrapper.get('[aria-label="Copy wtree ui"]').trigger('click')
    await flushPromises()

    const status = wrapper.get('[role="status"]')
    expect(status.text()).toBe('Could not copy. Select the command to copy it.')
    expect(status.classes()).not.toContain('fg-site-sr-only')
    expect(wrapper.find('path[d="m5 12 4 4L19 6"]').exists()).toBe(false)
  })
})
