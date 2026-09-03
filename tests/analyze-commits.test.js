import { describe, expect, it, vi } from 'vitest'

import {
  analyzeCommits,
  hasBreakingChangeMarker,
} from '../scripts/analyze-commits.mjs'

const analyzerOptions = {
  preset: 'conventionalcommits',
  releaseRules: [
    { breaking: true, release: 'major' },
    { type: 'fix', release: 'patch' },
    { type: 'feat', release: 'minor' },
  ],
}

const contextFor = ({ message, fetch, repository = 'filipgutica/ui', token = 'token' }) => ({
  commits: [{ hash: 'abc123', message }],
  env: { GITHUB_REPOSITORY: repository, GH_TOKEN: token },
  fetch,
  logger: { log: () => undefined },
})

describe('breaking-change analysis', () => {
  it.each([
    ['context before BREAKING CHANGE: consumers must migrate'],
    ['context before [BREAKING CHANGE] context after'],
  ])('recognizes a marker anywhere in text', (text) => {
    expect(hasBreakingChangeMarker(text)).toBe(true)
  })

  it('promotes a marker anywhere in a commit body to major', async () => {
    const fetch = vi.fn()

    await expect(
      analyzeCommits(
        analyzerOptions,
        contextFor({
          message: 'fix: adjust API\n\nDetails before [BREAKING CHANGE] details after',
          fetch,
        }),
      ),
    ).resolves.toBe('major')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('promotes a marker anywhere in an associated PR body to major', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ body: 'Migration notes before [BREAKING CHANGE] details after' }],
    })

    await expect(
      analyzeCommits(
        analyzerOptions,
        contextFor({ message: 'fix: adjust API', fetch }),
      ),
    ).resolves.toBe('major')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/filipgutica/ui/commits/abc123/pulls?per_page=100',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    )
  })

  it('preserves the conventional release when PR bodies have no marker', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ body: 'No breaking release in this PR.' }],
    })

    await expect(
      analyzeCommits(
        analyzerOptions,
        contextFor({ message: 'feat: add control', fetch }),
      ),
    ).resolves.toBe('minor')
  })
})
