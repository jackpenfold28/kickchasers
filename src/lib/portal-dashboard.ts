import { getLeaderboard, type LeaderboardRow } from '@/lib/portal-stats'
import { listNotifications, type PortalNotification } from '@/lib/portal-notifications'
import { listFollowedClubs, listMySquads, type SquadSummary } from '@/lib/squads'
import { listUserGames, type GameLogRow } from '@/lib/portal-games'
import { roleArrayFromProfile } from '@/lib/profile-utils'
import { supabase } from '@/lib/supabase'

type ProfileRow = {
  user_id: string
  name: string | null
  handle: string | null
  avatar_url: string | null
  avatar_path: string | null
  home_club_id: string | null
  home_league_id: string | null
  primary_role: string | null
  game_day_roles: string[] | null
}

type ManualFormRow = {
  id: string
  opponent_name: string | null
  match_date: string | null
  disposals: number | null
  k: number | null
  hb: number | null
  t: number | null
  g: number | null
}

export type MatchFocusGame = GameLogRow

export type DashboardActionItem = PortalNotification & {
  actionLabel: string
  accent: 'green' | 'amber' | 'red' | 'blue'
}

export type DashboardSquadCard = SquadSummary & {
  attentionCount: number
  competitionLabel: string
}

export type DashboardLiveGame = {
  id: string
  date: string | null
  venue: string | null
  homeName: string | null
  homeLogoUrl: string | null
  awayName: string | null
  awayLogoUrl: string | null
  homeGoals: number
  homeBehinds: number
  awayGoals: number
  awayBehinds: number
  linkedSquadName: string | null
}

export type DashboardActivityItem = {
  id: string
  kind: 'notification' | 'game'
  title: string
  subtitle: string
  createdAt: string | null
  href: string
}

export type DashboardProfileSnapshot = {
  name: string | null
  handle: string | null
  avatarUrl: string | null
  clubName: string | null
  leagueName: string | null
  roles: string[]
  playerNumber: number | null
  position: string | null
  squadName: string | null
  seasonGames: number
  recentGames: GameLogRow[]
  formAverages: {
    disposals: number
    goals: number
    tackles: number
  } | null
}

export type DashboardData = {
  matchFocus: MatchFocusGame | null
  actionInbox: DashboardActionItem[]
  recentGames: GameLogRow[]
  squads: DashboardSquadCard[]
  profile: DashboardProfileSnapshot
  liveAroundMe: DashboardLiveGame[]
  leaderboard: LeaderboardRow[]
  recentActivity: DashboardActivityItem[]
}

function resolvePublicUrl(path: string | null | undefined, bucket: string) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl || null
}

function isActionableNotification(type: string) {
  const normalized = type.toLowerCase()
  return (
    normalized === 'squad_invite' ||
    normalized === 'squad_join_request_created' ||
    normalized === 'guest_merge_request_created' ||
    normalized.includes('track_request') ||
    normalized.includes('directory_request') ||
    normalized.includes('admin_request') ||
    normalized.includes('role_request') ||
    normalized.includes('role_decision')
  )
}

function actionMeta(type: string): Pick<DashboardActionItem, 'actionLabel' | 'accent'> {
  const normalized = type.toLowerCase()
  if (normalized === 'squad_invite') return { actionLabel: 'Respond', accent: 'green' }
  if (normalized === 'squad_join_request_created') return { actionLabel: 'Review', accent: 'amber' }
  if (normalized === 'guest_merge_request_created') return { actionLabel: 'Review', accent: 'blue' }
  if (normalized.includes('track_request')) return { actionLabel: 'Open', accent: 'amber' }
  if (normalized.includes('directory_request') || normalized.includes('admin_request')) return { actionLabel: 'Open', accent: 'blue' }
  return { actionLabel: 'Review', accent: 'green' }
}

function chooseMatchFocus(games: GameLogRow[]) {
  const live = games.find((game) => (game.status || '').toLowerCase() === 'in_progress')
  if (live) return live

  const now = Date.now()
  const upcoming = games
    .filter((game) => (game.status || '').toLowerCase() === 'scheduled')
    .sort((a, b) => {
      const at = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER
      const bt = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER
      return at - bt
    })
    .find((game) => {
      const time = game.date ? new Date(game.date).getTime() : null
      return time == null || time >= now - 1000 * 60 * 60 * 4
    })

  return upcoming ?? games[0] ?? null
}

function average(values: number[]) {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

async function loadProfileSnapshot(userId: string, recentGames: GameLogRow[]): Promise<DashboardProfileSnapshot> {
  const [profileRes, membershipRes, manualRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id,name,handle,avatar_url,avatar_path,home_club_id,home_league_id,primary_role,game_day_roles')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('squad_members')
      .select('jersey_number,position,role,status,squads(name)')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('role', { ascending: true })
      .limit(4),
    supabase
      .from('manual_player_game_totals')
      .select('id,opponent_name,match_date,disposals,k,hb,t,g')
      .eq('user_id', userId)
      .order('match_date', { ascending: false })
      .limit(3),
  ])

  if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error
  if (membershipRes.error) throw membershipRes.error
  if (manualRes.error && manualRes.error.code !== 'PGRST116') throw manualRes.error

  const profile = (profileRes.data as ProfileRow | null) ?? null
  const memberships = (membershipRes.data ?? []) as Array<{
    jersey_number?: number | null
    position?: string | null
    role?: string | null
    squads?: { name?: string | null } | null
  }>
  const manualRows = (manualRes.data ?? []) as ManualFormRow[]

  const [clubRes, leagueRes] = await Promise.all([
    profile?.home_club_id
      ? supabase.from('clubs').select('name').eq('id', profile.home_club_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    profile?.home_league_id
      ? supabase.from('leagues').select('name').eq('id', profile.home_league_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (clubRes.error && clubRes.error.code !== 'PGRST116') throw clubRes.error
  if (leagueRes.error && leagueRes.error.code !== 'PGRST116') throw leagueRes.error

  const primaryMembership = memberships[0] ?? null
  const formAverages = manualRows.length
    ? {
        disposals: average(manualRows.map((row) => Number(row.disposals ?? Number(row.k ?? 0) + Number(row.hb ?? 0)))),
        goals: average(manualRows.map((row) => Number(row.g ?? 0))),
        tackles: average(manualRows.map((row) => Number(row.t ?? 0))),
      }
    : null

  return {
    name: profile?.name ?? null,
    handle: profile?.handle ?? null,
    avatarUrl: profile ? resolvePublicUrl(profile.avatar_url ?? profile.avatar_path ?? null, 'profile-avatars') : null,
    clubName: (clubRes.data as { name?: string | null } | null)?.name ?? null,
    leagueName: (leagueRes.data as { name?: string | null } | null)?.name ?? null,
    roles: roleArrayFromProfile(profile?.primary_role ?? null, profile?.game_day_roles ?? null),
    playerNumber: primaryMembership?.jersey_number ?? null,
    position: primaryMembership?.position ?? null,
    squadName: primaryMembership?.squads?.name ?? null,
    seasonGames: recentGames.length,
    recentGames: recentGames.slice(0, 3),
    formAverages,
  }
}

async function loadLiveAroundMe(mySquads: SquadSummary[], followedSquads: SquadSummary[]): Promise<DashboardLiveGame[]> {
  const relevantSquadIds = new Set([...mySquads, ...followedSquads].map((squad) => squad.id))
  if (!relevantSquadIds.size) return []

  const liveRes = await supabase
    .from('games')
    .select('id,date,venue,status,opponent,opponent_logo_path,game_squads(team_side,squad_id,squads(id,name,logo_url))')
    .eq('status', 'in_progress')
    .order('date', { ascending: true })
    .limit(12)

  if (liveRes.error) throw liveRes.error

  const relevantGames = ((liveRes.data ?? []) as any[]).filter((game) => {
    const gameSquads = Array.isArray(game.game_squads) ? game.game_squads : []
    return gameSquads.some((row: any) => row.squad_id && relevantSquadIds.has(row.squad_id))
  })

  if (!relevantGames.length) return []

  const eventRes = await supabase
    .from('events')
    .select('game_id,team_side,stat_key')
    .in(
      'game_id',
      relevantGames.map((game) => game.id)
    )
    .in('stat_key', ['G', 'GOAL', 'B', 'BEHIND'])

  if (eventRes.error) throw eventRes.error

  const scoreMap = new Map<string, { hg: number; hb: number; ag: number; ab: number }>()
  for (const event of (eventRes.data ?? []) as Array<{ game_id?: string | null; team_side?: string | null; stat_key?: string | null }>) {
    const gameId = event.game_id
    if (!gameId) continue
    const current = scoreMap.get(gameId) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }
    const side = event.team_side === 'away' ? 'away' : 'home'
    const key = String(event.stat_key || '').toUpperCase()
    if (key === 'G' || key === 'GOAL') {
      if (side === 'home') current.hg += 1
      else current.ag += 1
    }
    if (key === 'B' || key === 'BEHIND') {
      if (side === 'home') current.hb += 1
      else current.ab += 1
    }
    scoreMap.set(gameId, current)
  }

  return relevantGames.slice(0, 4).map((game) => {
    const gameSquads = Array.isArray(game.game_squads) ? game.game_squads : []
    const home = gameSquads.find((row: any) => row.team_side === 'home') ?? gameSquads[0] ?? null
    const away = gameSquads.find((row: any) => row.team_side === 'away') ?? null
    const linked = gameSquads.find((row: any) => row.squad_id && relevantSquadIds.has(row.squad_id)) ?? home
    const score = scoreMap.get(game.id) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }

    return {
      id: game.id,
      date: game.date ?? null,
      venue: game.venue ?? null,
      homeName: home?.squads?.name ?? 'Home',
      homeLogoUrl: resolvePublicUrl(home?.squads?.logo_url ?? null, 'team-logos'),
      awayName: away?.squads?.name ?? game.opponent ?? 'Away',
      awayLogoUrl: resolvePublicUrl(away?.squads?.logo_url ?? game.opponent_logo_path ?? null, 'team-logos'),
      homeGoals: score.hg,
      homeBehinds: score.hb,
      awayGoals: score.ag,
      awayBehinds: score.ab,
      linkedSquadName: linked?.squads?.name ?? null,
    }
  })
}

function buildRecentActivity(notifications: PortalNotification[], games: GameLogRow[]) {
  const notificationItems: DashboardActivityItem[] = notifications.slice(0, 4).map((notification) => ({
    id: `notification:${notification.id}`,
    kind: 'notification',
    title: notification.actorName || notification.actorHandle || 'KickChasers update',
    subtitle: notification.squadName
      ? `${notification.type.replaceAll('_', ' ')} in ${notification.squadName}`
      : notification.type.replaceAll('_', ' '),
    createdAt: notification.createdAt,
    href: notification.squadId ? `/squads/${notification.squadId}` : '/notifications',
  }))

  const gameItems: DashboardActivityItem[] = games.slice(0, 4).map((game) => ({
    id: `game:${game.id}:${game.manualId || 'tracked'}`,
    kind: 'game',
    title: `${game.squadName || 'Game'} vs ${game.opponent || 'Opponent'}`,
    subtitle: game.isManual ? 'Manual game summary available' : 'Tracked game summary ready',
    createdAt: game.date,
    href: game.isManual && game.manualId ? `/games/manual/${game.manualId}` : `/games/${game.id}`,
  }))

  return [...notificationItems, ...gameItems]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6)
}

export async function loadDashboardData(userId: string): Promise<DashboardData> {
  const [games, notifications, mySquads, followedSquads] = await Promise.all([
    listUserGames(userId),
    listNotifications(userId),
    listMySquads(userId),
    listFollowedClubs(userId),
  ])

  const [profile, liveAroundMe, leaderboard] = await Promise.all([
    loadProfileSnapshot(userId, games),
    loadLiveAroundMe(mySquads, followedSquads),
    getLeaderboard({
      seasonYear: new Date().getFullYear(),
      stateCode: null,
      leagueId: null,
      clubId: null,
      ageRange: 'Any',
      statKey: 'disposals',
    }),
  ])

  const actionable = notifications
    .filter((notification) => isActionableNotification(notification.type))
    .slice(0, 6)
    .map((notification) => ({
      ...notification,
      ...actionMeta(notification.type),
    }))

  const attentionBySquad = new Map<string, number>()
  for (const notification of actionable) {
    if (!notification.squadId) continue
    attentionBySquad.set(notification.squadId, (attentionBySquad.get(notification.squadId) ?? 0) + 1)
  }

  const squads = [...mySquads]
    .sort((a, b) => {
      const aPriority = a.role === 'owner' || a.role === 'admin' || a.ownerId === userId ? 0 : 1
      const bPriority = b.role === 'owner' || b.role === 'admin' || b.ownerId === userId ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      return (b.memberCount ?? 0) - (a.memberCount ?? 0)
    })
    .slice(0, 6)
    .map((squad) => ({
      ...squad,
      attentionCount: attentionBySquad.get(squad.id) ?? 0,
      competitionLabel: squad.leagueShortName ?? squad.leagueName ?? 'League TBC',
    }))

  return {
    matchFocus: chooseMatchFocus(games),
    actionInbox: actionable,
    recentGames: games.slice(0, 5),
    squads,
    profile,
    liveAroundMe,
    leaderboard: leaderboard.slice(0, 5),
    recentActivity: buildRecentActivity(notifications, games),
  }
}
