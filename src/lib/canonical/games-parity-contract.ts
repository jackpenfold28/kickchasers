import { currentSeason, type Band, type BenchmarkContext, type StatKey } from './benchmarks.ts'
import { buildTotalsFromCounts, type AggregatedTotals, type TotalsWithDerived } from './player-event-aggregate.ts'
import { resolveBenchmarkGroup, resolveThresholdBenchmarkGroup } from './position-benchmark.ts'
import { computeGameRatingImpact7, evaluate } from './stats-eval.ts'

export const TRACKED_SUMMARY_POLL_MS = 10_000
export const MATCH_DAY_POLL_MS = 25_000

const FINAL_STATUSES = new Set(['final', 'finished', 'complete', 'completed'])
const LIVE_STATUSES = new Set(['live', 'in_progress'])

export const normalizeGameStatus = (status?: string | null) => String(status ?? '').trim().toLowerCase()

export const isFinalGameStatus = (status?: string | null) => FINAL_STATUSES.has(normalizeGameStatus(status))

export const isLiveGameStatus = (status?: string | null) => LIVE_STATUSES.has(normalizeGameStatus(status))

export const trackedSummaryPollInterval = (status?: string | null, visible = true) =>
  visible && !isFinalGameStatus(status) ? TRACKED_SUMMARY_POLL_MS : null

export const matchDayPollInterval = (visible = true) => (visible ? MATCH_DAY_POLL_MS : null)

export const buildTrackedSummaryRoute = (gameId: string) => `/games/${encodeURIComponent(gameId)}`

export const buildTrackedPlayerSummaryRoute = (gameId: string, gamePlayerId: string) =>
  `/player/${encodeURIComponent(gameId)}/${encodeURIComponent(gamePlayerId)}`

export const canMutateManualGame = (viewerUserId?: string | null, ownerUserId?: string | null) =>
  Boolean(viewerUserId && ownerUserId && viewerUserId === ownerUserId)

export const countTrackedCustomStats = (
  events: Array<{ statKey: string; customLabel?: string | null }>
) => events.reduce<Record<string, number>>((totals, event) => {
  if (!event.customLabel && !event.statKey.startsWith('CUS_')) return totals
  const label = event.customLabel || event.statKey
  totals[label] = (totals[label] ?? 0) + 1
  return totals
}, {})

export const trackedEventMatchesPlayer = (
  event: { teamSide: 'home' | 'away'; playerNumber?: number | null; profileUserId?: string | null },
  player: { teamSide: 'home' | 'away'; number?: number | null; profileUserId?: string | null }
) => {
  if (event.teamSide !== player.teamSide) return false
  if (event.profileUserId && player.profileUserId) return event.profileUserId === player.profileUserId
  return event.playerNumber != null && player.number != null && event.playerNumber === player.number
}

export type ManualTotalsRow = {
  k?: number | null
  hb?: number | null
  t?: number | null
  g?: number | null
  b?: number | null
  m?: number | null
  i50?: number | null
  cl?: number | null
  disposals?: number | null
  frees_for?: number | null
  frees_against?: number | null
  clearances?: number | null
  inside_50s?: number | null
  rebound_50s?: number | null
  hitouts?: number | null
  ground_ball_gets?: number | null
  handball_receives?: number | null
  turnovers?: number | null
  intercepts?: number | null
  one_percenters?: number | null
  goal_assists?: number | null
  contested_possessions?: number | null
  uncontested_possessions?: number | null
  contested_marks?: number | null
  uncontested_marks?: number | null
  effective_kicks?: number | null
  ineffective_kicks?: number | null
  effective_handballs?: number | null
  ineffective_handballs?: number | null
  other_disposals?: number | null
  af?: number | null
  rating?: number | null
}

export type ManualTotalsResult = {
  totals: TotalsWithDerived
  availability: Partial<Record<keyof TotalsWithDerived, boolean>>
  fantasyOverride: number | null
  ratingOverride: number | null
}

const finiteNumber = (value?: number | null) => {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// Character-for-character domain behaviour of mobile lib/manual-game-totals.ts.
export const mapManualTotals = (row: ManualTotalsRow): ManualTotalsResult => {
  const availability: Partial<Record<keyof TotalsWithDerived, boolean>> = {}
  const counts: Partial<AggregatedTotals> = {}

  const assign = (key: keyof AggregatedTotals, raw?: number | null) => {
    const value = finiteNumber(raw)
    if (value == null) return
    counts[key] = value
    availability[key as keyof TotalsWithDerived] = true
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

  const disposals = finiteNumber(row.disposals)
  if (disposals != null) {
    counts.disposals = disposals
    availability.disposals = true
  }

  const totals = buildTotalsFromCounts(counts)
  if (!availability.disposals && (availability.kicks || availability.handballs || availability.otherDisposals)) {
    availability.disposals = true
  }

  const fantasyOverride = finiteNumber(row.af)
  const ratingOverride = finiteNumber(row.rating)
  if (fantasyOverride != null) {
    totals.fantasy = fantasyOverride
    availability.fantasy = true
  } else if (
    availability.kicks || availability.handballs || availability.marks || availability.tackles ||
    availability.hitouts || availability.goals || availability.behinds || availability.freesFor || availability.freesAgainst
  ) {
    availability.fantasy = true
  }
  if (availability.goals || availability.behinds) availability.points = true
  if (availability.effectiveKicks || availability.ineffectiveKicks || availability.effectiveHandballs || availability.ineffectiveHandballs) {
    availability.disposalOpportunities = true
    availability.disposalEfficiency = totals.disposalOpportunities > 0
  }

  return { totals, availability, fantasyOverride, ratingOverride }
}

export type PerformanceEvaluation = {
  impact7: number
  impactBand: Band
  bands: Partial<Record<StatKey, Band>>
}

export const buildPerformanceEvaluation = ({
  totals,
  position,
  context,
  scope = 'game',
  ratingOverride,
}: {
  totals: TotalsWithDerived
  position?: string | null
  context?: BenchmarkContext
  scope?: 'game' | 'quarter'
  ratingOverride?: number | null
}): PerformanceEvaluation => {
  const thresholdGroup = resolveThresholdBenchmarkGroup(position)
  const ratingGroup = resolveBenchmarkGroup(position)
  const disposalEfficiencyPct = totals.disposalEfficiency == null ? undefined : Math.round(totals.disposalEfficiency * 100)
  const stats: Partial<Record<StatKey, number>> = {
    disposals: totals.disposals,
    kicks: totals.kicks,
    handballs: totals.handballs,
    marks: totals.marks,
    tackles: totals.tackles,
    goals: totals.goals,
    behinds: totals.behinds,
    contested_possessions: totals.contestedPossessions,
    uncontested_possessions: totals.uncontestedPossessions,
    turnovers: totals.turnovers,
    intercepts: totals.intercepts,
    goal_assists: totals.goalAssists,
    one_percenters: totals.onePercenters,
    ground_ball_gets: totals.groundBallGets,
    contested_marks: totals.contestedMarks,
    clearances: totals.clearances,
    inside_50s: totals.inside50s,
    rebound_50s: totals.rebound50s,
    hitouts: totals.hitouts,
    frees_for: totals.freesFor,
    frees_against: totals.freesAgainst,
    fantasy_points: totals.fantasy,
  }
  if (disposalEfficiencyPct != null) stats.disposal_efficiency_pct = disposalEfficiencyPct

  const bands = Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [
      key,
      evaluate(key as StatKey, value, thresholdGroup, scope, currentSeason, context),
    ])
  ) as Partial<Record<StatKey, Band>>
  const impact7 = ratingOverride ?? computeGameRatingImpact7(stats, currentSeason, ratingGroup, context)
  const impactBand: Band = impact7 >= 8 ? 'Elite' : impact7 >= 6.5 ? 'Above Av' : impact7 >= 2.5 ? 'Average' : 'Rookie'
  return {
    impact7,
    impactBand,
    bands,
  }
}

export type MatchDayEligibilityInput = {
  trackerMode?: string | null
  status?: string | null
  homeLeagueId?: string | null
  awayLeagueId?: string | null
  homeOfficial?: boolean | null
  awayOfficial?: boolean | null
  countedEventCount?: number | null
}

export const isEligibleMatchDayGame = (
  game: MatchDayEligibilityInput,
  followedLeagueIds: ReadonlySet<string>,
  kind: 'live' | 'recent'
) => {
  if (normalizeGameStatus(game.trackerMode) === 'team_stats_game') return false
  if (kind === 'live' ? !isLiveGameStatus(game.status) : !isFinalGameStatus(game.status)) return false
  if (!game.homeOfficial && !game.awayOfficial) return false
  const followed = [game.homeLeagueId, game.awayLeagueId].find((id): id is string => Boolean(id && followedLeagueIds.has(id)))
  if (!followed) return false
  return kind === 'live' || Number(game.countedEventCount ?? 0) > 0
}

export const resolveMatchDayLeagueId = (
  game: Pick<MatchDayEligibilityInput, 'homeLeagueId' | 'awayLeagueId'>,
  followedLeagueIds: ReadonlySet<string>
) => {
  if (game.homeLeagueId && followedLeagueIds.has(game.homeLeagueId)) return game.homeLeagueId
  if (game.awayLeagueId && followedLeagueIds.has(game.awayLeagueId)) return game.awayLeagueId
  return null
}

export const sortMatchDayGames = <T extends { gameId: string; date?: string | null; updatedAt?: string | null }>(
  games: T[],
  kind: 'live' | 'recent'
) => [...games].sort((left, right) => {
  const leftTime = Date.parse((kind === 'live' ? left.updatedAt : left.date) ?? left.date ?? '') || 0
  const rightTime = Date.parse((kind === 'live' ? right.updatedAt : right.date) ?? right.date ?? '') || 0
  return rightTime === leftTime ? left.gameId.localeCompare(right.gameId) : rightTime - leftTime
})
