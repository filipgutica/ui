import { tryOnMounted, usePreferredDark, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

import type { ComputedRef } from 'vue'

export type SiteAppearanceChoice = 'system' | 'light' | 'dark'
export type SiteAppearance = 'light' | 'dark'

/** The choice is shared by every site in the family, so it must not change. */
export const SITE_APPEARANCE_KEY = 'tool-site-theme'

const isChoice = (value: unknown): value is SiteAppearanceChoice =>
  value === 'system' || value === 'light' || value === 'dark'

/**
 * Inline this in the document head, before the stylesheet paints, to avoid a flash
 * of the wrong appearance. It applies the stored choice exactly as
 * `applySiteAppearance` does and never throws.
 */
export const siteThemeBootScript = `(function () {
  var root = document.documentElement, choice;
  try { choice = localStorage.getItem('${SITE_APPEARANCE_KEY}'); } catch (error) {}
  var dark = choice === 'dark';
  if (choice !== 'light' && choice !== 'dark') {
    try { dark = matchMedia('(prefers-color-scheme: dark)').matches; } catch (error) {}
  }
  root.classList.toggle('dark', dark);
  if (choice === 'light' || choice === 'dark') root.dataset.theme = choice;
})();`

/** System removes the explicit override. Light and dark set it. */
export const applySiteAppearance = ({ root, choice, appearance }: {
  root: HTMLElement
  choice: SiteAppearanceChoice
  appearance: SiteAppearance
}): void => {
  root.classList.toggle('dark', appearance === 'dark')
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
}

/**
 * The shared System, Light, or Dark choice with the appearance it resolves to.
 * Every call shares the stored choice, and other tabs and the operating system
 * update it. Nothing reads storage or the browser until the component mounts, so
 * server rendering and hydration see `system`. Storage failures leave the choice
 * working for the current visit.
 *
 * By default the composable applies the appearance to `<html>`. Pass
 * `applyToRoot: false` when the page owns the root, for example while an imported
 * theme is active, and call `applySiteAppearance` yourself.
 */
export const useSiteAppearance = ({ applyToRoot = true }: { applyToRoot?: boolean } = {}): {
  choice: ComputedRef<SiteAppearanceChoice>
  appearance: ComputedRef<SiteAppearance>
  chooseAppearance: (value: SiteAppearanceChoice) => void
} => {
  const stored = useStorage<SiteAppearanceChoice>(SITE_APPEARANCE_KEY, 'system', undefined, {
    initOnMounted: true,
    writeDefaults: false,
    onError: () => {
      // Storage can be unavailable. The choice then lasts for this visit.
    },
    serializer: {
      read: (raw) => (isChoice(raw) ? raw : 'system'),
      write: (value) => value,
    },
  })
  const prefersDark = usePreferredDark()

  const choice = computed(() => stored.value)
  const appearance = computed<SiteAppearance>(() => {
    if (stored.value === 'system') return prefersDark.value ? 'dark' : 'light'
    return stored.value
  })

  if (applyToRoot) {
    tryOnMounted(() => {
      watch(
        [choice, appearance],
        () => applySiteAppearance({
          root: document.documentElement,
          choice: choice.value,
          appearance: appearance.value,
        }),
        { immediate: true },
      )
    })
  }

  return {
    choice,
    appearance,
    chooseAppearance: (value) => {
      if (isChoice(value)) stored.value = value
    },
  }
}
