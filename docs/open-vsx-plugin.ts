import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Plugin } from 'vite'

import { createOpenVsxThemeService } from '../src/open-vsx/index.js'
import { handleOpenVsxRequest } from './open-vsx-api.js'

const sendJson = ({
  body,
  response,
  status = 200,
}: {
  body: unknown
  response: ServerResponse
  status?: number
}): void => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

const createMiddleware = () => {
  const service = createOpenVsxThemeService()
  return async (request: IncomingMessage, response: ServerResponse, next: () => void): Promise<void> => {
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
  }
}

export const openVsxApi = (): Plugin => ({
  name: 'docs-open-vsx-api',
  configureServer(server) {
    server.middlewares.use(createMiddleware())
  },
  configurePreviewServer(server) {
    server.middlewares.use(createMiddleware())
  },
})
