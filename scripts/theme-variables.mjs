// Which @filipgutica/design-system tokens this library declares, and under which names.
// scripts/vendor-design-system.mjs reads this file. A design-system token and the ui variable of
// the same name are one variable, so a token needs an entry here only when ui treats it specially.

// The variables each src/themes/<id>.css declares, in this order, in both :root and :root.dark.
export const themeVariables = [
  '--color-project',
  '--color-project-dark',
  '--color-bg',
  '--color-surface',
  '--color-surface-raised',
  '--color-surface-muted',
  '--color-text',
  '--color-muted',
  '--color-link',
  '--color-accent',
  '--color-accent-text',
  '--color-focus',
  '--color-border',
  '--color-border-subtle',
  '--color-button-bg',
  '--color-button-text',
  '--color-button-hover',
  '--color-input-bg',
  '--color-input-text',
  '--color-input-border',
  '--color-input-placeholder',
  '--color-row-hover',
  '--color-row-selected',
  '--color-row-selected-text',
  '--color-code',
  '--color-code-text',
  '--color-syntax-comment',
  '--color-syntax-keyword',
  '--color-syntax-string',
  '--color-syntax-number',
  '--color-syntax-function',
  '--color-syntax-type',
  '--color-syntax-variable',
  '--color-syntax-operator',
  '--color-syntax-punctuation',
  '--color-syntax-tag',
  '--color-syntax-attribute',
  '--color-error',
  '--color-warning',
  '--color-success',
  '--color-info',
  '--color-progress',
  '--color-error-surface',
  '--color-warning-surface',
  '--color-success-surface',
  '--color-info-surface',
  '--shadow-dialog',
  '--color-status-text',
  '--color-terminal',
  '--color-terminal-text',
  '--color-terminal-border',
  '--color-terminal-caption',
  '--color-terminal-caption-text',
  '--color-accent-hover',
  '--color-command-bg',
  '--color-command-border',
]

// Component roles: ui variables with no token of their own, each carrying the named token's value.
export const componentRoles = {
  '--color-button-bg': '--color-accent',
  '--color-button-text': '--color-accent-text',
  '--color-input-bg': '--color-surface-raised',
  '--color-input-text': '--color-text',
  '--color-input-border': '--color-border',
  '--color-input-placeholder': '--color-muted',
  '--color-row-selected-text': '--color-text',
  '--color-syntax-function': '--color-syntax-keyword',
  '--color-syntax-type': '--color-syntax-number',
  '--color-syntax-variable': '--color-code-text',
  '--color-syntax-operator': '--color-muted',
  '--color-syntax-punctuation': '--color-muted',
  '--color-syntax-tag': '--color-syntax-keyword',
  '--color-syntax-attribute': '--color-syntax-number',
  '--color-progress': '--color-accent',
  '--color-status-text': '--color-text',
}

// Tokens that only the src/themes/ files declare, at the end of :root, after themeVariables.
// src/theme.css leaves them out.
export const themeOnlyTokens = [
  '--text-3xl',
  '--text-reading',
  '--text-display',
  '--text-display-sm',
  '--tracking-tight',
  '--space-20',
  '--space-24',
  '--row',
  '--page-wide',
]

// Tokens that ui never declares. Components read them with a fallback at the use site, such as
// var(--color-nav-current-text, var(--color-accent)), so a page can set them on any subtree.
export const useSiteTokens = [
  '--color-nav-current-text',
  '--color-segmented-current-text',
]
