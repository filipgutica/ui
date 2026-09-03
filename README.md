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

The first application-focused set includes:

- `UiButton` with primary, secondary, ghost, danger, and text variants
- `UiInput`, `UiSelect`, and `UiField` for consistent form controls
- `UiCheckbox`, `UiBadge`, `UiAlert`, and `UiProgress` for state and feedback
- `UiSurface` for restrained content grouping
- `UiDialog`, built on Reka UI, for accessible modal interaction

Place `UiInput` or `UiSelect` inside `UiField`. The field supplies the control ID
and automatically connects its description or error through the corresponding
ARIA relationship.

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

## Docs and sandbox

Start the component docs and sandbox:

```sh
pnpm docs:dev
```

Build the provider-neutral static assets:

```sh
pnpm docs:build
```

The docs use hash routes, so the static assets do not require rewrite rules.
The local Vite server also provides the same-origin `/api/open-vsx` endpoint.
The theme picker uses this endpoint to search and import Open VSX themes.

A production host must provide the same API endpoint for live Open VSX imports.
Netlify and Amplify can use a serverless adapter. GitHub Pages needs an external
API or a catalog of normalized themes built in advance.

## Development

```sh
pnpm install
pnpm verify
```

Commits follow the Conventional Commits format. Releases run from `main`:

- `fix:` publishes a patch release
- `feat:` publishes a minor release
- `BREAKING CHANGE:` or `[BREAKING CHANGE]` anywhere in a commit body publishes
  a major release
- the same markers anywhere in an associated merged PR body publish a major
  release

The `release.yml` workflow publishes through npm trusted publishing with GitHub
OIDC. Configure the npm package's trusted publisher once with user
`filipgutica`, repository `ui`, and workflow filename `release.yml`; no npm token
is stored in GitHub.
