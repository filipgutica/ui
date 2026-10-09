import type { CSSProperties } from 'vue'

import graphiteIndigo from '../../themes/graphite-indigo.json'

type Mode = 'light' | 'dark'

const tokens = new Map<string, string | string[]>(
  graphiteIndigo.groups.flatMap(({ tokens: group }) => Object.entries(group)),
)

const token = (name: string, mode: Mode): string => {
  const value = tokens.get(name)
  const resolved = Array.isArray(value) ? value[mode === 'light' ? 0 : 1] : value
  if (resolved === undefined) throw new Error(`Missing Graphite Indigo token "${name}"`)
  return resolved
}

const modePreview = (mode: Mode): CSSProperties => ({
  '--preview-bg': token('bg', mode),
  '--preview-surface': token('surface', mode),
  '--preview-raised': token('surface-raised', mode),
  '--preview-border': token('border-subtle', mode),
  '--preview-muted': token('text-muted', mode),
  '--preview-accent': token('accent', mode),
})

/** Preview colors for the built-in schemes, read from the shared theme data so they match it in either page mode. */
export const builtInPreviewStyle = (appearance: 'system' | 'light' | 'dark'): CSSProperties =>
  appearance === 'system'
    ? {
        ...modePreview('light'),
        '--preview-bg': `linear-gradient(90deg, ${token('bg', 'light')} 0 50%, ${token('bg', 'dark')} 50%)`,
      }
    : modePreview(appearance)
