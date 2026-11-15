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
    // A code block's source sits on its panel, inside the frame.
    panel: hex(getComputedStyle(element.querySelector('pre') ?? element).backgroundColor),
    text: hex(style.color),
    accent: hex(style.getPropertyValue('--color-accent')),
    prompt: hex(getComputedStyle(element.querySelector('.fg-code-block__line') ?? element, '::before').color),
    copy: hex(getComputedStyle(element.querySelector('.fg-code-block__copy') ?? element).color),
  }
})

test('draws commands in the code well with a prompt in the project hue while captures stay neutral', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto(`/@fs${process.cwd()}/tests-e2e/fixtures/site.html`)
    const command = page.locator('.fg-code-block[data-command="true"]').first()
    // Copy at rest is muted, so move the pointer off it.
    await page.mouse.move(0, 0)
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
      // The hue reaches only the prompt: the frame and the code well stay neutral.
      expect(colors.background).toBe(original.background)
      expect(colors.panel).toBe(original.panel)
      expect(colors.prompt).toBe(colors.accent)
      expect(colors.prompt).not.toBe(original.prompt)
      // Source text and the prompt sit on the code well; Copy at rest sits on the frame.
      expect(contrast(colors.text, colors.panel)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colors.copy, colors.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(colors.prompt, colors.panel)).toBeGreaterThanOrEqual(3)
      await expect(page.locator('.fg-capture__screen').first()).toHaveCSS('background-color', 'rgb(10, 12, 14)')
      await expect(page.locator('.fg-capture__caption').first()).toHaveCSS('background-color', 'rgb(19, 23, 26)')
    }
  }
})

test('fills primary actions with a readable project hue at rest, hover, and press', async ({ page }) => {
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
    await page.mouse.move(0, 0)
    await button.evaluate(element => element.setAttribute('aria-pressed', 'true'))
    const pressed = await colorsFor(button)
    expect(pressed.background).not.toBe(rest.background)
    expect(contrast(pressed.text, pressed.background)).toBeGreaterThanOrEqual(4.5)
    // The next pass only changes the hash, so the page keeps this attribute unless it is removed.
    await button.evaluate(element => element.removeAttribute('aria-pressed'))
  }
})
