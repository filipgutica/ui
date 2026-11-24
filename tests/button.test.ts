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

  it('marks only an icon-only button with data-icon-only, which the CSS matches by presence', () => {
    expect(mount(UiButton).attributes()).not.toHaveProperty('data-icon-only')
    for (const variant of ['primary', 'secondary', 'danger'] as const) {
      expect(mount(UiButton, { props: { iconOnly: true, variant } }).attributes('data-icon-only'), variant).toBe('true')
    }
  })

  it.each(['ghost', 'text'] as const)('gives a %s button no icon-only form', (variant) => {
    expect(mount(UiButton, { props: { iconOnly: true, variant } }).attributes()).not.toHaveProperty('data-icon-only')
  })

  it('marks a loading icon-only button busy and disabled, so the CSS shows the spinner in place of the icon', () => {
    const wrapper = mount(UiButton, { props: { iconOnly: true, loading: true }, attrs: { 'aria-label': 'Send' } })
    expect(wrapper.attributes()).toMatchObject({ 'data-icon-only': 'true', 'aria-busy': 'true', 'aria-label': 'Send' })
    expect(wrapper.attributes('disabled')).toBeDefined()
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
