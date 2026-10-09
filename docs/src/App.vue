<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { componentDocBySlug } from './component-docs.js'
import DocsNavigation from './components/DocsNavigation.vue'
import ComponentPage from './components/ComponentPage.vue'
import HomePage from './components/HomePage.vue'
import SandboxPage from './components/SandboxPage.vue'
import ThemePicker from './components/ThemePicker.vue'
import { parseDocsHash } from './router.js'
import { UiSiteHeader } from '../../src/site/index.js'

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

const navigationOpen = ref(false)
const narrowViewport = useMediaQuery('(max-width: 900px)')
let navigationSelected = false
const focusHeading = (): void => {
  document.querySelector<HTMLElement>('#main-content h1')?.focus()
}
const onNavigationClick = (event: MouseEvent): void => {
  if (!(event.target instanceof Element) || !event.target.closest('a')) return
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
  <UiSiteHeader
    project="ui"
    :links="projectLinks"
  >
    <ThemePicker />
  </UiSiteHeader>

  <div class="docs-shell">
    <aside
      class="sidebar"
      aria-label="Component documentation"
    >
      <DocsNavigation :route="route" />
    </aside>

    <div class="docs-mobilebar">
      <DialogRoot v-model:open="navigationOpen">
        <DialogTrigger class="navigation-trigger">
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
          Browse components
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay class="navigation-overlay" />
          <DialogContent
            class="navigation-drawer"
            @close-auto-focus="onDrawerCloseAutoFocus"
          >
            <div class="navigation-drawer-heading">
              <DialogTitle>Browse components</DialogTitle>
              <DialogClose
                class="navigation-trigger"
                aria-label="Close navigation"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </DialogClose>
            </div>
            <DialogDescription class="sr-only">
              Choose a component to view its documentation.
            </DialogDescription>
            <DocsNavigation
              :route="route"
              @click="onNavigationClick"
            />
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
    <main
      id="main-content"
      class="main-content fg-site-prose"
    >
      <HomePage v-if="route.name === 'home'" />
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
          class="docs-button"
          href="#/"
        >Return home</a>
      </article>
    </main>
  </div>
</template>
