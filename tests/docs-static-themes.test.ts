import { createHash } from 'node:crypto'

import { flushPromises, mount } from '@vue/test-utils'
import JSZip from 'jszip'
import { afterEach, expect, it, vi } from 'vitest'

import ThemePicker from '../docs/src/components/ThemePicker.vue'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('style')
  document.documentElement.classList.remove('dark', 'high-contrast')
  delete document.documentElement.dataset.theme
})

it('searches and installs an Open VSX theme on static Pages without a local API', async () => {
  vi.stubEnv('VITE_STATIC_HOST', 'true')
  localStorage.clear()
  const manifest = {
    publisher: 'example', name: 'nord', version: '1.0.0',
    contributes: { themes: [{ label: 'Nord', uiTheme: 'vs-dark', path: './theme.json' }] },
  }
  const zip = new JSZip()
  zip.file('extension/package.json', JSON.stringify(manifest))
  zip.file('extension/theme.json', JSON.stringify({
    colors: { 'editor.background': '#2e3440', 'editor.foreground': '#eceff4' },
  }))
  const bytes = await zip.generateAsync({ type: 'uint8array' })
  const checksum = createHash('sha256').update(bytes).digest('hex')
  vi.useFakeTimers()
  const resources = 'https://openvsx.eclipsecontent.org/example/nord/1.0.0'
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input))
    if (url.origin === 'https://open-vsx.org' && url.pathname === '/api/-/search') {
      return new Response(JSON.stringify({ extensions: url.searchParams.get('query') === 'Nord' ? [{
        namespace: 'example', name: 'nord', displayName: 'Nord', description: 'Nord color theme', downloadCount: 100,
      }] : [] }))
    }
    if (url.href === 'https://open-vsx.org/api/example/nord') {
      return new Response(JSON.stringify({ version: '1.0.0', files: {
        manifest: `${resources}/package.json`, download: `${resources}/theme.vsix`, sha256: `${resources}/theme.sha256`,
      } }))
    }
    if (url.href === `${resources}/package.json`) return new Response(JSON.stringify(manifest))
    if (url.href === `${resources}/theme.vsix`) return new Response(new Uint8Array(bytes).buffer)
    if (url.href === `${resources}/theme.sha256`) return new Response(checksum)
    throw new Error(`Unexpected request: ${url.href}`)
  })
  vi.stubGlobal('fetch', fetchMock)

  const wrapper = mount(ThemePicker, { attachTo: document.body })
  try {
    await wrapper.get('button').trigger('click')
    const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim().includes(label))!
    button('Add theme').click()
    await flushPromises()
    const input = document.querySelector<HTMLInputElement>('#open-vsx-query')
    expect(input).not.toBeNull()
    input!.value = 'Nord'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(document.querySelector('.theme-results')?.textContent).toContain('Nord')
    button('Install').click()
    // ZIP decoding and Web Crypto complete asynchronously outside Vue's update queue.
    await vi.waitFor(() => expect(wrapper.get('button').text()).toContain('Theme: Nord'))
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#2e3440')
    expect(JSON.parse(localStorage.getItem('filipgutica-ui-installed-themes')!)[0].id).toBe('example.nord')
    expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith('https://'))).toBe(true)
  } finally {
    wrapper.unmount()
  }
})
