<script setup lang="ts">
import { UiCodeBlock } from '../../../src/index.js'

const installCommand = 'pnpm add @filipgutica/ui'
const stylesImport = `@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";`

const principles = [
  { title: 'Quiet by default', description: 'Neutral surfaces and one accent keep attention on the content. Status colors communicate state.' },
  { title: 'Dense but calm', description: 'Compact controls follow a 4px rhythm. Alignment, spacing, and subtle dividers establish hierarchy.' },
  { title: 'Keyboard-aware', description: 'Visible focus and accessible labels support keyboard use. Imported themes keep the same structure and sizing.' },
]
</script>

<template>
  <article class="content-page home-page">
    <header class="intro">
      <h1 tabindex="-1">
        Component library
      </h1>
      <p class="lede">
        @filipgutica/ui provides Vue components, semantic design tokens, and VS Code theme support.
        Explore examples, API references, and interactive sandboxes.
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
        Get started
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
          <h3>Add styles</h3>
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
