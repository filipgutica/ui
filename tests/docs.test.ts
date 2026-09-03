import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ComponentPage from '../docs/src/components/ComponentPage.vue'
import ThemePicker from '../docs/src/components/ThemePicker.vue'
import { openVsxApi } from '../docs/open-vsx-plugin.js'
import { componentDocs } from '../docs/src/component-docs.js'
import { handleOpenVsxRequest } from '../docs/open-vsx-api.js'
import { parseDocsHash } from '../docs/src/router.js'
import { parseVsCodeTheme } from '../src/theme/index.js'

const exportedComponents = [
  'UiAlert',
  'UiBadge',
  'UiButton',
  'UiCheckbox',
  'UiDialog',
  'UiField',
  'UiInput',
  'UiProgress',
  'UiSelect',
  'UiSurface',
]

describe('component documentation', () => {
  it('documents every exported component with usage and API sections', () => {
    expect(componentDocs.map(({ name }) => name).sort()).toEqual(exportedComponents.sort())

    for (const component of componentDocs) {
      expect(component.usage.length).toBeGreaterThan(0)
      expect(component.example.code).toContain(`<${component.name}`)
      expect(component.props).toBeInstanceOf(Array)
      expect(component.slots).toBeInstanceOf(Array)
      expect(component.events).toBeInstanceOf(Array)
    }
  })

  it('renders usage, props, slots, events, an example, and a sandbox link', () => {
    const wrapper = mount(ComponentPage, {
      props: { component: componentDocs.find(({ slug }) => slug === 'button')! },
    })

    expect(wrapper.get('h1').text()).toBe('Button')
    expect(wrapper.text()).toContain('Usage')
    expect(wrapper.text()).toContain('Props')
    expect(wrapper.text()).toContain('Slots')
    expect(wrapper.text()).toContain('Events')
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.get('[data-sandbox-link]').attributes('href')).toBe('#/sandbox/button')
  })
})

describe('docs routing', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/components/button', { name: 'component', slug: 'button' }],
    ['#/sandbox/dialog', { name: 'sandbox', slug: 'dialog' }],
    ['#/not-a-route', { name: 'not-found' }],
  ])('parses %s', (hash, expected) => {
    expect(parseDocsHash(hash)).toEqual(expected)
  })
})

describe('docs preview', () => {
  it('serves the Open VSX API in development and production preview', () => {
    const plugin = openVsxApi()

    expect(plugin.configureServer).toBeTypeOf('function')
    expect(plugin.configurePreviewServer).toBeTypeOf('function')
  })
})

describe('theme picker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('style')
    document.documentElement.classList.remove('dark', 'high-contrast')
  })

  it('clears imported theme variables when returning to a built-in theme', async () => {
    document.documentElement.style.setProperty('--color-bg', '#101218')
    document.documentElement.classList.add('dark')

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const lightButton = [...document.querySelectorAll<HTMLButtonElement>('.theme-choice')]
      .find(button => button.textContent?.includes('Light'))
    expect(lightButton).toBeDefined()
    lightButton?.click()
    await flushPromises()

    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(wrapper.text()).toContain('Theme: Light')
    wrapper.unmount()
  })

  it('searches Open VSX and applies a normalized theme', async () => {
    const theme = parseVsCodeTheme({
      fileName: 'test-dark.json',
      source: JSON.stringify({
        name: 'Test Dark',
        type: 'dark',
        colors: {
          'editor.background': '#101218',
          'editor.foreground': '#f4f5f8',
          'button.background': '#6c8cff',
        },
      }),
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'success',
        themes: [{
          id: 'example.test-dark',
          name: 'Test Dark',
          publisher: 'example',
          description: 'A test theme',
          downloadCount: 1,
        }],
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'success', theme })))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    document.querySelector<HTMLFormElement>('.theme-search')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    const applyButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Apply')
    expect(applyButton).toBeDefined()
    applyButton?.click()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#101218')
    expect(wrapper.text()).toContain('Theme: Test Dark')
    wrapper.unmount()
  })

  it('disables competing theme choices without showing a search spinner during import', async () => {
    let resolveImport: ((response: Response) => void) | undefined
    const theme = parseVsCodeTheme({
      fileName: 'test-dark.json',
      source: JSON.stringify({
        name: 'Test Dark',
        type: 'dark',
        colors: {
          'editor.background': '#101218',
          'editor.foreground': '#f4f5f8',
        },
      }),
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'success',
        themes: [{
          id: 'example.test-dark',
          name: 'Test Dark',
          publisher: 'example',
          description: 'A test theme',
          downloadCount: 1,
        }],
      })))
      .mockImplementationOnce(() => new Promise<Response>(resolve => {
        resolveImport = resolve
      }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    document.querySelector<HTMLFormElement>('.theme-search')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    const applyButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Apply')
    applyButton?.click()
    await nextTick()

    const builtInButtons = [...document.querySelectorAll<HTMLButtonElement>('.theme-choice')]
    const searchButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Search')
    expect(builtInButtons.every(button => button.disabled)).toBe(true)
    expect(searchButton?.disabled).toBe(true)
    expect(searchButton?.getAttribute('aria-busy')).toBeNull()

    resolveImport?.(new Response(JSON.stringify({ status: 'success', theme })))
    await flushPromises()
    wrapper.unmount()
  })
})

describe('docs Open VSX API', () => {
  it('routes searches and validates import appearances', async () => {
    const service = {
      search: vi.fn(async () => ({ status: 'success' as const, themes: [] })),
      importTheme: vi.fn(),
    }

    await expect(handleOpenVsxRequest({
      method: 'GET',
      requestUrl: '/api/open-vsx/search?q=Nord',
      service,
    })).resolves.toEqual({ status: 200, body: { status: 'success', themes: [] } })
    expect(service.search).toHaveBeenCalledWith('Nord')

    await expect(handleOpenVsxRequest({
      method: 'GET',
      requestUrl: '/api/open-vsx/import?id=example.nord&appearance=sepia',
      service,
    })).resolves.toEqual({
      status: 400,
      body: { status: 'error', message: 'Invalid theme appearance.' },
    })
    expect(service.importTheme).not.toHaveBeenCalled()
  })
})
