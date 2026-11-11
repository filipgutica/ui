// A project page built from the site components, for e2e checks that need real layout.
// ?static renders the server markup without mounting, which is what a reader without JavaScript gets.
import './site.css'

import { createApp, createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import SitePage from './SitePage.vue'

const app = document.querySelector<HTMLElement>('#app')!
if (new URLSearchParams(location.search).has('static')) app.innerHTML = await renderToString(createSSRApp(SitePage))
else createApp(SitePage).mount(app)
