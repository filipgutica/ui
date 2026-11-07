import { expect, test } from '@playwright/test'

// A visible fill must survive on both the canvas and the raised drawer surface.
test('raises the current page in both themes with a distinct dark fill', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const colorScheme of ['dark', 'light'] as const) {
    await page.emulateMedia({ colorScheme })
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/#/components/button')
      if (width === 375) await page.getByRole('button', { name: /^Browse components:/ }).click()
      const current = page.locator('.docs-navigation:visible a[aria-current="page"]')
      const state = await current.evaluate(element => {
        let parent = element.parentElement
        while (parent && getComputedStyle(parent).backgroundColor === 'rgba(0, 0, 0, 0)') parent = parent.parentElement
        const style = getComputedStyle(element)
        return { fill: style.backgroundColor, surface: parent && getComputedStyle(parent).backgroundColor, shadow: style.boxShadow }
      })
      if (colorScheme === 'dark') expect(state.fill, `${width}px dark selection`).not.toBe(state.surface)
      expect(state.shadow).not.toBe('none')
      expect(state.shadow).not.toContain('inset')
      await current.hover()
      await expect(current).toHaveCSS('background-color', state.fill)
      await page.keyboard.press('Tab')
      await current.focus()
      await expect(current).toHaveCSS('outline-style', 'solid')
      if (width === 375) await page.keyboard.press('Escape')
    }
  }
})

test('raises action buttons, sinks presses, and keeps depth with keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/sandbox/button')
  const button = page.locator('.playground-stage .fg-button').first()
  for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
    await page.getByLabel('Variant', { exact: true }).selectOption(variant)
    await page.locator('h1').click()
    const shadow = () => button.evaluate(element => getComputedStyle(element).boxShadow)
    const fill = await button.evaluate(element => getComputedStyle(element).backgroundColor)
    const restingShadow = await shadow()
    if (variant === 'ghost') expect(restingShadow).toBe('none')
    else {
      expect(await shadow()).not.toBe('none')
      expect(await shadow()).not.toContain('inset')
    }
    await page.keyboard.press('Tab')
    await button.focus()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS('outline-width', '2px')
    if (variant !== 'ghost') expect(await shadow()).toContain(restingShadow)
    await page.keyboard.down('Space')
    expect(await shadow()).toContain('inset')
    expect(await shadow()).not.toMatch(/0px 0px 0px 6px/)
    await expect(button).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 1)')
    expect(await button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(fill)
    await page.keyboard.up('Space')
    // A pointer press stays hovered, so the pressed fill has to win over the hover fill.
    if (variant === 'secondary' || variant === 'ghost') {
      const well = await page.evaluate(() => {
        const probe = document.body.appendChild(document.createElement('span'))
        probe.style.background = 'var(--color-well)'
        const color = getComputedStyle(probe).backgroundColor
        probe.remove()
        return color
      })
      await button.hover()
      await page.mouse.down()
      await expect(button).toHaveCSS('background-color', well)
      await page.mouse.up()
    }
    await button.evaluate(element => { element.setAttribute('disabled', '') })
    expect(await shadow()).toBe('none')
    await button.evaluate(element => { element.removeAttribute('disabled') })
  }
})

test('lifts a focused field out of its well instead of drawing a ring', async ({ page }) => {
  await page.goto('/#/sandbox/input')
  const input = page.locator('.playground-stage > .fg-input')
  const restFill = await input.evaluate(element => getComputedStyle(element).backgroundColor)
  await input.focus()
  await expect(input).toHaveCSS('outline-offset', '0px')
  expect(await input.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(restFill)
  expect(await input.evaluate(element => getComputedStyle(element).boxShadow)).not.toContain('inset')

  // An invalid field keeps its error edge while focused.
  const error = await input.evaluate(element => {
    element.setAttribute('aria-invalid', 'true')
    element.blur()
    return getComputedStyle(element).borderTopColor
  })
  await input.focus()
  await expect(input).toHaveCSS('border-top-color', error)
})

test('marks a pressed toggle card with its switch and a faint hairline, on square corners', async ({ page }) => {
  await page.goto('/#/components/toggle-button')
  const card = page.locator('.fg-toggle-button').first()
  if ((await card.getAttribute('aria-pressed')) !== 'true') await card.click()
  await page.locator('h1').click()
  await expect(card).toHaveCSS('border-top-left-radius', '10px')
  const { edge, accent } = await card.evaluate(element => ({
    edge: getComputedStyle(element).borderTopColor,
    accent: getComputedStyle(element).getPropertyValue('--color-accent').trim(),
  }))
  // A translucent accent edge, not the solid accent the switch track uses.
  expect(edge).not.toBe(await card.locator('.fg-toggle-button__switch').evaluate(element => getComputedStyle(element).backgroundColor))
  expect(edge).toMatch(/\/ 0\.35\)|, 0\.35\)/)
  expect(accent).not.toBe('')
  // Selected cards and rows take a faint accent tint, so they read on near-white panels.
  const fills = await page.evaluate(() => {
    const paint = (element: Element) => getComputedStyle(element).backgroundColor
    const cards = [...document.querySelectorAll('.fg-toggle-button')]
    const probe = document.createElement('div')
    probe.style.background = 'var(--color-surface-raised)'
    document.body.append(probe)
    const raised = paint(probe)
    probe.remove()
    return {
      pressed: paint(cards.find(card => card.getAttribute('aria-pressed') === 'true')!),
      current: paint(document.querySelector('[aria-current="page"]')!),
      raised,
    }
  })
  expect(fills.pressed).not.toBe(fills.raised)
  expect(fills.current).not.toBe(fills.raised)
})

// A local copy of the button drifts from the library's raise, hover, and press.
test('docs actions with the button fill are library buttons', async ({ page }) => {
  for (const route of ['/#/', '/#/components/button', '/#/sandbox/button', '/#/missing']) {
    await page.goto('/')
    await page.goto(route)
    await page.locator('main h1').waitFor()
    const strays = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement('span'))
      probe.style.background = 'var(--color-button-bg)'
      const fill = getComputedStyle(probe).backgroundColor
      probe.remove()
      return [...document.querySelectorAll('main a, main button')]
        .filter(element => getComputedStyle(element).backgroundColor === fill && !element.closest('.fg-button, .playground-stage'))
        .map(element => element.outerHTML.slice(0, 80))
    })
    expect(strays, route).toEqual([])
    const action = page.locator('main a.fg-button').first()
    if (await action.count()) expect(await action.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none')
  }
})
