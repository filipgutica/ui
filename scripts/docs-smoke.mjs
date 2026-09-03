const origin = process.argv.slice(2).find(argument => argument !== '--')
  ?? 'http://127.0.0.1:5173'

const readJson = async (path) => {
  const response = await fetch(new URL(path, origin))
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`)
  return response.json()
}

const search = await readJson('/api/open-vsx/search?q=Catppuccin')
if (search.status !== 'success' || !Array.isArray(search.themes) || search.themes.length === 0) {
  throw new Error('Open VSX search returned no themes')
}

let imported
const failures = []
for (const theme of search.themes.slice(0, 5)) {
  const result = await readJson(`/api/open-vsx/import?id=${encodeURIComponent(theme.id)}&appearance=dark`)
  if (result.status === 'success') {
    imported = result.theme
    break
  }
  failures.push(`${theme.id}: ${result.error?.message ?? result.message ?? 'unknown error'}`)
}

if (
  !imported
  || typeof imported.name !== 'string'
  || typeof imported.tokens?.pageBackground !== 'string'
) {
  throw new Error(`Open VSX did not return an importable normalized theme. ${failures.join(' | ')}`)
}

console.log(`Open VSX docs smoke passed with ${search.themes.length} results and theme "${imported.name}".`)
