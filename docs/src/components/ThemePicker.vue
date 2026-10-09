<template>
  <UiButton
    variant="secondary"
    size="sm"
    aria-haspopup="dialog"
    @click="openPicker"
  >
    <span class="theme-trigger-label">Theme: {{ activeThemeName }}</span>
  </UiButton>

  <UiDialog
    :open="open"
    :title="view === 'choose' ? 'Choose a theme' : 'Add a theme'"
    :description="view === 'choose'
      ? 'Choose how the component library looks in these docs.'
      : 'Import a VS Code theme file, or search community themes where available.'"
    @update:open="open = $event"
  >
    <template v-if="view === 'choose'">
      <UiRadioCardGroup
        :model-value="selection"
        class="theme-picker"
        aria-label="Theme"
        @update:model-value="select"
      >
        <section aria-labelledby="color-scheme-heading">
          <h3 id="color-scheme-heading">
            Color scheme
          </h3>
          <div class="theme-scheme-grid">
            <UiRadioCard value="system">
              <ThemePreview appearance="system" />
              <span class="theme-card-label">System</span>
            </UiRadioCard>
            <UiRadioCard value="light">
              <ThemePreview appearance="light" />
              <span class="theme-card-label">Light</span>
            </UiRadioCard>
            <UiRadioCard value="dark">
              <ThemePreview appearance="dark" />
              <span class="theme-card-label">Dark</span>
            </UiRadioCard>
          </div>
        </section>

        <section aria-labelledby="installed-themes-heading">
          <div class="theme-section-heading">
            <div>
              <h3 id="installed-themes-heading">
                Themes
              </h3>
              <p v-if="installedThemes.length === 0">
                Add a community theme or import a theme file.
              </p>
            </div>
            <UiButton
              variant="secondary"
              size="sm"
              @click.stop="view = 'add'"
            >
              <span aria-hidden="true">＋</span> Add theme
            </UiButton>
          </div>
          <div
            v-if="installedThemes.length"
            class="theme-installed-grid"
          >
            <UiRadioCard
              v-for="installedTheme in installedThemes"
              :key="installedTheme.id"
              :value="installedTheme.id"
            >
              <ThemePreview
                :appearance="installedTheme.theme.appearance.includes('dark') ? 'dark' : 'light'"
                :theme="installedTheme.theme"
              />
              <span class="theme-card-label">{{ installedTheme.theme.name }}</span>
            </UiRadioCard>
          </div>
        </section>
      </UiRadioCardGroup>
    </template>

    <template v-else>
      <AddThemePanel
        :preferred-appearance="preferredAppearance"
        @installed="saveAndSelectTheme"
      />
    </template>

    <template #footer>
      <UiButton
        v-if="view === 'choose'"
        @click="open = false"
      >
        Done
      </UiButton>
      <UiButton
        v-else
        variant="secondary"
        @click="view = 'choose'"
      >
        Back to themes
      </UiButton>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'

import type { NormalizedTheme } from '../../../src/theme/index.js'
import type { SiteAppearanceChoice } from '../../../src/site/index.js'
import type { InstalledTheme } from './AddThemePanel.vue'

import { UiButton, UiDialog, UiRadioCard, UiRadioCardGroup } from '../../../src/index.js'
import { applySiteAppearance, SITE_APPEARANCE_KEY, useSiteAppearance } from '../../../src/site/index.js'
import { applySemanticTheme, isNormalizedTheme } from '../../../src/theme/index.js'
import AddThemePanel from './AddThemePanel.vue'
import ThemePreview from './ThemePreview.vue'

type PickerView = 'choose' | 'add'

const schemeLabels: Record<SiteAppearanceChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' }

const open = ref(false)
const view = ref<PickerView>('choose')

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

const activeThemeName = computed(() => activeInstalledTheme.value?.theme.name ?? schemeLabels[schemeChoice.value])

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

const openPicker = (): void => {
  view.value = 'choose'
  open.value = true
}

const saveAndSelectTheme = ({ id, theme }: { id: string, theme: NormalizedTheme }): void => {
  storedThemes.value = [
    { id, theme },
    ...installedThemes.value.filter(installedTheme => installedTheme.id !== id),
  ].slice(0, 20)
  activeChoice.value = id
  view.value = 'choose'
  open.value = false
}
</script>
