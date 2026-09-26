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
