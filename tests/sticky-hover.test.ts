import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

// A touch screen keeps :hover on the last element tapped, so a hover fill would stay behind after a
// tap. Every :hover rule that paints (a background, shadow, border, outline, or text colour, or a
// custom property, which a painting declaration such as box-shadow: var(--depth) can read) sits in an
// @media query that needs (hover: hover) in every comma branch. :active stays outside the query: it
// shows only while a finger is down. This follows the sticky-hover guard in
// @filipgutica/design-system's tests/design-foundations.test.mjs.

type CssRule = { context: string, selector: string, body: string }

// Flattens a stylesheet into rules, each with its @media, @supports, or @layer context. Statement
// at-rules such as @import and @custom-variant end in a semicolon and hold no rules, so they are
// removed first; otherwise they would read as the prelude of the rule after them.
const cssRules = (source: string): CssRule[] => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@[\w-]+[^{};]*;/g, '')
  const squash = (text: string): string => text.replace(/\s+/g, ' ').trim()
  const rules: CssRule[] = []
  const context: string[] = []
  let start = 0
  for (let i = 0; i < css.length; i += 1) {
    if (css[i] === '{') {
      const prelude = squash(css.slice(start, i))
      if (prelude.startsWith('@')) {
        context.push(prelude)
        start = i + 1
        continue
      }
      const end = css.indexOf('}', i)
      rules.push({ context: context.join(' '), selector: prelude, body: squash(css.slice(i + 1, end)) })
      i = end
      start = end + 1
    } else if (css[i] === '}') {
      context.pop()
      start = i + 1
    }
  }
  return rules
}

// Splits a list on its top-level commas.
const topLevelList = (list: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let part = ''
  for (const char of list) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(part.trim())
      part = ''
    } else part += char
  }
  return [...parts, part.trim()]
}

const perSelector = (rules: CssRule[]): CssRule[] =>
  rules.flatMap(({ context, selector, body }) => topLevelList(selector).map(part => ({ context, selector: part, body })))

// Splits a condition on whitespace outside parentheses; null when the parentheses do not balance.
const topLevelParts = (condition: string): string[] | null => {
  const parts: string[] = []
  let depth = 0
  let part = ''
  for (const char of condition.trim()) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth < 0) return null
    if (depth === 0 && /\s/.test(char)) {
      if (part) parts.push(part)
      part = ''
    } else part += char
  }
  if (depth !== 0) return null
  return part ? [...parts, part] : parts
}

// Reads the media-condition grammar: every comma branch must need the feature; in an and chain one
// operand must; in an or chain every operand must; not never does; a parenthesised group is read
// inside; a single feature is matched by the feature's pattern. Empty or unbalanced input needs nothing.
const mandatory = (condition: string, feature: RegExp): boolean => {
  const branches = topLevelList(condition)
  if (branches.length > 1) return branches.every(branch => mandatory(branch, feature))
  let parts = topLevelParts(condition)
  if (!parts?.length) return false
  if (/^only$/i.test(parts[0]!)) parts = parts.slice(1)
  if (/^not$/i.test(parts[0] ?? '')) return false
  if (parts.length === 1) {
    const [only = ''] = parts
    if (feature.test(only)) return true
    const inner = /^\(.*\)$/.test(only) ? only.slice(1, -1).trim() : ''
    return /^(?:\(|not\s)/i.test(inner) && mandatory(inner, feature)
  }
  const operands = parts.filter((_, i) => i % 2 === 0)
  const operators = new Set(parts.filter((_, i) => i % 2 === 1).map(word => word.toLowerCase()))
  // An operand is a parenthesised group or a media type; anything else makes the query unreadable.
  const valid = operands.every(operand => /^\(.*\)$/.test(operand) || /^(?:all|screen|print)$/.test(operand))
  if (parts.length % 2 === 0 || operators.size !== 1 || !valid) return false
  if (operators.has('and')) return operands.some(operand => mandatory(operand, feature))
  if (operators.has('or')) return operands.every(operand => mandatory(operand, feature))
  return false
}

// Lowercase, and space every parenthesis, so (hover:hover)and (pointer:fine) splits like the spaced form.
const normalise = (condition: string): string => condition.toLowerCase().replace(/[()]/g, ' $& ').replace(/\s+/g, ' ').trim()
const requiredIn = (feature: RegExp, context: string): boolean => context.split(/(?=@)/)
  .some(rule => rule.startsWith('@media') && mandatory(normalise(rule.slice('@media'.length)), feature))

const paints = /(?:^|;\s*)(?:--[\w-]+|background(?:-color|-image)?|box-shadow|color|outline(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?)\s*:/
const hoverCapable = /^\(\s*hover\s*(?::\s*hover\s*)?\)$/
const hoverRules = (source: string): CssRule[] => perSelector(cssRules(source))
  .filter(({ selector, body }) => /:hover\b/.test(selector) && paints.test(body))
const stickyHover = (file: string, source: string): string[] => hoverRules(source)
  .filter(({ context }) => !requiredIn(hoverCapable, context))
  .map(({ selector }) => `${file} ${selector}`)

// ui's own stylesheets, and the <style> blocks of its components and the documentation site.
const root = process.cwd()
const styleSources = (): [string, string][] => ['src', 'docs/src'].flatMap(dir =>
  readdirSync(resolve(root, dir), { recursive: true, encoding: 'utf8' })
    .filter(file => /\.(?:css|vue)$/.test(file))
    .map((file): [string, string] => {
      const path = join(dir, file)
      const text = readFileSync(resolve(root, path), 'utf8')
      const css = file.endsWith('.vue')
        ? [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(([, block]) => block).join('\n')
        : text
      return [relative(root, resolve(root, path)), css]
    }))

describe('sticky-hover guard', () => {
  it('catches a painting hover rule outside @media (hover: hover)', () => {
    const planted = `@import './components/drawer.css';
      @custom-variant dark (&:where(.dark, .dark *));
      .lead:hover { background: red }
      @layer components {
        .chip:hover { background: red } .link:hover { text-decoration: underline; border-radius: 0 }
        .row:is(:hover, :focus-visible) { color: red } .btn:active { background: red }
        .edge:hover { border: 1px solid red } .side:hover { border-top: 1px solid red } .ring:hover { outline: 2px solid red }
        @media (hover: hover) { .ok:hover { background: red } } @media (hover:hover) { .tight:hover { background: red } }
        @media (hover: hover) and ((max-width: 800px) or (pointer: fine)) { .nested:hover { background: red } }
        @media ((hover: hover) and (pointer: fine)) { .grouped:hover { background: red } }
        @media (hover) { .bare:hover { background: red } } @media (HOVER: HOVER) { .caps:hover { background: red } }
        @media (hover: hover) and garbage { .garbage:hover { background: red } }
        .sink:hover:not(:disabled) { --depth: var(--shadow-sink) } @media (hover: hover) { .sunk:hover { --depth: none } }
        .motion:hover { transition: color 1s }
        @media (hover: hover), (max-width: 640px) { .either:hover { background: red } }
        @media not (hover: hover) { .negated:hover { background: red } }
        @media (forced-colors: active) { .fc:hover { border-color: red } @media (hover: hover) { .fc-ok:hover { border-color: red } } }
      }`
    expect(stickyHover('planted.css', planted)).toEqual([
      'planted.css .lead:hover', 'planted.css .chip:hover', 'planted.css .row:is(:hover, :focus-visible)', 'planted.css .edge:hover',
      'planted.css .side:hover', 'planted.css .ring:hover', 'planted.css .garbage:hover', 'planted.css .sink:hover:not(:disabled)',
      'planted.css .either:hover', 'planted.css .negated:hover', 'planted.css .fc:hover',
    ])
  })

  it('finds every painting hover rule in ui inside @media (hover: hover)', () => {
    const sources = styleSources()
    expect(sources.map(([file]) => file)).toEqual(expect.arrayContaining(['src/components.css', 'src/site.css', 'src/components/tabs.css', 'docs/src/styles.css']))
    expect(sources.flatMap(([file, css]) => stickyHover(file, css))).toEqual([])
    // The scan reads real hover rules, so an empty list above is not a parser that found nothing.
    expect(sources.flatMap(([, css]) => hoverRules(css)).length).toBeGreaterThan(10)
  })
})
