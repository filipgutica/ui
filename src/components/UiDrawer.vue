<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

import ModalOverlay from './ModalOverlay.vue'

export interface UiDrawerProps {
  open: boolean
  title: string
  /** The close button's accessible name, such as "Close menu". */
  closeLabel?: string
}

defineOptions({ inheritAttrs: false })

const { open, title, closeLabel = 'Close drawer' } = defineProps<UiDrawerProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'closeAutoFocus', value: Event): void
}>()

defineSlots<{
  default(): unknown
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
      <ModalOverlay class="fg-drawer__overlay" />
      <DialogContent
        class="fg-drawer__content"
        aria-modal="true"
        :aria-describedby="undefined"
        v-bind="$attrs"
        @close-auto-focus="emit('closeAutoFocus', $event)"
      >
        <div class="fg-drawer__header">
          <DialogTitle class="fg-drawer__title">
            {{ title }}
          </DialogTitle>
          <DialogClose
            class="fg-drawer__close fg-quiet-action"
            :aria-label="closeLabel"
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
        <div class="fg-drawer__body">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
