<template>
  <article class="content-page">
    <header class="page-heading">
      <div>
        <h1 tabindex="-1">{{ component.title }}</h1>
        <p class="lede">{{ component.summary }}</p>
        <code class="component-name">{{ component.name }}</code>
      </div>
      <a class="docs-button" :href="`#/sandbox/${component.slug}`" data-sandbox-link>
        Open sandbox
      </a>
    </header>

    <section aria-labelledby="usage-heading">
      <h2 id="usage-heading">Usage</h2>
      <p>{{ component.usage }}</p>
    </section>

    <section aria-labelledby="example-heading">
      <div class="section-heading">
        <div>
          <h2 id="example-heading">Example</h2>
          <p>{{ component.example.description }}</p>
        </div>
      </div>
      <div class="example-workbench">
        <div class="example-pane">
          <p class="pane-label">Preview</p>
          <div class="example-frame">
            <ComponentPlayground :slug="component.slug" compact />
          </div>
        </div>
        <div class="code-pane">
          <p class="pane-label">Vue</p>
          <pre class="code-block"><code>{{ component.example.code }}</code></pre>
        </div>
      </div>
    </section>

    <section aria-labelledby="props-heading">
      <h2 id="props-heading">Props</h2>
      <ApiTable :items="component.props" />
    </section>

    <section aria-labelledby="slots-heading">
      <h2 id="slots-heading">Slots</h2>
      <ApiTable :items="component.slots" />
    </section>

    <section aria-labelledby="events-heading">
      <h2 id="events-heading">Events</h2>
      <ApiTable :items="component.events" />
    </section>
  </article>
</template>

<script setup lang="ts">
import type { ComponentDoc } from '../component-docs.js'
import ApiTable from './ApiTable.vue'
import ComponentPlayground from './ComponentPlayground.vue'

defineProps<{
  component: ComponentDoc
}>()
</script>
