import { mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'

import { SITE_APPEARANCE_KEY, siteThemeBootScript, useSiteAppearance } from '../src/site/index.js'

const root = document.documentElement

const resetRoot = (): void => {
  root.classList.remove('dark')
  delete root.dataset.theme
}

// A controllable stand-in for the operating system's color-scheme preference.
const stubSystemAppearance = (initialDark: boolean): ((dark: boolean) => void) => {
  let dark = initialDark
  const listeners = new Set<(event: { matches: boolean }) => void>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() { return dark },
    addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) => listeners.delete(listener),
  }))
  return (next) => {
    dark = next
    for (const listener of listeners) listener({ matches: next })
  }
}

let api!: ReturnType<typeof useSiteAppearance>
const Probe = defineComponent({
  props: { applyToRoot: { type: Boolean, default: true } },
  setup(props) {
    api = useSiteAppearance({ applyToRoot: props.applyToRoot })
    return () => h('p', api.choice.value)
  },
})

const mountAppearance = ({ applyToRoot = true } = {}) => {
  const wrapper = mount(Probe, { attachTo: document.body, props: { applyToRoot } })
  return { api, wrapper }
}

const rootState = () => ({ dark: root.classList.contains('dark'), theme: root.dataset.theme })

describe('shared site appearance', () => {
  beforeEach(() => {
    localStorage.clear()
    resetRoot()
    stubSystemAppearance(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    resetRoot()
  })

  it.each([
    { stored: 'dark', systemDark: false, expected: { dark: true, theme: 'dark' } },
    { stored: 'light', systemDark: true, expected: { dark: false, theme: 'light' } },
    { stored: 'system', systemDark: true, expected: { dark: true, theme: undefined } },
    { stored: 'system', systemDark: false, expected: { dark: false, theme: undefined } },
    { stored: null, systemDark: true, expected: { dark: true, theme: undefined } },
    { stored: 'sepia', systemDark: false, expected: { dark: false, theme: undefined } },
  ])('applies stored $stored with system dark $systemDark the same before and after hydration', async ({ stored, systemDark, expected }) => {
    if (stored !== null) localStorage.setItem(SITE_APPEARANCE_KEY, stored)
    stubSystemAppearance(systemDark)

    new Function(siteThemeBootScript)()
    expect(rootState()).toEqual(expected)

    resetRoot()
    const { wrapper } = mountAppearance()
    await nextTick()
    expect(rootState()).toEqual(expected)
    wrapper.unmount()
  })

  it('lets the boot script fail safely when storage and media queries are unavailable', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') } })
    vi.stubGlobal('matchMedia', () => { throw new Error('unsupported') })

    expect(() => new Function(siteThemeBootScript)()).not.toThrow()
    expect(rootState()).toEqual({ dark: false, theme: undefined })
  })

  it('renders system on the server and loads the stored choice only after mount', async () => {
    localStorage.setItem(SITE_APPEARANCE_KEY, 'dark')

    expect(await renderToString(createSSRApp(Probe))).toContain('system')
    const wrapper = mount(Probe, { attachTo: document.body })
    await nextTick()
    expect(wrapper.text()).toBe('dark')
    wrapper.unmount()
  })

  it('persists a choice, applies it, and removes the override for system', async () => {
    const { api, wrapper } = mountAppearance()
    await nextTick()

    api.chooseAppearance('dark')
    await nextTick()
    expect(localStorage.getItem(SITE_APPEARANCE_KEY)).toBe('dark')
    expect(rootState()).toEqual({ dark: true, theme: 'dark' })

    api.chooseAppearance('system')
    await nextTick()
    expect(localStorage.getItem(SITE_APPEARANCE_KEY)).toBe('system')
    expect(rootState()).toEqual({ dark: false, theme: undefined })
    wrapper.unmount()
  })

  it('follows the operating system only while system is chosen', async () => {
    const setSystemDark = stubSystemAppearance(false)
    const { api, wrapper } = mountAppearance()
    await nextTick()

    setSystemDark(true)
    await nextTick()
    expect(api.appearance.value).toBe('dark')
    expect(rootState().dark).toBe(true)

    api.chooseAppearance('light')
    setSystemDark(false)
    setSystemDark(true)
    await nextTick()
    expect(api.appearance.value).toBe('light')
    expect(rootState()).toEqual({ dark: false, theme: 'light' })
    wrapper.unmount()
  })

  it('accepts changes from another tab and ignores invalid values', async () => {
    const { api, wrapper } = mountAppearance()
    await nextTick()

    localStorage.setItem(SITE_APPEARANCE_KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_APPEARANCE_KEY, newValue: 'dark', storageArea: localStorage }))
    await nextTick()
    expect(api.choice.value).toBe('dark')

    localStorage.setItem(SITE_APPEARANCE_KEY, 'sepia')
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_APPEARANCE_KEY, newValue: 'sepia', storageArea: localStorage }))
    await nextTick()
    expect(api.choice.value).toBe('system')
    wrapper.unmount()
  })

  it('keeps the choice working for the visit when storage fails', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    })
    const { api, wrapper } = mountAppearance()
    await nextTick()

    expect(() => api.chooseAppearance('dark')).not.toThrow()
    await nextTick()
    expect(api.choice.value).toBe('dark')
    expect(rootState()).toEqual({ dark: true, theme: 'dark' })
    wrapper.unmount()
  })

  it('leaves the page root to its owner when applyToRoot is false', async () => {
    const { api, wrapper } = mountAppearance({ applyToRoot: false })
    await nextTick()

    api.chooseAppearance('dark')
    await nextTick()
    expect(api.appearance.value).toBe('dark')
    expect(rootState()).toEqual({ dark: false, theme: undefined })
    wrapper.unmount()
  })
})
