import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { renderLibraryTheme, renderStandaloneTokens } from '../scripts/graphite-indigo.mjs'
import { semanticCssVariables } from '../src/theme/index.ts'
import { contrast } from './contrast.ts'

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
    expect(read('themes/graphite-indigo.tokens.css')).toBe(renderStandaloneTokens({ data, libraryCss: read('src/theme.css') }))
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

  it('draws standalone focus with an outline, which forced-colors mode keeps', () => {
    const focus = /:focus-visible\s*\{([^}]*)\}/.exec(renderStandaloneTokens({ data, libraryCss: read('src/theme.css') }))?.[1]

    expect(focus).toContain('outline: 2px solid var(--focus)')
    expect(focus).not.toMatch(/box-shadow|outline:\s*none/)
  })

  it('names the library variable beside each standalone token', () => {
    const css = renderStandaloneTokens({ data, libraryCss: read('src/theme.css') })

    expect(css).toContain('--bg: #f4f5f6; /* ui: --color-bg */')
    expect(css).toMatch(/--font-sans: [^;]+; \/\* ui: --font-ui \*\//)
    expect(css).toContain('--radius-sm: 6px; /* ui: --radius-inline */')
    expect(css).toContain('--radius-field: 10px; /* ui: --radius-field */')
    expect(css).toContain('--space-4: 16px; /* ui: --space-4 */')
  })

  it('puts the general variable first when several share a token', () => {
    const roles = Object.fromEntries(Object.entries(data.library.roles).reverse())
    const css = renderStandaloneTokens({ data: { ...data, library: { ...data.library, roles } }, libraryCss: read('src/theme.css') })

    expect(css).toMatch(/--text: [^;]+; \/\* ui: --color-text, /)
  })

  it('fails when a hand-written library value drifts from its token', () => {
    const drifted = read('src/theme.css').replace('--space-4: 1rem;', '--space-4: 2rem;')

    expect(() => renderStandaloneTokens({ data, libraryCss: drifted })).toThrow('--space-4 in theme.css is 2rem')
  })

  it('fails when a token alias names a variable the library does not define', () => {
    const renamed = { ...data, library: { ...data.library, aliases: { ...data.library.aliases, 'radius-md': '--radius-missing' } } }

    expect(() => renderStandaloneTokens({ data: renamed, libraryCss: read('src/theme.css') })).toThrow('--radius-missing')
  })

  it('maps every standalone token to a library variable', () => {
    const css = renderStandaloneTokens({ data, libraryCss: read('src/theme.css') })
    const orphan = { ...data, groups: [...data.groups, { comment: 'Orphan', tokens: { 'orphan-gap': '3px' } }] }

    expect(css).not.toContain('ui: none')
    expect(css).not.toContain('--text-faint')
    expect(() => renderStandaloneTokens({ data: orphan, libraryCss: read('src/theme.css') })).toThrow('orphan-gap')
  })

  it('rings the dark popover with the subtle border, as in light mode', () => {
    const dark = /:root\.dark\s*\{([^}]+)\}/.exec(renderLibraryTheme(data))?.[1]

    expect(dark).toContain('--shadow-dialog: 0 8px 24px rgb(0 0 0 / 45%), 0 0 0 1px var(--color-border-subtle);')
  })

  it('keeps one :root.dark block that sites can copy into a no-script rule', () => {
    const css = renderLibraryTheme(data)

    expect(css.match(/:root\.dark\s*\{/g)).toHaveLength(1)
    expect(/:root\.dark\s*\{([^}]+)\}/.exec(css)?.[1]).toContain('--color-bg: #0d1012')
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
    ...['text', 'text-muted', 'link', 'project', 'success', 'danger', 'warning', 'info'].flatMap(foreground =>
      ['bg', 'surface', 'surface-raised', 'surface-hover'].map(background => [foreground, background])),
    ['text', 'row-hover'],
    ['text', 'row-selected'],
    ['accent-text', 'accent'],
    ['accent-text', 'accent-hover'],
    ...['code-key', 'code-string', 'code-number', 'code-comment'].map(foreground => [foreground, 'surface']),
    ['terminal-text', 'terminal'],
    ['terminal-caption-text', 'terminal-caption'],
    ['project-dark', 'terminal'],
  ])('keeps %s readable on %s', (foreground, background) => {
    expect(contrast(color(foreground, mode), color(background, mode))).toBeGreaterThanOrEqual(4.5)
  })

  it('separates the well from the canvas in each appearance', () => {
    const luminance = hex => contrast(hex, '#000000')
    if (mode === LIGHT) expect(luminance(color('surface', mode))).toBeLessThan(luminance(color('bg', mode)))
    else expect(luminance(color('surface', mode))).toBeGreaterThan(luminance(color('bg', mode)))
  })

  it.each(['success', 'warning', 'danger', 'info'])(
    'keeps status text readable on the %s fill', (status) => {
      const foreground = color(data.library.roles['--color-status-text'], mode)
      const background = color(`${status}-soft`, mode)
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each([
    ['border', 'surface-raised'],
    ['border', 'bg'],
    ['border', 'surface'],
    ['border', 'surface-hover'],
    ['project', 'surface-raised'],
    ['project-dark', 'terminal'],
    ['focus', 'bg'],
    ['focus', 'row-selected'],
  ])('keeps %s visible on %s', (foreground, background) => {
    expect(contrast(color(foreground, mode), color(background, mode))).toBeGreaterThanOrEqual(3)
  })
})
