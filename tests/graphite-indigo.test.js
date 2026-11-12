import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

import { tokens } from '@filipgutica/design-system'
import { describe, expect, it } from 'vitest'

import { renderThemeCss, vendorDesignSystem } from '../scripts/vendor-design-system.mjs'
import { semanticCssVariables } from '../src/theme/index.ts'
import { contrast } from './contrast.ts'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const readPackage = (path) => readFileSync(createRequire(import.meta.url).resolve(`@filipgutica/design-system/${path}`), 'utf8')
const graphiteIndigo = tokens.themes['graphite-indigo']

const variablesIn = (css) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name))

describe('Graphite Indigo files', () => {
  it('give the library theme every role the theme importer controls', () => {
    const defined = variablesIn(read('src/themes/graphite-indigo.css'))
    const missing = [
      ...Object.values(semanticCssVariables),
      ...['comment', 'keyword', 'string', 'number', 'function', 'type', 'variable', 'operator', 'punctuation', 'tag', 'attribute']
        .map(role => `--color-syntax-${role}`),
    ].filter(variable => !defined.has(variable))

    expect(missing).toEqual([])
  })

  it.each(['src/theme.css', 'src/themes/graphite-indigo.css'])(
    'keeps %s self-contained with one :root.dark block that sites can copy into a no-script rule', (path) => {
      const css = read(path)

      expect(css).not.toMatch(/@import[^;]*design-system/)
      expect(css.match(/:root\.dark\s*\{/g)).toHaveLength(1)
      expect(/:root\.dark\s*\{([^}]+)\}/.exec(css)?.[1]).toContain(`--color-bg: ${graphiteIndigo.dark['color-bg']}`)
    },
  )

  it('lets site.css read only variables the base or Graphite Indigo theme defines', () => {
    const defined = new Set([...variablesIn(read('src/theme.css')), ...variablesIn(read('src/themes/graphite-indigo.css'))])
    const used = [...read('src/site.css').matchAll(/var\((--[\w-]+)(,|\))/g)]
      .filter(([, , end]) => end === ')')
      .map(([, name]) => name)

    expect(used.filter(name => !defined.has(name))).toEqual([])
  })
})

// Every class-flavour theme the design system ships: Graphite Indigo, Pine, and Mauve.
const themeFiles = readdirSync(resolve(process.cwd(), 'src/themes')).filter(file => file.endsWith('.css')).sort()

describe('Class-flavour theme files', () => {
  it('vendors every theme the design-system package ships, and nothing else', () => {
    const shipped = readdirSync(dirname(createRequire(import.meta.url).resolve('@filipgutica/design-system/class/themes/graphite-indigo.css')))
      .filter(file => file.endsWith('.css')).sort()

    expect(themeFiles).toEqual(shipped)
    expect(themeFiles.map(file => file.replace('.css', ''))).toEqual(Object.keys(tokens.themes).sort())
  })

  it('exports each theme as @filipgutica/ui/themes/<name>.css, and nothing else under themes', () => {
    const { exports } = JSON.parse(read('package.json'))
    const themeExports = Object.entries(exports).filter(([path]) => path.startsWith('./themes/'))

    expect(Object.fromEntries(themeExports)).toEqual(Object.fromEntries(themeFiles.map(file => [`./themes/${file}`, `./src/themes/${file}`])))
  })

  it.each(themeFiles)('gives %s the same roles as Graphite Indigo, with one :root.dark block from its own tokens', (file) => {
    const css = read(`src/themes/${file}`)

    expect(variablesIn(css)).toEqual(variablesIn(read('src/themes/graphite-indigo.css')))
    expect(css).not.toMatch(/@import[^;]*design-system/)
    expect(css.match(/:root\.dark\s*\{/g)).toHaveLength(1)
    expect(/:root\.dark\s*\{([^}]+)\}/.exec(css)?.[1]).toContain(`--color-bg: ${tokens.themes[file.replace('.css', '')].dark['color-bg']}`)
  })
})

describe('Vendoring into a copy of the repository', () => {
  it('reports and removes only theme CSS the package does not ship, and keeps other files in src/themes', () => {
    const root = mkdtempSync(join(tmpdir(), 'ui-vendor-'))
    try {
      mkdirSync(join(root, 'src/fonts'), { recursive: true })
      cpSync(resolve(process.cwd(), 'src/theme.css'), join(root, 'src/theme.css'))
      cpSync(resolve(process.cwd(), 'src/themes'), join(root, 'src/themes'), { recursive: true })
      writeFileSync(join(root, 'src/themes/pine.css'), '/* edited */')
      rmSync(join(root, 'src/themes/mauve.css'))
      writeFileSync(join(root, 'src/themes/retired.css'), '/* a theme the package dropped */')
      writeFileSync(join(root, 'src/themes/README.md'), 'Notes')

      const stale = vendorDesignSystem({ root, check: true })
      expect(stale).toEqual(expect.arrayContaining(['src/themes/pine.css', 'src/themes/mauve.css', 'src/themes/retired.css']))
      expect(stale).not.toContain('src/themes/graphite-indigo.css')
      expect(stale).not.toContain('src/themes/README.md')
      expect(existsSync(join(root, 'src/themes/retired.css'))).toBe(true)

      vendorDesignSystem({ root })
      expect(readdirSync(join(root, 'src/themes')).sort()).toEqual([...themeFiles, 'README.md'].sort())
      expect(readFileSync(join(root, 'src/themes/README.md'), 'utf8')).toBe('Notes')
      expect(readFileSync(join(root, 'src/themes/pine.css'), 'utf8')).toBe(read('src/themes/pine.css'))
      expect(vendorDesignSystem({ root, check: true })).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('Design-system token vendoring', () => {
  const tokensCss = readPackage('tokens.css')
  const graphiteCss = read('src/themes/graphite-indigo.css')
  const baseCss = readPackage('class/base.css')
  const themeCss = read('src/theme.css')

  it('restores a theme.css value that drifts from the package', () => {
    const drifted = themeCss.replace('--space-4: 1rem;', '--space-4: 2rem;')

    expect(renderThemeCss({ themeCss: drifted, tokensCss, graphiteCss, baseCss })).toBe(themeCss)
  })

  it('fails when a value that changes in dark mode has no :root.dark declaration', () => {
    const noDarkText = themeCss.replace(/(:root\.dark\s*\{[^}]*?)\n {2}--color-text: [^;]+;/, '$1')

    expect(() => renderThemeCss({ themeCss: noDarkText, tokensCss, graphiteCss, baseCss })).toThrow('--color-text changes in dark mode')
  })

  it('fails when the package names a variable neither theme file declares', () => {
    const noSpace = themeCss.replace('\n  --space-4: 1rem;', '')

    expect(() => renderThemeCss({ themeCss: noSpace, tokensCss, graphiteCss, baseCss })).toThrow('--space-4')
  })

  it('fails when theme.css drops a base token that the Graphite Indigo theme also declares', () => {
    const noProjectDark = themeCss.replace('\n  --color-project-dark: #a5a1ff;', '')

    expect(() => renderThemeCss({ themeCss: noProjectDark, tokensCss, graphiteCss, baseCss })).toThrow('--color-project-dark')
  })
})

describe.each(['light', 'dark'])('Graphite Indigo %s contrast', (mode) => {
  const color = name => graphiteIndigo[mode][name]

  it.each([
    ...['color-text', 'color-muted', 'color-link', 'color-project', 'color-success', 'color-error', 'color-warning', 'color-info'].flatMap(foreground =>
      ['color-bg', 'color-surface', 'color-surface-raised', 'color-surface-muted'].map(background => [foreground, background])),
    ['color-text', 'color-row-hover'],
    ['color-text', 'color-row-selected'],
    ['color-accent-text', 'color-accent'],
    ['color-accent-text', 'color-accent-hover'],
    ...['color-syntax-keyword', 'color-syntax-string', 'color-syntax-number', 'color-syntax-comment'].map(foreground => [foreground, 'color-surface']),
    ['color-terminal-text', 'color-terminal'],
    ['color-terminal-caption-text', 'color-terminal-caption'],
    ['color-project-dark', 'color-terminal'],
  ])('keeps %s readable on %s', (foreground, background) => {
    expect(contrast(color(foreground), color(background))).toBeGreaterThanOrEqual(4.5)
  })

  it('separates the well from the canvas in each appearance', () => {
    const luminance = hex => contrast(hex, '#000000')
    if (mode === 'light') expect(luminance(color('color-surface'))).toBeLessThan(luminance(color('color-bg')))
    else expect(luminance(color('color-surface'))).toBeGreaterThan(luminance(color('color-bg')))
  })

  // --color-status-text takes the text token.
  it.each(['success', 'warning', 'error', 'info'])(
    'keeps status text readable on the %s fill', (status) => {
      expect(contrast(color('color-text'), color(`color-${status}-surface`))).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each([
    ['color-border', 'color-surface-raised'],
    ['color-border', 'color-bg'],
    ['color-border', 'color-surface'],
    ['color-border', 'color-surface-muted'],
    ['color-project', 'color-surface-raised'],
    ['color-project-dark', 'color-terminal'],
    ['color-focus', 'color-bg'],
    ['color-focus', 'color-row-selected'],
  ])('keeps %s visible on %s', (foreground, background) => {
    expect(contrast(color(foreground), color(background))).toBeGreaterThanOrEqual(3)
  })
})
