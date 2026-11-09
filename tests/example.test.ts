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

  it('is a figure whose optional caption follows the frame', () => {
    const plain = mount(UiExample, { props: { code: 'source' } })
    expect(plain.element.tagName).toBe('FIGURE')
    expect(plain.classes()).toContain('fg-example')
    expect(plain.find('figcaption').exists()).toBe(false)
    plain.unmount()

    const captioned = mount(UiExample, {
      props: { code: 'source' },
      slots: { caption: 'A secondary button.' },
    })
    const [frame, caption] = captioned.get('figure').element.children
    expect(frame?.classList.contains('fg-example')).toBe(true)
    expect(frame?.querySelector('.fg-example__stage')).not.toBeNull()
    expect(caption?.tagName).toBe('FIGCAPTION')
    expect(caption?.classList.contains('fg-figure__caption')).toBe(true)
    expect(caption?.textContent).toBe('A secondary button.')
    captioned.unmount()

    for (const slots of [{}, { caption: 'Caption' }]) {
      const styled = mount(UiExample, {
        attrs: { class: 'custom', style: 'border-radius: 0px;' },
        props: { code: 'source' },
        slots,
      })
      const frameElement = styled.get('.fg-example')
      expect(frameElement.classes()).toContain('custom')
      expect(frameElement.attributes('style')).toContain('border-radius: 0px')
      styled.unmount()
    }
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
