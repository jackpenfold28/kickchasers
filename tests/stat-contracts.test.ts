import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  aggregatePlayerEvents,
  buildTotalsFromEvents,
  type PlayerEventRow,
} from '../src/lib/canonical/player-event-aggregate.ts'
import {
  dedupeOfficialLeaderboardEvents,
  isPlayerPerformanceGame,
} from '../src/lib/canonical/leaderboard-contract.ts'

const events = (...codes: string[]): PlayerEventRow[] =>
  codes.map((stat_key) => ({ stat_key, quarter: 1, team_side: 'home', player_number: 7 }))

test('basic player game uses canonical base and fantasy totals', () => {
  const totals = buildTotalsFromEvents(events('K', 'HB', 'D', 'M', 'T', 'G', 'B'))
  assert.deepEqual(
    {
      kicks: totals.kicks,
      handballs: totals.handballs,
      disposals: totals.disposals,
      marks: totals.marks,
      tackles: totals.tackles,
      goals: totals.goals,
      behinds: totals.behinds,
      points: totals.points,
      fantasy: totals.fantasy,
      otherDisposals: totals.otherDisposals,
    },
    { kicks: 1, handballs: 1, disposals: 3, marks: 1, tackles: 1, goals: 1, behinds: 1, points: 7, fantasy: 19, otherDisposals: 1 }
  )
})

test('sequencing modifiers describe base events without inflating them', () => {
  const totals = buildTotalsFromEvents(
    events('K', 'CON', 'K_EF', 'K', 'UC', 'K_IF', 'HB', 'CON', 'HB_EF', 'HB', 'UC', 'HB_IF', 'M', 'CON', 'MC', 'M', 'UC', 'MUC')
  )
  assert.equal(totals.kicks, 2)
  assert.equal(totals.handballs, 2)
  assert.equal(totals.disposals, 4)
  assert.equal(totals.marks, 2)
  assert.equal(totals.effectiveKicks, 1)
  assert.equal(totals.ineffectiveKicks, 1)
  assert.equal(totals.effectiveHandballs, 1)
  assert.equal(totals.ineffectiveHandballs, 1)
  assert.equal(totals.contestedPossessions, 3)
  assert.equal(totals.uncontestedPossessions, 3)
  assert.equal(totals.contestedMarks, 1)
  assert.equal(totals.uncontestedMarks, 1)
})

test('legacy modifier-only rows still count one base attempt', () => {
  const totals = buildTotalsFromEvents(events('K_EF', 'HB_IF'))
  assert.equal(totals.kicks, 1)
  assert.equal(totals.handballs, 1)
  assert.equal(totals.disposals, 2)
})

test('quarter aggregation preserves total and filtered results', () => {
  const rows: PlayerEventRow[] = [
    { stat_key: 'K', quarter: 1, team_side: 'home', player_number: 7 },
    { stat_key: 'K_EF', quarter: 1, team_side: 'home', player_number: 7 },
    { stat_key: 'HB', quarter: 2, team_side: 'home', player_number: 7 },
    { stat_key: 'G', quarter: 4, team_side: 'home', player_number: 7 },
  ]
  const result = aggregatePlayerEvents(rows, 7)
  assert.equal(result.totals.all.disposals, 2)
  assert.equal(result.totals['1'].kicks, 1)
  assert.equal(result.totals['2'].handballs, 1)
  assert.equal(result.totals['4'].goals, 1)
  assert.deepEqual(result.quartersWithData, ['all', '1', '2', '4'])
})

test('leaderboard contract excludes team-stat games and deduplicates joined official rows', () => {
  assert.equal(isPlayerPerformanceGame('team_stats_game'), false)
  assert.equal(isPlayerPerformanceGame('team_game'), true)
  const deduped = dedupeOfficialLeaderboardEvents([
    { id: 'event-1', game_id: 'game-1' },
    { id: 'event-1', game_id: 'game-1' },
    { id: 'event-2', game_id: 'game-1' },
  ])
  assert.deepEqual(deduped.map((row) => row.id), ['event-1', 'event-2'])
})

test('manual totals remain outside the tracked official-event contract', () => {
  const trackedRows = [{ id: 'event-1', stat_key: 'K' }]
  const manualRows = [{ id: 'manual-1', kicks: 40 }]
  assert.equal(dedupeOfficialLeaderboardEvents(trackedRows).length, 1)
  assert.equal(manualRows.length, 1)
  assert.ok(!('stat_key' in manualRows[0]))
})

test('web leaderboard repository is wired to the canonical database authority', async () => {
  const source = await readFile(new URL('../src/lib/portal-stats.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('v_official_counted_events_for_squad'\)/)
  assert.match(source, /neq\('tracker_mode', 'team_stats_game'\)/)
  assert.doesNotMatch(source, /from\('v_counted_events'\)/)
  assert.match(source, /dedupeOfficialLeaderboardEvents/)
})
