import { getLeaderboard, type LeaderboardRow } from '@/lib/portal-stats'
import { listNotifications, type PortalNotification } from '@/lib/portal-notifications'
import { loadQuick6Dataset, loadQuick6Summary, type Quick6Summary } from '@/lib/portal-quick6'
import { listFollowedClubs, listMySquads, type SquadSummary } from '@/lib/squads'
import { listUserGames, type GameLogRow } from '@/lib/portal-games'
import { resolveLogoPublicUrl } from '@/lib/logo-storage'
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
  seasonTotals: {
    disposals: number
    goals: number
  }
  recentGames: GameLogRow[]
  formAverages: {
    disposals: number
    goals: number
    tackles: number
  } | null
}

export type DashboardData = {
  selectedSeasonYear: number | null
  availableSeasonYears: number[]
  matchFocus: MatchFocusGame | null
  matchFocusTints: {
    home: string | null
    away: string | null
  }
  recentGameTints: Record<
    string,
    {
      home: string | null
      away: string | null
    }
  >
  matchFocusLeague: {
    name: string | null
    logoPath: string | null
    logoUrl: string | null
  }
  actionInbox: DashboardActionItem[]
  recentGames: GameLogRow[]
  squads: DashboardSquadCard[]
  profile: DashboardProfileSnapshot
  quick6: Quick6Summary
  liveAroundMe: DashboardLiveGame[]
  leaderboard: LeaderboardRow[]
  recentActivity: DashboardActivityItem[]
}

type MatchFocusSideCandidate = {
  name: string | null
  logoUrl: string | null
  primaryColorHex: string | null
  leagueId: string | null
}

const logoColorCache = new Map<string, string>()

function resolvePublicUrl(path: string | null | undefined, bucket: string) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const resolved = resolveLogoPublicUrl(bucket === 'team-logos' ? path : `${bucket}/${path}`)
  return resolved ?? null
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

function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null
  let trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) {
    trimmed = trimmed.slice(1)
  }
  if (trimmed.length === 3) {
    trimmed = trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (trimmed.length !== 6) return null
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return `#${trimmed.toUpperCase()}`
}

function resolveDashboardTint(primaryColorHex: string | null | undefined, fallbackColor: string) {
  return normalizeHexColor(primaryColorHex) ?? fallbackColor
}

function averageImageColorToHex(image: HTMLImageElement) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)

  let totalRed = 0
  let totalGreen = 0
  let totalBlue = 0
  let totalWeight = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255
    if (alpha < 0.08) continue

    totalRed += data[index] * alpha
    totalGreen += data[index + 1] * alpha
    totalBlue += data[index + 2] * alpha
    totalWeight += alpha
  }

  if (!totalWeight) return null

  const red = Math.round(totalRed / totalWeight)
  const green = Math.round(totalGreen / totalWeight)
  const blue = Math.round(totalBlue / totalWeight)

  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0').toUpperCase())
    .join('')}`
}

async function resolveLogoPrimaryColor(logoUrl: string | null | undefined, fallbackColor: string) {
  if (!logoUrl || typeof window === 'undefined') return fallbackColor

  const cached = logoColorCache.get(logoUrl)
  if (cached) return cached

  const resolved = await new Promise<string>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      try {
        resolve(averageImageColorToHex(image) ?? fallbackColor)
      } catch {
        resolve(fallbackColor)
      }
    }
    image.onerror = () => resolve(fallbackColor)
    image.src = logoUrl
  })

  logoColorCache.set(logoUrl, resolved)
  return resolved
}

function resolveLogoCandidate(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const resolved = resolvePublicUrl(candidate ?? null, 'team-logos')
    if (resolved) return resolved
  }
  return null
}

async function loadSquadColorByName(names: string[], leagueIds: string[]) {
  const cleanedNames = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)))
  if (!cleanedNames.length) return new Map<string, string>()

  let query = supabase.from('squads').select('name,primary_color_hex,league_id').in('name', cleanedNames)
  if (leagueIds.length) {
    query = query.in('league_id', Array.from(new Set(leagueIds)))
  }

  const { data, error } = await query
  if (error) throw error

  const colorByName = new Map<string, string>()
  ;(data ?? []).forEach((row) => {
    const name = (row as { name?: string | null }).name?.trim()
    const color = normalizeHexColor((row as { primary_color_hex?: string | null }).primary_color_hex ?? null)
    if (name && color && !colorByName.has(name)) {
      colorByName.set(name, color)
    }
  })
  return colorByName
}

async function resolveSideTint(
  side: MatchFocusSideCandidate | null,
  injectedColor: string | null,
  fallbackColor: string
) {
  const direct = normalizeHexColor(side?.primaryColorHex ?? null)
  if (direct) return direct

  const injected = normalizeHexColor(injectedColor)
  if (injected) return injected

  const sampled = normalizeHexColor(await resolveLogoPrimaryColor(side?.logoUrl ?? null, fallbackColor))
  return sampled ?? fallbackColor
}

async function loadMatchFocusTints(matchFocus: MatchFocusGame | null) {
  if (!matchFocus?.id) {
    return {
      home: '#29486B',
      away: '#21433D',
    }
  }

  const { data, error } = await supabase
    .from('games')
    .select(
      'id,opponent,opponent_logo_path,game_squads(team_side,squads(id,name,logo_url,club_id,league_id,primary_color_hex))'
    )
    .eq('id', matchFocus.id)
    .maybeSingle()

  if (error) throw error

  const game = (data ?? null) as
    | {
        opponent?: string | null
        opponent_logo_path?: string | null
        game_squads?: Array<{
          team_side?: string | null
          squads?: {
            id?: string | null
            name?: string | null
            logo_url?: string | null
            club_id?: string | null
            league_id?: string | null
            primary_color_hex?: string | null
          } | null
        }> | null
      }
    | null

  const rows = Array.isArray(game?.game_squads) ? game.game_squads : []
  const homeRow = rows.find((row) => row.team_side === 'home') ?? rows[0] ?? null
  const awayRow = rows.find((row) => row.team_side === 'away') ?? null

  const home: MatchFocusSideCandidate = {
    name: homeRow?.squads?.name ?? matchFocus.squadName ?? null,
    logoUrl: resolveLogoCandidate(homeRow?.squads?.logo_url ?? null, matchFocus.squadLogoUrl),
    primaryColorHex: homeRow?.squads?.primary_color_hex ?? null,
    leagueId: homeRow?.squads?.league_id ?? null,
  }

  const away: MatchFocusSideCandidate | null = awayRow?.squads
    ? {
        name: awayRow.squads.name ?? matchFocus.opponent ?? null,
        logoUrl: resolveLogoCandidate(awayRow.squads.logo_url ?? null, matchFocus.opponentLogoUrl, game?.opponent_logo_path),
        primaryColorHex: awayRow.squads.primary_color_hex ?? null,
        leagueId: awayRow.squads.league_id ?? home.leagueId ?? null,
      }
    : {
        name: game?.opponent ?? matchFocus.opponent ?? null,
        logoUrl: resolveLogoCandidate(game?.opponent_logo_path, matchFocus.opponentLogoUrl),
        primaryColorHex: null,
        leagueId: home.leagueId ?? null,
      }

  const colorByName = await loadSquadColorByName(
    [home.name ?? '', away?.name ?? ''],
    [home.leagueId ?? '', away?.leagueId ?? ''].filter(Boolean)
  )

  return {
    home: await resolveSideTint(home, home.name ? colorByName.get(home.name) ?? null : null, '#29486B'),
    away: await resolveSideTint(away, away?.name ? colorByName.get(away.name) ?? null : null, '#21433D'),
  }
}

function gameTintKey(game: Pick<GameLogRow, 'id' | 'manualId'>) {
  return `${game.id}:${game.manualId ?? 'tracked'}`
}

async function loadRecentGameTints(games: GameLogRow[]) {
  const trackedGames = games.filter((game) => !game.isManual)
  const tintEntries = await Promise.all(
    trackedGames.map(async (game) => [
      gameTintKey(game),
      await loadMatchFocusTints(game),
    ] as const)
  )

  return Object.fromEntries(tintEntries) as Record<string, { home: string | null; away: string | null }>
}

async function loadMatchFocusLeague(matchFocus: MatchFocusGame | null) {
  if (!matchFocus?.id) return { name: null, logoPath: null, logoUrl: null }

  const { data, error } = await supabase
    .from('game_squads')
    .select('team_side,squads(league_id,league:leagues(name,short_name,logo_path))')
    .eq('game_id', matchFocus.id)

  if (error) throw error

  const rows = (data ?? []) as Array<{
    team_side?: string | null
    squads?: {
      league?: { name?: string | null; short_name?: string | null; logo_path?: string | null } | null
    } | null
  }>

  const primary = rows.find((row) => row.team_side === 'home') ?? rows[0] ?? null
  const league = primary?.squads?.league ?? null

  return {
    name: league?.short_name ?? league?.name ?? null,
    logoPath: league?.logo_path ?? null,
    logoUrl: resolveLogoPublicUrl(league?.logo_path ?? null),
  }
}

async function loadProfileSnapshot(
  userId: string,
  recentGames: GameLogRow[],
  selectedSeasonYear: number | null,
  seasonTotals: {
    disposals: number
    goals: number
  }
): Promise<DashboardProfileSnapshot> {
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
      .order('match_date', { ascending: false }),
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
  const manualRows = ((manualRes.data ?? []) as ManualFormRow[])
    .filter((row) => (selectedSeasonYear == null ? true : parseSeasonYear(row.match_date) === selectedSeasonYear))
    .slice(0, 3)

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
    seasonTotals,
    recentGames: recentGames.slice(0, 3),
    formAverages,
  }
}

function parseSeasonYear(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear()
}

function sumSeasonTotals(
  loggedGames: Array<{
    seasonYear: number | null
    totals: {
      disposals: number
      goals: number
    }
  }>,
  selectedSeasonYear: number | null
) {
  return loggedGames.reduce(
    (acc, game) => {
      if (selectedSeasonYear != null && game.seasonYear !== selectedSeasonYear) return acc
      acc.disposals += Number(game.totals.disposals ?? 0)
      acc.goals += Number(game.totals.goals ?? 0)
      return acc
    },
    { disposals: 0, goals: 0 }
  )
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

export async function loadDashboardData(userId: string, selectedSeasonYear?: number | null): Promise<DashboardData> {
  const [games, notifications, mySquads, followedSquads] = await Promise.all([
    listUserGames(userId),
    listNotifications(userId),
    listMySquads(userId),
    listFollowedClubs(userId),
  ])

  const matchFocus = chooseMatchFocus(games)

  const recentGames = games.slice(0, 5)

  const [quick6Dataset, liveAroundMe, matchFocusTints, recentGameTints, matchFocusLeague] = await Promise.all([
    loadQuick6Dataset(userId, games),
    loadLiveAroundMe(mySquads, followedSquads),
    loadMatchFocusTints(matchFocus),
    loadRecentGameTints(recentGames),
    loadMatchFocusLeague(matchFocus),
  ])

  const currentYear = new Date().getFullYear()
  const effectiveSeasonYear =
    selectedSeasonYear != null && quick6Dataset.availableSeasonYears.includes(selectedSeasonYear)
      ? selectedSeasonYear
      : quick6Dataset.availableSeasonYears.includes(currentYear)
        ? currentYear
        : (quick6Dataset.availableSeasonYears[0] ?? null)
  const seasonTotals = sumSeasonTotals(quick6Dataset.loggedGames, effectiveSeasonYear)

  const [profile, quick6, leaderboard] = await Promise.all([
    loadProfileSnapshot(
      userId,
      games.filter((game) => parseSeasonYear(game.date) === effectiveSeasonYear),
      effectiveSeasonYear,
      seasonTotals
    ),
    loadQuick6Summary(userId, games, effectiveSeasonYear),
    getLeaderboard({
      seasonYear: effectiveSeasonYear ?? new Date().getFullYear(),
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
    selectedSeasonYear: effectiveSeasonYear,
    availableSeasonYears: quick6.availableSeasonYears,
    matchFocus,
    matchFocusTints,
    recentGameTints,
    matchFocusLeague,
    actionInbox: actionable,
    recentGames,
    squads,
    profile,
    quick6,
    liveAroundMe,
    leaderboard: leaderboard.slice(0, 5),
    recentActivity: buildRecentActivity(notifications, games),
  }
}
