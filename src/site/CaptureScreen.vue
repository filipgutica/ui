<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const { html, label, fit } = defineProps<{
  html: string
  label: string
  /** Fits the capture to the available width when it remains readable. */
  fit: boolean
}>()

// Smaller scales make terminal text unreadable; let the capture scroll instead.
const MIN_FIT_SCALE = 0.7

const container = ref<HTMLElement>()
const scale = ref(1)
const height = ref<number>()
const fitted = computed(() => height.value !== undefined)
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
  const fitScale = Math.min(1, screen.clientWidth / capture.offsetWidth)
  // A fitted capture cannot scroll, so drop any offset left from scrolling at a narrower width.
  if (fitScale >= MIN_FIT_SCALE) screen.scrollLeft = 0
  scale.value = fitScale >= MIN_FIT_SCALE ? fitScale : 1
  height.value = fitScale >= MIN_FIT_SCALE
    ? Math.ceil(capture.offsetHeight * scale.value) + screen.offsetHeight - screen.clientHeight
    : undefined
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
    :tabindex="fitted ? undefined : 0"
    :data-fit="fitted || undefined"
    :style="{ height: height === undefined ? undefined : `${height}px`, '--capture-scale': scale }"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
