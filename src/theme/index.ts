// VS Code themes for @filipgutica/ui. The design system parses and maps them; this module applies the
// result to a page and checks themes a page stored earlier.
import {
  ThemeValidationError as ParseValidationError,
  parseVsCodeTheme as parseThemeFile,
} from '@filipgutica/design-system/open-vsx'
import {
  ThemeValidationError as MapperValidationError,
  mapVsCodeTheme,
  themeVariables,
} from '@filipgutica/design-system/theme-mapper'

import type { VsCodeTheme } from '@filipgutica/design-system/open-vsx'
import type { MappedTheme, ThemeColours } from '@filipgutica/design-system/theme-mapper'

/** A VS Code theme mapped onto the design system's theme inputs, ready for `applySemanticTheme`. */
export type NormalizedTheme = MappedTheme

export type ThemeValidationErrorCode = 'invalid-shape' | 'malformed-json' | 'missing-colors'

export class ThemeValidationError extends Error {
  readonly code: ThemeValidationErrorCode

  constructor(code: ThemeValidationErrorCode, message: string) {
    super(message)
    this.name = 'ThemeValidationError'
    this.code = code
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseFile = ({ source, fileName }: { source: string, fileName: string }): VsCodeTheme => {
  try {
    return parseThemeFile({ source, fileName })
  } catch (error) {
    if (error instanceof ParseValidationError) throw new ThemeValidationError(error.code, error.message)
    throw error
  }
}

/**
 * Parses a VS Code JSON or JSONC theme file and maps it with the design system's mapper. A file
 * without a name takes its file name. The result lists the contrast checks the theme fails in
 * `problems`; a failing theme still maps.
 * @throws {ThemeValidationError} `malformed-json` or `invalid-shape` when the file cannot be read as a
 *   theme, and `missing-colors` when it has no usable `editor.background`, or no text colour that
 *   reads on it.
 */
export const parseVsCodeTheme = ({ source, fileName }: { source: string, fileName: string }): NormalizedTheme => {
  const theme = parseFile({ source, fileName })
  try {
    return mapVsCodeTheme(theme)
  } catch (error) {
    if (error instanceof MapperValidationError) throw new ThemeValidationError('missing-colors', error.message)
    throw error
  }
}

/**
 * Whether a value, such as one read back from storage, is a theme `applySemanticTheme` can apply.
 * Themes stored in the shape of earlier versions return false.
 */
export const isNormalizedTheme = (value: unknown): value is NormalizedTheme => {
  if (
    !isRecord(value)
    || typeof value.name !== 'string'
    || value.name.trim().length === 0
    || value.name.length > 80
    || typeof value.highContrast !== 'boolean'
    || !Array.isArray(value.problems)
  ) {
    return false
  }
  try {
    // themeVariables checks the appearance, hue pair, neutrals, and syntax colours of untyped input itself.
    themeVariables(value as ThemeColours)
    return true
  } catch (error) {
    if (error instanceof MapperValidationError) return false
    throw error
  }
}

export interface SemanticThemeRoot {
  classList: {
    toggle: (name: string, force?: boolean) => unknown
  }
  style: {
    removeProperty: (name: string) => unknown
    setProperty: (name: string, value: string) => unknown
  }
}

// The variables applySemanticTheme last set on each root, so the next call can clear them.
const appliedVariables = new WeakMap<SemanticThemeRoot, string[]>()

/**
 * Sets a theme's design-system variables inline on root, and the `.dark` and `.high-contrast` classes
 * from its appearance. Null clears what the last call set.
 */
export const applySemanticTheme = ({
  root,
  theme,
}: {
  root: SemanticThemeRoot
  theme: NormalizedTheme | null
}): void => {
  for (const name of appliedVariables.get(root) ?? []) root.style.removeProperty(name)
  appliedVariables.delete(root)

  if (theme) {
    const variables = themeVariables(theme)
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
    appliedVariables.set(root, Object.keys(variables))
  }

  root.classList.toggle('dark', theme?.appearance === 'dark')
  root.classList.toggle('high-contrast', theme?.highContrast === true)
}
