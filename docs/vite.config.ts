import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { openVsxApi } from './open-vsx-plugin.js'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [tailwindcss(), vue(), openVsxApi()],
  build: {
    outDir: fileURLToPath(new URL('../docs-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
