import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { UiCodeBlock, UiExample } from '../src/index.js'

describe('UiExample', () => {
  it('puts the preview on a stage above its embedded source', () => {
    const code = '<UiButton>Save</UiButton>'
    const wrapper = mount(UiExample, {
      props: { code, language: 'vue' },
      slots: { default: '<button type="button" class="preview">Save</button>' },
    })
    const [stage, source] = wrapper.get('.fg-example').element.children
    expect(stage?.classList.contains('fg-example__stage')).toBe(true)
    expect(stage?.querySelector('.preview')?.textContent).toBe('Save')
    expect(source?.classList.contains('fg-code-block')).toBe(true)
    expect(wrapper.getComponent(UiCodeBlock).props()).toMatchObject({ code, language: 'vue', variant: 'embedded' })
    expect(wrapper.get('code').element.textContent).toBe(code)
    wrapper.unmount()
  })

  it('places Copy before the code and labels plain source without a command prompt', () => {
    const wrapper = mount(UiExample, { props: { code: 'plain source' } })
    const block = wrapper.get('.fg-code-block')
    expect(block.attributes('data-variant')).toBe('embedded')
    expect(block.attributes('data-command')).toBeUndefined()
    const copy = wrapper.get('button[aria-label="Copy code"]').element
    const pre = wrapper.get('pre').element
    expect(copy.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pre.getAttribute('aria-label')).toBe('text code')
    wrapper.unmount()
  })
})
