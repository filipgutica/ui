import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'

import UiTabs from '../src/components/UiTabs.vue'

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'logs', label: 'Logs' },
  { value: 'details', label: 'Details' },
] as const

const createExample = () => defineComponent({
  setup() {
    const value = ref('overview')
    const content = ref<Record<string, string>>(Object.fromEntries(items.map(item => [item.value, `${item.value} content`])))
    return () => h(UiTabs, {
      items,
      label: 'Process captures',
      modelValue: value.value,
      'onUpdate:modelValue': (next: string) => { value.value = next },
    }, {
      panel: ({ value: panel }: { value: string }) => h('input', {
        value: content.value[panel],
        onInput: (event: Event) => {
          if (event.target instanceof HTMLInputElement) content.value[panel] = event.target.value
        },
      }),
    })
  },
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('UiTabs', () => {
  it('renders every labelled panel without tab semantics or hidden content on the server', async () => {
    const html = await renderToString(createSSRApp(createExample()))
    const container = document.createElement('div')
    container.innerHTML = html

    expect(container.querySelector('[role="tablist"]')).toBeNull()
    expect(container.querySelector('[role="tabpanel"]')).toBeNull()
    expect(container.querySelector('[hidden]')).toBeNull()
    expect([...container.querySelectorAll('h3')].map(node => node.textContent)).toEqual(items.map(item => item.label))
    expect(container.querySelectorAll('input')).toHaveLength(3)
    for (const section of container.querySelectorAll('section')) {
      expect(section.querySelector('h3')?.id).toBe(section.getAttribute('aria-labelledby'))
    }
  })

  it('hydrates without mismatches or replacing panel content, then enhances tab semantics', async () => {
    const example = createExample()
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(example))
    document.body.append(container)
    const originalInput = container.querySelector('input')
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const app = createSSRApp(example)
    app.mount(container)
    await nextTick()

    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(container.querySelector('input')).toBe(originalInput)
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3)
    expect(container.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Process captures')
    expect(container.querySelectorAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1)
    for (const tab of container.querySelectorAll('[role="tab"]')) {
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '')
      expect(panel?.getAttribute('aria-labelledby')).toBe(tab.id)
    }
    app.unmount()
  })

  it('updates controlled selection and retains inactive panel state', async () => {
    const wrapper = mount(createExample(), { attachTo: document.body })
    await nextTick()
    const inputs = wrapper.findAll('input')
    await inputs[0]?.setValue('edited content')
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')

    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    expect(tabs[1]?.attributes('aria-selected')).toBe('true')
    expect(tabs.map(tab => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(wrapper.findAll('[role="tabpanel"]')[0]?.attributes('hidden')).toBeDefined()
    await tabs[0]?.trigger('click')
    expect(wrapper.findAll('input')[0]?.element).toBe(inputs[0]?.element)
    expect(inputs[0]?.element.value).toBe('edited content')
    wrapper.unmount()
  })

  it('automatically selects focused tabs with wrapping arrows and Home/End', async () => {
    const wrapper = mount(createExample(), { attachTo: document.body })
    await nextTick()
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[0]?.element.focus()
    for (const [index, key, expected] of [
      [0, 'ArrowLeft', 2],
      [2, 'ArrowRight', 0],
      [0, 'ArrowRight', 1],
      [1, 'End', 2],
      [2, 'Home', 0],
    ] as const) {
      await tabs[index]?.trigger('keydown', { key })
      expect(document.activeElement).toBe(tabs[expected]?.element)
      expect(tabs[expected]?.attributes('aria-selected')).toBe('true')
    }
    wrapper.unmount()
  })

  it('respects right-to-left direction and leaves modified arrows alone', async () => {
    const wrapper = mount(createExample(), { attachTo: document.body })
    await nextTick()
    wrapper.get<HTMLDivElement>('[role="tablist"]').element.style.direction = 'rtl'
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
    tabs[0]?.element.focus()
    await tabs[0]?.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tabs[1]?.element)
    await tabs[1]?.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
    expect(document.activeElement).toBe(tabs[1]?.element)
    wrapper.unmount()
  })

  it('retains a keyboard entry point if the selected item is removed', async () => {
    const wrapper = mount(UiTabs, { props: { items, label: 'Captures', modelValue: 'logs' } })
    await nextTick()
    await wrapper.setProps({ items: [items[0], items[2]] })
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.attributes('tabindex'))).toEqual(['0', '-1'])
    expect(wrapper.find('[role="tab"]').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })
})
