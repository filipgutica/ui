import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiDialog,
  UiField,
  UiInput,
  UiProgress,
  UiRadioCard,
  UiRadioCardGroup,
  UiSelect,
  UiSlider,
  UiSurface,
} from '../src/index.js'

describe('application primitives', () => {
  it('uses medium density by default across form controls', () => {
    const controls = [
      mount(UiButton),
      mount(UiInput),
      mount(UiSelect),
      mount(UiCheckbox),
      mount(UiSlider, { props: { label: 'Value' } }),
    ]

    for (const control of controls) {
      expect(control.attributes('data-size')).toBe('md')
    }
  })

  it.each(['sm', 'md', 'lg'] as const)('exposes the %s size hook across form controls', (size) => {
    const controls = [
      mount(UiButton, { props: { size } }),
      mount(UiInput, { props: { size } }),
      mount(UiSelect, { props: { size } }),
      mount(UiCheckbox, { props: { size } }),
      mount(UiSlider, { props: { label: 'Value', size } }),
    ]

    for (const control of controls) {
      expect(control.attributes('data-size')).toBe(size)
    }
  })

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

  it('keeps UiField labels associated when nested controls provide an id', () => {
    const inputWrapper = mount({
      components: { UiField, UiInput },
      template: `
        <UiField control-id="search" label="Search">
          <UiInput id="nested-input" />
        </UiField>
      `,
    })
    expect(inputWrapper.get('label').attributes('for')).toBe('search')
    expect(inputWrapper.get('input').attributes('id')).toBe('search')

    const selectWrapper = mount({
      components: { UiField, UiSelect },
      template: `
        <UiField control-id="status" label="Status">
          <UiSelect id="nested-select"><option value="ready">Ready</option></UiSelect>
        </UiField>
      `,
    })
    expect(selectWrapper.get('label').attributes('for')).toBe('status')
    expect(selectWrapper.get('select').attributes('id')).toBe('status')
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

  it('exposes an accessible radio-card model', async () => {
    const wrapper = mount({
      components: { UiRadioCard, UiRadioCardGroup },
      template: `
        <UiRadioCardGroup v-model="choice" aria-label="Color scheme">
          <UiRadioCard value="system">System</UiRadioCard>
          <UiRadioCard value="light">Light</UiRadioCard>
          <UiRadioCard value="dark" disabled>Dark</UiRadioCard>
        </UiRadioCardGroup>
      `,
      data: () => ({ choice: 'system' }),
    })

    const radios = wrapper.findAll('[role="radio"]')
    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Color scheme')
    expect(radios).toHaveLength(3)
    expect(radios[0]?.attributes('aria-checked')).toBe('true')

    await radios[1]?.trigger('click')
    expect(radios[1]?.attributes('aria-checked')).toBe('true')
    expect(wrapper.vm.choice).toBe('light')

    await radios[1]?.trigger('keydown', { key: 'ArrowLeft' })
    expect(radios[0]?.attributes('aria-checked')).toBe('true')
    expect(wrapper.vm.choice).toBe('system')

    await radios[2]?.trigger('click')
    expect(wrapper.vm.choice).toBe('system')
    expect(radios[2]?.attributes('data-disabled')).toBe('')
  })

  it('renders semantic surfaces, badges, alerts, and progress hooks', () => {
    const surface = mount(UiSurface, { props: { as: 'article' } })
    expect(surface.element.tagName).toBe('ARTICLE')

    const badge = mount(UiBadge, { props: { tone: 'warning' } })
    expect(badge.attributes('data-tone')).toBe('warning')

    const errorBadge = mount(UiBadge, { props: { tone: 'error' } })
    expect(errorBadge.attributes('data-tone')).toBe('error')

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
    expect(progress.get('.fg-progress__indicator').attributes('style')).toContain('translateX(-50%)')
  })

  it.each([
    { name: 'above the maximum', value: 8, max: 4, expectedMax: '4', expectedValue: '4', expectedTransform: 'translateX(-0%)' },
    { name: 'below zero', value: -2, max: 4, expectedMax: '4', expectedValue: '0', expectedTransform: 'translateX(-100%)' },
    { name: 'with a non-positive maximum', value: 25, max: 0, expectedMax: '100', expectedValue: '25', expectedTransform: 'translateX(-75%)' },
    { name: 'with a negative maximum', value: 25, max: -4, expectedMax: '100', expectedValue: '25', expectedTransform: 'translateX(-75%)' },
  ])('normalizes progress values $name for visual and ARIA output', ({ value, max, expectedMax, expectedValue, expectedTransform }) => {
    const progress = mount(UiProgress, {
      props: { value, max, label: 'Import progress' },
    })
    expect(progress.get('[role="progressbar"]').attributes()).toMatchObject({
      'aria-valuemax': expectedMax,
      'aria-valuenow': expectedValue,
    })
    expect(progress.get('.fg-progress__indicator').attributes('style')).toContain(expectedTransform)
  })

  it('keeps indeterminate progress free of a numeric ARIA value', () => {
    const progress = mount(UiProgress, {
      props: { value: null, max: 4, label: 'Import progress' },
    })
    const root = progress.get('[role="progressbar"]')

    expect(root.attributes()).toMatchObject({
      'aria-valuemax': '4',
      'data-state': 'indeterminate',
    })
    expect(root.attributes('aria-valuenow')).toBeUndefined()
    expect(progress.get('.fg-progress__indicator').attributes('style')).toContain('translateX(-100%)')
  })

  it('renders a structured card with title, actions, body, and footer', () => {
    const wrapper = mount(UiCard, {
      props: { title: 'Session summary', titleTag: 'h3' },
      slots: {
        actions: '<button type="button">More</button>',
        default: '12 tool calls across 4 turns.',
        footer: 'Updated just now',
      },
    })

    expect(wrapper.get('h3').text()).toBe('Session summary')
    expect(wrapper.get('.fg-card__actions').text()).toBe('More')
    expect(wrapper.get('.fg-card__body').text()).toContain('12 tool calls')
    expect(wrapper.get('.fg-card__footer').text()).toBe('Updated just now')
  })

  it('exposes a scalar, keyboard-operable slider model', async () => {
    const wrapper = mount(UiSlider, {
      props: { label: 'Progress value', modelValue: 45 },
    })
    await wrapper.vm.$nextTick()
    const thumb = wrapper.get('[role="slider"]')

    expect(thumb.attributes()).toMatchObject({
      'aria-label': 'Progress value',
      'aria-valuenow': '45',
    })

    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')).toEqual([[46]])
  })

  it('keeps slider values within the configured range', async () => {
    const defaulted = mount(UiSlider, {
      props: { label: 'Volume', min: 50 },
    })
    await defaulted.vm.$nextTick()
    expect(defaulted.get('[role="slider"]').attributes('aria-valuenow')).toBe('50')

    const clamped = mount(UiSlider, {
      props: { label: 'Volume', min: 20, max: 80, modelValue: 100 },
    })
    await clamped.vm.$nextTick()
    expect(clamped.get('[role="slider"]').attributes('aria-valuenow')).toBe('80')

    const invalidRange = mount(UiSlider, {
      props: { label: 'Volume', min: 10, max: 10, step: 0, modelValue: Number.POSITIVE_INFINITY },
    })
    await invalidRange.vm.$nextTick()
    expect(invalidRange.get('[role="slider"]').attributes()).toMatchObject({
      'aria-valuemin': '10',
      'aria-valuemax': '110',
      'aria-valuenow': '10',
    })
  })

  it('associates a field label and help text with the slider thumb', async () => {
    const wrapper = mount({
      components: { UiField, UiSlider },
      template: `
        <UiField control-id="threshold" label="Threshold" description="Choose a confidence threshold.">
          <UiSlider id="nested-slider" label="Threshold" />
        </UiField>
      `,
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.get('label').attributes('for')).toBe('threshold')
    expect(wrapper.get('[role="slider"]').attributes()).toMatchObject({
      id: 'threshold',
      'aria-describedby': 'threshold-description',
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
