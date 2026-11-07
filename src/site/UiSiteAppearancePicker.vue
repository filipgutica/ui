<script setup lang="ts">
import type { UiSegmentedItem } from '../components/UiSegmentedControl.vue'
import type { SiteAppearanceChoice } from './appearance.js'

import UiSegmentedControl from '../components/UiSegmentedControl.vue'

export interface UiSiteAppearancePickerProps {
  /** The pressed choice. Leave it undefined when another theme is active, so no option is pressed. */
  modelValue?: SiteAppearanceChoice | undefined
}

const { modelValue = undefined } = defineProps<UiSiteAppearancePickerProps>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: SiteAppearanceChoice): void
}>()

const appearanceChoices: readonly UiSegmentedItem<SiteAppearanceChoice>[] = [
  { value: 'system', label: 'System theme' },
  { value: 'light', label: 'Light theme' },
  { value: 'dark', label: 'Dark theme' },
]
</script>

<template>
  <UiSegmentedControl
    class="fg-site-appearance"
    label="Color theme"
    size="lg"
    icon-only
    :items="appearanceChoices"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon="{ item }">
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <template v-if="item.value === 'system'">
          <rect
            x="3"
            y="4"
            width="18"
            height="13"
            rx="2"
          />
          <path d="M8 21h8m-4-4v4" />
        </template>
        <template v-else-if="item.value === 'light'">
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </template>
        <path
          v-else
          d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"
        />
      </svg>
    </template>
  </UiSegmentedControl>
</template>
