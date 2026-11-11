import { flushPromises, mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import type { SiteProjectId } from '../src/site/index.js'

import { SITE_APPEARANCE_KEY, SITE_PROJECTS, UiSiteHeader } from '../src/site/index.js'
import projectList from '../src/site/projects.json'

const links = [
  { label: 'User guide', href: 'https://example.test/guide' },
  { label: 'Releases', href: 'https://example.test/releases' },
]

const mountHeader = async (slots?: Record<string, () => unknown>) => {
  const wrapper = mount(UiSiteHeader, {
    attachTo: document.body,
    props: { project: 'wtree', links },
    ...(slots ? { slots } : {}),
  })
  await nextTick()
  const menu = wrapper.get<HTMLDetailsElement>('details').element
  const trigger = wrapper.get<HTMLElement>('summary').element
  return { wrapper, menu, trigger }
}

describe('site header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.documentElement.classList.remove('dark')
    delete document.documentElement.dataset.theme
  })

  it('renders the project menu and page links without scripts', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(UiSiteHeader, { project: 'devps', links }) }))

    for (const project of SITE_PROJECTS) {
      expect(html).toContain(`href="${project.href}"`)
    }
    expect(html).toMatch(/aria-current="page"[^>]*>devps</)
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    for (const link of links) {
      expect(html).toContain(`href="${link.href}"`)
    }
    expect(html).not.toContain('aria-label="Color theme"')
  })

  it('updates its identity when the current project changes', async () => {
    const { wrapper } = await mountHeader()
    await wrapper.setProps({ project: 'devps' })
    expect(wrapper.get('summary').attributes('aria-label')).toBe('Project: devps')
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('devps')
    wrapper.unmount()
  })

  it('shows the shared picker after mount and writes the shared choice', async () => {
    localStorage.setItem(SITE_APPEARANCE_KEY, 'light')
    const { wrapper } = await mountHeader()
    const picker = wrapper.get('[aria-label="Color theme"]')

    expect(picker.findAll('button').map(button => button.attributes('aria-label'))).toEqual(['System theme', 'Light theme', 'Dark theme'])
    expect(picker.get('[aria-label="Light theme"]').attributes('aria-pressed')).toBe('true')

    await picker.get('[aria-label="Dark theme"]').trigger('click')
    expect(picker.get('[aria-label="Dark theme"]').attributes('aria-pressed')).toBe('true')
    expect(picker.get('[aria-label="Light theme"]').attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem(SITE_APPEARANCE_KEY)).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    wrapper.unmount()
  })

  it('lets a page replace the picker with its own appearance control', async () => {
    const { wrapper } = await mountHeader({ default: () => h('button', { type: 'button' }, 'Theme: Custom') })

    expect(wrapper.find('[aria-label="Color theme"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Theme: Custom')
    wrapper.unmount()
  })

  it('closes the project menu with Escape and returns focus to its trigger', async () => {
    const { wrapper, menu, trigger } = await mountHeader()
    menu.open = true
    const current = wrapper.get<HTMLAnchorElement>('a[aria-current="page"]').element
    current.focus()

    current.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(menu.open).toBe(false)
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  it('closes the project menu when focus moves outside it or a click lands elsewhere', async () => {
    const { wrapper, menu } = await mountHeader()
    const inside = wrapper.get<HTMLAnchorElement>('nav a').element
    const outside = document.body.appendChild(document.createElement('button'))

    menu.open = true
    inside.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: wrapper.findAll<HTMLAnchorElement>('nav a')[1]?.element ?? null }))
    expect(menu.open).toBe(true)

    inside.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }))
    expect(menu.open).toBe(false)

    menu.open = true
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(menu.open).toBe(false)
    wrapper.unmount()
  })
})

describe('site header project list', () => {
  const remote = [
    { id: 'wtree', label: 'wtree', href: 'https://filipgutica.github.io/wtree/', repository: 'https://github.com/filipgutica/wtree' },
    { id: 'newsite', label: 'New site', href: 'https://filipgutica.github.io/newsite/', repository: 'https://github.com/filipgutica/newsite' },
  ]

  // Loaded lists are shared per URL for the page, so each test reads its own URL.
  let urls = 0
  const nextUrl = () => `https://example.test/projects-${++urls}.json`

  const stubFetch = (respond: () => Promise<Response>) => {
    const fetchMock = vi.fn(respond)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }
  const respondWith = (body: unknown) => () => Promise.resolve(Response.json(body))

  const mountHeader = (props: { project?: string, projectsUrl: string | null }) =>
    mount(UiSiteHeader, { attachTo: document.body, props: { project: 'wtree', ...props } })

  const menuLabels = (wrapper: ReturnType<typeof mountHeader>) =>
    wrapper.findAll('nav[aria-label="Projects"] a').map(link => link.text())

  const builtInLabels = SITE_PROJECTS.map(({ label }) => label)

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders the built-in list first and the published list once it loads', async () => {
    const url = nextUrl()
    const fetchMock = stubFetch(respondWith(remote))
    const wrapper = mountHeader({ projectsUrl: url })

    expect(menuLabels(wrapper)).toEqual(builtInLabels)
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(url, expect.anything())
    expect(menuLabels(wrapper)).toEqual(['wtree', 'New site'])
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('wtree')
    wrapper.unmount()
  })

  it('drops entries with an unsafe link, a duplicate id, or a missing field', async () => {
    stubFetch(respondWith([
      ...remote,
      { id: 'script', label: 'Script', href: 'javascript:alert(1)', repository: 'https://github.com/filipgutica/script' },
      { id: 'plain', label: 'Plain', href: 'http://filipgutica.github.io/plain/', repository: 'https://github.com/filipgutica/plain' },
      { id: 'newsite', label: 'Copy', href: 'https://filipgutica.github.io/copy/', repository: 'https://github.com/filipgutica/copy' },
      { id: 'nolabel', href: 'https://filipgutica.github.io/nolabel/', repository: 'https://github.com/filipgutica/nolabel' },
      { id: '', label: 'No id', href: 'https://filipgutica.github.io/noid/', repository: 'https://github.com/filipgutica/noid' },
    ]))
    const wrapper = mountHeader({ projectsUrl: nextUrl() })
    await flushPromises()

    expect(menuLabels(wrapper)).toEqual(['wtree', 'New site'])
    expect(wrapper.find('a[href^="javascript:"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each([
    ['the request fails', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['the response is 404', () => Promise.resolve(new Response(JSON.stringify(remote), { status: 404 }))],
    ['the response is 206, not 200', () => Promise.resolve(new Response(JSON.stringify(remote), { status: 206 }))],
    ['the body is not JSON', () => Promise.resolve(new Response('<!doctype html>', { status: 200 }))],
    ['no entry is valid', respondWith([{ id: 'script', label: 'Script', href: 'javascript:alert(1)', repository: 'javascript:alert(1)' }])],
  ])('keeps the built-in list when %s', async (_case, respond) => {
    stubFetch(respond)
    const wrapper = mountHeader({ projectsUrl: nextUrl() })
    await flushPromises()

    expect(menuLabels(wrapper)).toEqual(builtInLabels)
    wrapper.unmount()
  })

  it('fetches nothing when projectsUrl is null', async () => {
    const fetchMock = stubFetch(respondWith(remote))
    const wrapper = mountHeader({ projectsUrl: null })
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(menuLabels(wrapper)).toEqual(builtInLabels)
    wrapper.unmount()
  })

  it('shares one request between headers on the same page', async () => {
    const url = nextUrl()
    const fetchMock = stubFetch(respondWith(remote))
    const first = mountHeader({ projectsUrl: url })
    const second = mountHeader({ project: 'newsite', projectsUrl: url })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(menuLabels(first)).toEqual(['wtree', 'New site'])
    expect(menuLabels(second)).toEqual(['wtree', 'New site'])
    expect(second.get('summary').attributes('aria-label')).toBe('Project: New site')
    first.unmount()
    second.unmount()
  })

  it('keeps the current project where the built-in list has it when the published list leaves it out', async () => {
    stubFetch(respondWith([SITE_PROJECTS[0], ...remote]))
    // devps is third in the built-in list.
    const wrapper = mountHeader({ project: 'devps', projectsUrl: nextUrl() })
    await flushPromises()

    expect(menuLabels(wrapper)).toEqual(['annoterm', 'wtree', 'devps', 'New site'])
    expect(wrapper.get('a[aria-current="page"]').text()).toBe('devps')
    wrapper.unmount()
  })
})

describe('SiteProjectId', () => {
  // Every built-in id, typed. `satisfies` fails typecheck on an id outside the union, and
  // `everyId` fails it when the union has an id this list lacks.
  const ids = ['annoterm', 'wtree', 'devps', 'pluginbench', 'workbench', 'filip-stack', 'ui', 'design-system'] as const satisfies readonly SiteProjectId[]
  const everyId: [Exclude<SiteProjectId, (typeof ids)[number]>] extends [never] ? true : false = true

  it('lists exactly the ids in projects.json', () => {
    expect(everyId).toBe(true)
    expect(projectList.map(({ id }) => id)).toEqual(ids)
  })
})
