<template>
  <ProgressRoot
    class="fg-progress"
    :aria-label="label"
    :max="progress.max"
    :model-value="progress.value"
  >
    <ProgressIndicator
      class="fg-progress__indicator"
      :style="{ transform: `translateX(-${100 - percentage}%)` }"
    />
  </ProgressRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'

const DEFAULT_MAX = 100

export interface UiProgressProps {
  label: string
  max: number
  value: number | null
}

const { label, max, value } = defineProps<UiProgressProps>()

const progress = computed(() => {
  const normalizedMax = Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX
  const normalizedValue = value === null || !Number.isFinite(value)
    ? null
    : Math.min(normalizedMax, Math.max(0, value))

  return {
    max: normalizedMax,
    value: normalizedValue,
  }
})

const percentage = computed(() => progress.value.value === null
  ? 0
  : (progress.value.value / progress.value.max) * 100)
</script>
