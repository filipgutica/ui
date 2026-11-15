import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import { defineComponent, h, provide } from 'vue'

import ThemesPage from '../docs/src/components/ThemesPage.vue'
import { createDocsTheme, docsThemeKey } from '../docs/src/docs-theme.js'

// The design system's Open VSX client reads the registry and the VSIX; its own tests cover that.
// Here it stands in for the registry, so the test covers the docs' static wiring.
const openVsx = vi.hoisted(() => ({
  createOpenVsxThemeService: vi.fn(),
}))
vi.mock('@filipgutica/design-system/open-vsx', () => openVsx)

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
  const service = {
    search: vi.fn(async (query: string) => ({ status: 'success', themes: query === 'Nord' ? [{
      id: 'example.nord', name: 'Nord', publisher: 'example', description: 'Nord color theme', downloadCount: 100,
    }] : [] })),
    importTheme: vi.fn(async () => ({ status: 'success', theme: {
      name: 'Nord', type: 'dark', colors: { 'editor.background': '#2e3440', 'editor.foreground': '#eceff4' },
    } })),
  }
  openVsx.createOpenVsxThemeService.mockReturnValue(service)
  vi.useFakeTimers()
  // Any request through the page's own fetch would be a call to a local API.
  const fetchMock = vi.fn(async () => new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)

  const wrapper = mount(defineComponent({
    setup() {
      provide(docsThemeKey, createDocsTheme())
      return () => h(ThemesPage)
    },
  }), { attachTo: document.body })
  try {
    const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim().includes(label))!
    await flushPromises()
    const input = document.querySelector<HTMLInputElement>('#open-vsx-query')
    expect(input).not.toBeNull()
    input!.value = 'Nord'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    // The search request resolves through the data-fetching cache, which can take more than one flush.
    await vi.waitFor(() => expect(document.querySelector('.theme-results')?.textContent).toContain('Nord'))
    button('Install').click()
    await vi.waitFor(() => expect(wrapper.get('[role="radio"][aria-checked="true"]').text()).toBe('Nord'))
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#2e3440')
    expect(JSON.parse(localStorage.getItem('filipgutica-ui-installed-themes')!)[0].id).toBe('example.nord')
    expect(service.importTheme).toHaveBeenCalledWith('example.nord', 'light')
    expect(openVsx.createOpenVsxThemeService).toHaveBeenCalledWith({ fetchImpl: expect.any(Function) })
    expect(fetchMock).not.toHaveBeenCalled()
  } finally {
    wrapper.unmount()
  }
})
