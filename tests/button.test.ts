import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { UiButton } from '../src/index.js'

describe('UiButton', () => {
  it('renders an accessible button with stable variant and size hooks', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'secondary', size: 'sm' },
      slots: { default: 'Inspect evidence' },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes()).toMatchObject({
      type: 'button',
      'data-variant': 'secondary',
      'data-size': 'sm',
    })
    expect(wrapper.text()).toBe('Inspect evidence')
  })

  it('forwards native disabled behavior', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true } })

    await wrapper.trigger('click')

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it.each(['compact', 'default'] as const)('retains the legacy %s size hook', (size) => {
    const wrapper = mount(UiButton, { props: { size } })

    expect(wrapper.attributes('data-size')).toBe(size)
  })
})
