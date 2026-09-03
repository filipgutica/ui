<template>
  <article class="content-page sandbox-page">
    <header class="page-heading">
      <div>
        <h1 tabindex="-1">{{ component.title }} sandbox</h1>
        <p class="lede">Change the controls and inspect the component in the active theme.</p>
        <code class="component-name">{{ component.name }}</code>
      </div>
      <a class="docs-button docs-button--secondary" :href="`#/components/${component.slug}`">
        View documentation
      </a>
    </header>
    <ComponentPlayground :key="component.slug" :slug="component.slug" />
  </article>
</template>

<script setup lang="ts">
import type { ComponentDoc } from '../component-docs.js'
import ComponentPlayground from './ComponentPlayground.vue'

defineProps<{
  component: ComponentDoc
}>()
</script>
