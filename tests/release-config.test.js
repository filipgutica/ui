import { analyzeCommits } from '@semantic-release/commit-analyzer'
import { describe, expect, it } from 'vitest'

import releaseConfig from '../release.config.mjs'

const analyzerOptions = releaseConfig.plugins[0][1]
const context = {
  logger: { log: () => undefined },
}

const releaseTypeFor = (message) =>
  analyzeCommits(analyzerOptions, { ...context, commits: [{ message }] })

describe('release configuration', () => {
  it.each([
    ['fix: repair control', 'patch'],
    ['feat: add control', 'minor'],
    ['feat: replace control API\n\nBREAKING CHANGE: consumers must migrate', 'major'],
  ])('maps %s to a %s release', async (message, expectedRelease) => {
    await expect(releaseTypeFor(message)).resolves.toBe(expectedRelease)
  })
})
