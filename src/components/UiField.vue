<template>
  <div
    class="fg-field"
    :data-invalid="error ? 'true' : undefined"
  >
    <label
      class="fg-field__label"
      :for="controlId"
    >{{ label }}</label>
    <slot
      :description-id="descriptionId"
      :error-id="errorId"
    />
    <p
      v-if="description && !error"
      :id="descriptionId"
      class="fg-field__description"
      data-field-description
    >
      {{ description }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      class="fg-field__error"
      data-field-error
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'

import { uiFieldContextKey } from './field-context.js'

export interface UiFieldProps {
  controlId: string
  description?: string
  error?: string
  label: string
}

const {
  controlId,
  description = undefined,
  error = undefined,
  label,
} = defineProps<UiFieldProps>()

defineSlots<{
  default(props: { descriptionId: string | undefined, errorId: string | undefined }): unknown
}>()

const descriptionId = computed(() => description && !error
  ? `${controlId}-description`
  : undefined)
const errorId = computed(() => error ? `${controlId}-error` : undefined)
const invalid = computed(() => Boolean(error))

provide(uiFieldContextKey, {
  controlId: computed(() => controlId),
  descriptionId,
  errorId,
  invalid,
})
</script>
