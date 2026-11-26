import { expect, test, type Browser, type Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

// The contents list ("On this page") beside main, on a site whose rail holds its pages: the design system's
// components.md#navigation-list, "Beside a column" and "Phone triggers".
const site = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}`
const contents = (page: Page) => page.getByRole('navigation', { name: 'On this page' })
const pages = (page: Page) => page.getByRole('navigation', { name: 'Documentation' })
const current = (page: Page) => contents(page).locator('a[aria-current="location"]')

test.describe('beside the column', () => {
  test.use({ viewport: { width: 1440, height: 800 } })

  test('the list sits right of main, stays at the scroll offset, and marks the section with the pip', async ({ page }) => {
    await page.goto(`${site}?contents`)
    const main = (await page.locator('main').boundingBox())!
    const list = contents(page)
    expect((await list.boundingBox())!.x).toBeGreaterThanOrEqual(main.x + main.width)
    await expect(current(page)).toHaveText('Install')
    await page.evaluate(() => window.scrollTo(0, document.getElementById('commands')!.offsetTop))
    await expect(current(page)).toHaveText('Commands')
    const offset = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))
    expect(await page.locator('.fg-site-contents__menu').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(offset, 0)
    await expect(page.getByRole('heading', { name: 'On this page' })).toBeVisible()
    await expect(page.locator('.fg-site-contents__summary')).toBeHidden()
    // The component opens the disclosure there; WebKit shows no closed disclosure's rows.
    await expect(page.locator('.fg-site-contents__menu')).toHaveAttribute('open', '')
    // A location in a contents list takes the pip, not the rail's fill; the rail keeps its current page.
    expect(await current(page).evaluate(a => getComputedStyle(a, '::before').width)).toBe('3px')
    expect(await current(page).evaluate(a => getComputedStyle(a).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
    await expect(pages(page).locator('a[aria-current="page"]')).toHaveText('Guide')
    await expect(pages(page).locator('a[aria-current="location"]')).toHaveCount(0)
  })

  test('in a short window the list scrolls on its own under its heading, and brings the current row back into view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 420 })
    await page.goto(`${site}?contents&long`)
    const list = page.locator('.fg-site-contents__content')
    expect(await list.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    const inView = async () => {
      const box = (await list.boundingBox())!
      const row = (await current(page).boundingBox())!
      return row.y >= box.y - 1 && row.y + row.height <= box.y + box.height + 1
    }
    // The reader scrolls the list away from the current row, then reads on: the list catches up.
    await list.evaluate((el) => { el.scrollTop = el.scrollHeight })
    expect(await inView()).toBe(false)
    await page.evaluate(() => window.scrollTo(0, document.getElementById('commands')!.offsetTop))
    await expect(current(page)).toHaveText('Commands')
    await expect.poll(inView).toBe(true)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    const heading = (await page.getByRole('heading', { name: 'On this page' }).boundingBox())!
    expect(heading.y + heading.height).toBeLessThanOrEqual((await current(page).boundingBox())!.y)
  })

  test('the list leaves its rows alone while the pointer is over it, and catches up when it leaves', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 420 })
    await page.goto(`${site}?contents&long`)
    const list = page.locator('.fg-site-contents__content')
    await list.hover()
    await list.evaluate((el) => { el.scrollTop = el.scrollHeight })
    const scrolled = await list.evaluate(el => el.scrollTop)
    expect(scrolled).toBeGreaterThan(0)
    // The heading stays at the top of the scrolled list.
    const heading = (await page.getByRole('heading', { name: 'On this page' }).boundingBox())!
    expect(heading.y).toBeGreaterThanOrEqual((await list.boundingBox())!.y - 1)
    await page.evaluate(() => window.scrollTo(0, document.getElementById('commands')!.offsetTop))
    await expect(current(page)).toHaveText('Commands')
    expect(await list.evaluate(el => el.scrollTop)).toBe(scrolled)
    await page.mouse.move(600, 10)
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeLessThan(scrolled)
  })

  for (const height of [420, 124]) test(`a current row left under the heading counts as out of view, and comes back clear of it (${height}px)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height })
    await page.goto(`${site}?contents&long`)
    const list = page.locator('.fg-site-contents__content')
    const heading = page.getByRole('heading', { name: 'On this page' })
    await list.hover()
    await page.evaluate(() => window.scrollTo(0, document.getElementById('commands')!.offsetTop))
    await expect(current(page)).toHaveText('Commands')
    // Scroll the list so the current row's top sits just inside the list, behind the sticky heading.
    await list.evaluate((el) => {
      const row = el.querySelector('a[aria-current="location"]')!
      el.scrollTop += row.getBoundingClientRect().top - el.getBoundingClientRect().top - 2
    })
    expect((await current(page).boundingBox())!.y).toBeLessThan((await heading.boundingBox())!.y + (await heading.boundingBox())!.height)
    await page.mouse.move(600, 10)
    await expect.poll(async () => {
      const h = (await heading.boundingBox())!
      return (await current(page).boundingBox())!.y >= h.y + h.height
    }).toBe(true)
  })
})

test('beside a contents list, the rail and main keep the widths they have without one', async ({ page }) => {
  // Wide enough for both frames to reach their max-width.
  await page.setViewportSize({ width: 1600, height: 800 })
  const widths = async (query: string) => {
    await page.goto(`${site}?${query}`)
    await expect(page.locator('.fg-site-rail')).toHaveAttribute('data-enhanced', 'true')
    return page.evaluate(() => ({
      rail: document.querySelector('.fg-site-rail__menu')!.getBoundingClientRect().width,
      main: document.querySelector('main')!.getBoundingClientRect().width,
    }))
  }
  // The rail's rows are the pages in both; only the contents list differs.
  expect(await widths('contents')).toEqual(await widths('contents&nocontents'))
})

test('when the frame is too narrow for three columns, the list is a closed disclosure above main, named for the section', async ({ page }) => {
  // The window keeps its width; only the frame narrows, so a viewport breakpoint could not pass this.
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto(`${site}?contents`)
  const summary = page.locator('.fg-site-contents__summary')
  await expect(summary).toBeHidden()
  // The component has opened the list beside the column, so narrowing tests closing it.
  await expect(page.locator('.fg-site-contents__menu')).toHaveAttribute('open', '')
  // Closing the list resizes the element the component observes; that must not raise a resize-loop error.
  await page.evaluate(() => {
    (window as unknown as { errors: string[] }).errors = []
    addEventListener('error', e => (window as unknown as { errors: string[] }).errors.push(e.message))
  })
  await page.locator('.fg-site-docs').evaluate((frame) => { (frame as HTMLElement).style.maxWidth = '1000px' })
  await expect(summary).toHaveText('On this page: Install')
  await expect(contents(page)).toBeHidden()
  await expect(page.locator('.fg-site-contents__menu')).not.toHaveAttribute('open')
  await page.evaluate(() => new Promise(requestAnimationFrame))
  expect(await page.evaluate(() => (window as unknown as { errors: string[] }).errors)).toEqual([])
  const [disclosure, main, rail] = await Promise.all([summary.boundingBox(), page.locator('main').boundingBox(), pages(page).boundingBox()])
  expect(disclosure!.y + disclosure!.height).toBeLessThanOrEqual(main!.y)
  expect(disclosure!.x).toBeGreaterThan(rail!.x + rail!.width)
  expect(await page.locator('.fg-site-contents__menu').evaluate(el => getComputedStyle(el).position)).toBe('static')
  await summary.click()
  await expect(contents(page)).toBeVisible()
  await expect(current(page)).toHaveText('Install')
})

// WebKit shows no closed disclosure's rows; this style does the same in any browser.
const hideClosedRows = '.fg-site-contents__menu:not([open]) > .fg-site-contents__content { display: none !important; }'

test('after a deep link the current row comes into view once the list opens', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 124 })
  await page.addInitScript((css) => {
    // Before the page's own scripts run, so the rows are hidden from the first frame.
    new MutationObserver((_, observer) => {
      if (!document.head) return
      document.head.append(Object.assign(document.createElement('style'), { textContent: css }))
      observer.disconnect()
    }).observe(document, { childList: true, subtree: true })
  }, hideClosedRows)
  await page.goto(`${site}?contents&find&long#commands`)
  // The page marks Commands before the list opens, as a deep link does.
  await expect(page.locator('.fg-site-contents__menu')).toHaveAttribute('open', '')
  await expect(current(page)).toHaveText('Commands')
  const list = page.locator('.fg-site-contents__content')
  await expect.poll(async () => {
    const box = (await list.boundingBox())!
    const row = (await current(page).boundingBox())!
    return row.y >= box.y - 1 && row.y + row.height <= box.y + box.height + 1
  }).toBe(true)
})

test('after a phone, a narrow frame mounts the list closed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto(`${site}?contents`)
  await expect(page.locator('.fg-site-contents__menu')).toHaveAttribute('open', '')
  await page.setViewportSize({ width: 390, height: 800 })
  await expect(page.locator('.fg-site-contents')).toHaveCount(0)
  // Record a list that mounts open, even for one frame.
  await page.evaluate(() => {
    (window as unknown as { openedOnMount: boolean }).openedOnMount = false
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach((node) => {
      if (node instanceof Element && node.querySelector('.fg-site-contents__menu[open]')) (window as unknown as { openedOnMount: boolean }).openedOnMount = true
    }))).observe(document.body, { childList: true, subtree: true })
  })
  await page.setViewportSize({ width: 1000, height: 800 })
  await expect(page.locator('.fg-site-contents__summary')).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { openedOnMount: boolean }).openedOnMount)).toBe(false)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('one trigger, named for the rail and its page, opens one drawer with the contents list first', async ({ page }) => {
    await page.goto(`${site}?contents`)
    await expect(page.locator('.fg-site-contents')).toHaveCount(0)
    const trigger = page.getByRole('button', { name: 'Documentation: Guide' })
    await expect(trigger).toBeVisible()
    await trigger.click()
    const drawer = page.getByRole('dialog', { name: 'Documentation' })
    await expect(drawer.getByRole('navigation')).toHaveText([/^On this page/, /^Documentation/])
    // Both lists show their headings, so the rule between them separates two named lists.
    await expect(drawer.locator('.fg-site-rail__label')).toBeVisible()
    await expect(drawer.locator('.fg-site-contents__nav a[aria-current="location"]')).toHaveText('Install')
    await drawer.getByRole('link', { name: 'Commands' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.locator('#commands')).toBeFocused()
  })

  test('a keyboard open while Find has a query focuses a visible row, not one in the hidden contents list', async ({ page }) => {
    await page.goto(`${site}?contents&find`)
    const trigger = page.getByRole('button', { name: 'Documentation: Guide' })
    await trigger.click()
    const drawer = page.getByRole('dialog', { name: 'Documentation' })
    await drawer.locator('.fg-site-find__input').fill('guide')
    await expect(drawer.locator('.fg-site-contents__content')).toBeHidden()
    // Escape in Find would clear the query first, so close with the button.
    await drawer.getByRole('button', { name: /^Close/ }).click()
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(drawer.getByRole('link', { name: 'Guide' })).toBeFocused()
    // With the contents list hidden, no rule sits above the rail.
    expect(await drawer.locator('.fg-site-rail__content').evaluate(el => getComputedStyle(el).borderTopWidth)).toBe('0px')
  })
})

test.describe('without JavaScript', () => {
  // The fixture's server markup, with the styles the dev server injected, loaded where scripts do not run.
  const staticPage = async ({ browser, page, width }: { browser: Browser; page: Page; width: number }) => {
    await page.goto(`${site}?contents&static`)
    await expect(page.locator('.fg-site-contents')).toBeAttached()
    const html = (await page.content()).replace(/<script\b[\s\S]*?<\/script>/g, '')
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } })
    const noScript = await context.newPage()
    await noScript.setContent(html)
    return { context, noScript }
  }

  test('beside a wide column the list shows every row', async ({ browser, browserName, page }) => {
    // WebKit keeps a closed disclosure's rows hidden whatever the CSS, so without JavaScript the list
    // stays shut there. With JavaScript the component opens it. Tracked in apps-home#11.
    test.fixme(browserName === 'webkit', 'WebKit cannot show a closed <details> with CSS')
    const { context, noScript } = await staticPage({ browser, page, width: 1440 })
    await expect(contents(noScript).getByRole('link')).toHaveText(['Install', 'Commands'])
    await expect(noScript.locator('.fg-site-contents__summary')).toBeHidden()
    await context.close()
  })

  test('on a phone each list is its own closed disclosure, the rail first', async ({ browser, page }) => {
    const { context, noScript } = await staticPage({ browser, page, width: 390 })
    await expect(noScript.locator(':is(.fg-site-rail, .fg-site-contents) summary:visible')).toHaveText(['Documentation: Guide', 'On this page'])
    await expect(contents(noScript)).toBeHidden()
    await expect(pages(noScript)).toBeHidden()
    await context.close()
  })
})
