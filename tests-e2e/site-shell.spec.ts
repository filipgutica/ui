import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import type { Browser, Locator, Page } from '@playwright/test'

// The site fixture with headerMenu and Find on the rail, as the catalogue's shell has them.
const site = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}`
const fixture = `${site}?shell&find`
// The design system site's header: a long project name and five pages, with Find on the rail.
const pagesFixture = `${site}?pages&find`
const railLinks = (page: Page) => page.locator('.fg-site-rail__nav a:visible')
const find = (page: Page) => page.getByRole('searchbox', { name: 'Find a section' })
const status = (page: Page) => page.locator('.fg-site-find [role="status"]')
const trigger = (page: Page) => page.getByRole('button', { name: /^On this page/ })
const box = async (locator: Locator) => (await locator.boundingBox())!
// The computed --color-text, read from a probe in the element's context.
const textColor = (locator: Locator) => locator.evaluate((element) => {
  const probe = document.createElement('span')
  probe.style.color = 'var(--color-text)'
  element.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
})

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('Find filters the rail and shows the empty state', async ({ page }) => {
    await page.goto(fixture)
    // Every word must appear in a row's label, its group's label, or its own terms.
    await find(page).fill('comm')
    await expect(railLinks(page)).toHaveText(['Commands'])
    await expect(page.locator('.fg-site-rail__group:visible .fg-site-rail__group-label')).toHaveText(['Reference'])
    await expect(status(page)).toHaveText('1 match')
    await find(page).fill('start')
    await expect(railLinks(page)).toHaveText(['Install', 'From review to agent', 'Start with the guide'])
    await find(page).fill('cli flags')
    await expect(railLinks(page)).toHaveText(['Commands'])
    await find(page).fill('tooltip')
    await expect(railLinks(page)).toHaveCount(0)
    // The quotes come from the q element's CSS.
    await expect(page.locator('.fg-site-find__empty p')).toHaveText('No section matches tooltip.')
    await expect(page.locator('.fg-site-find__empty q')).toHaveText('tooltip')
    await expect(status(page)).toHaveText('No matches')
    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(find(page)).toBeFocused()
    await expect(find(page)).toHaveValue('')
    await expect(page.locator('.fg-site-find__empty')).toBeHidden()
    await expect(railLinks(page)).toHaveCount(4)
  })

  test('Enter goes to the first match, and Escape clears the query before it leaves the field', async ({ page }) => {
    await page.goto(fixture)
    await find(page).fill('comm')
    await find(page).press('Escape')
    await expect(find(page)).toHaveValue('')
    await expect(find(page)).toBeFocused()
    await find(page).press('Escape')
    await expect(find(page)).not.toBeFocused()
    await find(page).fill('comm')
    await find(page).press('ArrowDown')
    await expect(page.locator('.fg-site-rail__nav a', { hasText: 'Commands' })).toBeFocused()
    // Keys that choose an input method's candidate belong to the composition, not to Find.
    await find(page).fill('comm')
    for (const init of [{ key: 'Enter', isComposing: true }, { key: 'Enter', keyCode: 229 }, { key: 'ArrowDown', isComposing: true }, { key: 'Escape', isComposing: true }]) {
      const prevented = await find(page).evaluate((element, eventInit) => !element.dispatchEvent(new KeyboardEvent('keydown', { ...eventInit, bubbles: true, cancelable: true })), init)
      expect(prevented, JSON.stringify(init)).toBe(false)
    }
    await expect(find(page)).toBeFocused()
    await expect(find(page)).toHaveValue('comm')
    expect(new URL(page.url()).hash).toBe('')
    await find(page).press('Enter')
    await expect(page).toHaveURL(/#commands$/)
    await expect(page.locator('#commands')).toBeFocused()
  })

  test('/ focuses Find, types normally in a field, and does nothing once shortcuts are off', async ({ page }) => {
    await page.goto(fixture)
    await expect(find(page)).toHaveAttribute('aria-keyshortcuts', '/')
    await page.keyboard.press('/')
    await expect(find(page)).toBeFocused()
    await page.keyboard.press('/')
    await expect(find(page), 'a / inside a field is typed').toHaveValue('/')
    await find(page).fill('')
    const shortcuts = page.getByRole('switch', { name: 'Single-key shortcuts' })
    await shortcuts.click()
    await expect(shortcuts).toHaveAttribute('aria-checked', 'false')
    await expect(find(page)).not.toHaveAttribute('aria-keyshortcuts')
    await expect(page.locator('.fg-site-find__key')).toHaveCount(0)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('/')
    await expect(find(page)).not.toBeFocused()
    // The choice is saved.
    await page.reload()
    await expect(page.getByRole('switch', { name: 'Single-key shortcuts' })).toHaveAttribute('aria-checked', 'false')
  })

  test('a page hooks its own content into Find through window.findScope', async ({ page }) => {
    await page.goto(fixture)
    await page.evaluate(() => {
      window.findScope = {
        filter: words => ({ count: words.length ? 7 : 0, one: 'token', many: 'tokens' }),
        keeps: link => link.hash === '#install',
      }
    })
    await find(page).fill('anything')
    await expect(railLinks(page)).toHaveText(['Install'])
    await expect(status(page)).toHaveText('7 tokens')
  })

  test('sets rail rows in the UI face, and Find replaces the visible rail heading', async ({ page }) => {
    await page.goto(fixture)
    const face = (selector: string) => page.locator(selector).first().evaluate(element => getComputedStyle(element).fontFamily)
    expect(await face('.fg-site-rail__nav a')).toBe(await face('body'))
    expect(await face('.fg-site-projects__menu a')).toMatch(/Mono/)
    // The heading still names the navigation.
    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible()
    expect((await page.locator('.fg-site-rail__label').boundingBox())!.height).toBeLessThanOrEqual(1)
    // The shortcut switch label is --text-sm, as the rail footer is.
    await expect(page.locator('.fg-site-rail__foot label')).toHaveCSS('font-size', '13px')
  })

  test('marks the current header link as a navigation strip row', async ({ page }) => {
    await page.goto(fixture)
    const current = page.locator('.fg-site-header__links a[aria-current="page"]')
    await expect(current).toHaveText('Guide')
    await expect(current).toHaveCSS('border-radius', '6px')
    await expect(current).toHaveCSS('min-height', '44px')
    const fill = await current.evaluate((element) => {
      const probe = document.createElement('span')
      probe.style.backgroundColor = 'var(--color-nav-current)'
      element.after(probe)
      const color = getComputedStyle(probe).backgroundColor
      probe.remove()
      return color
    })
    await expect(current).toHaveCSS('background-color', fill)
    await expect(page.locator('.fg-site-header__links a:not([aria-current])').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })

  test('keeps the desktop header and rail where they were before the phone shell changed', async ({ page }) => {
    await page.goto(fixture)
    // Layout constants measured on main before the change; they do not depend on text widths.
    expect(await box(page.locator('.fg-site-header'))).toEqual({ x: 32, y: 0, width: 1216, height: 65 })
    const projects = await box(page.locator('.fg-site-projects'))
    expect([projects.x, projects.y, projects.height]).toEqual([32, 10, 44])
    expect(await box(page.locator('.fg-site-header .fg-segmented'))).toEqual({ x: 1114, y: 9, width: 134, height: 46 })
    for (const link of await page.locator('.fg-site-header__links a').all()) expect((await box(link)).y).toBe(10)
    const rail = await box(page.locator('.fg-site-rail'))
    expect([rail.x, rail.y, rail.width]).toEqual([32, 65, 224])
    const main = await box(page.locator('main'))
    expect([main.x, main.y, main.width]).toEqual([288, 65, 960])
    await expect(find(page)).toBeVisible()
    await expect(trigger(page)).toHaveCount(0)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const width of [390, 320]) {
    test(`stacks the switcher and picker, then the strip, then the trigger 8px below the rule at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(pagesFixture)
      const header = page.locator('.fg-site-header')
      const projects = await box(page.locator('.fg-site-projects'))
      const picker = await box(header.locator('.fg-segmented'))
      const strip = await box(page.getByRole('navigation', { name: 'Site links' }))
      const rule = await box(header)
      const button = await box(trigger(page))
      const inner = await box(header.locator('.fg-site-header__inner'))
      const gutter = await header.locator('.fg-site-header__inner').evaluate(element => Number.parseFloat(getComputedStyle(element).paddingInlineStart))
      const columnGap = await header.locator('.fg-site-header__inner').evaluate(element => Number.parseFloat(getComputedStyle(element).columnGap))
      // The picker shares the first row only where the switcher and the picker both fit.
      const fits = projects.width + columnGap + picker.width <= inner.width - 2 * gutter
      if (fits) {
        expect(Math.abs(picker.y + picker.height / 2 - (projects.y + projects.height / 2))).toBeLessThanOrEqual(1)
        expect(picker.x + picker.width).toBeCloseTo(inner.x + inner.width - gutter, 0)
      } else {
        // It wraps to its own row, at the start, --space-2 below the switcher.
        expect(picker.x).toBeCloseTo(projects.x, 0)
        expect(picker.y).toBeGreaterThanOrEqual(projects.y + projects.height + 8 - 1)
      }
      expect(fits, 'the design system site name and the picker fit at 390px, not at 320px').toBe(width === 390)
      // The project name never truncates.
      const name = page.locator('.fg-site-projects__trigger span')
      await expect(name).toHaveText('Design system')
      expect(await name.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      // The strip takes the next row, --space-2 below the first rows and above the rule.
      const rowsBottom = Math.max(projects.y + projects.height, picker.y + picker.height)
      expect(strip.y - rowsBottom).toBeCloseTo(8, 0)
      expect(rule.y + rule.height - 1 - (strip.y + strip.height)).toBeCloseTo(8, 0)
      // The rule below the header is a solid 1px line in the text colour.
      await expect(header).toHaveCSS('border-bottom-style', 'solid')
      await expect(header).toHaveCSS('border-bottom-width', '1px')
      await expect(header).toHaveCSS('border-bottom-color', await textColor(header))
      // The labelled trigger sits at the start, --space-2 below the rule, and is the page's only one.
      expect(button.y - (rule.y + rule.height)).toBeCloseTo(8, 0)
      expect(button.x).toBeCloseTo(projects.x, 0)
      await expect(trigger(page)).toHaveCount(1)
      await expect(header.locator('button:not(.fg-segmented__item)')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Find a section' })).toHaveCount(0)
      // The header is static: it scrolls away with the page.
      await page.mouse.wheel(0, 600)
      await expect.poll(() => header.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    })
  }

  test('fades the clipped strip and keeps at least 16px of a clipped link in view at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto(pagesFixture)
    const strip = page.getByRole('navigation', { name: 'Site links' })
    await expect(strip).toHaveAttribute('data-clip', 'end')
    await expect(strip).toHaveCSS('scrollbar-width', 'none')
    const shown = await strip.evaluate((element) => {
      const edge = element.getBoundingClientRect()
      return [...element.querySelectorAll('a')].map((link) => {
        const { left, right, width } = link.getBoundingClientRect()
        return { label: link.textContent, width, inside: Math.min(right, edge.right) - Math.max(left, edge.left) }
      })
    })
    expect(shown.some(({ inside, width }) => inside > 0 && inside < width - 0.5), 'a link is clipped at 320px').toBe(true)
    for (const { label, inside, width } of shown) if (inside > 0 && inside < width - 0.5) expect(inside, `${label} shows ${inside}px`).toBeGreaterThanOrEqual(16)
    // Scrolled to the end, only the start fades.
    await strip.evaluate((element) => { element.scrollLeft = element.scrollWidth })
    await expect(strip).toHaveAttribute('data-clip', 'start')
  })

  test('keeps a tool site\'s two links on the strip row, below the switcher and the picker', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(`${site}?tool`)
      const projects = await box(page.locator('.fg-site-projects'))
      const picker = await box(page.locator('.fg-site-header .fg-segmented'))
      const links = page.getByRole('navigation', { name: 'Site links' })
      await expect(links.getByRole('link')).toHaveText(['GitHub', 'Releases'])
      expect(Math.abs(picker.y + picker.height / 2 - (projects.y + projects.height / 2)), `picker beside annoterm at ${width}px`).toBeLessThanOrEqual(1)
      expect((await box(links)).y, `links below the first row at ${width}px`).toBeGreaterThanOrEqual(picker.y + picker.height)
      await expect(links).not.toHaveAttribute('data-clip')
    }
  })

  test('opens the drawer from the left with Find pinned above the groups, and no pages or appearance', async ({ page }) => {
    await page.goto(`${fixture}#commands`)
    await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'dialog')
    // Focus it where the page is, as Tab would after a jump, so the section in view stays current.
    await trigger(page).evaluate(element => element.focus({ preventScroll: true }))
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'On this page', exact: true })
    await expect(drawer).toBeVisible()
    await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0)
    // A keyboard open focuses the current row.
    const current = drawer.locator('.fg-site-rail__nav [aria-current="location"]')
    await expect(current).toHaveText('Commands')
    await expect(current).toBeFocused()
    // Find, the groups, and the shortcut switch; the header keeps its pages and the picker.
    await expect(drawer.getByRole('searchbox', { name: 'Find a section' })).toBeVisible()
    await expect(drawer.locator('.fg-site-rail__nav a')).toHaveText(['Install', 'From review to agent', 'Start with the guide', 'Commands'])
    await expect(drawer.getByRole('navigation', { name: 'Site links' })).toHaveCount(0)
    await expect(drawer.getByRole('group', { name: 'Color theme' })).toHaveCount(0)
    await expect(drawer.locator('.fg-drawer__body > .fg-site-rail__content > :visible')).toHaveCount(3)
    // Find stays at the top of the body while the rows scroll under it.
    await expect(drawer.locator('.fg-site-find')).toHaveCSS('position', 'sticky')
    expect((await box(drawer)).width).toBeCloseTo(272, 0)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger(page)).toBeFocused()
    // A tap focuses the drawer itself, and no ring shows.
    await trigger(page).click()
    await expect(drawer).toBeFocused()
    await expect(drawer).toHaveCSS('outline-style', 'none')
    await drawer.getByRole('link', { name: 'Install' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.locator('#install')).toBeFocused()
    await expect(page).toHaveURL(/#install$/)
  })

  test('/ opens the drawer on Find, and the first Escape clears the query instead of closing it', async ({ page }) => {
    await page.goto(fixture)
    await page.keyboard.press('/')
    const drawer = page.getByRole('dialog', { name: 'On this page', exact: true })
    await expect(drawer).toBeVisible()
    await expect(find(page)).toBeFocused()
    await page.keyboard.type('comm')
    await expect(railLinks(page)).toHaveText(['Commands'])
    await page.keyboard.press('Escape')
    await expect(find(page)).toHaveValue('')
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger(page)).toBeFocused()
  })

  test('the trigger label follows the section, and a wrapped label grows the button', async ({ page }) => {
    await page.goto(fixture)
    await expect(trigger(page)).toHaveText('On this page: Install')
    await page.goto(`${fixture}#commands`)
    await expect(trigger(page)).toHaveText('On this page: Commands')
    await expect(trigger(page)).toHaveAccessibleName('On this page: Commands')
    // The glyph: 14×10, --space-3 before the label, on a 10px field corner.
    await expect(trigger(page)).toHaveCSS('border-radius', '10px')
    await expect(trigger(page)).toHaveCSS('column-gap', '12px')
    expect(await trigger(page).evaluate((element) => {
      const glyph = getComputedStyle(element, '::before')
      return [glyph.width, glyph.height]
    })).toEqual(['14px', '10px'])
    expect((await box(trigger(page))).height).toBeCloseTo(44, 0)
    await trigger(page).evaluate((element) => { element.textContent = 'On this page: a section name long enough to wrap onto a second line' })
    const wrapped = await box(trigger(page))
    const text = await trigger(page).evaluate((element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const { top, bottom } = range.getBoundingClientRect()
      return { top, bottom }
    })
    expect(wrapped.height).toBeGreaterThan(44)
    expect(text.top - wrapped.y).toBeGreaterThanOrEqual(8)
    expect(wrapped.y + wrapped.height - text.bottom).toBeGreaterThanOrEqual(8)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test('a tap opens the drawer on the drawer itself, even when Find has hidden the current row', async ({ page }) => {
    await page.goto(fixture)
    const drawer = page.getByRole('dialog', { name: 'On this page', exact: true })
    await trigger(page).click()
    await find(page).fill('comm')
    await expect(drawer.locator('.fg-site-rail__nav [aria-current]:visible')).toHaveCount(0)
    await drawer.getByRole('button', { name: 'Close drawer' }).click()
    await expect(drawer).toBeHidden()
    await trigger(page).click()
    await expect(drawer).toBeFocused()
    await expect(find(page)).not.toBeFocused()
  })

  test('clears the strip fade when late web fonts make the links fit', async ({ page }) => {
    // Hold the fonts back, so the strip is first measured in the fallback face.
    let release = (): void => {}
    const held = new Promise<void>((resolve) => { release = resolve })
    await page.route('**/*.woff2', async (route) => {
      await held
      await route.continue()
    })
    await page.setViewportSize({ width: 720, height: 844 })
    // The load event waits for the fonts, so do not wait for it.
    await page.goto(pagesFixture, { waitUntil: 'domcontentloaded' })
    const strip = page.getByRole('navigation', { name: 'Site links' })
    const overflow = () => strip.evaluate(element => element.scrollWidth - element.clientWidth)
    await expect(strip).toHaveAttribute('data-clip', 'end')
    expect(await overflow()).toBeGreaterThan(12)
    release()
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(overflow).toBeLessThanOrEqual(12)
    await expect(strip).not.toHaveAttribute('data-clip')
  })

  test('opening the drawer mid-page and closing it keeps the reader\'s position', async ({ page }) => {
    await page.goto(`${fixture}#commands`)
    const before = await page.evaluate(() => scrollY)
    expect(before).toBeGreaterThan(0)
    await page.keyboard.press('/')
    const drawer = page.getByRole('dialog', { name: 'On this page', exact: true })
    await expect(find(page)).toBeFocused()
    expect(await page.evaluate(() => scrollY)).toBe(before)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    // Focus returns to the trigger above the page without scrolling to it.
    await expect(trigger(page)).toBeFocused()
    expect(await page.evaluate(() => scrollY)).toBe(before)
  })
})

test.describe('without JavaScript', () => {
  // The fixture's server markup, with the styles the dev server injected, loaded where scripts do not run.
  const staticPage = async ({ browser, page, query, width }: { browser: Browser; page: Page; query: string; width: number }) => {
    await page.goto(`${site}?${query}&static`)
    await expect(page.locator('.fg-site-rail')).toBeAttached()
    const html = (await page.content()).replace(/<script\b[\s\S]*?<\/script>/g, '')
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } })
    const noScript = await context.newPage()
    await noScript.setContent(html)
    return { context, noScript }
  }

  for (const width of [320, 390, 1280]) {
    test(`with headerMenu, every row stays in place and Find is hidden at ${width}px`, async ({ browser, page }) => {
      const { context, noScript } = await staticPage({ browser, page, query: 'shell&find', width })
      const links = noScript.locator('.fg-site-rail__nav a')
      await expect(links).toHaveCount(4)
      for (const link of await links.all()) await expect(link).toBeVisible()
      await expect(noScript.locator('.fg-site-find')).toHaveCount(0)
      await expect(noScript.locator('.fg-site-rail__summary')).toBeHidden()
      await expect(noScript.locator('.fg-site-rail button:visible')).toHaveCount(0)
      for (const link of await noScript.locator('.fg-site-header__links a').all()) await expect(link).toBeVisible()
      // The rail stays between the header and main.
      const rail = (await noScript.locator('.fg-site-rail').boundingBox())!
      const header = (await noScript.locator('.fg-site-header').boundingBox())!
      expect(rail.y).toBeGreaterThanOrEqual(header.y + header.height)
      await context.close()
    })
  }

  test('without headerMenu, the trigger is a details summary with a chevron at 390px', async ({ browser, page }) => {
    const { context, noScript } = await staticPage({ browser, page, query: 'pages', width: 390 })
    const summary = noScript.locator('details.fg-site-rail__menu > summary')
    await expect(summary).toBeVisible()
    await expect(summary).toHaveText('On this page: Install')
    await expect(summary).toHaveCSS('border-radius', '10px')
    expect(await summary.evaluate(element => getComputedStyle(element, '::after').transform)).not.toBe('none')
    await expect(noScript.locator('.fg-site-rail__nav a').first()).toBeHidden()
    await summary.click()
    await expect(noScript.locator('.fg-site-rail__nav a').first()).toBeVisible()
    // The header keeps its pages on the strip row.
    await expect(noScript.locator('.fg-site-header__links a')).toHaveCount(5)
    await expect(noScript.locator('.fg-site-header__links a').first()).toBeVisible()
    await context.close()
  })
})

for (const width of [320, 390, 720, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const url of [fixture, pagesFixture, `${site}?tool`]) {
      await page.goto(url)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), url).toBeLessThanOrEqual(0)
    }
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`axe finds no violations in ${colorScheme}, with the drawer open on a phone`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme, viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.goto(fixture)
    // The site appearance follows the system choice through the .dark class.
    await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/)
    const violations = async () => (await new AxeBuilder({ page }).analyze()).violations
      .map(({ id, nodes }) => `${id}: ${nodes.map(node => node.target.join(' ')).join(', ')}`)
    expect(await violations()).toEqual([])
    await page.setViewportSize({ width: 390, height: 844 })
    await trigger(page).click()
    await expect(page.getByRole('dialog', { name: 'On this page', exact: true })).toBeVisible()
    expect(await violations()).toEqual([])
    await context.close()
  })
}
