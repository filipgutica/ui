import { shallowRef } from 'vue'

import type { useSiteAppearance } from './appearance.js'
import type { UiSiteLink } from './UiSiteHeader.vue'

/** What a mounted site header lends the section rail's phone Menu drawer. */
export interface SiteHeaderShell {
  /** The header row's slot for the rail's phone Find and Menu buttons. */
  bar: HTMLElement
  /** The header's page links, which the drawer repeats under "Pages". */
  readonly links: readonly UiSiteLink[]
  /** The header's own appearance picker state; undefined when the page passes its own control. */
  appearance: ReturnType<typeof useSiteAppearance> | undefined
}

/**
 * The site header on the page, set while it is mounted. The header and the section rail are
 * siblings in the page's template, so they meet here instead of through props. Only mounted
 * components set it, so server rendering never shares it between requests.
 */
export const siteHeaderShell = shallowRef<SiteHeaderShell>()
