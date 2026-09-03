import type { OpenVsxThemeService } from '../src/open-vsx/index.js'

export interface OpenVsxApiResponse {
  status: number
  body: unknown
}

export const handleOpenVsxRequest = async ({
  method,
  requestUrl,
  service,
}: {
  method: string | undefined
  requestUrl: string
  service: OpenVsxThemeService
}): Promise<OpenVsxApiResponse | null> => {
  const url = new URL(requestUrl, 'http://docs.local')
  if (!url.pathname.startsWith('/api/open-vsx/')) return null

  if (method === 'GET' && url.pathname === '/api/open-vsx/search') {
    return { status: 200, body: await service.search(url.searchParams.get('q') ?? '') }
  }

  if (method === 'GET' && url.pathname === '/api/open-vsx/import') {
    const appearance = url.searchParams.get('appearance')
    if (appearance !== 'light' && appearance !== 'dark') {
      return { status: 400, body: { status: 'error', message: 'Invalid theme appearance.' } }
    }
    return {
      status: 200,
      body: await service.importTheme(url.searchParams.get('id') ?? '', appearance),
    }
  }

  return { status: 404, body: { status: 'error', message: 'Not found.' } }
}
