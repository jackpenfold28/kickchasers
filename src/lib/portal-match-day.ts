import { resolveLogoPublicUrl } from '@/lib/logo-storage'
import { supabase } from '@/lib/supabase'
import type { GameLogRow } from '@/lib/portal-games'
import { isEligibleMatchDayGame, resolveMatchDayLeagueId, sortMatchDayGames } from '@/lib/canonical/games-parity-contract'

const LIVE_STATUSES = ['live', 'in_progress'] as const
const FINAL_STATUSES = ['final', 'complete', 'completed', 'finished'] as const
const RECENT_WINDOW_DAYS = 7
const LIVE_LIMIT = 12
const RECENT_LIMIT = 18
const SEARCH_LIMIT = 24

export type MatchDayLeague = {
  id: string
  name: string | null
  shortName: string | null
  stateCode: string | null
  logoUrl: string | null
  clubCount: number
}

export type MatchDayGame = GameLogRow & {
  leagueId: string | null
  leagueName: string | null
  leagueShortName: string | null
  stateCode: string | null
  countedEventCount: number
}

export type MatchDaySnapshot = {
  followedLeagues: MatchDayLeague[]
  liveGames: MatchDayGame[]
  recentGames: MatchDayGame[]
  homeLeagueId: string | null
  homeLeagueAutoFollowed: boolean
}

type LeagueLookupRow = {
  id: string
  name: string | null
  short_name: string | null
  state_code: string | null
  logo_path: string | null
}

type GameCandidate = {
  id: string
  opponent: string | null
  date: string | null
  venue: string | null
  round: number | null
  status: string | null
  opponent_logo_path: string | null
  tracker_mode: string | null
}

function normalizeStatus(status: string | null | undefined) {
  return String(status || '').trim().toLowerCase()
}

function isLiveStatus(status: string | null | undefined) {
  return LIVE_STATUSES.includes(normalizeStatus(status) as (typeof LIVE_STATUSES)[number])
}

function isFinalStatus(status: string | null | undefined) {
  return FINAL_STATUSES.includes(normalizeStatus(status) as (typeof FINAL_STATUSES)[number])
}

function parseGameTime(value: string | null | undefined) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

async function loadClubCounts(leagueIds: string[]) {
  const ids = Array.from(new Set(leagueIds.filter(Boolean)))
  if (!ids.length) return new Map<string, number>()

  const { data, error } = await supabase.from('clubs').select('league_id').in('league_id', ids)
  if (error) throw error

  const counts = new Map<string, number>()
  ;(data ?? []).forEach((row: any) => {
    const leagueId = row.league_id as string | null
    if (!leagueId) return
    counts.set(leagueId, (counts.get(leagueId) ?? 0) + 1)
  })
  return counts
}

async function loadLeagueRowsByIds(leagueIds: string[]) {
  const ids = Array.from(new Set(leagueIds.filter(Boolean)))
  if (!ids.length) return [] as LeagueLookupRow[]

  const { data, error } = await supabase
    .from('leagues')
    .select('id,name,short_name,state_code,logo_path')
    .in('id', ids)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as LeagueLookupRow[]
}

function toLeagueModel(row: LeagueLookupRow, clubCounts: Map<string, number>): MatchDayLeague {
  return {
    id: row.id,
    name: row.name ?? null,
    shortName: row.short_name ?? null,
    stateCode: row.state_code ?? null,
    logoUrl: resolveLogoPublicUrl(row.logo_path ?? null),
    clubCount: clubCounts.get(row.id) ?? 0,
  }
}

async function listGameCandidates(kind: 'live' | 'recent') {
  let query = supabase
    .from('games')
    .select('id,opponent,date,venue,round,status,opponent_logo_path,tracker_mode')

  if (kind === 'live') {
    query = query
      .eq('status', 'live')
      .neq('tracker_mode', 'team_stats_game')
      .order('date', { ascending: true })
      .limit(32)
  } else {
    const threshold = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    query = query
      .in('status', ['final', 'completed'])
      .neq('tracker_mode', 'team_stats_game')
      .gte('date', threshold)
      .order('date', { ascending: false })
      .limit(64)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as GameCandidate[]
}

async function loadGameScores(gameIds: string[]) {
  if (!gameIds.length) {
    return {
      scoreMap: new Map<string, { hg: number; hb: number; ag: number; ab: number }>(),
      countedEventCountByGameId: new Map<string, number>(),
      latestEventByGameId: new Map<string, { createdAt: string | null; quarter: number | null; clockLabel: string | null }>(),
    }
  }

  const { data, error } = await supabase
    .from('v_counted_events')
    .select('game_id,team_side,stat_key,quarter,quarter_clock_label,created_at')
    .in('game_id', gameIds)

  if (error) throw error

  const scoreMap = new Map<string, { hg: number; hb: number; ag: number; ab: number }>()
  const countedEventCountByGameId = new Map<string, number>()
  const latestEventByGameId = new Map<string, { createdAt: string | null; quarter: number | null; clockLabel: string | null }>()

  ;(data ?? []).forEach((row: any) => {
    const gameId = row.game_id as string | null
    if (!gameId) return

    countedEventCountByGameId.set(gameId, (countedEventCountByGameId.get(gameId) ?? 0) + 1)
    const createdAt = row.created_at as string | null
    const currentLatest = latestEventByGameId.get(gameId)
    if (!currentLatest || parseGameTime(createdAt) >= parseGameTime(currentLatest.createdAt)) {
      latestEventByGameId.set(gameId, {
        createdAt,
        quarter: row.quarter ?? null,
        clockLabel: row.quarter_clock_label ?? null,
      })
    }

    const statKey = String(row.stat_key || '').toUpperCase()
    if (statKey !== 'G' && statKey !== 'GOAL' && statKey !== 'B' && statKey !== 'BEHIND') return

    const current = scoreMap.get(gameId) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }
    const side = row.team_side === 'away' ? 'away' : 'home'
    if (statKey === 'G' || statKey === 'GOAL') {
      if (side === 'home') current.hg += 1
      else current.ag += 1
    } else if (side === 'home') {
      current.hb += 1
    } else {
      current.ab += 1
    }
    scoreMap.set(gameId, current)
  })

  return { scoreMap, countedEventCountByGameId, latestEventByGameId }
}

async function listTrackedGamesForFollowedLeagues(leagueIds: string[], kind: 'live' | 'recent'): Promise<MatchDayGame[]> {
  const followedLeagueIds = Array.from(new Set(leagueIds.filter(Boolean)))
  if (!followedLeagueIds.length) return []

  const candidates = await listGameCandidates(kind)
  if (!candidates.length) return []

  const gameIds = candidates.map((game) => game.id)
  const { data: gameSquads, error: gameSquadsError } = await supabase
    .from('game_squads')
    .select('game_id,team_side,squad_id,squads(id,name,logo_url,primary_color_hex,league_id,is_official,league:leagues(name,short_name,state_code))')
    .in('game_id', gameIds)

  if (gameSquadsError) throw gameSquadsError

  const rowsByGameId = new Map<string, any[]>()
  ;(gameSquads ?? []).forEach((row: any) => {
    const gameId = row.game_id as string | null
    if (!gameId) return
    const existing = rowsByGameId.get(gameId)
    if (existing) existing.push(row)
    else rowsByGameId.set(gameId, [row])
  })

  const followedSet = new Set(followedLeagueIds)
  const filteredCandidates = candidates.filter((candidate) => {
    const rows = rowsByGameId.get(candidate.id) ?? []
    const homeRow = rows.find((row) => row.team_side === 'home') ?? rows[0] ?? null
    const awayRow = rows.find((row) => row.team_side === 'away') ?? null
    const homeSquad = homeRow?.squads ?? null
    const awaySquad = awayRow?.squads ?? null
    return isEligibleMatchDayGame({
      trackerMode: candidate.tracker_mode,
      status: candidate.status,
      homeLeagueId: homeSquad?.league_id ?? null,
      awayLeagueId: awaySquad?.league_id ?? null,
      homeOfficial: Boolean(homeSquad?.is_official),
      awayOfficial: Boolean(awaySquad?.is_official),
      // Recent rows are checked against real counted events after the event query.
      countedEventCount: kind === 'recent' ? 1 : 0,
    }, followedSet, kind)
  })

  if (!filteredCandidates.length) return []

  const filteredIds = filteredCandidates.map((game) => game.id)
  const { scoreMap, countedEventCountByGameId, latestEventByGameId } = await loadGameScores(filteredIds)

  const built = filteredCandidates
    .map((game): MatchDayGame | null => {
      const rows = rowsByGameId.get(game.id) ?? []
      const homeRow = rows.find((row) => row.team_side === 'home') ?? rows[0] ?? null
      const awayRow = rows.find((row) => row.team_side === 'away') ?? null
      const homeSquad = homeRow?.squads ?? null
      const awaySquad = awayRow?.squads ?? null
      const leagueId = resolveMatchDayLeagueId({
        homeLeagueId: homeSquad?.league_id ?? null,
        awayLeagueId: awaySquad?.league_id ?? null,
      }, followedSet)
      const leagueSquad = homeSquad?.league_id === leagueId ? homeSquad : awaySquad
      const league = leagueSquad?.league ?? null
      const countedEventCount = countedEventCountByGameId.get(game.id) ?? 0
      const score = scoreMap.get(game.id) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }
      const latestEvent = latestEventByGameId.get(game.id) ?? null

      if (!leagueId) return null
      if (kind === 'recent' && !countedEventCount) return null

      return {
        id: game.id,
        manualId: null,
        isManual: false,
        date: game.date ?? null,
        venue: game.venue ?? null,
        status: game.status ?? null,
        statusDetail: kind === 'live' && latestEvent?.quarter
          ? `Q${latestEvent.quarter}${latestEvent.clockLabel ? ` • ${latestEvent.clockLabel}` : ''}`
          : null,
        round: game.round ?? null,
        opponent: awaySquad?.name ?? game.opponent ?? null,
        squadName: homeSquad.name ?? null,
        squadLogoUrl: resolveLogoPublicUrl(homeSquad.logo_url ?? null),
        opponentLogoUrl: resolveLogoPublicUrl(awaySquad?.logo_url ?? game.opponent_logo_path ?? null),
        homePrimaryColorHex: homeSquad.primary_color_hex ?? null,
        awayPrimaryColorHex: awaySquad?.primary_color_hex ?? null,
        scoreHomeGoals: score.hg,
        scoreHomeBehinds: score.hb,
        scoreAwayGoals: score.ag,
        scoreAwayBehinds: score.ab,
        leagueId,
        leagueName: league?.name ?? null,
        leagueShortName: league?.short_name ?? null,
        stateCode: league?.state_code ?? null,
        countedEventCount,
      }
    })
    .filter((row): row is MatchDayGame => Boolean(row))

  const sorted = sortMatchDayGames(built.map((game) => ({
    ...game,
    gameId: game.id,
    updatedAt: latestEventByGameId.get(game.id)?.createdAt ?? game.date,
  })), kind)

  return kind === 'live' ? sorted.slice(0, LIVE_LIMIT) : sorted.slice(0, RECENT_LIMIT)
}

export async function ensureHomeLeagueFollow(userId: string) {
  const { data, error } = await supabase.from('profiles').select('home_club_id').eq('user_id', userId).maybeSingle()
  if (error && error.code !== 'PGRST116') throw error

  const homeClubId = (data as { home_club_id?: string | null } | null)?.home_club_id ?? null
  const { data: club, error: clubError } = homeClubId
    ? await supabase.from('clubs').select('league_id').eq('id', homeClubId).maybeSingle()
    : { data: null, error: null }
  if (clubError && clubError.code !== 'PGRST116') throw clubError
  const homeLeagueId = (club as { league_id?: string | null } | null)?.league_id ?? null
  if (!homeLeagueId) {
    return { homeLeagueId: null, autoFollowed: false }
  }

  const { data: existing, error: existingError } = await supabase
    .from('league_follows')
    .select('league_id')
    .eq('user_id', userId)
    .eq('league_id', homeLeagueId)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') throw existingError
  if (existing?.league_id) {
    return { homeLeagueId, autoFollowed: false }
  }

  const { error: insertError } = await supabase
    .from('league_follows')
    .upsert({ user_id: userId, league_id: homeLeagueId }, { onConflict: 'league_id,user_id', ignoreDuplicates: true })

  if (insertError) throw insertError
  return { homeLeagueId, autoFollowed: true }
}

export async function listFollowedLeagues(userId: string): Promise<MatchDayLeague[]> {
  const { data, error } = await supabase.from('league_follows').select('league_id').eq('user_id', userId)
  if (error) throw error

  const leagueIds = (data ?? [])
    .map((row: any) => row.league_id as string | null)
    .filter((leagueId): leagueId is string => Boolean(leagueId))

  const [leagueRows, clubCounts] = await Promise.all([loadLeagueRowsByIds(leagueIds), loadClubCounts(leagueIds)])

  return leagueRows
    .map((row) => toLeagueModel(row, clubCounts))
    .sort((left, right) => {
      const leftLabel = left.shortName || left.name || ''
      const rightLabel = right.shortName || right.name || ''
      return leftLabel.localeCompare(rightLabel)
    })
}

export async function searchActiveLeagues(query: string): Promise<MatchDayLeague[]> {
  const trimmed = query.trim()
  let request = supabase
    .from('leagues')
    .select('id,name,short_name,state_code,logo_path')
    .neq('is_active', false)
    .order('name', { ascending: true })
    .limit(SEARCH_LIMIT)

  if (trimmed) {
    const safe = trimmed.replace(/,/g, ' ')
    request = request.or(`name.ilike.%${safe}%,short_name.ilike.%${safe}%,state_code.ilike.%${safe}%`)
  }

  const { data, error } = await request
  if (error) throw error

  const rows = (data ?? []) as LeagueLookupRow[]
  const clubCounts = await loadClubCounts(rows.map((row) => row.id))
  return rows.map((row) => toLeagueModel(row, clubCounts))
}

export async function followLeague(userId: string, leagueId: string) {
  const { error } = await supabase
    .from('league_follows')
    .upsert({ user_id: userId, league_id: leagueId }, { onConflict: 'league_id,user_id', ignoreDuplicates: true })

  if (error) throw error
}

export async function unfollowLeague(userId: string, leagueId: string) {
  const { error } = await supabase.from('league_follows').delete().eq('user_id', userId).eq('league_id', leagueId)
  if (error) throw error
}

export async function loadMatchDaySnapshot(userId: string): Promise<MatchDaySnapshot> {
  const { homeLeagueId, autoFollowed } = await ensureHomeLeagueFollow(userId)
  const followedLeagues = await listFollowedLeagues(userId)
  const leagueIds = followedLeagues.map((league) => league.id)

  if (!leagueIds.length) {
    return {
      followedLeagues,
      liveGames: [],
      recentGames: [],
      homeLeagueId,
      homeLeagueAutoFollowed: autoFollowed,
    }
  }

  const [liveGames, recentGames] = await Promise.all([
    listTrackedGamesForFollowedLeagues(leagueIds, 'live'),
    listTrackedGamesForFollowedLeagues(leagueIds, 'recent'),
  ])

  return {
    followedLeagues,
    liveGames,
    recentGames,
    homeLeagueId,
    homeLeagueAutoFollowed: autoFollowed,
  }
}
