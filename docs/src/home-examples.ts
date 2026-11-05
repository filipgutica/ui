// Code samples shown on the home page. They live in a .ts module because Vite's dependency
// scanner reads `import` lines inside a .vue file's strings as real imports and then
// skips pre-bundling, which reloads the dev server mid-test.
export const stylesImport = `@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/themes/graphite-indigo.css";
@import "@filipgutica/ui/components.css";`

export const vueExample = `<script setup lang="ts">
import { ref } from 'vue'
import { UiButton } from '@filipgutica/ui'
import { UiSiteHeader } from '@filipgutica/ui/site'

const count = ref(0)
<` + `/script>

<template>
  <!-- Includes the System / Light / Dark appearance picker. -->
  <UiSiteHeader project="ui" />
  <main>
    <UiButton @click="count++">Clicked {{ count }} times</UiButton>
  </main>
</template>`

export const themeExample = `<script setup lang="ts">
import { ref } from 'vue'
import { UiAlert, UiButton } from '@filipgutica/ui'
import { createOpenVsxThemeService } from '@filipgutica/ui/open-vsx'
import { applySemanticTheme } from '@filipgutica/ui/theme'

const themes = createOpenVsxThemeService()
const busy = ref(false)
const error = ref('')

async function installTheme() {
  busy.value = true
  error.value = ''
  const result = await themes.importTheme('catppuccin.catppuccin-vsc', 'dark')
  busy.value = false
  if (result.status === 'error') {
    error.value = result.error.message
  } else if (result.status === 'success') {
    applySemanticTheme({ root: document.documentElement, theme: result.theme })
  }
}
<` + `/script>

<template>
  <UiButton :loading="busy" @click="installTheme">
    Use Catppuccin
  </UiButton>
  <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>
</template>`
