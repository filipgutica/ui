<template>
  <div class="fg-card">
    <header
      v-if="title || slots.title || slots.actions"
      class="fg-card__header"
    >
      <component
        :is="titleTag"
        v-if="title || slots.title"
        class="fg-card__title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </component>
      <div
        v-if="slots.actions"
        class="fg-card__actions"
      >
        <slot name="actions" />
      </div>
    </header>
    <div
      v-if="slots.default"
      class="fg-card__body"
    >
      <slot />
    </div>
    <footer
      v-if="slots.footer"
      class="fg-card__footer"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
export interface UiCardProps {
  title?: string
  titleTag?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const { title = undefined, titleTag = 'h3' } = defineProps<UiCardProps>()

const slots = defineSlots<{
  actions?(): unknown
  default?(): unknown
  footer?(): unknown
  title?(): unknown
}>()
</script>
