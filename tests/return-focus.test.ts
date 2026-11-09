import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import UiDialog from '../src/components/UiDialog.vue'
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

describe.each([
  ['UiDialog', UiDialog],
  ['UiDrawer', UiDrawer],
])('%s without a Reka trigger', (_, component) => {
  it('returns focus to the control that opened it', async () => {
    const wrapper = mount({
      components: { Panel: component },
      setup: () => ({ open: ref(false) }),
      template: `
        <div>
          <button type="button" data-opener @click="open = true">Open</button>
          <Panel v-model:open="open" title="Details">Body</Panel>
        </div>
      `,
    }, { attachTo: document.body })

    const opener = wrapper.get('[data-opener]')
    ;(opener.element as HTMLElement).focus()
    await opener.trigger('click')
    await settleDialog()
    expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settleDialog()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(opener.element)
  })
})
