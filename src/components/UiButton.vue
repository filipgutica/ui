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

export interface UiButtonProps {
  disabled?: boolean
  loading?: boolean
  size?: 'default' | 'compact'
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
}

withDefaults(defineProps<UiButtonProps>(), {
  disabled: false,
  loading: false,
  size: 'default',
  type: 'button',
  variant: 'primary',
})
</script>
