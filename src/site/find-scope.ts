/**
 * A page that also filters its own content with the section rail's Find, such as a table of
 * tokens, sets `window.findScope` before the reader types. Find then calls `filter` on every
 * change, shows the rail links that `keeps` names, and announces the page's count and noun
 * ("3 tokens", "No tokens") instead of its own.
 */
export interface UiSiteFindScope {
  /** Filters the page's content by the query's lowercase words, which are empty when it clears. */
  filter: (words: readonly string[]) => { count: number; one: string; many: string }
  /** Whether a rail link stays. It gets the link's resolved URL, so `link.hash` names its section. */
  keeps: (link: URL) => boolean
}

declare global {
  interface Window {
    findScope?: UiSiteFindScope
  }
}
