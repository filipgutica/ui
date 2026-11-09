import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { contrast } from '../tests/contrast.js'

// The docs dev server serves this fixture through Vite's /@fs/ route, so it uses the real components.
const fixture = `/@fs${fileURLToPath(new URL('./fixtures/site.html', import.meta.url))}`

test('keeps inline code, links, and surrounding step text beside the number', async ({ page }) => {
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    const step = page.locator('#inline-steps li')
    const contentStart = (await page.locator('#start h3').first().boundingBox())!.x
    const layout = await step.evaluate(element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const lines: { left: number; right: number }[] = []
      while (walker.nextNode()) {
        const node = walker.currentNode
        // Inspect visible characters, including anonymous text runs around inline elements.
        for (let offset = 0; offset < (node.textContent?.length ?? 0); offset += 1) {
          if (!node.textContent?.[offset]?.trim()) continue
          const range = document.createRange()
          range.setStart(node, offset)
          range.setEnd(node, offset + 1)
          for (const rect of range.getClientRects()) lines.push({ left: rect.left, right: rect.right })
        }
      }
      return {
        lines,
        right: element.getBoundingClientRect().right,
      }
    })
    expect(layout.lines.length).toBeGreaterThan(0)
    for (const line of layout.lines) {
      expect(line.left, `step text starts after the gutter at ${width}px`).toBeGreaterThanOrEqual(contentStart - 1)
      expect(line.right, `step text fits at ${width}px`).toBeLessThanOrEqual(layout.right + 1)
    }
  }
})

test('keeps a wrapped step title the same height with its number', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto(fixture)
  await page.addStyleTag({ content: 'html { font-size: 200%; }' })
  const titles = page.locator('.fg-site-steps > li > h3:first-child')
  const heights = () => titles.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
  const withNumbers = await heights()
  await page.addStyleTag({ content: '.fg-site-steps > li > h3:first-child::before { content: none !important; }' })
  const withoutNumbers = await heights()
  expect(withNumbers.length).toBeGreaterThan(0)
  expect(withNumbers).toEqual(withoutNumbers)
})

test('keeps every capture tab clear of the Full size button', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    const capture = page.locator('.fg-capture[data-enhanced="true"]')
    const tabs = capture.getByRole('tablist', { name: 'Steps', exact: true })
    const fullSize = capture.locator('.fg-capture__full')
    const list = await tabs.boundingBox()
    const button = await fullSize.boundingBox()
    expect((list?.x ?? 0) + (list?.width ?? Infinity), `tab list end at ${width}px`).toBeLessThanOrEqual(button?.x ?? 0)

    // The last tab scrolls into the list when the keyboard selects it.
    await capture.getByRole('tab', { name: 'Browse', exact: true }).focus()
    await page.keyboard.press('End')
    const last = capture.getByRole('tab', { name: 'Dry run', exact: true })
    await expect(last).toHaveAttribute('aria-selected', 'true')
    const tab = await last.boundingBox()
    // Scroll positions are whole pixels, so a tab with a fractional width can end within 1px of the button.
    expect((tab?.x ?? 0) + (tab?.width ?? Infinity), `last tab end at ${width}px`).toBeLessThanOrEqual((button?.x ?? 0) + 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('lets phone readers reach and scroll a wide capture beneath its overlay', async ({ page }) => {
  await page.goto(fixture)
  // Model the 800px terminal captures used on project sites, without changing the shared fixture.
  await page.addStyleTag({ content: '.fg-capture__screen > .term { min-width: 800px; }' })
  const screen = page.locator('#frame-browse .fg-capture__screen')
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await screen.scrollIntoViewIfNeeded()
    await expect.soft.poll(() => screen.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
    }), `capture receives pointer gestures at ${width}px`).toBe(true)

    await screen.evaluate(element => { element.scrollLeft = 0 })
    await screen.focus()
    // Native keyboard scrolling animates and can outlive the next jump or resize, so wait for it to end.
    const keyboardScroll = await screen.evaluateHandle(element => ({
      finished: new Promise<void>(resolve => element.addEventListener('scrollend', () => resolve(), { once: true })),
    }))
    await page.keyboard.press('ArrowRight')
    await expect.soft.poll(() => screen.evaluate(element => element.scrollLeft), `keyboard scroll at ${width}px`).toBeGreaterThan(0)
    await keyboardScroll.evaluate(({ finished }) => finished)
    await keyboardScroll.dispose()
  }

  await screen.evaluate(element => { element.scrollLeft = 200 })
  await page.setViewportSize({ width: 800, height: 900 })
  await expect(screen, 'fits again on a wider screen').toHaveAttribute('data-fit', 'true')
  await expect.poll(() => screen.evaluate(element => element.scrollLeft), 'fitted capture shows its left edge').toBe(0)
})

test('shows a deep-linked capture tab in full on phones', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${fixture}#frame-dry-run`)
    const capture = page.locator('.fg-capture[data-enhanced="true"]')
    const last = capture.getByRole('tab', { name: 'Dry run', exact: true })
    await expect(last).toHaveAttribute('aria-selected', 'true')
    const list = await capture.getByRole('tablist', { name: 'Steps', exact: true }).boundingBox()
    const tab = await last.boundingBox()
    // The same 1px allowance as above: scroll positions are whole pixels.
    expect((tab?.x ?? 0) + (tab?.width ?? Infinity), `Dry run end at ${width}px`).toBeLessThanOrEqual((list?.x ?? 0) + (list?.width ?? 0) + 1)
  }
})

test('draws a focus outline that forced-colors mode keeps on every tab stop', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  for (const url of [fixture, '/#/', '/#/sandbox/select', '/#/sandbox/radio-card-group']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    for (let stop = 0; stop < 16; stop += 1) {
      await page.keyboard.press('Tab')
      const focus = await page.evaluate(() => {
        const element = document.activeElement
        if (!element || element === document.body) return undefined
        return { name: `${element.tagName} ${element.className}`.trim(), outline: getComputedStyle(element).outlineStyle }
      })
      if (focus) expect(focus.outline, `${url} ${focus.name}`).not.toBe('none')
    }
  }
})

test('places the docs shell frame, rail, main, and footer on shared edges', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(fixture)
  const box = async (selector: string) => {
    const bounds = await page.locator(selector).first().boundingBox()
    return { left: Math.round(bounds?.x ?? -1), right: Math.round((bounds?.x ?? 0) + (bounds?.width ?? 0)) }
  }
  expect(await box('.fg-site-header__inner')).toEqual({ left: 32, right: 1248 })
  expect(await box('.fg-site-rail')).toEqual({ left: 32, right: 256 })
  expect((await box('main')).left).toBe(288)
  expect(await box('.fg-site-footer')).toEqual({ left: 32, right: 1248 })
  // V1–V3/V10: an unlayered one-column site rule must not collapse or stretch the hero.
  await page.addStyleTag({ content: 'main > section { grid-template-columns: minmax(0, 1fr); }' })
  const hero = page.locator('.fg-site-hero')
  const title = (await hero.locator('h1').boundingBox())!
  const lede = (await hero.locator('.fg-site-hero__lede').boundingBox())!
  const aside = (await hero.locator('.fg-site-hero__aside').boundingBox())!
  expect(title.width).toBeGreaterThanOrEqual(aside.x + aside.width - lede.x - 1)
  expect(lede.x + lede.width).toBeLessThan(aside.x)
  expect(Math.abs(lede.y - aside.y)).toBeLessThanOrEqual(1)
  expect((await hero.locator('.fg-site-hero__aside .fg-code-block').boundingBox())?.height).toBeLessThan(80)
  // A hero inside a prose wrapper keeps the display title over the prose h1 default.
  await page.locator('main').evaluate(main => main.classList.add('fg-site-prose'))
  await expect(hero.locator('h1')).toHaveCSS('font-size', '56px')
  for (const selector of ['.fg-capture', '.fg-site-legend']) {
    const child = (await hero.locator(selector).first().boundingBox())!
    expect(child.y).toBeGreaterThanOrEqual(Math.max(lede.y + lede.height, aside.y + aside.height))
    expect(child.width).toBeGreaterThanOrEqual(title.width - 1)
  }

  for (const link of await page.locator('.fg-site-footer a').all())
    expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.querySelector('.fg-site-rail')!.getBoundingClientRect().top))
    .toBe(await page.evaluate(() => document.querySelector('main')!.getBoundingClientRect().top))
})

test('scrolls an overflowing desktop rail inside its divider, so the scrollbar sits clear of the border', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 160 })
  await page.goto(fixture)
  // Scrolled down, the sticky rail sits at its top offset and must end inside the viewport.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  const rail = await page.locator('.fg-site-rail').evaluate(element => {
    const content = element.querySelector('.fg-site-rail__content')!
    return {
      railScrolls: element.scrollHeight > element.clientHeight,
      contentScrolls: content.scrollHeight > content.clientHeight && getComputedStyle(content).overflowY === 'auto',
      gap: element.getBoundingClientRect().right - content.getBoundingClientRect().right,
      bottom: element.getBoundingClientRect().bottom,
    }
  })
  expect(rail.railScrolls).toBe(false)
  expect(rail.contentScrolls).toBe(true)
  expect(rail.gap).toBeGreaterThanOrEqual(16)
  expect(rail.bottom).toBeLessThanOrEqual(160)
})

test('colors captures with the default terminal palette unless the site sets its own', async ({ page }) => {
  await page.goto(fixture)
  const accent = page.locator('.fg-capture[data-enhanced="true"] .tf6').first()
  await expect(accent).toHaveCSS('color', 'rgb(95, 211, 217)')
  await expect(page.locator('.fg-capture[data-enhanced="true"] .fg-capture__screen').first()).toHaveCSS('background-color', 'rgb(10, 12, 14)')
  await page.addStyleTag({ content: ':root { --t6: #ff0000; }' })
  await expect(accent).toHaveCSS('color', 'rgb(255, 0, 0)')
  // Plain output uses the same terminal plate and its own light foreground.
  const screen = page.locator('.fg-capture[data-enhanced="true"] .fg-capture__screen').first()
  await screen.evaluate(element => { element.innerHTML = '<pre>plain output</pre>' })
  await expect(screen).toHaveCSS('background-color', 'rgb(10, 12, 14)')
  await expect(screen).toHaveCSS('color', 'rgb(230, 233, 235)')
})

test('keeps header links on phones outside the docs shell, on a second row when there are three', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    // A fresh load each pass, since the previous pass added a link and a control.
    await page.goto('about:blank')
    await page.goto('/#/')
    const links = page.getByRole('navigation', { name: 'Site links', exact: true })
    await expect(links).toBeVisible()
    // At 390px two links fit beside the project menu, so the header stays one row: 64px plus its border.
    if (width === 390) expect((await page.locator('.fg-site-header').boundingBox())?.height).toBeLessThanOrEqual(65)

    await links.evaluate((element) => {
      element.insertAdjacentHTML('beforeend', '<a href="#changelog">Changelog</a>')
    })
    const control = page.locator('.fg-site-header__end > :not(.fg-site-header__links)')
    const menu = (await page.locator('.fg-site-projects').boundingBox())!
    const first = (await control.first().boundingBox())!
    const linksBox = (await links.boundingBox())!
    expect(Math.abs(first.y + first.height / 2 - (menu.y + menu.height / 2)), `control beside the menu at ${width}px`).toBeLessThanOrEqual(2)
    expect(linksBox.y, `links below the control at ${width}px`).toBeGreaterThanOrEqual(first.y + first.height)
    // A second header control may wrap on a narrow phone, but it never covers the first.
    await control.first().evaluate(element => element.after(element.cloneNode(true)))
    const [one, two] = [(await control.first().boundingBox())!, (await control.nth(1).boundingBox())!]
    const apart = two.x >= one.x + one.width || two.y >= one.y + one.height
    expect(apart, `second control clear of the first at ${width}px`).toBe(true)
  }
})

test('shows a stored appearance choice without moving the picker on load', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tool-site-theme', 'dark')
    const starts: string[] = []
    Object.assign(window, { segmentedStarts: starts })
    for (const type of ['animationstart', 'transitionstart']) {
      document.addEventListener(type, (event) => {
        if (event.target instanceof Element && event.target.closest('.fg-segmented')) starts.push(type)
      }, true)
    }
  })
  await page.goto(fixture)
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')
  // Longer than one slide, so a slide that started on load would have reported.
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => (window as unknown as { segmentedStarts: string[] }).segmentedStarts)).toEqual([])
})

test('rings the project trigger in the accent, like the other quiet actions', async ({ page }) => {
  await page.goto(fixture)
  const trigger = page.locator('.fg-site-projects__trigger')
  await trigger.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  const ink = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('i'))
    probe.style.color = 'var(--color-accent)'
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })
  await expect(trigger).toHaveCSS('outline-color', ink)
})

test('marks the pressed appearance choice in forced-colors mode', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(fixture)
  // The section in view keeps its pip, redrawn in Highlight; only the current page takes the leading edge.
  const location = page.locator('.fg-site-nav a[aria-current="location"]').first()
  await expect(location).toHaveCSS('border-inline-start-width', '0px')
  const pip = await location.evaluate(element => {
    const style = getComputedStyle(element, '::before')
    return { adjust: style.forcedColorAdjust, background: style.backgroundColor }
  })
  expect(pip.adjust).toBe('none')
  expect(pip.background).not.toBe('rgba(0, 0, 0, 0)')
  const current = page.getByLabel('Projects').locator('a[aria-current="page"]')
  await expect(current).toHaveCSS('border-inline-start-width', '2px')
  await expect(current).toHaveCSS('border-inline-start-style', 'solid')
  const pressed = page.locator('.fg-site-appearance .fg-segmented__item[aria-pressed="true"]')
  const other = page.locator('.fg-site-appearance .fg-segmented__item[aria-pressed="false"]').first()
  // Forced colors drop fills and rings, so the pressed choice needs its own system colors.
  const color = (locator: typeof pressed) => locator.evaluate(element => getComputedStyle(element).color)
  expect(await color(pressed)).not.toBe(await color(other))
})

test('keeps the phone header on one row and names the section menu after its label', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    // Role queries skip hidden elements, so find the header links by class.
    const headerLinks = page.locator('.fg-site-header__links a')
    await expect(headerLinks).toHaveCount(3)
    await expect(headerLinks.first()).toBeHidden()
    // Every hidden header destination is still reachable from a visible link.
    for (const href of await headerLinks.evaluateAll(links => links.map(link => link.getAttribute('href')))) {
      await expect(page.locator(`a[href="${href}"]:visible`), `${href} at ${width}px`).not.toHaveCount(0)
    }
    // One row: the header keeps its 64px minimum height plus its 1px border.
    expect((await page.locator('.fg-site-header').boundingBox())?.height).toBeLessThanOrEqual(65)
    const toggle = page.getByRole('button', { name: /^On this page/ })
    await expect(toggle).toHaveText('On this page: Install')
    await page.goto(`${fixture}#commands`)
    await expect(toggle).toHaveText('On this page: Commands')
    // WCAG 2.5.3: the accessible name carries the whole visible label.
    await expect(toggle).toHaveAccessibleName('On this page: Commands')
    // A long current label wraps inside the phone frame instead of widening the page.
    await toggle.evaluate(element => element.append(' and a much longer section name'))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `toggle fits at ${width}px`).toBe(true)
    await toggle.click()
    await expect(page.getByRole('dialog', { name: 'On this page', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    expect(await page.locator('h1').evaluate(element => element.getBoundingClientRect().top)).toBeLessThanOrEqual(150)
  }
})

test('hides [hidden] elements over page display rules and sizes inline code one step down', async ({ page }) => {
  await page.goto(fixture)
  // A page's own display rule would otherwise win over the browser's [hidden] style.
  await page.addStyleTag({ content: 'main > section p { display: block; }' })
  const intro = page.locator('#install .fg-site-hero__lede > p')
  await intro.evaluate(element => { element.hidden = true })
  await expect(intro).toBeHidden()
  await intro.evaluate(element => { element.hidden = false })
  await expect(intro.locator('code')).toHaveCSS('font-size', '13px')
  // Code in a block keeps the block's size.
  await intro.evaluate(element => element.insertAdjacentHTML('afterend', '<pre style="font-size: 15px"><code>demo ui</code></pre>'))
  await expect(page.locator('#install .fg-site-hero__lede > pre > code')).toHaveCSS('font-size', '15px')
  for (const root of ['fg-site-docs', 'fg-site-prose']) {
    for (const wrapper of ['', 'header', 'hgroup']) {
      const content = wrapper ? `<${wrapper}><h2>Section</h2></${wrapper}>` : '<h2>Section</h2>'
      await page.locator(root === 'fg-site-docs' ? 'main' : 'body').evaluate((element, markup) => element.insertAdjacentHTML('beforeend', markup),
        `<article class="${root}" id="heading-case"><section>${content}</section></article>`)
      const heading = page.locator('#heading-case h2')
      await expect(heading).toHaveCSS('border-top-width', '1px')
      expect(await heading.evaluate(element => getComputedStyle(element, '::before').content)).toContain('## ')
      expect(await heading.evaluate(element => getComputedStyle(element, '::before').letterSpacing)).toBe('1.6px')
      await page.locator('#heading-case').evaluate(element => { element.style.setProperty('--heading-mark', 'none') })
      expect(await heading.evaluate(element => getComputedStyle(element, '::before').content)).not.toContain('##')
      await page.locator('#heading-case').evaluate(element => element.remove())
    }
  }
})

test('keeps definition flags such as --all on one line on phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto(fixture)
  const flag = page.locator('.fg-site-definitions code', { hasText: '--all' })
  // Sweep phone widths so the flag meets the end of a line at least once.
  for (let width = 320; width <= 480; width += 4) {
    await page.setViewportSize({ width, height: 900 })
    expect(await flag.evaluate(element => element.getClientRects().length), `--all at ${width}px`).toBe(1)
  }
})

test('gives fact links a touch-sized hit area on phones without taller fact rows', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(fixture)
    const source = page.locator('.fg-site-facts a', { hasText: 'filipgutica/demo' })
    const targetHeight = await source.evaluate(element => Number.parseFloat(getComputedStyle(element, '::after').height))
    expect(targetHeight, `Source link target at ${width}px`).toBeGreaterThanOrEqual(44)
    const bounds = (await source.boundingBox())!
    const target = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.textContent,
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 - 21 })
    expect(target).toBe('filipgutica/demo')
    // The row stays one line: no taller than its label.
    const row = page.locator('.fg-site-facts > div', { hasText: 'Source' })
    const rowHeight = (await row.boundingBox())?.height ?? Infinity
    const labelHeight = (await row.locator('dt').boundingBox())?.height ?? 0
    expect(rowHeight, `Source row at ${width}px`).toBeLessThanOrEqual(labelHeight + 1)
  }
})

test('keeps phone facts compact and adjacent links reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto(fixture)
  // One link cannot overlap another, so its rows stay compact.
  await expect(page.locator('.fg-site-facts')).toHaveCSS('row-gap', '8px')
  await page.locator('.fg-site-facts').evaluate(facts => facts.insertAdjacentHTML('beforeend',
    '<div><dt>Docs</dt><dd><a href="#guide">filipgutica.github.io/demo</a></dd></div>'))
  const source = await page.locator('.fg-site-facts a', { hasText: 'filipgutica/demo' }).boundingBox()
  const docs = await page.locator('.fg-site-facts a', { hasText: 'github.io' }).boundingBox()
  expect(docs?.y ?? 0, 'Docs wraps below Source').toBeGreaterThan(source?.y ?? Infinity)
  // A tap anywhere on a link's visible text, edges included, reaches that link and not its neighbour.
  for (const link of await page.locator('.fg-site-facts a').all()) {
    const bounds = (await link.boundingBox())!
    for (const y of [bounds.y + 1, bounds.y + bounds.height / 2, bounds.y + bounds.height - 1]) {
      expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'),
        { x: bounds.x + bounds.width / 2, y }), `tap at y=${Math.round(y)}`).toBe(await link.getAttribute('href'))
    }
  }
  // WCAG 1.4.4 and 1.4.10: at 200% text on a 375px phone, the facts do not widen the page.
  await page.setViewportSize({ width: 375, height: 812 })
  await page.evaluate(() => {
    const root = document.documentElement
    root.style.setProperty('font-size', `${parseFloat(getComputedStyle(root).fontSize) * 2}px`, 'important')
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow at 200% text').toBe(true)
})

test('lets a page set the legend column minimum', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(fixture)
  const legend = page.locator('.fg-site-legend')
  const rows = async () => new Set(await legend.locator('> div').evaluateAll(entries =>
    entries.map(entry => Math.round(entry.getBoundingClientRect().top)))).size
  // Four entries at the --sidebar minimum do not fit the 960px column.
  expect(await rows()).toBe(2)
  await legend.evaluate(element => element.style.setProperty('--site-legend-column', 'calc(var(--sidebar) - var(--space-4))'))
  expect(await rows()).toBe(1)
})

test('fades the clipped edges of a scrolling tab strip and keeps the selected tab clear of the fade', async ({ page }) => {
  const strip = page.locator('.fg-capture[data-enhanced="true"]').getByRole('tablist', { name: 'Steps', exact: true })
  const maskOf = () => strip.evaluate(element => getComputedStyle(element).maskImage)

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(fixture)
  expect(await maskOf(), 'every tab fits at 1280px').toBe('none')

  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto(`${fixture}#frame-list`)
  const list = strip.getByRole('tab', { name: 'List', exact: true })
  await expect(list).toHaveAttribute('aria-selected', 'true')
  await expect.poll(maskOf, 'later tabs are clipped at 320px').toContain('gradient')
  // Dry run follows List, so List stops short of the faded end of the strip.
  const strip320 = await strip.boundingBox()
  const tab = await list.boundingBox()
  const fade = await strip.evaluate(element => Number.parseFloat(getComputedStyle(element).scrollPaddingRight))
  expect(fade).toBeGreaterThan(0)
  expect((tab?.x ?? 0) + (tab?.width ?? Infinity)).toBeLessThanOrEqual((strip320?.x ?? 0) + (strip320?.width ?? 0) - fade + 1)

  await list.focus()
  await page.keyboard.press('End')
  await expect(strip.getByRole('tab', { name: 'Dry run', exact: true })).toHaveAttribute('aria-selected', 'true')
  // At the end of the strip only the start is clipped.
  await expect(strip).toHaveAttribute('data-clipped', 'left')
})

test('reveals the selected tab again when the viewport narrows', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${fixture}#frame-dry-run`)
  const capture = page.locator('.fg-capture[data-enhanced="true"]')
  const last = capture.getByRole('tab', { name: 'Dry run', exact: true })
  await expect(last).toHaveAttribute('aria-selected', 'true')
  await page.setViewportSize({ width: 320, height: 900 })
  const list = capture.getByRole('tablist', { name: 'Steps', exact: true })
  await expect.poll(async () => {
    const bounds = await list.boundingBox()
    const tab = await last.boundingBox()
    return (tab?.x ?? 0) + (tab?.width ?? Infinity) <= (bounds?.x ?? 0) + (bounds?.width ?? 0) + 1
  }, 'Dry run in view after narrowing to 320px').toBe(true)
})


test('keeps selected tabs lifted, readable, and stable on docs and terminal surfaces', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, forcedColors: 'none', reducedMotion: 'reduce' })
    for (const url of ['/#/sandbox/tabs', fixture]) {
      await page.goto(url)
      const tabs = page.locator('.fg-tabs__list').first()
      const selected = tabs.getByRole('tab').nth(0)
      const other = tabs.getByRole('tab').nth(1)
      await expect(selected).toBeVisible()
      await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), colorScheme)
      const colors = await selected.evaluate(element => {
        const style = getComputedStyle(element)
        const context = document.createElement('canvas').getContext('2d')!
        const hex = (color: string, underlay: string) => {
          context.clearRect(0, 0, 1, 1)
          context.fillStyle = underlay
          context.fillRect(0, 0, 1, 1)
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          return '#' + [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(channel => channel.toString(16).padStart(2, '0')).join('')
        }
        const ancestors: Element[] = []
        for (let parent = element.parentElement; parent; parent = parent.parentElement) ancestors.unshift(parent)
        const surface = ancestors.reduce((underlay, ancestor) => hex(getComputedStyle(ancestor).backgroundColor, underlay), '#ffffff')
        const background = hex(style.backgroundColor, surface)
        return { background, foreground: hex(style.color, background), fill: style.backgroundColor, surface }
      })
      expect(colors.background, `${colorScheme} ${url} selected fill`).not.toBe(colors.surface)
      expect(contrast(colors.foreground, colors.background), `${colorScheme} ${url} text contrast`).toBeGreaterThanOrEqual(4.5)
      await expect(other).not.toHaveCSS('background-color', colors.fill)
      await expect(selected).not.toHaveCSS('box-shadow', 'none')
      await expect(selected).toHaveCSS('border-bottom-width', '0px')
      await expect(selected).toHaveCSS('border-radius', '10px')
      // The strip scrolls and clips, so it must leave room for the lifted shadow on every side.
      const [strip, fill] = [await tabs.boundingBox(), await selected.boundingBox()]
      expect(fill!.x - strip!.x, `${colorScheme} ${url} shadow room`).toBeGreaterThanOrEqual(3)
      expect(strip!.y + strip!.height - (fill!.y + fill!.height), `${colorScheme} ${url} shadow room below`).toBeGreaterThanOrEqual(3)
      const bounds = await other.boundingBox()
      await selected.hover()
      await expect(selected).toHaveCSS('background-color', colors.fill)
      await other.click()
      expect(await other.boundingBox()).toEqual(bounds)
      await expect(other).toHaveCSS('background-color', colors.fill)
      await page.emulateMedia({ forcedColors: 'active' })
      await expect(other).toHaveCSS('border-top-style', 'solid')
      await expect(other).toHaveCSS('border-top-width', '2px')
      await expect(selected).toHaveCSS('border-top-width', '0px')
      await page.emulateMedia({ forcedColors: 'none' })
    }
  }
})

test('keeps site explanations readable and navigation compact only for fine pointers', async ({ page, browser }) => {
  await page.goto(fixture)
  await expect(page.locator('.fg-site-hero')).toHaveCSS('row-gap', '24px')
  const text = await page.locator('main').evaluate(element => getComputedStyle(element).color)
  for (const selector of ['.fg-site-hero__lede', '.fg-site-legend dd', '.fg-command-list__description', '.fg-site-definitions dd', '.fg-site-steps__result']) {
    await expect(page.locator(selector).first()).toHaveCSS('color', text)
  }
  await expect(page.locator('.fg-site-meta').first()).not.toHaveCSS('color', text)
  await expect(page.locator('.fg-site-rail__nav a').first()).toHaveCSS('min-height', '30px')
  const touch = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } })
  const touchPage = await touch.newPage()
  await touchPage.goto(fixture)
  await touchPage.getByRole('button', { name: /^On this page:/ }).click()
  await expect(touchPage.locator('.fg-site-rail__nav a').first()).toHaveCSS('min-height', '44px')
  await touchPage.goto('/#/sandbox/select')
  await touchPage.locator('.playground-stage > .fg-select').click()
  await expect(touchPage.locator('.playground-stage > .fg-select option').first()).toHaveCSS('min-height', '44px')
  await touch.close()
})
