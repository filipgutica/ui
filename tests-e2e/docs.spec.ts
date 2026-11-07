import { expect, test } from '@playwright/test'

import { contrast } from '../tests/contrast.js'

const componentSlugs = [
  'alert',
  'badge',
  'button',
  'card',
  'checkbox',
  'code-block',
  'dialog',
  'drawer',
  'field',
  'figure',
  'input',
  'progress',
  'radio-card',
  'radio-card-group',
  'score',
  'select',
  'slider',
  'switch',
  'tabs',
  'toggle-button',
]

test('operates tabs with the keyboard and retains panel contents', async ({ page }) => {
  await page.goto('/#/sandbox/tabs')
  const stage = page.locator('.playground-stage')
  await expect(page.getByLabel('Group label', { exact: true })).toHaveCount(0)
  await expect(stage.getByRole('tablist', { name: 'Process captures', exact: true })).toBeVisible()
  const list = stage.getByRole('tab', { name: 'List', exact: true })
  const details = stage.getByRole('tab', { name: 'Details', exact: true })
  await expect(list).toHaveAttribute('aria-selected', 'true')
  await list.focus()
  await list.press('ArrowRight')
  await expect(details).toBeFocused()
  await expect(details).toHaveAttribute('aria-selected', 'true')
  await expect(stage.getByRole('tabpanel')).toHaveText('Process details capture', { useInnerText: true })
  await details.press('Home')
  await expect(list).toBeFocused()
  await expect(stage.getByRole('tabpanel')).toHaveText('Process list capture', { useInnerText: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect((await list.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
})

for (const { slug, role, name, state, track } of [
  { slug: 'toggle-button', role: 'button', name: 'Tests with signal Pillar 3', state: 'aria-pressed', track: '.fg-toggle-button__switch' },
  { slug: 'switch', role: 'switch', name: 'Email notifications', state: 'aria-checked', track: '.fg-switch__track' },
] as const) {
  test(`toggles a ${slug} with the keyboard and stills its track for reduced motion`, async ({ page }) => {
    await page.goto(`/#/sandbox/${slug}`)
    const toggle = page.locator('.playground-stage').getByRole(role, { name, exact: true })
    await expect(toggle).toHaveAttribute(state, 'false')
    for (const [size, scale] of [['sm', 0.8], ['md', 1], ['lg', 1.2]] as const) {
      await page.getByLabel('Size', { exact: true }).selectOption(size)
      const dimensions = await toggle.locator(track).evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const thumb = getComputedStyle(element, '::after')
        return { width: bounds.width, height: bounds.height, thumbWidth: Number.parseFloat(thumb.width), thumbHeight: Number.parseFloat(thumb.height) }
      })
      expect(dimensions.width).toBeCloseTo(44 * scale, 1)
      expect(dimensions.height).toBeCloseTo(22 * scale, 1)
      expect(dimensions.thumbWidth).toBeCloseTo(18 * scale, 1)
      expect(dimensions.thumbHeight).toBeCloseTo(18 * scale, 1)
    }
    await page.getByLabel('Size', { exact: true }).selectOption('md')
    expect((await toggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(36)
    await toggle.focus()
    await toggle.press('Space')
    await expect(toggle).toHaveAttribute(state, 'true')
    if (slug === 'toggle-button') {
      const pressedBorder = await toggle.evaluate(element => getComputedStyle(element).borderColor)
      await toggle.hover()
      await expect(toggle).toHaveCSS('border-color', pressedBorder)
    }
    await toggle.press('Enter')
    await expect(toggle).toHaveAttribute(state, 'false')
    // The switch's button is a transparent hit area, so its focus ring is drawn on the visible track.
    const ring = slug === 'switch' ? toggle.locator(track) : toggle
    await expect(ring).toHaveCSS('outline-style', 'solid')
    expect(await ring.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(1)
    expect((await toggle.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(24)
    expect((await toggle.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(24)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(toggle.locator(track)).toHaveCSS('transition-duration', '0s')
    expect(await toggle.locator(track).evaluate(element => getComputedStyle(element, '::after').transitionDuration)).toBe('0s')
  })
}

test('keeps borderless switch cues visible on canvas and panels in both themes and forced colors', async ({ page }) => {
  for (const { slug, role, name, state, selector } of [
    { slug: 'switch', role: 'switch', name: 'Email notifications', state: 'aria-checked', selector: '.fg-switch__track' },
    { slug: 'toggle-button', role: 'button', name: 'Tests with signal Pillar 3', state: 'aria-pressed', selector: '.fg-toggle-button__switch' },
  ] as const) {
    for (const { colorScheme, palette, checkedStates } of [
      { colorScheme: 'light', palette: null, checkedStates: [false, true] },
      { colorScheme: 'dark', palette: null, checkedStates: [false, true] },
      { colorScheme: 'light', palette: { background: '#ffffff', raised: '#ffffff', border: '#929292' }, checkedStates: [false, true] },
      { colorScheme: 'dark', palette: { background: '#202020', raised: '#202020', border: '#707070' }, checkedStates: [false, true] },
      { colorScheme: 'light', palette: { background: '#ffffff', raised: '#00000066', border: '#000000' }, checkedStates: [false] },
      { colorScheme: 'light', palette: { background: '#ffffff', raised: '#00000055', border: '#00000080' }, checkedStates: [false] },
      { colorScheme: 'light', palette: { background: '#ffffff', raised: '#00000080', border: '#000000' }, checkedStates: [false] },
    ] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto('/#/themes')
      if (palette) {
        const name = `Switch ${colorScheme} ${palette.raised}`
        const fileChooser = page.waitForEvent('filechooser')
        await page.getByRole('button', { name: 'Choose file', exact: true }).click()
        await (await fileChooser).setFiles({
          name: `${name}.json`,
          mimeType: 'application/json',
          buffer: Buffer.from(JSON.stringify({
            name,
            type: colorScheme,
            colors: {
              'editor.background': palette.background,
              'editor.foreground': colorScheme === 'light' ? '#000000' : '#ffffff',
              'sideBar.background': palette.background,
              'panel.background': palette.raised,
              'panel.border': palette.border,
            },
          })),
        })
        await expect(page.getByRole('radio', { name, exact: true })).toBeChecked()
      } else {
        await page.getByRole('radio', { name: colorScheme === 'light' ? 'Light' : 'Dark', exact: true }).click()
      }
      await page.goto(`/#/sandbox/${slug}`)
      const stage = page.locator('.playground-stage')
      const toggle = stage.getByRole(role, { name, exact: true })
      const track = toggle.locator(selector)
      // The stage is transparent by default. Paint each real host surface rather than reading it as black.
      for (const surface of ['--color-bg', '--color-surface-raised']) {
        await stage.evaluate((element, token) => { element.style.background = `var(${token})` }, surface)
        for (const checked of checkedStates) {
          if (await toggle.getAttribute(state) !== String(checked)) await toggle.click()
          const colors = await track.evaluate(element => {
            const context = document.createElement('canvas').getContext('2d')!
            // Resolve alpha independently over the surface each color actually sits on.
            const hex = (color: string, underlay: string) => {
              context.fillStyle = underlay
              context.fillRect(0, 0, 1, 1)
              context.fillStyle = color
              context.fillRect(0, 0, 1, 1)
              return '#' + [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
                .map(channel => channel.toString(16).padStart(2, '0')).join('')
            }
            const canvas = getComputedStyle(document.documentElement).getPropertyValue('--color-bg')
            const ancestors: Element[] = []
            for (let parent = element.parentElement; parent; parent = parent.parentElement) ancestors.unshift(parent)
            const surface = ancestors.reduce((underlay, ancestor) => hex(getComputedStyle(ancestor).backgroundColor, underlay), canvas)
            const track = hex(getComputedStyle(element).backgroundColor, surface)
            return {
              track,
              thumb: hex(getComputedStyle(element, '::after').backgroundColor, track),
              surface,
            }
          })
          expect(contrast(colors.track, colors.surface), `${slug} ${colorScheme} imported=${!!palette} ${surface} checked=${checked}`).toBeGreaterThanOrEqual(3)
          expect(contrast(colors.thumb, colors.track)).toBeGreaterThanOrEqual(3)
          if (!checked) await expect(track).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
        }
      }
      if (await toggle.getAttribute(state) !== 'true') await toggle.click()
      await page.emulateMedia({ forcedColors: 'active' })
      await toggle.focus()
      await toggle.press('Space')
      const ring = slug === 'switch' ? track : toggle
      await expect(ring).toHaveCSS('outline-style', 'solid')
      await expect(ring).toHaveCSS('outline-width', '2px')
      const off = await track.evaluate(element => ({
        fill: getComputedStyle(element).backgroundColor,
        border: getComputedStyle(element).borderColor,
        thumb: getComputedStyle(element, '::after').transform,
      }))
      expect(off.border).not.toBe(off.fill)
      await toggle.press('Space')
      const on = await track.evaluate(element => ({
        fill: getComputedStyle(element).backgroundColor,
        thumb: getComputedStyle(element, '::after').transform,
        thumbFill: getComputedStyle(element, '::after').backgroundColor,
      }))
      expect(on.thumb).not.toBe(off.thumb)
      expect(on.fill).not.toBe(off.fill)
      expect(on.thumbFill).not.toBe(on.fill)
      await page.emulateMedia({ forcedColors: 'none' })
    }
  }
})

test('contains drawer focus, dismisses it, and restores the trigger in both motion modes', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/#/sandbox/drawer')
    await page.getByLabel('Title', { exact: true }).fill('Page navigation')
    const trigger = page.locator('.playground-stage').getByRole('button', { name: 'Open drawer' })
    await trigger.click()
    const drawer = page.getByRole('dialog', { name: 'Page navigation', exact: true })
    await expect(drawer).toBeVisible()
    await expect(drawer).toHaveCSS('left', '0px')
    const close = drawer.getByRole('button', { name: 'Close drawer' })
    await close.focus()
    await close.press('Shift+Tab')
    await expect(drawer.getByRole('link')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await close.click()
    await expect(drawer).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
})

test('owns compact component typography independently of host styles', async ({ page }) => {
  for (const slug of ['button', 'card', 'alert', 'radio-card']) {
    await page.goto(`/#/sandbox/${slug}`)
    const stage = page.locator('.playground-stage')
    await stage.evaluate(element => {
      element.style.fontFamily = 'serif'
      element.style.fontSize = '24px'
      element.style.fontWeight = '700'
    })
    const component = stage.locator(`.fg-${slug}`).first()
    await expect(component).toHaveCSS('font-size', '14px')
    expect(await component.evaluate(element => getComputedStyle(element).fontFamily)).toContain('sans-serif')
    if (slug === 'alert') {
      await expect(component).toHaveCSS('border-left-width', '1px')
      await expect(component).toHaveCSS('border-right-width', '1px')
    }
  }
})

test('keeps documentation heading hierarchy without decorative preview chrome', async ({ page }) => {
  await page.goto('/#/components/button')
  const heading = page.locator('h1')
  expect(await heading.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBe(44)
  const sectionHeading = page.getByRole('heading', { name: 'Usage', exact: true })
  expect(await sectionHeading.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(20)
  await expect(page.locator('.example-frame')).toHaveCSS('background-image', 'none')
  await page.goto('/#/sandbox/button')
  const controlLabel = page.locator('.playground-controls > .pane-label')
  await expect(controlLabel).toHaveCSS('text-transform', 'none')
  expect(await controlLabel.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
})

test('copies code exactly and follows editor theme colors', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/components/button')
  const block = page.locator('.fg-code-block').first()
  const source = await block.locator('code').textContent()
  expect(await block.locator('.fg-code-block__line').first().evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
  const copyBox = await block.getByRole('button', { name: 'Copy code' }).boundingBox()
  expect(copyBox?.height ?? 0).toBeGreaterThanOrEqual(44)
  expect(copyBox?.width ?? 0).toBeGreaterThanOrEqual(44)
  await block.getByRole('button', { name: 'Copy code' }).click()
  await expect(block.getByRole('status')).toHaveText('Code copied to clipboard.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source)
  await block.evaluate(element => {
    element.style.setProperty('--color-code', '#123456')
    element.style.setProperty('--color-code-text', '#abcdef')
  })
  await expect(block).toHaveCSS('background-color', 'rgb(18, 52, 86)')
  await expect(block).toHaveCSS('color', 'rgb(171, 205, 239)')
})

test('keeps compact commands in one row and wraps longer code beside a usable copy control', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/sandbox/code-block')
  await page.getByLabel('Variant', { exact: true }).selectOption('compact')
  await page.getByLabel('Language', { exact: true }).selectOption('bash')
  const block = page.locator('.playground-stage .fg-code-block')
  const copy = block.getByRole('button', { name: 'Copy code' })
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  expect(await block.locator('.fg-code-block__line').first().evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
  await page.getByLabel('Language', { exact: true }).selectOption('bash')
  expect(await block.locator('.fg-code-block__line').first().evaluate(element => getComputedStyle(element, '::before').content)).toContain('$ ')
  expect(await block.locator('pre').ariaSnapshot()).not.toContain('$ ')
  // Each prompt sits on its line's baseline, even if a phone browser resizes the text.
  await expect(block.locator('.fg-code-block__line').first()).toHaveCSS('align-items', 'baseline')

  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const blockBox = await block.boundingBox()
    const codeBox = await block.locator('pre').boundingBox()
    const copyBox = await copy.boundingBox()
    expect(blockBox?.height ?? Infinity).toBeLessThanOrEqual(60)
    expect(copyBox?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(copyBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect((codeBox?.x ?? 0) + (codeBox?.width ?? 0)).toBeLessThanOrEqual(copyBox?.x ?? 0)
    expect(Math.abs((codeBox?.y ?? 0) + (codeBox?.height ?? 0) / 2 -
      ((copyBox?.y ?? 0) + (copyBox?.height ?? 0) / 2))).toBeLessThan(2)
  }

  await copy.focus()
  await copy.press('Enter')
  await expect(block.getByRole('status')).toHaveText('Code copied to clipboard.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('pnpm add @filipgutica/ui')
  expect((await block.boundingBox())?.height ?? Infinity).toBeLessThanOrEqual(60)

  await page.setViewportSize({ width: 320, height: 900 })
  await page.getByLabel('Language', { exact: true }).selectOption('text')
  await page.getByRole('checkbox', { name: 'Wrap long lines', exact: true }).check()
  await expect(block.locator('code')).toHaveText('Copy this value into your workspace configuration.')
  expect(await block.locator('pre').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('highlights nested Vue markup in documentation snippets', async ({ page }) => {
  await page.goto('/#/components/radio-card')
  const block = page.locator('.fg-code-block').first()
  const nestedTag = block.locator('[style*="--color-syntax-tag"]').filter({ hasText: /^strong$/ }).first()
  await expect(nestedTag).toBeVisible()
  await block.evaluate(element => element.style.setProperty('--color-syntax-tag', '#ff88dd'))
  await expect(nestedTag).toHaveCSS('color', 'rgb(255, 136, 221)')
  await expect(block.locator('code')).not.toContainText('<template>')
})

test('highlights the selected language with imported theme colors and restores them after reload', async ({ page }) => {
  await page.goto('/#/sandbox/code-block')
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  const block = page.locator('.playground-stage .fg-code-block')
  const keyword = block.locator('code span').filter({ hasText: /^const$/ }).last()
  await expect(keyword).toBeVisible()
  await page.goto('/#/themes')
  const fileChooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose file', exact: true }).click()
  await (await fileChooser).setFiles({
    name: 'syntax-fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      name: 'Syntax fixture',
      type: 'dark',
      colors: { 'editor.background': '#151515', 'editor.foreground': '#eeeeee' },
      tokenColors: [
        { scope: ['keyword', 'storage.type'], settings: { foreground: '#ff88dd' } },
        { scope: 'string', settings: { foreground: '#88ddaa' } },
      ],
    })),
  })
  await expect(page.getByRole('radio', { name: 'Syntax fixture', exact: true })).toBeChecked()
  await page.goto('/#/sandbox/code-block')
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  await expect(keyword).toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.reload()
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  await expect(keyword).toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.goto('/#/themes')
  await page.getByRole('radio', { name: 'Light', exact: true }).click()
  await page.goto('/#/sandbox/code-block')
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  await expect(keyword).not.toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.getByLabel('Language', { exact: true }).selectOption('text')
  await expect(block.locator('code')).toHaveText(/.+/)
})

test('previews themed components on the introduction and keeps setup compact and copyable', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#/')
  const preview = page.getByRole('group', { name: 'Component preview' })
  const primary = preview.getByRole('button', { name: 'Primary action', exact: true })
  await expect(primary).toBeVisible()
  await preview.getByRole('searchbox', { name: 'Label', exact: true }).fill('Catppuccin')
  await expect(preview.getByRole('searchbox')).toHaveValue('Catppuccin')

  for (const choice of ['Light', 'Dark']) {
    await page.getByRole('button', { name: `${choice} theme`, exact: true }).click()
    await expect(primary).toHaveCSS('background-color', choice === 'Dark' ? 'rgb(230, 233, 235)' : 'rgb(16, 19, 21)')
    await expect(preview.getByRole('searchbox')).toHaveValue('Catppuccin')
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (width === 1280) {
        const rows = await preview.locator(':scope > div').evaluateAll(elements =>
          elements.map(element => element.getBoundingClientRect().y))
        expect(new Set(rows).size).toBe(1)
      }
      if (width <= 390) {
        const layout = await preview.evaluate(element => {
          const frame = element.getBoundingClientRect()
          return [...element.children].map(child => {
            const bounds = child.getBoundingClientRect()
            return { top: bounds.top, bottom: bounds.bottom, fits: bounds.left >= frame.left && bounds.right <= frame.right && child.scrollWidth <= child.clientWidth }
          })
        })
        expect(layout.every(example => example.fits)).toBe(true)
        for (let index = 1; index < layout.length; index += 1)
          expect(layout[index]!.top).toBeGreaterThanOrEqual(layout[index - 1]!.bottom)
        expect(await preview.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
        await preview.getByRole('link', { name: 'Alert', exact: true }).focus()
        expect(await preview.evaluate(element => element.scrollLeft)).toBe(0)
      }
    }
  }

  const blocks = page.locator('.home-page .fg-code-block')
  const install = blocks.nth(1)
  await expect(install.locator('.fg-code-block__title')).toHaveCount(0)
  expect((await install.boundingBox())?.height ?? Infinity).toBeLessThanOrEqual(60)
  await install.getByRole('button', { name: 'Copy code', exact: true }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('pnpm add @filipgutica/ui')
  await expect(blocks.locator('.fg-code-block__title')).toHaveText(['main.css', 'main.css', 'App.vue', 'ThemeButton.vue'])
  await expect(page.locator('.home-page .fg-alert[data-tone="info"]')).toContainText('HTTPS and Web Crypto')
})

test('renders the introduction and every documented component without horizontal overflow', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })
  page.on('pageerror', error => runtimeErrors.push(error.message))

  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of ['/', ...componentSlugs.map(slug => `/sandbox/${slug}`)]) {
      await page.goto(`/#${route}`)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
      )
    }
  }

  expect(runtimeErrors).toEqual([])
})

test('gives full-width controls a usable preview width', async ({ page }) => {
  const expectations = [
    { slug: 'input', selector: '.playground-stage > .fg-input' },
    { slug: 'select', selector: '.playground-stage > .fg-select' },
    { slug: 'progress', selector: '.playground-stage .fg-progress' },
    { slug: 'slider', selector: '.fg-slider__track' },
  ]

  for (const { selector, slug } of expectations) {
    await page.goto(`/#/sandbox/${slug}`)
    const box = await page.locator(selector).boundingBox()
    expect(box?.width ?? 0, `${slug} preview width`).toBeGreaterThan(240)
    if (slug === 'input' || slug === 'select') {
      for (const size of ['sm', 'md', 'lg']) {
        await page.getByLabel('Size', { exact: true }).selectOption(size)
        await expect(page.locator(selector)).toHaveCSS('border-radius', '10px')
      }
    }
  }
})

test('keeps selects compact and operates the themed picker with the keyboard', async ({ page }) => {
  await page.goto('/#/sandbox/select')
  const select = page.locator('.playground-stage > .fg-select')
  const styles = await select.evaluate((element) => {
    const computed = getComputedStyle(element)
    return {
      appearance: computed.appearance,
      paddingLeft: Number.parseFloat(computed.paddingLeft),
      paddingRight: Number.parseFloat(computed.paddingRight),
    }
  })

  expect(styles.appearance).toBe('base-select')
  expect(styles.paddingLeft).toBeLessThanOrEqual(12)
  expect(styles.paddingRight).toBeGreaterThanOrEqual(24)
  expect(styles.paddingRight).toBeLessThanOrEqual(32)
  await select.press('Space')
  await expect(select.locator('option').filter({ hasText: 'Passed' })).toBeVisible()
  const picker = await select.evaluate(element => {
    const style = getComputedStyle(element, '::picker(select)')
    return { background: style.backgroundColor, radius: style.borderRadius }
  })
  // The picker remains raised while the closed control is a muted well.
  const raisedFill = await select.evaluate(element => {
    const probe = document.createElement('span')
    probe.style.backgroundColor = 'var(--color-input-bg)'
    element.after(probe)
    const fill = getComputedStyle(probe).backgroundColor
    probe.remove()
    return fill
  })
  expect(picker.background).toBe(raisedFill)
  // The picker is a floating layer, so it takes the panel radius.
  expect(picker.radius).toBe(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--radius-panel').trim()))
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toHaveValue('passed')
  await expect(select).toBeFocused()

  // Pointer hover fills a row; only the keyboard position draws the focus ring.
  await select.press('Space')
  const hovered = select.locator('option').first()
  await hovered.hover()
  await expect(hovered).toHaveCSS('outline-style', 'none')
  await page.keyboard.press('ArrowDown')
  await expect(select.locator('option:focus-visible')).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Escape')
})

test('marks checked radio cards and checkboxes with the accent', async ({ page }) => {
  const accent = 'rgb(75, 69, 209)'
  await page.goto('/#/sandbox/radio-card-group')
  const selected = page.locator('.playground-stage .fg-radio-card[data-state="checked"]')
  await expect(selected.locator('.fg-radio-card__indicator')).toHaveCSS('background-color', accent)
  expect(await selected.locator('.fg-radio-card__indicator').evaluate(element => getComputedStyle(element, '::after').content)).not.toBe('none')
  await page.goto('/#/sandbox/checkbox')
  const checkbox = page.locator('.playground-stage .fg-checkbox__control')
  if (await checkbox.getAttribute('data-state') !== 'checked') await checkbox.click()
  await expect(checkbox).toHaveCSS('background-color', accent)
})

test('keeps borderless controls edged and focus visible in forced colors', async ({ page }) => {
  for (const { slug, selector } of [
    { slug: 'input', selector: '.playground-stage > .fg-input' },
    { slug: 'select', selector: '.playground-stage > .fg-select' },
    { slug: 'segmented-control', selector: '.playground-stage .fg-segmented' },
    { slug: 'radio-card-group', selector: '.playground-stage .fg-radio-card' },
    { slug: 'button', selector: '.playground-stage .fg-button' },
  ]) {
    await page.emulateMedia({ forcedColors: 'none' })
    await page.goto(`/#/sandbox/${slug}`)
    const control = page.locator(selector).first()
    await expect(control).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    // The dark well sits within 1.1:1 of its host, so fields alone keep a faint edge there.
    if (slug === 'input' || slug === 'select') {
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(control).toHaveCSS('border-color', 'rgb(38, 45, 51)')
      await page.emulateMedia({ colorScheme: 'light' })
    }
    await page.emulateMedia({ forcedColors: 'active' })
    await expect(control).toHaveCSS('border-style', 'solid')
    await expect(control).toHaveCSS('border-width', '1px')
    const edge = await control.evaluate(element => {
      const style = getComputedStyle(element)
      return { border: style.borderColor, fill: style.backgroundColor }
    })
    expect(edge.border).not.toBe(edge.fill)
    expect(edge.border).not.toBe('rgba(0, 0, 0, 0)')
    const focusTarget = slug === 'segmented-control' ? control.getByRole('button').first() : control
    await focusTarget.focus()
    await expect(focusTarget).toHaveCSS('outline-style', 'solid')
    await expect(focusTarget).toHaveCSS('outline-width', '2px')
  }
})

test('slides the segmented thumb from the previous option and settles on the pressed one', async ({ page }) => {
  await page.goto('/#/sandbox/segmented-control')
  const control = page.locator('.playground-stage .fg-segmented')
  // The thumb's page edges, and the edges of the CSS thumb inset inside a button.
  const thumbEdges = (index: number) => control.evaluate((element, index) => {
    const button = element.children[index]!
    const rect = button.getBoundingClientRect()
    const thumb = getComputedStyle(button, '::before')
    return { left: rect.left + parseFloat(thumb.left), right: rect.right - parseFloat(thumb.right), inset: [thumb.left, thumb.right] }
  }, index)
  const runningAnimations = () => control.evaluate(element => element.getAnimations({ subtree: true }).length)
  await expect(control.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
  expect(await runningAnimations(), 'no animation on first paint').toBe(0)

  await control.getByRole('button', { name: 'Timeline' }).click()
  await control.evaluate(element => element.getAnimations({ subtree: true }).forEach((animation) => {
    animation.pause()
    animation.currentTime = 0
  }))
  const start = await thumbEdges(2)
  const previous = await thumbEdges(0)
  // The thumb leaves from the option that was pressed, not from the new one or the track's start.
  expect(start.left).toBeCloseTo(previous.left, 0)
  expect(start.right).toBeCloseTo(previous.right, 0)

  // Mid-glide the leading edge is further along than the trailing edge, so the thumb stretches.
  await control.evaluate(element => element.getAnimations({ subtree: true }).forEach((animation) => { animation.currentTime = 100 }))
  const target = await control.evaluate((element) => {
    const rect = element.children[2]!.getBoundingClientRect()
    return { left: rect.left + 2, right: rect.right - 2 }
  })
  const glide = await thumbEdges(2)
  const leading = (glide.right - start.right) / (target.right - start.right)
  const trailing = (glide.left - start.left) / (target.left - start.left)
  // A clear lead, not rounding: about 0.09 of the travel at 100ms.
  expect(leading - trailing).toBeGreaterThan(0.04)
  expect(trailing).toBeGreaterThan(0)

  // A new choice mid-slide leaves from where the thumb is, without a jump.
  await control.evaluate(element => element.getAnimations({ subtree: true }).forEach((animation) => { animation.currentTime = 60 }))
  const midway = await thumbEdges(2)
  await control.getByRole('button', { name: 'Board' }).click()
  await control.evaluate(element => element.getAnimations({ subtree: true }).forEach((animation) => {
    animation.pause()
    animation.currentTime = 0
  }))
  const restart = await thumbEdges(1)
  expect(restart.left).toBeCloseTo(midway.left, 0)
  expect(restart.right).toBeCloseTo(midway.right, 0)

  await control.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => animation.finish()))
  await expect.poll(runningAnimations).toBe(0)
  expect((await thumbEdges(1)).inset).toEqual(['2px', '2px'])

  // Resizing moves no thumb and leaves it inside the pressed button.
  await page.setViewportSize({ width: 390, height: 800 })
  await control.evaluate(element => { element.style.fontSize = '20px' })
  expect(await runningAnimations()).toBe(0)
  expect((await thumbEdges(1)).inset).toEqual(['2px', '2px'])

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await control.getByRole('button', { name: 'Board' }).click()
  await expect(control.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true')
  expect(await runningAnimations(), 'reduced motion changes the choice at once').toBe(0)
  expect((await thumbEdges(1)).inset).toEqual(['2px', '2px'])
})

test('renders usable slider tracks in documentation examples', async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/components/slider')
    const track = page.locator('.example-frame .fg-slider__track')
    await expect(track).toBeVisible()
    expect((await track.boundingBox())?.width ?? 0).toBeGreaterThan(180)
    const thumb = page.getByRole('slider', { name: 'Confidence threshold' })
    const previousValue = Number(await thumb.getAttribute('aria-valuenow'))
    await thumb.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', String(previousValue + 1))
  }
})

test('operates the slider with pointer and keyboard input', async ({ page }) => {
  await page.goto('/#/sandbox/slider')
  const track = page.locator('.fg-slider__track')
  const thumb = page.getByRole('slider', { name: 'Confidence threshold' })
  const trackBox = await track.boundingBox()

  expect(trackBox?.width ?? 0).toBeGreaterThan(240)
  await page.mouse.click(
    (trackBox?.x ?? 0) + (trackBox?.width ?? 0) * 0.8,
    (trackBox?.y ?? 0) + (trackBox?.height ?? 0) / 2,
  )
  await expect(thumb).toHaveAttribute('aria-valuenow', /^(79|80|81)$/)

  await thumb.press('ArrowRight')
  await expect(thumb).toHaveAttribute('aria-valuenow', /^(80|81|82)$/)

  await page.getByRole('checkbox', { name: 'Disabled' }).click()
  const disabledValue = await thumb.getAttribute('aria-valuenow')
  await thumb.press('ArrowRight')
  await expect(thumb).toHaveAttribute('aria-valuenow', disabledValue ?? '')
})

test('keeps theme cards compact on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/themes')

  await expect(page.getByRole('heading', { name: 'Themes', exact: true, level: 1 })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: 'Search themes' })).toBeVisible()

  const cardBox = await page.getByRole('radio', { name: /System/ }).boundingBox()
  expect(cardBox?.height ?? 0).toBeLessThanOrEqual(140)
})

test('supports keyboard selection on the themes page', async ({ page }) => {
  await page.goto('/#/themes')

  const system = page.getByRole('radio', { name: /System/ })
  const light = page.getByRole('radio', { name: /Light/ })
  await system.focus()
  await system.press('ArrowRight')
  await expect(light).toBeChecked()
})


test('navigates with the mobile drawer and restores focus on dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/components/dialog')
  const trigger = page.getByRole('button', { name: /^Browse components:/ })
  expect((await trigger.boundingBox())?.x ?? 390).toBeLessThan(60)
  await trigger.click()
  const drawer = page.getByRole('dialog', { name: 'Browse components', exact: true })
  await expect(drawer).toBeVisible()
  expect((await drawer.boundingBox())?.x).toBe(0)
  await expect(drawer.getByRole('link', { name: 'Dialog', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.keyboard.press('Escape')
  await expect(drawer).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await drawer.getByRole('link', { name: 'Button', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await expect(page.locator('h1')).toHaveText('Button')
  await expect(page.locator('h1')).toBeFocused()
  await trigger.click()
  await drawer.getByRole('link', { name: 'Themes', exact: true }).click()
  await expect(page).toHaveURL(/#\/themes$/)
  await expect(page.locator('h1')).toHaveText('Themes')
  await expect(trigger).toHaveText('Themes')
  await trigger.click()
  await expect(drawer.getByRole('link', { name: 'Themes', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.setViewportSize({ width: 1280, height: 844 })
  await expect(drawer).not.toBeVisible()
  await expect(trigger).not.toBeVisible()
})


test('keeps the project menu current state distinct and restores keyboard focus', async ({ page }) => {
  for (const width of [320, 800, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/components/button')
    const trigger = page.locator('.fg-site-projects > summary')
    await trigger.click()
    const projects = page.getByRole('navigation', { name: 'Projects', exact: true })
    const current = projects.getByRole('link', { name: 'UI', exact: true })
    await expect(current).toHaveAttribute('aria-current', 'page')
    for (const row of await projects.getByRole('link').all()) await row.hover()
    if (width === 320) {
      for (const row of await projects.getByRole('link').all())
        expect((await row.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
    const fill = await current.evaluate(element => getComputedStyle(element).backgroundColor)
    await current.hover()
    await expect(current).toHaveCSS('background-color', fill)
    await current.focus()
    await page.keyboard.press('Escape')
    await expect(projects).toBeHidden()
    await expect(trigger).toBeFocused()
  }
})

test('keeps status labels readable on their colored fills in both appearances', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const slug of ['badge', 'alert', 'button']) {
      await page.goto(`/#/sandbox/${slug}`)
      const statuses = page.locator(`.playground-stage .fg-${slug}`)
      await expect(statuses.first()).toBeVisible()
      if (slug === 'button') {
        await expect(statuses.first()).toHaveCSS('background-color', colorScheme === 'dark' ? 'rgb(230, 233, 235)' : 'rgb(16, 19, 21)')
      }
      const variants = slug === 'button' ? ['danger'] : ['info', 'success', 'warning', 'danger', 'error']
      for (const variant of variants) {
        await page.getByLabel(slug === 'button' ? 'Variant' : 'Tone', { exact: true }).selectOption(variant)
        await expect(statuses.first()).toHaveAttribute(slug === 'button' ? 'data-variant' : 'data-tone', variant)
        for (const hovered of [false, true]) {
          if (hovered) await statuses.first().hover()
          else await page.locator('h1').hover()
          const colors = await statuses.evaluateAll(elements => {
            const canvas = document.createElement('canvas')
            canvas.width = canvas.height = 1
            const context = canvas.getContext('2d')!
            const hex = (color: string) => {
              context.clearRect(0, 0, 1, 1)
              context.fillStyle = color
              context.fillRect(0, 0, 1, 1)
              const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
              return '#' + [red, green, blue].map(channel => channel!.toString(16).padStart(2, '0')).join('')
            }
            return elements.map(element => {
              const style = getComputedStyle(element)
              return { tone: element.getAttribute('data-tone'), foreground: hex(style.color), background: hex(style.backgroundColor) }
            })
          })
          for (const { tone, foreground, background } of colors)
            expect(contrast(foreground, background), `${colorScheme} ${slug} ${tone ?? variant} hover=${hovered}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  }
})

test('keeps component browsing reachable after scrolling on phones and tablets', async ({ page }) => {
  for (const width of [320, 800]) {
    await page.setViewportSize({ width, height: 700 })
    await page.goto('/#/components/button')
    await page.getByRole('heading', { name: 'Props', exact: true }).scrollIntoViewIfNeeded()
    const trigger = page.getByRole('button', { name: /^Browse components:/ })
    const bounds = await trigger.boundingBox()
    expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0)
    expect((bounds?.y ?? 700) + (bounds?.height ?? 0)).toBeLessThanOrEqual(700)
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Browse components', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  }
})
