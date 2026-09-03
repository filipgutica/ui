# @filipgutica/ui

A compact Vue 3 design system built on [Reka UI](https://reka-ui.com), with
Tailwind CSS 4 tokens and safe VS Code/Open VSX color-theme normalization.

## Install

```sh
pnpm add @filipgutica/ui
```

Import Tailwind and the shared theme files from your application stylesheet:

```css
@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";
```

The theme exposes Tailwind utilities such as `bg-ui-bg`, `bg-ui-surface`,
`text-ui-text`, `text-ui-muted`, `border-ui-border`, and `text-ui-error`.

## Vue components

```vue
<template>
  <UiButton variant="secondary" size="compact">
    Inspect evidence
  </UiButton>
</template>

<script setup lang="ts">
import { UiButton } from '@filipgutica/ui'
</script>
```

## VS Code themes

The browser-safe theme entry point parses VS Code JSON/JSONC and maps supported
workbench colors into the package's finite semantic token contract:

```ts
import { applySemanticTheme, parseVsCodeTheme } from '@filipgutica/ui/theme'

const theme = parseVsCodeTheme({ source, fileName })
applySemanticTheme({ root: document.documentElement, theme })
```

The Node-only Open VSX entry point searches and imports theme extensions without
executing extension code:

```ts
import { createOpenVsxThemeService } from '@filipgutica/ui/open-vsx'

const themes = await createOpenVsxThemeService().search('Catppuccin')
```

Open VSX packages are untrusted input. The importer restricts origins, validates
identifiers and archive paths, caps downloaded and expanded sizes, checks the
advertised SHA-256 checksum, and retains only normalized colors. Consumers that
redistribute theme assets remain responsible for their licenses.

## Boundaries

- Open VSX themes control color and light/dark/high-contrast appearance only.
- Typography, spacing, radius, motion, and component structure remain owned by
  this package so applications keep a consistent design language.
- `@filipgutica/ui/open-vsx` is Node-only. Do not import it into browser bundles.

## Development

```sh
pnpm install
pnpm verify
```
