import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { siteThemeBootScript } from '../src/site/appearance.js'
import { openVsxApi } from './open-vsx-plugin.js'

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
  ],
  // Listed up front so the e2e hydration fixture, which renders server markup in the
  // browser, shares one Vue copy instead of triggering a second optimizer pass.
  optimizeDeps: { include: ['vue/server-renderer'] },
  build: {
    outDir: fileURLToPath(new URL('../docs-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
