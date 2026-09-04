<template>
  <Primitive
    as="div"
    class="fg-alert"
    :data-tone="tone"
    :role="tone === 'danger' || tone === 'error' ? 'alert' : 'status'"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from 'reka-ui'

export interface UiAlertProps {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'
}

const { tone = 'neutral' } = defineProps<UiAlertProps>()
</script>
