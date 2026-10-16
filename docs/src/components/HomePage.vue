<script setup lang="ts">
import { UiCodeBlock } from '../../../src/index.js'

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
        This browser example requires HTTPS and Web Crypto, plus cross-origin access from Open VSX and its resource host.
        Use <code>themes.search(query)</code> to find extensions before calling <code>themes.importTheme(id, appearance)</code>.
        This example applies a theme for the current page; it does not save a preference.
      </p>
      <UiCodeBlock
        :code="themeExample"
        language="vue"
      />
    </section>

    <section aria-labelledby="principles-heading">
      <h2 id="principles-heading">
        Design principles
      </h2>
      <ul class="principle-list">
        <li
          v-for="principle in principles"
          :key="principle.title"
        >
          <h3>{{ principle.title }}</h3>
          <p>{{ principle.description }}</p>
        </li>
      </ul>
    </section>
  </article>
</template>
