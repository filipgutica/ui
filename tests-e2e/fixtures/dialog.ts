// A dialog opened from a page button, or its optional trigger slot with ?trigger. With ?guard its consumer
// cancels outside presses, as a dialog holding an unfinished form might. The docs sandbox cannot
// pass that handler. With ?image the button opens an image viewer on a 2x screenshot, 1280x900 at full size.
import './site.css'

import { createApp, h, ref } from 'vue'

import { UiButton, UiDialog, UiImageViewer } from '../../src/index.js'

const guard = new URLSearchParams(location.search).has('guard')
const withTrigger = new URLSearchParams(location.search).has('trigger')
const withImage = new URLSearchParams(location.search).has('image')
const open = ref(false)
const screenshot = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1800"><rect width="2560" height="1800" fill="#8a8fa3"/></svg>')}`
createApp({
  render: () => withImage
    ? [
        h(UiButton, { variant: 'secondary', onClick: () => { open.value = true } }, () => 'Open screenshot'),
        h(UiImageViewer, {
          'open': open.value,
          'title': 'Ticket screenshot',
          'src': screenshot,
          'alt': 'A Ticket with its brief, Progress, and Threads',
          'width': 1280,
          'height': 900,
          'onUpdate:open': (value: boolean) => { open.value = value },
        }),
      ]
    : [
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
