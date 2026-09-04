<template>
  <Primitive
    :id="field?.controlId.value ?? id"
    as="select"
    class="fg-select"
    :aria-describedby="field?.descriptionId.value"
    :aria-errormessage="field?.errorId.value"
    :aria-invalid="invalid || field?.invalid.value ? 'true' : undefined"
    :data-size="size"
    :disabled="disabled"
    :value="modelValue"
    @change="onChange"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Primitive } from 'reka-ui'

import type { UiControlSize } from '../control.js'
import { uiFieldContextKey } from './field-context.js'

export interface UiSelectProps {
  disabled?: boolean
  id?: string
  invalid?: boolean
  modelValue?: string
  size?: UiControlSize
}

const {
  disabled = false,
  id = undefined,
  invalid = false,
  modelValue = '',
  size = 'md',
} = defineProps<UiSelectProps>()

const field = inject(uiFieldContextKey, undefined)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const onChange = (event: Event): void => {
  if (event.currentTarget instanceof HTMLSelectElement) {
    emit('update:modelValue', event.currentTarget.value)
  }
}
</script>
