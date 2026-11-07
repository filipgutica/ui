<script setup lang="ts">
import { UiRadioCard, UiRadioCardGroup } from '../../../src/index.js'
import { useDocsTheme } from '../docs-theme.js'
import AddThemePanel from './AddThemePanel.vue'
import ThemePreview from './ThemePreview.vue'

const { selection, installedThemes, preferredAppearance, select, saveAndSelectTheme } = useDocsTheme()
</script>

<template>
  <article class="content-page">
    <header class="page-heading">
      <div>
        <h1 tabindex="-1">
          Themes
        </h1>
        <p class="lede">
          The header's System, Light and Dark choice is shared with the other project sites; this page adds community VS Code themes, which apply to these docs only.
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

    <section aria-labelledby="add-theme-heading">
      <h2 id="add-theme-heading">
        Add a theme
      </h2>
      <AddThemePanel
        :preferred-appearance="preferredAppearance"
        @installed="saveAndSelectTheme"
      />
    </section>
  </article>
</template>
