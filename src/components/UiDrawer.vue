<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

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

// reka's overlay cancels every pointerdown, and for a touch it closes the drawer only on the click
// that follows. WebKit fires no click after a cancelled pointerdown, so a tap outside never closed
// the drawer there. For a touch, the overlay keeps the press from reka and closes on its own click,
// which a drag or a long press does not fire. A mouse press still closes it through reka at once.
const onOverlayPointerDown = (event: PointerEvent): void => {
  if (event.pointerType === 'touch') event.stopImmediatePropagation()
}
const onOverlayClick = (): void => {
  if (open) emit('update:open', false)
}
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
      <DialogOverlay
        class="fg-drawer__overlay"
        @pointerdown.capture="onOverlayPointerDown"
        @click.self="onOverlayClick"
      />
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
