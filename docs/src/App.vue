<template>
  <a
    class="skip-link"
    href="#main-content"
  >Skip to content</a>
  <header class="topbar">
    <a
      class="brand"
      href="#/"
      aria-label="UI documentation home"
    >
      <span>@filipgutica/ui</span>
      <span
        class="brand-marker"
        aria-hidden="true"
      />
    </a>
    <ThemePicker />
  </header>

  <div class="docs-shell">
    <aside
      class="sidebar"
      aria-label="Component documentation"
    >
      <nav>
        <a
          class="sidebar-home"
          href="#/"
          :aria-current="route.name === 'home' ? 'page' : undefined"
        >
          <span>Introduction</span>
          <span
            class="sidebar-link-indicator"
            aria-hidden="true"
          >›</span>
        </a>
        <section
          v-for="group in componentGroups"
          :key="group.category"
          class="nav-group"
        >
          <h2>{{ group.category }}</h2>
          <a
            v-for="component in group.components"
            :key="component.slug"
            :href="`#/components/${component.slug}`"
            :aria-current="isCurrentComponent(component.slug) ? 'page' : undefined"
          >
            <span>{{ component.title }}</span>
            <span
              class="sidebar-link-indicator"
              aria-hidden="true"
            >›</span>
          </a>
        </section>
      </nav>
    </aside>

    <main
      id="main-content"
      class="main-content"
    >
      <details class="mobile-nav">
        <summary>Browse components</summary>
        <nav aria-label="Mobile component documentation">
          <a
            v-for="component in componentDocs"
            :key="component.slug"
            :href="`#/components/${component.slug}`"
          >
            {{ component.title }}
          </a>
        </nav>
      </details>

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

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { componentDocBySlug, componentDocs } from './component-docs.js'
import ComponentPage from './components/ComponentPage.vue'
import HomePage from './components/HomePage.vue'
import SandboxPage from './components/SandboxPage.vue'
import ThemePicker from './components/ThemePicker.vue'
import { parseDocsHash } from './router.js'

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

const categories = ['Actions', 'Forms', 'Feedback', 'Layout'] as const
const componentGroups = categories.map(category => ({
  category,
  components: componentDocs.filter(component => component.category === category),
}))

const isCurrentComponent = (slug: string): boolean =>
  (route.value.name === 'component' || route.value.name === 'sandbox')
  && route.value.slug === slug

watch(route, async () => {
  await nextTick()
  document.querySelector<HTMLElement>('#main-content h1')?.focus()
})
</script>
