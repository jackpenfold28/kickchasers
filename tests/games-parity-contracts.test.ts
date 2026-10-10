import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  MATCH_DAY_POLL_MS,
  TRACKED_SUMMARY_POLL_MS,
  buildPerformanceEvaluation,
  buildTrackedPlayerSummaryRoute,
  buildTrackedSummaryRoute,
  canMutateManualGame,
  countTrackedCustomStats,
  isEligibleMatchDayGame,
  mapManualTotals,
  matchDayPollInterval,
  sortMatchDayGames,
  trackedSummaryPollInterval,
  trackedEventMatchesPlayer,
} from '../src/lib/canonical/games-parity-contract.ts'
import { aggregatePlayerEvents, buildTotalsFromEvents, type PlayerEventRow } from '../src/lib/canonical/player-event-aggregate.ts'

const events = (...codes: string[]): PlayerEventRow[] => codes.map((stat_key, index) => ({
  stat_key,
  quarter: (index % 4) + 1,
  team_side: 'home',
  player_number: 23,
}))

test('final single-player summary uses canonical totals and stops polling', () => {
  const totals = buildTotalsFromEvents(events('K', 'K_EF', 'HB', 'M', 'T', 'G', 'B'))
  assert.equal(totals.disposals, 2)
  assert.equal(totals.points, 7)
  assert.equal(trackedSummaryPollInterval('final'), null)
})

test('live tracked summary polls every ten seconds only while visible', () => {
  assert.equal(trackedSummaryPollInterval('live'), TRACKED_SUMMARY_POLL_MS)
  assert.equal(trackedSummaryPollInterval('live', false), null)
  assert.equal(trackedSummaryPollInterval('completed'), null)
})

test('team-tracked player route preserves stable game-player identity', () => {
  assert.equal(buildTrackedSummaryRoute('game/a'), '/games/game%2Fa')
  assert.equal(buildTrackedPlayerSummaryRoute('game/a', 'player/b'), '/player/game%2Fa/player%2Fb')
  assert.equal(trackedEventMatchesPlayer(
    { teamSide: 'away', playerNumber: 7, profileUserId: 'away-user' },
    { teamSide: 'home', number: 7, profileUserId: 'home-user' },
  ), false)
  assert.equal(trackedEventMatchesPlayer(
    { teamSide: 'away', playerNumber: 7, profileUserId: 'away-user' },
    { teamSide: 'away', number: 7, profileUserId: 'away-user' },
  ), true)
})

test('Ruck tracked performance uses Ruck Impact 7 and benchmark rules', () => {
  const totals = buildTotalsFromEvents(events(...Array(40).fill('HO'), ...Array(20).fill('K')))
  const result = buildPerformanceEvaluation({ totals, position: 'RUC' })
  assert.equal(result.bands.hitouts, 'Elite')
  assert.ok(result.impact7 >= 1.5)
})

test('custom counters retain definition labels and zero-score games remain genuine zeros', () => {
  assert.deepEqual(countTrackedCustomStats([
    { statKey: 'CUS_PRESSURE', customLabel: 'Pressure Act' },
    { statKey: 'CUS_PRESSURE', customLabel: 'Pressure Act' },
    { statKey: 'K' },
  ]), { 'Pressure Act': 2 })
  const totals = buildTotalsFromEvents(events('K', 'HB'))
  assert.equal(totals.goals, 0)
  assert.equal(totals.behinds, 0)
  assert.equal(totals.points, 0)
})

test('quarter filtering remains deterministic across Q1-Q4 and total', () => {
  const result = aggregatePlayerEvents(events('K', 'HB', 'M', 'G'), 23)
  assert.equal(result.totals.all.disposals, 2)
  assert.equal(result.totals['1'].kicks, 1)
  assert.equal(result.totals['2'].handballs, 1)
  assert.equal(result.totals['3'].marks, 1)
  assert.equal(result.totals['4'].goals, 1)
})

test('normal manual game preserves stored totals and derives fantasy once', () => {
  const result = mapManualTotals({ k: 12, hb: 8, m: 5, t: 4, g: 2, b: 1, frees_for: 1, frees_against: 2 })
  assert.equal(result.totals.disposals, 20)
  assert.equal(result.totals.points, 13)
  assert.equal(result.totals.fantasy, 91)
  assert.equal(result.availability.disposals, true)
})

test('manual low-stat and Ruck fixtures use canonical fallback and override semantics', () => {
  const low = mapManualTotals({ k: 1, hb: 1, af: 4, rating: 2.2 })
  const lowEvaluation = buildPerformanceEvaluation({ totals: low.totals, position: null, ratingOverride: low.ratingOverride })
  assert.equal(lowEvaluation.impact7, 2.2)
  assert.equal(lowEvaluation.impactBand, 'Rookie')

  const ruck = mapManualTotals({ hitouts: 40, k: 20, m: 7 })
  const ruckEvaluation = buildPerformanceEvaluation({ totals: ruck.totals, position: 'RUC' })
  assert.equal(ruckEvaluation.bands.hitouts, 'Elite')
})

test('manual records do not fabricate missing optional fields and mutations stay owner-only', () => {
  const result = mapManualTotals({ k: 0, hb: null, hitouts: null })
  assert.equal(result.availability.kicks, true)
  assert.equal(result.availability.handballs, undefined)
  assert.equal(result.availability.hitouts, undefined)
  assert.equal(canMutateManualGame('viewer', 'owner'), false)
  assert.equal(canMutateManualGame('owner', 'owner'), true)
})

test('Match Day includes eligible official live and recent games only', () => {
  const followed = new Set(['league-1'])
  assert.equal(isEligibleMatchDayGame({ trackerMode: 'team_game', status: 'live', awayLeagueId: 'league-1', awayOfficial: true }, followed, 'live'), true)
  assert.equal(isEligibleMatchDayGame({ trackerMode: 'team_game', status: 'final', homeLeagueId: 'league-1', homeOfficial: true, countedEventCount: 2 }, followed, 'recent'), true)
  assert.equal(isEligibleMatchDayGame({ trackerMode: 'team_stats_game', status: 'live', homeLeagueId: 'league-1', homeOfficial: true }, followed, 'live'), false)
  assert.equal(isEligibleMatchDayGame({ trackerMode: 'team_game', status: 'live', homeLeagueId: 'league-2', homeOfficial: true }, followed, 'live'), false)
  assert.equal(isEligibleMatchDayGame({ trackerMode: 'team_game', status: 'final', homeLeagueId: 'league-1', homeOfficial: true, countedEventCount: 0 }, followed, 'recent'), false)
})

test('Match Day ordering, destination, and lifecycle match mobile', () => {
  const live = sortMatchDayGames([
    { gameId: 'older', date: '2026-08-18T09:00:00Z', updatedAt: '2026-08-18T09:30:00Z' },
    { gameId: 'newer', date: '2026-08-18T08:00:00Z', updatedAt: '2026-08-18T10:00:00Z' },
  ], 'live')
  assert.deepEqual(live.map((game) => game.gameId), ['newer', 'older'])
  assert.equal(buildTrackedSummaryRoute(live[0].gameId), '/games/newer')
  assert.equal(matchDayPollInterval(), MATCH_DAY_POLL_MS)
  assert.equal(matchDayPollInterval(false), null)
})

test('repositories and routes are wired to the P1 contracts', async () => {
  const [matchDay, gamePage, routes] = await Promise.all([
    readFile(new URL('../src/lib/portal-match-day.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/GameSummaryPage.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(matchDay, /neq\('tracker_mode', 'team_stats_game'\)/)
  assert.match(matchDay, /isEligibleMatchDayGame/)
  assert.match(gamePage, /trackedSummaryPollInterval/)
  assert.match(routes, /player\/:gameId\/:playerId.*PlayerGameSummaryPage/)
  assert.doesNotMatch(routes, /player\/:gameId\/:playerId.*DisabledRoute/)
})

test('tracked summary uses only columns exposed by the deployed counted-events view', async () => {
  const source = await readFile(new URL('../src/lib/portal-games.ts', import.meta.url), 'utf8')
  const countedEventsQuery = source.match(/\.from\('v_counted_events'\)[\s\S]*?\.eq\('game_id', gameId\)/)?.[0] ?? ''
  assert.match(countedEventsQuery, /id,stat_key,quarter,quarter_clock_label,team_side,player_number,profile_user_id,created_at/)
  assert.doesNotMatch(countedEventsQuery, /stat_definition_id/)
  assert.match(source, /from\('tracker_stat_definitions'\)[\s\S]*\.in\('stat_key', customStatKeys\)/)
})
