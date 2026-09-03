<template>
  <article class="content-page home-page">
    <header class="hero">
      <h1 tabindex="-1">A consistent interface for small, serious apps.</h1>
      <p class="lede">
        @filipgutica/ui provides accessible application primitives, semantic design tokens,
        and safe VS Code theme normalization without prescribing your product layout.
      </p>
      <div class="button-row">
        <a class="docs-button" href="#/components/button">Browse components</a>
        <a class="docs-button docs-button--secondary" href="#/sandbox/button">Open sandbox</a>
      </div>
    </header>

    <section aria-labelledby="start-heading">
      <h2 id="start-heading">Get started</h2>
      <div class="setup-grid">
        <div>
          <h3><span>01</span> Install</h3>
          <pre class="code-block"><code>pnpm add @filipgutica/ui</code></pre>
        </div>
        <div>
          <h3><span>02</span> Add styles</h3>
          <pre class="code-block"><code>@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";</code></pre>
        </div>
      </div>
    </section>

    <section aria-labelledby="principles-heading">
      <h2 id="principles-heading">Design principles</h2>
      <ol class="principle-list">
        <li v-for="(principle, index) in principles" :key="principle.title">
          <span class="principle-index">0{{ index + 1 }}</span>
          <h3>{{ principle.title }}</h3>
          <p>{{ principle.description }}</p>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup lang="ts">
const principles = [
  { title: 'Semantic by default', description: 'Components expose meaningful states and accessibility relationships before visual variants.' },
  { title: 'Product-owned layout', description: 'The system standardizes controls and feedback while each app keeps its information architecture.' },
  { title: 'Theme-safe', description: 'Remote editor colors are normalized into a finite semantic token contract.' },
]
</script>
