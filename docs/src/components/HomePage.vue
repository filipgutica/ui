<script setup lang="ts">
import { ref } from 'vue'

import { UiAlert, UiBadge, UiButton, UiCodeBlock, UiField, UiInput } from '../../../src/index.js'

const previewQuery = ref('')

const installCommand = 'pnpm add @filipgutica/ui'
const stylesImport = `@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";`

const vueExample = `<script setup lang="ts">
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

const themeExample = `<script setup lang="ts">
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

const principles = [
  { title: 'Quiet by default', description: 'Neutral surfaces, one accent, and clear status colors.' },
  { title: 'Dense but calm', description: 'Compact controls, a 4px rhythm, and subtle dividers.' },
  { title: 'Keyboard-aware', description: 'Visible focus and accessible labels. Themes preserve structure and sizing.' },
]
</script>

<template>
  <article class="content-page home-page">
    <header class="intro">
      <h1 tabindex="-1">
        Component library
      </h1>
      <p class="lede">
        Vue 3.5+ components, semantic tokens, and VS Code theme support.
      </p>
      <div class="button-row">
        <a
          class="docs-button"
          href="#/components/button"
        >Browse components</a>
        <a
          class="docs-link"
          href="#/sandbox/button"
        >Open sandbox</a>
      </div>
      <div
        class="home-preview"
        role="group"
        aria-label="Component preview"
      >
        <div>
          <a
            class="home-preview__caption"
            href="#/components/button"
          >Button</a>
          <div class="home-preview__row">
            <UiButton>Use Catppuccin</UiButton>
            <UiButton variant="secondary">
              Inspect evidence
            </UiButton>
          </div>
        </div>
        <div class="home-preview__field">
          <a
            class="home-preview__caption"
            href="#/components/field"
          >Field</a>
          <UiField
            control-id="preview-theme-search"
            label="Search themes"
            description="Search Open VSX by name."
          >
            <UiInput
              v-model="previewQuery"
              type="search"
            />
          </UiField>
        </div>
        <div>
          <a
            class="home-preview__caption"
            href="#/components/badge"
          >Badge</a>
          <div class="home-preview__row">
            <UiBadge tone="info">
              Queued
            </UiBadge>
            <UiBadge tone="success">
              Passed
            </UiBadge>
            <UiBadge tone="error">
              Failed
            </UiBadge>
          </div>
        </div>
        <div class="home-preview__alert">
          <a
            class="home-preview__caption"
            href="#/components/alert"
          >Alert</a>
          <UiAlert tone="success">
            Theme imported successfully.
          </UiAlert>
        </div>
      </div>
    </header>

    <section aria-labelledby="start-heading">
      <h2 id="start-heading">
        Setup
      </h2>
      <div class="setup-grid">
        <div>
          <h3>Install</h3>
          <UiCodeBlock
            :code="installCommand"
            language="sh"
            variant="compact"
          />
        </div>
        <div>
          <h3>Styles</h3>
          <UiCodeBlock
            :code="stylesImport"
            language="css"
            title="main.css"
          />
        </div>
      </div>
    </section>

    <section aria-labelledby="vue-heading">
      <h2 id="vue-heading">
        Use in Vue
      </h2>
      <p>
        Import the styles above in your app's stylesheet, then use components in a Vue single-file component.
        For the shared site header, also import <code>@filipgutica/ui/site.css</code> and
        <code>@filipgutica/ui/themes/graphite-indigo.css</code> after <code>theme.css</code>.
      </p>
      <UiCodeBlock
        :code="vueExample"
        language="vue"
        title="App.vue"
      />
    </section>

    <section aria-labelledby="themes-heading">
      <h2 id="themes-heading">
        Open VSX themes
      </h2>
      <p>
        Open Theme → Add theme to search and install community themes in this gallery.
        The gallery's search-and-install dialog is docs-only; it is not an exported component.
        The library exports the service and theme helpers to build your own picker.
      </p>
      <p>
        Use <code>themes.search(query)</code> to find extensions before calling <code>themes.importTheme(id, appearance)</code>.
      </p>
      <UiAlert tone="info">
        This browser example requires HTTPS and Web Crypto, plus cross-origin access from Open VSX and its resource host.
        This example applies a theme for the current page; it does not save a preference.
      </UiAlert>
      <UiCodeBlock
        :code="themeExample"
        language="vue"
        title="ThemeButton.vue"
      />
    </section>

    <section aria-labelledby="principles-heading">
      <h2 id="principles-heading">
        Design principles
      </h2>
      <dl class="fg-site-definitions">
        <template
          v-for="principle in principles"
          :key="principle.title"
        >
          <dt>{{ principle.title }}</dt>
          <dd>{{ principle.description }}</dd>
        </template>
      </dl>
    </section>
  </article>
</template>
