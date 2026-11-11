import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { siteThemeBootScript } from '../src/site/appearance.js'
import { openVsxApi } from './open-vsx-plugin.js'

// UiSiteHeader loads this file from the published docs site, so a list change ships with the docs deploy.
const projectsFile = fileURLToPath(new URL('../src/site/projects.json', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [
    tailwindcss(),
    vue(),
    openVsxApi(),
    {
      // Applies the stored appearance before the first paint.
      name: 'site-theme-boot',
      transformIndexHtml: () => [{ tag: 'script', children: siteThemeBootScript, injectTo: 'head-prepend' }],
    },
    {
      // Serves src/site/projects.json at /projects.json in dev and writes it to the build output.
      name: 'site-projects-json',
      configureServer(server) {
        server.middlewares.use('/projects.json', (_request, response) => {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(readFileSync(projectsFile))
        })
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'projects.json', source: readFileSync(projectsFile) })
      },
    },
  ],
  // Listed up front so the e2e hydration fixture, which renders server markup in the
  // browser, shares one Vue copy instead of triggering a second optimizer pass.
  optimizeDeps: { include: ['vue/server-renderer'] },
  build: {
    outDir: fileURLToPath(new URL('../docs-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
