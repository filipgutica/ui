// A drawer whose consumer cancels outside presses with ?guard, as a drawer holding an unfinished
// form might. The docs sandbox cannot pass that handler.
import './site.css'

import { createApp, h, ref } from 'vue'

import { UiButton, UiDrawer } from '../../src/index.js'

const guard = new URLSearchParams(location.search).has('guard')
const open = ref(false)
createApp({
  render: () => h(UiDrawer, {
    'open': open.value,
    'title': 'Navigation',
    'onUpdate:open': (value: boolean) => { open.value = value },
    ...(guard ? { onPointerDownOutside: (event: Event) => event.preventDefault() } : {}),
  }, {
    trigger: () => h(UiButton, { variant: 'secondary' }, () => 'Open drawer'),
    default: () => h('a', { href: '#overview' }, 'Overview'),
  }),
}).mount('#app')
