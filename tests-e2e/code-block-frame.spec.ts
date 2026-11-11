import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { contrast } from '../tests/contrast.js'

// The code block, quiet action, and copy feedback of @filipgutica/design-system 1.0.5, measured in
// the browser as the catalogue's tests/catalogue/catalogue.spec.ts measures them.

const tick = 'M3.5 8.5l3 3 6-7'

const stubClipboard = (page: Page) => page.addInitScript(() => {
  // A test sets window.failCopy to make the next copies fail.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async () => { if ((window as unknown as { failCopy?: boolean }).failCopy) throw new Error('denied') } },
  })
})

const sandbox = async (page: Page, { variant, language }: { variant: 'default' | 'compact', language?: string }) => {
  await page.goto('/#/sandbox/code-block')
  await page.getByLabel('Variant', { exact: true }).selectOption(variant)
  if (language) await page.getByLabel('Language', { exact: true }).selectOption(language)
  const block = page.locator('.playground-stage .fg-code-block')
  await expect(block).toHaveAttribute('data-variant', variant)
  return block
}

// The source panel's corners and its inset from the frame. Under a header the panel meets the
// header; beside Copy its right inset is the gap to Copy.
const geometry = (block: Locator) => block.evaluate((frame) => {
  const pre = frame.querySelector(':scope > pre')!
  const head = frame.dataset.variant === 'default' ? frame.querySelector(':scope > .fg-code-block__header') : null
  const copy = frame.dataset.variant === 'default' ? null : frame.querySelector('.fg-code-block__copy')
  const [outer, panel] = [frame.getBoundingClientRect(), pre.getBoundingClientRect()]
  const border = parseFloat(getComputedStyle(frame).borderTopWidth)
  return {
    frame: getComputedStyle(frame).borderRadius,
    panel: getComputedStyle(pre).borderRadius,
    top: Math.round(head ? panel.top - head.getBoundingClientRect().bottom : panel.top - outer.top - border),
    left: Math.round(panel.left - outer.left - border),
    bottom: Math.round(outer.bottom - panel.bottom - border),
    right: Math.round(copy ? copy.getBoundingClientRect().left - panel.right : outer.right - panel.right - border),
    copyRight: copy ? Math.round(outer.right - copy.getBoundingClientRect().right - border) : null,
  }
})

// Reads painted colour, including color-mix(), as #rrggbb.
const hexOf = (locator: Locator, property: 'color' | 'backgroundColor') => locator.evaluate((element, property) => {
  const context = document.createElement('canvas').getContext('2d')!
  context.fillStyle = getComputedStyle(element)[property]
  context.fillRect(0, 0, 1, 1)
  return '#' + [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(channel => channel.toString(16).padStart(2, '0')).join('')
}, property)

const alphaOf = (value: string) => {
  if (value === 'transparent') return 0
  const alpha = value.match(/^(?:rgba\(.*, |color\(srgb .* \/ )([\d.]+)\)$/)
  return alpha ? Number(alpha[1]) : 1
}

test.describe('code block frame', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('the source is a 12px panel 4px inside a 16px frame, with a 4px gap beside compact Copy', async ({ page }) => {
    const header = await sandbox(page, { variant: 'default' })
    expect(await geometry(header)).toEqual({ frame: '16px', panel: '12px', top: 0, left: 4, bottom: 4, right: 4, copyRight: null })
    for (const language of ['typescript', 'bash']) {
      const compact = await sandbox(page, { variant: 'compact', language })
      expect(await geometry(compact), language).toEqual({ frame: '16px', panel: '12px', top: 4, left: 4, bottom: 4, right: 4, copyRight: 4 })
    }
    // Without Copy or actions there is no header, so no gap: the panel sits 4px from the frame on every side.
    const bare = await sandbox(page, { variant: 'compact', language: 'typescript' })
    await bare.locator(':scope > .fg-code-block__header').evaluate(element => element.remove())
    expect(await geometry(bare)).toEqual({ frame: '16px', panel: '12px', top: 4, left: 4, bottom: 4, right: 4, copyRight: null })
  })

  test('the frame is raised with a subtle edge, and the command plate darkens its panel', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      const block = await sandbox(page, { variant: 'default' })
      const tokens = await block.evaluate((element) => {
        const probe = element.appendChild(document.createElement('i'))
        const paint = (value: string) => { probe.style.color = value; return getComputedStyle(probe).color }
        const values = { raised: paint('var(--color-surface-raised)'), edge: paint('var(--color-border-subtle)'), code: paint('var(--color-code)') }
        probe.remove()
        return values
      })
      await expect(block, colorScheme).toHaveCSS('background-color', tokens.raised)
      await expect(block, colorScheme).toHaveCSS('border-top-color', tokens.edge)
      await expect(block.locator('pre'), colorScheme).toHaveCSS('background-color', tokens.code)

      const command = await sandbox(page, { variant: 'compact', language: 'bash' })
      await expect(command).toHaveAttribute('data-command', 'true')
      const [plate, panel] = await Promise.all([hexOf(command, 'backgroundColor'), hexOf(command.locator('pre'), 'backgroundColor')])
      expect(panel, `${colorScheme} command panel`).not.toBe(plate)
    }
  })

  test('a live example source stays flat and flush with its frame', async ({ page }) => {
    await page.goto('/#/components/card')
    const source = page.locator('.fg-example > .fg-code-block').first()
    await expect(source).toHaveCSS('padding-top', '0px')
    await expect(source).toHaveCSS('border-top-width', '0px')
    await expect(source).toHaveCSS('border-radius', '0px')
    await expect(source.locator('pre')).toHaveCSS('border-radius', '0px')
    await expect(source.locator('pre')).toHaveCSS('border-top-width', '0px')
    const [outer, panel] = await Promise.all([source.boundingBox(), source.locator('pre').boundingBox()])
    expect(panel?.x).toBe(outer?.x)
    expect(panel?.y).toBe(outer?.y)
  })
})

test.describe('quiet action fill', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('a hovering pointer adds a 6% fill, and a press 12%', async ({ page }) => {
    await stubClipboard(page)
    const block = await sandbox(page, { variant: 'default' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    const alpha = () => copy.evaluate(button => getComputedStyle(button).backgroundColor).then(alphaOf)
    await copy.hover()
    await expect.poll(alpha).toBeCloseTo(0.06, 3)
    await page.mouse.down()
    await expect.poll(alpha).toBeCloseTo(0.12, 3)
    await page.mouse.up()
  })
})

test.describe('quiet action fill on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })

  test('a tap leaves no fill behind', async ({ page }) => {
    await stubClipboard(page)
    const block = await sandbox(page, { variant: 'default' })
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false)
    const copy = block.getByRole('button', { name: 'Copy code' })
    await copy.tap()
    await expect(copy).toHaveAttribute('data-copied', '')
    // A touch screen keeps :hover on the tapped button, so a hover fill would stay.
    await expect(copy).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })
})

test.describe('copy feedback', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await page.clock.install()
    await stubClipboard(page)
  })

  test('Copy is muted at rest, shows a tick in the code colour for 1.5s, and a second click restarts the wait', async ({ page }) => {
    const block = await sandbox(page, { variant: 'default' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    const icon = copy.locator('svg path').first()
    const muted = await block.locator('.fg-code-block__language').evaluate(element => getComputedStyle(element).color)
    const codeText = await block.evaluate(element => getComputedStyle(element).color)
    expect(muted).not.toBe(codeText)
    await page.mouse.move(0, 0)
    await expect(copy).toHaveCSS('color', muted)

    await copy.click()
    await expect(icon).toHaveAttribute('d', tick)
    // With the pointer off, only the copied state can hold the text colour.
    await page.mouse.move(0, 0)
    await expect(copy).toHaveCSS('color', codeText)
    await expect(copy).toHaveText('Copy')
    await expect(copy).toHaveAccessibleName('Copy code')
    const status = block.getByRole('status')
    await expect(status).toHaveText('Code copied to clipboard.')
    // The tick shows success, so no "copied" text is visible.
    expect((await status.boundingBox())?.height).toBeLessThanOrEqual(1)

    await page.clock.runFor(1000)
    await copy.click()
    await page.clock.runFor(1000)
    // 2s after the first click: the first wait did not end the second.
    await expect(icon).toHaveAttribute('d', tick)
    await page.clock.runFor(600)
    await expect(copy.locator('rect')).toHaveCount(1)
    await expect(copy).not.toHaveAttribute('data-copied')
    await page.mouse.move(0, 0)
    await expect(copy).toHaveCSS('color', muted)
  })

  test('a failed copy keeps the copy icon and says so', async ({ page }) => {
    const block = await sandbox(page, { variant: 'compact', language: 'bash' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    const status = block.getByRole('status')
    await page.evaluate(() => { (window as unknown as { failCopy: boolean }).failCopy = true })
    await copy.click()
    await expect(status).toHaveText('Could not copy. Select the code to copy it.')
    await expect(status).toBeVisible()
    await expect(copy.locator('rect')).toHaveCount(1)
    // A failure during a tick puts the copy icon back at once.
    await page.evaluate(() => { (window as unknown as { failCopy: boolean }).failCopy = false })
    await copy.click()
    await expect(copy.locator('svg path').first()).toHaveAttribute('d', tick)
    await page.evaluate(() => { (window as unknown as { failCopy: boolean }).failCopy = true })
    await copy.click()
    await expect(status).toHaveText('Could not copy. Select the code to copy it.')
    await expect(copy.locator('rect')).toHaveCount(1)
    await expect(copy).not.toHaveAttribute('data-copied')
  })
})

test('muted Copy at rest reads at 4.5:1 on every code block surface, in light and dark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    const surfaces: [string, () => Promise<Locator>][] = [
      ['header block', () => sandbox(page, { variant: 'default' })],
      ['compact block', () => sandbox(page, { variant: 'compact', language: 'typescript' })],
      ['command plate', () => sandbox(page, { variant: 'compact', language: 'bash' })],
      ['example source', async () => {
        await page.goto('/#/components/card')
        return page.locator('.fg-example > .fg-code-block').first()
      }],
    ]
    for (const [name, open] of surfaces) {
      const block = await open()
      await page.mouse.move(0, 0)
      const copy = block.getByRole('button', { name: 'Copy code' })
      await expect(copy).not.toHaveAttribute('data-copied')
      const [text, surface] = await Promise.all([hexOf(copy, 'color'), hexOf(block, 'backgroundColor')])
      expect(contrast(text, surface), `${colorScheme} ${name}: ${text} on ${surface}`).toBeGreaterThanOrEqual(4.5)
    }
  }
})
