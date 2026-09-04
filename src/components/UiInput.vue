<template>
  <Primitive
    :id="field?.controlId.value ?? id"
    as="input"
    class="fg-input"
    :aria-describedby="field?.descriptionId.value"
    :aria-errormessage="field?.errorId.value"
    :aria-invalid="invalid || field?.invalid.value ? 'true' : undefined"
    :data-size="size"
    :disabled="disabled"
    :type="type"
    :value="modelValue"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Primitive } from 'reka-ui'

import type { UiControlSize } from '../control.js'
import { uiFieldContextKey } from './field-context.js'

export interface UiInputProps {
  disabled?: boolean
  id?: string
  invalid?: boolean
  modelValue?: string
  size?: UiControlSize
  type?: 'text' | 'search' | 'email' | 'password' | 'url'
}

const {
  disabled = false,
  id = undefined,
  invalid = false,
  modelValue = '',
  size = 'md',
  type = 'text',
} = defineProps<UiInputProps>()

const field = inject(uiFieldContextKey, undefined)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event): void => {
  if (event.currentTarget instanceof HTMLInputElement) {
    emit('update:modelValue', event.currentTarget.value)
  }
}
</script>
