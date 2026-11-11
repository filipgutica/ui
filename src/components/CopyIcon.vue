<script setup lang="ts">
// The icon of every copy control: the copy icon at rest, and a plain tick while `copied` holds
// after a successful copy. The control's label and accessible name do not change with it.
const { copied } = defineProps<{ copied: boolean }>()
</script>

<template>
  <svg
    v-if="copied"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
  <svg
    v-else
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    aria-hidden="true"
  >
    <rect
      x="8"
      y="8"
      width="12"
      height="13"
      rx="2"
    />
    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </svg>
</template>
