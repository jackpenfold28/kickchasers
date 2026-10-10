import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  cursorForProfilePost,
  profilePostContext,
  profilePostDestination,
  profilePostKind,
  profilePostStats,
  profilePostTitle,
  sortAndDedupeProfilePosts,
  visibleProfilePostVisibilities,
  type ProfilePost,
} from '../src/lib/canonical/profile-posts.ts'

const post = (overrides: Partial<ProfilePost> = {}): ProfilePost => ({
  id: 'post-1', authorId: 'author-1', body: 'A post', imageUrl: null, gameId: null, manualGameId: null,
  squadId: null, type: null, payload: null, visibility: 'public', likeCount: 0, commentCount: 0,
  createdAt: '2026-09-06T10:00:00.000Z', updatedAt: null, ...overrides,
})

test('own profile visibility includes public and follower posts', () => assert.deepEqual(visibleProfilePostVisibilities({ mode: 'self', viewerId: 'author-1', authorId: 'author-1', isFollowing: false }), ['public', 'followers']))
test('other profile uses the exact supplied author identity', () => assert.deepEqual(visibleProfilePostVisibilities({ mode: 'public', viewerId: 'viewer-1', authorId: 'target-1', isFollowing: false }), ['public']))
test('target identity never falls back to signed-in viewer', () => assert.deepEqual(profilePostDestination(post({ type: 'player_stat_card', gameId: 'game-1' }), 'target-1'), { href: '/games/game-1?profileUserId=target-1', label: 'View player summary' }))
test('public posts are visible to an unrelated viewer', () => assert.deepEqual(visibleProfilePostVisibilities({ mode: 'public', viewerId: 'viewer-1', authorId: 'author-1', isFollowing: false }), ['public']))
test('followers gain follower-only posts', () => assert.deepEqual(visibleProfilePostVisibilities({ mode: 'public', viewerId: 'viewer-1', authorId: 'author-1', isFollowing: true }), ['public', 'followers']))
test('author viewing public route retains own follower posts', () => assert.deepEqual(visibleProfilePostVisibilities({ mode: 'public', viewerId: 'author-1', authorId: 'author-1', isFollowing: false }), ['public', 'followers']))

test('player stat recap resolves as a supported type', () => assert.equal(profilePostKind(post({ type: 'player_stat_card', gameId: 'game-1' })), 'player-stat'))
test('manual recap resolves from canonical type', () => assert.equal(profilePostKind(post({ type: 'manual_game_summary' })), 'manual-game'))
test('manual recap resolves from stable manual game id', () => assert.equal(profilePostKind(post({ manualGameId: 'manual-1' })), 'manual-game'))
test('team selection remains profile-eligible like mobile', () => assert.equal(profilePostKind(post({ type: 'team_selection' })), 'team-selection'))
test('tracked attributable game resolves as tracked recap', () => assert.equal(profilePostKind(post({ gameId: 'game-1' })), 'tracked-game'))
test('unsupported post types degrade to a generic post', () => assert.equal(profilePostKind(post({ type: 'future_activity' })), 'generic'))
test('unsupported post title fails gracefully', () => assert.equal(profilePostTitle(post({ type: 'future_activity' })), 'Post'))

test('tracked player post opens the canonical player summary', () => assert.equal(profilePostDestination(post({ type: 'player_stat_card', gameId: 'game/1' }), 'author/1')?.href, '/games/game%2F1?profileUserId=author%2F1'))
test('tracked team post opens the canonical game summary', () => assert.equal(profilePostDestination(post({ gameId: 'game-1' }), 'author-1')?.href, '/games/game-1'))
test('manual post opens the canonical manual summary', () => assert.equal(profilePostDestination(post({ type: 'manual_game_summary', manualGameId: 'manual-1' }), 'author-1')?.href, '/games/manual/manual-1'))
test('team selection opens the best supported team activity destination', () => assert.equal(profilePostDestination(post({ type: 'team_selection', squadId: 'squad-1' }), 'author-1')?.href, '/teams/squad-1?tab=activity'))
test('missing destination identifiers do not fabricate a route', () => assert.equal(profilePostDestination(post({ type: 'manual_game_summary' }), 'author-1'), null))
test('stable game/player identity is preserved independently', () => assert.equal(profilePostDestination(post({ type: 'player_stat_card', gameId: 'game-2' }), 'player-9')?.href, '/games/game-2?profileUserId=player-9'))

test('posts order newest first', () => assert.deepEqual(sortAndDedupeProfilePosts([post({ id: 'old', createdAt: '2026-01-01' }), post({ id: 'new', createdAt: '2026-02-01' })]).map((item) => item.id), ['new', 'old']))
test('equal timestamps use a stable descending id tie-breaker', () => assert.deepEqual(sortAndDedupeProfilePosts([post({ id: 'a' }), post({ id: 'b' })]).map((item) => item.id), ['b', 'a']))
test('pagination merge removes duplicate rows by post id', () => assert.equal(sortAndDedupeProfilePosts([post(), post(), post({ id: 'post-2' })]).length, 2))
test('cursor preserves the stable compound boundary', () => assert.deepEqual(cursorForProfilePost(post()), { createdAt: '2026-09-06T10:00:00.000Z', id: 'post-1' }))
test('payload context uses only present canonical values', () => assert.deepEqual(profilePostContext({ opponent_name: 'Tigers', round_label: 'Round 7' }), ['vs Tigers', 'Round 7']))
test('nested mobile payload context resolves team-selection identity', () => assert.deepEqual(profilePostContext({ opponent: { name: 'Tigers' }, match: { round_label: 'Round 7' }, side: { label: 'Seniors' } }), ['vs Tigers', 'Round 7', 'Seniors']))
test('manual payload exposes available headline stats without inventing values', () => assert.deepEqual(profilePostStats({ stats: { disposals: 21, g: 2, t: 4, af: 88 } }), [{ label: 'Disposals', value: 21 }, { label: 'Goals', value: 2 }, { label: 'Tackles', value: 4 }, { label: 'AF', value: 88 }]))
test('unknown payload fields do not invent card content', () => assert.deepEqual(profilePostContext({ arbitrary: 12 }), []))

test('repository scopes reads to exact author, hidden state, visibility and stable pagination', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /\.eq\('author_id', authorId\)/)
  assert.match(source, /\.is\('hidden_at', null\)/)
  assert.match(source, /\.in\('visibility', visibility\)/)
  assert.match(source, /\.order\('created_at', \{ ascending: false \}\)/)
  assert.match(source, /\.order\('id', \{ ascending: false \}\)/)
  assert.match(source, /requestLimit \+ 1/)
})

test('blocked relationship is checked before the post query', async () => {
  const repository = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(repository, /rpc\('f_users_blocked'/)
  const source = repository.slice(repository.indexOf('export async function listProfilePosts'))
  assert.ok(source.indexOf('await usersAreBlocked') < source.indexOf(".from('posts')"))
})

test('viewer-reported posts are excluded using the existing moderation contract', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('post_reports'\)/)
  assert.match(source, /\.eq\('reporter_user_id', viewerId\)/)
  assert.match(source, /query\.not\('id', 'in'/)
})

test('profile loading, blocked, empty and request failure states are distinct', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading posts\.\.\./)
  assert.match(source, /Posts are unavailable for this profile\./)
  assert.match(source, /No posts yet\./)
  assert.match(source, /Unable to load posts right now\./)
})

test('profile uses repository hook and shared renderer instead of raw post queries', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /useProfilePosts/)
  assert.match(source, /PostActivityCard/)
  assert.doesNotMatch(source, /from\('posts'\)/)
})

test('existing stats and game log implementations remain wired', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /<AllStats summaries=/)
  assert.match(source, /<AllGames games=/)
  assert.match(source, /onOpenGame/)
})

test('profile posts do not add a second like or comment mutation system', async () => {
  const source = await readFile(new URL('../src/components/portal/PostActivityCard.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /insert\(|update\(|delete\(|rpc\(/)
})

test('profile posts make no backend or migration changes', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /create table|alter table|create policy|migration/i)
})
