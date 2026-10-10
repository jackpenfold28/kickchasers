import { supabase } from '@/lib/supabase'
import { buildTotalsFromEvents } from '@/lib/canonical/player-event-aggregate'
import { dedupeOfficialLeaderboardEvents } from '@/lib/canonical/leaderboard-contract'
import {
  LEADERBOARD_STAT_DEFINITIONS,
  LEADERBOARD_STAT_LABELS,
  getLeaderboardRangeBounds,
  isAgeInLeaderboardRange,
  leaderboardStatsFromTotals,
  rankLeaderboardItems,
  type LeaderboardAgeRange,
  type LeaderboardRangeMode,
  type LeaderboardStatKey,
} from '@/lib/canonical/leaderboard-filters'

export const STAT_OPTIONS = LEADERBOARD_STAT_DEFINITIONS.map(({ key }) => key)
export const STAT_LABELS = LEADERBOARD_STAT_LABELS
export type { LeaderboardRangeMode, LeaderboardStatKey }

export type LeaderboardFilters = {
  seasonYear: number
  stateCode: string | null
  leagueId: string | null
  clubId: string | null
  ageRange: LeaderboardAgeRange
  statKey: LeaderboardStatKey
}

export type LeaderboardRow = {
  homeClubId?: string | null
  rank: number
  userId: string
  playerName: string
  handle: string | null
  avatarUrl: string | null
  squadName: string | null
  clubName: string | null
  leagueName: string | null
  games: number
  statValue: number
  secondaryDisposals: number
}

export type LeaderboardPlayer = {
  userId: string
  playerName: string
  handle: string | null
  avatarUrl: string | null
  clubName: string | null
  leagueName: string | null
  homeStateCode: string | null
  homeLeagueId: string | null
  homeClubId: string | null
  ageYears: number | null
  games: number
  stats: Record<LeaderboardStatKey, number>
}

const LEADERBOARD_QUERY_PAGE_SIZE = 1000
const LEADERBOARD_EVENT_GAME_ID_CHUNK_SIZE = 300

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function gamePlayerMetaKey(gameId?: string | null, teamSide?: string | null, playerNumber?: number | null) {
  if (!gameId || playerNumber == null) return null
  return `${gameId}:${teamSide === 'away' ? 'away' : 'home'}:${playerNumber}`
}

const LEADERBOARD_STAT_CAPS: Partial<Record<LeaderboardStatKey, number>> = {
  disposals: 70,
  goals: 25,
  fantasy_points: 250,
}

export function isLeaderboardStatValueAllowed(statKey: LeaderboardStatKey, value: number) {
  const cap = LEADERBOARD_STAT_CAPS[statKey]
  return cap == null || value <= cap
}

function avatarUrl(avatarUrlValue: string | null, avatarPath: string | null) {
  if (avatarUrlValue) return avatarUrlValue
  if (!avatarPath) return null
  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath)
  return data.publicUrl || null
}

export async function listSeasonYears(limit = 6): Promise<number[]> {
  const { data, error } = await supabase
    .from('games')
    .select('date')
    .order('date', { ascending: false })
    .limit(400)

  if (error) throw error

  const years = new Set<number>()
  ;(data ?? []).forEach((row) => {
    const iso = (row as { date?: string | null }).date
    if (!iso) return
    const year = new Date(iso).getFullYear()
    if (!Number.isNaN(year)) years.add(year)
  })

  const sorted = Array.from(years).sort((a, b) => b - a)
  if (!sorted.length) sorted.push(new Date().getFullYear())
  return sorted.slice(0, limit)
}

export async function listStateOptions() {
  const { data, error } = await supabase.from('states').select('code,name').order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    code: (row as { code: string }).code,
    name: (row as { name?: string | null }).name ?? null,
  }))
}

export async function listClubTints(clubIds: string[]) {
  const ids = Array.from(new Set(clubIds.filter(Boolean)))
  if (!ids.length) return new Map<string, string | null>()

  const [{ data: squadRows, error: squadError }, { data: clubRows, error: clubError }] = await Promise.all([
    supabase.from('squads').select('club_id,primary_color_hex,is_official').in('club_id', ids),
    supabase.from('clubs').select('id,primary_color').in('id', ids),
  ])

  if (squadError) throw squadError
  if (clubError) throw clubError

  const tintMap = new Map<string, string | null>()

  ;((clubRows ?? []) as any[]).forEach((row) => {
    tintMap.set(row.id, normalizeHexColor(row.primary_color ?? null))
  })

  ;((squadRows ?? []) as any[]).forEach((row) => {
    const clubId = row.club_id as string | null
    if (!clubId) return
    const tint = normalizeHexColor(row.primary_color_hex ?? null)
    if (!tint) return
    if (!tintMap.get(clubId) || row.is_official) {
      tintMap.set(clubId, tint)
    }
  })

  return tintMap
}

export async function listLeagueOptions(stateCode: string | null) {
  let query = supabase.from('leagues').select('id,name,state_code').order('name', { ascending: true })
  if (stateCode) query = query.eq('state_code', stateCode)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { name?: string | null }).name ?? null,
    stateCode: (row as { state_code?: string | null }).state_code ?? null,
  }))
}

export async function listClubOptions(leagueId: string | null) {
  let query = supabase.from('clubs').select('id,name,league_id').order('name', { ascending: true })
  if (leagueId) query = query.eq('league_id', leagueId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { name?: string | null }).name ?? null,
    leagueId: (row as { league_id?: string | null }).league_id ?? null,
  }))
}

async function resolveMembershipFilter(
  userIds: string[],
  filters: Pick<LeaderboardFilters, 'leagueId' | 'clubId'>
): Promise<Set<string> | null> {
  if (!filters.leagueId && !filters.clubId) return null
  if (!userIds.length) return new Set()

  const { data, error } = await supabase
    .from('squad_members')
    .select('user_id,status,squads!inner(league_id,club_id)')
    .in('user_id', userIds)
    .eq('status', 'accepted')

  if (error) throw error

  const allowed = new Set<string>()
  ;(data ?? []).forEach((row) => {
    const userId = (row as { user_id?: string | null }).user_id
    if (!userId) return
    const squad = (row as { squads?: { league_id?: string | null; club_id?: string | null } | null }).squads
    if (!squad) return

    if (filters.leagueId && squad.league_id !== filters.leagueId) return
    if (filters.clubId && squad.club_id !== filters.clubId) return

    allowed.add(userId)
  })

  return allowed
}

function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null
  let trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) trimmed = trimmed.slice(1)
  if (trimmed.length === 3) {
    trimmed = trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (trimmed.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(trimmed)) return null
  return `#${trimmed.toUpperCase()}`
}

export async function getLeaderboardPlayers(
  filters: Omit<LeaderboardFilters, 'statKey' | 'seasonYear'> & { seasonYear?: number },
  rangeMode: LeaderboardRangeMode,
  aggregation: 'player' | 'player_game' = 'player',
): Promise<LeaderboardPlayer[]> {
  const { start, end } = getLeaderboardRangeBounds(rangeMode, filters.seasonYear)

  const games: Array<{ id?: string | null }> = []
  let gameFrom = 0
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id,date,tracker_mode')
      .gte('date', start)
      .lte('date', end)
      .neq('tracker_mode', 'team_stats_game')
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .range(gameFrom, gameFrom + LEADERBOARD_QUERY_PAGE_SIZE - 1)
    if (error) throw error
    games.push(...((data ?? []) as Array<{ id?: string | null }>))
    if ((data ?? []).length < LEADERBOARD_QUERY_PAGE_SIZE) break
    gameFrom += LEADERBOARD_QUERY_PAGE_SIZE
  }

  const gameIds = (games ?? []).map((row) => (row as { id?: string | null }).id).filter((id): id is string => Boolean(id))
  if (!gameIds.length) return []

  const eventRows: Array<{
    id?: string | null
    game_id?: string | null
    profile_user_id?: string | null
    stat_key?: string | null
    team_side?: string | null
    player_number?: number | null
  }> = []
  for (const gameIdChunk of chunkArray(gameIds, LEADERBOARD_EVENT_GAME_ID_CHUNK_SIZE)) {
    let eventFrom = 0
    while (true) {
      const { data, error } = await supabase
        .from('v_official_counted_events_for_squad')
        .select('id,game_id,profile_user_id,stat_key,team_side,player_number')
        .in('game_id', gameIdChunk)
        .order('id', { ascending: true })
        .range(eventFrom, eventFrom + LEADERBOARD_QUERY_PAGE_SIZE - 1)
      if (error) throw error
      eventRows.push(...((data ?? []) as typeof eventRows))
      if ((data ?? []).length < LEADERBOARD_QUERY_PAGE_SIZE) break
      eventFrom += LEADERBOARD_QUERY_PAGE_SIZE
    }
  }

  let events = dedupeOfficialLeaderboardEvents(eventRows)

  if (events.some((event) => !event.profile_user_id)) {
    const playerMeta = new Map<string, string | null>()
    for (const gameIdChunk of chunkArray(gameIds, LEADERBOARD_EVENT_GAME_ID_CHUNK_SIZE)) {
      const { data, error } = await supabase
        .from('game_players')
        .select('game_id,team_side,number,profile_user_id')
        .in('game_id', gameIdChunk)
      if (error) throw error
      for (const row of (data ?? []) as Array<{
        game_id?: string | null
        team_side?: string | null
        number?: number | null
        profile_user_id?: string | null
      }>) {
        const key = gamePlayerMetaKey(row.game_id, row.team_side, row.number)
        if (key) playerMeta.set(key, row.profile_user_id ?? null)
      }
    }
    events = events.map((event) => {
      if (event.profile_user_id) return event
      const key = gamePlayerMetaKey(event.game_id, event.team_side, event.player_number)
      return key ? { ...event, profile_user_id: playerMeta.get(key) ?? null } : event
    })
  }

  const userIds = Array.from(
    new Set(
      events
        .map((row) => (row as { profile_user_id?: string | null }).profile_user_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  if (!userIds.length) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path,home_state_code,state,home_league_id,home_club_id,age_years')
    .in('user_id', userIds)

  if (profileError) throw profileError

  const membershipFilter = await resolveMembershipFilter(userIds, {
    leagueId: filters.leagueId,
    clubId: filters.clubId,
  })

  const profileMap = new Map(
    ((profiles ?? []) as any[]).map((profile) => [
      profile.user_id,
      {
        name: profile.name ?? 'Player',
        handle: profile.handle ?? null,
        avatar: avatarUrl(profile.avatar_url ?? null, profile.avatar_path ?? null),
        state: (profile.home_state_code ?? profile.state ?? null) as string | null,
        leagueId: (profile.home_league_id ?? null) as string | null,
        clubId: (profile.home_club_id ?? null) as string | null,
        age: (profile.age_years ?? null) as number | null,
      },
    ])
  )

  const clubIds = Array.from(new Set(Array.from(profileMap.values()).map((p) => p.clubId).filter(Boolean))) as string[]
  const leagueIds = Array.from(new Set(Array.from(profileMap.values()).map((p) => p.leagueId).filter(Boolean))) as string[]

  const [clubsRes, leaguesRes] = await Promise.all([
    clubIds.length ? supabase.from('clubs').select('id,name').in('id', clubIds) : Promise.resolve({ data: [], error: null }),
    leagueIds.length ? supabase.from('leagues').select('id,name').in('id', leagueIds) : Promise.resolve({ data: [], error: null }),
  ])

  if (clubsRes.error) throw clubsRes.error
  if (leaguesRes.error) throw leaguesRes.error

  const clubMap = new Map((clubsRes.data ?? []).map((row: any) => [row.id, row.name ?? null]))
  const leagueMap = new Map((leaguesRes.data ?? []).map((row: any) => [row.id, row.name ?? null]))

  const aggregate = new Map<
    string,
    {
      games: Set<string>
      events: typeof events
    }
  >()

  for (const row of events) {
    const userId = row.profile_user_id as string | null
    const gameId = row.game_id as string | null
    if (!userId || !gameId) continue

    const profile = profileMap.get(userId)
    if (!profile) continue
    if (filters.stateCode && (profile.state || '').toUpperCase() !== filters.stateCode.toUpperCase()) continue
    if (filters.leagueId && profile.leagueId !== filters.leagueId && !membershipFilter) continue
    if (filters.clubId && profile.clubId !== filters.clubId && !membershipFilter) continue
    if (!isAgeInLeaderboardRange(profile.age, filters.ageRange)) continue
    if (membershipFilter && !membershipFilter.has(userId)) continue

    const aggregateKey = aggregation === 'player_game' ? `${userId}:game:${gameId}` : userId
    if (!aggregate.has(aggregateKey)) {
      aggregate.set(aggregateKey, { games: new Set(), events: [] })
    }

    const player = aggregate.get(aggregateKey)!
    player.games.add(gameId)

    player.events.push(row)
  }

  const players = Array.from(aggregate.entries())
    .map(([aggregateKey, value]) => {
      const userId = aggregateKey.split(':game:')[0]
      const profile = profileMap.get(userId)
      if (!profile) return null

      const stats = leaderboardStatsFromTotals(
        buildTotalsFromEvents(
          value.events.map((event) => ({
            stat_key: event.stat_key ?? null,
            quarter: null,
            team_side: event.team_side ?? null,
            player_number: event.player_number ?? null,
          }))
        )
      )

      return {
        userId,
        playerName: profile.name || 'Player',
        handle: profile.handle ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : null,
        avatarUrl: profile.avatar,
        clubName: profile.clubId ? clubMap.get(profile.clubId) ?? null : null,
        leagueName: profile.leagueId ? leagueMap.get(profile.leagueId) ?? null : null,
        homeStateCode: profile.state,
        homeLeagueId: profile.leagueId,
        homeClubId: profile.clubId,
        ageYears: profile.age,
        games: value.games.size,
        stats,
      } satisfies LeaderboardPlayer
    })
    .filter((row): row is LeaderboardPlayer => Boolean(row))

  return players
}

export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRow[]> {
  const players = await getLeaderboardPlayers(
    {
      stateCode: filters.stateCode,
      leagueId: filters.leagueId,
      clubId: filters.clubId,
      ageRange: filters.ageRange,
      seasonYear: filters.seasonYear,
    },
    'season'
  )

  return rankLeaderboardItems(players, (player) => player.stats[filters.statKey]).map(({ item: player, value, rank }) => ({
      rank,
      userId: player.userId,
      playerName: player.playerName,
      handle: player.handle,
      avatarUrl: player.avatarUrl,
      homeClubId: player.homeClubId,
      squadName: null,
      clubName: player.clubName,
      leagueName: player.leagueName,
      games: player.games,
      statValue: value,
      secondaryDisposals: Number(player.stats.disposals ?? 0),
    }))
}
