import assert from 'node:assert/strict'
import test from 'node:test'
import type { LeaderboardRow } from '../src/lib/portal-stats.ts'
import { selectDashboardLeaders, leaderboardGradient } from '../src/lib/canonical/dashboard-leaderboard.ts'

const rows: LeaderboardRow[] = Array.from({ length: 12 }, (_, index) => ({ rank: index + 1, userId: `player-${index}`, playerName: `Player ${index}`, handle: null, avatarUrl: null, squadName: null, clubName: null, leagueName: null, games: 10, statValue: 100 - index, secondaryDisposals: 100 - index }))

test('club snapshot finds squad players outside the global top five and ranks within the club', () => {
  const selected = selectDashboardLeaders(rows, new Set(['player-7', 'player-10']))
  assert.deepEqual(selected.map((row) => [row.userId, row.rank, row.statValue]), [['player-7', 1, 93], ['player-10', 2, 90]])
  assert.equal(rows[7].rank, 8)
})
test('no squad members produces an empty club ranking instead of global leaders', () => {
  assert.deepEqual(selectDashboardLeaders(rows, new Set()), [])
})
test('All preserves global order and limits the snapshot to five', () => {
  assert.deepEqual(selectDashboardLeaders(rows).map((row) => row.userId), rows.slice(0, 5).map((row) => row.userId))
})
test('row gradients accept club hex colours and reject arbitrary CSS', () => {
  assert.match(leaderboardGradient('#FF0000', '#FFFFFF'), /#FF0000.*#FFFFFF/)
  assert.doesNotMatch(leaderboardGradient('url(https://example.com)', '#fff; color:red'), /url\(|color:red/)
})
