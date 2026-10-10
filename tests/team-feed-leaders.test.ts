import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { buildTeamLeaders, formatTeamFeedRound, type TeamLeaderEvent } from '../src/lib/canonical/team-feed-leaders.ts'
import { computeGameRatingImpact7 } from '../src/lib/canonical/stats-eval.ts'
import { currentSeason } from '../src/lib/canonical/benchmarks.ts'

const event = (overrides: Partial<TeamLeaderEvent> = {}): TeamLeaderEvent => ({ stat_key: 'K', quarter: 1, team_side: 'home', player_number: 1, profile_user_id: null, player_display_name: 'Alex', ...overrides })
const build = (events: TeamLeaderEvent[], both = false) => buildTeamLeaders(events, both, new Map(), new Map())

test('team rankings use real aggregated kicks and handballs, not post prose', () => {
  const rows = build([event(), event({ stat_key: 'HB' }), event({ stat_key: 'G' })])
  assert.equal(rows.disposals[0].disposals, 2)
  assert.equal(rows.scorers[0].goals, 1)
  assert.ok(Number.isFinite(rows.ratings[0].rating))
})
test('home-only tracking excludes opponent and unknown-side events', () => {
  assert.equal(build([event({ team_side: 'away' }), event({ team_side: null })]).disposals.length, 0)
})
test('same guest name and jumper on opposing teams remain separate', () => {
  const rows = build([event(), event({ team_side: 'away' })], true)
  assert.equal(rows.disposals.length, 2)
  assert.notEqual(rows.disposals[0].key, rows.disposals[1].key)
})
test('rankings are bounded to the top five and sorted by disposals', () => {
  const rows = build(Array.from({ length: 8 }, (_, i) => Array.from({ length: i + 1 }, () => event({ player_number: i, player_display_name: `Player ${i}` }))).flat())
  assert.deepEqual(rows.disposals.map((row) => row.disposals), [8, 7, 6, 5, 4])
})
test('scorers sort by goals then behinds, with name as the tie-breaker', () => {
  const rows = build([event({ stat_key: 'G', player_display_name: 'Zed' }), event({ stat_key: 'G', player_display_name: 'Beth' }), event({ stat_key: 'B', player_display_name: 'Beth' }), event({ stat_key: 'G', player_display_name: 'Amy' })])
  assert.deepEqual(rows.scorers.map((row) => row.name), ['Beth', 'Amy', 'Zed'])
})
test('empty game produces honest empty rankings', () => {
  assert.deepEqual(build([]), { ratings: [], disposals: [], scorers: [] })
})
test('profile metadata takes precedence over guest display names', () => {
  const rows = buildTeamLeaders([event({ profile_user_id: 'player' })], false, new Map([['player', { name: 'Registered Player', position: 'MID' }]]), new Map())
  assert.equal(rows.disposals[0].name, 'Registered Player')
})

test('a registered player changing jumpers retains all their game events', () => {
  const rows = build([event({ profile_user_id: 'player', player_number: 1 }), event({ profile_user_id: 'player', player_number: 2 })])
  assert.equal(rows.disposals[0].disposals, 2)
})

test('team feed uses the mobile finals labels', () => {
  assert.equal(formatTeamFeedRound(105), 'Grand Final')
  assert.equal(formatTeamFeedRound('SF'), 'Semi Final')
  assert.equal(formatTeamFeedRound(12), 'Round 12')
  assert.equal(formatTeamFeedRound(null), null)
})

test('team feed ratings preserve the native mark and disposal variant adapter', () => {
  const rows = build([event(), event({ stat_key: 'K_EF' }), event({ stat_key: 'MC' }), event({ stat_key: 'MUC' })])
  assert.equal(rows.disposals[0].disposals, 2)
  assert.equal(rows.ratings[0].rating, computeGameRatingImpact7({ disposals: 2, marks: 2, hitouts: 0, tackles: 0, goals: 0, behinds: 0, fantasy_points: 12, frees_for: 0, frees_against: 0 }, currentSeason, 'Default'))
})

test('team artwork exposes four ordered slides and keeps controls outside the expansion button', async () => {
  const source = await readFile(new URL('../src/components/dashboard/TeamFeedArtwork.tsx', import.meta.url), 'utf8')
  const feed = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /\['Final score', 'Top ratings', 'Top disposals', 'Top scorers'\]/)
  assert.match(source, /aria-pressed=\{page === index\}/)
  assert.match(feed, /<\/button>\s*\{hasTeamArtwork\(post\) \? <TeamFeedNavigation/)
  assert.match(feed, /initialPage=\{selectedPage\}/)
})
