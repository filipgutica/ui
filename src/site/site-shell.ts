import { getCurrentInstance, shallowRef } from 'vue'

import type { App, ShallowRef } from 'vue'

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

const shells = new WeakMap<App, ShallowRef<SiteHeaderShell | undefined>>()

/**
 * The site header mounted in the calling component's app. The header and the section rail are
 * siblings in the page's template, so they meet here instead of through props. Each app has its
 * own, so two apps on one page keep their own headers, and each server render gets a new app.
 * Only mounted headers set it. Call it from setup.
 */
export const useSiteHeaderShell = (): ShallowRef<SiteHeaderShell | undefined> => {
  const app = getCurrentInstance()?.appContext.app
  if (!app) return shallowRef()
  let shell = shells.get(app)
  if (!shell) {
    shell = shallowRef()
    shells.set(app, shell)
  }
  return shell
}
