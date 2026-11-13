<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import ModalOverlay from './ModalOverlay.vue'

export interface UiDialogProps {
  description?: string
  open: boolean
  title: string
}

defineOptions({ inheritAttrs: false })

const { description = undefined, open, title } = defineProps<UiDialogProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
}>()

defineSlots<{
  default(): unknown
  footer?(): unknown
  trigger?(): unknown
}>()
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogTrigger
      v-if="$slots.trigger"
      as-child
    >
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <ModalOverlay class="fg-dialog__overlay" />
      <DialogContent
        class="fg-dialog__content"
        aria-modal="true"
        v-bind="$attrs"
      >
        <div class="fg-dialog__header">
          <div>
            <DialogTitle class="fg-dialog__title">
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              class="fg-dialog__description"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="fg-dialog__close fg-quiet-action"
            aria-label="Close dialog"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </DialogClose>
        </div>
        <div class="fg-dialog__body">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="fg-dialog__footer"
        >
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
