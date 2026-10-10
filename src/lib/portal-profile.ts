import { supabase } from '@/lib/supabase'
import { resolveLogoPublicUrl } from '@/lib/logo-storage'
import { formatRoundLabel } from '@/lib/round-label'
import { aggregatePlayerEvents as aggregateCanonicalPlayerEvents } from '@/lib/canonical/player-event-aggregate'
import { currentSeason, type StatKey } from '@/lib/canonical/benchmarks'
import { resolveBenchmarkGroup, resolveThresholdBenchmarkGroup } from '@/lib/canonical/position-benchmark'
import { computeGameRatingImpact7, evaluate } from '@/lib/canonical/stats-eval'

export const TRIAL_ROUND_CODE = 106
export const ACCENT = '#39FF88'
export const STAR_COLOR = '#F6C945'

export type StatScope = 'last3' | 'season' | 'career'
export type ProfileMode = 'self' | 'public'

export type TotalsWithDerived = {
  disposals: number
  kicks: number
  handballs: number
  marks: number
  tackles: number
  goals: number
  behinds: number
  freesFor: number
  freesAgainst: number
  clearances: number
  inside50s: number
  rebound50s: number
  hitouts: number
  groundBallGets: number
  handballReceives: number
  turnovers: number
  intercepts: number
  onePercenters: number
  goalAssists: number
  contestedPossessions: number
  uncontestedPossessions: number
  contestedMarks: number
  uncontestedMarks: number
  effectiveKicks: number
  ineffectiveKicks: number
  effectiveHandballs: number
  ineffectiveHandballs: number
  otherDisposals: number
  points: number
  fantasy: number
  disposalOpportunities: number
  disposalEfficiency: number | null
}

export type ProfileIdentity = {
  userId: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
  actionPhotoUrl: string | null
  clubName: string | null
  clubLogoUrl: string | null
  leagueName: string | null
  state: string | null
  playerNumber: number | null
  playerPosition: string | null
  followersCount: number | null
  followingCount: number | null
  isFollowing: boolean | null
}

export type ProfileGame = {
  id: string
  manualId: string | null
  source: 'manual' | 'events'
  isTrackedOnly: boolean
  logged: boolean
  opponent: string | null
  opponentLogoUrl: string | null
  venue: string | null
  date: string | null
  activityDate: string | null
  activityTimestamp: number
  round: number | string | null
  computedRound: number | null
  seasonYear: number | null
  quarterLength: number | null
  gradeId: string | null
  totals: TotalsWithDerived | null
  statAvailability?: Partial<Record<keyof TotalsWithDerived, boolean>>
  manualRating: number | null
}

export type ScopeSummary = {
  games: number
  averages: Record<keyof TotalsWithDerived, number | null>
  available: boolean
}

export type ProfileDataset = {
  identity: ProfileIdentity
  matches: ProfileGame[]
  distinctYears: number[]
}

export const STAT_FIELDS: (keyof TotalsWithDerived)[] = [
  'disposals',
  'kicks',
  'handballs',
  'marks',
  'tackles',
  'goals',
  'behinds',
  'freesFor',
  'freesAgainst',
  'clearances',
  'inside50s',
  'rebound50s',
  'hitouts',
  'groundBallGets',
  'handballReceives',
  'turnovers',
  'intercepts',
  'onePercenters',
  'goalAssists',
  'contestedPossessions',
  'uncontestedPossessions',
  'contestedMarks',
  'uncontestedMarks',
  'effectiveKicks',
  'ineffectiveKicks',
  'effectiveHandballs',
  'ineffectiveHandballs',
  'otherDisposals',
  'points',
  'fantasy',
  'disposalOpportunities',
  'disposalEfficiency',
]

export const STAT_GROUPS: { key: string; label: string; stats: { key: keyof TotalsWithDerived; label: string }[] }[] = [
  {
    key: 'core',
    label: 'Core output',
    stats: [
      { key: 'disposals', label: 'Disposals' },
      { key: 'kicks', label: 'Kicks' },
      { key: 'handballs', label: 'Handballs' },
      { key: 'marks', label: 'Marks' },
      { key: 'tackles', label: 'Tackles' },
      { key: 'fantasy', label: 'AF Points' },
      { key: 'points', label: 'Total Points' },
    ],
  },
  {
    key: 'scoring',
    label: 'Score involvements',
    stats: [
      { key: 'goals', label: 'Goals' },
      { key: 'behinds', label: 'Behinds' },
      { key: 'goalAssists', label: 'Goal assists' },
    ],
  },
  {
    key: 'contested',
    label: 'Contested & clearances',
    stats: [
      { key: 'clearances', label: 'Clearances' },
      { key: 'contestedPossessions', label: 'Contested poss.' },
      { key: 'uncontestedPossessions', label: 'Uncontested poss.' },
      { key: 'groundBallGets', label: 'Ground ball gets' },
      { key: 'handballReceives', label: 'Handball receives' },
      { key: 'contestedMarks', label: 'Contested marks' },
      { key: 'uncontestedMarks', label: 'Uncontested marks' },
    ],
  },
  {
    key: 'field',
    label: 'Field impact',
    stats: [
      { key: 'inside50s', label: 'Inside 50s' },
      { key: 'rebound50s', label: 'Rebound 50s' },
      { key: 'intercepts', label: 'Intercepts' },
      { key: 'turnovers', label: 'Turnovers' },
      { key: 'onePercenters', label: 'One percenters' },
    ],
  },
  {
    key: 'ruck',
    label: 'Ruck & discipline',
    stats: [
      { key: 'hitouts', label: 'Hitouts' },
      { key: 'freesFor', label: 'Frees for' },
      { key: 'freesAgainst', label: 'Frees against' },
    ],
  },
  {
    key: 'efficiency',
    label: 'Efficiency',
    stats: [
      { key: 'effectiveKicks', label: 'Effective kicks' },
      { key: 'ineffectiveKicks', label: 'Ineffective kicks' },
      { key: 'effectiveHandballs', label: 'Effective handballs' },
      { key: 'ineffectiveHandballs', label: 'Ineffective handballs' },
      { key: 'otherDisposals', label: 'Other disposals' },
      { key: 'disposalOpportunities', label: 'Disposal opps' },
      { key: 'disposalEfficiency', label: 'Disposal efficiency' },
    ],
  },
]

function storageUrl(bucket: string, value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('file://')) return trimmed
  let clean = trimmed.replace(/^\/+/, '')
  const publicPrefix = `public/${bucket}/`
  const bucketPrefix = `${bucket}/`
  if (clean.startsWith(publicPrefix)) clean = clean.slice(publicPrefix.length)
  if (clean.startsWith(bucketPrefix)) clean = clean.slice(bucketPrefix.length)
  const { data } = supabase.storage.from(bucket).getPublicUrl(clean)
  return data?.publicUrl ?? trimmed
}

export function parseSeasonYear(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  const year = date.getFullYear()
  return Number.isNaN(year) ? null : year
}

export function isTrialRound(round: string | number | null | undefined) {
  if (round == null) return false
  if (typeof round === 'number') return round === TRIAL_ROUND_CODE
  const normalized = round.trim().toUpperCase()
  return normalized === 'TRIAL' || Number(normalized) === TRIAL_ROUND_CODE
}

export function includeByTrialFilter(round: string | number | null | undefined, includeTrials: boolean) {
  return includeTrials || !isTrialRound(round)
}

export function formatRoundShortLabel(round: string | number | null | undefined) {
  const label = formatRoundLabel(round, '-')
  const upper = String(label).toUpperCase()
  const finals: Record<string, string> = {
    'ELIMINATION FINAL': 'EF',
    'QUALIFYING FINAL': 'QF',
    'SEMI FINAL': 'SF',
    'PRELIMINARY FINAL': 'PF',
    'GRAND FINAL': 'GF',
    TRIAL: 'T',
  }
  if (finals[upper]) return finals[upper]
  return String(label).startsWith('Round ') ? String(label).replace('Round ', '') : String(label)
}

function emptyTotals(): TotalsWithDerived {
  return {
    disposals: 0,
    kicks: 0,
    handballs: 0,
    marks: 0,
    tackles: 0,
    goals: 0,
    behinds: 0,
    freesFor: 0,
    freesAgainst: 0,
    clearances: 0,
    inside50s: 0,
    rebound50s: 0,
    hitouts: 0,
    groundBallGets: 0,
    handballReceives: 0,
    turnovers: 0,
    intercepts: 0,
    onePercenters: 0,
    goalAssists: 0,
    contestedPossessions: 0,
    uncontestedPossessions: 0,
    contestedMarks: 0,
    uncontestedMarks: 0,
    effectiveKicks: 0,
    ineffectiveKicks: 0,
    effectiveHandballs: 0,
    ineffectiveHandballs: 0,
    otherDisposals: 0,
    points: 0,
    fantasy: 0,
    disposalOpportunities: 0,
    disposalEfficiency: null,
  }
}

function finalizeTotals(totals: TotalsWithDerived) {
  totals.points = totals.goals * 6 + totals.behinds
  totals.fantasy =
    totals.kicks * 3 +
    totals.handballs * 2 +
    totals.marks * 3 +
    totals.tackles * 4 +
    totals.hitouts +
    totals.goals * 6 +
    totals.behinds +
    totals.freesFor -
    totals.freesAgainst * 3
  totals.disposalOpportunities =
    totals.effectiveKicks + totals.ineffectiveKicks + totals.effectiveHandballs + totals.ineffectiveHandballs
  totals.disposalEfficiency =
    totals.disposalOpportunities > 0 ? (totals.effectiveKicks + totals.effectiveHandballs) / totals.disposalOpportunities : null
  return totals
}

function aggregatePlayerEvents(
  events: Array<{ stat_key?: string | null; player_number?: number | null; team_side?: string | null }>,
  preferredPlayerNumber: number | null
) {
  return aggregateCanonicalPlayerEvents(
    events.map((event) => ({
      stat_key: event.stat_key ?? null,
      quarter: null,
      team_side: event.team_side ?? null,
      player_number: event.player_number ?? null,
    })),
    preferredPlayerNumber
  ).totals.all as TotalsWithDerived
}

function numberOrNull(value: unknown) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapManualTotals(row: Record<string, any>) {
  const totals = emptyTotals()
  const availability: Partial<Record<keyof TotalsWithDerived, boolean>> = {}
  const assign = (key: keyof TotalsWithDerived, raw: unknown) => {
    const value = numberOrNull(raw)
    if (value == null) return
    ;(totals[key] as number) = value
    availability[key] = true
  }

  assign('kicks', row.k)
  assign('handballs', row.hb)
  assign('marks', row.m)
  assign('tackles', row.t)
  assign('goals', row.g)
  assign('behinds', row.b)
  assign('clearances', row.cl ?? row.clearances)
  assign('inside50s', row.i50 ?? row.inside_50s)
  assign('rebound50s', row.rebound_50s)
  assign('freesFor', row.frees_for)
  assign('freesAgainst', row.frees_against)
  assign('hitouts', row.hitouts)
  assign('groundBallGets', row.ground_ball_gets)
  assign('handballReceives', row.handball_receives)
  assign('turnovers', row.turnovers)
  assign('intercepts', row.intercepts)
  assign('onePercenters', row.one_percenters)
  assign('goalAssists', row.goal_assists)
  assign('contestedPossessions', row.contested_possessions)
  assign('uncontestedPossessions', row.uncontested_possessions)
  assign('contestedMarks', row.contested_marks)
  assign('uncontestedMarks', row.uncontested_marks)
  assign('effectiveKicks', row.effective_kicks)
  assign('ineffectiveKicks', row.ineffective_kicks)
  assign('effectiveHandballs', row.effective_handballs)
  assign('ineffectiveHandballs', row.ineffective_handballs)
  assign('otherDisposals', row.other_disposals)
  assign('disposals', row.disposals)

  if (!availability.disposals && (availability.kicks || availability.handballs || availability.otherDisposals)) {
    totals.disposals = totals.kicks + totals.handballs + totals.otherDisposals
    availability.disposals = true
  }

  finalizeTotals(totals)
  const fantasyOverride = numberOrNull(row.af)
  if (fantasyOverride != null) {
    totals.fantasy = fantasyOverride
    availability.fantasy = true
  } else if (
    availability.kicks ||
    availability.handballs ||
    availability.marks ||
    availability.tackles ||
    availability.hitouts ||
    availability.goals ||
    availability.behinds ||
    availability.freesFor ||
    availability.freesAgainst
  ) {
    availability.fantasy = true
  }
  if (availability.goals || availability.behinds) availability.points = true
  if (availability.effectiveKicks || availability.ineffectiveKicks || availability.effectiveHandballs || availability.ineffectiveHandballs) {
    availability.disposalOpportunities = true
    availability.disposalEfficiency = totals.disposalOpportunities > 0
  }

  return { totals, availability, manualRating: numberOrNull(row.rating) }
}

export function computeScopeStats(games: ProfileGame[], minGames = 1): ScopeSummary {
  const totals = {} as Record<keyof TotalsWithDerived, number>
  const counts = {} as Record<keyof TotalsWithDerived, number>
  STAT_FIELDS.forEach((key) => {
    totals[key] = 0
    counts[key] = 0
  })
  let countedGames = 0
  games.forEach((game) => {
    if (!game.totals) return
    countedGames += 1
    STAT_FIELDS.forEach((key) => {
      if (key === 'disposalEfficiency') return
      const value = game.totals?.[key]
      const hasValue = game.statAvailability?.[key] ?? value != null
      if (hasValue && typeof value === 'number' && Number.isFinite(value)) {
        totals[key] += value
        counts[key] += 1
      }
    })
  })

  const averages = {} as Record<keyof TotalsWithDerived, number | null>
  STAT_FIELDS.forEach((key) => {
    if (key === 'disposalEfficiency') return
    averages[key] = counts[key] > 0 ? totals[key] / counts[key] : null
  })
  const effective = totals.effectiveKicks + totals.effectiveHandballs
  averages.disposalEfficiency = counts.disposalOpportunities > 0 && totals.disposalOpportunities > 0 ? effective / totals.disposalOpportunities : null

  return {
    games: countedGames,
    averages,
    available: countedGames >= minGames,
  }
}

function toImpact7Stats(totals: TotalsWithDerived): Partial<Record<StatKey, number>> {
  return {
    disposals: totals.disposals,
    tackles: totals.tackles,
    goals: totals.goals,
    behinds: totals.behinds,
    marks: totals.marks,
    hitouts: totals.hitouts,
    fantasy_points: totals.fantasy,
    frees_for: totals.freesFor,
    frees_against: totals.freesAgainst,
  }
}

const PROFILE_STAT_TO_BENCHMARK: Partial<Record<keyof TotalsWithDerived, StatKey>> = {
  disposals: 'disposals',
  kicks: 'kicks',
  handballs: 'handballs',
  marks: 'marks',
  tackles: 'tackles',
  goals: 'goals',
  behinds: 'behinds',
  freesFor: 'frees_for',
  freesAgainst: 'frees_against',
  clearances: 'clearances',
  inside50s: 'inside_50s',
  rebound50s: 'rebound_50s',
  hitouts: 'hitouts',
  groundBallGets: 'ground_ball_gets',
  turnovers: 'turnovers',
  intercepts: 'intercepts',
  onePercenters: 'one_percenters',
  goalAssists: 'goal_assists',
  contestedPossessions: 'contested_possessions',
  uncontestedPossessions: 'uncontested_possessions',
  contestedMarks: 'contested_marks',
  fantasy: 'fantasy_points',
  disposalEfficiency: 'disposal_efficiency_pct',
}

export function gameRatingScore(game: ProfileGame, playerPosition?: string | null) {
  if (game.manualRating != null && Number.isFinite(game.manualRating)) return Number(game.manualRating)
  if (!game.totals) return 0
  return computeGameRatingImpact7(
    toImpact7Stats(game.totals),
    game.seasonYear ?? currentSeason,
    resolveBenchmarkGroup(playerPosition),
    { quarterLengthMinutes: game.quarterLength, gradeId: game.gradeId }
  )
}

export function benchmarkBand(
  statKey: keyof TotalsWithDerived,
  value: number | null | undefined,
  playerPosition?: string | null,
  season = currentSeason
) {
  if (value == null || !Number.isFinite(value)) return null
  const canonicalKey = PROFILE_STAT_TO_BENCHMARK[statKey]
  if (!canonicalKey) return null
  const normalized = canonicalKey === 'disposal_efficiency_pct' ? value * 100 : value
  return evaluate(canonicalKey, normalized, resolveThresholdBenchmarkGroup(playerPosition), 'game', season)
}

async function loadFollowers(viewedUserId: string, viewerId: string | null, mode: ProfileMode) {
  const [{ count: followers }, { count: following }, followState] = await Promise.all([
    supabase.from('follows').select('followee_id', { count: 'exact', head: true }).eq('followee_id', viewedUserId),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('follower_id', viewedUserId),
    mode === 'public' && viewerId && viewerId !== viewedUserId
      ? supabase.from('follows').select('follower_id').eq('follower_id', viewerId).eq('followee_id', viewedUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  return {
    followersCount: followers ?? 0,
    followingCount: following ?? 0,
    isFollowing: mode === 'public' && viewerId && viewerId !== viewedUserId ? Boolean(followState.data) : null,
  }
}

export async function setProfileFollowing(viewedUserId: string, viewerId: string, shouldFollow: boolean) {
  if (shouldFollow) {
    const { error } = await supabase.from('follows').insert({ follower_id: viewerId, followee_id: viewedUserId })
    if (error) throw error
  } else {
    const { error } = await supabase.from('follows').delete().eq('follower_id', viewerId).eq('followee_id', viewedUserId)
    if (error) throw error
  }
}

export async function loadProfileDataset(viewedUserId: string, mode: ProfileMode, viewerId: string | null): Promise<ProfileDataset> {
  const profileSelect =
    'user_id,name,handle,avatar_url,avatar_path,action_photo_url,action_photo_path,player_number,player_position,home_club_id,home_league_id,home_state_code'
  const { data: profile, error: profileError } = await supabase
    .from(mode === 'self' ? 'profiles' : 'profiles_directory')
    .select(profileSelect)
    .eq('user_id', viewedUserId)
    .maybeSingle()
  if (profileError && profileError.code !== 'PGRST116') throw profileError
  if (!profile) throw new Error('Profile unavailable.')

  const profileRow = profile as any
  const [clubRes, leagueRes, followerMeta] = await Promise.all([
    profileRow.home_club_id
      ? supabase.from('clubs').select('id,name,logo_path').eq('id', profileRow.home_club_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    profileRow.home_league_id ? supabase.from('leagues').select('id,name').eq('id', profileRow.home_league_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    loadFollowers(viewedUserId, viewerId, mode),
  ])
  if (clubRes.error && clubRes.error.code !== 'PGRST116') throw clubRes.error
  if (leagueRes.error && leagueRes.error.code !== 'PGRST116') throw leagueRes.error

  let clubLogoUrl = resolveLogoPublicUrl((clubRes.data as any)?.logo_path ?? null)
  if (!clubLogoUrl && profileRow.home_club_id) {
    const { data: squadRow } = await supabase.from('squads').select('logo_url').eq('club_id', profileRow.home_club_id).eq('is_official', true).limit(1).maybeSingle()
    clubLogoUrl = resolveLogoPublicUrl((squadRow as any)?.logo_url ?? null)
  }

  const { data: eventsData, error: eventsError } = await supabase
    .from('v_counted_events')
    .select('game_id,stat_key,created_at,player_number,quarter,team_side,profile_user_id,created_by')
    .or(`profile_user_id.eq.${viewedUserId},and(profile_user_id.is.null,created_by.eq.${viewedUserId})`)
  if (eventsError) throw eventsError

  const eventsByGame = new Map<string, any[]>()
  const firstEventDate = new Map<string, string>()
  for (const row of (eventsData ?? []) as any[]) {
    if (!row.game_id) continue
    const existing = eventsByGame.get(row.game_id) ?? []
    existing.push(row)
    eventsByGame.set(row.game_id, existing)
    if (row.created_at) {
      const previous = firstEventDate.get(row.game_id)
      if (!previous || new Date(row.created_at).getTime() < new Date(previous).getTime()) firstEventDate.set(row.game_id, row.created_at)
    }
  }

  const { data: manualRows, error: manualError } = await supabase
    .from('manual_player_game_totals')
    .select(
      'id,user_id,game_id,opponent_name,opponent_logo_path,opponent_logo_url,venue,round,match_date,source,k,hb,t,g,b,m,i50,cl,disposals,frees_for,frees_against,clearances,inside_50s,rebound_50s,hitouts,ground_ball_gets,handball_receives,turnovers,intercepts,one_percenters,goal_assists,contested_possessions,uncontested_possessions,contested_marks,uncontested_marks,effective_kicks,ineffective_kicks,effective_handballs,ineffective_handballs,other_disposals,af,rating'
    )
    .eq('user_id', viewedUserId)
  if (manualError && manualError.code !== 'PGRST116') throw manualError

  const manualByGame = new Map<string, any>()
  for (const row of (manualRows ?? []) as any[]) {
    if (row.game_id) manualByGame.set(row.game_id, row)
  }

  const gameIds = Array.from(new Set([...eventsByGame.keys(), ...manualByGame.keys()]))
  if (!gameIds.length) {
    return {
      identity: {
        userId: viewedUserId,
        name: profileRow.name ?? null,
        handle: profileRow.handle ?? null,
        avatarUrl: storageUrl('profile-avatars', profileRow.avatar_url ?? profileRow.avatar_path),
        actionPhotoUrl: storageUrl('profile-avatars', profileRow.action_photo_url ?? profileRow.action_photo_path),
        clubName: (clubRes.data as any)?.name ?? null,
        clubLogoUrl,
        leagueName: (leagueRes.data as any)?.name ?? null,
        state: profileRow.home_state_code ?? null,
        playerNumber: profileRow.player_number ?? null,
        playerPosition: profileRow.player_position ?? null,
        ...followerMeta,
      },
      matches: [],
      distinctYears: [],
    }
  }

  const [playersRes, gamesRes, awaySquadsRes] = await Promise.all([
    supabase.from('game_players').select('game_id').eq('profile_user_id', viewedUserId).in('game_id', gameIds),
    supabase
      .from('games')
      .select('id,opponent,venue,date,round,opponent_logo_path,track_both_teams,track_request_status,tracked_for_profile_user_id,quarter_length,grade_id')
      .in('id', gameIds),
    supabase.from('game_squads').select('game_id,team_side,squads(club_id,logo_url)').eq('team_side', 'away').in('game_id', gameIds),
  ])
  if (playersRes.error) throw playersRes.error
  if (gamesRes.error) throw gamesRes.error

  const involvedGameIds = new Set(((playersRes.data ?? []) as any[]).map((row) => row.game_id).filter(Boolean))
  const awayLogoByGame = new Map<string, string | null>()
  for (const row of ((awaySquadsRes as any).data ?? []) as any[]) {
    awayLogoByGame.set(row.game_id, resolveLogoPublicUrl(row.squads?.logo_url ?? null))
  }

  const matches = ((gamesRes.data ?? []) as any[])
    .map((game, index) => {
      const manualRow = manualByGame.get(game.id)
      const gameEvents = eventsByGame.get(game.id) ?? []
      const hasEvents = gameEvents.length > 0
      const isTrackedSubject = game.tracked_for_profile_user_id === viewedUserId || (!game.track_both_teams && !game.tracked_for_profile_user_id && hasEvents)
      const isPlayerInvolved = involvedGameIds.has(game.id) || isTrackedSubject
      const isTrackedOnly = hasEvents && !manualRow && !isPlayerInvolved
      const useManual = Boolean(manualRow) && !hasEvents
      let totals: TotalsWithDerived | null = null
      let statAvailability: Partial<Record<keyof TotalsWithDerived, boolean>> | undefined
      let manualRating: number | null = null

      if (useManual && manualRow) {
        const mapped = mapManualTotals(manualRow)
        totals = mapped.totals
        statAvailability = mapped.availability
        manualRating = mapped.manualRating
      } else if (hasEvents && isPlayerInvolved) {
        totals = aggregatePlayerEvents(gameEvents, profileRow.player_number ?? null)
      }

      const fallbackDate = firstEventDate.get(game.id) ?? null
      const activityDate = useManual ? manualRow?.match_date ?? game.date ?? fallbackDate : game.date ?? fallbackDate
      const timestamp = activityDate ? new Date(activityDate).getTime() : index
      const logged =
        Boolean(useManual && manualRow) ||
        isTrackedOnly ||
        Boolean(
          hasEvents &&
            totals &&
            (totals.disposals > 0 || totals.goals > 0 || totals.behinds > 0 || totals.marks > 0 || totals.tackles > 0 || totals.fantasy > 0)
        )

      const row: ProfileGame = {
        id: game.id,
        manualId: manualRow?.id ?? null,
        source: useManual ? 'manual' : 'events',
        isTrackedOnly,
        logged,
        opponent: manualRow?.opponent_name ?? game.opponent ?? 'Opponent TBC',
        opponentLogoUrl: manualRow?.opponent_logo_url ?? resolveLogoPublicUrl(manualRow?.opponent_logo_path ?? awayLogoByGame.get(game.id) ?? game.opponent_logo_path ?? null),
        venue: manualRow?.venue ?? game.venue ?? null,
        date: game.date ?? null,
        activityDate,
        activityTimestamp: Number.isNaN(timestamp) ? index : timestamp,
        round: manualRow?.round ?? game.round ?? null,
        computedRound: (manualRow?.round ?? game.round ?? index + 1) as number,
        seasonYear: parseSeasonYear(activityDate) ?? parseSeasonYear(game.date),
        quarterLength: game.quarter_length ?? null,
        gradeId: game.grade_id ?? null,
        totals,
        statAvailability,
        manualRating,
      }
      return row
    })
    .sort((a, b) => (a.computedRound ?? 0) - (b.computedRound ?? 0))

  const loggedGames = matches.filter((game) => game.logged && includeByTrialFilter(game.round ?? game.computedRound, false))
  const distinctYears = Array.from(new Set(loggedGames.map((game) => parseSeasonYear(game.activityDate ?? game.date)).filter((year): year is number => year != null))).sort((a, b) => b - a)

  return {
    identity: {
      userId: viewedUserId,
      name: profileRow.name ?? null,
      handle: profileRow.handle ?? null,
      avatarUrl: storageUrl('profile-avatars', profileRow.avatar_url ?? profileRow.avatar_path),
      actionPhotoUrl: storageUrl('profile-avatars', profileRow.action_photo_url ?? profileRow.action_photo_path),
      clubName: (clubRes.data as any)?.name ?? null,
      clubLogoUrl,
      leagueName: (leagueRes.data as any)?.name ?? null,
      state: profileRow.home_state_code ?? null,
      playerNumber: profileRow.player_number ?? null,
      playerPosition: profileRow.player_position ?? null,
      ...followerMeta,
    },
    matches,
    distinctYears,
  }
}
