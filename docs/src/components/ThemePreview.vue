<template>
  <span
    class="theme-preview"
    :data-appearance="appearance"
    aria-hidden="true"
    :style="previewStyle"
  >
    <span class="theme-preview__rail">
      <span /><span /><span />
    </span>
    <span class="theme-preview__editor">
      <span /><span /><span />
    </span>
    <span class="theme-preview__panel">
      <span /><span /><span />
    </span>
  </span>
</template>

<script setup lang="ts">
import { themeVariables } from '@filipgutica/design-system/theme-mapper'
import { computed } from 'vue'

import type { CSSProperties } from 'vue'

import type { NormalizedTheme } from '../../../src/theme/index.js'

import { builtInPreviewStyle } from '../graphite-preview.js'

const { appearance, theme = undefined } = defineProps<{
  appearance: 'system' | 'light' | 'dark'
  theme?: NormalizedTheme
}>()

const previewStyle = computed<CSSProperties>(() => {
  if (!theme) return builtInPreviewStyle(appearance)
  // The values the theme sets on the page, in its own mode. The accent is the project hue.
  const variables = themeVariables(theme)
  return {
    '--preview-bg': variables['--color-bg'],
    '--preview-surface': variables['--color-surface'],
    '--preview-raised': variables['--color-surface-raised'],
    '--preview-border': variables['--color-border'],
    '--preview-muted': variables['--color-muted'],
    '--preview-accent': variables['--color-project'],
  }
})
</script>
