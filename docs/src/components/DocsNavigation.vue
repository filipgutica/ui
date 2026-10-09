<script setup lang="ts">
import { componentDocs } from '../component-docs.js'
import type { DocsRoute } from '../router.js'

const { route } = defineProps<{ route: DocsRoute }>()
const componentGroups = ['Actions', 'Forms', 'Feedback', 'Layout'].map(category => ({
  category,
  components: componentDocs.filter(component => component.category === category),
}))
const isCurrentComponent = (slug: string): boolean =>
  (route.name === 'component' || route.name === 'sandbox') && route.slug === slug
</script>

<template>
  <nav class="docs-navigation fg-site-nav">
    <a
      href="#/"
      :aria-current="route.name === 'home' ? 'page' : undefined"
    >
      Introduction
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
        {{ component.title }}
      </a>
    </section>
  </nav>
</template>
