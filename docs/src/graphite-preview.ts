import type { CSSProperties } from 'vue'

import { tokens } from '@filipgutica/design-system'

type Mode = 'light' | 'dark'

const graphiteIndigo = tokens.themes['graphite-indigo']

const modePreview = (mode: Mode): CSSProperties => ({
  '--preview-bg': graphiteIndigo[mode]['color-bg'],
  '--preview-surface': graphiteIndigo[mode]['color-surface'],
  '--preview-raised': graphiteIndigo[mode]['color-surface-raised'],
  '--preview-border': graphiteIndigo[mode]['color-border-subtle'],
  '--preview-muted': graphiteIndigo[mode]['color-muted'],
  '--preview-accent': graphiteIndigo[mode]['color-accent'],
})

/** Preview colors for the built-in schemes, read from the design system's resolved values so they match the theme in either page mode. */
export const builtInPreviewStyle = (appearance: 'system' | 'light' | 'dark'): CSSProperties =>
  appearance === 'system'
    ? {
        ...modePreview('light'),
        '--preview-bg': `linear-gradient(90deg, ${graphiteIndigo.light['color-bg']} 0 50%, ${graphiteIndigo.dark['color-bg']} 50%)`,
      }
    : modePreview(appearance)
