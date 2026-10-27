<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const { html, label, fit } = defineProps<{
  html: string
  label: string
  /** Scales the capture down to the available width instead of scrolling it. */
  fit: boolean
}>()

const container = ref<HTMLElement>()
const scale = ref(1)
const height = ref<number>()
let observer: ResizeObserver | undefined

const measure = (): void => {
  if (!fit) {
    height.value = undefined
    scale.value = 1
    return
  }
  const screen = container.value
  const capture = screen?.firstElementChild
  // Hidden tabs measure zero; the observer runs again when the tab is shown.
  if (!screen?.clientWidth || !(capture instanceof HTMLElement) || !capture.offsetWidth) return
  scale.value = Math.min(1, screen.clientWidth / capture.offsetWidth)
  height.value = Math.ceil(capture.offsetHeight * scale.value) + screen.offsetHeight - screen.clientHeight
}

// The observer watches the screen, whose height this sets, so new markup is remeasured here.
watch(() => [fit, html], measure, { flush: 'post' })
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (container.value) observer.observe(container.value)
  }
  measure()
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <!-- The HTML is trusted, checked-in terminal markup supplied by the site. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    ref="container"
    class="fg-capture__screen"
    role="region"
    :aria-label="label"
    :tabindex="fit ? undefined : 0"
    :data-fit="fit || undefined"
    :style="{ height: height === undefined ? undefined : `${height}px`, '--capture-scale': scale }"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
