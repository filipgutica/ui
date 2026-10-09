import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { renderLibraryTheme, renderStandaloneTokens } from '../scripts/graphite-indigo.mjs'
import { semanticCssVariables } from '../src/theme/index.ts'
import { contrast, mix } from './contrast.ts'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const data = JSON.parse(read('themes/graphite-indigo.json'))
const tokens = Object.fromEntries(data.groups.flatMap(({ tokens: group }) => Object.entries(group)))
const LIGHT = 0
const DARK = 1

const color = (name, mode) => {
  const value = Array.isArray(tokens[name]) ? tokens[name][mode] : tokens[name]
  return value.startsWith('{') ? color(value.slice(1, -1), mode) : value
}

const variablesIn = (css) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name))

describe('Graphite Indigo generated files', () => {
  it('match the shared token data', () => {
    expect(read('src/themes/graphite-indigo.css')).toBe(renderLibraryTheme(data))
    expect(read('themes/graphite-indigo.tokens.css')).toBe(renderStandaloneTokens(data))
  })

  it('give the library theme every role the theme importer controls', () => {
    const defined = variablesIn(renderLibraryTheme(data))
    const missing = [
      ...Object.values(semanticCssVariables),
      ...['comment', 'keyword', 'string', 'number', 'function', 'type', 'variable', 'operator', 'punctuation', 'tag', 'attribute']
        .map(role => `--color-syntax-${role}`),
    ].filter(variable => !defined.has(variable))

    expect(missing).toEqual([])
  })

  it('keeps one :root.dark block that sites can copy into a no-script rule', () => {
    const css = renderLibraryTheme(data)

    expect(css.match(/:root\.dark\s*\{/g)).toHaveLength(1)
    expect(/:root\.dark\s*\{([^}]+)\}/.exec(css)?.[1]).toContain('--color-bg: #151619')
  })

  it('adds only variables the base theme lacks, and site.css reads only defined variables', () => {
    const base = variablesIn(read('src/theme.css'))
    const graphite = variablesIn(renderLibraryTheme(data))
    const extras = data.library.extras.map(name => `--${name}`)

    expect(extras.filter(name => base.has(name))).toEqual([])
    const used = [...read('src/site.css').matchAll(/var\((--[\w-]+)(,|\))/g)]
      .filter(([, , end]) => end === ')')
      .map(([, name]) => name)
    expect(used.filter(name => !base.has(name) && !graphite.has(name))).toEqual([])
  })
})

describe.each([['light', LIGHT], ['dark', DARK]])('Graphite Indigo %s contrast', (_, mode) => {
  it.each([
    ['text', 'bg'],
    ['text', 'surface-raised'],
    ['text', 'row-hover'],
    ['text', 'row-selected'],
    ['text-muted', 'bg'],
    ['text-muted', 'surface'],
    ['text-faint', 'bg'],
    ['link', 'bg'],
    ['accent', 'bg'],
    ['accent-text', 'accent'],
    ['accent-text', 'accent-hover'],
    ['code-key', 'surface'],
    ['code-string', 'surface'],
    ['code-number', 'surface'],
    ['code-comment', 'surface'],
    ['danger', 'bg'],
    ['warning', 'bg'],
    ['info', 'bg'],
  ])('keeps %s readable on %s', (foreground, background) => {
    expect(contrast(color(foreground, mode), color(background, mode))).toBeGreaterThanOrEqual(4.5)
  })

  it.each([['success', 0.11], ['warning', 0.12], ['danger', 0.10], ['info', 0.10]])(
    'keeps status text readable on the %s fill', (status, ratio) => {
      const foreground = color(data.library.roles['--color-status-text'], mode)
      const background = mix(color(status, mode), color('bg', mode), ratio)
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each([
    ['border', 'surface-raised'],
    ['border', 'bg'],
    ['focus', 'bg'],
    ['focus', 'row-selected'],
  ])('keeps %s visible on %s', (foreground, background) => {
    expect(contrast(color(foreground, mode), color(background, mode))).toBeGreaterThanOrEqual(3)
  })
})
