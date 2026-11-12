<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from 'vue'

import { componentDocBySlug } from './component-docs.js'
import DocsNavigation from './components/DocsNavigation.vue'
import ComponentPage from './components/ComponentPage.vue'
import HomePage from './components/HomePage.vue'
import SandboxPage from './components/SandboxPage.vue'
import ThemesPage from './components/ThemesPage.vue'
import { createDocsTheme, docsThemeKey } from './docs-theme.js'
import { parseDocsHash } from './router.js'
import { UiSiteAppearancePicker, UiSiteHeader } from '../../src/site/index.js'
import { UiButton, UiDrawer } from '../../src/index.js'

const docsTheme = createDocsTheme()
provide(docsThemeKey, docsTheme)
const { activeInstalledTheme, schemeChoice, select } = docsTheme

const projectLinks = [
  { label: 'GitHub', href: 'https://github.com/filipgutica/ui' },
  { label: 'npm', href: 'https://www.npmjs.com/package/@filipgutica/ui' },
] as const

const hash = ref(window.location.hash)
const updateHash = (): void => {
  hash.value = window.location.hash
}
window.addEventListener('hashchange', updateHash)
onBeforeUnmount(() => window.removeEventListener('hashchange', updateHash))

const route = computed(() => parseDocsHash(hash.value))
const selectedComponent = computed(() =>
  route.value.name === 'component' || route.value.name === 'sandbox'
    ? componentDocBySlug(route.value.slug)
    : undefined)

const currentPageLabel = computed(() => selectedComponent.value?.title ?? (route.value.name === 'home' ? 'Introduction' : route.value.name === 'themes' ? 'Themes' : 'Page not found'))
const navigationOpen = ref(false)
// Keep in sync with the max-width: 800px rules for .docs-mobilebar in styles.css.
const narrowViewport = useMediaQuery('(max-width: 800px)')
let navigationSelected = false
const focusHeading = (): void => {
  document.querySelector<HTMLElement>('#main-content h1')?.focus()
}
const onNavigationClick = (event: MouseEvent): void => {
  if (!(event.target instanceof Element) || !event.target.closest('a')) return
  // A modified click opens a new tab or window, so the drawer stays open (as in UiSiteNav).
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
  navigationSelected = true
  navigationOpen.value = false
}
const onDrawerCloseAutoFocus = (event: Event): void => {
  if (navigationSelected || !narrowViewport.value) {
    event.preventDefault()
    focusHeading()
  }
  navigationSelected = false
}
watch(narrowViewport, (narrow) => {
  if (!narrow) navigationOpen.value = false
})

watch(route, async () => {
  navigationOpen.value = false
  await nextTick()
  focusHeading()
})
</script>

<template>
  <a
    class="skip-link"
    href="#main-content"
  >Skip to content</a>
  <!-- The docs site publishes projects.json itself, so it reads its own copy, and dev serves the source file. -->
  <UiSiteHeader
    project="ui"
    :links="projectLinks"
    projects-url="./projects.json"
  >
    <UiSiteAppearancePicker
      :model-value="activeInstalledTheme ? undefined : schemeChoice"
      @update:model-value="select"
    />
  </UiSiteHeader>

  <div class="docs-shell">
    <aside
      class="sidebar"
      aria-label="Component documentation"
    >
      <DocsNavigation :route="route" />
    </aside>

    <div class="docs-mobilebar">
      <UiDrawer
        v-model:open="navigationOpen"
        title="Browse components"
        @close-auto-focus="onDrawerCloseAutoFocus"
      >
        <template #trigger>
          <!-- The section rail's labelled trigger, from site.css: the menu glyph, the field corner, and
            block padding that lets a long label wrap. -->
          <UiButton
            class="fg-site-rail__toggle"
            variant="secondary"
            size="lg"
          >
            Browse components: {{ currentPageLabel }}
          </UiButton>
        </template>
        <DocsNavigation
          :route="route"
          @click="onNavigationClick"
        />
      </UiDrawer>
    </div>
    <main
      id="main-content"
      class="main-content fg-site-prose"
    >
      <HomePage v-if="route.name === 'home'" />
      <ThemesPage v-else-if="route.name === 'themes'" />
      <ComponentPage
        v-else-if="route.name === 'component' && selectedComponent"
        :key="selectedComponent.slug"
        :component="selectedComponent"
      />
      <SandboxPage
        v-else-if="route.name === 'sandbox' && selectedComponent"
        :key="selectedComponent.slug"
        :component="selectedComponent"
      />
      <article
        v-else
        class="content-page"
      >
        <h1 tabindex="-1">
          Page not found
        </h1>
        <p>The requested component or sandbox does not exist.</p>
        <a
          class="fg-button"
          data-variant="primary"
          data-size="md"
          href="#/"
        >Return home</a>
      </article>
    </main>
  </div>
</template>
