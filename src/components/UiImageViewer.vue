<script setup lang="ts">
import { onUnmounted, ref, useTemplateRef, watch } from 'vue'

import { MIN_FIT_SCALE } from '../full-size.js'
import UiDialog from './UiDialog.vue'

export interface UiImageViewerProps {
  open: boolean
  /** The short name of what the image shows, such as "Ticket screenshot". */
  title: string
  src: string
  alt: string
  /** The full size in CSS pixels, such as half the pixel size of a 2x screenshot. */
  width: number
  height: number
}

const { open, title, src, alt, width, height } = defineProps<UiImageViewerProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
}>()

defineSlots<{
  /** One button or link that opens the viewer and takes focus back when it closes. */
  trigger?(): unknown
}>()

const frame = useTemplateRef<HTMLElement>('frame')
const fitted = ref(true)
let observer: ResizeObserver | undefined

// The frame keeps its full width in the dialog's sizing, so fitting it never changes the body it measures.
const measure = (): void => {
  const body = frame.value?.parentElement
  if (!body) return
  const { paddingLeft, paddingRight } = getComputedStyle(body)
  const available = body.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)
  fitted.value = available / width >= MIN_FIT_SCALE
}

// The frame exists only while the dialog is open.
watch(frame, (element) => {
  observer?.disconnect()
  const body = element?.parentElement
  if (!body) return
  measure()
  if (typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(measure)
  observer.observe(body)
}, { flush: 'post' })
watch(() => width, measure)
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    variant="viewer"
    @update:open="emit('update:open', $event)"
  >
    <template
      v-if="$slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>
    <div
      ref="frame"
      :style="{ width: `${width}px`, maxWidth: fitted ? '100%' : 'none' }"
    >
      <img
        class="fg-image-viewer__image"
        :src="src"
        :alt="alt"
        :width="width"
        :height="height"
      >
    </div>
  </UiDialog>
</template>
