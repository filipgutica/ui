<script setup lang="ts">
import { UiCodeBlock } from '../../src/index.js'
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

// ?shell keeps the rail's rows in place without JavaScript (headerMenu), and ?find gives it Find with
// grouped, searchable rows. ?pages gives the header the design system site's project and five pages,
// which clip at 320px; ?pages=4 makes the fifth current instead of the second. ?tool gives it a tool
// site's project and two links, as annoterm has.
const params = new URLSearchParams(location.search)
const shell = params.has('shell')
const find = params.has('find') ? { label: 'Find a section', noun: 'section' } : undefined
const project = params.has('pages') ? 'design-system' : params.has('tool') ? 'annoterm' : 'ui'
const links = params.has('pages')
  ? ['Foundations', 'Components', 'Application example', 'Documentation example', 'Product page example']
      .map((label, index) => ({ label, href: `#page-${index}`, current: index === Number(params.get('pages') || 1) }))
  : params.has('tool')
    ? [{ label: 'GitHub', href: '#github' }, { label: 'Releases', href: '#releases' }]
    : [
        { label: 'Guide', href: '#guide', current: shell },
        { label: 'GitHub', href: '#github' },
        { label: 'Releases', href: '#releases' },
      ]
const groups = find
  ? [
      { label: 'Start', items: [{ label: 'Install', href: '#install', terms: 'brew setup' }, { label: 'From review to agent', href: '#start', terms: 'annoterm feedback' }] },
      { label: 'Reference', items: [{ label: 'Start with the guide', href: '#inline-steps' }, { label: 'Commands', href: '#commands', terms: 'cli flags' }] },
    ]
  : [{ items: [{ label: 'Install', href: '#install' }, { label: 'Commands', href: '#commands' }] }]
</script>

<template>
  <div class="fg-site-docs">
    <!-- The fixture keeps the built-in project list, so it needs no network. -->
    <UiSiteHeader
      :project="project"
      :links="links"
      :projects-url="null"
    />
    <UiSiteNav
      label="On this page"
      :groups="groups"
      :find="find"
      :header-menu="shell"
    />
    <main>
      <section
        id="install"
        class="fg-site-hero"
      >
        <h1>Demo tool</h1>
        <div class="fg-site-hero__lede">
          <p>A project page built from the site components. Run <code>demo ui</code> to start.</p>
        </div>
        <div class="fg-site-hero__aside">
          <div>
            <p class="fg-site-meta">
              Install with Homebrew
            </p>
            <UiCodeBlock
              code="brew install filipgutica/tap/demo"
              language="bash"
              variant="compact"
            />
          </div>
          <dl class="fg-site-facts">
            <div>
              <dt>Runs on</dt>
              <dd>macOS and Linux</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd><a href="#github">filipgutica/demo</a></dd>
            </div>
          </dl>
        </div>
        <UiCapture
          label="Steps"
          :items="captures"
        >
          <template #caption="{ item }">
            <p>What the {{ item.label }} capture shows.</p>
          </template>
        </UiCapture>
        <dl class="fg-site-legend">
          <div>
            <dt>M @</dt>
            <dd>Modified files; the current worktree.</dd>
          </div>
          <div>
            <dt>PR</dt>
            <dd>An open pull request.</dd>
          </div>
          <div>
            <dt>* ↑</dt>
            <dd>Uncommitted changes; unpushed commits.</dd>
          </div>
          <div>
            <dt>✓</dt>
            <dd>Merged into the default branch.</dd>
          </div>
        </dl>
      </section>
      <section id="start">
        <h2>From review to agent</h2>
        <ol class="fg-site-steps">
          <li>
            <h3>Open the file</h3>
            <p>Run <code>annoterm README.md</code>. The file opens in rendered mode. Press Up or Down to select a block.</p>
          </li>
          <li>
            <h3>Add your comments</h3>
            <p>Press <kbd>a</kbd> to comment on the selected block. Write your comment. Press Enter to save it.</p>
          </li>
          <li>
            <h3>Hand off the feedback</h3>
            <p>Press <kbd>q</kbd> to quit from the rendered document. If open comments remain, annoterm tries to copy the feedback to your clipboard. Check the result in your terminal.</p>
            <p class="fg-site-steps__result">
              Paste the feedback into Codex, Claude Code, or another coding agent. If copying fails, run <code>annoterm export README.md --output feedback.md</code>. Then paste the contents of <code>feedback.md</code> into your agent.
            </p>
          </li>
        </ol>
      </section>
      <section id="inline-steps">
        <h2>Start with the guide</h2>
        <ol class="fg-site-steps">
          <li>Run <code>demo ui</code> to open the app, then read the <a href="#start">getting started guide</a> before continuing.</li>
        </ol>
      </section>
      <section id="commands">
        <h2>Commands</h2>
        <p>Press <kbd>Space</kbd> to select a row.</p>
        <dl class="fg-site-definitions">
          <dt>Scope</dt>
          <dd>Compiled servers outside your home folder are hidden; <code>--all</code> includes them.</dd>
        </dl>
        <UiCommandList :items="[{ command: 'demo ui', description: 'Browse items.' }, { command: 'demo clean --dry-run', description: 'Preview removal.' }]" />
      </section>
    </main>
    <footer class="fg-site-footer">
      <a href="#author">Built by Filip Gutica</a>
      <nav aria-label="Project links">
        <a href="#guide">Guide</a>
        <a href="#github">GitHub</a>
        <a href="#issues">Report an issue</a>
        <a href="#releases">Releases</a>
      </nav>
    </footer>
  </div>
</template>
