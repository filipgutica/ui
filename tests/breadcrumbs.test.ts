import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiBreadcrumbs from '../src/components/UiBreadcrumbs.vue'

describe('UiBreadcrumbs', () => {
  it('links each ancestor and marks the last item as the current page in plain text', () => {
    const wrapper = mount(UiBreadcrumbs, {
      props: {
        items: [
          { label: 'Filip Stack', href: '/' },
          { label: 'Skills', href: '/skills/' },
          { label: 'Field Guide', href: '/skills/field-guide/' },
        ],
      },
    })

    const nav = wrapper.get('nav')
    expect(nav.attributes('aria-label')).toBe('Breadcrumb')
    expect(nav.findAll('ol > li').map(item => item.text())).toEqual(['Filip Stack', 'Skills', 'Field Guide'])
    expect(nav.findAll('a').map(link => [link.text(), link.attributes('href')])).toEqual([
      ['Filip Stack', '/'],
      ['Skills', '/skills/'],
    ])
    // The current page takes no link, so it takes no Tab stop, even when its item has an href.
    const current = nav.get('[aria-current="page"]')
    expect(current.element.tagName).toBe('SPAN')
    expect(current.text()).toBe('Field Guide')
    expect(nav.findAll('[aria-current]')).toHaveLength(1)
  })

  it('takes a custom accessible name', () => {
    const wrapper = mount(UiBreadcrumbs, { props: { label: 'Example breadcrumb', items: [{ label: 'Home' }] } })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Example breadcrumb')
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Home')
  })

  it('renders an ancestor without an href as text that is not the current page', () => {
    const wrapper = mount(UiBreadcrumbs, { props: { items: [{ label: 'Archive' }, { label: 'Notes' }] } })
    const [ancestor] = wrapper.findAll('li')
    expect(ancestor?.find('a').exists()).toBe(false)
    expect(ancestor?.find('[aria-current]').exists()).toBe(false)
    expect(ancestor?.text()).toBe('Archive')
  })
})
