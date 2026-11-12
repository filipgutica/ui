import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const fixture = `/@fs${fileURLToPath(new URL('./fixtures/drawer.html', import.meta.url))}`

// Runs in Chromium and WebKit (see playwright.config.ts): WebKit fires no click after a tap on
// reka's overlay unless UiDrawer gives it something to click.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

const openDrawer = async (page: Page, query = '') => {
  await page.goto(fixture + query)
  // By CSS: while the drawer is open, the page behind it, the trigger included, is aria-hidden.
  const trigger = page.locator('#app > .fg-button')
  await expect(trigger).toHaveText('Open drawer')
  await trigger.tap()
  const drawer = page.getByRole('dialog', { name: 'Navigation' })
  await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0)
  expect((await drawer.boundingBox())!.width).toBeLessThan(370)
  return { trigger, drawer }
}

test('closes on a tap outside, returns focus to the trigger, and stays open on a tap inside', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion })
    const { trigger, drawer } = await openDrawer(page)

    const inside = (await drawer.locator('.fg-drawer__title').boundingBox())!
    await page.touchscreen.tap(inside.x + 4, inside.y + inside.height / 2)
    await expect(drawer).toHaveAttribute('data-state', 'open')

    await page.touchscreen.tap(370, 500)
    await expect(drawer).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  }
})

test('stays open on a tap outside when the page cancels outside presses', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion })
    const { trigger, drawer } = await openDrawer(page, '?guard')
    await page.touchscreen.tap(370, 500)
    // Long enough for the click that reka waits for after a touch.
    await page.waitForTimeout(400)
    await expect(drawer).toHaveAttribute('data-state', 'open')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  }
})
