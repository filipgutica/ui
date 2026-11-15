import { themeVariables } from '@filipgutica/design-system/theme-mapper'
import { describe, expect, it } from 'vitest'

import {
  ThemeValidationError,
  applySemanticTheme,
  isNormalizedTheme,
  parseVsCodeTheme,
} from '../src/theme/index.js'

const source = (theme: Record<string, unknown>): string => JSON.stringify(theme)
const darkTheme = {
  name: 'Test Dark',
  type: 'dark',
  colors: { 'editor.background': '#151515', 'editor.foreground': '#eeeeee', 'button.background': '#6c8cff' },
  tokenColors: [{ scope: ['keyword'], settings: { foreground: '#ff88dd' } }],
}

// Every inline property on an element, by name.
const inlineStyle = (element: HTMLElement): Record<string, string> => Object.fromEntries(
  Array.from({ length: element.style.length }, (_, index) => element.style.item(index))
    .map(name => [name, element.style.getPropertyValue(name)]),
)

const codeOf = (action: () => unknown): string | undefined => {
  try {
    action()
  } catch (error) {
    if (error instanceof ThemeValidationError) return error.code
    throw error
  }
  return undefined
}

describe('VS Code theme files', () => {
  it('parses JSONC and maps the theme with the design-system mapper', () => {
    const theme = parseVsCodeTheme({
      fileName: 'test-dark.jsonc',
      source: `{
        // VS Code allows comments and trailing commas.
        "name": "Test Dark",
        "type": "dark",
        "colors": { "editor.background": "#151515", "editor.foreground": "#eeeeee", },
      }`,
    })

    expect(theme).toMatchObject({ name: 'Test Dark', appearance: 'dark', highContrast: false })
    expect(theme.neutrals['color-bg']).toBe('#151515')
  })

  it('names a theme from its file when the file has no name', () => {
    expect(parseVsCodeTheme({ fileName: 'themes/Night Owl.json', source: source({ ...darkTheme, name: undefined }) }).name)
      .toBe('Night Owl')
  })

  it('keeps its error codes for files it cannot parse', () => {
    expect(codeOf(() => parseVsCodeTheme({ fileName: 'broken.json', source: '{ "colors": ' }))).toBe('malformed-json')
    expect(() => parseVsCodeTheme({ fileName: 'broken.json', source: '{\n  "colors": {\n    "editor.background": }\n}' }))
      .toThrow(/line 3, column/)
    expect(codeOf(() => parseVsCodeTheme({ fileName: 'list.json', source: '[]' }))).toBe('invalid-shape')
    expect(codeOf(() => parseVsCodeTheme({ fileName: 'no-colors.json', source: source({ name: 'No colors' }) }))).toBe('invalid-shape')
    expect(codeOf(() => parseVsCodeTheme({ fileName: 'name.json', source: source({ name: 1, colors: {} }) }))).toBe('invalid-shape')
  })

  // The mapper throws only when editor.background is missing or malformed, or no text colour reads on it.
  it('reports a theme the mapper cannot use as missing-colors', () => {
    const missing = codeOf(() => parseVsCodeTheme({ fileName: 'empty.json', source: source({ colors: {} }) }))
    const malformed = codeOf(() => parseVsCodeTheme({
      fileName: 'malformed.json',
      source: source({ colors: { 'editor.background': 'red', 'editor.foreground': '#ffffff' } }),
    }))
    const unreadable = codeOf(() => parseVsCodeTheme({
      fileName: 'unreadable.json',
      source: source({ colors: { 'editor.background': '#777777', 'editor.foreground': '#888888' } }),
    }))

    expect([missing, malformed, unreadable]).toEqual(['missing-colors', 'missing-colors', 'missing-colors'])
  })
})

describe('Persisted themes', () => {
  it('accepts a parsed theme after a JSON round trip, including one with a long name', () => {
    for (const name of ['Test Dark', 'x'.repeat(100)]) {
      const theme = parseVsCodeTheme({ fileName: 'test.json', source: source({ ...darkTheme, name }) })

      expect(isNormalizedTheme(JSON.parse(JSON.stringify(theme)))).toBe(true)
    }
  })

  it('rejects malformed values without throwing', () => {
    const theme = parseVsCodeTheme({ fileName: 'test.json', source: source(darkTheme) })

    for (const value of [
      null,
      'theme',
      { ...theme, name: ' ' },
      { ...theme, name: 'x'.repeat(81) },
      { ...theme, highContrast: 'no' },
      { ...theme, problems: undefined },
      { ...theme, hue: 'red' },
      { ...theme, neutrals: { ...theme.neutrals, 'color-bg': 'url(https://example.com)' } },
      { ...theme, syntax: { unknown: '#ffffff' } },
    ]) {
      expect(isNormalizedTheme(value)).toBe(false)
    }
  })

  // Themes stored by earlier versions: a four-value appearance and a 28-key tokens record.
  it('drops a theme stored in the old shape without throwing', () => {
    const tokens = Object.fromEntries([
      'pageBackground', 'surface', 'surfaceRaised', 'surfaceMuted', 'textPrimary', 'textMuted', 'border', 'borderSubtle',
      'link', 'accent', 'focus', 'buttonBackground', 'buttonForeground', 'buttonHoverBackground', 'inputBackground',
      'inputForeground', 'inputBorder', 'inputPlaceholder', 'rowHoverBackground', 'rowSelectedBackground',
      'rowSelectedForeground', 'codeBackground', 'codeForeground', 'error', 'warning', 'success', 'info', 'progress',
    ].map(key => [key, '#123456']))

    expect(isNormalizedTheme({ name: 'Old high contrast', appearance: 'high-contrast-dark', tokens })).toBe(false)
    expect(isNormalizedTheme({ name: 'Old light', appearance: 'light', tokens, syntax: {} })).toBe(false)
  })
})

describe('Applying a theme', () => {
  it('sets exactly the design-system theme variables and the appearance classes, then clears them', () => {
    const root = document.createElement('div')
    const theme = parseVsCodeTheme({ fileName: 'test.json', source: source({ ...darkTheme, type: 'hc' }) })
    const variables = themeVariables(theme)

    applySemanticTheme({ root, theme })

    expect(inlineStyle(root)).toEqual(variables)
    expect(variables['--color-syntax-keyword']).toBe('#ff88dd')
    expect([...root.classList].sort()).toEqual(['dark', 'high-contrast'])

    applySemanticTheme({ root, theme: null })

    expect(inlineStyle(root)).toEqual({})
    expect([...root.classList]).toEqual([])
  })

  it('replaces the previous theme and its classes', () => {
    const root = document.createElement('div')
    applySemanticTheme({ root, theme: parseVsCodeTheme({ fileName: 'dark.json', source: source({ ...darkTheme, type: 'hc' }) }) })
    const light = parseVsCodeTheme({
      fileName: 'light.json',
      source: source({ type: 'light', colors: { 'editor.background': '#fafafa', 'editor.foreground': '#111111' } }),
    })

    applySemanticTheme({ root, theme: light })

    expect(inlineStyle(root)).toEqual(themeVariables(light))
    expect([...root.classList]).toEqual([])
  })
})
