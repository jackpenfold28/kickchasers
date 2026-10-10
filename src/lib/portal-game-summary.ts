import type { GameSummaryEvent, GameSummaryPlayer } from '@/lib/portal-games'
import { buildTotalsFromEvents } from '@/lib/canonical/player-event-aggregate'
import { buildPerformanceEvaluation, countTrackedCustomStats } from '@/lib/canonical/games-parity-contract'
import type { Band, BenchmarkContext } from '@/lib/canonical/benchmarks'

export type TeamSide = 'home' | 'away'
export type SummaryScope = 'total' | number | `OT${number}`
export type SummarySortKey = SummaryStatKey | 'name' | 'jumperNumber' | 'GB' | 'impact7'

export const SUMMARY_STAT_KEYS = [
  'K',
  'HB',
  'D',
  'M',
  'T',
  'G',
  'B',
  'FF',
  'FA',
  'CL',
  'I50',
  'R50',
  'HO',
  'AF',
  'KEF',
  'KIF',
  'HEF',
  'HIF',
  'MC',
  'MUC',
  'CON',
  'UC',
  'GBG',
  'HR',
  'GA',
  'TO',
  'INT',
  'ONE_PERCENT',
] as const

export type SummaryStatKey = (typeof SUMMARY_STAT_KEYS)[number]
export type SummaryStats = Record<SummaryStatKey, number>

export type SummaryColumnDef = {
  key: SummaryStatKey | 'GB'
  label: string
}

export type PlayerSummaryRow = {
  teamSide: TeamSide
  playerId: string
  jumperNumber: number | null
  name: string
  linkedUser: boolean
  profileUserId: string | null
  position: string | null
  impact7: number
  impactBand: Band
  customStats: Record<string, number>
  stats: SummaryStats
}

export type TeamSummaryRow = {
  teamSide: TeamSide
  stats: SummaryStats
}

export type SummaryInsightTile = {
  key: 'best' | 'gap' | 'momentum'
  title: string
  value: string
  subtitle: string
  teamSide: TeamSide | null
}

export type TeamComparisonGroup = {
  title: string
  rows: Array<{
    key: SummaryStatKey | 'GB' | 'DE%'
    label: string
  }>
}

const EVENT_TO_SUMMARY_KEY: Record<string, SummaryStatKey> = {
  K: 'K',
  HB: 'HB',
  M: 'M',
  T: 'T',
  G: 'G',
  B: 'B',
  FF: 'FF',
  FA: 'FA',
  CL: 'CL',
  I50: 'I50',
  R50: 'R50',
  HO: 'HO',
  GBG: 'GBG',
  HR: 'HR',
  GA: 'GA',
  TO: 'TO',
  INT: 'INT',
  ONE_PERCENT: 'ONE_PERCENT',
  CON: 'CON',
  UC: 'UC',
  MC: 'MC',
  MUC: 'MUC',
  K_EF: 'KEF',
  K_IF: 'KIF',
  HB_EF: 'HEF',
  HB_IF: 'HIF',
}

const baseColumns: SummaryColumnDef[] = [
  { key: 'GB', label: 'G.B' },
  { key: 'D', label: 'D' },
  { key: 'K', label: 'K' },
  { key: 'HB', label: 'HB' },
  { key: 'M', label: 'M' },
  { key: 'T', label: 'T' },
  { key: 'AF', label: 'AF' },
]

const advancedColumns: SummaryColumnDef[] = [
  { key: 'GB', label: 'G.B' },
  { key: 'D', label: 'D' },
  { key: 'K', label: 'K' },
  { key: 'KEF', label: 'KEF' },
  { key: 'KIF', label: 'KIF' },
  { key: 'HB', label: 'HB' },
  { key: 'HEF', label: 'HEF' },
  { key: 'HIF', label: 'HIF' },
  { key: 'M', label: 'M' },
  { key: 'MC', label: 'MC' },
  { key: 'MUC', label: 'MUC' },
  { key: 'T', label: 'T' },
  { key: 'AF', label: 'AF' },
  { key: 'G', label: 'G' },
  { key: 'B', label: 'B' },
  { key: 'FF', label: 'FF' },
  { key: 'FA', label: 'FA' },
  { key: 'CL', label: 'CL' },
  { key: 'I50', label: 'I50' },
  { key: 'R50', label: 'R50' },
  { key: 'HO', label: 'HO' },
  { key: 'CON', label: 'CON' },
  { key: 'UC', label: 'UC' },
  { key: 'GBG', label: 'GBG' },
  { key: 'HR', label: 'HR' },
  { key: 'GA', label: 'GA' },
  { key: 'TO', label: 'TO' },
  { key: 'INT', label: 'INT' },
  { key: 'ONE_PERCENT', label: '1%' },
]

export const BASE_SUMMARY_COLUMNS = baseColumns
export const ADVANCED_SUMMARY_COLUMNS = advancedColumns
export const ADVANCED_ONLY_COLUMN_KEYS = advancedColumns
  .filter((col) => !baseColumns.some((base) => base.key === col.key))
  .map((col) => col.key)

export const TEAM_COMPARISON_GROUPS: TeamComparisonGroup[] = [
  {
    title: 'Possession',
    rows: [
      { key: 'D', label: 'Disposals' },
      { key: 'K', label: 'Kicks' },
      { key: 'HB', label: 'Handballs' },
      { key: 'M', label: 'Marks' },
      { key: 'CL', label: 'Clearances' },
      { key: 'I50', label: 'Inside 50s' },
      { key: 'R50', label: 'Rebound 50s' },
      { key: 'TO', label: 'Turnovers' },
      { key: 'DE%', label: 'Disposal Efficiency' },
    ],
  },
  {
    title: 'Scoring',
    rows: [
      { key: 'GB', label: 'G.B' },
      { key: 'G', label: 'Goals' },
      { key: 'B', label: 'Behinds' },
      { key: 'GA', label: 'Goal Assists' },
      { key: 'AF', label: 'AF' },
    ],
  },
  {
    title: 'Contest',
    rows: [
      { key: 'T', label: 'Tackles' },
      { key: 'CON', label: 'Contested' },
      { key: 'UC', label: 'Uncontested' },
      { key: 'MC', label: 'Contested Marks' },
      { key: 'MUC', label: 'Uncontested Marks' },
      { key: 'GBG', label: 'Ground Ball Gets' },
    ],
  },
  {
    title: 'Defence',
    rows: [
      { key: 'INT', label: 'Intercepts' },
      { key: 'ONE_PERCENT', label: '1%' },
      { key: 'FF', label: 'Frees For' },
      { key: 'FA', label: 'Frees Against' },
      { key: 'HR', label: 'Hitouts to Adv' },
      { key: 'HO', label: 'Hitouts' },
    ],
  },
]

const createEmptyStats = (): SummaryStats =>
  SUMMARY_STAT_KEYS.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {} as SummaryStats)

const mapQuarterToScope = (quarter: number | null | undefined): SummaryScope | null => {
  if (!quarter) return null
  if (quarter <= 4) return quarter as SummaryScope
  return `OT${quarter - 4}`
}

const matchesScope = (event: GameSummaryEvent, scope: SummaryScope): boolean => {
  if (scope === 'total') return true
  if (typeof scope === 'number') return event.quarter === scope
  const otIndex = Number(scope.replace('OT', '') || 0)
  return event.quarter === 4 + otIndex
}

const findPlayerRow = (
  playerLookup: Map<string, PlayerSummaryRow>,
  numberLookup: Map<string, string>,
  event: GameSummaryEvent
): PlayerSummaryRow | null => {
  if (event.profileUserId) {
    for (const row of playerLookup.values()) {
      if (row.teamSide === event.teamSide && row.profileUserId === event.profileUserId) return row
    }
  }

  if (typeof event.playerNumber === 'number') {
    const key = numberLookup.get(`${event.teamSide}:${event.playerNumber}`)
    if (key && playerLookup.has(key)) return playerLookup.get(key) ?? null
  }

  return null
}

export const formatScopeLabel = (scope: SummaryScope) => {
  if (scope === 'total') return 'T'
  if (typeof scope === 'number') return `Q${scope}`
  return scope.toUpperCase()
}

export const formatPlayerName = (value: string | null | undefined) => {
  if (!value) return ''
  const parts = value
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0]
  const surname = parts.length > 1 ? parts[parts.length - 1] : first
  return `${first.charAt(0).toUpperCase()}. ${surname.charAt(0).toUpperCase()}${surname.slice(1)}`
}

export const formatTeamShortName = (value: string | null | undefined) => {
  if (!value) return ''
  return value.split(' ').map((part) => part.trim()).filter(Boolean)[0] ?? value
}

export const formatClubInitials = (value: string | null | undefined) => {
  if (!value) return ''
  const initials = value
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, '').trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  return initials || value.trim().charAt(0).toUpperCase()
}

const applyCanonicalStats = (stats: SummaryStats, events: GameSummaryEvent[]) => {
  const totals = buildTotalsFromEvents(
    events.map((event) => ({
      stat_key: event.statKey,
      quarter: event.quarter,
      team_side: event.teamSide,
      player_number: event.playerNumber,
    }))
  )
  stats.K = totals.kicks
  stats.HB = totals.handballs
  stats.D = totals.disposals
  stats.M = totals.marks
  stats.T = totals.tackles
  stats.G = totals.goals
  stats.B = totals.behinds
  stats.FF = totals.freesFor
  stats.FA = totals.freesAgainst
  stats.CL = totals.clearances
  stats.I50 = totals.inside50s
  stats.R50 = totals.rebound50s
  stats.HO = totals.hitouts
  stats.GBG = totals.groundBallGets
  stats.HR = totals.handballReceives
  stats.GA = totals.goalAssists
  stats.TO = totals.turnovers
  stats.INT = totals.intercepts
  stats.ONE_PERCENT = totals.onePercenters
  stats.CON = totals.contestedPossessions
  stats.UC = totals.uncontestedPossessions
  stats.MC = totals.contestedMarks
  stats.MUC = totals.uncontestedMarks
  stats.KEF = totals.effectiveKicks
  stats.KIF = totals.ineffectiveKicks
  stats.HEF = totals.effectiveHandballs
  stats.HIF = totals.ineffectiveHandballs
  stats.AF = totals.fantasy
  return totals
}

export const buildAvailableScopes = (events: GameSummaryEvent[]) => {
  const maxQuarter = events.reduce((max, event) => Math.max(max, event.quarter ?? 0), 0)
  const scopes: SummaryScope[] = ['total', 1, 2, 3, 4]
  if (maxQuarter > 4) {
    for (let quarter = 5; quarter <= maxQuarter; quarter += 1) {
      const scope = mapQuarterToScope(quarter)
      if (scope) scopes.push(scope)
    }
  }
  return scopes
}

export const buildPlayerSummaryRows = (
  events: GameSummaryEvent[],
  players: GameSummaryPlayer[],
  options: { teamSide: TeamSide; scope: SummaryScope; benchmarkContext?: BenchmarkContext }
) => {
  const playerLookup = new Map<string, PlayerSummaryRow>()
  const numberLookup = new Map<string, string>()
  const eventsByPlayer = new Map<string, GameSummaryEvent[]>()

  players
    .filter((player) => player.teamSide === options.teamSide)
    .forEach((player) => {
      const row: PlayerSummaryRow = {
        teamSide: player.teamSide,
        playerId: player.id,
        jumperNumber: player.number ?? null,
        name: player.name ?? '',
        linkedUser: Boolean(player.profileUserId),
        profileUserId: player.profileUserId ?? null,
        position: player.position ?? null,
        impact7: 0,
        impactBand: 'Rookie',
        customStats: {},
        stats: createEmptyStats(),
      }
      playerLookup.set(player.id, row)
      if (typeof player.number === 'number') numberLookup.set(`${player.teamSide}:${player.number}`, player.id)
    })

  events
    .filter((event) => event.teamSide === options.teamSide && matchesScope(event, options.scope))
    .forEach((event) => {
      const row = findPlayerRow(playerLookup, numberLookup, event)
      const key = EVENT_TO_SUMMARY_KEY[event.statKey]
      if (!row) return
      if (key) row.stats[key] += 1
      const playerEvents = eventsByPlayer.get(row.playerId) ?? []
      playerEvents.push(event)
      eventsByPlayer.set(row.playerId, playerEvents)
    })

  for (const row of playerLookup.values()) {
    const playerEvents = eventsByPlayer.get(row.playerId) ?? []
    const totals = applyCanonicalStats(row.stats, playerEvents)
    const player = players.find((candidate) => candidate.id === row.playerId)
    const performance = buildPerformanceEvaluation({
      totals,
      position: row.position,
      scope: options.scope === 'total' ? 'game' : 'quarter',
      context: { ...options.benchmarkContext, playerDob: player?.dob ?? options.benchmarkContext?.playerDob ?? null },
    })
    row.impact7 = performance.impact7
    row.impactBand = performance.impactBand
    row.customStats = countTrackedCustomStats(playerEvents)
  }

  return Array.from(playerLookup.values()).sort((a, b) => {
    const aNum = a.jumperNumber ?? 9999
    const bNum = b.jumperNumber ?? 9999
    if (aNum === bNum) return a.name.localeCompare(b.name)
    return aNum - bNum
  })
}

export const buildTeamSummaryRows = (events: GameSummaryEvent[], options: { scope: SummaryScope }) => {
  const rows: TeamSummaryRow[] = [
    { teamSide: 'home', stats: createEmptyStats() },
    { teamSide: 'away', stats: createEmptyStats() },
  ]

  events
    .filter((event) => matchesScope(event, options.scope))
    .forEach((event) => {
      const row = rows.find((item) => item.teamSide === event.teamSide)
      const key = EVENT_TO_SUMMARY_KEY[event.statKey]
      if (!row || !key) return
      row.stats[key] += 1
    })

  rows.forEach((row) =>
    applyCanonicalStats(
      row.stats,
      events.filter((event) => event.teamSide === row.teamSide && matchesScope(event, options.scope))
    )
  )
  return rows
}

export const computeScoreBySide = (events: GameSummaryEvent[], scope: SummaryScope = 'total') => {
  const scores = {
    home: { goals: 0, behinds: 0, points: 0 },
    away: { goals: 0, behinds: 0, points: 0 },
  }

  events.filter((event) => matchesScope(event, scope)).forEach((event) => {
    const side = event.teamSide === 'away' ? 'away' : 'home'
    if (event.statKey === 'G') {
      scores[side].goals += 1
      scores[side].points += 6
    } else if (event.statKey === 'B') {
      scores[side].behinds += 1
      scores[side].points += 1
    } else if (event.statKey === 'RB' && side === 'away') {
      scores.home.behinds += 1
      scores.home.points += 1
    }
  })

  return scores
}

export const sortPlayerRows = (
  rows: PlayerSummaryRow[],
  sortKey: SummarySortKey,
  sortDirection: 'asc' | 'desc'
) => {
  const next = [...rows]

  next.sort((a, b) => {
    const resolveValue = (row: PlayerSummaryRow) => {
      if (sortKey === 'name') return row.name.toLowerCase()
      if (sortKey === 'jumperNumber') return row.jumperNumber ?? 9999
      if (sortKey === 'impact7') return row.impact7
      if (sortKey === 'GB') return (row.stats.G ?? 0) + (row.stats.B ?? 0) * 0.1
      if (sortKey === 'D') return row.stats.D ?? (row.stats.K ?? 0) + (row.stats.HB ?? 0)
      return row.stats[sortKey] ?? 0
    }

    const aValue = resolveValue(a)
    const bValue = resolveValue(b)

    if (aValue === bValue) return (a.jumperNumber ?? 9999) - (b.jumperNumber ?? 9999)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number)
  })

  return next
}

const resolvePercentDiff = (homeValue: number, awayValue: number) => {
  const average = (homeValue + awayValue) / 2
  return (Math.abs(homeValue - awayValue) / Math.max(1, average)) * 100
}

const resolvePressure = (stats: SummaryStats | undefined) =>
  (stats?.T ?? 0) + (stats?.ONE_PERCENT ?? 0) + (stats?.FF ?? 0) - (stats?.FA ?? 0)

export const computeInsightTiles = ({
  playerRows,
  homeStats,
  awayStats,
  events,
  availableScopes,
  homeTeamName,
  awayTeamName,
}: {
  playerRows: PlayerSummaryRow[]
  homeStats: SummaryStats | undefined
  awayStats: SummaryStats | undefined
  events: GameSummaryEvent[]
  availableScopes: SummaryScope[]
  homeTeamName: string
  awayTeamName: string
}): SummaryInsightTile[] => {
  const bestRatedPlayer = [...playerRows].sort((a, b) => (b.stats.AF ?? 0) - (a.stats.AF ?? 0))[0]

  const candidateKeys: SummaryStatKey[] = [
    'M',
    'T',
    'I50',
    'R50',
    'CL',
    'HO',
    'CON',
    'UC',
    'MC',
    'MUC',
    'GBG',
    'HR',
    'G',
    'B',
    'FF',
    'FA',
    'GA',
    'TO',
    'INT',
    'ONE_PERCENT',
  ]

  let biggestGapLabel = 'No data'
  let biggestGapValue = '—'
  let biggestGapSide: TeamSide | null = null

  if (homeStats && awayStats) {
    let best: { key: SummaryStatKey | null; diff: number; side: TeamSide | null } = {
      key: null,
      diff: 0,
      side: null,
    }

    for (const key of candidateKeys) {
      const homeValue = homeStats[key] ?? 0
      const awayValue = awayStats[key] ?? 0
      if (homeValue === 0 && awayValue === 0) continue
      const diff = resolvePercentDiff(homeValue, awayValue)
      if (diff > best.diff) {
        best = {
          key,
          diff: Math.abs(homeValue - awayValue),
          side: homeValue === awayValue ? null : homeValue > awayValue ? 'home' : 'away',
        }
      }
    }

    if (best.key) {
      biggestGapLabel = best.key === 'ONE_PERCENT' ? '1%' : best.key
      biggestGapValue = String(best.diff)
      biggestGapSide = best.side
    }
  }

  const scopedQuarters = availableScopes.filter((scope) => scope !== 'total')
  const lastScope = scopedQuarters[scopedQuarters.length - 1] ?? null
  const homeMomentumLabel = formatClubInitials(homeTeamName) || 'HOME'
  const awayMomentumLabel = formatClubInitials(awayTeamName) || 'AWAY'
  let momentumValue = '—'
  let momentumMeta = 'Pressure'
  let momentumSide: TeamSide | null = null

  if (lastScope) {
    const scopedScore = computeScoreBySide(events, lastScope)
    const totalScoring =
      scopedScore.home.goals +
      scopedScore.home.behinds +
      scopedScore.away.goals +
      scopedScore.away.behinds
    if (totalScoring > 0) {
      const diff = scopedScore.home.points - scopedScore.away.points
      if (diff === 0) {
        momentumValue = 'Even'
        momentumMeta = `${formatScopeLabel(lastScope)} level`
      } else if (diff > 0) {
        momentumValue = `${homeMomentumLabel} +${diff}`
        momentumMeta = `${formatScopeLabel(lastScope)} points`
        momentumSide = 'home'
      } else {
        momentumValue = `${awayMomentumLabel} +${Math.abs(diff)}`
        momentumMeta = `${formatScopeLabel(lastScope)} points`
        momentumSide = 'away'
      }
    }
  }

  if (momentumValue === '—' && homeStats && awayStats) {
    const diff = resolvePressure(homeStats) - resolvePressure(awayStats)
    if (diff === 0) {
      momentumValue = 'Even'
    } else if (diff > 0) {
      momentumValue = `${homeMomentumLabel} +${diff}`
      momentumSide = 'home'
    } else {
      momentumValue = `${awayMomentumLabel} +${Math.abs(diff)}`
      momentumSide = 'away'
    }
    momentumMeta = 'Pressure rating'
  }

  return [
    {
      key: 'best',
      title: 'Best Rated',
      value: bestRatedPlayer ? String(bestRatedPlayer.stats.AF ?? 0) : '—',
      subtitle: bestRatedPlayer ? formatPlayerName(bestRatedPlayer.name) : 'No player data',
      teamSide: bestRatedPlayer?.teamSide ?? null,
    },
    {
      key: 'gap',
      title: 'Biggest Gap',
      value: biggestGapValue,
      subtitle: biggestGapLabel,
      teamSide: biggestGapSide,
    },
    {
      key: 'momentum',
      title: 'Momentum Pulse',
      value: momentumValue,
      subtitle: momentumMeta,
      teamSide: momentumSide,
    },
  ]
}

export const resolveStatValue = (key: SummaryStatKey | 'GB' | 'DE%', stats: SummaryStats) => {
  if (key === 'GB') {
    const goals = stats.G ?? 0
    const behinds = stats.B ?? 0
    return {
      numeric: goals + behinds * 0.1,
      display: `${goals}.${behinds}`,
      present: goals > 0 || behinds > 0,
    }
  }

  if (key === 'D') {
    const value = stats.D ?? (stats.K ?? 0) + (stats.HB ?? 0)
    return { numeric: value, display: String(value), present: value > 0 }
  }

  if (key === 'DE%') {
    const effective = (stats.KEF ?? 0) + (stats.HEF ?? 0)
    const ineffective = (stats.KIF ?? 0) + (stats.HIF ?? 0)
    const total = effective + ineffective
    if (total <= 0) return { numeric: 0, display: '—', present: false }
    const percentage = Math.round((effective / total) * 100)
    return { numeric: percentage, display: `${percentage}%`, present: true }
  }

  const value = stats[key] ?? 0
  return { numeric: value, display: String(value), present: value > 0 }
}
