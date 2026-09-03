import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCheckbox,
  UiDialog,
  UiField,
  UiInput,
  UiProgress,
  UiSelect,
  UiSurface,
} from '../src/index.js'

describe('application primitives', () => {
  it('keeps a loading button disabled and exposes its busy state', async () => {
    const wrapper = mount(UiButton, {
      props: { loading: true },
      slots: { default: 'Save changes' },
    })

    await wrapper.trigger('click')

    expect(wrapper.attributes()).toMatchObject({
      'aria-busy': 'true',
      disabled: '',
    })
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('updates text and select models through native form events', async () => {
    const input = mount(UiInput, { props: { modelValue: '' } })
    await input.setValue('agent workbench')
    expect(input.emitted('update:modelValue')).toEqual([['agent workbench']])

    const select = mount(UiSelect, {
      props: { modelValue: 'all' },
      slots: {
        default: '<option value="all">All</option><option value="errors">Errors</option>',
      },
    })
    await select.setValue('errors')
    expect(select.emitted('update:modelValue')).toEqual([['errors']])
  })

  it('provides an accessible field relationship for controls and help text', () => {
    const wrapper = mount({
      components: { UiField, UiInput },
      template: `
        <UiField control-id="theme-search" label="Search themes" description="Search Open VSX by name.">
          <UiInput />
        </UiField>
      `,
    })

    expect(wrapper.get('label').attributes('for')).toBe('theme-search')
    expect(wrapper.get('[data-field-description]').text()).toBe('Search Open VSX by name.')
    expect(wrapper.get('input').attributes()).toMatchObject({
      id: 'theme-search',
      'aria-describedby': 'theme-search-description',
    })

    const invalidWrapper = mount({
      components: { UiField, UiSelect },
      template: `
        <UiField control-id="email" label="Email" error="Enter a valid email address.">
          <UiSelect><option value="">Choose an email</option></UiSelect>
        </UiField>
      `,
    })
    expect(invalidWrapper.get('select').attributes()).toMatchObject({
      id: 'email',
      'aria-errormessage': 'email-error',
      'aria-invalid': 'true',
    })
  })

  it('exposes checkbox state through a boolean model', async () => {
    const wrapper = mount(UiCheckbox, {
      props: { modelValue: false },
      slots: { default: 'Count as a correction' },
    })

    await wrapper.get('[role="checkbox"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.text()).toContain('Count as a correction')
  })

  it('renders semantic surfaces, badges, alerts, and progress hooks', () => {
    const surface = mount(UiSurface, { props: { as: 'article' } })
    expect(surface.element.tagName).toBe('ARTICLE')

    const badge = mount(UiBadge, { props: { tone: 'warning' } })
    expect(badge.attributes('data-tone')).toBe('warning')

    const alert = mount(UiAlert, { props: { tone: 'danger' } })
    expect(alert.attributes()).toMatchObject({ role: 'alert', 'data-tone': 'danger' })

    const errorAlert = mount(UiAlert, { props: { tone: 'error' } })
    expect(errorAlert.attributes()).toMatchObject({ role: 'alert', 'data-tone': 'error' })

    const progress = mount(UiProgress, {
      props: { value: 2, max: 4, label: 'Import progress' },
    })
    expect(progress.get('[role="progressbar"]').attributes()).toMatchObject({
      'aria-label': 'Import progress',
      'aria-valuemax': '4',
      'aria-valuenow': '2',
    })
  })

  it('renders dialog content with an accessible title and close control', async () => {
    const wrapper = mount(UiDialog, {
      attachTo: document.body,
      props: {
        open: true,
        title: 'Evidence',
        description: 'Raw imported source record',
      },
      slots: { default: 'Payload' },
    })
    await wrapper.vm.$nextTick()

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.textContent).toContain('Evidence')
    expect(dialog?.textContent).toContain('Payload')

    const close = document.body.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')
    close?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:open')).toEqual([[false]])

    wrapper.unmount()
  })
})
