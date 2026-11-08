import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

// Depth lives in the --shadow-* tokens of src/theme.css, light and dark. Every other stylesheet
// references a token, so a new component cannot bring its own shadow or a dark-only override.
const root = process.cwd()
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8')
const filesUnder = (directory: string, extension: string): string[] =>
  readdirSync(resolve(root, directory), { recursive: true, encoding: 'utf8' })
    .filter(path => path.endsWith(extension))
    .map(path => join(directory, path))

const shadowTokens = new Set([...read('src/theme.css').matchAll(/(--shadow-[\w-]+)\s*:/g)].map(([, name]) => name!))

interface Declaration { selectors: string[], property: string, value: string }

/** Lists declarations with their enclosing selectors and at-rules, outermost first. */
const declarationsIn = (css: string): Declaration[] => {
  const declarations: Declaration[] = []
  const selectors: string[] = []
  let buffer = ''
  for (const character of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (character === '{') {
      selectors.push(buffer.trim())
      buffer = ''
    } else if (character === ';' || character === '}') {
      const match = /^(--[\w-]+|[a-z-]+)\s*:\s*([\s\S]+)$/i.exec(buffer.trim())
      if (match && selectors.length) declarations.push({ selectors: [...selectors], property: match[1]!.toLowerCase(), value: match[2]!.replace(/\s+/g, ' ').trim() })
      buffer = ''
      if (character === '}') selectors.pop()
    } else buffer += character
  }
  return declarations
}

const focusRing = /^(inset )?0 0 0 [\d.]+px var\(--color-[\w-]+\)$/

/** Explains why a shadow declaration breaks the depth contract, or returns undefined when it keeps it. */
const violation = ({ selectors, property, value }: Declaration): string | undefined => {
  if (selectors.some(selector => /\.dark\b|prefers-color-scheme:\s*dark/.test(selector))) return 'sets depth in a dark-mode rule; set dark values in the :root.dark token block'
  if (/^(none|inherit|initial|unset)$/.test(value)) return undefined
  const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
  // A component's own --*-shadow property is checked as a declaration in its own right.
  if (token && (shadowTokens.has(token) || (token.includes('shadow') && !token.startsWith('--shadow-')))) return undefined
  if (property === 'box-shadow' && /focus/.test(selectors.at(-1)!) && focusRing.test(value)) return undefined
  return `uses "${value}"; use a --shadow-* token from src/theme.css`
}

const shadowViolations = (css: string): string[] => declarationsIn(css)
  .filter(({ property }) => property === 'box-shadow' || (property.startsWith('--') && property.includes('shadow')))
  .flatMap(declaration => {
    const reason = violation(declaration)
    return reason ? [`${declaration.selectors.at(-1)} { ${declaration.property} } ${reason}`] : []
  })

const vueStyles = (source: string): string => [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => css).join('\n')

// Theme files (src/theme.css, src/themes/*.css) own the token values and are not scanned.
const sources = [
  'src/components.css',
  'src/site.css',
  ...filesUnder('src/components', '.css'),
  'docs/src/styles.css',
].map(path => ({ path, css: read(path) }))
  .concat([...filesUnder('src', '.vue'), ...filesUnder('docs/src', '.vue')].map(path => ({ path, css: vueStyles(read(path)) })))

describe('depth tokens', () => {
  it('reads the depth tiers from the theme', () => {
    for (const tier of ['--shadow-raise', '--shadow-surface', '--shadow-sink', '--shadow-nav-current', '--shadow-dialog']) expect(shadowTokens).toContain(tier)
  })

  it('flags literal, fallback, and dark-mode shadows inside nested rules', () => {
    expect(shadowViolations('@layer components { .x { .y { box-shadow: 0 2px 4px rgb(0 0 0 / 20%); } } }')).toHaveLength(1)
    expect(shadowViolations('.x { box-shadow: var(--shadow-raise, 0 2px 4px black) }')).toHaveLength(1)
    expect(shadowViolations('.x { --x-shadow: 0 0 0 1px white }')).toHaveLength(1)
    expect(shadowViolations(':root.dark .x { box-shadow: var(--shadow-surface) }')).toHaveLength(1)
    expect(shadowViolations(':root.dark { .x { box-shadow: var(--shadow-surface) } }')).toHaveLength(1)
    expect(shadowViolations('@media (prefers-color-scheme: dark) { .x { box-shadow: var(--shadow-raise) } }')).toHaveLength(1)
    expect(shadowViolations('.x:focus-visible { box-shadow: 0 0 0 2px var(--color-focus) } .y { box-shadow: var(--shadow-sink) }')).toEqual([])
  })

  it('keeps every shadow outside the theme on a token', () => {
    const checked = sources.flatMap(({ css }) => declarationsIn(css)).filter(({ property }) => property === 'box-shadow')
    expect(checked.length).toBeGreaterThan(10)
    const violations = sources.flatMap(({ path, css }) => shadowViolations(css).map(message => `${relative(root, resolve(root, path))}: ${message}`))
    expect(violations).toEqual([])
  })
})
