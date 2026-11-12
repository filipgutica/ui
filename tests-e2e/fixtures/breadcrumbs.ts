// Breadcrumb trails as server markup with no mount, which is what a reader without JavaScript
// gets, so the stylesheet alone draws the separators and the phone back link.
import './site.css'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { UiBreadcrumbs } from '../../src/index.js'

const page = createSSRApp({
  render: () => [
    h(UiBreadcrumbs, {
      label: 'Deep trail',
      items: [
        { label: 'Filip Stack', href: '#home' },
        { label: 'Skills', href: '#skills' },
        { label: 'Field Guide' },
      ],
    }),
    h('h1', 'Field Guide'),
    h(UiBreadcrumbs, {
      label: 'Short trail',
      items: [{ label: 'Filip Stack', href: '#home' }, { label: 'Skills' }],
    }),
  ],
})

document.querySelector<HTMLElement>('#app')!.innerHTML = await renderToString(page)
