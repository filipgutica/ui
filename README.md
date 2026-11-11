# @filipgutica/ui

@filipgutica/ui is a compact Vue 3.5+ component library built on
[Reka UI](https://reka-ui.com) and styled with Tailwind CSS 4. You can recolor
it with a VS Code color theme: the theme supplies the colors, and the library
keeps typography, spacing, and component structure the same.

Use it when you want dense, calm controls: neutral surfaces with one accent
color, compact sizes on a 4px rhythm, and visible keyboard focus. It also
provides the shared header, navigation, and page components of Filip's project
sites.

[Docs and playground](https://filipgutica.github.io/ui/) ·
[GitHub](https://github.com/filipgutica/ui) ·
[npm](https://www.npmjs.com/package/@filipgutica/ui)

## Install

You need a Vue 3.5+ app whose stylesheet Tailwind CSS 4 already builds. This
package does not install Tailwind.

```sh
pnpm add @filipgutica/ui
```

Import the styles from your application stylesheet:

```css
@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/themes/graphite-indigo.css";
@import "@filipgutica/ui/components.css";
```

The third import adds Graphite Indigo's site typography and layout roles. Both
the base theme and Graphite Indigo use neutral surfaces, project-hue primary buttons,
and the ui project hue for checked and selected states.

`theme.css` loads the package's own IBM Plex Sans and IBM Plex Mono latin woff2
files (400, 500, 600), with `font-display: swap` and system fallbacks. It makes
no remote font requests. The files come from Fontsource 5.3.0 and ship under
their included [Sans OFL](src/fonts/OFL-IBM-Plex-Sans.txt) and
[Mono OFL](src/fonts/OFL-IBM-Plex-Mono.txt) licences. `fonts.css` and `fonts/*`
are also exported for applications that import assets separately.

## Use

```vue
<script setup lang="ts">
import { UiButton } from '@filipgutica/ui'
</script>

<template>
  <UiButton variant="secondary" size="sm">
    Save changes
  </UiButton>
</template>
```

The [component docs](https://filipgutica.github.io/ui/#/components/button)
show an example, a sandbox, and the props, slots, and events of the components
in `@filipgutica/ui`. Read the
[Drawer](https://filipgutica.github.io/ui/#/components/drawer) and
[Tabs](https://filipgutica.github.io/ui/#/components/tabs) pages before you use
them for page navigation: they explain how each one behaves before and after
hydration.

## Themes

Import a VS Code JSON or JSONC theme in the browser:

```ts
import { applySemanticTheme, parseVsCodeTheme } from '@filipgutica/ui/theme'

const theme = parseVsCodeTheme({ source, fileName })
applySemanticTheme({ root: document.documentElement, theme })
```

The theme must define a background color and a foreground color, such as
`editor.background` and `editor.foreground`.

To let people search for and import themes from Open VSX, use
`createOpenVsxThemeService` from `@filipgutica/ui/open-vsx`. It runs on Node or
in a browser with HTTPS and Web Crypto. In a browser, it works only when the
registry and its resource host allow cross-origin requests.

The theme search-and-install dialog on the docs site is not exported. Build
your own picker from the exported components and theme helpers.

## Track the current section

`useActiveSection` tells you which section of a long page the reader is on,
so you can mark its link. Call it from a component's setup function:

```ts
import { useActiveSection } from '@filipgutica/ui'

const activeSection = useActiveSection({
  targetIds: ['overview', 'install', 'commands'],
})
```

Bind `aria-current="location"` to the link whose section matches the value.

- The returned readonly ref holds the last supplied heading above the root's
  CSS `scroll-padding-top` inset. At the bottom of the document, it holds the
  final section.
- Keep the IDs stable and in page order. IDs with no element on the page are
  ignored after mounting.
- Scrolling, resizing, layout changes, completed transitions, and restored
  pages update the value.
- After a jump to a section, through a `#id` link, a hash change, or a deep
  link, that section stays current until the reader scrolls away from where the
  jump lands. So a page too short to bring the section to the top still marks
  it.
- It does not change focus, the URL, or browser history. It removes its
  listeners and observer when the component unmounts.
- During SSR it returns the first supplied ID without accessing browser
  globals.

## Project sites

The `site` entry gives the project sites one header, one appearance choice, and
shared page styles. Import `@filipgutica/ui/components.css`,
`@filipgutica/ui/site.css`, and the Graphite Indigo theme above, which supplies
the type and spacing roles `site.css` reads. Keep
document-wide link styles in `@layer base` so the header owns its navigation
appearance.

```vue
<script setup lang="ts">
import { UiSiteHeader } from '@filipgutica/ui/site'
</script>

<template>
  <UiSiteHeader
    project="wtree"
    :links="[{ label: 'User guide', href: '#guide' }]"
  />
</template>
```

`project` is the site's id in [`src/site/projects.json`](src/site/projects.json),
such as `wtree`, `devps`, or `ui`. The project menu is a native disclosure that
works without JavaScript; Escape closes it and returns focus to its button.
`links` are a navigation strip: rows 44px tall with 6px corners. A link with `current: true` gets `aria-current="page"` and the
current-page fill. At 640px and below, three or more links take a second row below
the project menu and the picker. One or two links stay beside the project name as
text links, and a current one has accent text instead of the fill. Two short links
keep the header to one row down to 360px. At 320px and narrower, or with longer
links, the picker wraps to a second row. Inside `.fg-site-docs`, at 640px and below, the
header hides `links` so it fits one row, so repeat those destinations in the footer.
A `UiSiteNav` with `headerMenu` moves them into its Menu drawer instead. Without a
default slot the header renders a System, Light, and Dark picker, built on
`UiSegmentedControl`. A page with its own appearance control passes it in the
default slot and uses `useSiteAppearance({ applyToRoot: false })` when it owns
the root element.

`useSiteAppearance()` returns `choice`, the resolved `appearance`, and
`chooseAppearance(value)`. The choice is stored under `tool-site-theme`, follows
the operating system and other tabs, and is safe during server rendering and
when storage is blocked. To avoid a flash of the wrong appearance, inline
`siteThemeBootScript` in the document head.

#### The project list

The project menu lists every site from one file,
[`src/site/projects.json`](src/site/projects.json). The docs deploy publishes it
at `https://filipgutica.github.io/ui/projects.json`.

- The server render and first paint use the copy built into the package, so a
  page without JavaScript still has the full menu.
- After mount the header loads the published file once per page, with a
  3-second timeout. Every header on the page shares that request.
- The header keeps only entries whose `id`, `label`, `href`, and `repository` are
  non-empty strings, whose links are `https:` URLs, and whose `id` is unique, up
  to 20 entries.
- If the request fails or no entry is valid, the built-in list stays.
- If the published list leaves out the current `project`, the menu still shows
  it, in the place the built-in list gives it.

To turn the request off and keep the built-in list, pass `:projects-url="null"`.
To load a different file, pass its URL.

```vue
<UiSiteHeader project="wtree" :projects-url="null" />
```

### Page components

The `site` entry also gives the project pages their section navigation,
terminal captures, and command tables. They use the styles from
`components.css` and `site.css`, and work without JavaScript.

```vue
<script setup lang="ts">
import { UiCapture, UiCommandList, UiSiteNav } from '@filipgutica/ui/site'
import read from './captures/read.html?raw'
</script>

<template>
  <UiSiteNav
    label="On this page"
    :groups="[{ items: [{ label: 'Install', href: '#install' }, { label: 'Commands', href: '#commands' }] }]"
  />
  <UiCapture
    label="Steps"
    :items="[{ id: 'read', label: 'Read', command: 'annoterm notes.md', html: read }]"
  >
    <template #caption="{ item }">
      <p>What the {{ item.label }} capture shows.</p>
    </template>
  </UiCapture>
  <UiCommandList :items="[{ command: 'wtree ui', description: 'Browse worktrees.' }]" />
</template>
```

`UiSiteNav` renders a labelled list of route rows in optional `groups`. Links to
`#id` sections track the reader's position with `useActiveSection` and get
`aria-current="location"`. An item with `current: true` gets `aria-current="page"`.
Both show as a quiet filled row with a slight lift and accent text; `code: true` shows the
label in the monospace font. The page grid places the rail, which stays in view
on desktop. At 800px and below it is a native disclosure until the page is
interactive, then a drawer. The disclosure, the drawer button, and the drawer
title all show `label`. When an item has `current: true`, the phone control
also shows that page's name. Otherwise it shows the current section's name.
The control's accessible name is its visible text, so it changes with the
current page or section. The drawer closes on
navigation and focuses the destination section, and focus follows the visible control across the
breakpoint.

`find` adds a Find field above the rows, for long rails. It is off by default.
`find.label` names the field, such as `Find a component`, and `find.noun` names a
row in the empty state ("No component matches …"; the default is `section`).
Every word of the query must appear in a row's label, its group's label, or its
`terms`. Rows and empty groups hide as the reader types, and the match count is
announced after a pause. `/` focuses the field unless focus is in a text field,
and a "Single-key shortcuts" switch below the rows turns that off; the choice is
stored under `tool-site-shortcuts`. Escape clears the query, then leaves the
field; Enter goes to the first match, and ArrowDown focuses it. Without
JavaScript the field is not rendered. A page that also filters its own content
sets `window.findScope` (the `UiSiteFindScope` type) before the reader types:
`filter(words)` returns `{ count, one, many }` for the announcement, and
`keeps(link)` gets each row's resolved `URL` and says whether it stays.

`headerMenu` gives a page with `UiSiteHeader` the catalogue's phone header. At
800px and below the header is one sticky row: the project menu, then round,
icon-only Find (with `find`) and Menu buttons. Menu opens a drawer titled Menu
that holds Find, the header's links under Pages, its appearance picker, and the
rows. A keyboard open focuses the current row, a tap focuses the drawer, and
Find focuses the field. Focusing a header control does not scroll the page, and
in-page jumps land below the header. Without JavaScript the rows stay open in
place and the header keeps its links. When the header has a default slot, that
control stays in the header row. Without a `UiSiteHeader` the labelled trigger
stays.

Section headings in `.fg-site-docs` and `.fg-site-prose` use the terminal
identity's decorative `## ` mark, with `0.08em` tracking. Set `--heading-mark`
on a page or section to change it; `--heading-mark: none` removes it. The
default is `--heading-mark: "## "`. The mark is excluded from accessible text.
Navigation rows in the rail, the drawer, and the docs navigation are `--row`
(2.25rem) tall, and `--control-lg` at 800px and below.

Project sites set `--color-project` on `:root` and `:root.dark` for their hue.
Set `--color-project-dark` to the dark variant in both appearances, so prompts,
capture tab underlines, and focus rings stay readable on terminal plates. The default hue
belongs to ui. Primary buttons use `--color-accent` with `--color-accent-text` in both appearances.
Focus rings use `--color-focus`, the accent, at `--focus-width` with a `--focus-offset` gap.
A focused field draws no ring: its edge turns accent, and its fill does not change.
Command plates use `--color-command-bg` and `--color-command-border`, derived from the
project hue. Terminal captures keep the neutral `--color-terminal` palette.

Compact shell or plain-text `UiCodeBlock` rows and untitled shell blocks are
terminal commands. Their CSS prompt stays out of copied and accessible text.
Typed source samples, including compact samples, use theme-matched syntax panels
inset in the code block's frame. After a copy, Copy shows a tick for 1.5s.
Default blocks with a title are source samples, including shell scripts.

Use `.fg-site-hero` on a tool-home intro section. Its direct `h1` uses the
56px display size (34px on phones). Wrap the lede paragraphs in
`.fg-site-hero__lede`. Wrap the install block, metadata, and facts in
`.fg-site-hero__aside`; use `.fg-site-meta` for the install label above the code.

At 1024px and above, the hero uses `minmax(0, 1.1fr) minmax(0, 1fr)` columns,
`var(--space-8)` between columns, and top alignment. The `h1` spans both columns
in row 1. The lede and aside occupy columns 1 and 2 in row 2. All other children,
including captures and legends, span both columns afterward in source order.
Below 1024px all children stack in source order. Explicit grid lines and
`grid-auto-columns: minmax(0, 1fr)` preserve the split if an unlayered site rule
overrides the column template. Remove that override to retain the 1.1:1 ratio.
This is the wide exception to the phone/tablet breakpoints; the separate
design-language update records it in `DESIGN.md`.

`UiCapture` shows one panel: tabs in the header, the capture scaled to the panel
width, and the `command` and `caption` slot below. `html` is trusted, checked-in
terminal markup with a single root element. The Full size button at the end of
the tab row, or a click on the capture, opens it at full size in a dialog, and
focus returns to the button on close. Phones show the button as an icon. `v-model`
holds the active ID and defaults to the first item. Each capture has the ID
`idPrefix` + `id` (`frame-` by default), so a deep link such as `#frame-read`
selects its tab on load and on hash change. Without JavaScript every capture is
listed under its own heading and scrolls at full size. Captures use a dark
terminal palette for the `.term` root and the converter's ANSI classes (`.tf0`
to `.tf15`, `.tb0` to `.tb15`, `.tf-dim`, `.tbold`, and the others). To change
it, set `--site-capture-bg`, `--t-bg`, `--t-fg`, `--t-dim`, or `--t0` to `--t15`
on `:root`, because the dialog renders outside the panel.

`UiCommandList` renders a table of monospace commands and descriptions. Use the
`command` slot to show a key as `<kbd>`, the `description` slot for `<kbd>` or
`<code>`, and `commandHeader` and `descriptionHeader` to rename the columns. Each row gets a copy button named
"Copy <command>" once the page is interactive; set `copyable` to `false` to
remove them. A copied row shows a tick for 1.5s. A status message announces each
copy and shows a fallback when the clipboard is unavailable. At 640px and below
each command stacks above its description and wraps.

`site.css` also includes page helpers: `.fg-site-steps` for an ordered list with
numbered markers (each `li` holds an `h3` title and short paragraphs; mark the last
step's outcome with `.fg-site-steps__result`), `.fg-site-facts` for an inline `dl` of short label and value
pairs whose links get a `--control-lg` hit area at 640px and below,
`.fg-site-definitions` for a two-column `dl` of `dt` and `dd` that stacks on
phones and keeps `code` such as `--all` on one line, `.fg-site-sr-only` for
visually hidden text, and `.fg-site-skip` for a skip link that appears on focus.

### Docs shell

Add `fg-site-docs` to the element that wraps a project page's header, rail,
main content, and footer. The shell then supplies:

- the frame: the header across the top, the `--sidebar` rail beside `main`, and
  the footer on the frame edges. At 800px and below the rail stacks above `main`.
- element defaults inside the shell, plus the page background and font on
  `body`: box sizing, heading sizes and margins, paragraph measure, links,
  inline `code` at `--text-sm`, `kbd`, a 2px focus outline, and a `[hidden]`
  rule that outranks the page's own `display` rules.
- `.fg-site-footer` for the footer and `.fg-site-legend` for a `dl` that explains
  what a capture shows. Legend columns are at least `--site-legend-column` wide,
  `--sidebar` by default; set it on the legend to fit more entries in a row.

```vue
<template>
  <div class="fg-site-docs">
    <UiSiteHeader project="devps" />
    <UiSiteNav label="On this page" :groups="navigation" />
    <main id="main">
      <section aria-labelledby="title">…</section>
      <dl class="fg-site-legend">
        <div><dt>PORTS</dt><dd>The ports the server listens on.</dd></div>
      </dl>
    </main>
    <footer class="fg-site-footer">
      <a href="https://github.com/filipgutica">Built by Filip Gutica</a>
      <nav aria-label="Project links">
        <a href="https://github.com/filipgutica/devps/releases">Releases</a>
      </nav>
    </footer>
  </div>
</template>
```

The header, rail, `main`, and footer must be direct children of the shell. The
element defaults sit in the `base` cascade layer, so library components and the
site's own rules win. That holds only when the site declares the layer order
before importing `site.css`: `@import "tailwindcss"` does this, or start the
stylesheet with `@layer base, components, utilities;`. To adopt the shell, delete
the site's own frame, element base, `kbd`, footer, legend, and ANSI palette
rules. Without `fg-site-docs`, the frame, element defaults, and phone header
rules do not apply. These apply on every page: the `fg-site-footer` and
`fg-site-legend` classes wherever a page uses them; the capture terminal palette
for every `UiCapture`, in the `components` layer, so a site's own unlayered
`.term` and ANSI rules and its `--t*` values still win; and `UiSiteNav`, whose
phone toggle and drawer title now show its `label`.

## Development

```sh
pnpm install
pnpm docs:dev
pnpm verify
```

Graphite Indigo token values and the IBM Plex fonts live in
[`@filipgutica/design-system`](https://github.com/filipgutica/design-system).
`pnpm themes:build` copies them from the pinned package into `src/theme.css`,
`src/themes/graphite-indigo.css`, `src/fonts.css`, and `src/fonts/`. In
`src/theme.css` it rewrites only the values that the package's `tokens.css`
maps with a `ui:` comment. The other declarations belong to this library.
`pnpm themes:check` fails when any of these files differs from the package.

To update the values, bump the package and rebuild:

```sh
pnpm add -D -E @filipgutica/design-system@<version>
pnpm themes:build
```

### Change the project list

To add, rename, or remove a site in the project menu, edit
[`src/site/projects.json`](src/site/projects.json) and merge it with a
`chore(site): …` commit, for example `chore(site): add Example to the project list`.

- `chore` does not release to npm. `feat`, `fix`, `perf`, and breaking changes
  do.
- The Docs workflow runs on every push to `main` and publishes the file to
  `https://filipgutica.github.io/ui/projects.json`. GitHub Pages caches it for
  up to 10 minutes.
- Sites load the published file, so they need no pull request. The package's
  built-in copy catches up at the next release.
