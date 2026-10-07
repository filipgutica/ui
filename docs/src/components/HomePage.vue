<script setup lang="ts">
import { UiCodeBlock } from '../../../src/index.js'

const installCommand = 'pnpm add @filipgutica/ui'
const stylesImport = `@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";`

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
