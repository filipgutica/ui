import { expect, test } from '@playwright/test'

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
  'input',
  'progress',
  'radio-card',
  'radio-card-group',
  'select',
  'slider',
  'tabs',
]

test('operates tabs with the keyboard and retains panel contents', async ({ page }) => {
  await page.goto('/#/sandbox/tabs')
  const stage = page.locator('.playground-stage')
  await page.getByLabel('Group label', { exact: true }).fill('Capture views')
  await expect(stage.getByRole('tablist', { name: 'Capture views', exact: true })).toBeVisible()
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

test('keeps documentation hierarchy compact without decorative preview chrome', async ({ page }) => {
  await page.goto('/#/components/button')
  const heading = page.locator('h1')
  expect(await heading.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(32)
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
  await page.getByRole('button', { name: /^Theme:/ }).click()
  await page.getByRole('button', { name: /Add theme/ }).click()
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
  await expect(page.getByRole('button', { name: 'Theme: Syntax fixture', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(keyword).toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.reload()
  await page.getByLabel('Language', { exact: true }).selectOption('typescript')
  await expect(keyword).toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.getByRole('button', { name: 'Theme: Syntax fixture', exact: true }).click()
  await page.getByRole('radio', { name: 'Light', exact: true }).click()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(keyword).not.toHaveCSS('color', 'rgb(255, 136, 221)')
  await page.getByLabel('Language', { exact: true }).selectOption('text')
  await expect(block.locator('code')).toHaveText(/.+/)
})

test('renders every documented component without horizontal overflow', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })
  page.on('pageerror', error => runtimeErrors.push(error.message))

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const slug of componentSlugs) {
      await page.goto(`/#/sandbox/${slug}`)
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
  expect(picker.background).toBe(await select.evaluate(element => getComputedStyle(element).backgroundColor))
  expect(picker.radius).toBe('8px')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toHaveValue('passed')
  await expect(select).toBeFocused()
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

test('keeps the theme picker compact on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/components/button')
  await page.getByRole('button', { name: /^Theme:/ }).click()

  await expect(page.getByRole('dialog', { name: 'Choose a theme' })).toBeVisible()
  const addTheme = page.getByRole('button', { name: /Add theme/ })
  const addThemeBox = await addTheme.boundingBox()
  expect(addThemeBox?.height ?? 0).toBeLessThanOrEqual(40)

  const cardBox = await page.getByRole('radio', { name: /System/ }).boundingBox()
  expect(cardBox?.height ?? 0).toBeLessThanOrEqual(140)
})

test('supports keyboard selection in the theme picker', async ({ page }) => {
  await page.goto('/#/components/button')
  await page.getByRole('button', { name: /^Theme:/ }).click()

  const system = page.getByRole('radio', { name: /System/ })
  const light = page.getByRole('radio', { name: /Light/ })
  await system.focus()
  await system.press('ArrowRight')
  await expect(light).toBeChecked()
})


test('navigates with the mobile drawer and restores focus on dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/components/dialog')
  const trigger = page.getByRole('button', { name: 'Browse components', exact: true })
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
  await page.setViewportSize({ width: 1280, height: 844 })
  await expect(drawer).not.toBeVisible()
  await expect(trigger).not.toBeVisible()
})
