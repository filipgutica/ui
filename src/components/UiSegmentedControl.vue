<template>
  <div
    ref="root"
    class="fg-segmented"
    role="group"
    :aria-label="label"
    :data-size="size"
    :data-icon-only="iconOnly ? 'true' : undefined"
    @animationend="$event.animationName === 'fg-segmented-slide' && clearSlide()"
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="fg-segmented__item"
      :aria-pressed="modelValue === item.value"
      :aria-label="iconOnly ? item.label : undefined"
      :title="iconOnly ? item.label : undefined"
      :disabled="disabled || item.disabled"
      @click="emit('update:modelValue', item.value)"
    >
      <slot
        name="icon"
        :item="item"
        :pressed="modelValue === item.value"
      />
      <span
        v-if="!iconOnly"
        class="fg-segmented__label"
      >{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import { onMounted, useTemplateRef, watch } from 'vue'

import type { UiControlSize } from '../control.js'

export interface UiSegmentedItem<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface UiSegmentedControlProps<T extends string = string> {
  /** Names the group for assistive technology. */
  label: string
  items: readonly UiSegmentedItem<T>[]
  /** The pressed option. Undefined leaves every option unpressed. */
  modelValue?: T | undefined
  /** Shows only the icon slot; each label becomes the button's accessible name and tooltip. */
  iconOnly?: boolean
  disabled?: boolean
  size?: UiControlSize
}

const {
  label,
  items,
  modelValue = undefined,
  iconOnly = false,
  disabled = false,
  size = 'md',
} = defineProps<UiSegmentedControlProps<T>>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void
}>()

defineSlots<{
  icon?(props: { item: UiSegmentedItem<T>, pressed: boolean }): unknown
}>()

const root = useTemplateRef<HTMLElement>('root')

// A choice set while the page loads, such as a restored appearance, shows at once.
// Slides start only after mount and the first frame, once that has settled.
let canSlide = false
onMounted(() => requestAnimationFrame(() => { canSlide = true }))

const clearSlide = (): void => {
  if (!root.value) return
  delete root.value.dataset.slide
  root.value.style.removeProperty('--fg-segmented-slide-left')
  root.value.style.removeProperty('--fg-segmented-slide-right')
}

/*
 * Each pressed button draws its own thumb in CSS, which also covers server rendering
 * and resizes. A change of choice only starts the new thumb where the old one is, and
 * a CSS animation brings it home while the labels crossfade. The pre flush reads the
 * old thumb before the DOM changes, so no frame shows the thumb already moved.
 */
watch(() => modelValue, (next, previous) => {
  const element = root.value
  if (!element) return
  const buttons = Array.from(element.children).filter(child => child instanceof HTMLElement)
  const from = buttons[items.findIndex(item => item.value === previous)]
  const to = buttons[items.findIndex(item => item.value === next)]
  if (!canSlide || !from || !to || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clearSlide()
    return
  }
  // An interrupted slide starts from where its thumb is now, read before it stops.
  const fromThumb = getComputedStyle(from, '::before')
  const fromRect = from.getBoundingClientRect()
  const fromLeft = fromRect.left + parseFloat(fromThumb.left)
  const fromRight = fromRect.right - parseFloat(fromThumb.right)
  const toRect = to.getBoundingClientRect()
  clearSlide()
  element.style.setProperty('--fg-segmented-slide-left', `${fromLeft - toRect.left}px`)
  element.style.setProperty('--fg-segmented-slide-right', `${toRect.right - fromRight}px`)
  element.dataset.slide = ''
}, { flush: 'pre' })
</script>
