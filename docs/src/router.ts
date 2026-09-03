export type DocsRoute =
  | { name: 'home' }
  | { name: 'component', slug: string }
  | { name: 'sandbox', slug: string }
  | { name: 'not-found' }

export const parseDocsHash = (hash: string): DocsRoute => {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }

  const componentMatch = /^\/components\/([a-z-]+)$/.exec(path)
  if (componentMatch?.[1]) return { name: 'component', slug: componentMatch[1] }

  const sandboxMatch = /^\/sandbox\/([a-z-]+)$/.exec(path)
  if (sandboxMatch?.[1]) return { name: 'sandbox', slug: sandboxMatch[1] }

  return { name: 'not-found' }
}
