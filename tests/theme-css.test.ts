import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrast, mix } from './contrast.js'

const source = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8')

const tokensFor = (selector: ':root' | ':root.dark'): Record<string, string> => {
  const escapedSelector = selector.replace('.', String.raw`\.`)
  const match = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`).exec(source)
  if (!match?.[1]) throw new Error(`Missing ${selector} token block`)
  return Object.fromEntries(
    [...match[1].matchAll(/(--[\w-]+):\s*(#[\da-f]{3,8})\s*;/gi)]
      .map(([, name, value]) => [name, value]),
  )
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
  ])('keeps %s visible against %s', (foreground, background) => {
    expect(contrast(tokens[foreground]!, tokens[background]!)).toBeGreaterThanOrEqual(3)
  })

  it('keeps danger text readable on its semantic surface', () => {
    const errorSurface = mix(tokens['--color-error']!, tokens['--color-surface']!, 0.12)

    expect(contrast(tokens['--color-error']!, errorSurface)).toBeGreaterThanOrEqual(4.5)
  })
})
