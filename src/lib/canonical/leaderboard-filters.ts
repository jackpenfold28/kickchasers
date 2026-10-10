import type { StatKey } from './benchmarks.ts'
import type { TotalsWithDerived } from './player-event-aggregate.ts'

export type LeaderboardStatKey = Extract<
  StatKey,
  | 'fantasy_points'
  | 'disposals'
  | 'kicks'
  | 'handballs'
  | 'marks'
  | 'tackles'
  | 'goals'
  | 'behinds'
  | 'goal_assists'
  | 'turnovers'
  | 'intercepts'
  | 'one_percenters'
  | 'ground_ball_gets'
  | 'contested_possessions'
  | 'uncontested_possessions'
  | 'contested_marks'
  | 'clearances'
  | 'inside_50s'
  | 'rebound_50s'
  | 'hitouts'
  | 'frees_for'
  | 'frees_against'
>

export type LeaderboardStatDefinition = {
  key: LeaderboardStatKey
  label: string
  unit: 'count' | 'points'
  sortDirection: 'desc'
  derived: boolean
  availability: 'all' | 'featured' | 'both'
}

export const LEADERBOARD_STAT_DEFINITIONS = [
  { key: 'disposals', label: 'Disposals', unit: 'count', sortDirection: 'desc', derived: true, availability: 'both' },
  { key: 'kicks', label: 'Kicks', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'handballs', label: 'Handballs', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'marks', label: 'Marks', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'tackles', label: 'Tackles', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'goals', label: 'Goals', unit: 'count', sortDirection: 'desc', derived: false, availability: 'both' },
  { key: 'behinds', label: 'Behinds', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'goal_assists', label: 'Goal assists', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'turnovers', label: 'Turnovers', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'intercepts', label: 'Intercepts', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'one_percenters', label: '1%ers', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'ground_ball_gets', label: 'GBGs', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'contested_possessions', label: 'Contested', unit: 'count', sortDirection: 'desc', derived: true, availability: 'all' },
  { key: 'uncontested_possessions', label: 'Uncontested', unit: 'count', sortDirection: 'desc', derived: true, availability: 'all' },
  { key: 'clearances', label: 'Clearances', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'inside_50s', label: 'Inside 50s', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'rebound_50s', label: 'Rebound 50s', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'contested_marks', label: 'Cont. marks', unit: 'count', sortDirection: 'desc', derived: true, availability: 'all' },
  { key: 'hitouts', label: 'Hitouts', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'frees_for', label: 'Frees for', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'frees_against', label: 'Frees against', unit: 'count', sortDirection: 'desc', derived: false, availability: 'all' },
  { key: 'fantasy_points', label: 'Fantasy', unit: 'points', sortDirection: 'desc', derived: true, availability: 'featured' },
] as const satisfies readonly LeaderboardStatDefinition[]

export const ALL_LEADERBOARD_STAT_KEYS = LEADERBOARD_STAT_DEFINITIONS
  .filter(({ availability }) => availability === 'all' || availability === 'both')
  .map(({ key }) => key)

export const FEATURED_LEADERBOARD_STAT_KEYS = ['disposals', 'fantasy_points', 'goals'] as const satisfies readonly LeaderboardStatKey[]

export const LEADERBOARD_STAT_LABELS = Object.fromEntries(
  LEADERBOARD_STAT_DEFINITIONS.map(({ key, label }) => [key, label]),
) as Readonly<Record<LeaderboardStatKey, string>>

const LEADERBOARD_STAT_KEYS = new Set<LeaderboardStatKey>(
  LEADERBOARD_STAT_DEFINITIONS.map(({ key }) => key),
)

export function isLeaderboardStatKey(value: unknown): value is LeaderboardStatKey {
  return typeof value === 'string' && LEADERBOARD_STAT_KEYS.has(value as LeaderboardStatKey)
}

export function normalizeLeaderboardStatKey(value: unknown, fallback: LeaderboardStatKey = 'disposals') {
  return isLeaderboardStatKey(value) ? value : fallback
}

export function leaderboardStatsFromTotals(totals: TotalsWithDerived): Record<LeaderboardStatKey, number> {
  return {
    fantasy_points: totals.fantasy,
    disposals: totals.disposals,
    kicks: totals.kicks,
    handballs: totals.handballs,
    marks: totals.marks,
    tackles: totals.tackles,
    goals: totals.goals,
    behinds: totals.behinds,
    goal_assists: totals.goalAssists,
    turnovers: totals.turnovers,
    intercepts: totals.intercepts,
    one_percenters: totals.onePercenters,
    ground_ball_gets: totals.groundBallGets,
    contested_possessions: totals.contestedPossessions,
    uncontested_possessions: totals.uncontestedPossessions,
    contested_marks: totals.contestedMarks,
    clearances: totals.clearances,
    inside_50s: totals.inside50s,
    rebound_50s: totals.rebound50s,
    hitouts: totals.hitouts,
    frees_for: totals.freesFor,
    frees_against: totals.freesAgainst,
  }
}

export type LeaderboardAgeRange = 'Any' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | '18+' | '30+'

export const LEADERBOARD_AGE_RANGES = ['Any', 'U10', 'U12', 'U14', 'U16', 'U18', '18+', '30+'] as const satisfies readonly LeaderboardAgeRange[]

export function isLeaderboardAgeRange(value: unknown): value is LeaderboardAgeRange {
  return typeof value === 'string' && (LEADERBOARD_AGE_RANGES as readonly string[]).includes(value)
}

export function getLeaderboardAgeBounds(ageRange?: LeaderboardAgeRange | null) {
  if (!ageRange || ageRange === 'Any') return null
  const ranges: Record<Exclude<LeaderboardAgeRange, 'Any'>, { minAge?: number; maxAge?: number }> = {
    U10: { maxAge: 10 },
    U12: { minAge: 10, maxAge: 12 },
    U14: { minAge: 12, maxAge: 14 },
    U16: { minAge: 14, maxAge: 16 },
    U18: { minAge: 16, maxAge: 18 },
    '18+': { minAge: 18 },
    '30+': { minAge: 30 },
  }
  return ranges[ageRange]
}

export function isAgeInLeaderboardRange(age: number | null | undefined, ageRange: LeaderboardAgeRange) {
  const bounds = getLeaderboardAgeBounds(ageRange)
  if (!bounds) return true
  if (age == null || !Number.isFinite(age) || age < 0) return false
  if (bounds.minAge != null && age < bounds.minAge) return false
  if (bounds.maxAge != null && age >= bounds.maxAge) return false
  return true
}

export function getAvailableLeaderboardAgeRanges(ages: Array<number | null | undefined>): LeaderboardAgeRange[] {
  const available = new Set<LeaderboardAgeRange>()
  for (const age of ages) {
    if (age == null || !Number.isFinite(age) || age < 0) continue
    if (age < 10) available.add('U10')
    else if (age < 12) available.add('U12')
    else if (age < 14) available.add('U14')
    else if (age < 16) available.add('U16')
    else if (age < 18) available.add('U18')
    else {
      available.add('18+')
      if (age >= 30) available.add('30+')
    }
  }
  return LEADERBOARD_AGE_RANGES.filter((range) => range === 'Any' || available.has(range))
}

export type LeaderboardRangeMode = 'week' | 'season'

export function normalizeLeaderboardSeasonYear(value: unknown, now = new Date()) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 3000 ? parsed : now.getFullYear()
}

export function getLeaderboardRangeBounds(
  rangeMode: LeaderboardRangeMode,
  seasonYear?: unknown,
  now = new Date(),
) {
  if (rangeMode === 'week') {
    const end = new Date(now)
    const start = new Date(end)
    start.setDate(end.getDate() - 7)
    return { start: start.toISOString(), end: end.toISOString(), seasonYear: end.getFullYear() }
  }

  const year = normalizeLeaderboardSeasonYear(seasonYear, now)
  return {
    start: new Date(year, 0, 1).toISOString(),
    end: new Date(new Date(year + 1, 0, 1).getTime() - 1).toISOString(),
    seasonYear: year,
  }
}

export type CanonicalLeaderboardFilters = {
  stateCode: string | null
  leagueId: string | null
  clubId: string | null
  ageRange: LeaderboardAgeRange
}

export const EMPTY_LEADERBOARD_FILTERS: CanonicalLeaderboardFilters = {
  stateCode: null,
  leagueId: null,
  clubId: null,
  ageRange: 'Any',
}

const normalizeFilterId = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null

export function normalizeLeaderboardFilters(input: Partial<CanonicalLeaderboardFilters>): CanonicalLeaderboardFilters {
  return {
    stateCode: normalizeFilterId(input.stateCode)?.toUpperCase() ?? null,
    leagueId: normalizeFilterId(input.leagueId),
    clubId: normalizeFilterId(input.clubId),
    ageRange: isLeaderboardAgeRange(input.ageRange) ? input.ageRange : 'Any',
  }
}

export function selectLeaderboardState(filters: CanonicalLeaderboardFilters, stateCode: string | null) {
  return normalizeLeaderboardFilters({ ...filters, stateCode, leagueId: null, clubId: null })
}

export function selectLeaderboardLeague(filters: CanonicalLeaderboardFilters, leagueId: string | null) {
  return normalizeLeaderboardFilters({ ...filters, leagueId, clubId: null })
}

export type LeaderboardFilterablePlayer = {
  homeStateCode: string | null
  homeLeagueId: string | null
  homeClubId: string | null
  ageYears: number | null
}

export type LeaderboardFilterAvailability = {
  stateCodes: string[]
  leagueIds: Set<string>
  clubIds: Set<string>
  ageRanges: LeaderboardAgeRange[]
}

export function getLeaderboardFilterAvailability<T extends LeaderboardFilterablePlayer>(
  players: T[],
  rawFilters: CanonicalLeaderboardFilters,
): LeaderboardFilterAvailability {
  const filters = normalizeLeaderboardFilters(rawFilters)
  const stateCodes = Array.from(
    new Set(
      players
        .map((player) => player.homeStateCode?.trim().toUpperCase())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort()
  const leagueCandidates = players.filter(
    (player) => !filters.stateCode || player.homeStateCode?.trim().toUpperCase() === filters.stateCode,
  )
  const leagueIds = new Set(
    leagueCandidates.map((player) => player.homeLeagueId).filter((value): value is string => Boolean(value)),
  )
  const clubCandidates = leagueCandidates.filter(
    (player) => !filters.leagueId || player.homeLeagueId === filters.leagueId,
  )
  const clubIds = new Set(
    clubCandidates.map((player) => player.homeClubId).filter((value): value is string => Boolean(value)),
  )
  return {
    stateCodes,
    leagueIds,
    clubIds,
    ageRanges: getAvailableLeaderboardAgeRanges(players.map((player) => player.ageYears)),
  }
}

export function reconcileLeaderboardFilters(
  rawFilters: CanonicalLeaderboardFilters,
  availability: LeaderboardFilterAvailability,
) {
  const filters = normalizeLeaderboardFilters(rawFilters)
  if (filters.stateCode && !availability.stateCodes.includes(filters.stateCode)) {
    return selectLeaderboardState(filters, null)
  }
  if (filters.leagueId && !availability.leagueIds.has(filters.leagueId)) {
    return selectLeaderboardLeague(filters, null)
  }
  if (filters.clubId && !availability.clubIds.has(filters.clubId)) {
    return { ...filters, clubId: null }
  }
  if (!availability.ageRanges.includes(filters.ageRange)) {
    return { ...filters, ageRange: 'Any' as const }
  }
  return filters.stateCode === rawFilters.stateCode &&
    filters.leagueId === rawFilters.leagueId &&
    filters.clubId === rawFilters.clubId &&
    filters.ageRange === rawFilters.ageRange
    ? rawFilters
    : filters
}

export function filterLeaderboardPlayers<T extends LeaderboardFilterablePlayer>(
  players: T[],
  rawFilters: CanonicalLeaderboardFilters,
) {
  const filters = normalizeLeaderboardFilters(rawFilters)
  return players.filter((player) => {
    if (filters.stateCode && player.homeStateCode?.trim().toUpperCase() !== filters.stateCode) return false
    if (filters.leagueId && player.homeLeagueId !== filters.leagueId) return false
    if (filters.clubId && player.homeClubId !== filters.clubId) return false
    return isAgeInLeaderboardRange(player.ageYears, filters.ageRange)
  })
}

export function rankLeaderboardItems<T>(items: T[], getValue: (item: T) => number | null | undefined) {
  return items
    .map((item, sourceIndex) => ({ item, sourceIndex, value: Number(getValue(item) ?? 0) }))
    .filter(({ value }) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b.value - a.value || a.sourceIndex - b.sourceIndex)
    .map(({ item, value }, index) => ({ item, value, rank: index + 1 }))
}
