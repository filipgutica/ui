import builtInProjects from './projects.json'

/**
 * The ids in the built-in list, `projects.json`. A JSON import has no literal types, so this
 * union is written out; tests/site-header.test.ts fails when the two differ.
 */
export type SiteProjectId =
  | 'annoterm'
  | 'wtree'
  | 'devps'
  | 'pluginbench'
  | 'workbench'
  | 'filip-stack'
  | 'ui'
  | 'design-system'

export interface SiteProject {
  readonly id: SiteProjectId
  readonly label: string
  readonly href: string
  readonly repository: string
}

/** An entry in the published list, whose id may be one this package does not know yet. */
export type ListedSiteProject = Omit<SiteProject, 'id'> & { readonly id: string }

/**
 * Every site in the family, in the order the project menu lists them. This is the copy built
 * into the package. `UiSiteHeader` replaces it with the published list once mounted.
 * The assertion narrows the JSON's string ids to `SiteProjectId`; the test keeps them equal.
 */
export const SITE_PROJECTS = builtInProjects as readonly SiteProject[]

/** Where ui's docs site publishes `src/site/projects.json`. */
export const SITE_PROJECTS_URL = 'https://filipgutica.github.io/ui/projects.json'

const MAX_PROJECTS = 20
const TIMEOUT_MS = 3000

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== ''

const isHttpsUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    // Not a URL, so the entry is dropped.
    return false
  }
}

const toProject = (value: unknown): ListedSiteProject | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  const { id, label, href, repository } = value as Record<string, unknown>
  if (!isText(id) || !isText(label) || !isHttpsUrl(href) || !isHttpsUrl(repository)) return undefined
  return { id, label, href, repository }
}

/** Keeps the valid entries with unique ids, up to the cap. Undefined when none remain. */
const parseProjects = (value: unknown): readonly ListedSiteProject[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const ids = new Set<string>()
  const projects: ListedSiteProject[] = []
  for (const entry of value) {
    const project = toProject(entry)
    if (!project || ids.has(project.id)) continue
    ids.add(project.id)
    projects.push(project)
    if (projects.length === MAX_PROJECTS) break
  }
  return projects.length > 0 ? projects : undefined
}

const fetchProjects = async (url: string): Promise<readonly ListedSiteProject[] | undefined> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // A plain GET with no credentials, so GitHub Pages' `Access-Control-Allow-Origin: *` covers it.
    const response = await fetch(url, { signal: controller.signal })
    // Only a full 200 response is the list; a redirect has already been followed by fetch.
    return response.status === 200 ? parseProjects(await response.json()) : undefined
  } catch {
    // Offline, blocked, timed out, or not JSON. The built-in list keeps serving the menu.
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

// One request per URL for the whole page, shared by every header that reads it.
const requests = new Map<string, Promise<readonly ListedSiteProject[] | undefined>>()

/** Loads the published list once per page. Resolves to undefined when the built-in list should stay. */
export const loadSiteProjects = (url: string): Promise<readonly ListedSiteProject[] | undefined> => {
  let request = requests.get(url)
  if (!request) {
    request = fetchProjects(url)
    requests.set(url, request)
  }
  return request
}
