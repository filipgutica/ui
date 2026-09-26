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
        v-model="activeChoice"
        class="theme-picker"
        aria-label="Theme"
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
import { useLocalStorage, usePreferredColorScheme } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import type { NormalizedTheme } from '../../../src/theme/index.js'
import type { InstalledTheme } from './AddThemePanel.vue'

import { UiButton, UiDialog, UiRadioCard, UiRadioCardGroup } from '../../../src/index.js'
import { applySemanticTheme, isNormalizedTheme } from '../../../src/theme/index.js'
import AddThemePanel from './AddThemePanel.vue'
import ThemePreview from './ThemePreview.vue'

type PickerView = 'choose' | 'add'

const open = ref(false)
const view = ref<PickerView>('choose')
const preferredColorScheme = usePreferredColorScheme()
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

const preferredAppearance = computed<'light' | 'dark'>(() => {
  if (activeChoice.value === 'light' || activeChoice.value === 'dark') return activeChoice.value
  const activeTheme = installedThemes.value.find(({ id }) => id === activeChoice.value)?.theme
  if (activeTheme) return activeTheme.appearance.includes('dark') ? 'dark' : 'light'
  return preferredColorScheme.value === 'dark' ? 'dark' : 'light'
})

const activeThemeName = computed(() => {
  if (activeChoice.value === 'system') return 'System'
  if (activeChoice.value === 'light') return 'Light'
  if (activeChoice.value === 'dark') return 'Dark'
  return installedThemes.value.find(({ id }) => id === activeChoice.value)?.theme.name ?? 'System'
})

const applyBuiltIn = (appearance: 'light' | 'dark'): void => {
  applySemanticTheme({ root: document.documentElement, theme: null })
  document.documentElement.classList.toggle('dark', appearance === 'dark')
}

const applyChoice = (choice: string): void => {
  if (choice === 'system') {
    applyBuiltIn(preferredAppearance.value)
    return
  }
  if (choice === 'light' || choice === 'dark') {
    applyBuiltIn(choice)
    return
  }
  const installedTheme = installedThemes.value.find(({ id }) => id === choice)
  if (installedTheme) {
    applySemanticTheme({ root: document.documentElement, theme: installedTheme.theme })
    return
  }
  activeChoice.value = 'system'
  applyBuiltIn(preferredAppearance.value)
}

watch(
  [activeChoice, preferredAppearance, installedThemes],
  ([choice]) => applyChoice(choice),
  { deep: true, immediate: true },
)

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
