import { supabase } from '@/lib/supabase'

export const STAT_OPTIONS = [
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

const EVENT_KEY_MAP: Record<string, LeaderboardStatKey | undefined> = {
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

export async function getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardRow[]> {
  const start = `${filters.seasonYear}-01-01T00:00:00.000Z`
  const end = `${filters.seasonYear}-12-31T23:59:59.999Z`

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
      stats: Record<string, number>
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
      aggregate.set(userId, { games: new Set(), stats: {} })
    }

    const player = aggregate.get(userId)!
    player.games.add(gameId)

    const mapped = EVENT_KEY_MAP[String(row.stat_key || '').toUpperCase()]
    if (!mapped) continue
    player.stats[mapped] = (player.stats[mapped] ?? 0) + 1

    if (mapped === 'kicks' || mapped === 'handballs') {
      player.stats.disposals = (player.stats.disposals ?? 0) + 1
    }
  }

  const list = Array.from(aggregate.entries())
    .map(([userId, value]) => {
      const profile = profileMap.get(userId)
      if (!profile) return null

      return {
        rank: 0,
        userId,
        playerName: profile.name || 'Player',
        handle: profile.handle ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : null,
        avatarUrl: profile.avatar,
        squadName: null,
        clubName: profile.clubId ? clubMap.get(profile.clubId) ?? null : null,
        leagueName: profile.leagueId ? leagueMap.get(profile.leagueId) ?? null : null,
        games: value.games.size,
        statValue: Number(value.stats[filters.statKey] ?? 0),
        secondaryDisposals: Number(value.stats.disposals ?? 0),
      } as LeaderboardRow
    })
    .filter((row): row is LeaderboardRow => Boolean(row))
    .filter((row) => row.statValue > 0)
    .sort((a, b) => {
      if (b.statValue !== a.statValue) return b.statValue - a.statValue
      if (b.secondaryDisposals !== a.secondaryDisposals) return b.secondaryDisposals - a.secondaryDisposals
      return a.playerName.localeCompare(b.playerName)
    })

  return list.map((row, index) => ({ ...row, rank: index + 1 }))
}
