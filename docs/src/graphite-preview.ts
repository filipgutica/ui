import type { CSSProperties } from 'vue'

import { tokens } from '@filipgutica/design-system'

type Mode = 'light' | 'dark'

const graphiteIndigo = tokens.themes['graphite-indigo']

const modePreview = (mode: Mode): CSSProperties => ({
  '--preview-bg': graphiteIndigo[mode].bg,
  '--preview-surface': graphiteIndigo[mode].surface,
  '--preview-raised': graphiteIndigo[mode]['surface-raised'],
  '--preview-border': graphiteIndigo[mode]['border-subtle'],
  '--preview-muted': graphiteIndigo[mode]['text-muted'],
  '--preview-accent': graphiteIndigo[mode].accent,
})

/** Preview colors for the built-in schemes, read from the design system's resolved values so they match the theme in either page mode. */
export const builtInPreviewStyle = (appearance: 'system' | 'light' | 'dark'): CSSProperties =>
  appearance === 'system'
    ? {
        ...modePreview('light'),
        '--preview-bg': `linear-gradient(90deg, ${graphiteIndigo.light.bg} 0 50%, ${graphiteIndigo.dark.bg} 50%)`,
      }
    : modePreview(appearance)
