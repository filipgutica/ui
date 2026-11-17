// An item row with the overflow menu at its end, a button after it for Tab, and the confirm dialog
// its Delete action opens, as a caller would wire it. #selected logs each selected id.
import './site.css'

import { createApp, h, ref } from 'vue'

import { UiButton, UiDialog, UiOverflowMenu } from '../../src/index.js'

const selected = ref<string[]>([])
const confirmOpen = ref(false)
createApp({
  render: () => [
    h('h1', 'Monitors'),
    h('div', { style: 'display: flex; align-items: center; justify-content: space-between; gap: var(--space-3)' }, [
      h('span', 'API latency'),
      h(UiOverflowMenu, {
        label: 'More actions for API latency',
        items: [
          { id: 'delete', label: 'Delete…', tone: 'danger' },
          { id: 'rename', label: 'Rename' },
          { id: 'duplicate', label: 'Duplicate' },
          { id: 'export', label: 'Export', disabled: true },
        ],
        onSelect: (id: string) => {
          selected.value = [...selected.value, id]
          if (id === 'delete') confirmOpen.value = true
        },
      }),
    ]),
    h(UiButton, { variant: 'secondary' }, () => 'Next control'),
    h('output', { id: 'selected' }, selected.value.join(',')),
    h(UiDialog, {
      'open': confirmOpen.value,
      'title': 'Delete monitor',
      'description': 'This removes its history.',
      'onUpdate:open': (value: boolean) => { confirmOpen.value = value },
    }, {
      default: () => 'API p95 latency stops alerting at once.',
      footer: () => h(UiButton, { variant: 'danger', onClick: () => { confirmOpen.value = false } }, () => 'Delete'),
    }),
  ],
}).mount('#app')
