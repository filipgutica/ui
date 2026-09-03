<template>
  <Primitive
    as="select"
    class="fg-select"
    :id="id ?? field?.controlId.value"
    :aria-describedby="field?.descriptionId.value"
    :aria-errormessage="field?.errorId.value"
    :aria-invalid="invalid || field?.invalid.value ? 'true' : undefined"
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

import { uiFieldContextKey } from './field-context.js'

export interface UiSelectProps {
  disabled?: boolean
  id?: string
  invalid?: boolean
  modelValue?: string
}

withDefaults(defineProps<UiSelectProps>(), {
  disabled: false,
  invalid: false,
  modelValue: '',
})

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
