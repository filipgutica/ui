import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

import { createOpenVsxThemeService } from '../src/open-vsx/index.js'
import { handleOpenVsxRequest } from './open-vsx-api.js'

const sendJson = ({
  body,
  response,
  status = 200,
}: {
  body: unknown
  response: import('node:http').ServerResponse
  status?: number
}): void => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

const openVsxApi = (): Plugin => ({
  name: 'docs-open-vsx-api',
  configureServer(server) {
    const service = createOpenVsxThemeService()
    server.middlewares.use(async (request, response, next) => {
      try {
        const result = await handleOpenVsxRequest({
          method: request.method,
          requestUrl: request.url ?? '/',
          service,
        })
        if (!result) return next()
        sendJson({ body: result.body, response, status: result.status })
      } catch {
        sendJson({ body: { status: 'error', message: 'The theme service failed.' }, response, status: 500 })
      }
    })
  },
})

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [tailwindcss(), vue(), openVsxApi()],
  build: {
    outDir: fileURLToPath(new URL('../docs-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
