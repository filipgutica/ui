import { describe, expect, it } from 'vitest'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import releaseConfig from '../release.config.mjs'
import { analyzeCommits, hasBreakingChangeMarker } from '../scripts/analyze-commits.mjs'

const analyzerOptions = releaseConfig.plugins[0][1]
const context = {
  env: {},
  logger: { log: () => undefined },
}

const releaseTypeFor = (message) =>
  analyzeCommits(analyzerOptions, { ...context, commits: [{ message }] })

describe('release configuration', () => {
  it.each([
    ['fix: repair control', 'patch'],
    ['feat: add control', 'minor'],
    ['feat!: replace control API', 'major'],
    // A design-system bump that changes what consumers read.
    ['fix(deps)!: rename a design-system token', 'major'],
    ['feat: replace control API\n\nBREAKING CHANGE: consumers must migrate', 'major'],
    // A change to the shared project list alone ships through the docs deploy, not npm.
    ['chore(site): add a site to the project list', null],
  ])('maps %s to a %s release', async (message, expectedRelease) => {
    await expect(releaseTypeFor(message)).resolves.toBe(expectedRelease)
  })

  // Renovate copies these notes into every design-system bump PR, and the analyser reads PR bodies,
  // so a note that quoted the marker would make every bump a major release.
  it('tells design-system bump reviewers how to mark a breaking bump without marking every bump', () => {
    const { packageRules } = JSON.parse(readFileSync(resolve(process.cwd(), 'renovate.json'), 'utf8'))
    const designSystemRule = packageRules.find(rule => rule.matchPackageNames?.includes('@filipgutica/design-system'))

    expect(designSystemRule.prBodyNotes?.length).toBeGreaterThan(0)
    expect(designSystemRule.prBodyNotes.filter(hasBreakingChangeMarker)).toEqual([])
  })
})
