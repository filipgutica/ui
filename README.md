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
`@filipgutica/ui/open-vsx`, which must run on a Node server.

## Development

```sh
pnpm install
pnpm docs:dev
pnpm verify
```
