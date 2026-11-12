<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, reactive, ref, watch, watchEffect } from 'vue'

import { componentDocBySlug, componentDocs } from './component-docs.js'
import ComponentPage from './components/ComponentPage.vue'
import HomePage from './components/HomePage.vue'
import SandboxPage from './components/SandboxPage.vue'
import ThemesPage from './components/ThemesPage.vue'
import { createDocsTheme, docsThemeKey } from './docs-theme.js'
import { parseDocsHash } from './router.js'
import { UiSiteAppearancePicker, UiSiteHeader, UiSiteNav } from '../../src/site/index.js'
import type { UiSiteNavGroup } from '../../src/site/index.js'

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

// Other names a reader may type in Find.
const aliases: Partial<Record<string, string>> = {
  'alert': 'banner callout notice',
  'badge': 'tag chip label',
  'code-block': 'snippet',
  'dialog': 'modal',
  'drawer': 'sheet sidebar menu',
  'progress': 'loading bar',
  'score': 'rating',
  'segmented-control': 'toggle group',
  'select': 'dropdown',
  'slider': 'range',
  'switch': 'toggle',
}
// Find keeps the rows it shows by object, so the rows are made once and only `current` changes.
const navigation = reactive<UiSiteNavGroup[]>([
  { items: [{ label: 'Introduction', href: '#/' }, { label: 'Themes', href: '#/themes' }] },
  ...(['Actions', 'Forms', 'Feedback', 'Layout'] as const).map(category => ({
    label: category,
    items: componentDocs.filter(component => component.category === category).map(({ slug, title }) => ({
      label: title,
      href: `#/components/${slug}`,
      ...(aliases[slug] ? { terms: aliases[slug] } : {}),
    })),
  })),
])
const currentHref = computed(() => {
  if (route.value.name === 'home') return '#/'
  if (route.value.name === 'themes') return '#/themes'
  return selectedComponent.value ? `#/components/${selectedComponent.value.slug}` : undefined
})
watchEffect(() => {
  for (const item of navigation.flatMap(group => group.items)) item.current = item.href === currentHref.value
})

const find = { label: 'Find a component', noun: 'component' } as const

const focusHeading = (): void => {
  document.querySelector<HTMLElement>('#main-content h1')?.focus()
}
watch(route, async () => {
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
    <UiSiteNav
      class="docs-rail"
      label="Components"
      :groups="navigation"
      :find="find"
    />
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
