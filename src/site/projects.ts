const projects = [
  { id: 'annoterm', label: 'annoterm', href: 'https://filipgutica.github.io/annoterm/', repository: 'https://github.com/filipgutica/annoterm' },
  { id: 'wtree', label: 'wtree', href: 'https://filipgutica.github.io/wtree/', repository: 'https://github.com/filipgutica/wtree' },
  { id: 'devps', label: 'devps', href: 'https://filipgutica.github.io/devps/', repository: 'https://github.com/filipgutica/devps' },
  { id: 'workbench', label: 'Workbench', href: 'https://filipgutica.github.io/t3code/', repository: 'https://github.com/filipgutica/t3code' },
  { id: 'ui', label: 'UI', href: 'https://filipgutica.github.io/ui/', repository: 'https://github.com/filipgutica/ui' },
] as const

export type SiteProjectId = (typeof projects)[number]['id']

export interface SiteProject {
  readonly id: SiteProjectId
  readonly label: string
  readonly href: string
  readonly repository: string
}

/** Every site in the family, in the order the project menu lists them. */
export const SITE_PROJECTS: readonly SiteProject[] = projects
