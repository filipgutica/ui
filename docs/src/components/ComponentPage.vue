<template>
  <article class="content-page">
    <header class="page-heading">
      <div>
        <h1 tabindex="-1">
          {{ component.title }}
        </h1>
        <p class="lede">
          {{ component.summary }}
        </p>
        <code class="component-name">{{ component.name }}</code>
      </div>
      <a
        class="fg-button"
        data-variant="primary"
        data-size="md"
        :href="`#/sandbox/${component.slug}`"
        data-sandbox-link
      >
        Open sandbox
      </a>
    </header>

    <section aria-labelledby="usage-heading">
      <h2 id="usage-heading">
        Usage
      </h2>
      <ul v-if="Array.isArray(component.usage)">
        <li
          v-for="rule in component.usage"
          :key="rule"
          v-text="rule"
        />
      </ul>
      <p
        v-else
        v-text="component.usage"
      />
    </section>

    <section aria-labelledby="example-heading">
      <div class="section-heading">
        <div>
          <h2 id="example-heading">
            Example
          </h2>
          <p>{{ component.example.description }}</p>
        </div>
      </div>
      <UiExample
        :code="component.example.code"
        language="vue"
      >
        <ComponentPlayground
          :slug="component.slug"
          compact
        />
      </UiExample>
    </section>

    <section aria-labelledby="props-heading">
      <h2 id="props-heading">
        Props
      </h2>
      <ApiTable :items="component.props" />
    </section>

    <section aria-labelledby="slots-heading">
      <h2 id="slots-heading">
        Slots
      </h2>
      <ApiTable :items="component.slots" />
    </section>

    <section aria-labelledby="events-heading">
      <h2 id="events-heading">
        Events
      </h2>
      <ApiTable :items="component.events" />
    </section>
  </article>
</template>

<script setup lang="ts">
import type { ComponentDoc } from '../component-docs.js'

import { UiExample } from '../../../src/index.js'
import ApiTable from './ApiTable.vue'
import ComponentPlayground from './ComponentPlayground.vue'

const { component } = defineProps<{
  component: ComponentDoc
}>()
</script>
