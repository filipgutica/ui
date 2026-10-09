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
import { computed } from 'vue'

import type { CSSProperties } from 'vue'

import type { NormalizedTheme } from '../../../src/theme/index.js'

import { builtInPreviewStyle } from '../graphite-preview.js'

const { appearance, theme = undefined } = defineProps<{
  appearance: 'system' | 'light' | 'dark'
  theme?: NormalizedTheme
}>()

const previewStyle = computed<CSSProperties>(() => theme
  ? {
      '--preview-bg': theme.tokens.pageBackground,
      '--preview-surface': theme.tokens.surface,
      '--preview-raised': theme.tokens.surfaceRaised,
      '--preview-border': theme.tokens.border,
      '--preview-muted': theme.tokens.textMuted,
      '--preview-accent': theme.tokens.accent,
    }
  : builtInPreviewStyle(appearance))
</script>
