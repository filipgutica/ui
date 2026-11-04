<template>
  <figure class="fg-figure">
    <div class="fg-figure__plate">
      <slot />
    </div>
    <figcaption
      v-if="number !== undefined || slots.caption"
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
export interface UiFigureProps {
  number?: number
}

const { number = undefined } = defineProps<UiFigureProps>()

const slots = defineSlots<{
  caption?(): unknown
  default?(): unknown
}>()
</script>
