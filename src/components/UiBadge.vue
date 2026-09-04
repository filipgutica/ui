<template>
  <Primitive
    as="span"
    class="fg-badge"
    :data-tone="tone"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from 'reka-ui'

export interface UiBadgeProps {
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'
}

const { tone = 'neutral' } = defineProps<UiBadgeProps>()
</script>
