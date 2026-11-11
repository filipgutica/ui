<script setup lang="ts">
// The icon of every copy control: the copy icon at rest, and a plain tick while `copied` holds
// after a successful copy. The control's label and accessible name do not change with it.
// Both glyphs are the catalogue's #i-copy and #i-tick, drawn on one 16px box with one stroke,
// so the line weight does not change at the swap.
const { copied } = defineProps<{ copied: boolean }>()
</script>

<template>
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-if="copied"
      d="M3.5 8.5l3 3 6-7"
    />
    <template v-else>
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.5"
      />
      <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
    </template>
  </svg>
</template>
