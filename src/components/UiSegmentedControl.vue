<template>
  <div
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
  modelValue?: T
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
</script>
