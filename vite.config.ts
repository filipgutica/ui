import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        theme: fileURLToPath(new URL('./src/theme/index.ts', import.meta.url)),
        'open-vsx': fileURLToPath(new URL('./src/open-vsx/index.ts', import.meta.url)),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'reka-ui', 'jsonc-parser', 'jszip', 'node:crypto'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
