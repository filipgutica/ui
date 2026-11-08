<template>
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
</template>

<script setup lang="ts">
import UiCodeBlock from './UiCodeBlock.vue'

export interface UiExampleProps {
  code: string
  language?: string
}

const { code, language = 'text' } = defineProps<UiExampleProps>()

defineSlots<{ default?(): unknown }>()
</script>
