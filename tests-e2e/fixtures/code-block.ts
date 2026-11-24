import './site.css'

import { createApp, h } from 'vue'

import { UiCodeBlock } from '../../src/index.js'

const source = `const runbook = 'https://example.com/${'a'.repeat(180)}'\n  follow(runbook)`

createApp({
  render: () => [
    h(UiCodeBlock, { title: 'Runbook', code: source, language: 'typescript', lineNumbers: true }),
    h(UiCodeBlock, { code: 'pnpm install --frozen-lockfile\npnpm check', language: 'sh' }),
  ],
}).mount('#app')
