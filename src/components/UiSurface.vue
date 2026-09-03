<template>
  <Primitive :as="as" class="fg-surface" :data-padding="padding">
    <slot />
  </Primitive>
</template>

<script setup lang="ts">
import { Primitive } from 'reka-ui'

export interface UiSurfaceProps {
  as?: string
  padding?: 'none' | 'compact' | 'default'
}

withDefaults(defineProps<UiSurfaceProps>(), {
  as: 'section',
  padding: 'default',
})
</script>
