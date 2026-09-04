<template>
  <RadioGroupItem
    class="fg-radio-card"
    :disabled="disabled"
    :value="value"
  >
    <span
      class="fg-radio-card__indicator"
      aria-hidden="true"
    />
    <span class="fg-radio-card__content">
      <slot />
    </span>
  </RadioGroupItem>
</template>

<script setup lang="ts">
import { RadioGroupItem } from 'reka-ui'

export interface UiRadioCardProps {
  disabled?: boolean
  value: string
}

const { disabled = false, value } = defineProps<UiRadioCardProps>()
</script>
