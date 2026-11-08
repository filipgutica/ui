<script setup lang="ts">
import { UiRadioCard, UiRadioCardGroup } from '../../../src/index.js'
import { useDocsTheme } from '../docs-theme.js'
import AddThemePanel from './AddThemePanel.vue'
import ThemePreview from './ThemePreview.vue'

const { selection, installedThemes, preferredAppearance, select, saveAndSelectTheme } = useDocsTheme()

// One row per depth tier in src/theme.css. tests/depth-tokens.test.ts keeps stylesheets on these tokens.
const depthTiers = [
  { token: '--shadow-raise', use: 'Idle controls: anything a person presses.', examples: 'Buttons, segmented and switch thumbs, radio cards, a focused field.' },
  { token: '--shadow-surface', use: 'Containers that hold content.', examples: 'Cards, surfaces, code blocks, example panels.' },
  { token: '--shadow-sink', use: 'Pressed controls and wells.', examples: 'A pressed button, a checked radio card, select fields, segmented and switch tracks.' },
  { token: '--shadow-nav-current', use: 'The selected row.', examples: 'The current navigation link, the selected tab. Always-dark regions, such as the capture header, use --shadow-nav-current-dark.' },
  { token: '--shadow-dialog', use: 'Layers that float above the page.', examples: 'Dialogs, drawers, menus, the select picker.' },
]
</script>

<template>
  <article class="content-page">
    <header class="page-heading">
      <div>
        <h1 tabindex="-1">
          Themes
        </h1>
        <p class="lede">
          Try community VS Code themes here. The header’s System, Light and Dark choice is shared across project sites; community themes apply only here.
        </p>
      </div>
    </header>
    <UiRadioCardGroup
      :model-value="selection"
      class="theme-picker"
      aria-label="Theme"
      @update:model-value="select"
    >
      <section aria-labelledby="color-scheme-heading">
        <h2 id="color-scheme-heading">
          Color scheme
        </h2>
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
        <header class="theme-section-heading">
          <h2 id="installed-themes-heading">
            Installed themes
          </h2>
          <p v-if="installedThemes.length === 0">
            Add a community theme or import a theme file.
          </p>
        </header>
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

    <section aria-labelledby="add-theme-heading">
      <h2 id="add-theme-heading">
        Add a theme
      </h2>
      <AddThemePanel
        :preferred-appearance="preferredAppearance"
        @installed="saveAndSelectTheme"
      />
    </section>

    <section aria-labelledby="depth-heading">
      <h2 id="depth-heading">
        Depth
      </h2>
      <p>
        Depth comes only from these tokens. Raise and surface use one tight shadow, with no outer light highlight and no blur wider than 2px. Set dark-mode values in the <code>:root.dark</code> token block, not in a component rule.
      </p>
      <div
        class="api-table-wrap"
        tabindex="0"
      >
        <table class="api-table">
          <thead>
            <tr>
              <th scope="col">
                Token
              </th>
              <th scope="col">
                Use for
              </th>
              <th scope="col">
                Examples
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tier in depthTiers"
              :key="tier.token"
            >
              <th scope="row">
                <code>{{ tier.token }}</code>
              </th>
              <td>{{ tier.use }}</td>
              <td>{{ tier.examples }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>
