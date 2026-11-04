import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

// The docs dev server serves this fixture through Vite's /@fs/ route, so it uses the real components.
const fixture = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}`

test('keeps every capture tab clear of the Full size button', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    const capture = page.locator('.fg-capture[data-enhanced="true"]')
    const tabs = capture.getByRole('tablist', { name: 'Steps', exact: true })
    const fullSize = capture.locator('.fg-capture__full')
    const list = await tabs.boundingBox()
    const button = await fullSize.boundingBox()
    expect((list?.x ?? 0) + (list?.width ?? Infinity), `tab list end at ${width}px`).toBeLessThanOrEqual(button?.x ?? 0)

    // The last tab scrolls into the list when the keyboard selects it.
    await capture.getByRole('tab', { name: 'Browse', exact: true }).focus()
    await page.keyboard.press('End')
    const last = capture.getByRole('tab', { name: 'Dry run', exact: true })
    await expect(last).toHaveAttribute('aria-selected', 'true')
    const tab = await last.boundingBox()
    // Scroll positions are whole pixels, so a tab with a fractional width can end within 1px of the button.
    expect((tab?.x ?? 0) + (tab?.width ?? Infinity), `last tab end at ${width}px`).toBeLessThanOrEqual((button?.x ?? 0) + 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('shows a deep-linked capture tab in full on phones', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${fixture}#frame-dry-run`)
    const capture = page.locator('.fg-capture[data-enhanced="true"]')
    const last = capture.getByRole('tab', { name: 'Dry run', exact: true })
    await expect(last).toHaveAttribute('aria-selected', 'true')
    const list = await capture.getByRole('tablist', { name: 'Steps', exact: true }).boundingBox()
    const tab = await last.boundingBox()
    // The same 1px allowance as above: scroll positions are whole pixels.
    expect((tab?.x ?? 0) + (tab?.width ?? Infinity), `Dry run end at ${width}px`).toBeLessThanOrEqual((list?.x ?? 0) + (list?.width ?? 0) + 1)
  }
})

test('draws a focus outline that forced-colors mode keeps on every tab stop', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  for (const url of [fixture, '/#/', '/#/sandbox/select', '/#/sandbox/radio-card-group']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    for (let stop = 0; stop < 16; stop += 1) {
      await page.keyboard.press('Tab')
      const focus = await page.evaluate(() => {
        const element = document.activeElement
        if (!element || element === document.body) return undefined
        return { name: `${element.tagName} ${element.className}`.trim(), outline: getComputedStyle(element).outlineStyle }
      })
      if (focus) expect(focus.outline, `${url} ${focus.name}`).not.toBe('none')
    }
  }
})

test('places the docs shell frame, rail, main, and footer on shared edges', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(fixture)
  const box = async (selector: string) => {
    const bounds = await page.locator(selector).first().boundingBox()
    return { left: Math.round(bounds?.x ?? -1), right: Math.round((bounds?.x ?? 0) + (bounds?.width ?? 0)) }
  }
  expect(await box('.fg-site-header__inner')).toEqual({ left: 32, right: 1248 })
  expect(await box('.fg-site-rail')).toEqual({ left: 32, right: 256 })
  expect((await box('main')).left).toBe(288)
  expect(await box('.fg-site-footer')).toEqual({ left: 32, right: 1248 })
  for (const link of await page.locator('.fg-site-footer a').all())
    expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.querySelector('.fg-site-rail')!.getBoundingClientRect().top))
    .toBe(await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().top))
})

test('colors captures with the default terminal palette unless the site sets its own', async ({ page }) => {
  await page.goto(fixture)
  const accent = page.locator('.fg-capture[data-enhanced="true"] .tf6').first()
  await expect(accent).toHaveCSS('color', 'rgb(95, 211, 217)')
  await expect(page.locator('.fg-capture[data-enhanced="true"] .fg-capture__screen').first()).toHaveCSS('background-color', 'rgb(19, 19, 22)')
  await page.addStyleTag({ content: ':root { --t6: #ff0000; }' })
  await expect(accent).toHaveCSS('color', 'rgb(255, 0, 0)')
})
