export type ProfilePostVisibility = 'public' | 'followers'

export type ProfilePostCursor = {
  createdAt: string
  id: string
}

export type ProfilePostKind = 'player-stat' | 'manual-game' | 'tracked-game' | 'team-selection' | 'generic'

export type ProfilePost = {
  id: string
  authorId: string
  authorName?: string | null
  authorAvatarUrl?: string | null
  body: string | null
  imageUrl: string | null
  gameId: string | null
  manualGameId: string | null
  squadId: string | null
  type: string | null
  payload: Record<string, unknown> | null
  visibility: ProfilePostVisibility
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string | null
  gameContext?: {
    opponent: string | null
    round: string | number | null
    venue: string | null
    date: string | null
    homeName: string | null
    awayName: string | null
    homeGoals: number
    homeBehinds: number
    awayGoals: number
    awayBehinds: number
    homeLogoUrl?: string | null
    awayLogoUrl?: string | null
    homeColor?: string | null
    awayColor?: string | null
    leagueName?: string | null
  } | null
}

export type ProfilePostDestination = {
  href: string
  label: string
}

export const PROFILE_POST_PAGE_LIMIT = 20
export const DASHBOARD_COMMUNITY_POST_LIMIT = 20

const asText = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null)

export function profilePostKind(post: Pick<ProfilePost, 'type' | 'gameId' | 'manualGameId'>): ProfilePostKind {
  if (post.type === 'player_stat_card') return 'player-stat'
  if (post.type === 'manual_game_summary' || post.manualGameId) return 'manual-game'
  if (post.type === 'team_selection') return 'team-selection'
  if (post.gameId) return 'tracked-game'
  return 'generic'
}

export function profilePostDestination(
  post: Pick<ProfilePost, 'type' | 'gameId' | 'manualGameId' | 'squadId'>,
  authorId: string,
): ProfilePostDestination | null {
  const kind = profilePostKind(post)
  if (kind === 'manual-game' && post.manualGameId) {
    return { href: `/games/manual/${encodeURIComponent(post.manualGameId)}`, label: 'View game recap' }
  }
  if (kind === 'player-stat' && post.gameId) {
    return {
      href: `/games/${encodeURIComponent(post.gameId)}?profileUserId=${encodeURIComponent(authorId)}`,
      label: 'View player summary',
    }
  }
  if (kind === 'tracked-game' && post.gameId) {
    return { href: `/games/${encodeURIComponent(post.gameId)}`, label: 'View game recap' }
  }
  if (kind === 'team-selection' && post.squadId) {
    return { href: `/teams/${encodeURIComponent(post.squadId)}?tab=activity`, label: 'View team activity' }
  }
  return null
}

export function profilePostAuthorDestination(authorId: string, viewerId: string): string {
  return authorId === viewerId ? '/profile' : `/users/${encodeURIComponent(authorId)}`
}

export function profilePostTitle(post: Pick<ProfilePost, 'type' | 'gameId' | 'manualGameId'>): string {
  switch (profilePostKind(post)) {
    case 'player-stat': return 'Player stat recap'
    case 'manual-game': return 'Manual game recap'
    case 'tracked-game': return 'Team game recap'
    case 'team-selection': return 'Team selection'
    default: return 'Post'
  }
}

export function profilePostContext(payload: Record<string, unknown> | null): string[] {
  if (!payload) return []
  const match = (payload.match && typeof payload.match === 'object' ? payload.match : null) as Record<string, unknown> | null
  const opponentObject = (payload.opponent && typeof payload.opponent === 'object' ? payload.opponent : null) as Record<string, unknown> | null
  const sideObject = (payload.side && typeof payload.side === 'object' ? payload.side : null) as Record<string, unknown> | null
  const opponent = asText(payload.opponent_name) ?? asText(payload.opponent) ?? asText(opponentObject?.name) ?? asText(match?.opponent_name) ?? asText(match?.opponent)
  const round = asText(payload.round_label) ?? asText(payload.round) ?? asText(match?.round_label) ?? asText(match?.round)
  const side = asText(payload.side_name) ?? asText(payload.team_side) ?? asText(payload.group_name) ?? asText(sideObject?.label)
  return [opponent ? `vs ${opponent}` : null, round, side].filter((value): value is string => Boolean(value))
}

export function profilePostStats(payload: Record<string, unknown> | null): Array<{ label: string; value: number }> {
  const stats = (payload?.stats && typeof payload.stats === 'object' ? payload.stats : null) as Record<string, unknown> | null
  if (!stats) return []
  const definitions = [
    { label: 'Disposals', keys: ['disposals', 'd'] },
    { label: 'Goals', keys: ['goals', 'g'] },
    { label: 'Tackles', keys: ['tackles', 't'] },
    { label: 'AF', keys: ['af', 'fantasy', 'fantasy_points'] },
  ]
  return definitions.flatMap(({ label, keys }) => {
    const raw = keys.map((key) => stats[key]).find((value) => value != null)
    const value = Number(raw)
    return Number.isFinite(value) ? [{ label, value }] : []
  })
}

export function sortAndDedupeProfilePosts(posts: ProfilePost[]): ProfilePost[] {
  const byId = new Map<string, ProfilePost>()
  posts.forEach((post) => {
    if (!byId.has(post.id)) byId.set(post.id, post)
  })
  return Array.from(byId.values()).sort((left, right) => {
    const timeOrder = right.createdAt.localeCompare(left.createdAt)
    return timeOrder || right.id.localeCompare(left.id)
  })
}

export function selectDashboardCommunityPosts({
  posts,
  viewerId,
  followedAuthorIds,
  blockedUserIds,
  reportedPostIds,
  limit = DASHBOARD_COMMUNITY_POST_LIMIT,
}: {
  posts: ProfilePost[]
  viewerId: string
  followedAuthorIds: ReadonlySet<string>
  blockedUserIds: ReadonlySet<string>
  reportedPostIds: ReadonlySet<string>
  limit?: number
}): ProfilePost[] {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 0), DASHBOARD_COMMUNITY_POST_LIMIT)
  return sortAndDedupeProfilePosts(posts)
    .filter((post) => {
      const isSelf = post.authorId === viewerId
      const isFollowed = followedAuthorIds.has(post.authorId)
      if (blockedUserIds.has(post.authorId) || reportedPostIds.has(post.id)) return false
      return post.visibility === 'public' || (post.visibility === 'followers' && (isSelf || isFollowed))
    })
    .slice(0, safeLimit)
}

export function cursorForProfilePost(post: Pick<ProfilePost, 'createdAt' | 'id'>): ProfilePostCursor {
  return { createdAt: post.createdAt, id: post.id }
}

export function visibleProfilePostVisibilities({
  mode,
  viewerId,
  authorId,
  isFollowing,
}: {
  mode: 'self' | 'public'
  viewerId: string | null
  authorId: string
  isFollowing: boolean
}): ProfilePostVisibility[] {
  if (mode === 'self' || viewerId === authorId || isFollowing) return ['public', 'followers']
  return ['public']
}
