// A dialog opened from a page button, as UiDialog has no trigger slot. With ?guard its consumer
// cancels outside presses, as a dialog holding an unfinished form might. The docs sandbox cannot
// pass that handler.
import './site.css'

import { createApp, h, ref } from 'vue'

import { UiButton, UiDialog } from '../../src/index.js'

const guard = new URLSearchParams(location.search).has('guard')
const open = ref(false)
createApp({
  render: () => [
    h(UiButton, { variant: 'secondary', onClick: () => { open.value = true } }, () => 'Open dialog'),
    h(UiDialog, {
      'open': open.value,
      'title': 'Remove theme',
      'description': 'This removes the saved theme.',
      'onUpdate:open': (value: boolean) => { open.value = value },
      ...(guard ? { onPointerDownOutside: (event: Event) => event.preventDefault() } : {}),
    }, () => 'Remove it from this browser only.'),
  ],
}).mount('#app')
