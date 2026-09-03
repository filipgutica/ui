import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

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

const channels = (color: string): [number, number, number] => {
  const value = color.length === 4
    ? [...color.slice(1)].map(channel => channel.repeat(2)).join('')
    : color.slice(1, 7)
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

const contrast = (foreground: string, background: string): number => {
  const luminance = (color: string): number => {
    const [red, green, blue] = channels(color).map(channel => {
      const normalized = channel / 255
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
  }
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

const mix = (foreground: string, background: string, foregroundRatio: number): string => {
  const foregroundChannels = channels(foreground)
  const backgroundChannels = channels(background)
  const mixed = foregroundChannels.map((channel, index) => Math.round(
    channel * foregroundRatio + backgroundChannels[index]! * (1 - foregroundRatio),
  ))
  return `#${mixed.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
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
