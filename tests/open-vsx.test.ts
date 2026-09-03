import { createHash } from 'node:crypto'

import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'

import { createOpenVsxThemeService } from '../src/open-vsx/index.js'

const extensionId = 'catppuccin.catppuccin-vsc'

const response = (body: string | Uint8Array, init: ResponseInit = {}): Response =>
  new Response(typeof body === 'string' ? body : new Uint8Array(body).buffer, {
    status: 200,
    ...init,
  })

const responseFromUrl = (url: string, body: string): Response => {
  const result = response(body)
  Object.defineProperty(result, 'url', { value: url })
  return result
}

const packageFixture = async ({
  rootDecoy = false,
  unsafeEntry = false,
}: {
  rootDecoy?: boolean
  unsafeEntry?: boolean
} = {}): Promise<Uint8Array> => {
  const zip = new JSZip()
  zip.file('extension/package.json', JSON.stringify({
    publisher: 'catppuccin',
    name: 'catppuccin-vsc',
    version: '1.0.0',
    contributes: {
      themes: [
        { label: 'Latte', uiTheme: 'vs', path: './themes/latte.json' },
        { label: 'Mocha', uiTheme: 'vs-dark', path: './themes/mocha.json' },
      ],
    },
  }))
  zip.file('extension/themes/base.json', JSON.stringify({
    colors: { 'editor.foreground': '#CDD6F4' },
  }))
  zip.file('extension/themes/latte.json', JSON.stringify({
    colors: { 'editor.background': '#EFF1F5', 'editor.foreground': '#4C4F69' },
  }))
  zip.file('extension/themes/mocha.json', JSON.stringify({
    include: './base.json',
    colors: { 'editor.background': '#1E1E2E' },
  }))
  if (rootDecoy) zip.file('package.json', 'x'.repeat(1024 * 1024 + 1))
  if (unsafeEntry) zip.file('../escape.txt', 'unsafe')
  return zip.generateAsync({ type: 'uint8array' })
}

const registryFetch = async ({ packageBytes }: { packageBytes: Uint8Array }) => {
  const checksum = createHash('sha256').update(packageBytes).digest('hex')
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input)
    if (url.includes('/api/-/search')) {
      return response(JSON.stringify({
        extensions: [{
          namespace: 'catppuccin',
          name: 'catppuccin-vsc',
          displayName: 'Catppuccin for VSCode',
          description: 'Soothing pastel theme',
          downloadCount: 12345,
        }],
      }))
    }
    if (url.endsWith(`/api/${extensionId.replace('.', '/')}`)) {
      return response(JSON.stringify({
        namespace: 'catppuccin',
        name: 'catppuccin-vsc',
        displayName: 'Catppuccin for VSCode',
        version: '1.0.0',
        files: {
          manifest: 'https://open-vsx.org/api/catppuccin/catppuccin-vsc/1.0.0/file/package.json',
          download: 'https://open-vsx.org/api/catppuccin/catppuccin-vsc/1.0.0/file/theme.vsix',
          sha256: 'https://open-vsx.org/api/catppuccin/catppuccin-vsc/1.0.0/file/theme.sha256',
        },
      }))
    }
    if (url.endsWith('package.json')) {
      return response(JSON.stringify({ contributes: { themes: [{ path: './themes/mocha.json' }] } }))
    }
    if (url.endsWith('theme.vsix')) return response(packageBytes)
    if (url.endsWith('theme.sha256')) return response(checksum)
    return response('not found', { status: 404 })
  })
}

describe('Open VSX theme service', () => {
  it('searches only the theme category and returns normalized summaries', async () => {
    const packageBytes = await packageFixture()
    const fetchImpl = await registryFetch({ packageBytes })
    const service = createOpenVsxThemeService({ fetchImpl })

    const result = await service.search(' catppuccin ')

    expect(result).toEqual({
      status: 'success',
      themes: [{
        id: extensionId,
        name: 'Catppuccin for VSCode',
        publisher: 'catppuccin',
        description: 'Soothing pastel theme',
        downloadCount: 12345,
      }],
    })
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('category=Themes')
  })

  it('filters extensions that do not contribute color themes from search results', async () => {
    const packageBytes = await packageFixture()
    const baseFetch = await registryFetch({ packageBytes })
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes('/api/-/search')) {
        return response(JSON.stringify({
          extensions: [
            {
              namespace: 'catppuccin',
              name: 'catppuccin-vsc',
              displayName: 'Catppuccin for VSCode',
              description: 'Soothing pastel theme',
              downloadCount: 12345,
            },
            {
              namespace: 'catppuccin',
              name: 'catppuccin-icons',
              displayName: 'Catppuccin Icons for VSCode',
              description: 'An icon theme',
              downloadCount: 9000,
            },
          ],
        }))
      }
      if (url.endsWith('/api/catppuccin/catppuccin-icons')) {
        return response(JSON.stringify({
          namespace: 'catppuccin',
          name: 'catppuccin-icons',
          version: '1.0.0',
          files: {
            manifest: 'https://open-vsx.org/api/catppuccin/catppuccin-icons/1.0.0/file/package.json',
            download: 'https://open-vsx.org/api/catppuccin/catppuccin-icons/1.0.0/file/icons.vsix',
            sha256: 'https://open-vsx.org/api/catppuccin/catppuccin-icons/1.0.0/file/icons.sha256',
          },
        }))
      }
      if (url.includes('/catppuccin-icons/') && url.endsWith('package.json')) {
        return response(JSON.stringify({ contributes: { iconThemes: [{ id: 'catppuccin-icons' }] } }))
      }
      return baseFetch(input)
    })
    const service = createOpenVsxThemeService({ fetchImpl })

    const result = await service.search('catppuccin')

    expect(result).toMatchObject({
      status: 'success',
      themes: [{ id: extensionId }],
    })
  })

  it('verifies and imports the package variant matching the requested appearance', async () => {
    const packageBytes = await packageFixture()
    const service = createOpenVsxThemeService({
      fetchImpl: await registryFetch({ packageBytes }),
    })

    const result = await service.importTheme(extensionId, 'dark')

    if (result.status === 'error') throw new Error(`${result.error.code}: ${result.error.message}`)
    if (result.status === 'cancelled') throw new Error('Open VSX import was unexpectedly cancelled')
    expect(result.theme.name).toBe('Mocha')
    expect(result.theme.appearance).toBe('dark')
    expect(result.theme.tokens.pageBackground).toBe('#1E1E2E')
    expect(result.theme.tokens.textPrimary).toBe('#CDD6F4')
  })

  it('accepts extension files served by the Open VSX resource host', async () => {
    const packageBytes = await packageFixture()
    const baseFetch = await registryFetch({ packageBytes })
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const result = await baseFetch(input)
      if (String(input).includes('/file/')) {
        Object.defineProperty(result, 'url', {
          value: `https://openvsx.eclipsecontent.org/catppuccin/catppuccin-vsc/${String(input).split('/').at(-1)}`,
        })
      }
      return result
    })
    const service = createOpenVsxThemeService({ fetchImpl })

    const result = await service.importTheme(extensionId, 'dark')

    expect(result).toMatchObject({ status: 'success', theme: { name: 'Mocha' } })
  })

  it('rejects a package whose checksum does not match', async () => {
    const packageBytes = await packageFixture()
    const fetchImpl = await registryFetch({ packageBytes })
    fetchImpl.mockImplementation(async (input: string | URL | Request) => {
      if (String(input).endsWith('theme.sha256')) return response('0'.repeat(64))
      const replacement = await registryFetch({ packageBytes })
      return replacement(input)
    })
    const service = createOpenVsxThemeService({ fetchImpl })

    const result = await service.importTheme(extensionId, 'dark')

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'integrity-failed' },
    })
  })

  it('rejects unsafe extension identifiers without making a request', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    const service = createOpenVsxThemeService({ fetchImpl })

    const result = await service.importTheme('../private', 'light')

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'unsupported-extension' },
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects packages containing paths outside the extension directory', async () => {
    const packageBytes = await packageFixture({ unsafeEntry: true })
    const service = createOpenVsxThemeService({
      fetchImpl: await registryFetch({ packageBytes }),
    })

    const result = await service.importTheme(extensionId, 'dark')

    expect(result).toMatchObject({
      status: 'error',
      error: { code: 'unsupported-extension', message: 'A theme path escapes its package.' },
    })
  })

  it('does not let root entries shadow files inside the extension directory', async () => {
    const packageBytes = await packageFixture({ rootDecoy: true })
    const service = createOpenVsxThemeService({
      fetchImpl: await registryFetch({ packageBytes }),
    })

    const result = await service.importTheme(extensionId, 'dark')

    expect(result).toMatchObject({ status: 'success', theme: { name: 'Mocha' } })
  })

  it('reports registry failures without exposing transport details', async () => {
    const service = createOpenVsxThemeService({
      fetchImpl: vi.fn(async () => { throw new Error('socket path and credentials') }),
    })

    await expect(service.search('nord')).resolves.toEqual({
      status: 'error',
      message: 'Open VSX search is unavailable right now.',
    })
    await expect(service.importTheme(extensionId, 'light')).resolves.toEqual({
      status: 'error',
      error: {
        code: 'open-vsx-unavailable',
        message: 'Open VSX theme details are unavailable right now.',
      },
    })
  })

  it('rejects responses redirected away from Open VSX', async () => {
    const service = createOpenVsxThemeService({
      fetchImpl: vi.fn(async () => responseFromUrl(
        'https://example.invalid/redirected-search',
        JSON.stringify({ extensions: [] }),
      )),
    })

    await expect(service.search('nord')).resolves.toEqual({
      status: 'error',
      message: 'Open VSX search is unavailable right now.',
    })
  })
})
