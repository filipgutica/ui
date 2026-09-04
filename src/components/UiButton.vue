<template>
  <Primitive
    as="button"
    class="fg-button"
    :data-size="size"
    :data-variant="variant"
    :aria-busy="loading ? 'true' : undefined"
    :disabled="disabled || loading"
    :type="type"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from 'reka-ui'

import type { UiControlSize } from '../control.js'

export interface UiButtonProps {
  disabled?: boolean
  loading?: boolean
  size?: UiControlSize | 'compact' | 'default'
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
}

const {
  disabled = false,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
} = defineProps<UiButtonProps>()
</script>
