import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UiCodeBlock } from '../src/index.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('UiCodeBlock', () => {
  it('preserves the default header labels and accessible code label', () => {
    const wrapper = mount(UiCodeBlock, {
      props: { code: 'pnpm add @filipgutica/ui', language: 'sh', title: 'Install' },
    })
    expect(wrapper.get('.fg-code-block__title').text()).toBe('Install')
    expect(wrapper.get('.fg-code-block__language').text()).toBe('sh')
    expect(wrapper.get('pre').attributes('aria-label')).toBe('Install')
    expect(wrapper.get('button').text()).toBe('Copy')
    wrapper.unmount()
  })

  it('omits compact header labels while preserving labelled code, copying, and custom actions', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const code = 'pnpm add @filipgutica/ui'
    const wrapper = mount(UiCodeBlock, {
      props: { code, language: 'sh', title: 'Install', variant: 'compact', wrap: true },
      slots: { actions: '<button type="button">Run command</button>' },
    })
    expect(wrapper.find('.fg-code-block__title').exists()).toBe(false)
    expect(wrapper.find('.fg-code-block__language').exists()).toBe(false)
    expect(wrapper.get('pre').attributes('aria-label')).toBe('Install')
    expect(wrapper.get('code').element.textContent).toBe(code)
    expect(wrapper.get('.fg-code-block__actions').text()).toContain('Run command')
    const copy = wrapper.get('.fg-code-block__copy')
    expect(copy.attributes('aria-label')).toBe('Copy code')
    await copy.trigger('click')
    await flushPromises()
    expect(write).toHaveBeenLastCalledWith(code)
    expect(wrapper.get('[role="status"]').text()).toBe('Code copied to clipboard.')
    expect(copy.attributes('title')).toBe('Copied')
    expect(copy.attributes('aria-label')).toBe('Copy code')
    await wrapper.setProps({ copyable: false })
    expect(wrapper.find('.fg-code-block__copy').exists()).toBe(false)
    expect(wrapper.get('.fg-code-block__actions').text()).toContain('Run command')
    wrapper.unmount()
  })

  it('keeps compact highlighting errors visible when copying succeeds', async () => {
    const highlighter = await import('../src/code-highlight.js')
    vi.spyOn(highlighter, 'highlightCode').mockRejectedValueOnce(new Error('unavailable'))
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const wrapper = mount(UiCodeBlock, {
      props: { code: 'pnpm add @filipgutica/ui', language: 'sh', variant: 'compact' },
    })
    await vi.waitFor(() => expect(wrapper.get('[role="status"]').text()).toContain('Syntax highlighting unavailable'))
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('Syntax highlighting unavailable')
    expect(wrapper.get('[role="status"]').text()).toContain('Code copied to clipboard.')
    expect(wrapper.get('[role="status"]').attributes('data-state')).toBeUndefined()
    expect(wrapper.get('button').attributes('title')).toBe('Copied')
    wrapper.unmount()
  })

  it('highlights nested Vue fragments without changing displayed or copied source', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const code = '<UiRadioCardGroup v-model="scheme">\r\n  <UiRadioCard value="dark">\r\n    <strong>Dark</strong>\r\n  </UiRadioCard>\r\n</UiRadioCardGroup>\r\n'
    const wrapper = mount(UiCodeBlock, { props: { code, language: 'vue' } })
    await vi.waitFor(() => {
      const tags = wrapper.findAll('[style*="--color-syntax-tag"]').map(tag => tag.text())
      expect(tags).toContain('UiRadioCard')
      expect(tags).toContain('strong')
    })
    expect(wrapper.get('code').element.textContent).toBe(code)
    await wrapper.get('button').trigger('click')
    expect(write).toHaveBeenLastCalledWith(code)
    wrapper.unmount()
  })

  it('retains embedded script highlighting in complete Vue files', async () => {
    const code = '<!-- example -->\n<script setup lang="ts">\nconst label = "Hello"\n</script>\n<template>\n  <strong>{{ label }}</strong>\n</template>\n<style scoped>\nstrong { color: red; }\n</style>'
    const wrapper = mount(UiCodeBlock, { props: { code, language: 'vue' } })
    await vi.waitFor(() => expect(wrapper.findAll('[style*="--color-syntax-keyword"]').map(token => token.text())).toContain('const'))
    expect(wrapper.findAll('[style*="--color-syntax-tag"]').map(token => token.text())).toContain('strong')
    expect(wrapper.get('code').element.textContent).toBe(code)
    wrapper.unmount()
  })

  it('preserves CRLF and ignores stale highlighting after source changes', async () => {
    const code = 'const value = 1\r\n// next line\r\n'
    const wrapper = mount(UiCodeBlock, { props: { code, language: 'typescript' } })
    await vi.waitFor(() => expect(wrapper.find('[style*="--color-syntax-keyword"]').exists()).toBe(true))
    expect(wrapper.get('code').element.textContent).toBe(code)
    await wrapper.setProps({ code: '<div>next</div>', language: 'html' })
    await wrapper.setProps({ code: 'latest plain value', language: 'text' })
    await flushPromises()
    expect(wrapper.get('code').element.textContent).toBe('latest plain value')
    expect(wrapper.find('[style*="--color-syntax-"]').exists()).toBe(false)
    wrapper.unmount()
  })
  it('highlights language tokens safely and reacts to language changes', async () => {
    const wrapper = mount(UiCodeBlock, { props: { code: 'const value = "<div>"', language: 'ts' } })
    await vi.waitFor(() => expect(wrapper.find('[style*="--color-syntax-keyword"]').text()).toBe('const'))
    expect(wrapper.find('code div').exists()).toBe(false)
    expect(wrapper.get('code').element.textContent).toBe('const value = "<div>"')
    await wrapper.setProps({ language: 'unknown-language' })
    expect(wrapper.find('[style*="--color-syntax-keyword"]').exists()).toBe(false)
    expect(wrapper.get('code').element.textContent).toBe('const value = "<div>"')
    wrapper.unmount()
  })
  it('renders markup as text and copies the exact current source', async () => {
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const code = '<script>alert("example")</script>\n  next line\n'
    const wrapper = mount(UiCodeBlock, { props: { code, language: 'vue', lineNumbers: true } })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.findAll('.fg-code-block__text').map(line => line.element.textContent).join('')).toBe(code)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(write).toHaveBeenLastCalledWith(code)
    expect(wrapper.get('[role="status"]').text()).toContain('Code copied')
    await wrapper.setProps({ code: 'updated source' })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(write).toHaveBeenLastCalledWith('updated source')
    wrapper.unmount()
  })

  it.each(['default', 'compact'] as const)('reports clipboard failure and allows copying to be disabled in %s blocks', async (variant) => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    const wrapper = mount(UiCodeBlock, { props: { code: 'example', variant } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('Could not copy')
    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy code')
    if (variant === 'default') expect(wrapper.get('button').text()).toBe('Copy')
    await wrapper.setProps({ copyable: false })
    expect(wrapper.find('button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('keeps code available when the Clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    const wrapper = mount(UiCodeBlock, { props: { code: 'copy manually' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('[role="status"]').text()).toContain('Clipboard unavailable')
    expect(wrapper.get('code').text()).toBe('copy manually')
    wrapper.unmount()
  })
})
