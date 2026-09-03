<template>
  <UiButton
    variant="secondary"
    size="compact"
    aria-haspopup="dialog"
    @click="open = true"
  >
    <span class="theme-trigger-label">Theme: {{ activeTheme }}</span>
  </UiButton>

  <UiDialog
    :open="open"
    title="Choose a theme"
    description="Use a built-in appearance or import a color theme from Open VSX."
    @update:open="open = $event"
  >
    <div class="theme-picker">
      <section class="theme-built-ins" aria-labelledby="built-in-themes-heading">
        <h3 id="built-in-themes-heading">Built-in</h3>
        <div class="theme-choices">
          <UiButton
            class="theme-choice"
            variant="secondary"
            :aria-pressed="activeTheme === 'Light'"
            @click="applyBuiltIn('light')"
          >
            <span class="theme-swatch" data-appearance="light" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span class="theme-choice-label">
              <strong>Light</strong>
              <span>{{ activeTheme === 'Light' ? 'Selected' : 'Use theme' }}</span>
            </span>
          </UiButton>
          <UiButton
            class="theme-choice"
            variant="secondary"
            :aria-pressed="activeTheme === 'Dark'"
            @click="applyBuiltIn('dark')"
          >
            <span class="theme-swatch" data-appearance="dark" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span class="theme-choice-label">
              <strong>Dark</strong>
              <span>{{ activeTheme === 'Dark' ? 'Selected' : 'Use theme' }}</span>
            </span>
          </UiButton>
        </div>
      </section>

      <section aria-labelledby="open-vsx-themes-heading">
        <div class="theme-section-heading">
          <div>
            <h3 id="open-vsx-themes-heading">Open VSX</h3>
            <p>Import a VS Code color theme from the open registry.</p>
          </div>
        </div>
        <form class="theme-search" @submit.prevent="search">
          <UiField
            control-id="open-vsx-query"
            label="Search themes"
          >
            <UiInput
              id="open-vsx-query"
              v-model="query"
              type="search"
              placeholder="Catppuccin"
              :disabled="searching || Boolean(importingId)"
            />
          </UiField>
          <UiButton type="submit" :loading="searching" :disabled="Boolean(importingId)">Search</UiButton>
          <UiField control-id="theme-appearance" label="Appearance">
            <UiSelect id="theme-appearance" v-model="preferredAppearance">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </UiSelect>
          </UiField>
        </form>

        <UiAlert v-if="message && status === 'error'" tone="error">
          {{ message }}
        </UiAlert>
        <p v-else-if="message" class="theme-status" role="status">{{ message }}</p>

        <ul v-if="results.length" class="theme-results" aria-label="Open VSX theme results" tabindex="0">
          <li v-for="theme in results" :key="theme.id">
            <div>
              <strong>{{ theme.name }}</strong>
              <span>by {{ theme.publisher }}</span>
            </div>
            <UiButton
              variant="secondary"
              size="compact"
              :loading="importingId === theme.id"
              :disabled="Boolean(importingId)"
              @click="selectOpenVsxTheme(theme)"
            >
              Apply
            </UiButton>
          </li>
        </ul>
      </section>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { UiAlert, UiButton, UiDialog, UiField, UiInput, UiSelect } from '../../../src/index.js'
import { applySemanticTheme, type OpenVsxThemeSummary } from '../../../src/theme/index.js'
import { importOpenVsxTheme, searchOpenVsx } from '../open-vsx-client.js'

const open = ref(false)
const activeTheme = ref('Light')
const query = ref('Catppuccin')
const preferredAppearance = ref<'light' | 'dark'>('dark')
const results = ref<OpenVsxThemeSummary[]>([])
const status = ref<'idle' | 'error'>('idle')
const searching = ref(false)
const message = ref('')
const importingId = ref('')

const applyBuiltIn = (appearance: 'light' | 'dark'): void => {
  applySemanticTheme({ root: document.documentElement, theme: null })
  document.documentElement.classList.toggle('dark', appearance === 'dark')
  activeTheme.value = appearance === 'dark' ? 'Dark' : 'Light'
  open.value = false
}

const search = async (): Promise<void> => {
  if (!query.value.trim()) {
    status.value = 'error'
    message.value = 'Enter a theme name to search Open VSX.'
    return
  }
  searching.value = true
  status.value = 'idle'
  message.value = 'Searching Open VSX…'
  results.value = []
  try {
    results.value = await searchOpenVsx(query.value)
    status.value = 'idle'
    message.value = results.value.length
      ? `${results.value.length} themes found.`
      : 'No compatible themes found.'
  } catch (error) {
    status.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not search Open VSX.'
  } finally {
    searching.value = false
  }
}

const selectOpenVsxTheme = async (theme: OpenVsxThemeSummary): Promise<void> => {
  importingId.value = theme.id
  status.value = 'idle'
  message.value = `Importing ${theme.name}…`
  try {
    const importedTheme = await importOpenVsxTheme({
      extensionId: theme.id,
      preferredAppearance: preferredAppearance.value,
    })
    applySemanticTheme({ root: document.documentElement, theme: importedTheme })
    activeTheme.value = importedTheme.name
    status.value = 'idle'
    message.value = ''
    open.value = false
  } catch (error) {
    status.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not import that theme.'
  } finally {
    importingId.value = ''
  }
}
</script>
