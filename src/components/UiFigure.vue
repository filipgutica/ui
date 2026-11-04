<template>
  <figure class="fg-figure">
    <!-- Focusable so keyboard users can scroll wide content that has no focusable child. -->
    <div
      class="fg-figure__plate"
      role="region"
      tabindex="0"
      :aria-labelledby="hasCaption() ? captionId : undefined"
      :aria-label="hasCaption() ? undefined : 'Figure'"
    >
      <slot />
    </div>
    <figcaption
      v-if="hasCaption()"
      :id="captionId"
      class="fg-figure__caption"
    >
      <span
        v-if="number !== undefined"
        class="fg-figure__number"
      >Figure {{ number }}.</span> <slot name="caption" />
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { useId } from 'vue'

export interface UiFigureProps {
  number?: number
}

const { number = undefined } = defineProps<UiFigureProps>()

const slots = defineSlots<{
  caption?(): unknown
  default?(): unknown
}>()

const captionId = useId()
// A function, not a constant: the render must re-read the number and slots.
const hasCaption = (): boolean => number !== undefined || Boolean(slots.caption)
</script>
