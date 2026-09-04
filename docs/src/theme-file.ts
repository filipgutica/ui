import type { NormalizedTheme } from '../../src/theme/index.js'

import { parseVsCodeTheme } from '../../src/theme/index.js'

export const MAX_THEME_FILE_BYTES = 1024 * 1024

export const parseThemeFile = async (file: File): Promise<NormalizedTheme> => {
  if (!/\.jsonc?$/i.test(file.name)) {
    throw new Error('Choose a .json or .jsonc theme file.')
  }
  if (file.size > MAX_THEME_FILE_BYTES) {
    throw new Error('Theme files must be 1 MB or smaller.')
  }
  return parseVsCodeTheme({ source: await file.text(), fileName: file.name })
}
