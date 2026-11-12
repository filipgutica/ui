import { expect, test } from '@playwright/test'

// Runs in Chromium and WebKit (see playwright.config.ts): WebKit fires no click after a tap on
// the overlay unless UiDrawer handles the tap itself.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test('closes on a tap outside, returns focus to the trigger, and stays open on a tap inside', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/#/sandbox/drawer')
    const trigger = page.locator('.playground-stage').getByRole('button', { name: 'Open drawer' })
    await trigger.tap()
    const drawer = page.getByRole('dialog')
    await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0)

    const inside = (await drawer.locator('.fg-drawer__title').boundingBox())!
    await page.touchscreen.tap(inside.x + 4, inside.y + inside.height / 2)
    await expect(drawer).toHaveAttribute('data-state', 'open')

    const { width } = (await drawer.boundingBox())!
    expect(width).toBeLessThan(370)
    await page.touchscreen.tap(370, 500)
    await expect(drawer).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  }
})
