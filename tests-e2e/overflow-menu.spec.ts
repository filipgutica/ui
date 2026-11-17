import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

const fixture = `/@fs${fileURLToPath(new URL('./fixtures/overflow-menu.html', import.meta.url))}`

const trigger = (page: Page) => page.getByRole('button', { name: 'More actions for API latency' })
const menu = (page: Page) => page.getByRole('menu')
const item = (page: Page, name: string) => page.getByRole('menuitem', { name })

const openWith = async (page: Page, key: string) => {
  await trigger(page).focus()
  await page.keyboard.press(key)
  await expect(menu(page)).toBeVisible()
}

test('follows the menu button keyboard pattern', async ({ page }) => {
  await page.goto(fixture)

  for (const key of ['Enter', ' ', 'ArrowDown']) {
    await openWith(page, key)
    await expect(item(page, 'Rename'), `${key} opens on the first item`).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu(page)).toBeHidden()
    await expect(trigger(page)).toBeFocused()
  }

  await openWith(page, 'ArrowUp')
  await expect(item(page, 'Delete…'), 'Up Arrow opens on the last item').toBeFocused()
  // Down wraps to the first item; the disabled Export is skipped on the way back up.
  await page.keyboard.press('ArrowDown')
  await expect(item(page, 'Rename')).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(item(page, 'Delete…')).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(item(page, 'Duplicate')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(item(page, 'Rename')).toBeFocused()
  await page.keyboard.press('End')
  await expect(item(page, 'Delete…')).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('d')
  await expect(item(page, 'Duplicate'), 'a printable character moves to the next match').toBeFocused()

  await page.keyboard.press('Enter')
  await expect(menu(page)).toBeHidden()
  await expect(page.locator('#selected')).toHaveText('duplicate')
  await expect(trigger(page), 'focus returns to the trigger after an item runs').toBeFocused()
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
})

test('closes on Tab and moves focus on from the trigger', async ({ page }) => {
  await page.goto(fixture)
  await openWith(page, 'Enter')
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(menu(page)).toBeHidden()
  await expect(page.getByRole('button', { name: 'Next control' })).toBeFocused()
})

test('puts the destructive item last, after a separator', async ({ page }) => {
  await page.goto(fixture)
  await openWith(page, 'Enter')
  const rows = await menu(page).locator('> *').evaluateAll(elements =>
    elements.map(element => element.getAttribute('role') === 'separator' ? '---' : element.textContent?.trim()))
  expect(rows).toEqual(['Rename', 'Duplicate', 'Export', '---', 'Delete…'])
  await expect(item(page, 'Export')).toBeDisabled()
})

test('returns focus to the trigger when the confirm dialog an item opens closes', async ({ page }) => {
  await page.goto(fixture)
  await openWith(page, 'ArrowUp')
  await expect(item(page, 'Delete…')).toBeFocused()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Delete monitor' })
  await expect(dialog).toBeVisible()
  await expect(menu(page)).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger(page)).toBeFocused()
})

test.describe('at 390px', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('opens the menu inside the viewport, and above the trigger when there is no room below', async ({ page }) => {
    await page.goto(fixture)
    await trigger(page).tap()
    await expect(menu(page)).toBeVisible()
    const box = (await menu(page).boundingBox())!
    const anchor = (await trigger(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
    expect(box.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
    // Touch size: the trigger and each item grow to --control-lg (44px).
    expect(anchor.height).toBe(44)
    expect((await item(page, 'Rename').boundingBox())!.height).toBe(44)

    await page.keyboard.press('Escape')
    await page.locator('#app').evaluate((element) => { element.style.paddingTop = 'calc(100vh - 64px)' })
    await trigger(page).tap()
    await expect(menu(page)).toBeVisible()
    const above = (await menu(page).boundingBox())!
    const flipped = (await trigger(page).boundingBox())!
    expect(above.y).toBeGreaterThanOrEqual(0)
    expect(above.y + above.height).toBeLessThanOrEqual(flipped.y)
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`axe finds no violations with the menu open in ${colorScheme}`, async ({ page }) => {
    await page.goto(fixture)
    if (colorScheme === 'dark') await page.evaluate(() => document.documentElement.classList.add('dark'))
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 })
      await openWith(page, 'Enter')
      // Highlight the danger item too, so its text colour is checked on the row fill.
      await page.keyboard.press('End')
      const violations = (await new AxeBuilder({ page }).analyze()).violations
        .map(({ id, nodes }) => `${id}: ${nodes.map(node => node.target.join(' ')).join(', ')}`)
      expect(violations).toEqual([])
      await page.keyboard.press('Escape')
    }
  })
}
