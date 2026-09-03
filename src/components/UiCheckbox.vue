<template>
  <label class="fg-checkbox" :data-disabled="disabled ? 'true' : undefined">
    <CheckboxRoot
      class="fg-checkbox__control"
      :disabled="disabled"
      :model-value="modelValue"
      @update:model-value="onUpdate"
    >
      <CheckboxIndicator class="fg-checkbox__indicator">✓</CheckboxIndicator>
    </CheckboxRoot>
    <span class="fg-checkbox__label"><slot /></span>
  </label>
</template>

<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'

export interface UiCheckboxProps {
  disabled?: boolean
  modelValue?: boolean
}

withDefaults(defineProps<UiCheckboxProps>(), {
  disabled: false,
  modelValue: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const onUpdate = (value: boolean | 'indeterminate'): void => {
  emit('update:modelValue', value === true)
}
</script>
