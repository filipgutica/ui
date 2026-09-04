<template>
  <SliderRoot
    v-model="values"
    class="fg-slider"
    :data-size="size"
    :disabled="disabled"
    :max="range.max"
    :min="range.min"
    :step="range.step"
  >
    <SliderTrack class="fg-slider__track">
      <SliderRange class="fg-slider__range" />
    </SliderTrack>
    <SliderThumb
      :id="field?.controlId.value ?? id"
      class="fg-slider__thumb"
      :aria-describedby="field?.descriptionId.value"
      :aria-errormessage="field?.errorId.value"
      :aria-invalid="field?.invalid.value ? 'true' : undefined"
      :aria-label="label"
    />
  </SliderRoot>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

import type { UiControlSize } from '../control.js'

import { uiFieldContextKey } from './field-context.js'

export interface UiSliderProps {
  disabled?: boolean
  id?: string
  label: string
  max?: number
  min?: number
  modelValue?: number
  size?: UiControlSize
  step?: number
}

const {
  disabled = false,
  id = undefined,
  label,
  max = 100,
  min = 0,
  modelValue = undefined,
  size = 'md',
  step = 1,
} = defineProps<UiSliderProps>()

const field = inject(uiFieldContextKey, undefined)

const range = computed(() => {
  const normalizedMin = Number.isFinite(min) ? min : 0
  const normalizedMax = Number.isFinite(max) && max > normalizedMin
    ? max
    : normalizedMin + 100
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 1

  return {
    max: normalizedMax,
    min: normalizedMin,
    step: normalizedStep,
  }
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const values = computed({
  get: () => {
    const value = modelValue !== undefined && Number.isFinite(modelValue)
      ? modelValue
      : range.value.min
    return [Math.min(range.value.max, Math.max(range.value.min, value))]
  },
  set: ([value]: number[]) => {
    if (value !== undefined) emit('update:modelValue', value)
  },
})
</script>
