import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeDashboardUpdate } from '../src/lib/canonical/dashboard-loading.ts'

type State = {
  pendingSections: ('leaderboard' | 'liveAroundMe')[]
  sectionErrors: Partial<Record<'leaderboard' | 'liveAroundMe', string>>
  leaderboard: number[]
  liveAroundMe: number[]
  colour: string
}
const initial = (): State => ({ pendingSections: ['leaderboard', 'liveAroundMe'], sectionErrors: {}, leaderboard: [], liveAroundMe: [], colour: 'fallback' })

test('one completed section leaves the slower section loading and keeps core content', () => {
  const next = mergeDashboardUpdate(initial(), { leaderboard: [42] }, 'leaderboard')
  assert.deepEqual(next.pendingSections, ['liveAroundMe'])
  assert.deepEqual(next.leaderboard, [42])
  assert.equal(next.colour, 'fallback')
})

test('a section failure is isolated and a successful retry clears only its error', () => {
  const failed = mergeDashboardUpdate(initial(), { sectionErrors: { leaderboard: 'offline' } }, 'leaderboard')
  assert.deepEqual(failed.pendingSections, ['liveAroundMe'])
  const retried = mergeDashboardUpdate({ ...failed, pendingSections: [...failed.pendingSections, 'leaderboard'] }, { leaderboard: [15] }, 'leaderboard')
  assert.equal(retried.sectionErrors.leaderboard, undefined)
  assert.deepEqual(retried.pendingSections, ['liveAroundMe'])
  assert.deepEqual(retried.leaderboard, [15])
})

test('late decorative enrichment cannot overwrite retried section data or loading state', () => {
  const current = { ...initial(), leaderboard: [99], pendingSections: ['liveAroundMe'] as State['pendingSections'] }
  const next = mergeDashboardUpdate(current, { colour: 'club' })
  assert.deepEqual(next.leaderboard, [99])
  assert.deepEqual(next.pendingSections, ['liveAroundMe'])
})

test('an unrelated completion preserves another section retry error', () => {
  const current = { ...initial(), sectionErrors: { leaderboard: 'retry failed' } }
  const next = mergeDashboardUpdate(current, { liveAroundMe: [1], sectionErrors: { leaderboard: 'stale error' } }, 'liveAroundMe')
  assert.equal(next.sectionErrors.leaderboard, 'retry failed')
})
