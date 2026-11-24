<template>
  <Primitive
    as="button"
    class="fg-button"
    :data-size="size"
    :data-variant="variant"
    :data-icon-only="iconOnly ? 'true' : undefined"
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
  /**
   * Draws the button as a circle that holds one icon and no text. Give it an `aria-label`.
   * Only primary, secondary, and danger have an icon-only form. A see-through lone icon is a
   * quiet action (`fg-quiet-action`), not a ghost or text button.
   */
  iconOnly?: boolean
  loading?: boolean
  size?: UiControlSize | 'compact' | 'default'
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
}

const {
  disabled = false,
  iconOnly = false,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
} = defineProps<UiButtonProps>()
</script>
