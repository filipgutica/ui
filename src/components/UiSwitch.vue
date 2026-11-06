<template>
  <div
    class="fg-switch"
    :data-size="size"
    :data-disabled="disabled ? 'true' : undefined"
  >
    <button
      v-bind="attrs"
      :id="controlId"
      class="fg-switch__control"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-describedby="describedBy()"
      :aria-errormessage="field?.errorId.value"
      :aria-invalid="field?.invalid.value ? 'true' : undefined"
      :disabled="disabled"
      @click="onToggle"
    >
      <span
        class="fg-switch__track"
        aria-hidden="true"
      />
    </button>
    <span
      v-if="slots.default || label || description"
      class="fg-switch__text"
    >
      <label
        v-if="slots.default || label"
        :for="controlId"
      >
        <slot>{{ label }}</slot>
      </label>
      <span
        v-if="description"
        :id="descriptionId"
        class="fg-switch__description"
      >
        {{ description }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useAttrs, useId } from 'vue'

import type { UiControlSize } from '../control.js'
import { uiFieldContextKey } from './field-context.js'

export interface UiSwitchProps {
  description?: string
  disabled?: boolean
  id?: string
  label?: string
  modelValue?: boolean
  size?: UiControlSize
}

defineOptions({ inheritAttrs: false })

const {
  description = undefined,
  disabled = false,
  id = undefined,
  label = undefined,
  modelValue = false,
  size = 'md',
} = defineProps<UiSwitchProps>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const slots = defineSlots<{ default?(): unknown }>()
const attrs = useAttrs()
const field = inject(uiFieldContextKey, undefined)
const generatedId = useId()
const controlId = computed(() => field?.controlId.value ?? id ?? generatedId)
const descriptionId = computed(() => `${controlId.value}-switch-description`)
// Read fallthrough attributes during render so externally supplied help stays reactive.
const describedBy = (): string | undefined => [
  attrs['aria-describedby'],
  field?.descriptionId.value,
  description ? descriptionId.value : undefined,
].filter(Boolean).join(' ') || undefined

const onToggle = (): void => {
  if (!disabled) emit('update:modelValue', !modelValue)
}
</script>
