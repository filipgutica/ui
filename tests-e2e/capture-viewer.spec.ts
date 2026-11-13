import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const fixture = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}`

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'light' })

for (const width of [320, 390]) {
  test(`keeps the capture viewer within a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(fixture)
    await page.locator('.fg-capture__full').tap()
    const viewer = page.getByRole('dialog')
    await expect(viewer).toBeVisible()
    const box = (await viewer.boundingBox())!
    expect(box.width).toBeLessThanOrEqual(width)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  })
}

for (const opener of ['.fg-capture__full', '.fg-capture__expand']) {
  for (const dismissal of ['Escape', 'close button', 'outside tap'] as const) {
    test(`returns focus to Full size after ${opener} and ${dismissal}`, async ({ page }) => {
      await page.goto(fixture)
      await page.locator(opener).filter({ visible: true }).tap()
      const viewer = page.getByRole('dialog')
      await expect(viewer).toBeVisible()
      if (dismissal === 'Escape') await page.keyboard.press('Escape')
      else if (dismissal === 'close button') await viewer.getByRole('button', { name: 'Close dialog' }).tap()
      else await page.touchscreen.tap(10, 10)
      await expect(viewer).toBeHidden()
      await expect(page.locator('.fg-capture__full')).toBeFocused()
    })
  }
}
