// Copies the token values, class-flavour themes, and fonts that @filipgutica/ui publishes from the
// pinned @filipgutica/design-system package, which owns them. To change a value, bump that
// package and run this script.
//
//   node scripts/vendor-design-system.mjs          write every output
//   node scripts/vendor-design-system.mjs --check  fail when an output differs from the package
//
// - src/theme.css stays hand-written. The script rewrites only the value of each :root and
//   :root.dark declaration that a tokens.css "ui:" comment names. Declarations no comment names
//   are ui's own, and every other byte stays as written.
// - src/themes/*.css are the package's class-flavour themes, such as graphite-indigo.css, unchanged.
//   A file the package no longer ships is removed.
// - src/fonts/* are the package's font and licence files, unchanged. src/fonts.css is the
//   package's fonts.css with its URLs pointed into fonts/.
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageFile = (path) => createRequire(import.meta.url).resolve(`@filipgutica/design-system/${path}`)

const declaration = /^(\s*)(--[\w-]+):\s*([^;]+);(.*)$/gm

// The body of the one top-level rule with this selector.
const ruleBody = (css, selector, file) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...css.matchAll(new RegExp(`^${escaped} \\{\\n([\\s\\S]*?)^\\}$`, 'gm'))]
  if (matches.length !== 1) throw new Error(`${file} needs exactly one "${selector}" rule, found ${matches.length}`)
  const [match] = matches
  return { start: match.index + match[0].indexOf('\n') + 1, body: match[1] }
}

// The light and dark value of every ui variable a tokens.css "ui:" comment names, with each
// var(--token) reference renamed to that token's first ui variable.
export const uiValues = (tokensCss) => {
  const light = [...ruleBody(tokensCss, ':root', 'tokens.css').body.matchAll(declaration)]
  const dark = new Map([...ruleBody(tokensCss, ':root[data-theme="dark"]', 'tokens.css').body.matchAll(declaration)]
    .map(([, , token, value]) => [token, value]))

  const uiNames = new Map()
  for (const [, , token, , comment] of light) {
    const names = /\/\* ui: (.+) \*\//.exec(comment)?.[1]
    if (names === undefined) throw new Error(`tokens.css ${token} has no "ui:" comment`)
    // A var(--x, var(--y)) comment is a fallback ui writes where it reads the role, not a variable it declares.
    uiNames.set(token, names.startsWith('var(') ? [] : names.split(', '))
  }
  for (const token of dark.keys()) if (!uiNames.has(token)) throw new Error(`tokens.css dark ${token} has no light value`)

  const rename = (value) => value.replace(/var\((--[\w-]+)\)/g, (_, token) => {
    const [first] = uiNames.get(token) ?? []
    if (first === undefined) throw new Error(`tokens.css refers to ${token}, which has no ui variable`)
    return `var(${first})`
  })

  const values = new Map()
  for (const [, , token, value] of light) {
    const [general, ...roles] = uiNames.get(token)
    if (general === undefined) continue
    const entry = { light: rename(value), dark: rename(dark.get(token) ?? value) }
    values.set(general, entry)
    // When a comment names several variables, the first is the general one; the rest are
    // component roles with the same value, which may also be written as var(<general>).
    for (const role of roles) values.set(role, { ...entry, general })
  }
  return values
}

const fillRule = ({ body, mode, values }) => body.replace(declaration, (line, indent, name, current, rest) => {
  const entry = values.get(name)
  if (entry === undefined || (entry.general !== undefined && current === `var(${entry.general})`)) return line
  return `${indent}${name}: ${entry[mode]};${rest}`
})

const declared = (body) => new Set([...body.matchAll(declaration)].map(([, , name]) => name))

// theme.css with each mapped declaration's value taken from the package.
export const renderThemeCss = ({ themeCss, tokensCss, graphiteCss, baseCss }) => {
  const values = uiValues(tokensCss)
  const root = ruleBody(themeCss, ':root', 'src/theme.css')
  const dark = ruleBody(themeCss, ':root.dark', 'src/theme.css')
  if (dark.start < root.start) throw new Error('src/theme.css must declare :root before :root.dark')

  const rootNames = declared(root.body)
  const darkNames = declared(dark.body)
  const graphiteNames = declared(graphiteCss)
  const baseNames = declared(baseCss)
  for (const [name, entry] of values) {
    // Sites import src/theme.css alone, so it declares every base token. Only the Graphite
    // Indigo theme's extra steps, which the package's base.css lacks, may live in that theme alone.
    if (!rootNames.has(name) && (baseNames.has(name) || !graphiteNames.has(name))) {
      throw new Error(`tokens.css names ${name}, which src/theme.css :root must declare`)
    }
    if (rootNames.has(name) && entry.light !== entry.dark && !darkNames.has(name)) {
      throw new Error(`${name} changes in dark mode, so src/theme.css :root.dark must declare it`)
    }
  }

  return themeCss.slice(0, root.start)
    + fillRule({ body: root.body, mode: 'light', values })
    + themeCss.slice(root.start + root.body.length, dark.start)
    + fillRule({ body: dark.body, mode: 'dark', values })
    + themeCss.slice(dark.start + dark.body.length)
}

const replaceAll = ({ text, from, to, count }) => {
  const found = text.split(from).length - 1
  if (found !== count) throw new Error(`Expected ${count} of "${from}" in the package's fonts.css, found ${found}`)
  return text.replaceAll(from, to)
}

// src/fonts.css sits one level above the font files, so its URLs point into fonts/.
export const renderFontsCss = (css) => {
  const urls = css.split('url(').length - 1
  const pointed = replaceAll({ text: css, from: "url('./", to: "url('./fonts/", count: urls })
  return replaceAll({ text: pointed, from: 'beside this file', to: 'in fonts/', count: 1 })
}

const run = () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const check = process.argv.includes('--check')
  const read = (path) => readFileSync(join(root, path), 'utf8')

  const graphiteCss = readFileSync(packageFile('class/themes/graphite-indigo.css'), 'utf8')
  const themesDir = dirname(packageFile('class/themes/graphite-indigo.css'))
  const themeFiles = readdirSync(themesDir).filter((file) => file.endsWith('.css'))
  const fontsDir = dirname(packageFile('fonts.css'))
  const fontFiles = readdirSync(fontsDir).filter((file) => file !== 'fonts.css')
  const outputs = [
    ['src/theme.css', renderThemeCss({
      themeCss: read('src/theme.css'),
      tokensCss: readFileSync(packageFile('tokens.css'), 'utf8'),
      graphiteCss,
      baseCss: readFileSync(packageFile('class/base.css'), 'utf8'),
    })],
    ...themeFiles.map((file) => [`src/themes/${file}`, readFileSync(join(themesDir, file), 'utf8')]),
    ['src/fonts.css', renderFontsCss(readFileSync(packageFile('fonts.css'), 'utf8'))],
    ...fontFiles.map((file) => [`src/fonts/${file}`, readFileSync(join(fontsDir, file))]),
  ]
  const extra = [
    ...readdirSync(join(root, 'src/themes')).filter((file) => !themeFiles.includes(file)).map((file) => `src/themes/${file}`),
    ...readdirSync(join(root, 'src/fonts')).filter((file) => !fontFiles.includes(file)).map((file) => `src/fonts/${file}`),
  ]

  if (!check) {
    for (const [path, content] of outputs) writeFileSync(join(root, path), content)
    for (const path of extra) rmSync(join(root, path))
    return
  }

  const stale = outputs.filter(([path, content]) => {
    try {
      return !readFileSync(join(root, path)).equals(Buffer.from(content))
    } catch {
      // A missing file is stale.
      return true
    }
  }).map(([path]) => path)
  stale.push(...extra)
  if (stale.length > 0) {
    console.error(`These files differ from @filipgutica/design-system. Run "pnpm themes:build":\n${stale.map((path) => `  ${path}`).join('\n')}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
