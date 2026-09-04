import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const languageLoaders = {
  bash: () => import('shiki/langs/bash.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  vue: () => import('shiki/langs/vue.mjs'),
}

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [],
  themes: [{
    name: 'ui-semantic',
    fg: 'var(--color-code-text)',
    bg: 'var(--color-code)',
    settings: [
      { scope: ['comment'], settings: { foreground: 'var(--color-syntax-comment)' } },
      { scope: ['keyword', 'storage'], settings: { foreground: 'var(--color-syntax-keyword)' } },
      { scope: ['string'], settings: { foreground: 'var(--color-syntax-string)' } },
      { scope: ['constant.numeric', 'constant.language'], settings: { foreground: 'var(--color-syntax-number)' } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: 'var(--color-syntax-function)' } },
      { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: 'var(--color-syntax-type)' } },
      { scope: ['variable'], settings: { foreground: 'var(--color-syntax-variable)' } },
      { scope: ['keyword.operator'], settings: { foreground: 'var(--color-syntax-operator)' } },
      { scope: ['punctuation'], settings: { foreground: 'var(--color-syntax-punctuation)' } },
      { scope: ['entity.name.tag'], settings: { foreground: 'var(--color-syntax-tag)' } },
      { scope: ['entity.other.attribute-name'], settings: { foreground: 'var(--color-syntax-attribute)' } },
    ],
  }],
})

export const highlightCode = async ({ code, language }: { code: string; language: string }) => {
  const loader = Object.entries(languageLoaders).find(([name]) => name === language)?.[1]
  if (!loader) return code.split('\n').map(content => [{ content }])
  if (!highlighter.getLoadedLanguages().includes(language)) {
    await highlighter.loadLanguage((await loader()).default)
  }
  // The Vue grammar treats arbitrary root tags as custom SFC blocks. Give
  // markup fragments template context, then discard only the synthetic lines.
  const isVueFragment = language === 'vue'
    && !/^\s*(?:<!--[\s\S]*?-->\s*)*<(?:template|script|style)(?=[\s>])/.test(code)
  const source = isVueFragment ? `<template>\n${code}\n</template>` : code
  const highlighted = highlighter.codeToTokens(source, { lang: language, theme: 'ui-semantic' }).tokens
  const tokens = isVueFragment ? highlighted.slice(1, -1) : highlighted
  return tokens.map(line => line.map(({ content, color }) => ({ content, color })))
}
