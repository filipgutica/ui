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
  for (const variant of ['primary', 'secondary', 'ghost']) {
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
    await expect(button).toHaveCSS('outline-width', '2px')
    if (variant !== 'ghost') expect(await shadow()).toContain(restingShadow)
    await page.keyboard.down('Space')
    expect(await shadow()).toContain('inset')
    expect(await shadow()).toContain('6px')
    if (variant !== 'ghost') expect(await button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(fill)
    await page.keyboard.up('Space')
    await button.evaluate(element => { element.setAttribute('disabled', '') })
    expect(await shadow()).toBe('none')
    await button.evaluate(element => { element.removeAttribute('disabled') })
  }
})
