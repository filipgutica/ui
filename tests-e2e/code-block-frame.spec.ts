import { fileURLToPath } from 'node:url'

import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { contrast } from '../tests/contrast.js'

// The code block, quiet action, and copy feedback of @filipgutica/design-system 1.0.5, measured in
// the browser as the catalogue's tests/catalogue/catalogue.spec.ts measures them.

const tick = 'M3.5 8.5l3 3 6-7'
const codeFixture = `/@fs${fileURLToPath(new URL('./fixtures/code-block.html', import.meta.url))}`

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

test.describe('Wrap lines', () => {
  test('wraps a long URL without moving its line number or changing the copied source', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width: 375, height: 900 })
    await page.goto(codeFixture)
    const panel = page.getByLabel('Runbook', { exact: true })
    const block = page.locator('.fg-code-block').filter({ has: panel })
    const toggle = block.getByRole('button', { name: 'Wrap lines' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    const command = page.locator('.fg-code-block[data-command="true"]')
    const commandToggle = command.getByRole('button', { name: 'Wrap lines' })
    const horizontalOverflow = () => panel.evaluate(element => element.scrollWidth - element.clientWidth)
    const source = await panel.locator('.fg-code-block__text').allTextContents()

    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(horizontalOverflow).toBeGreaterThan(0)
    await expect(commandToggle).toHaveAttribute('aria-pressed', 'false')

    await toggle.focus()
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(horizontalOverflow).toBe(0)
    await expect(commandToggle).toHaveAttribute('aria-pressed', 'false')
    const firstLine = panel.locator('.fg-code-block__line').first()
    expect(await firstLine.evaluate(line => {
      const number = line.querySelector('.fg-code-block__number')!.getBoundingClientRect()
      const text = line.querySelector('.fg-code-block__text')!.getBoundingClientRect()
      return text.height > number.height && Math.abs(number.top - text.top) < 1
    })).toBe(true)

    await page.keyboard.press('Tab')
    await expect(copy).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(block.getByRole('status')).toHaveText('Code copied to clipboard.')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source.join(''))
    await page.keyboard.press('Tab')
    await expect(panel).toBeFocused()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(horizontalOverflow).toBeGreaterThan(0)
    // Copy gives the same source with wrapping off.
    await page.evaluate(() => navigator.clipboard.writeText(''))
    await copy.click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source.join(''))
  })

  test('sizes the toggle and spaces it from Copy on desktop and phones', async ({ page }) => {
    await page.goto(codeFixture)
    const block = page.locator('.fg-code-block').first()
    const toggle = block.getByRole('button', { name: 'Wrap lines' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    await expect(toggle).toBeVisible()
    for (const { width, size } of [{ width: 1280, size: 32 }, { width: 375, size: 44 }]) {
      await page.setViewportSize({ width, height: 900 })
      const toggleRect = (await toggle.boundingBox())!
      const copyRect = (await copy.boundingBox())!
      expect([toggleRect.width, toggleRect.height], `toggle at ${width}px`).toEqual([size, size])
      expect(copyRect.x - (toggleRect.x + toggleRect.width), `gap at ${width}px`).toBe(4)
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    const color = () => toggle.evaluate(button => getComputedStyle(button).color)
    const muted = await color()
    const codeText = await block.evaluate(element => getComputedStyle(element).color)
    expect(muted).not.toBe(codeText)
    await toggle.hover()
    await expect.poll(color).toBe(codeText)
    await toggle.click()
    await page.mouse.move(0, 0)
    await expect.poll(color).toBe(codeText)
    await expect.poll(() => toggle.evaluate(button => getComputedStyle(button).backgroundColor).then(alphaOf)).toBeCloseTo(0.06, 3)
  })

  test('keeps a Highlight border and icon while pressed in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await page.goto(codeFixture)
    const toggle = page.getByRole('button', { name: 'Wrap lines' }).first()
    await expect(toggle).toBeVisible()
    const highlight = await page.evaluate(() => {
      const probe = document.createElement('span')
      probe.style.cssText = 'color: Highlight; forced-color-adjust: none'
      document.body.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    await expect(toggle).not.toHaveCSS('border-top-color', highlight)
    await toggle.click()
    for (const hovered of [false, true]) {
      if (hovered) await toggle.hover()
      else await page.mouse.move(0, 0)
      await expect(toggle).toHaveCSS('border-top-color', highlight)
      await expect(toggle.locator('svg path')).toHaveCSS('stroke', highlight)
    }
  })
})

test.describe('code block frame', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('sizes labelled Copy without vertical padding on desktop and phones', async ({ page }) => {
    const block = await sandbox(page, { variant: 'default' })
    const copy = block.getByRole('button', { name: 'Copy code' })
    await expect(copy).toHaveText('Copy')
    for (const { width, size } of [{ width: 375, size: 44 }, { width: 1280, size: 32 }]) {
      await page.setViewportSize({ width, height: 900 })
      const geometry = await copy.evaluate(button => ({
        height: button.getBoundingClientRect().height,
        padding: getComputedStyle(button).padding,
      }))
      expect.soft(geometry, `labelled Copy at ${width}px`).toEqual({ height: size, padding: '0px 6px' })
    }
  })

  test('the source is an 8px panel 4px inside a 12px frame, with a 4px gap beside compact Copy', async ({ page }) => {
    const header = await sandbox(page, { variant: 'default' })
    expect(await geometry(header)).toEqual({ frame: '12px', panel: '8px', top: 0, left: 4, bottom: 4, right: 4, copyRight: null })
    for (const language of ['typescript', 'bash']) {
      const compact = await sandbox(page, { variant: 'compact', language })
      expect(await geometry(compact), language).toEqual({ frame: '12px', panel: '8px', top: 4, left: 4, bottom: 4, right: 4, copyRight: 4 })
    }
    // Without Copy or actions there is no header, so no gap: the panel sits 4px from the frame on every side.
    const bare = await sandbox(page, { variant: 'compact', language: 'typescript' })
    await bare.locator(':scope > .fg-code-block__header').evaluate(element => element.remove())
    expect(await geometry(bare)).toEqual({ frame: '12px', panel: '8px', top: 4, left: 4, bottom: 4, right: 4, copyRight: null })
  })

  test('the frame is raised with a subtle edge, and a command uses the same frame, well, and edge', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      // Wait for the scheme class before reading tokens; see the Copy contrast test below.
      await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/)
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
      await expect(command, `${colorScheme} command`).toHaveCSS('background-color', tokens.raised)
      await expect(command, `${colorScheme} command`).toHaveCSS('border-top-color', tokens.edge)
      await expect(command.locator('pre'), `${colorScheme} command`).toHaveCSS('background-color', tokens.code)
    }
  })

  test('the command aliases still restyle only commands', async ({ page }) => {
    const command = await sandbox(page, { variant: 'compact', language: 'bash' })
    await expect(command).toHaveAttribute('data-command', 'true')
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--color-command-bg', 'rgb(1, 2, 3)')
      document.documentElement.style.setProperty('--color-command-border', 'rgb(4, 5, 6)')
    })
    await expect(command.locator('pre')).toHaveCSS('background-color', 'rgb(1, 2, 3)')
    await expect(command).toHaveCSS('border-top-color', 'rgb(4, 5, 6)')
    // The same block as typed source, on the same page, keeps the code well and edge.
    await page.getByLabel('Language', { exact: true }).selectOption('typescript')
    await expect(command).not.toHaveAttribute('data-command', 'true')
    await expect(command.locator('pre')).not.toHaveCSS('background-color', 'rgb(1, 2, 3)')
    await expect(command).not.toHaveCSS('border-top-color', 'rgb(4, 5, 6)')
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
    // The site applies the scheme as a .dark class after the media change. A Copy mounted before the
    // class lands transitions from the other scheme's muted colour, so wait for it before opening a
    // surface. On the first pass the page is still about:blank, so the light check passes at once.
    await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/)
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
