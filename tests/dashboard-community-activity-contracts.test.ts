import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DASHBOARD_COMMUNITY_POST_LIMIT,
  profilePostAuthorDestination,
  profilePostDestination,
  profilePostKind,
  selectDashboardCommunityPosts,
  type ProfilePost,
} from '../src/lib/canonical/profile-posts.ts'

const post = (overrides: Partial<ProfilePost> = {}): ProfilePost => ({
  id: 'post-1', authorId: 'viewer-1', authorName: 'Viewer', authorAvatarUrl: null,
  body: 'Match recap', imageUrl: null, gameId: null, manualGameId: null, squadId: null,
  type: null, payload: null, visibility: 'public', likeCount: 2, commentCount: 1,
  createdAt: '2026-09-10T10:00:00.000Z', updatedAt: null, ...overrides,
})

const select = (posts: ProfilePost[], overrides: Partial<Parameters<typeof selectDashboardCommunityPosts>[0]> = {}) =>
  selectDashboardCommunityPosts({
    posts,
    viewerId: 'viewer-1',
    followedAuthorIds: new Set(['followed-1']),
    blockedUserIds: new Set(),
    reportedPostIds: new Set(),
    ...overrides,
  })

test('Dashboard feed pages contain twenty posts', () => assert.equal(DASHBOARD_COMMUNITY_POST_LIMIT, 20))
test('signed-in user posts are eligible', () => assert.deepEqual(select([post()]).map((item) => item.id), ['post-1']))
test('followed-author posts are eligible', () => assert.equal(select([post({ authorId: 'followed-1' })]).length, 1))
test('public posts from unfollowed authors are eligible', () => assert.equal(select([post({ authorId: 'stranger-1' })]).length, 1))
test('followers-only posts from unfollowed authors remain excluded', () => assert.equal(select([post({ authorId: 'stranger-1', visibility: 'followers' })]).length, 0))
test('result never exceeds one page', () => assert.equal(select(Array.from({ length: 25 }, (_, id) => post({ id: `post-${id}` }))).length, 20))
test('caller cannot raise the bounded limit', () => assert.equal(select(Array.from({ length: 60 }, (_, id) => post({ id: `post-${id}` })), { limit: 50 }).length, 20))
test('zero limit returns no posts', () => assert.equal(select([post()], { limit: 0 }).length, 0))
test('posts retain stable recent-first ordering', () => assert.deepEqual(select([post({ id: 'old', createdAt: '2026-01-01' }), post({ id: 'new', createdAt: '2026-02-01' })]).map((item) => item.id), ['new', 'old']))
test('duplicate post ids are removed', () => assert.equal(select([post(), post()]).length, 1))
test('exact author identity survives selection', () => assert.equal(select([post({ authorId: 'followed-1', authorName: 'Alex', authorAvatarUrl: '/avatar.png' })])[0]?.authorName, 'Alex'))

test('blocked author is excluded', () => assert.equal(select([post({ authorId: 'followed-1' })], { blockedUserIds: new Set(['followed-1']) }).length, 0))
test('viewer-reported post is excluded', () => assert.equal(select([post()], { reportedPostIds: new Set(['post-1']) }).length, 0))
test('public followed post is visible', () => assert.equal(select([post({ authorId: 'followed-1', visibility: 'public' })]).length, 1))
test('followers-only followed post is visible', () => assert.equal(select([post({ authorId: 'followed-1', visibility: 'followers' })]).length, 1))
test('followers-only self post is visible', () => assert.equal(select([post({ visibility: 'followers' })]).length, 1))
test('discovery reads posts under RLS and excludes hidden rows', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('posts'\)/)
  assert.match(source, /\.is\('hidden_at', null\)/)
})
test('repository applies either-direction block rows and viewer reports', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /blocker_user_id\.eq\.\$\{viewerId\},blocked_user_id\.eq\.\$\{viewerId\}/)
  assert.match(source, /reportedPostIds: access\.reportedIds/)
})

test('player recap remains a shared canonical type', () => assert.equal(profilePostKind(post({ type: 'player_stat_card', gameId: 'game-1' })), 'player-stat'))
test('manual recap remains a shared canonical type', () => assert.equal(profilePostKind(post({ type: 'manual_game_summary', manualGameId: 'manual-1' })), 'manual-game'))
test('tracked team recap remains a shared canonical type', () => assert.equal(profilePostKind(post({ gameId: 'game-1' })), 'tracked-game'))
test('Team Selection remains a shared canonical type', () => assert.equal(profilePostKind(post({ type: 'team_selection', squadId: 'squad-1' })), 'team-selection'))
test('unknown backend type degrades safely', () => assert.equal(profilePostKind(post({ type: 'future-post' })), 'generic'))
test('missing media remains a valid selected post', () => assert.equal(select([post({ imageUrl: null })]).length, 1))
test('social counts survive canonical selection', () => assert.deepEqual(select([post({ likeCount: 8, commentCount: 3 })]).map(({ likeCount, commentCount }) => [likeCount, commentCount]), [[8, 3]]))

test('own author opens own profile route', () => assert.equal(profilePostAuthorDestination('viewer-1', 'viewer-1'), '/profile'))
test('another author opens exact encoded public profile route', () => assert.equal(profilePostAuthorDestination('author/1', 'viewer-1'), '/users/author%2F1'))
test('player recap opens exact player/game summary', () => assert.equal(profilePostDestination(post({ type: 'player_stat_card', gameId: 'game-1' }), 'followed-1')?.href, '/games/game-1?profileUserId=followed-1'))
test('tracked recap opens exact game summary', () => assert.equal(profilePostDestination(post({ gameId: 'game-1' }), 'followed-1')?.href, '/games/game-1'))
test('manual recap opens exact manual summary', () => assert.equal(profilePostDestination(post({ type: 'manual_game_summary', manualGameId: 'manual-1' }), 'followed-1')?.href, '/games/manual/manual-1'))
test('Team Selection opens exact squad activity', () => assert.equal(profilePostDestination(post({ type: 'team_selection', squadId: 'squad-1' }), 'followed-1')?.href, '/teams/squad-1?tab=activity'))
test('unsupported content never fabricates a destination', () => assert.equal(profilePostDestination(post({ type: 'future-post' }), 'followed-1'), null))

test('repository uses one canonical row normalizer for Dashboard and Profile Posts', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /export function normalizeProfilePostRow/)
  assert.ok((source.match(/map\(normalizeProfilePostRow\)/g) ?? []).length >= 2)
})
test('repository bounds each feed page', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /Math\.min\([\s\S]*DASHBOARD_COMMUNITY_POST_LIMIT\)/)
  assert.match(source, /\.limit\(requestLimit\)/)
  assert.match(source, /createdAt: rows\[rows.length - 1\].created_at/)
  assert.match(source, /created_at\.lt\./)
})

test('feed follow controls exclude self and followed authors and reuse the profile follow contract', async () => {
  const component = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  const hook = await readFile(new URL('../src/hooks/useDashboardCommunityActivity.ts', import.meta.url), 'utf8')
  assert.match(component, /post.authorId !== viewerId && !activity.followedAuthorIds.has\(post.authorId\)/)
  assert.match(component, /aria-label=\{`Follow \$\{author\}`\}/)
  assert.match(hook, /setProfileFollowing\(authorId, viewerId, true\)/)
  assert.match(hook, /pendingFollows.current.has\(authorId\)/)
  assert.match(hook, /sortAndDedupeProfilePosts\(\[...current, ...next.items\]\)/)
})
test('discovery author identity is hydrated in one batch', async () => {
  const source = await readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('profiles_directory'\)\.select\('user_id,name,avatar_url,avatar_path'\)\.in\('user_id', authorIds\)/)
})
test('stored media is lazy loaded with accessible alt and failure treatment', async () => {
  const source = await readFile(new URL('../src/components/portal/PostActivityCard.tsx', import.meta.url), 'utf8')
  assert.match(source, /loading="lazy"/)
  assert.match(source, /shared by \$\{authorName\}/)
  assert.match(source, /Stored activity image unavailable/)
})
test('likes and comments remain read-only counts', async () => {
  const source = await readFile(new URL('../src/components/portal/PostActivityCard.tsx', import.meta.url), 'utf8')
  assert.match(source, /post\.likeCount/)
  assert.match(source, /post\.commentCount/)
  assert.doesNotMatch(source, /insert\(|update\(|delete\(|rpc\(/)
})

test('loading state is local to Community Activity', async () => {
  const source = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading community activity/)
  assert.match(source, /aria-busy="true"/)
})
test('empty state explains the bounded stream', async () => {
  const source = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /No recent community activity yet/)
})
test('request error is isolated and announced', async () => {
  const source = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /role="alert"/)
  assert.match(source, /other Dashboard information is still available/)
})
test('retry invokes only the activity refresh function', async () => {
  const source = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /activity\.refresh\(\)/)
  assert.doesNotMatch(source, /loadDashboardData|window\.location\.reload/)
})
test('activity refreshes on focus without polling', async () => {
  const source = await readFile(new URL('../src/hooks/useDashboardCommunityActivity.ts', import.meta.url), 'utf8')
  assert.match(source, /addEventListener\('focus'/)
  assert.doesNotMatch(source, /setInterval|setTimeout/)
})
test('stale responses cannot replace newer activity', async () => {
  const source = await readFile(new URL('../src/hooks/useDashboardCommunityActivity.ts', import.meta.url), 'utf8')
  assert.match(source, /currentRequest !== requestId\.current/)
})
test('activity recaps use a narrow-safe swipe carousel', async () => {
  const source = await readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8')
  assert.match(source, /snap-x snap-mandatory/ )
  assert.match(source, /aria-roledescription="carousel"/)
  assert.match(source, /aria-haspopup="dialog"/)
  assert.match(source, /showModal\(\)/)
  assert.match(source, /event\.preventDefault\(\); close\(\)/)
})

test('Dashboard places the Feed after the hero and inbox, before overview modules', async () => {
  const source = await readFile(new URL('../src/routes/portal/DashboardPage.tsx', import.meta.url), 'utf8')
  const page = source.slice(source.indexOf('<section className="grid gap-6">'))
  const markers = ['<Quick6SummaryCard', '<MatchScoreCard', 'title="Action Inbox"', '<DashboardCommunityActivity', 'title="Recent Games"', 'title="My Squads"', 'title="Profile Snapshot"', 'title="Live Around Me"', 'title="Leaderboard Snapshot"', 'title="Portal Activity"']
  let previous = -1
  for (const marker of markers) {
    const position = page.indexOf(marker)
    assert.ok(position > previous, `${marker} must remain present and in order`)
    previous = position
  }
})

test('Dashboard tidy stays within the approved external layout boundaries', async () => {
  const source = await readFile(new URL('../src/routes/portal/DashboardPage.tsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/components/layout/PortalLayout.tsx', import.meta.url), 'utf8')
  assert.match(source, /grid grid-cols-2 gap-2\.5 xl:grid-cols-/)
  assert.equal((source.match(/grid items-start gap-6 xl:grid-cols-/g) ?? []).length, 1)
  assert.match(source, /grid items-stretch gap-6 xl:grid-cols-/)
  assert.match(source, /data\.squads\.slice\(0, 3\)/)
  assert.match(shell, /max-w-\[1320px\]/)
  assert.match(shell, /px-3 py-4 sm:px-6 sm:py-6 lg:py-8/)
})

test('Dashboard keeps its core modules and adds Community Activity', async () => {
  const source = await readFile(new URL('../src/routes/portal/DashboardPage.tsx', import.meta.url), 'utf8')
  for (const marker of ['Quick6SummaryCard', 'Action Inbox', 'Recent Games', 'My Squads', 'Profile Snapshot', 'Live Around Me', 'Leaderboard Snapshot', 'DashboardCommunityActivity']) assert.match(source, new RegExp(marker))
})
test('operational activity stays separate from community posts', async () => {
  const source = await readFile(new URL('../src/routes/portal/DashboardPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /title="Portal Activity"/)
  assert.doesNotMatch(source, /title="Recent Activity"/)
})
test('Profile Posts continues to use its existing hook and shared card', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /useProfilePosts/)
  assert.match(source, /PostActivityCard/)
})
test('Player Card Album remains wired', async () => assert.match(await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8'), /PlayerCardAlbum/))
test('Match Day remains wired independently', async () => assert.match(await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'), /MatchDayPage/))
test('Notifications remain wired independently', async () => assert.match(await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'), /NotificationsPage/))
test('feed selection and rendering contain no direct database mutations or backend definitions', async () => {
  const files = await Promise.all([
    readFile(new URL('../src/lib/profile-posts.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/dashboard/DashboardCommunityActivity.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(files.join('\n'), /\.insert\(|\.update\(|\.delete\(|create table|alter table|create policy/i)
})

test('feed likes use the existing post and viewer identity contract', async () => {
  const source = await readFile(new URL('../src/lib/post-likes.ts', import.meta.url), 'utf8')
  assert.match(source, /insert\(\{ post_id: postId, user_id: viewerId \}\)/)
  assert.match(source, /delete\(\)\.eq\('post_id', postId\)\.eq\('user_id', viewerId\)/)
  assert.match(source, /if \(result.error\) throw result.error/)
  assert.doesNotMatch(source, /create table|alter table|create policy|service_role/i)
})

test('expanded community comments remain scoped and preserve moderation', async () => {
  const source = await readFile(new URL('../src/lib/post-comments.ts', import.meta.url), 'utf8')
  assert.match(source, /from\('post_comments'\)[^\n]+eq\('post_id', postId\)/)
  assert.match(source, /blocked\.has\(row\.author_id\)/)
  assert.match(source, /reported\.has\(row\.id\)/)
  assert.match(source, /from\('comment_reports'\)[^\n]+eq\('reporter_user_id', viewerId\)/)
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/)
})
