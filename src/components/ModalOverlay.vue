<script setup lang="ts">
import { DialogOverlay } from 'reka-ui'

// The backdrop of UiDialog and UiDrawer. Pass the component's overlay class; it reaches DialogOverlay.
//
// A tap outside closes the panel through reka, which waits for the click after a touch press so
// that a drag or a long press does not close it. reka's overlay cancels a pointerdown on itself, and
// WebKit fires no click after a cancelled pointerdown, or on an element with no click listener. So the
// overlay holds a scrim: a press on it skips that cancel, and its click listener lets WebKit fire the
// click, which reaches reka's outside handlers (pointerDownOutside, interactOutside) as before.
// A mouse press is still cancelled, as reka does, so it does not move focus.
const onScrimPointerDown = (event: PointerEvent): void => {
  if (event.pointerType !== 'touch') event.preventDefault()
}
const onScrimClick = (): void => {
  // The listener itself is what WebKit needs; reka closes the panel.
}
</script>

<template>
  <DialogOverlay>
    <div
      class="fg-scrim"
      @pointerdown="onScrimPointerDown"
      @click="onScrimClick"
    />
  </DialogOverlay>
</template>
