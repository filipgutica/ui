// Builds the token values, themes, and fonts that @filipgutica/ui publishes from the pinned
// @filipgutica/design-system package, which owns the values. It reads only the package's standalone
// files: tokens.css, themes/*.css, and fonts. Which variables ui declares is ui's own, in
// scripts/theme-variables.mjs. To change a value, bump the package and run this script.
//
//   node scripts/vendor-design-system.mjs          write every output
//   node scripts/vendor-design-system.mjs --check  fail when an output differs from the package
//
// A token and the ui variable of the same name are one variable.
// - src/theme.css stays hand-written. The script rewrites only the value of each :root and
//   :root.dark declaration of a token or a component role. Declarations of other variables are
//   ui's own, and every other byte stays as written.
// - src/themes/<id>.css is one theme for sites that toggle a .dark class: themeVariables with the
//   values of tokens.css and the package's themes/<id>.css. A .css file there that matches no
//   package theme is removed.
// - src/fonts/* are the package's font and licence files, unchanged. src/fonts.css is the
//   package's fonts.css with its URLs pointed into fonts/.
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { componentRoles, themeOnlyTokens, themeVariables, useSiteTokens } from './theme-variables.mjs'

const PACKAGE = '@filipgutica/design-system'

// The installed package's root directory.
export const pinnedPackageRoot = () => dirname(createRequire(import.meta.url).resolve(`${PACKAGE}/package.json`))

// A file the package exports, resolved through its exports map. The package refers to itself by
// name, so this works on any copy of it, such as an unpacked tarball.
const packageFile = ({ packageRoot, path }) => createRequire(join(packageRoot, 'package.json')).resolve(`${PACKAGE}/${path}`)

const declaration = /^(\s*)(--[\w-]+):\s*([^;]+);(.*)$/gm
const reference = /var\((--[\w-]+)\)/g

// The body of the one top-level rule with this selector.
const ruleBody = (css, selector, file) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matches = [...css.matchAll(new RegExp(`^${escaped} \\{\\n([\\s\\S]*?)^\\}$`, 'gm'))]
  if (matches.length !== 1) throw new Error(`${file} needs exactly one "${selector}" rule, found ${matches.length}`)
  const [match] = matches
  return { start: match.index + match[0].indexOf('\n') + 1, body: match[1] }
}

const declarations = (body) => new Map([...body.matchAll(declaration)].map(([, , name, value]) => [name, value]))

const declared = (body) => new Set(declarations(body).keys())

// Throws when a value refers to a variable that the file it lands in does not declare.
const checkReferences = ({ name, value, defined, file }) => {
  for (const [, target] of value.matchAll(reference)) {
    if (!defined.has(target)) throw new Error(`${name} refers to ${target}, which ${file} does not declare`)
  }
}

// The light and dark value of every token in tokens.css. Values keep their var() references, so a
// page that overrides a token on a subtree or sets its own project hue changes what follows from it.
// inputsCss, a package themes/<id>.css, replaces the light values of the tokens it sets.
const tokenValues = ({ tokensCss, inputsCss, inputsFile }) => {
  const light = declarations(ruleBody(tokensCss, ':root', 'tokens.css').body)
  const dark = declarations(ruleBody(tokensCss, ':root[data-theme="dark"]', 'tokens.css').body)
  for (const name of dark.keys()) if (!light.has(name)) throw new Error(`tokens.css dark ${name} has no light value`)

  if (inputsCss !== undefined) {
    const inputs = declarations(ruleBody(inputsCss, ':root', inputsFile).body)
    for (const name of ['--color-project', '--color-project-dark']) {
      if (!inputs.has(name)) throw new Error(`${inputsFile} must declare ${name}`)
    }
    for (const [name, value] of inputs) {
      if (!light.has(name)) throw new Error(`${inputsFile} sets ${name}, which tokens.css does not declare`)
      light.set(name, value)
    }
  }

  const mapped = [...themeVariables.filter((name) => componentRoles[name] === undefined),
    ...Object.values(componentRoles), ...themeOnlyTokens, ...useSiteTokens]
  for (const name of mapped) if (!light.has(name)) throw new Error(`tokens.css does not declare ${name}`)

  return { light, dark: (name) => dark.get(name) ?? light.get(name) }
}

const fillRule = ({ body, mode, values }) => body.replace(declaration, (line, indent, name, current, rest) => {
  const entry = values.get(name)
  if (entry === undefined || (entry.token !== undefined && current === `var(${entry.token})`)) return line
  return `${indent}${name}: ${entry[mode]};${rest}`
})

// theme.css with the value of each token and component role it declares taken from tokens.css.
export const renderThemeCss = ({ themeCss, tokensCss }) => {
  const tokens = tokenValues({ tokensCss })
  const root = ruleBody(themeCss, ':root', 'src/theme.css')
  const dark = ruleBody(themeCss, ':root.dark', 'src/theme.css')
  if (dark.start < root.start) throw new Error('src/theme.css must declare :root before :root.dark')

  const values = new Map()
  for (const name of tokens.light.keys()) {
    if (!useSiteTokens.includes(name)) values.set(name, { light: tokens.light.get(name), dark: tokens.dark(name) })
  }
  // A component role may also be written as var(<its token>).
  for (const [role, token] of Object.entries(componentRoles)) values.set(role, { ...values.get(token), token })

  const rootNames = declared(root.body)
  const darkNames = declared(dark.body)
  for (const [name, entry] of values) {
    // Sites import src/theme.css alone, so it declares every token but the theme-only ones.
    if (!rootNames.has(name) && !themeOnlyTokens.includes(name)) {
      throw new Error(`tokens.css declares ${name}, which src/theme.css :root must declare`)
    }
    if (rootNames.has(name) && entry.light !== entry.dark && !darkNames.has(name)) {
      throw new Error(`${name} changes in dark mode, so src/theme.css :root.dark must declare it`)
    }
    if (rootNames.has(name)) checkReferences({ name, value: `${entry.light} ${entry.dark}`, defined: rootNames, file: 'src/theme.css' })
  }

  return themeCss.slice(0, root.start)
    + fillRule({ body: root.body, mode: 'light', values })
    + themeCss.slice(root.start + root.body.length, dark.start)
    + fillRule({ body: dark.body, mode: 'dark', values })
    + themeCss.slice(dark.start + dark.body.length)
}

const themeName = (id) => id.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')

// src/themes/<id>.css: themeVariables in both modes, then the theme-only tokens in light. Dark
// repeats every variable, because src/theme.css's :root.dark otherwise outranks this file's light
// values. A component role points at its token.
export const renderTheme = ({ id, tokensCss, inputsCss }) => {
  const tokens = tokenValues({ tokensCss, inputsCss, inputsFile: `themes/${id}.css` })
  const defined = new Set([...themeVariables, ...themeOnlyTokens])
  const block = (names, value) => names.map((name) => {
    const css = componentRoles[name] === undefined ? value(name) : `var(${componentRoles[name]})`
    checkReferences({ name, value: css, defined, file: `src/themes/${id}.css` })
    return `  ${name}: ${css};`
  })

  return [
    `/* Generated from tokens/core.json and tokens/themes/${id}.json by scripts/build-tokens.mjs in ${PACKAGE}. Do not edit.`,
    ` * Opt-in ${themeName(id)} roles for the class flavour. Import after class/base.css (theme.css in @filipgutica/ui).`,
    ' * Dark mode uses the same .dark class as the base. Keep exactly one :root.dark block:',
    ' * sites copy it into a <noscript> prefers-color-scheme rule. */',
    '',
    ':root {',
    '  color-scheme: light;',
    ...block([...themeVariables, ...themeOnlyTokens], (name) => tokens.light.get(name)),
    '}',
    '',
    ':root.dark {',
    '  color-scheme: dark;',
    ...block(themeVariables, tokens.dark),
    '}',
    '',
  ].join('\n')
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

// Writes every output under root, or with check, returns the paths that differ from the package
// without writing anything. packageRoot is the design-system package to read, the pinned one by
// default. src/themes/ may hold other files, such as notes; only .css files there are themes, so
// only a .css file with no package theme is removed or reported.
export const vendorDesignSystem = ({ root, check = false, packageRoot = pinnedPackageRoot() }) => {
  const read = (path) => readFileSync(join(root, path), 'utf8')
  const readPackage = (path) => readFileSync(packageFile({ packageRoot, path }), 'utf8')

  const tokensCss = readPackage('tokens.css')
  const themesDir = dirname(packageFile({ packageRoot, path: 'themes/graphite-indigo.css' }))
  const themeFiles = readdirSync(themesDir).filter((file) => file.endsWith('.css'))
  const fontsDir = dirname(packageFile({ packageRoot, path: 'fonts.css' }))
  const fontFiles = readdirSync(fontsDir).filter((file) => file !== 'fonts.css')
  const outputs = [
    ['src/theme.css', renderThemeCss({ themeCss: read('src/theme.css'), tokensCss })],
    ...themeFiles.map((file) => [`src/themes/${file}`, renderTheme({
      id: file.slice(0, -'.css'.length),
      tokensCss,
      inputsCss: readFileSync(join(themesDir, file), 'utf8'),
    })]),
    ['src/fonts.css', renderFontsCss(readPackage('fonts.css'))],
    ...fontFiles.map((file) => [`src/fonts/${file}`, readFileSync(join(fontsDir, file))]),
  ]
  const extra = [
    ...readdirSync(join(root, 'src/themes'))
      .filter((file) => file.endsWith('.css') && !themeFiles.includes(file))
      .map((file) => `src/themes/${file}`),
    ...readdirSync(join(root, 'src/fonts')).filter((file) => !fontFiles.includes(file)).map((file) => `src/fonts/${file}`),
  ]

  if (!check) {
    for (const [path, content] of outputs) writeFileSync(join(root, path), content)
    for (const path of extra) rmSync(join(root, path))
    return []
  }

  const stale = outputs.filter(([path, content]) => {
    try {
      return !readFileSync(join(root, path)).equals(Buffer.from(content))
    } catch {
      // A missing file is stale.
      return true
    }
  }).map(([path]) => path)
  return [...stale, ...extra]
}

const run = () => {
  const stale = vendorDesignSystem({
    root: fileURLToPath(new URL('..', import.meta.url)),
    check: process.argv.includes('--check'),
  })
  if (stale.length > 0) {
    console.error(`These files differ from ${PACKAGE}. Run "pnpm themes:build":\n${stale.map((path) => `  ${path}`).join('\n')}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
