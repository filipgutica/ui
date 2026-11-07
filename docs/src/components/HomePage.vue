<script setup lang="ts">
import { ref } from 'vue'

import { UiAlert, UiBadge, UiButton, UiCodeBlock, UiField, UiInput } from '../../../src/index.js'
import { stylesImport, themeExample, vueExample } from '../home-examples.js'

const previewQuery = ref('')

const installCommand = 'pnpm add @filipgutica/ui'

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
            <UiButton>Primary action</UiButton>
            <UiButton variant="secondary">
              Secondary action
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
            label="Label"
            description="Help text, read out with the input."
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
            Success status message.
          </UiAlert>
        </div>
      </div>
    </header>

    <section aria-labelledby="start-heading">
      <h2 id="start-heading">
        Get started
      </h2>
      <ol class="fg-site-steps">
        <li>
          <h3>Check Tailwind CSS 4</h3>
          <p>
            Start with an app whose stylesheet Tailwind CSS 4 already builds.
            This library does not install Tailwind.
            Your stylesheet must include this import.
          </p>
          <UiCodeBlock
            :code="stylesImport.tailwind"
            language="css"
            title="main.css"
          />
        </li>
        <li>
          <h3>Install the package</h3>
          <p>
            In your app's project directory, install the package.
          </p>
          <UiCodeBlock
            :code="installCommand"
            language="sh"
            variant="compact"
          />
        </li>
        <li>
          <h3>Load the styles</h3>
          <p>
            In the stylesheet your app loads, use these imports in this order.
            The shared site header needs both <code>graphite-indigo.css</code> and <code>site.css</code>, because <code>site.css</code> reads some type and layout roles that only Graphite Indigo defines.
          </p>
          <UiCodeBlock
            :code="stylesImport.app"
            language="css"
            title="main.css"
          />
        </li>
        <li>
          <h3 id="vue-heading">
            Use your first component
          </h3>
          <p>
            Replace <code>App.vue</code> with this example.
            Click the button to increase its count.
          </p>
          <UiCodeBlock
            :code="vueExample"
            language="vue"
            title="App.vue"
          />
        </li>
        <li>
          <h3 id="themes-heading">
            Add an Open VSX theme
          </h3>
          <p>
            For an optional theme button, create <code>ThemeButton.vue</code> with this example.
            In <code>App.vue</code>, add <code>import ThemeButton from './ThemeButton.vue'</code> to the script and <code>&lt;ThemeButton /&gt;</code> inside <code>&lt;main&gt;</code>.
            To find other extensions, call <code>themes.search(query)</code> before <code>themes.importTheme(id, appearance)</code>.
          </p>
          <UiAlert tone="info">
            This browser example requires HTTPS and Web Crypto, plus cross-origin access from Open VSX and its resource host.
            This example does not save a preference.
          </UiAlert>
          <UiCodeBlock
            :code="themeExample"
            language="vue"
            title="ThemeButton.vue"
          />
          <p class="fg-site-steps__result">
            When the import succeeds, the Use Catppuccin button applies the imported dark theme to the current page.
          </p>
        </li>
      </ol>
      <p>
        To try community themes in this gallery, visit the <a href="#/themes">Themes page</a>.
        The gallery's search and import controls are docs-only.
        The library exports the service and theme helpers for your own picker.
      </p>
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
