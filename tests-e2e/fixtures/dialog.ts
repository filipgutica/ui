// A dialog opened from a page button, or its optional trigger slot with ?trigger. With ?guard its consumer
// cancels outside presses, as a dialog holding an unfinished form might. The docs sandbox cannot
// pass that handler.
import './site.css'

import { createApp, h, ref } from 'vue'

import { UiButton, UiDialog } from '../../src/index.js'

const guard = new URLSearchParams(location.search).has('guard')
const withTrigger = new URLSearchParams(location.search).has('trigger')
const open = ref(false)
createApp({
  render: () => [
    !withTrigger && h(UiButton, { variant: 'secondary', onClick: () => { open.value = true } }, () => 'Open dialog'),
    h(UiDialog, {
      'open': open.value,
      'title': 'Remove theme',
      'description': 'This removes the saved theme.',
      'onUpdate:open': (value: boolean) => { open.value = value },
      ...(guard ? { onPointerDownOutside: (event: Event) => event.preventDefault() } : {}),
    }, {
      default: () => 'Remove it from this browser only.',
      ...(withTrigger ? { trigger: () => h(UiButton, { variant: 'secondary' }, () => 'Open dialog') } : {}),
    }),
  ],
}).mount('#app')
