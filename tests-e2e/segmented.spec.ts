import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

// The docs dev server serves this fixture through Vite's /@fs/ route, so it uses the real components.
const fixture = `/@fs${fileURLToPath(new URL('./fixtures/segmented.html', import.meta.url))}`

const driven = (page: Page) => page.locator('#driven .fg-segmented')
const runningAnimations = (page: Page) => driven(page).evaluate(element =>
  element.getAnimations({ subtree: true }).map(animation => (animation as CSSAnimation).animationName ?? (animation as CSSTransition).transitionProperty))
const slides = async (page: Page) => (await runningAnimations(page)).filter(name => name?.startsWith('fg-segmented-'))
const setView = (page: Page, value: string | undefined) =>
  page.evaluate(value => (window as unknown as { setView: (value: string | undefined) => void }).setView(value), value)

test('restores a stored appearance choice into a hydrated picker without motion', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('tool-site-theme', 'dark')
    const starts: string[] = []
    Object.assign(window, { segmentedStarts: starts })
    document.addEventListener('animationstart', (event) => {
      if (event.target instanceof Element && event.target.closest('#hydrated')) starts.push(event.animationName)
    }, true)
    document.addEventListener('transitionstart', (event) => {
      if (event.target instanceof Element && event.target.closest('#hydrated')) starts.push(event.propertyName)
    }, true)
  })
  const errors: string[] = []
  page.on('console', (message) => { if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text()) })
  await page.goto(fixture)
  await expect(page.locator('#hydrated').getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveClass(/dark/)
  // Longer than one slide, so motion that started on load would have reported.
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => (window as unknown as { segmentedStarts: string[] }).segmentedStarts)).toEqual([])
  expect(errors.filter(text => /hydration/i.test(text))).toEqual([])
})

test('changes no option colour when only the theme changes', async ({ page }) => {
  await page.goto(fixture)
  await expect(driven(page).getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(() => document.documentElement.classList.toggle('dark'))
  expect(await runningAnimations(page)).toEqual([])
})

test('drops the slide when the choice is cleared and draws no thumb', async ({ page }) => {
  await page.goto(fixture)
  await driven(page).getByRole('button', { name: 'Timeline' }).click()
  await page.mouse.move(0, 0)
  await driven(page).evaluate(element => element.getAnimations({ subtree: true }).forEach((animation) => {
    if (!(animation as CSSAnimation).animationName?.startsWith('fg-segmented-')) return
    animation.pause()
    animation.currentTime = 60
  }))

  await setView(page, undefined)
  await expect(driven(page).locator('[aria-pressed="true"]')).toHaveCount(0)
  expect(await slides(page), 'a cleared choice keeps no slide').toEqual([])
  const fills = await driven(page).evaluate(element => [...element.children].map(button => getComputedStyle(button, '::before').backgroundColor))
  expect(fills).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'])

  // Restoring the choice shows the thumb at once instead of resuming the old slide.
  await setView(page, 'timeline')
  await expect(driven(page).getByRole('button', { name: 'Timeline' })).toHaveAttribute('aria-pressed', 'true')
  expect(await slides(page)).toEqual([])
})

test('keeps no slide to replay after a reduced-motion choice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(fixture)
  await driven(page).getByRole('button', { name: 'Board' }).click()
  await expect(driven(page).getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true')
  expect(await runningAnimations(page)).toEqual([])
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await runningAnimations(page), 'turning motion back on replays nothing').toEqual([])
})
