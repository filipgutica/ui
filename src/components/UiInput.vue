<template>
  <Primitive
    as="input"
    class="fg-input"
    :id="id ?? field?.controlId.value"
    :aria-describedby="field?.descriptionId.value"
    :aria-errormessage="field?.errorId.value"
    :aria-invalid="invalid || field?.invalid.value ? 'true' : undefined"
    :disabled="disabled"
    :type="type"
    :value="modelValue"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Primitive } from 'reka-ui'

import { uiFieldContextKey } from './field-context.js'

export interface UiInputProps {
  disabled?: boolean
  id?: string
  invalid?: boolean
  modelValue?: string
  type?: 'text' | 'search' | 'email' | 'password' | 'url'
}

withDefaults(defineProps<UiInputProps>(), {
  disabled: false,
  invalid: false,
  modelValue: '',
  type: 'text',
})

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
