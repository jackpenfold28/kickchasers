import {
  DASHBOARD_COMMUNITY_POST_LIMIT,
  PROFILE_POST_PAGE_LIMIT,
  cursorForProfilePost,
  selectDashboardCommunityPosts,
  visibleProfilePostVisibilities,
  type ProfilePost,
  type ProfilePostCursor,
  type ProfilePostVisibility,
} from '@/lib/canonical/profile-posts'
import { supabase } from '@/lib/supabase'
import { resolveLogoPublicUrl } from '@/lib/logo-storage'

export type ProfilePostAccess = 'visible' | 'blocked'

export type ProfilePostPage = {
  items: ProfilePost[]
  nextCursor: ProfilePostCursor | null
  hasMore: boolean
  access: ProfilePostAccess
}

export type CanonicalPostRow = {
  id: string
  author_id: string
  author_name?: string | null
  author_avatar_url?: string | null
  author_avatar_path?: string | null
  body: string | null
  image_url: string | null
  game_id: string | null
  manual_game_id: string | null
  squad_id: string | null
  type: string | null
  payload: Record<string, unknown> | null
  visibility: ProfilePostVisibility
  like_count: number | null
  comment_count: number | null
  created_at: string
  updated_at: string | null
}

type GameContext = NonNullable<ProfilePost['gameContext']>

export function resolvePostImageUrl(input: string | null) {
  if (!input || /^https?:\/\//i.test(input)) return input
  const cleaned = input.replace(/^\/+/, '')
  const explicit = cleaned.match(/^([^:]+)::(.+)$/)
  if (explicit) return supabase.storage.from(explicit[1]).getPublicUrl(explicit[2]).data.publicUrl || input
  const [bucket, ...path] = cleaned.split('/')
  if (bucket && path.length) return supabase.storage.from(bucket).getPublicUrl(path.join('/')).data.publicUrl || input
  return input
}

export function normalizeProfilePostRow(row: CanonicalPostRow): ProfilePost {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? null,
    authorAvatarUrl: row.author_avatar_url
      ? resolvePostImageUrl(row.author_avatar_url)
      : row.author_avatar_path
        ? supabase.storage.from('profile-avatars').getPublicUrl(row.author_avatar_path).data.publicUrl
        : null,
    body: row.body,
    imageUrl: resolvePostImageUrl(row.image_url),
    gameId: row.game_id,
    manualGameId: row.manual_game_id,
    squadId: row.squad_id,
    type: row.type,
    payload: row.payload,
    visibility: row.visibility,
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function usersAreBlocked(viewerId: string | null, authorId: string): Promise<boolean> {
  if (!viewerId || viewerId === authorId) return false
  const { data, error } = await supabase.rpc('f_users_blocked', { a: viewerId, b: authorId })
  if (error) throw error
  return data === true
}

async function viewerFollowsAuthor(viewerId: string | null, authorId: string): Promise<boolean> {
  if (!viewerId || viewerId === authorId) return false
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', viewerId)
    .eq('followee_id', authorId)
    .limit(1)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  return Boolean(data?.followee_id)
}

async function reportedPostIds(viewerId: string | null): Promise<Set<string>> {
  if (!viewerId) return new Set()
  const { data, error } = await supabase.from('post_reports').select('post_id').eq('reporter_user_id', viewerId)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.post_id).filter((id): id is string => Boolean(id)))
}

async function dashboardCommunityAccess(viewerId: string) {
  const [followsResult, blocksResult, reportedIds] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', viewerId),
    supabase
      .from('user_blocks')
      .select('blocker_user_id,blocked_user_id')
      .or(`blocker_user_id.eq.${viewerId},blocked_user_id.eq.${viewerId}`),
    reportedPostIds(viewerId),
  ])
  if (followsResult.error) throw followsResult.error
  if (blocksResult.error) throw blocksResult.error

  const followedAuthorIds = new Set(
    (followsResult.data ?? []).map((row) => row.followee_id).filter((id): id is string => Boolean(id)),
  )
  const blockedUserIds = new Set<string>()
  ;(blocksResult.data ?? []).forEach((row) => {
    const otherId = row.blocker_user_id === viewerId ? row.blocked_user_id : row.blocker_user_id
    if (otherId) blockedUserIds.add(otherId)
  })
  return { followedAuthorIds, blockedUserIds, reportedIds }
}

async function hydrateTrackedGameContexts(items: ProfilePost[]): Promise<ProfilePost[]> {
  const trackedGameIds = Array.from(new Set(items.filter((item) => item.gameId && item.type !== 'player_stat_card').map((item) => item.gameId as string)))
  if (!trackedGameIds.length) return items

  const [gamesResult, squadsResult, scoreResult] = await Promise.all([
    supabase.from('games').select('id,opponent,opponent_logo_path,opponent_primary_color_hex,round,venue,date').in('id', trackedGameIds),
    supabase.from('game_squads').select('game_id,team_side,squads(name,logo_url,primary_color_hex,leagues(name))').in('game_id', trackedGameIds),
    supabase.from('v_counted_events').select('game_id,team_side,stat_key').in('game_id', trackedGameIds).in('stat_key', ['G', 'B', 'RB']),
  ])
  if (gamesResult.error) throw gamesResult.error
  if (squadsResult.error) throw squadsResult.error
  if (scoreResult.error) throw scoreResult.error

  const contexts = new Map<string, GameContext>()
  ;((gamesResult.data ?? []) as any[]).forEach((game) => contexts.set(game.id, {
    opponent: game.opponent ?? null,
    round: game.round ?? null,
    venue: game.venue ?? null,
    date: game.date ?? null,
    homeName: null,
    awayName: null,
    homeGoals: 0,
    homeBehinds: 0,
    awayGoals: 0,
    awayBehinds: 0,
    awayLogoUrl: resolveLogoPublicUrl(game.opponent_logo_path),
    awayColor: game.opponent_primary_color_hex ?? null,
  }))
  ;((squadsResult.data ?? []) as any[]).forEach((link) => {
    const context = contexts.get(link.game_id)
    if (!context) return
    const name = link.squads?.name ?? null
    if (link.team_side === 'away') {
      context.awayName = name
      context.awayLogoUrl = resolveLogoPublicUrl(link.squads?.logo_url) ?? context.awayLogoUrl
      context.awayColor = link.squads?.primary_color_hex ?? context.awayColor
    } else {
      context.homeName = name
      context.homeLogoUrl = resolveLogoPublicUrl(link.squads?.logo_url)
      context.homeColor = link.squads?.primary_color_hex ?? null
      context.leagueName = link.squads?.leagues?.name ?? null
    }
  })
  ;((scoreResult.data ?? []) as any[]).forEach((event) => {
    const context = contexts.get(event.game_id)
    if (!context) return
    const side = event.team_side === 'away' ? 'away' : 'home'
    if (event.stat_key === 'G') side === 'away' ? context.awayGoals++ : context.homeGoals++
    if (event.stat_key === 'B') side === 'away' ? context.awayBehinds++ : context.homeBehinds++
    if (event.stat_key === 'RB' && side === 'away') context.homeBehinds++
  })
  return items.map((item) => item.gameId && contexts.has(item.gameId) ? { ...item, gameContext: contexts.get(item.gameId) } : item)
}

export async function listDashboardCommunityPosts({
  viewerId,
  limit = DASHBOARD_COMMUNITY_POST_LIMIT,
  cursor = null,
}: {
  viewerId: string
  limit?: number
  cursor?: ProfilePostCursor | null
}): Promise<{ items: ProfilePost[]; nextCursor: ProfilePostCursor | null; followedAuthorIds: Set<string> }> {
  if (!viewerId.trim()) throw new Error('A signed-in user is required.')
  const requestLimit = Math.min(Math.max(Math.trunc(limit), 1), DASHBOARD_COMMUNITY_POST_LIMIT)
  let query = supabase
      .from('posts')
      .select('id,author_id,body,image_url,game_id,manual_game_id,squad_id,type,payload,visibility,like_count,comment_count,created_at,updated_at')
      .is('hidden_at', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(requestLimit)
  if (cursor) {
    const timestamp = cursor.createdAt.replaceAll('"', '')
    const id = cursor.id.replaceAll('"', '')
    query = query.or(`created_at.lt."${timestamp}",and(created_at.eq."${timestamp}",id.lt."${id}")`)
  }
  const [feedResult, access] = await Promise.all([
    query,
    dashboardCommunityAccess(viewerId),
  ])
  if (feedResult.error) throw feedResult.error

  const normalized = ((feedResult.data ?? []) as CanonicalPostRow[])
    .filter((row) => Boolean(row.id && row.author_id && row.created_at))
    .map(normalizeProfilePostRow)
  const visible = selectDashboardCommunityPosts({
    posts: normalized,
    viewerId,
    followedAuthorIds: access.followedAuthorIds,
    blockedUserIds: access.blockedUserIds,
    reportedPostIds: access.reportedIds,
    limit: requestLimit,
  })
  const rows = (feedResult.data ?? []) as CanonicalPostRow[]
  const authorIds = Array.from(new Set(visible.map((post) => post.authorId)))
  const authors = authorIds.length
    ? await supabase.from('profiles_directory').select('user_id,name,avatar_url,avatar_path').in('user_id', authorIds)
    : { data: [], error: null }
  if (authors.error) throw authors.error
  const authorMap = new Map((authors.data ?? []).map((author) => [author.user_id, author]))
  const hydrated = visible.map((post) => {
    const author = authorMap.get(post.authorId)
    return { ...post, authorName: author?.name ?? null, authorAvatarUrl: author?.avatar_url ? resolvePostImageUrl(author.avatar_url) : author?.avatar_path ? supabase.storage.from('profile-avatars').getPublicUrl(author.avatar_path).data.publicUrl : null }
  })
  return {
    items: await hydrateTrackedGameContexts(hydrated),
    nextCursor: rows.length === requestLimit ? { id: rows[rows.length - 1].id, createdAt: rows[rows.length - 1].created_at } : null,
    followedAuthorIds: access.followedAuthorIds,
  }
}

export async function listProfilePosts({
  authorId,
  viewerId,
  mode,
  cursor = null,
  limit = PROFILE_POST_PAGE_LIMIT,
}: {
  authorId: string
  viewerId: string | null
  mode: 'self' | 'public'
  cursor?: ProfilePostCursor | null
  limit?: number
}): Promise<ProfilePostPage> {
  if (!authorId.trim()) throw new Error('A profile author is required.')
  if (await usersAreBlocked(viewerId, authorId)) {
    return { items: [], nextCursor: null, hasMore: false, access: 'blocked' }
  }

  const [isFollowing, reportedIds] = await Promise.all([
    mode === 'public' ? viewerFollowsAuthor(viewerId, authorId) : Promise.resolve(false),
    reportedPostIds(viewerId),
  ])
  const visibility = visibleProfilePostVisibilities({ mode, viewerId, authorId, isFollowing })
  const requestLimit = Math.min(Math.max(limit, 1), 50)
  let query = supabase
    .from('posts')
    .select('id,author_id,body,image_url,game_id,manual_game_id,squad_id,type,payload,visibility,like_count,comment_count,created_at,updated_at')
    .eq('author_id', authorId)
    .is('hidden_at', null)
    .in('visibility', visibility)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(requestLimit + 1)

  if (reportedIds.size) {
    const ids = Array.from(reportedIds).map((id) => `"${id.replaceAll('"', '')}"`).join(',')
    query = query.not('id', 'in', `(${ids})`)
  }

  if (cursor) {
    const timestamp = cursor.createdAt.replaceAll('"', '')
    const id = cursor.id.replaceAll('"', '')
    query = query.or(`created_at.lt."${timestamp}",and(created_at.eq."${timestamp}",id.lt."${id}")`)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = ((data ?? []) as CanonicalPostRow[]).filter((row) => row.author_id === authorId && !reportedIds.has(row.id))
  const hasMore = rows.length > requestLimit
  const items = await hydrateTrackedGameContexts(rows.slice(0, requestLimit).map(normalizeProfilePostRow))
  return {
    items,
    hasMore,
    nextCursor: hasMore && items.length ? cursorForProfilePost(items[items.length - 1]) : null,
    access: 'visible',
  }
}
