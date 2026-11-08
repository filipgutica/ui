import { expect, test } from '@playwright/test'

import type { Locator, Page } from '@playwright/test'

/** Resolves a shadow token to the computed `box-shadow` the browser paints for it. */
const resolveShadow = (page: Page, token: string): Promise<string> => page.evaluate(name => {
  const probe = document.body.appendChild(document.createElement('span'))
  probe.style.boxShadow = `var(${name})`
  const shadow = getComputedStyle(probe).boxShadow
  probe.remove()
  return shadow
}, token)

const shadowOf = (locator: Locator, pseudo?: string): Promise<string> =>
  locator.evaluate((element, pseudoElement) => getComputedStyle(element, pseudoElement).boxShadow, pseudo)

/** Splits a computed `box-shadow` into layers with their colour, offsets, blur, and inset flag. */
const shadowLayers = (shadow: string) => shadow === 'none' ? [] : shadow.split(/,(?![^(]*\))/).map(layer => {
  const [red = 0, green = 0, blue = 0, alpha = 1] = (/rgba?\(([^)]+)\)/.exec(layer)?.[1] ?? '').split(/[\s,/]+/).map(Number)
  const [x = 0, y = 0, blur = 0] = [...layer.replace(/rgba?\([^)]*\)/, '').matchAll(/(-?[\d.]+)px/g)].map(match => Number(match[1]))
  return { light: Math.min(red, green, blue) > 200 && alpha > 0, x, y, blur, inset: /\binset\b/.test(layer) }
})

/** A quiet lift: no outer layer blurs past 2px, and no light outer layer is offset or blurred into a highlight. */
const expectQuietLift = (shadow: string, label: string) => {
  const outer = shadowLayers(shadow).filter(layer => !layer.inset)
  expect(outer.length, `${label} has an outer shadow`).toBeGreaterThan(0)
  for (const layer of outer) {
    expect(layer.blur, `${label} blur`).toBeLessThanOrEqual(2)
    if (layer.light) expect(layer.x === 0 && layer.y === 0 && layer.blur === 0, `${label} has no light highlight`).toBe(true)
  }
}

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

for (const colorScheme of ['light', 'dark'] as const) test(`raises action buttons, sinks presses, and keeps depth with keyboard focus in ${colorScheme}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme })
  await page.goto('/#/sandbox/button')
  const button = page.locator('.playground-stage .fg-button').first()
  const raise = await resolveShadow(page, '--shadow-raise')
  const sink = await resolveShadow(page, '--shadow-sink')
  expect(raise).not.toBe(sink)
  for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
    await page.getByLabel('Variant', { exact: true }).selectOption(variant)
    await page.locator('h1').click()
    const shadow = () => button.evaluate(element => getComputedStyle(element).boxShadow)
    const fill = await button.evaluate(element => getComputedStyle(element).backgroundColor)
    const restingShadow = await shadow()
    expect(restingShadow).toBe(variant === 'ghost' ? 'none' : raise)
    await page.keyboard.press('Tab')
    await button.focus()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS('outline-width', '2px')
    expect(await shadow()).toBe(restingShadow)
    await page.keyboard.down('Space')
    expect(await shadow()).toBe(sink)
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

// Containers take the surface tier and idle controls the raise tier. Neither may blur into a soft
// halo or carry an offset light highlight, which read as heavy and fuzzy, worst in dark mode.
test('keeps idle controls and surfaces to a quiet lift in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme })
    await page.goto('/#/components/card')
    const raise = await resolveShadow(page, '--shadow-raise')
    const surface = await resolveShadow(page, '--shadow-surface')
    expect(surface, `${colorScheme} surface token`).not.toBe('none')
    expect(surface).not.toBe(raise)
    expectQuietLift(raise, `${colorScheme} raise`)
    expectQuietLift(surface, `${colorScheme} surface`)

    expect(await shadowOf(page.locator('.fg-example__stage .fg-card')), `${colorScheme} card`).toBe(surface)
    // The example frame is a figure well: an edge and no shadow, so the stage shows each component's own depth.
    expect(await shadowOf(page.locator('.fg-example')), `${colorScheme} example frame`).toBe('none')
    expect(await shadowOf(page.locator('.fg-example > .fg-code-block')), `${colorScheme} example source`).toBe('none')
    await page.goto('/#/components/code-block')
    expect(await shadowOf(page.locator('.fg-example__stage .fg-code-block').first()), `${colorScheme} code block`).toBe(surface)
    await page.goto('/#/components/button')
    expect(await shadowOf(page.locator('.fg-example__stage .fg-button')), `${colorScheme} button`).toBe(raise)
    await page.goto('/#/components/segmented-control')
    expect(await shadowOf(page.locator('.fg-example__stage .fg-segmented__item[aria-pressed="true"]'), '::before'), `${colorScheme} segmented thumb`).toBe(raise)
  }
})

test('lifts a focused field out of its well instead of drawing a ring', async ({ page }) => {
  await page.goto('/#/sandbox/input')
  const input = page.locator('.playground-stage > .fg-input')
  const restFill = await input.evaluate(element => getComputedStyle(element).backgroundColor)
  await input.focus()
  await expect(input).toHaveCSS('outline-offset', '0px')
  expect(await input.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(restFill)
  expect(await shadowOf(input)).toBe(await resolveShadow(page, '--shadow-raise'))

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
  // Inspect the final paint rather than a frame of the selection fade.
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
