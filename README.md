# @filipgutica/ui

A compact Vue 3.5+ design system built on [Reka UI](https://reka-ui.com), with
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
- `UiCheckbox`, `UiSlider`, `UiRadioCard`, and `UiRadioCardGroup` for user input
- `UiBadge`, `UiAlert`, and `UiProgress` for state and feedback
- `UiCard` for structured content, actions, and footer metadata
- `UiCodeBlock` for copyable, theme-aware source snippets
- `UiDialog`, built on Reka UI, for accessible modal interaction

Place `UiInput` or `UiSelect` inside `UiField`. The field supplies the control ID
and automatically connects its description or error through the corresponding
ARIA relationship.

```vue
<template>
  <UiButton variant="secondary" size="sm">
    Inspect evidence
  </UiButton>
</template>

<script setup lang="ts">
import { UiButton } from '@filipgutica/ui'
</script>
```

`UiButton`, `UiInput`, `UiSelect`, `UiCheckbox`, and `UiSlider` share
`size="sm | md | lg"`
and default to the tighter `md` density. Existing `UiButton` values remain
compatible: `compact` retains its former compact treatment and `default` maps
to `lg`.

`UiCodeBlock` accepts source text through `code`, shows a copy action by default,
and highlights the selected language using the active theme. It can display a
title, line numbers, or wrapped lines; unknown languages stay readable as plain text:

```vue
<UiCodeBlock
  title="Example.vue"
  language="vue"
  :code="snippet"
  :line-numbers="true"
/>
```

Highlighting supports Vue, JavaScript (`js`), TypeScript (`ts`), HTML, CSS,
JSON, and Bash (`sh`/`shell`). Imported TextMate `tokenColors` are normalized
into a shared syntax palette; language-specific overrides and font styles are
not reproduced exactly. Themes saved before syntax support should be re-imported
to recover their syntax colors. Existing saved themes remain usable with themed fallbacks.

`UiSurface` remains exported for compatibility. New structured containers
should use `UiCard`.

## Design conventions

Use a compact, Geist-inspired hierarchy: 14px for UI body text, 13px for
secondary text, and 18px for dialog titles. Treat Open VSX/VS Code themes as
the color authority, and use semantic tokens and package components instead of
hard-coded provider color keys.
Typography is package-owned through `--font-ui` and `--font-mono`; override
these once at the application root rather than restyling each component.

- Use shared control sizes `sm`, `md`, and `lg` (32px, 36px, and 44px); the
  default is `md`. Keep layout on a 4px rhythm, with 12px, 16px, and 24px as
  common gaps and insets.
- Choose `UiCard` for structured content and optional actions or footer data.
  Choose `UiRadioCardGroup` with `UiRadioCard` for one-of-many rich options;
  choose `UiDialog` for modal tasks that need focus management.
- Use one primary action per task, secondary buttons for supporting actions,
  and danger styling only for destructive actions. Use `UiBadge` for a short
  status, `UiAlert` for feedback, and `UiCodeBlock` for source code.
- Put `UiInput` and `UiSelect` in `UiField` with a visible label. Supply help
  text or an error when needed so the field exposes the matching ARIA relationship.
- Keep borders quiet and skip decorative grids. Preserve visible
  `:focus-visible` states, use 44px targets for touch-oriented actions, and provide
  an accessible name for every interactive control.

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
- `feat!:` publishes a major release
- `BREAKING CHANGE:` or `[BREAKING CHANGE]` anywhere in a commit body publishes
  a major release
- the same markers anywhere in an associated merged PR body publish a major
  release

The `release.yml` workflow runs on every push to `main`. When semantic-release
finds qualifying commits, it publishes the next version to npm, creates the
matching `v<version>` tag, and creates a GitHub Release. Configure an `NPM_TOKEN`
Actions secret with permission to publish `@filipgutica/ui`; contributors do not
publish locally or add a token to the repository.

Before the first token-backed release, remove the package's existing trusted
publisher in npm. The workflow retains `id-token: write` only for the provenance
attestations enabled in `package.json`; npm registry authentication comes from
the `NPM_TOKEN` secret.
