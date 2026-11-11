import { fileURLToPath } from 'node:url'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

// The site fixture with the rail's phone header menu and Find, as the catalogue's shell has them.
const fixture = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}?shell&find`
const railLinks = (page: Page) => page.locator('.fg-site-rail__nav a:visible')
const find = (page: Page) => page.getByRole('searchbox', { name: 'Find a section' })
const status = (page: Page) => page.locator('.fg-site-find [role="status"]')

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
    // The phone buttons are not on the page at this width.
    await expect(page.locator('.fg-site-header__bar')).toBeEmpty()
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the header is one sticky row with the project menu, Find, and a round Menu button', async ({ page }) => {
    await page.goto(fixture)
    const header = page.locator('.fg-site-header')
    // The catalogue's row: 44px controls, --space-3 above and below, and a 1px subtle rule.
    expect((await header.boundingBox())!.height).toBeCloseTo(69, 0)
    const subtle = await header.evaluate((element) => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--color-border-subtle)'
      element.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    await expect(header).toHaveCSS('border-bottom-color', subtle)
    const menu = page.getByRole('button', { name: 'Menu', exact: true })
    const findButton = page.getByRole('button', { name: 'Find a section' })
    await expect(menu).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(findButton).toHaveAttribute('aria-haspopup', 'dialog')
    for (const button of [menu, findButton]) {
      const box = (await button.boundingBox())!
      expect([box.width, box.height]).toEqual([44, 44])
      await expect(button).toHaveCSS('border-radius', '999px')
    }
    // The links and the picker move into the drawer; the rail leaves the page.
    await expect(page.locator('.fg-site-header__links')).toBeHidden()
    await expect(page.locator('.fg-site-header__appearance')).toBeHidden()
    await expect(page.locator('.fg-site-rail')).toBeHidden()
    await page.mouse.wheel(0, 1200)
    await expect.poll(() => header.evaluate(element => element.getBoundingClientRect().top)).toBe(0)
  })

  test('Menu opens the drawer on the current row, and a link closes it and focuses the target', async ({ page }) => {
    await page.goto(`${fixture}#commands`)
    const menu = page.getByRole('button', { name: 'Menu', exact: true })
    await menu.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(drawer).toBeVisible()
    const current = drawer.locator('.fg-site-rail__nav [aria-current="location"]')
    await expect(current).toHaveText('Commands')
    await expect(current).toBeFocused()
    // The drawer holds Find, the pages, the appearance control, then the rail's groups.
    await expect(drawer.locator('.fg-site-rail__content > *:visible')).toHaveCount(5)
    await expect(drawer.getByRole('navigation', { name: 'Site links' }).getByRole('link')).toHaveText(['Guide', 'GitHub', 'Releases'])
    await expect(drawer.getByRole('group', { name: 'Color theme' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(menu).toBeFocused()
    // A tap focuses the drawer itself, and no ring shows, even after a keyboard close.
    await menu.click()
    await expect(drawer).toBeFocused()
    await expect(drawer).toHaveCSS('outline-style', 'none')
    // The catalogue's drawer: 272px wide, named close, blocks 28px apart, and the picker 8px below its label.
    expect((await drawer.boundingBox())!.width).toBeCloseTo(272, 0)
    await expect(drawer.getByRole('button', { name: 'Close menu' })).toBeVisible()
    const gaps = await drawer.evaluate((element) => {
      const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect()
      return {
        pagesToAppearance: box('.fg-site-rail__appearance').top - box('.fg-site-rail__pages').bottom,
        appearanceToRows: box('.fg-site-rail__nav').top - box('.fg-site-rail__appearance').bottom,
        labelToPicker: box('.fg-site-rail__appearance .fg-segmented').top - box('.fg-site-rail__appearance > .fg-site-rail__group-label').bottom,
        groups: box('.fg-site-rail__group + .fg-site-rail__group').top - box('.fg-site-rail__group').bottom,
      }
    })
    expect(gaps).toEqual({ pagesToAppearance: 28, appearanceToRows: 28, labelToPicker: 8, groups: 16 })
    await drawer.getByRole('link', { name: 'Install' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.locator('#install')).toBeFocused()
    await expect(page).toHaveURL(/#install$/)
  })

  test('Find opens the drawer on the field, and the first Escape clears the query instead of closing it', async ({ page }) => {
    await page.goto(fixture)
    const findButton = page.getByRole('button', { name: 'Find a section' })
    await findButton.click()
    const drawer = page.getByRole('dialog', { name: 'Menu' })
    await expect(find(page)).toBeFocused()
    await page.keyboard.type('comm')
    await expect(railLinks(page)).toHaveText(['Commands'])
    await page.keyboard.press('Escape')
    await expect(find(page)).toHaveValue('')
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(findButton).toBeFocused()
    // The / shortcut opens the drawer on Find too.
    await page.keyboard.press('/')
    await expect(find(page)).toBeFocused()
  })

  test('opening the drawer or focusing a header control does not scroll the page', async ({ page }) => {
    await page.goto(`${fixture}#commands`)
    const before = await page.evaluate(() => scrollY)
    expect(before).toBeGreaterThan(0)
    for (const control of [
      page.getByRole('button', { name: 'Find a section' }),
      page.getByRole('button', { name: 'Menu', exact: true }),
      page.locator('.fg-site-projects__trigger'),
    ]) {
      await control.focus()
      expect(await page.evaluate(() => scrollY)).toBe(before)
    }
    await page.getByRole('button', { name: 'Find a section' }).click()
    await expect(find(page)).toBeFocused()
    expect(await page.evaluate(() => scrollY)).toBe(before)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    expect(await page.evaluate(() => scrollY)).toBe(before)
  })

  test('a section jump lands below the sticky header', async ({ page }) => {
    await page.goto(`${fixture}#commands`)
    const header = (await page.locator('.fg-site-header').boundingBox())!
    const heading = (await page.locator('#commands').boundingBox())!
    expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height)
  })
})

test.describe('without JavaScript', () => {
  for (const width of [390, 1280]) {
    test(`every link is visible and Find is hidden at ${width}px`, async ({ browser, page }) => {
      // The fixture's server markup, with the styles the dev server injected, loaded where scripts do not run.
      await page.goto(`${fixture}&static`)
      await expect(page.locator('.fg-site-rail')).toBeAttached()
      const html = (await page.content()).replace(/<script\b[\s\S]*?<\/script>/g, '')
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } })
      const noScript = await context.newPage()
      await noScript.setContent(html)
      const links = noScript.locator('.fg-site-rail__nav a')
      await expect(links).toHaveCount(4)
      for (const link of await links.all()) await expect(link).toBeVisible()
      await expect(noScript.locator('.fg-site-find')).toHaveCount(0)
      await expect(noScript.locator('.fg-site-header__bar')).toBeHidden()
      for (const link of await noScript.locator('.fg-site-header__links a').all()) await expect(link).toBeVisible()
      await context.close()
    })
  }
})

for (const width of [390, 720, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
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
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    expect(await violations()).toEqual([])
    await context.close()
  })
}
