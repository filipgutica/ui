<template>
  <figure
    v-if="$slots.caption"
    class="fg-figure"
  >
    <div class="fg-example">
      <div class="fg-example__stage">
        <slot />
      </div>
      <UiCodeBlock
        :code="code"
        :language="language"
        variant="embedded"
      />
    </div>
    <figcaption class="fg-figure__caption">
      <slot name="caption" />
    </figcaption>
  </figure>
  <figure
    v-else
    class="fg-example"
  >
    <div class="fg-example__stage">
      <slot />
    </div>
    <UiCodeBlock
      :code="code"
      :language="language"
      variant="embedded"
    />
  </figure>
</template>

<script setup lang="ts">
import UiCodeBlock from './UiCodeBlock.vue'

export interface UiExampleProps {
  code: string
  language?: string
}

const { code, language = 'text' } = defineProps<UiExampleProps>()

// Without a caption the root figure is the frame. A caption follows the frame, as a figure
// caption does, so with one the frame moves inside a UiFigure-style figure.
defineSlots<{
  caption?(): unknown
  default?(): unknown
}>()
</script>
