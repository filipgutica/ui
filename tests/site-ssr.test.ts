// @vitest-environment node
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import { UiCapture, UiCommandList, UiSiteHeader, UiSiteNav } from '../src/site/index.js'

describe('site header on a server', () => {
  it('renders the project menu without browser globals', async () => {
    expect(typeof window).toBe('undefined')

    const html = await renderToString(createSSRApp({
      render: () => h(UiSiteHeader, { project: 'ui', links: [{ label: 'GitHub', href: 'https://github.com/filipgutica/ui' }] }),
    }))

    expect(html).toContain('aria-label="Projects"')
    expect(html).toContain('GitHub')
    expect(html).not.toContain('aria-label="Color theme"')
  })
})

describe('site page components on a server', () => {
  it('render their no-script markup without browser globals', async () => {
    expect(typeof window).toBe('undefined')

    const html = await renderToString(createSSRApp({
      render: () => [
        h(UiSiteNav, { label: 'On this page', groups: [{ items: [{ label: 'Install', href: '#install' }] }] }),
        h(UiCapture, { label: 'Steps', items: [{ id: 'read', label: 'Read', command: 'annoterm notes.md', html: '<pre>read</pre>' }] }),
        h(UiCommandList, { items: [{ command: 'wtree ui', description: 'Browse worktrees.' }] }),
      ],
    }))

    expect(html).toMatch(/<summary[^>]*>\s*Menu\s*<\/summary>/)
    expect(html).toContain('aria-current="location"')
    expect(html).toContain('id="frame-read"')
    expect(html).toContain('<pre>read</pre>')
    expect(html).toContain('<code>wtree ui</code>')
    expect(html).not.toContain('<button')
  })
})
