# @filipgutica/ui

Compact Vue 3.5+ components built on [Reka UI](https://reka-ui.com), with
Tailwind CSS 4 and VS Code theme support.

[Docs and playground](https://filipgutica.github.io/ui/) ·
[GitHub](https://github.com/filipgutica/ui) ·
[npm](https://www.npmjs.com/package/@filipgutica/ui)

## Install

```sh
pnpm add @filipgutica/ui
```

Import the styles from your application stylesheet:

```css
@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";
```

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
cover examples, props, slots, and events. Place inputs and selects inside
`UiField` to connect labels, descriptions, and errors automatically.

## Page navigation

`UiDrawer` provides modal focus containment, Escape dismissal, and trigger focus
restoration. Keep native navigation in the server-rendered page until hydration;
the application decides when to replace it and when to close the drawer at a
desktop breakpoint. To focus a link destination after closing, prevent the
cancelable `closeAutoFocus` event and focus that heading.

`UiTabs` renders every labelled panel during SSR and initial hydration. After
mounting, it adds keyboard-accessible tabs and hides inactive panels without
unmounting them. Use unique item values and keep page anchor headings outside
the panels. Re-align an initial hash after layout settles if enhancement changes
the page height.

Track page sections from a component's setup function:

```ts
import { useActiveSection } from '@filipgutica/ui'

const activeSection = useActiveSection({
  targetIds: ['overview', 'install', 'commands'],
})
```

The returned readonly ref contains the last supplied heading above the root's
CSS `scroll-padding-top` inset, or the final section at the document bottom.
IDs must remain stable and in page order; missing elements are ignored after
mounting. Bind matching links to `aria-current="location"`. Scrolling, resizing,
layout changes, completed transitions, and restored pages update the value.
The composable does not change focus, the URL, or browser history, and removes
its listeners and observer when the component unmounts. During SSR it returns
the first supplied ID without accessing browser globals.

## Themes

Import a VS Code JSON or JSONC theme in the browser:

```ts
import { applySemanticTheme, parseVsCodeTheme } from '@filipgutica/ui/theme'

const theme = parseVsCodeTheme({ source, fileName })
applySemanticTheme({ root: document.documentElement, theme })
```

Themes supply colors; the library keeps typography, spacing, and component
structure consistent. Open VSX search and imports are available through
`createOpenVsxThemeService` from `@filipgutica/ui/open-vsx`. It runs on Node
or in a browser with HTTPS and Web Crypto. Browser requests depend on the
registry and its resource host allowing cross-origin access.

The gallery's search-and-install dialog is docs-only, not an exported component.
Applications can build their own picker with the exported components and theme
helpers. `UiSiteHeader` includes the built-in System, Light, and Dark control.

The default theme is unchanged. To opt in to Graphite Indigo, import it after
`theme.css`:

```css
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/themes/graphite-indigo.css";
```

## Project sites

The `site` entry gives the project sites one header, one appearance choice, and
shared page styles. Import `@filipgutica/ui/site.css` and the Graphite Indigo
theme above, which supplies the type and spacing roles `site.css` reads. Keep
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

`project` is `wtree`, `annoterm`, `devps`, `workbench`, `filip-stack`, or `ui`. The project
menu is a native disclosure that works without JavaScript; Escape closes it and
returns focus to its button. Without a default slot the header renders a
System, Light, and Dark picker. A page with its own appearance control passes it
in the default slot and uses `useSiteAppearance({ applyToRoot: false })` when it
owns the root element.

`useSiteAppearance()` returns `choice`, the resolved `appearance`, and
`chooseAppearance(value)`. The choice is stored under `tool-site-theme`, follows
the operating system and other tabs, and is safe during server rendering and
when storage is blocked. To avoid a flash of the wrong appearance, inline
`siteThemeBootScript` in the document head.

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
`aria-current="location"`, a text-only marker. An item with `current: true` gets
`aria-current="page"`, the selected fill and accent bar; `code: true` shows the
label in the monospace font. The page grid places the rail, which stays in view
on desktop. At 800px and below it is a native Menu disclosure until the page is
interactive, then a drawer. The drawer closes on navigation and focuses the
destination section, and focus follows the visible control across the
breakpoint.

`UiCapture` shows one panel: tabs in the header, the capture scaled to the panel
width, and the `command` and `caption` slot below. `html` is trusted, checked-in
terminal markup with a single root element. The Full size button at the end of
the tab row, or a click on the capture, opens it at full size in a dialog, and
focus returns to the button on close. Phones show the button as an icon. `v-model`
holds the active ID and defaults to the first item. Each capture has the ID
`idPrefix` + `id` (`frame-` by default), so a deep link such as `#frame-read`
selects its tab on load and on hash change. Without JavaScript every capture is
listed under its own heading and scrolls at full size. The site owns terminal
colors: set `--site-capture-bg` on `:root`, because the dialog renders outside
the panel.

`UiCommandList` renders a table of monospace commands and descriptions. Use the
`command` slot to show a key as `<kbd>`, the `description` slot for `<kbd>` or
`<code>`, and `commandHeader` and `descriptionHeader` to rename the columns. Each row gets a copy button named
"Copy <command>" once the page is interactive; set `copyable` to `false` to
remove them. A status message announces each copy and shows a fallback when
the clipboard is unavailable. At 640px and below each command stacks above its
description and wraps.

`site.css` also includes page helpers: `.fg-site-steps` for an ordered list with
numbered circles, `.fg-site-facts` for an inline `dl` of short label and value
pairs, `.fg-site-definitions` for a two-column `dl` of `dt` and `dd` that stacks
on phones, `.fg-site-sr-only` for visually hidden text, and `.fg-site-skip` for
a skip link that appears on focus.

## Development

```sh
pnpm install
pnpm docs:dev
pnpm verify
```

Graphite Indigo values live in `themes/graphite-indigo.json`. After editing it,
run `pnpm themes:build` to regenerate the opt-in theme and the standalone
`themes/graphite-indigo.tokens.css`; `pnpm themes:check` fails when either is
stale.
