import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ComponentPage from '../docs/src/components/ComponentPage.vue'
import ApiTable from '../docs/src/components/ApiTable.vue'
import ThemePicker from '../docs/src/components/ThemePicker.vue'
import { openVsxApi } from '../docs/open-vsx-plugin.js'
import { componentDocs } from '../docs/src/component-docs.js'
import { handleOpenVsxRequest } from '../docs/open-vsx-api.js'
import { parseDocsHash } from '../docs/src/router.js'
import { MAX_THEME_FILE_BYTES, parseThemeFile } from '../docs/src/theme-file.js'
import { parseVsCodeTheme } from '../src/theme/index.js'
import * as libraryComponents from '../src/index.js'

const exportedComponents = [
  'UiAlert',
  'UiBadge',
  'UiButton',
  'UiCard',
  'UiCheckbox',
  'UiCodeBlock',
  'UiDialog',
  'UiField',
  'UiInput',
  'UiProgress',
  'UiRadioCard',
  'UiRadioCardGroup',
  'UiSelect',
  'UiSlider',
]

describe('component documentation', () => {
  it.each(componentDocs)('shows accurate prop requirements for $name without labeling slots or events', (doc) => {
    const component = new Map(Object.entries(libraryComponents)).get(doc.name)
    const runtimeProps: unknown = component && 'props' in component ? component.props : undefined
    if (typeof runtimeProps !== 'object' || runtimeProps === null || Array.isArray(runtimeProps)) {
      throw new Error(`Missing runtime props for ${doc.name}`)
    }

    const propsTable = mount(ApiTable, { props: { items: doc.props } })
    expect(propsTable.findAll('thead th')).toHaveLength(4)
    const rows = propsTable.findAll('tbody tr')
    for (const [index, prop] of doc.props.entries()) {
      expect(Object.hasOwn(runtimeProps, prop.name)).toBe(true)
      const options: unknown = Reflect.get(runtimeProps, prop.name)
      const required = typeof options === 'object' && options !== null
        && 'required' in options && options.required === true
      expect(rows[index]?.get('th code').text()).toBe(prop.name)
      expect(rows[index]?.get('th small').text()).toBe(required ? 'Required' : 'Optional')
    }
    propsTable.unmount()

    for (const items of [doc.slots, doc.events]) {
      const table = mount(ApiTable, { props: { items } })
      expect(table.text()).not.toMatch(/Required|Optional/)
      table.unmount()
    }
  })

  it('documents every primary component with usage and API sections', () => {
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

  it('renders documented examples with a copyable code block', () => {
    const wrapper = mount(ComponentPage, {
      props: { component: componentDocs.find(({ slug }) => slug === 'code-block')! },
    })

    expect(wrapper.get('.fg-code-block')).toBeTruthy()
    expect(wrapper.get('.fg-code-block__copy').attributes('aria-label')).toBe('Copy code')
    expect(wrapper.get('.fg-code-block__pre').text()).toContain('<UiCodeBlock')
  })
})

describe('docs routing', () => {
  it.each([
    ['', { name: 'home' }],
    ['#/components/button', { name: 'component', slug: 'button' }],
    ['#/sandbox/dialog', { name: 'sandbox', slug: 'dialog' }],
    ['#/components/surface', { name: 'component', slug: 'card' }],
    ['#/sandbox/surface', { name: 'sandbox', slug: 'card' }],
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
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('style')
    document.documentElement.classList.remove('dark', 'high-contrast')
  })

  it('separates color-scheme selection from adding themes', async () => {
    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const choices = [...document.querySelectorAll<HTMLElement>('[role="radio"]')]
    expect(choices.map(choice => choice.textContent?.trim())).toEqual(['System', 'Light', 'Dark'])
    expect(document.body.textContent).toContain('Color scheme')
    expect(document.body.textContent).toContain('Themes')
    expect([...document.querySelectorAll('button')].some(button => button.textContent?.includes('Add theme'))).toBe(true)

    choices[0]?.focus()
    choices[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await vi.waitFor(() => {
      expect(choices[1]?.getAttribute('aria-checked')).toBe('true')
    })
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()

    wrapper.unmount()
  })

  it('clears imported theme variables when returning to a built-in theme', async () => {
    document.documentElement.style.setProperty('--color-bg', '#101218')
    document.documentElement.classList.add('dark')

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const lightButton = [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
      .find(button => button.textContent?.includes('Light'))
    expect(lightButton).toBeDefined()
    lightButton?.click()
    await flushPromises()

    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(wrapper.text()).toContain('Theme: Light')
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()

    const doneButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Done')
    doneButton?.click()
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('searches Open VSX and applies a normalized theme', async () => {
    vi.useFakeTimers()
    localStorage.setItem('filipgutica-ui-active-theme', 'dark')
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
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/api/open-vsx/import')) {
        return new Response(JSON.stringify({ status: 'success', theme }))
      }
      const isTestQuery = url.includes('q=Test+Dark') || url.includes('q=Test%20Dark')
      return new Response(JSON.stringify({
        status: 'success',
        themes: isTestQuery ? [{
          id: 'example.test-dark',
          name: 'Test Dark',
          publisher: 'example',
          description: 'A test theme',
          downloadCount: 1,
        }] : [],
      }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    const addThemeButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.includes('Add theme'))
    addThemeButton?.click()
    await flushPromises()

    const input = document.querySelector<HTMLInputElement>('#open-vsx-query')
    expect(input).not.toBeNull()
    input!.value = 'Test Dark'
    input!.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(299)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('Test'))).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    const installButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Install')
    expect(installButton).toBeDefined()
    installButton?.click()
    await flushPromises()

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('q=Test%20Dark'))).toBe(true)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/open-vsx/import'))).toBe(true)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('appearance=dark'))).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#101218')
    expect(wrapper.text()).toContain('Theme: Test Dark')
    wrapper.unmount()
  })

  it('restores a valid persisted theme', async () => {
    const theme = parseVsCodeTheme({
      fileName: 'persisted.json',
      source: JSON.stringify({
        name: 'Persisted Theme',
        type: 'dark',
        colors: {
          'editor.background': '#12141a',
          'editor.foreground': '#f7f8fb',
        },
      }),
    })
    localStorage.setItem('filipgutica-ui-active-theme', 'saved.theme')
    localStorage.setItem('filipgutica-ui-installed-themes', JSON.stringify([
      { id: 'saved.theme', theme },
    ]))

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('Theme: Persisted Theme')
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#12141a')
    wrapper.unmount()
  })

  it('locks competing inputs and ignores an install completed after leaving the panel', async () => {
    vi.useFakeTimers()
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
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/api/open-vsx/import')) {
        return new Promise<Response>(resolve => {
          resolveImport = resolve
        })
      }
      const isBusyQuery = url.includes('q=Busy')
      return Promise.resolve(new Response(JSON.stringify({
        status: 'success',
        themes: isBusyQuery ? [
          { id: 'example.test-dark', name: 'Test Dark', publisher: 'example', description: 'A test theme', downloadCount: 1 },
          { id: 'example.other', name: 'Other', publisher: 'example', description: 'Another theme', downloadCount: 2 },
        ] : [],
      })))
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ThemePicker, { attachTo: document.body })
    await wrapper.get('button').trigger('click')
    const addThemeButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.includes('Add theme'))
    addThemeButton?.click()
    await flushPromises()
    const input = document.querySelector<HTMLInputElement>('#open-vsx-query')!
    input.value = 'Busy'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    const installButtons = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .filter(button => button.textContent?.trim() === 'Install')
    installButtons[0]?.click()
    await nextTick()

    expect(installButtons.every(button => button.disabled)).toBe(true)
    expect(installButtons[0]?.getAttribute('aria-busy')).toBe('true')
    expect(installButtons[1]?.getAttribute('aria-busy')).toBeNull()
    expect(input.disabled).toBe(true)
    const chooseFileButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.includes('Choose file'))
    expect(chooseFileButton?.disabled).toBe(true)

    const backButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Back to themes')
    backButton?.click()
    await nextTick()

    resolveImport?.(new Response(JSON.stringify({ status: 'success', theme })))
    await flushPromises()
    expect(JSON.parse(localStorage.getItem('filipgutica-ui-installed-themes') ?? '[]')).toEqual([])
    expect(wrapper.text()).toContain('Theme: System')
    expect(document.body.textContent).toContain('Color scheme')
    wrapper.unmount()
  })
})

describe('theme file import', () => {
  it('accepts JSONC and rejects unsupported or oversized files', async () => {
    const source = `{
      // Comments are valid in VS Code themes.
      "name": "Local Theme",
      "type": "light",
      "colors": {
        "editor.background": "#ffffff",
        "editor.foreground": "#111111",
      },
    }`

    await expect(parseThemeFile(new File([source], 'local-theme.jsonc')))
      .resolves.toMatchObject({ name: 'Local Theme', appearance: 'light' })
    await expect(parseThemeFile(new File([source], 'local-theme.txt')))
      .rejects.toThrow('Choose a .json or .jsonc theme file.')
    await expect(parseThemeFile(new File([new Uint8Array(MAX_THEME_FILE_BYTES + 1)], 'large.json')))
      .rejects.toThrow('Theme files must be 1 MB or smaller.')
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
