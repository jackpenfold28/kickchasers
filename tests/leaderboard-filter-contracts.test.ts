import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ALL_LEADERBOARD_STAT_KEYS,
  EMPTY_LEADERBOARD_FILTERS,
  FEATURED_LEADERBOARD_STAT_KEYS,
  LEADERBOARD_AGE_RANGES,
  LEADERBOARD_STAT_DEFINITIONS,
  LEADERBOARD_STAT_LABELS,
  filterLeaderboardPlayers,
  getAvailableLeaderboardAgeRanges,
  getLeaderboardFilterAvailability,
  getLeaderboardRangeBounds,
  isAgeInLeaderboardRange,
  isLeaderboardStatKey,
  leaderboardStatsFromTotals,
  normalizeLeaderboardFilters,
  normalizeLeaderboardSeasonYear,
  normalizeLeaderboardStatKey,
  rankLeaderboardItems,
  reconcileLeaderboardFilters,
  selectLeaderboardLeague,
  selectLeaderboardState,
} from '../src/lib/canonical/leaderboard-filters.ts'
import { buildTotalsFromEvents } from '../src/lib/canonical/player-event-aggregate.ts'

const MOBILE_ALL_STAT_KEYS = [
  'disposals',
  'kicks',
  'handballs',
  'marks',
  'tackles',
  'goals',
  'behinds',
  'goal_assists',
  'turnovers',
  'intercepts',
  'one_percenters',
  'ground_ball_gets',
  'contested_possessions',
  'uncontested_possessions',
  'clearances',
  'inside_50s',
  'rebound_50s',
  'contested_marks',
  'hitouts',
  'frees_for',
  'frees_against',
] as const

const players = [
  { id: 'sa-one', homeStateCode: 'SA', homeLeagueId: 'league-sa', homeClubId: 'club-sa', ageYears: 9 },
  { id: 'sa-two', homeStateCode: 'SA', homeLeagueId: 'league-sa-2', homeClubId: 'club-sa-2', ageYears: 17 },
  { id: 'vic', homeStateCode: 'VIC', homeLeagueId: 'league-vic', homeClubId: 'club-vic', ageYears: 30 },
  { id: 'unknown', homeStateCode: null, homeLeagueId: null, homeClubId: null, ageYears: null },
]

test('every mobile All Leaders stat maps to a canonical key in mobile order', () => {
  assert.deepEqual(ALL_LEADERBOARD_STAT_KEYS, MOBILE_ALL_STAT_KEYS)
  for (const key of MOBILE_ALL_STAT_KEYS) assert.equal(isLeaderboardStatKey(key), true)
})

test('current leaderboard labels match mobile terminology', () => {
  assert.equal(LEADERBOARD_STAT_LABELS.ground_ball_gets, 'GBGs')
  assert.equal(LEADERBOARD_STAT_LABELS.contested_possessions, 'Contested')
  assert.equal(LEADERBOARD_STAT_LABELS.uncontested_possessions, 'Uncontested')
  assert.equal(LEADERBOARD_STAT_LABELS.contested_marks, 'Cont. marks')
  assert.equal(LEADERBOARD_STAT_LABELS.fantasy_points, 'Fantasy')
})

test('unsupported arbitrary stats reject and safely fall back', () => {
  assert.equal(isLeaderboardStatKey('metres_gained'), false)
  assert.equal(normalizeLeaderboardStatKey('metres_gained'), 'disposals')
})

test('derived leaderboard values consume canonical reconciled totals', () => {
  const totals = buildTotalsFromEvents([
    { stat_key: 'K', quarter: 1 },
    { stat_key: 'K_EF', quarter: 1 },
    { stat_key: 'HB', quarter: 1 },
    { stat_key: 'CON', quarter: 1 },
    { stat_key: 'M', quarter: 1 },
    { stat_key: 'MC', quarter: 1 },
  ])
  const stats = leaderboardStatsFromTotals(totals)
  assert.equal(stats.disposals, 2)
  assert.equal(stats.contested_possessions, 1)
  assert.equal(stats.contested_marks, 1)
  assert.equal(stats.fantasy_points, totals.fantasy)
})

test('leaderboard ordering metadata matches mobile descending totals', () => {
  for (const definition of LEADERBOARD_STAT_DEFINITIONS) assert.equal(definition.sortDirection, 'desc')
  assert.equal(LEADERBOARD_STAT_DEFINITIONS.find(({ key }) => key === 'frees_against')?.sortDirection, 'desc')
})

test('Fantasy is featured-only while the three featured keys match mobile', () => {
  assert.deepEqual(FEATURED_LEADERBOARD_STAT_KEYS, ['disposals', 'fantasy_points', 'goals'])
  assert.equal(ALL_LEADERBOARD_STAT_KEYS.includes('fantasy_points'), false)
})

test('current season defaults to the current calendar year', () => {
  const now = new Date('2026-07-15T12:00:00.000Z')
  const range = getLeaderboardRangeBounds('season', undefined, now)
  assert.equal(range.seasonYear, 2026)
  assert.match(range.start, /2025-12-31|2026-01-01/)
})

test('explicit historical season has bounded start and end dates', () => {
  const range = getLeaderboardRangeBounds('season', 2024, new Date('2026-07-15T12:00:00.000Z'))
  assert.equal(range.seasonYear, 2024)
  assert.ok(new Date(range.start).getTime() < new Date(range.end).getTime())
  assert.equal(new Date(range.end).getFullYear() >= 2024, true)
})

test('invalid season input fails safely to the current year', () => {
  const now = new Date('2026-07-15T12:00:00.000Z')
  assert.equal(normalizeLeaderboardSeasonYear('not-a-season', now), 2026)
  assert.equal(normalizeLeaderboardSeasonYear(0, now), 2026)
})

test('weekly range is a rolling seven-day window ending now', () => {
  const now = new Date('2026-07-15T12:00:00.000Z')
  const range = getLeaderboardRangeBounds('week', undefined, now)
  assert.equal(range.end, now.toISOString())
  assert.equal(new Date(range.end).getTime() - new Date(range.start).getTime(), 7 * 24 * 60 * 60 * 1000)
})

test('valid state values normalize to canonical codes', () => {
  assert.equal(normalizeLeaderboardFilters({ stateCode: ' sa ' }).stateCode, 'SA')
})

test('league availability is scoped to the selected state', () => {
  const availability = getLeaderboardFilterAvailability(players, { ...EMPTY_LEADERBOARD_FILTERS, stateCode: 'SA' })
  assert.deepEqual([...availability.leagueIds].sort(), ['league-sa', 'league-sa-2'])
  assert.equal(availability.leagueIds.has('league-vic'), false)
})

test('club availability is scoped to selected state and league', () => {
  const availability = getLeaderboardFilterAvailability(players, {
    ...EMPTY_LEADERBOARD_FILTERS,
    stateCode: 'SA',
    leagueId: 'league-sa',
  })
  assert.deepEqual([...availability.clubIds], ['club-sa'])
})

test('changing state clears incompatible league and club selections', () => {
  assert.deepEqual(
    selectLeaderboardState({ stateCode: 'VIC', leagueId: 'league-vic', clubId: 'club-vic', ageRange: 'Any' }, 'SA'),
    { stateCode: 'SA', leagueId: null, clubId: null, ageRange: 'Any' },
  )
})

test('changing league clears an incompatible club selection', () => {
  assert.deepEqual(
    selectLeaderboardLeague({ stateCode: 'SA', leagueId: 'league-sa', clubId: 'club-sa', ageRange: 'Any' }, 'league-sa-2'),
    { stateCode: 'SA', leagueId: 'league-sa-2', clubId: null, ageRange: 'Any' },
  )
})

test('invalid directory filter IDs fail safely against current availability', () => {
  const availability = getLeaderboardFilterAvailability(players, EMPTY_LEADERBOARD_FILTERS)
  const reconciled = reconcileLeaderboardFilters(
    { stateCode: 'XX', leagueId: 'missing', clubId: 'missing', ageRange: 'Any' },
    availability,
  )
  assert.deepEqual(reconciled, EMPTY_LEADERBOARD_FILTERS)
})

test('geography filters match exact canonical player identities', () => {
  const result = filterLeaderboardPlayers(players, {
    stateCode: 'SA',
    leagueId: 'league-sa',
    clubId: 'club-sa',
    ageRange: 'Any',
  })
  assert.deepEqual(result.map(({ id }) => id), ['sa-one'])
})

test('supported age bands exactly match mobile', () => {
  assert.deepEqual(LEADERBOARD_AGE_RANGES, ['Any', 'U10', 'U12', 'U14', 'U16', 'U18', '18+', '30+'])
})

test('age boundaries are inclusive at each lower bound and exclusive at upper bounds', () => {
  assert.equal(isAgeInLeaderboardRange(9, 'U10'), true)
  assert.equal(isAgeInLeaderboardRange(10, 'U10'), false)
  assert.equal(isAgeInLeaderboardRange(10, 'U12'), true)
  assert.equal(isAgeInLeaderboardRange(17, 'U18'), true)
  assert.equal(isAgeInLeaderboardRange(18, 'U18'), false)
  assert.equal(isAgeInLeaderboardRange(30, '30+'), true)
})

test('missing or invalid age is excluded from a selected band but included by Any', () => {
  assert.equal(isAgeInLeaderboardRange(null, 'U18'), false)
  assert.equal(isAgeInLeaderboardRange(-1, 'U18'), false)
  assert.equal(isAgeInLeaderboardRange(null, 'Any'), true)
})

test('available age bands are derived only from represented leaderboard players', () => {
  assert.deepEqual(getAvailableLeaderboardAgeRanges([9, 17, 30, null]), ['Any', 'U10', 'U18', '18+', '30+'])
})

test('descending values rank in mobile order', () => {
  assert.deepEqual(rankLeaderboardItems([3, 9, 4], (value) => value).map(({ value }) => value), [9, 4, 3])
})

test('ties retain stable source order and receive ordinal ranks', () => {
  const result = rankLeaderboardItems([{ id: 'first', value: 8 }, { id: 'second', value: 8 }], (item) => item.value)
  assert.deepEqual(result.map(({ item, rank }) => [item.id, rank]), [['first', 1], ['second', 2]])
})

test('zero leaderboard values are excluded', () => {
  assert.deepEqual(rankLeaderboardItems([0, 2], (value) => value).map(({ value }) => value), [2])
})

test('null, missing, NaN and infinite values are excluded', () => {
  const result = rankLeaderboardItems([null, undefined, Number.NaN, Number.POSITIVE_INFINITY, 1], (value) => value)
  assert.deepEqual(result.map(({ value }) => value), [1])
})

test('web selector consumes canonical mobile vocabulary instead of a local list', async () => {
  const source = await readFile(new URL('../src/routes/portal/StatsPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /ALL_LEADERBOARD_STAT_KEYS\.map/)
  assert.match(source, /LEADERBOARD_STAT_LABELS\[stat\]/)
  assert.doesNotMatch(source, /const ALL_LEADER_STATS/)
})

test('featured leaders aggregate by player game and apply mobile stat caps', async () => {
  const source = await readFile(new URL('../src/routes/portal/StatsPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /getLeaderboardPlayers\(filters, 'week', 'player_game'\)/)
  assert.match(source, /applyStatCaps: true/)
})

test('All Leaders loads the canonical population before applying dependent client filters', async () => {
  const source = await readFile(new URL('../src/routes/portal/StatsPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /getLeaderboardPlayers\(EMPTY_LEADERBOARD_FILTERS, rangeMode\)/)
  assert.match(source, /filterLeaderboardPlayers\(allPlayers, filters\)/)
})

test('position filtering is not invented because current mobile global leaderboards do not expose it', () => {
  assert.equal('position' in EMPTY_LEADERBOARD_FILTERS, false)
})

test('P0 official countability, Team Stats exclusion and dedup authority remain unchanged', async () => {
  const source = await readFile(new URL('../src/lib/portal-stats.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('v_official_counted_events_for_squad'\)/)
  assert.match(source, /neq\('tracker_mode', 'team_stats_game'\)/)
  assert.match(source, /dedupeOfficialLeaderboardEvents\(eventRows\)/)
})

test('modifier reconciliation remains the only leaderboard totals path', async () => {
  const source = await readFile(new URL('../src/lib/portal-stats.ts', import.meta.url), 'utf8')
  assert.match(source, /leaderboardStatsFromTotals\(\s*buildTotalsFromEvents\(/)
  assert.doesNotMatch(source, /EVENT_TO_STAT_KEY/)
})

test('loading, empty and request failure remain distinct page outcomes', async () => {
  const source = await readFile(new URL('../src/routes/portal/StatsPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading leaders…/)
  assert.match(source, /No leaders found/)
  assert.match(source, /allError/)
})
