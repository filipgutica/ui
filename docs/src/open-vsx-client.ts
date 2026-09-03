import {
  isNormalizedTheme,
  type NormalizedTheme,
  type OpenVsxThemeSummary,
} from '../../src/theme/index.js'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isThemeSummary = (value: unknown): value is OpenVsxThemeSummary =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.name === 'string'
  && typeof value.publisher === 'string'
  && typeof value.description === 'string'
  && typeof value.downloadCount === 'number'

const readJson = async (response: Response): Promise<unknown> => {
  if (!response.ok) throw new Error('The docs theme service is unavailable.')
  return response.json()
}

export const searchOpenVsx = async (query: string): Promise<OpenVsxThemeSummary[]> => {
  const response = await fetch(`/api/open-vsx/search?q=${encodeURIComponent(query)}`)
  const result = await readJson(response)
  if (
    !isRecord(result)
    || result.status !== 'success'
    || !Array.isArray(result.themes)
    || !result.themes.every(isThemeSummary)
  ) {
    throw new Error(isRecord(result) && typeof result.message === 'string'
      ? result.message
      : 'Open VSX returned an invalid search response.')
  }
  return result.themes
}

export const importOpenVsxTheme = async ({
  extensionId,
  preferredAppearance,
}: {
  extensionId: string
  preferredAppearance: 'light' | 'dark'
}): Promise<NormalizedTheme> => {
  const parameters = new URLSearchParams({ id: extensionId, appearance: preferredAppearance })
  const result = await readJson(await fetch(`/api/open-vsx/import?${parameters}`))
  if (isRecord(result) && result.status === 'success' && isNormalizedTheme(result.theme)) {
    return result.theme
  }
  const error = isRecord(result) && isRecord(result.error) && typeof result.error.message === 'string'
    ? result.error.message
    : 'Open VSX returned an invalid theme.'
  throw new Error(error)
}
