import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const fixture = `/@fs${fileURLToPath(new URL('./fixtures/dialog.html', import.meta.url))}`

type Press = (page: Page, point: { x: number, y: number }) => Promise<void>

// Runs in Chromium and WebKit (see playwright.config.ts): WebKit fires no click after a tap on
// reka's overlay unless UiDialog gives it something to click.
const modes: { name: string, use: Parameters<typeof test.use>[0], press: Press }[] = [
  {
    name: 'at 390px with touch',
    use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    press: (page, { x, y }) => page.touchscreen.tap(x, y),
  },
  {
    name: 'on desktop with a mouse',
    use: { viewport: { width: 1280, height: 800 } },
    press: (page, { x, y }) => page.mouse.click(x, y),
  },
]

const centre = async (locator: ReturnType<Page['locator']>) => {
  const box = (await locator.boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

for (const { name, use, press } of modes) {
  test.describe(name, () => {
    test.use(use)

    const openDialog = async (page: Page, query = '') => {
      await page.goto(fixture + query)
      // By CSS: while the dialog is open, the page behind it, the opener included, is aria-hidden.
      const opener = page.locator('#app > .fg-button')
      await expect(opener).toHaveText('Open dialog')
      // From a focused control, as the docs ask: UiDialog has no trigger, so focus returns to the
      // control that had it. A mouse click in WebKit does not focus a button.
      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Remove theme' })
      await expect(dialog).toBeVisible()
      // Outside the dialog in both layouts, behind the backdrop.
      return { opener, openerCentre: await centre(opener), dialog }
    }

    test('closes on a press outside, returns focus to the opener, and stays open on a press inside', async ({ page }) => {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        await page.emulateMedia({ reducedMotion })
        const { opener, openerCentre, dialog } = await openDialog(page)

        await press(page, await centre(dialog.locator('.fg-dialog__title')))
        await expect(dialog).toHaveAttribute('data-state', 'open')

        // On the opener, behind the backdrop: a click that reaches it would open the dialog again.
        await press(page, openerCentre)
        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
        await page.waitForTimeout(400)
        await expect(dialog).toBeHidden()
      }
    })

    test('stays open on a press outside when the page cancels outside presses', async ({ page }) => {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        await page.emulateMedia({ reducedMotion })
        const { openerCentre, dialog } = await openDialog(page, '?guard')
        await press(page, openerCentre)
        // Long enough for the click that reka waits for after a touch.
        await page.waitForTimeout(400)
        await expect(dialog).toHaveAttribute('data-state', 'open')
      }
    })
  })
}

test.describe('with a mouse', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('stays open when a press starts inside and ends outside', async ({ page }) => {
    await page.goto(fixture)
    await page.locator('#app > .fg-button').click()
    const dialog = page.getByRole('dialog', { name: 'Remove theme' })
    const title = await centre(dialog.locator('.fg-dialog__title'))
    await page.mouse.move(title.x, title.y)
    await page.mouse.down()
    await page.mouse.move(10, 10, { steps: 4 })
    await page.mouse.up()
    await expect(dialog).toHaveAttribute('data-state', 'open')
  })
})
