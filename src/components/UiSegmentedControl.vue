<template>
  <div
    ref="root"
    class="fg-segmented"
    role="group"
    :aria-label="label"
    :data-size="size"
    :data-icon-only="iconOnly ? 'true' : undefined"
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
      @animationend="$event.animationName === 'fg-segmented-slide' && clearSlide($event.currentTarget)"
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
import { useTemplateRef, watch } from 'vue'

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

const clearSlide = (target: EventTarget | null): void => {
  if (!(target instanceof HTMLElement)) return
  delete target.dataset.slide
  target.style.removeProperty('--fg-segmented-slide-left')
  target.style.removeProperty('--fg-segmented-slide-right')
}

/*
 * Each pressed button draws its own thumb in CSS, which also covers server rendering
 * and resizes. A change of choice only starts the new thumb where the old one is and
 * lets a CSS animation (and the reduced-motion rule) bring it home. The post flush
 * sets the start before the next paint, so no frame shows the thumb already moved.
 */
watch(() => modelValue, (next, previous) => {
  const buttons = Array.from(root.value?.children ?? []).filter(element => element instanceof HTMLElement)
  const from = buttons[items.findIndex(item => item.value === previous)]
  const to = buttons[items.findIndex(item => item.value === next)]
  if (!from || !to) return
  // An interrupted slide starts from where its thumb is now, read before it stops.
  const fromThumb = getComputedStyle(from, '::before')
  const fromRect = from.getBoundingClientRect()
  const fromLeft = fromRect.left + parseFloat(fromThumb.left)
  const fromRight = fromRect.right - parseFloat(fromThumb.right)
  for (const button of buttons) clearSlide(button)
  const toRect = to.getBoundingClientRect()
  to.style.setProperty('--fg-segmented-slide-left', `${fromLeft - toRect.left}px`)
  to.style.setProperty('--fg-segmented-slide-right', `${toRect.right - fromRight}px`)
  to.dataset.slide = ''
}, { flush: 'post' })
</script>
