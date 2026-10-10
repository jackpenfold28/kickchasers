import assert from 'node:assert/strict'
import test from 'node:test'

import { currentSeason } from '../src/lib/canonical/benchmarks.ts'
import { resolveBenchmarkGroup, resolveThresholdBenchmarkGroup } from '../src/lib/canonical/position-benchmark.ts'
import { computeGameRatingImpact7, evaluate } from '../src/lib/canonical/stats-eval.ts'

const cases = [
  ['forward-low', 'FWD', { disposals: 7, marks: 2, tackles: 1, goals: 2, behinds: 0, fantasy_points: 41, frees_for: 0, frees_against: 0 }, 6.1],
  ['forward-strong', 'FWD', { disposals: 12, marks: 6, tackles: 3, goals: 3, behinds: 3, fantasy_points: 85, frees_for: 0, frees_against: 1 }, 9.3],
  ['forward-elite', 'FWD', { disposals: 15, marks: 8, tackles: 4, goals: 4, behinds: 2, fantasy_points: 105, frees_for: 0, frees_against: 1 }, 10],
  ['mid-average', 'MID', { disposals: 18, marks: 3, tackles: 2, goals: 1, behinds: 0, fantasy_points: 62, frees_for: 0, frees_against: 0 }, 6.7],
  ['mid-strong', 'MID', { disposals: 35, marks: 8, tackles: 6, goals: 0, behinds: 0, fantasy_points: 136, frees_for: 0, frees_against: 0 }, 9.7],
  ['defender', 'DEF', { disposals: 18, marks: 6, tackles: 5, goals: 0, behinds: 0, fantasy_points: 84, frees_for: 0, frees_against: 1 }, 8.5],
  ['ruck-hitouts', 'RUC', { hitouts: 45, disposals: 10, marks: 2, tackles: 2, goals: 0, behinds: 0, fantasy_points: 58, frees_for: 1, frees_against: 2 }, 8],
  ['ruck-complete', 'RUC', { hitouts: 38, disposals: 20, marks: 7, tackles: 6, goals: 1, behinds: 0, fantasy_points: 118, frees_for: 2, frees_against: 1 }, 9.9],
] as const

for (const [id, position, stats, expected] of cases) {
  test(`Impact 7 mobile characterization: ${id}`, () => {
    assert.equal(computeGameRatingImpact7(stats, currentSeason, resolveBenchmarkGroup(position)), expected)
  })
}

test('unknown position uses the canonical Default fallback', () => {
  assert.equal(resolveBenchmarkGroup('wing'), 'Default')
  assert.equal(resolveThresholdBenchmarkGroup(null), 'Default')
  assert.equal(computeGameRatingImpact7({}, currentSeason, 'Default'), 0)
})

test('benchmark groups include Ruck and lower-is-better metrics', () => {
  assert.equal(resolveThresholdBenchmarkGroup('RUC'), 'Ruck')
  assert.equal(evaluate('hitouts', 35, 'Ruck'), 'Elite')
  assert.equal(evaluate('frees_against', 0, 'General Defender'), 'Elite')
  assert.equal(evaluate('frees_against', 6, 'General Defender'), 'Rookie')
})
