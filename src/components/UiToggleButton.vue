<template>
  <Toggle
    class="fg-toggle-button"
    :data-size="size"
    :disabled="disabled"
    :model-value="pressed"
    @update:model-value="onUpdate"
  >
    <span
      class="fg-toggle-button__switch"
      aria-hidden="true"
    />
    <span class="fg-toggle-button__text">
      <span class="fg-toggle-button__label"><slot /></span>
      <span
        v-if="slots.description"
        class="fg-toggle-button__description"
      ><slot name="description" /></span>
    </span>
  </Toggle>
</template>

<script setup lang="ts">
import { Toggle } from 'reka-ui'

import type { UiControlSize } from '../control.js'

export interface UiToggleButtonProps {
  disabled?: boolean
  pressed?: boolean
  size?: UiControlSize
}

const {
  disabled = false,
  pressed = false,
  size = 'md',
} = defineProps<UiToggleButtonProps>()

const emit = defineEmits<{
  (event: 'update:pressed', value: boolean): void
}>()

const slots = defineSlots<{
  default?(): unknown
  description?(): unknown
}>()

const onUpdate = (value: boolean): void => {
  emit('update:pressed', value)
}
</script>
