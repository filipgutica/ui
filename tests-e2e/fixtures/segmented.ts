// Segmented controls in states the docs sandbox cannot reach: hydrated from server
// markup, and driven by a model value the page sets, including undefined.
import './site.css'

import { createApp, createSSRApp, defineComponent, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { UiSegmentedControl } from '../../src/index.js'
import { UiSiteAppearancePicker, useSiteAppearance } from '../../src/site/index.js'

const AppearancePicker = defineComponent(() => {
  const { choice, chooseAppearance } = useSiteAppearance()
  return () => h(UiSiteAppearancePicker, { 'modelValue': choice.value, 'onUpdate:modelValue': chooseAppearance })
})

// The server sees no stored choice, so hydration restores it after mount.
const hydrated = document.querySelector<HTMLElement>('#hydrated')!
hydrated.innerHTML = await renderToString(createSSRApp(AppearancePicker))
createSSRApp(AppearancePicker).mount(hydrated)

const view = ref<string | undefined>('list')
createApp({
  render: () => h(UiSegmentedControl, {
    'label': 'View',
    'items': [{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }, { value: 'timeline', label: 'Timeline' }],
    'modelValue': view.value,
    'onUpdate:modelValue': (value: string) => { view.value = value },
  }),
}).mount('#driven')
Object.assign(window, { setView: (value: string | undefined) => { view.value = value } })
