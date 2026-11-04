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
    expect((tab?.x ?? 0) + (tab?.width ?? Infinity), `last tab end at ${width}px`).toBeLessThanOrEqual(button?.x ?? 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
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
