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

// A tap outside closes the drawer through reka, which waits for the click after a touch press so
// that a drag or a long press does not close it. reka's overlay cancels a pointerdown on itself, and
// WebKit fires no click after a cancelled pointerdown, or on an element with no click listener. So the
// overlay holds a scrim: a press on it skips that cancel, and its click listener lets WebKit fire the
// click, which reaches reka's outside handlers (pointerDownOutside, interactOutside) as before.
// A mouse press is still cancelled, as reka does, so it does not move focus.
const onScrimPointerDown = (event: PointerEvent): void => {
  if (event.pointerType !== 'touch') event.preventDefault()
}
const onScrimClick = (): void => {
  // The listener itself is what WebKit needs; reka closes the drawer.
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
      <DialogOverlay class="fg-drawer__overlay">
        <div
          class="fg-drawer__scrim"
          @pointerdown="onScrimPointerDown"
          @click="onScrimClick"
        />
      </DialogOverlay>
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
