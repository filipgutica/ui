<template>
  <ProgressRoot
    class="fg-progress"
    :aria-label="label"
    :max="max"
    :model-value="value"
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

export interface UiProgressProps {
  label: string
  max: number
  value: number | null
}

const props = defineProps<UiProgressProps>()

const percentage = computed(() => props.value === null || props.max <= 0
  ? 0
  : Math.min(100, Math.max(0, (props.value / props.max) * 100)))
</script>
