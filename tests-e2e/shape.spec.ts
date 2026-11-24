import { expect, test, type Locator, type Page } from '@playwright/test'

// Shape follows content: a lone icon on its own fill is a circle. See @filipgutica/design-system
// language/decisions.md.

const geometry = (locator: Locator) => locator.evaluate((element) => {
  const { width, height } = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  return {
    width: Math.round(width),
    height: Math.round(height),
    radius: Number.parseFloat(style.borderTopLeftRadius),
    padding: style.paddingInline,
  }
})

// A flex row that stretches its items by default, with an 80px sibling: an icon-only button must
// keep its square box beside it instead of stretching into a tall pill.
const addIconButtonRow = (page: Page) => page.evaluate(() => {
  const icon = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" /></svg>'
  const buttons = (['primary', 'secondary', 'danger'] as const).flatMap(variant => (['sm', 'md', 'lg'] as const).map(size =>
    `<button type="button" class="fg-button" data-icon-only data-variant="${variant}" data-size="${size}" aria-label="Add ${variant} ${size}">${icon}</button>`))
  document.body.insertAdjacentHTML('beforeend', `<div id="icon-row" style="display: flex; gap: 8px; width: 100%">${buttons.join('')}<div style="height: 80px; flex: 1"></div></div>`)
})

test('draws icon-only buttons as circles at every size, 44px on phones, beside a taller sibling', async ({ page }) => {
  await page.goto('/#/components/button')
  await addIconButtonRow(page)
  const buttons = page.locator('#icon-row .fg-button')
  await expect(buttons).toHaveCount(9)
  const sizes = { sm: 28, md: 32, lg: 36 }
  for (const button of await buttons.all()) {
    const size = await button.getAttribute('data-size') as keyof typeof sizes
    const box = await geometry(button)
    expect([box.width, box.height], `${await button.getAttribute('aria-label')} at 1280px`).toEqual([sizes[size], sizes[size]])
    expect(box.radius).toBeGreaterThanOrEqual(box.width / 2)
  }

  await page.setViewportSize({ width: 375, height: 812 })
  for (const button of await buttons.all()) {
    const box = await geometry(button)
    expect([box.width, box.height], `${await button.getAttribute('aria-label')} at 375px`).toEqual([44, 44])
    expect(box.radius).toBeGreaterThanOrEqual(22)
  }
})

test('documents an icon-only Send button as a 28px circle that keeps its name while busy', async ({ page }) => {
  await page.goto('/#/components/button')
  const send = page.locator('.fg-example__stage').getByRole('button', { name: 'Send', exact: true })
  const box = await geometry(send)
  expect([box.width, box.height]).toEqual([28, 28])
  expect(box.radius).toBeGreaterThanOrEqual(14)
  // The labelled button beside it keeps the 8px corner.
  await expect(page.locator('.fg-example__stage').getByRole('button', { name: 'Inspect evidence', exact: true })).toHaveCSS('border-radius', '8px')

  // Busy: the spinner replaces the icon, and the button stays the same circle.
  await send.evaluate(element => element.setAttribute('aria-busy', 'true'))
  await expect(send.locator('svg')).toBeHidden()
  expect(await geometry(send)).toEqual(box)
})
