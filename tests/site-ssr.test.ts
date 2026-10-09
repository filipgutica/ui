// @vitest-environment node
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import { UiSiteHeader } from '../src/site/index.js'

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
