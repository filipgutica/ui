<template>
  <Primitive
    as="button"
    class="fg-button"
    :data-size="size"
    :data-variant="variant"
    :disabled="disabled"
    :type="type"
  >
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from 'reka-ui'

export interface UiButtonProps {
  disabled?: boolean
  size?: 'default' | 'compact'
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'text'
}

withDefaults(defineProps<UiButtonProps>(), {
  disabled: false,
  size: 'default',
  type: 'button',
  variant: 'primary',
})
</script>
