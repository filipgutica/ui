import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { contrast } from '../tests/contrast.js'

// Read actual browser paint, including color-mix(), rather than parsing CSS expressions.
const colorsFor = (locator: Locator) => locator.evaluate(element => {
  const context = document.createElement('canvas').getContext('2d')!
  const hex = (color: string) => {
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    return '#' + [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
      .map(channel => channel.toString(16).padStart(2, '0')).join('')
  }
  const style = getComputedStyle(element)
  return {
    background: hex(style.backgroundColor),
    text: hex(style.color),
    accent: hex(style.getPropertyValue('--color-accent')),
    prompt: hex(getComputedStyle(element.querySelector('.fg-code-block__line') ?? element, '::before').color),
    caption: hex(style.getPropertyValue('--color-terminal-caption-text')),
  }
})

test('tints command plates with the project hue while captures stay neutral', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto(`/@fs${process.cwd()}/tests-e2e/fixtures/site.html`)
    const command = page.locator('.fg-code-block[data-command="true"]').first()
    const original = await colorsFor(command)
    for (const [project, prompt] of [
      [colorScheme === 'light' ? '#2c7a2f' : '#7fd083', '#7fd083'],
      [colorScheme === 'light' ? '#b4440b' : '#f39a62', '#f39a62'],
    ]) {
      await page.evaluate(({ project, prompt }) => {
        document.documentElement.style.setProperty('--color-project', project!)
        document.documentElement.style.setProperty('--color-project-dark', prompt!)
      }, { project, prompt })
      const colors = await colorsFor(command)
      expect(colors.background).not.toBe(original.background)
      expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colors.caption, colors.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colors.prompt, colors.background)).toBeGreaterThanOrEqual(3)
      await expect(page.locator('.fg-capture__screen').first()).toHaveCSS('background-color', 'rgb(10, 12, 14)')
      await expect(page.locator('.fg-capture__caption').first()).toHaveCSS('background-color', 'rgb(19, 23, 26)')
    }
  }
})

test('fills primary actions with a readable project hue at rest and hover', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto('/#/sandbox/button')
    const button = page.locator('.playground-stage .fg-button').first()
    await page.locator('h1').click()
    const rest = await colorsFor(button)
    expect(rest.background).toBe(rest.accent)
    expect(contrast(rest.text, rest.background)).toBeGreaterThanOrEqual(4.5)
    await button.hover()
    const hover = await colorsFor(button)
    expect(hover.background).not.toBe(rest.background)
    expect(contrast(hover.text, hover.background)).toBeGreaterThanOrEqual(4.5)
  }
})
