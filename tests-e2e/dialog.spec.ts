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
      // Legacy external opener: focus returns to the control that had it.
      // A mouse click in WebKit does not focus a button.
      await opener.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Remove theme' })
      await expect(dialog).toBeVisible()
      // Outside the dialog in both layouts, behind the backdrop.
      return { opener, openerCentre: await centre(opener), dialog }
    }

    for (const dismissal of ['Escape', 'close button', 'outside press'] as const) {
      test(`returns focus after pointer opening and ${dismissal}`, async ({ page }) => {
        await page.goto(fixture + '?trigger')
        const opener = page.locator('#app > .fg-button')
        await press(page, await centre(opener))
        const dialog = page.getByRole('dialog', { name: 'Remove theme' })
        await expect(dialog).toBeVisible()

        if (dismissal === 'Escape') await page.keyboard.press('Escape')
        else if (dismissal === 'close button') await press(page, await centre(dialog.getByRole('button', { name: 'Close dialog' })))
        else await press(page, { x: 10, y: 10 })

        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
      })
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

for (const width of [320, 390]) {
  test(`keeps a plain dialog within a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(fixture)
    await page.locator('#app > .fg-button').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const box = (await dialog.boundingBox())!
    expect(box.width).toBeLessThanOrEqual(width)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
  })
}

// A 1280px screenshot fits a desktop viewer, which keeps it above 70% of its size, and stays at full
// size on a phone, where fitting would shrink its text past reading.
for (const { width, height, fits } of [
  { width: 1280, height: 800, fits: true },
  { width: 390, height: 844, fits: false },
]) {
  test(`an image viewer ${fits ? 'fits' : 'pans'} a 1280px screenshot at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto(`${fixture}?image`)
    await page.locator('#app > .fg-button').click()
    const viewer = page.getByRole('dialog', { name: 'Ticket screenshot' })
    await expect(viewer).toBeVisible()
    await expect(viewer.locator('.fg-dialog__footer')).toHaveCount(0)
    const box = (await viewer.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y + box.height).toBeLessThanOrEqual(height)

    const region = viewer.getByRole('region', { name: 'Ticket screenshot' })
    await expect(region).toHaveAttribute('tabindex', '0')
    const image = region.getByRole('img', { name: 'A Ticket with its brief, Progress, and Threads' })
    const shown = (await image.boundingBox())!.width
    const { clientWidth, scrollWidth } = await region.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
    if (fits) {
      expect(shown).toBeLessThanOrEqual(1280)
      expect(shown).toBeGreaterThanOrEqual(1280 * 0.7)
      expect(scrollWidth).toBe(clientWidth)
    } else {
      expect(shown).toBe(1280)
      expect(scrollWidth).toBeGreaterThan(clientWidth)
    }
  })
}
