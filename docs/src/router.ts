export type DocsRoute =
  | { name: 'home' }
  | { name: 'component', slug: string }
  | { name: 'sandbox', slug: string }
  | { name: 'not-found' }

const normalizeComponentSlug = (slug: string): string => slug === 'surface' ? 'card' : slug

export const parseDocsHash = (hash: string): DocsRoute => {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }

  const componentMatch = /^\/components\/([a-z-]+)$/.exec(path)
  if (componentMatch?.[1]) return { name: 'component', slug: normalizeComponentSlug(componentMatch[1]) }

  const sandboxMatch = /^\/sandbox\/([a-z-]+)$/.exec(path)
  if (sandboxMatch?.[1]) return { name: 'sandbox', slug: normalizeComponentSlug(sandboxMatch[1]) }

  return { name: 'not-found' }
}
