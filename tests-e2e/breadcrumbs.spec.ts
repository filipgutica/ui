import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

// Server markup with no mount: the docs dev server serves the fixture through Vite's /@fs/ route.
const fixture = `/@fs${fileURLToPath(new URL('./fixtures/breadcrumbs.html', import.meta.url))}`

const deep = (page: Page) => page.getByRole('navigation', { name: 'Deep trail' })
const short = (page: Page) => page.getByRole('navigation', { name: 'Short trail' })

// The chevron is the ::before of an item or, on phones, of the back link: a 6px box that draws only
// its top and right borders, turned to point forward (45°) or back (-135°). Chromium snaps the 1.5px
// borders to whole pixels, so the check reads which edges draw, not their width.
const chevron = (page: Page, selector: string) => page.locator(selector).evaluate((element) => {
  const style = getComputedStyle(element, '::before')
  if (style.content === 'none') return 'none'
  const edges = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
  const [a = 0, b = 0] = new DOMMatrixReadOnly(style.transform).toFloat64Array()
  const angle = Math.round(Math.atan2(b, a) * 180 / Math.PI)
  return { content: style.content, width: style.width, drawn: edges.map(width => Number.parseFloat(width) > 0), angle }
})

test('shows the full trail, with the current page as text and chevrons that add no text', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(fixture)

  await expect(deep(page)).toMatchAriaSnapshot(`
    - navigation "Deep trail":
      - list:
        - listitem:
          - link "Filip Stack"
        - listitem:
          - link "Skills"
        - listitem: Field Guide
  `)
  await expect(deep(page).locator('[aria-current="page"]')).toHaveText('Field Guide')
  await expect(deep(page).locator('li')).toHaveCount(3)
  for (const item of await deep(page).locator('li').all()) await expect(item).toBeVisible()

  // Each item after the first starts with a chevron that points forward.
  expect(await chevron(page, '[aria-label="Deep trail"] li:nth-child(1)')).toBe('none')
  expect(await chevron(page, '[aria-label="Deep trail"] li:nth-child(2)')).toEqual({
    content: '""', width: '6px', drawn: [true, true, false, false], angle: 45,
  })

  // The fixture page is .fg-site-prose, as on the project sites, whose list links are underlined.
  const link = deep(page).getByRole('link', { name: 'Skills' })
  await expect(link).toHaveCSS('text-decoration-line', 'none')
  expect((await link.boundingBox())?.height).toBe(32)
  await page.setViewportSize({ width: 800, height: 800 })
  expect((await link.boundingBox())?.height).toBe(44)
})

test('Tab reaches the ancestors in order with the focus ring, and skips the current page', async ({ page }) => {
  await page.goto(fixture)
  const focused = () => page.evaluate(() => `${document.activeElement?.closest('nav')?.getAttribute('aria-label')}: ${document.activeElement?.textContent}`)

  await page.keyboard.press('Tab')
  expect(await focused()).toBe('Deep trail: Filip Stack')
  const ring = await deep(page).getByRole('link', { name: 'Filip Stack' }).evaluate((element) => {
    const style = getComputedStyle(element)
    const focus = getComputedStyle(document.documentElement).getPropertyValue('--color-focus').trim()
    const probe = document.createElement('span')
    probe.style.color = focus
    document.body.append(probe)
    const focusColor = getComputedStyle(probe).color
    probe.remove()
    return { style: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, matchesFocus: style.outlineColor === focusColor }
  })
  expect(ring).toEqual({ style: 'solid', width: '2px', offset: '3px', matchesFocus: true })
  await page.keyboard.press('Tab')
  expect(await focused()).toBe('Deep trail: Skills')
  await page.keyboard.press('Tab')
  expect(await focused()).toBe('Short trail: Filip Stack')
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
})

test('on phones a trail of three or more shows only the parent, as a back link', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 800 })
  await page.goto(fixture)

  await expect(deep(page)).toMatchAriaSnapshot(`
    - navigation "Deep trail":
      - list:
        - listitem:
          - link "Skills"
  `)
  await expect(deep(page).getByRole('link', { name: 'Filip Stack' })).toBeHidden()
  await expect(deep(page).locator('[aria-current="page"]')).toBeHidden()
  // The back chevron is inside the link and points back; the item drops its separator.
  expect(await chevron(page, '[aria-label="Deep trail"] li:nth-child(2) a')).toEqual({
    content: '""', width: '6px', drawn: [true, true, false, false], angle: -135,
  })
  expect(await chevron(page, '[aria-label="Deep trail"] li:nth-child(2)')).toBe('none')

  // Two crumbs fit, so the short trail shows in full.
  await expect(short(page).getByRole('link', { name: 'Filip Stack' })).toBeVisible()
  await expect(short(page).locator('[aria-current="page"]')).toBeVisible()

  await page.setViewportSize({ width: 641, height: 800 })
  await expect(deep(page).getByRole('link', { name: 'Filip Stack' })).toBeVisible()
  await expect(deep(page).locator('[aria-current="page"]')).toBeVisible()
})

test('has no accessibility violations at desktop and phone widths', async ({ page }) => {
  await page.goto(fixture)
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 })
    const violations = (await new AxeBuilder({ page }).analyze()).violations
      .map(({ id, nodes }) => `${id}: ${nodes.map(node => node.target.join(' ')).join(', ')}`)
    expect(violations).toEqual([])
  }
})
