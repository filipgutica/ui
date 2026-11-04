<template>
  <span class="fg-score">
    <span
      class="fg-score__pips"
      aria-hidden="true"
    >
      <span
        v-for="index in display.max"
        :key="index"
        class="fg-score__pip"
        :data-filled="index <= display.score ? 'true' : undefined"
      />
    </span>
    <span class="fg-score__value">{{ display.score }}<span class="fg-score__max">/{{ display.max }}</span></span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const DEFAULT_MAX = 3

export interface UiScoreProps {
  max?: number
  score: number
}

const { max = DEFAULT_MAX, score } = defineProps<UiScoreProps>()

const display = computed(() => {
  const normalizedMax = Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX
  const normalizedScore = Number.isFinite(score)
    ? Math.min(normalizedMax, Math.max(0, score))
    : 0

  return { max: normalizedMax, score: normalizedScore }
})
</script>
