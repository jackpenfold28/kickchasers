import { supabase } from '@/lib/supabase'

export const STAT_OPTIONS = [
  'fantasy_points',
  'disposals',
  'kicks',
  'handballs',
  'marks',
  'tackles',
  'goals',
  'behinds',
  'goal_assists',
  'turnovers',
  'intercepts',
  'one_percenters',
  'clearances',
  'inside_50s',
  'rebound_50s',
  'hitouts',
  'frees_for',
  'frees_against',
] as const

export type LeaderboardStatKey = (typeof STAT_OPTIONS)[number]

export const STAT_LABELS: Record<LeaderboardStatKey, string> = {
  fantasy_points: 'Fantasy',
  disposals: 'Disposals',
  kicks: 'Kicks',
  handballs: 'Handballs',
  marks: 'Marks',
  tackles: 'Tackles',
  goals: 'Goals',
  behinds: 'Behinds',
  goal_assists: 'Goal assists',
  turnovers: 'Turnovers',
  intercepts: 'Intercepts',
  one_percenters: '1%ers',
  clearances: 'Clearances',
  inside_50s: 'Inside 50s',
  rebound_50s: 'Rebound 50s',
  hitouts: 'Hitouts',
  frees_for: 'Frees for',
  frees_against: 'Frees against',
}

export type LeaderboardRangeMode = 'week' | 'season'

export type LeaderboardFilters = {
  seasonYear: number
  stateCode: string | null
  leagueId: string | null
  clubId: string | null
  ageRange: 'Any' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | '18+' | '30+'
  statKey: LeaderboardStatKey
}

export type LeaderboardRow = {
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

const EVENT_KEY_MAP: Record<string, LeaderboardStatKey | undefined> = {
  AF: 'fantasy_points',
  K: 'kicks',
  K_EF: 'kicks',
  K_IF: 'kicks',
  HB: 'handballs',
  HB_EF: 'handballs',
  HB_IF: 'handballs',
  M: 'marks',
  MC: 'marks',
  MUC: 'marks',
  T: 'tackles',
  G: 'goals',
  GOAL: 'goals',
  B: 'behinds',
  BEHIND: 'behinds',
  GA: 'goal_assists',
  TO: 'turnovers',
  INT: 'intercepts',
  ONE_PERCENT: 'one_percenters',
  ONE_PERCENTERS: 'one_percenters',
  CL: 'clearances',
  I50: 'inside_50s',
  R50: 'rebound_50s',
  HO: 'hitouts',
  FF: 'frees_for',
  FA: 'frees_against',
}

const FANTASY_WEIGHTS: Partial<Record<LeaderboardStatKey, number>> = {
  kicks: 3,
  handballs: 2,
  marks: 3,
  tackles: 4,
  goals: 6,
  behinds: 1,
  frees_for: 1,
  frees_against: -3,
  clearances: 3,
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

function computeFantasyPoints(stats: Record<LeaderboardStatKey, number>) {
  return Object.entries(FANTASY_WEIGHTS).reduce((total, [statKey, weight]) => {
    return total + (stats[statKey as LeaderboardStatKey] ?? 0) * (weight ?? 0)
  }, 0)
}

function ageInRange(age: number | null | undefined, range: LeaderboardFilters['ageRange']) {
  if (range === 'Any') return true
  if (age == null) return false
  if (range === 'U10') return age < 10
  if (range === 'U12') return age >= 10 && age < 12
  if (range === 'U14') return age >= 12 && age < 14
  if (range === 'U16') return age >= 14 && age < 16
  if (range === 'U18') return age >= 16 && age < 18
  if (range === '18+') return age >= 18
  if (range === '30+') return age >= 30
  return true
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

function getRangeBounds(rangeMode: LeaderboardRangeMode) {
  if (rangeMode === 'week') {
    const end = new Date()
    const start = new Date(end)
    start.setDate(end.getDate() - 7)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  const year = new Date().getFullYear()
  return {
    start: `${year}-01-01T00:00:00.000Z`,
    end: `${year}-12-31T23:59:59.999Z`,
  }
}

export async function getLeaderboardPlayers(
  filters: Omit<LeaderboardFilters, 'seasonYear' | 'statKey'>,
  rangeMode: LeaderboardRangeMode
): Promise<LeaderboardPlayer[]> {
  const { start, end } = getRangeBounds(rangeMode)

  const { data: games, error: gameError } = await supabase
    .from('games')
    .select('id,date')
    .gte('date', start)
    .lte('date', end)

  if (gameError) throw gameError

  const gameIds = (games ?? []).map((row) => (row as { id?: string | null }).id).filter((id): id is string => Boolean(id))
  if (!gameIds.length) return []

  const { data: events, error: eventError } = await supabase
    .from('v_counted_events')
    .select('game_id,profile_user_id,stat_key')
    .in('game_id', gameIds)

  if (eventError) throw eventError

  const userIds = Array.from(
    new Set(
      (events ?? [])
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
      stats: Record<LeaderboardStatKey, number>
    }
  >()

  for (const row of (events ?? []) as any[]) {
    const userId = row.profile_user_id as string | null
    const gameId = row.game_id as string | null
    if (!userId || !gameId) continue

    const profile = profileMap.get(userId)
    if (!profile) continue
    if (filters.stateCode && (profile.state || '').toUpperCase() !== filters.stateCode.toUpperCase()) continue
    if (filters.leagueId && profile.leagueId !== filters.leagueId && !membershipFilter) continue
    if (filters.clubId && profile.clubId !== filters.clubId && !membershipFilter) continue
    if (!ageInRange(profile.age, filters.ageRange)) continue
    if (membershipFilter && !membershipFilter.has(userId)) continue

    if (!aggregate.has(userId)) {
      aggregate.set(userId, { games: new Set(), stats: {} as Record<LeaderboardStatKey, number> })
    }

    const player = aggregate.get(userId)!
    player.games.add(gameId)

    const mapped = EVENT_KEY_MAP[String(row.stat_key || '').toUpperCase()]
    if (!mapped || mapped === 'fantasy_points') continue

    player.stats[mapped] = (player.stats[mapped] ?? 0) + 1

    if (mapped === 'kicks' || mapped === 'handballs') {
      player.stats.disposals = (player.stats.disposals ?? 0) + 1
    }
  }

  const players = Array.from(aggregate.entries())
    .map(([userId, value]) => {
      const profile = profileMap.get(userId)
      if (!profile) return null

      const stats = { ...value.stats } as Record<LeaderboardStatKey, number>
      stats.fantasy_points = computeFantasyPoints(stats)

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
    },
    'season'
  )

  return players
    .map((player) => ({
      rank: 0,
      userId: player.userId,
      playerName: player.playerName,
      handle: player.handle,
      avatarUrl: player.avatarUrl,
      squadName: null,
      clubName: player.clubName,
      leagueName: player.leagueName,
      games: player.games,
      statValue: Number(player.stats[filters.statKey] ?? 0),
      secondaryDisposals: Number(player.stats.disposals ?? 0),
    }))
    .filter((row) => row.statValue > 0 && isLeaderboardStatValueAllowed(filters.statKey, row.statValue))
    .sort((a, b) => {
      if (b.statValue !== a.statValue) return b.statValue - a.statValue
      if (b.secondaryDisposals !== a.secondaryDisposals) return b.secondaryDisposals - a.secondaryDisposals
      return a.playerName.localeCompare(b.playerName)
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
