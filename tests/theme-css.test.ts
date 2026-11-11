import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrast, mix } from './contrast.js'

const source = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8')

const blockFor = (selector: ':root' | ':root.dark'): Record<string, string> => {
  const escapedSelector = selector.replace('.', String.raw`\.`)
  const match = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`).exec(source)
  if (!match?.[1]) throw new Error(`Missing ${selector} token block`)
  return Object.fromEntries(
    [...match[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)]
      .map(([, name, value]) => [name!, value!.trim()]),
  )
}

const tokensFor = (selector: ':root' | ':root.dark'): Record<string, string> => {
  // :root.dark also matches :root, so dark tokens can reference values defined only in :root.
  const declarations = selector === ':root' ? blockFor(':root') : { ...blockFor(':root'), ...blockFor(':root.dark') }
  const resolveColor = (name: string): string => declarations[name]!.replace(/var\((--[\w-]+)\)/g, (_, target: string) => resolveColor(target))
  return Object.fromEntries(Object.keys(declarations).map(name => [name, resolveColor(name)]))
}

describe.each([
  ['light', tokensFor(':root')],
  ['dark', tokensFor(':root.dark')],
])('%s semantic theme contrast', (_, tokens) => {
  it.each([
    ['--color-text', '--color-bg'],
    ['--color-muted', '--color-bg'],
    ['--color-link', '--color-bg'],
    ['--color-accent', '--color-bg'],
    ['--color-input-text', '--color-input-bg'],
    ['--color-button-text', '--color-button-bg'],
  ])('keeps %s readable against %s', (foreground, background) => {
    expect(contrast(tokens[foreground]!, tokens[background]!)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['--color-border', '--color-surface-raised'],
    ['--color-input-border', '--color-input-bg'],
    ['--color-focus', '--color-bg'],
    ['--color-focus', '--color-surface'],
    ['--color-focus', '--color-surface-raised'],
  ])('keeps %s visible against %s', (foreground, background) => {
    expect(contrast(tokens[foreground]!, tokens[background]!)).toBeGreaterThanOrEqual(3)
  })

  // The checked option has no fill, so its accent check carries the state on the picker and on a hovered row.
  it.each([0, 0.08])('keeps the select check visible on the picker with a %s text tint', ratio => {
    const fill = mix(tokens['--color-text']!, tokens['--color-input-bg']!, ratio)
    expect(contrast(tokens['--color-accent']!, fill)).toBeGreaterThanOrEqual(3)
  })

  it('keeps danger text readable on its semantic surface', () => {
    const errorSurface = tokens['--color-error-surface']!

    expect(contrast(tokens['--color-error']!, errorSurface)).toBeGreaterThanOrEqual(4.5)
  })
})
