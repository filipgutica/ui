import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import UiDrawer from '../src/components/UiDrawer.vue'

enableAutoUnmount(afterEach)

const settleDialog = async () => {
  await flushPromises()
  // Reka registers outside-pointer listeners and cleans up focus in a macrotask.
  await new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(async () => {
  await settleDialog()
})

const getElement = (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector)
  if (!element) throw new Error(`Missing element: ${selector}`)
  return element
}

const createDrawer = ({ closeAutoFocus }: { closeAutoFocus?: (event: Event) => void } = {}) => mount({
  components: { UiDrawer },
  setup() {
    const open = ref(false)
    return { open, closeAutoFocus }
  },
  template: `
    <div>
      <h2 id="destination" tabindex="-1">Overview</h2>
      <UiDrawer v-model:open="open" title="Navigation" data-panel="navigation"
        @close-auto-focus="closeAutoFocus?.($event)">
        <template #trigger><button type="button" data-trigger>Open navigation</button></template>
        <a href="#destination" @click="open = false">Overview</a>
        <button type="button" data-last>Last action</button>
      </UiDrawer>
    </div>
  `,
}, { attachTo: document.body })

const openDrawer = async (wrapper: ReturnType<typeof createDrawer>) => {
  const trigger = wrapper.get('[data-trigger]')
  getElement('[data-trigger]').focus()
  await trigger.trigger('click')
  await settleDialog()
}

describe('UiDrawer', () => {
  it('requests state changes without overriding the controlled open prop', async () => {
    const wrapper = mount(UiDrawer, {
      attachTo: document.body,
      props: { open: false, title: 'Navigation' },
      slots: { trigger: '<button type="button">Open navigation</button>', default: 'Links' },
    })

    await wrapper.get('button').trigger('click')
    await settleDialog()

    expect(wrapper.emitted('update:open')).toEqual([[true]])
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('labels the modal, forwards content attributes, and restores focus after close', async () => {
    const wrapper = createDrawer()
    await openDrawer(wrapper)

    const dialog = getElement('[role="dialog"]')
    const titleId = dialog.getAttribute('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(document.getElementById(titleId ?? '')?.textContent?.trim()).toBe('Navigation')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-describedby')).toBeNull()
    expect(dialog.getAttribute('data-panel')).toBe('navigation')
    expect(wrapper.get('[data-trigger]').attributes('aria-controls')).toBe(dialog.id)
    expect(dialog.contains(document.activeElement)).toBe(true)

    getElement('[aria-label="Close drawer"]').click()
    await settleDialog()

    expect(wrapper.vm.open).toBe(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(getElement('[data-trigger]'))
  })

  it('contains focus and wraps Tab and Shift+Tab at the drawer edges', async () => {
    const wrapper = createDrawer()
    await openDrawer(wrapper)

    const first = getElement('[aria-label="Close drawer"]')
    const last = getElement('[data-last]')
    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(first)

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)

    getElement('#destination').focus()
    expect(document.activeElement).toBe(last)
    expect(wrapper.vm.open).toBe(true)
  })

  it.each(['Escape', 'backdrop'] as const)('dismisses with %s and returns focus to the trigger', async (dismissal) => {
    const wrapper = createDrawer()
    await openDrawer(wrapper)

    if (dismissal === 'Escape') {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    } else {
      getElement('.fg-drawer__overlay').dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true, pointerType: 'mouse', button: 0,
      }))
    }
    await settleDialog()

    expect(wrapper.vm.open).toBe(false)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(getElement('[data-trigger]'))
  })

  it('allows navigation to cancel trigger autofocus and focus its destination', async () => {
    const closeAutoFocus = vi.fn((event: Event) => {
      event.preventDefault()
      getElement('#destination').focus()
    })
    const wrapper = createDrawer({ closeAutoFocus })
    await openDrawer(wrapper)

    getElement('a[href="#destination"]').click()
    await settleDialog()

    expect(wrapper.vm.open).toBe(false)
    expect(closeAutoFocus).toHaveBeenCalledOnce()
    expect(closeAutoFocus.mock.calls[0]?.[0].cancelable).toBe(true)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(getElement('#destination'))
  })
})
