<script setup lang="ts">
import { UiCapture, UiCommandList, UiSiteHeader, UiSiteNav } from '../../src/site/index.js'

const screen = (title: string): string => [
  `<pre class="term" role="img" aria-label="${title} capture">`,
  '<span class="tf-dim">BRANCH</span>             <span class="tf-dim">AGE</span>  <span class="tf-dim">PATH</span>',
  '<span class="tf6">main</span>               <span class="tf-dim">2d</span>   ~/code/demo-api',
  `feat/${title.toLowerCase().replace(/ /g, '-')}     <span class="tf-dim">3h</span>   ~/code/demo-api-<span class="tf2">feature</span>`,
  '</pre>',
].join('\n')

// The tab labels of the wtree page, whose last tab ran under the Full size button on phones.
const captures = ['Browse', 'Select', 'Review', 'List', 'Dry run'].map(label => ({
  id: label.toLowerCase().replace(/ /g, '-'),
  label,
  command: `demo ${label.toLowerCase()}`,
  html: screen(label),
}))
</script>

<template>
  <div class="page">
    <UiSiteHeader
      project="ui"
      :links="[
        { label: 'Guide', href: '#guide' },
        { label: 'GitHub', href: '#github' },
        { label: 'Releases', href: '#releases' },
      ]"
    />
    <UiSiteNav
      label="On this page"
      :groups="[{ items: [{ label: 'Install', href: '#install' }, { label: 'Commands', href: '#commands' }] }]"
    />
    <main>
      <section id="install">
        <h1>Demo tool</h1>
        <p>A project page built from the site components.</p>
        <UiCapture
          label="Steps"
          :items="captures"
        >
          <template #caption="{ item }">
            <p>What the {{ item.label }} capture shows.</p>
          </template>
        </UiCapture>
      </section>
      <section id="commands">
        <h2>Commands</h2>
        <UiCommandList :items="[{ command: 'demo ui', description: 'Browse items.' }, { command: 'demo clean --dry-run', description: 'Preview removal.' }]" />
      </section>
    </main>
    <footer>
      <a href="#releases">Releases</a>
    </footer>
  </div>
</template>
