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
}

defineOptions({ inheritAttrs: false })

const { open, title } = defineProps<UiDrawerProps>()

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
      <DialogOverlay class="fg-drawer__overlay" />
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
            class="fg-drawer__close"
            aria-label="Close drawer"
          >
            ×
          </DialogClose>
        </div>
        <div class="fg-drawer__body">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
