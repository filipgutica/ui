import { useLocalStorage } from '@vueuse/core'
import { computed, inject, onMounted, watch } from 'vue'
import type { InjectionKey } from 'vue'

import type { NormalizedTheme } from '../../src/theme/index.js'
import type { InstalledTheme } from './components/AddThemePanel.vue'

import { applySiteAppearance, SITE_APPEARANCE_KEY, useSiteAppearance } from '../../src/site/index.js'
import { applySemanticTheme, isNormalizedTheme } from '../../src/theme/index.js'

export const createDocsTheme = () => {
  // The built-in scheme is shared with the other project sites. The id of an installed
  // theme belongs to this gallery alone: while it resolves it wins, and `system` here
  // means no installed theme is active.
  const { choice: schemeChoice, appearance: schemeAppearance, chooseAppearance } = useSiteAppearance({ applyToRoot: false })
  const activeChoice = useLocalStorage('filipgutica-ui-active-theme', 'system')
  const storedThemes = useLocalStorage<unknown>('filipgutica-ui-installed-themes', [])

  const isInstalledTheme = (value: unknown): value is InstalledTheme => {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as { id?: unknown, theme?: unknown }
    return typeof candidate.id === 'string' && isNormalizedTheme(candidate.theme)
  }

  const installedThemes = computed<InstalledTheme[]>(() => Array.isArray(storedThemes.value)
    ? storedThemes.value.filter(isInstalledTheme).slice(0, 20)
    : [])

  const activeInstalledTheme = computed(() => installedThemes.value.find(({ id }) => id === activeChoice.value))
  const selection = computed(() => activeInstalledTheme.value ? activeChoice.value : schemeChoice.value)

  const preferredAppearance = computed<'light' | 'dark'>(() => {
    const activeTheme = activeInstalledTheme.value?.theme
    if (activeTheme) return activeTheme.appearance.includes('dark') ? 'dark' : 'light'
    return schemeAppearance.value
  })

  const applyActive = (): void => {
    const root = document.documentElement
    const installedTheme = activeInstalledTheme.value
    applySemanticTheme({ root, theme: installedTheme?.theme ?? null })
    if (!installedTheme) applySiteAppearance({ root, choice: schemeChoice.value, appearance: schemeAppearance.value })
  }

  const hasSharedChoice = (): boolean => {
    try {
      return localStorage.getItem(SITE_APPEARANCE_KEY) !== null
    } catch {
      // Without storage the shared choice cannot persist either way.
      return false
    }
  }

  // Earlier versions kept the built-in scheme under the gallery key. Move it to the
  // shared key once, unless the shared key already holds a choice.
  const migrateLegacyScheme = (): void => {
    if (activeChoice.value !== 'light' && activeChoice.value !== 'dark') return
    if (!hasSharedChoice()) chooseAppearance(activeChoice.value)
    activeChoice.value = 'system'
  }

  // Everything that touches the page waits for mount, after the shared choice has loaded.
  onMounted(() => {
    migrateLegacyScheme()
    watch([activeChoice, installedThemes], () => {
      if (activeChoice.value !== 'system' && !activeInstalledTheme.value) activeChoice.value = 'system'
    }, { immediate: true })
    watch([activeInstalledTheme, schemeChoice, schemeAppearance], applyActive, { immediate: true })
  })

  const select = (value: string): void => {
    const scheme = (['system', 'light', 'dark'] as const).find(choice => choice === value)
    if (scheme) {
      activeChoice.value = 'system'
      chooseAppearance(scheme)
      return
    }
    activeChoice.value = value
  }

  const saveAndSelectTheme = ({ id, theme }: { id: string, theme: NormalizedTheme }): void => {
    storedThemes.value = [
      { id, theme },
      ...installedThemes.value.filter(installedTheme => installedTheme.id !== id),
    ].slice(0, 20)
    activeChoice.value = id
  }

  return { schemeChoice, installedThemes, activeInstalledTheme, selection, preferredAppearance, select, saveAndSelectTheme }
}

export const docsThemeKey: InjectionKey<ReturnType<typeof createDocsTheme>> = Symbol('docsTheme')

export const useDocsTheme = () => {
  const theme = inject(docsThemeKey)
  if (!theme) throw new Error('Docs theme must be provided by the app.')
  return theme
}
