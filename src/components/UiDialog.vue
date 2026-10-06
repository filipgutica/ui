<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

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
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogPortal>
      <DialogOverlay class="fg-dialog__overlay" />
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
            class="fg-dialog__close"
            aria-label="Close dialog"
          >
            ×
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
