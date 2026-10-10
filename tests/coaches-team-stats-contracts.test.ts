import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildTeamStatsGameCards,
  buildTeamStatsGameRoute,
  canAccessTeamStatsGames,
  normalizeTeamStatsGameStatus,
  teamStatsGamesPollInterval,
  type TeamStatsGameRow,
} from '../src/lib/canonical/team-stats-games.ts'

const access = (overrides: Parameters<typeof canAccessTeamStatsGames>[0] = {}) => canAccessTeamStatsGames({ viewerUserId: 'viewer', ownerUserId: 'owner', isOfficial: false, membershipStatus: 'accepted', ...overrides })

test('custom squad owner can access', () => assert.equal(access({ viewerUserId: 'owner' }), true))
test('custom accepted admin can access', () => assert.equal(access({ membershipRole: 'admin' }), true))
test('custom accepted owner role can access', () => assert.equal(access({ membershipRole: 'owner' }), true))
test('custom coach is denied', () => assert.equal(access({ membershipRole: 'coach' }), false))
test('custom tracker is denied', () => assert.equal(access({ membershipRole: 'tracker' }), false))
test('ordinary member is denied', () => assert.equal(access({ membershipRole: 'member' }), false))
test('pending custom admin is denied', () => assert.equal(access({ membershipRole: 'admin', membershipStatus: 'pending' }), false))
test('guest without user identity is denied', () => assert.equal(access({ viewerUserId: null, membershipRole: 'admin' }), false))
test('unrelated authenticated user is denied', () => assert.equal(access(), false))
test('official club admin can access', () => assert.equal(access({ isOfficial: true, clubRoles: ['admin'] }), true))
test('official club coach can access', () => assert.equal(access({ isOfficial: true, clubRoles: ['coach'] }), true))
test('official club tracker is denied', () => assert.equal(access({ isOfficial: true, clubRoles: ['tracker'] }), false))
test('official squad admin alone is denied', () => assert.equal(access({ isOfficial: true, membershipRole: 'admin' }), false))
test('platform admin can access custom team', () => assert.equal(access({ isPlatformAdmin: true }), true))
test('standalone platform admin can access official team', () => assert.equal(access({ isOfficial: true, isPlatformAdmin: true }), true))

test('live status normalizes', () => assert.equal(normalizeTeamStatsGameStatus('in_progress'), 'Live'))
test('final status normalizes', () => assert.equal(normalizeTeamStatsGameStatus('completed'), 'Final'))
test('locked game normalizes final', () => assert.equal(normalizeTeamStatsGameStatus('live', true), 'Final'))
test('scheduled status is retained', () => assert.equal(normalizeTeamStatsGameStatus('scheduled'), 'Scheduled'))
test('unknown status safely normalizes scheduled', () => assert.equal(normalizeTeamStatsGameStatus('draft'), 'Scheduled'))

const rows: TeamStatsGameRow[] = [
  { id: 'live', opponent: 'Rivals', date: '2026-09-13', venue: 'Oval', round: 8, status: 'live', tracker_mode: 'team_stats_game', active_quarter: 3, game_squads: [{ squad_id: 'squad-1', team_side: 'home' }] },
  { id: 'final', opponent: 'Blues', date: '2026-09-12', status: 'final', tracker_mode: 'team_stats_game', game_squads: [{ squad_id: 'squad-1', team_side: 'away' }] },
  { id: 'scheduled', opponent: 'Future', date: '2026-09-20', status: 'scheduled', tracker_mode: 'team_stats_game', game_squads: [{ squad_id: 'squad-1', team_side: 'home' }] },
  { id: 'normal', tracker_mode: 'team_game', game_squads: [{ squad_id: 'squad-1', team_side: 'home' }] },
  { id: 'other', tracker_mode: 'team_stats_game', game_squads: [{ squad_id: 'squad-2', team_side: 'home' }] },
]
const cards = buildTeamStatsGameCards({
  rows,
  squadId: 'squad-1',
  resolveLogoUrl: (value) => value ? `public:${value}` : null,
  events: [
    { game_id: 'live', team_side: 'home', stat_key: 'G' },
    { game_id: 'live', team_side: 'home', stat_key: 'B' },
    { game_id: 'live', team_side: 'away', stat_key: 'G' },
    { game_id: 'live', team_side: 'away', stat_key: 'RB' },
  ],
})

test('list includes exact squad Team Stats Games', () => assert.deepEqual(new Set(cards.map((card) => card.id)), new Set(['live', 'final', 'scheduled'])))
test('normal player-attributed team game is excluded', () => assert.equal(cards.some((card) => card.id === 'normal'), false))
test('unrelated squad game is excluded', () => assert.equal(cards.some((card) => card.id === 'other'), false))
test('live Team Stats Game is included', () => assert.equal(cards.find((card) => card.id === 'live')?.status, 'Live'))
test('final Team Stats Game is included', () => assert.equal(cards.find((card) => card.id === 'final')?.status, 'Final'))
test('scheduled Team Stats Game is included', () => assert.equal(cards.find((card) => card.id === 'scheduled')?.status, 'Scheduled'))
test('game identity is preserved', () => assert.equal(cards.find((card) => card.id === 'live')?.opponent, 'Rivals'))
test('quarter is preserved from canonical game state', () => assert.equal(cards.find((card) => card.id === 'live')?.activeQuarter, 3))
test('side context is preserved', () => assert.equal(cards.find((card) => card.id === 'final')?.squadSide, 'away'))
test('home score uses goals and behinds', () => assert.deepEqual(cards.find((card) => card.id === 'live') && { goals: cards.find((card) => card.id === 'live')!.homeGoals, behinds: cards.find((card) => card.id === 'live')!.homeBehinds }, { goals: 1, behinds: 2 }))
test('away score excludes opposition rushed behind', () => assert.deepEqual(cards.find((card) => card.id === 'live') && { goals: cards.find((card) => card.id === 'live')!.awayGoals, behinds: cards.find((card) => card.id === 'live')!.awayBehinds }, { goals: 1, behinds: 0 }))
test('scheduled score remains absent without events', () => assert.equal(cards.find((card) => card.id === 'scheduled')?.homeGoals, null))
test('cards sort newest first', () => assert.deepEqual(cards.map((card) => card.id), ['scheduled', 'live', 'final']))

test('summary route preserves and encodes exact game id', () => assert.equal(buildTeamStatsGameRoute('game/a'), '/games/game%2Fa'))
test('summary route never uses player route', () => assert.equal(buildTeamStatsGameRoute('game-1').startsWith('/player/'), false))
test('live list polls at canonical interval', () => assert.equal(teamStatsGamesPollInterval(cards, true), 10_000))
test('hidden live list does not poll', () => assert.equal(teamStatsGamesPollInterval(cards, false), null))
test('final-only list does not poll', () => assert.equal(teamStatsGamesPollInterval(cards.filter((card) => card.status === 'Final'), true), null))
test('empty list does not poll', () => assert.equal(teamStatsGamesPollInterval([], true), null))

test('repository gates before querying exact Team Stats rows', async () => {
  const source = await readFile(new URL('../src/lib/team-stats-games.ts', import.meta.url), 'utf8')
  assert.match(source, /if \(!authorized\) return/)
  assert.match(source, /\.eq\('tracker_mode', 'team_stats_game'\)/)
  assert.match(source, /\.eq\('game_squads\.squad_id', squadId\)/)
  assert.match(source, /game_squads!inner/)
})

test('hook refreshes on focus and only polls live lists', async () => {
  const source = await readFile(new URL('../src/hooks/useTeamStatsGames.ts', import.meta.url), 'utf8')
  assert.match(source, /teamStatsGamesPollInterval/)
  assert.match(source, /window\.addEventListener\('focus'/)
  assert.match(source, /visibilitychange/)
})

test('Coaches states remain distinct', async () => {
  const source = await readFile(new URL('../src/components/squads/TeamStatsGamesPanel.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading Team Stats Games/)
  assert.match(source, /could not be loaded/)
  assert.match(source, /Coaches access required/)
  assert.match(source, /No Team Stats Games yet/)
})

test('unsupported creation and tracking controls are absent', async () => {
  const source = await readFile(new URL('../src/components/squads/TeamStatsGamesPanel.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, />\s*(Create|Start|Resume|Archive|Delete)\b/)
  assert.doesNotMatch(source, /team-stats-game\/(track|setup|create)/)
})

test('squad hub integrates a role-gated Coaches tab', async () => {
  const source = await readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /canAccessTeamStatsGames/)
  assert.match(source, /TeamStatsGamesPanel/)
  assert.match(source, /tab === 'coaches'/)
})

test('canonical summary defaults playerless games to Team', async () => {
  const source = await readFile(new URL('../src/routes/portal/GameSummaryPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /trackerMode === 'team_stats_game'\) setActiveTab\('team'\)/)
  assert.match(source, /showPlayers=\{summary\.trackerMode !== 'team_stats_game'\}/)
})

test('Team Stats live notification uses canonical summary route', async () => {
  const source = await readFile(new URL('../src/lib/portal-notification-routing.ts', import.meta.url), 'utf8')
  assert.match(source, /case 'official_game_live_started':[\s\S]*return route\(`\/games\/\$\{encodeURIComponent\(gameId\)\}`\)/)
})

test('Match Day, player history and squad activity retain Team Stats exclusions', async () => {
  const [matchDay, games, squad] = await Promise.all([
    readFile(new URL('../src/lib/portal-match-day.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/portal-games.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/SquadDetailPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(matchDay, /neq\('tracker_mode', 'team_stats_game'\)/)
  assert.match(games, /neq\('tracker_mode', 'team_stats_game'\)/)
  assert.match(squad, /neq\('tracker_mode', 'team_stats_game'\)/)
})

test('leaderboard retains Team Stats exclusion', async () => {
  const source = await readFile(new URL('../src/lib/portal-stats.ts', import.meta.url), 'utf8')
  assert.match(source, /neq\('tracker_mode', 'team_stats_game'\)/)
})

test('player groups are not coupled to Coaches repository', async () => {
  const source = await readFile(new URL('../src/lib/squad-player-groups.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /team-stats-games|TeamStatsGames/)
})

test('no Coaches runtime source references migrations', async () => {
  const files = await Promise.all([
    readFile(new URL('../src/lib/canonical/team-stats-games.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/team-stats-games.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/hooks/useTeamStatsGames.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/squads/TeamStatsGamesPanel.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(files.join('\n'), /migration|create table|alter table|create policy/i)
})
