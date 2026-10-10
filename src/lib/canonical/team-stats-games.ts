import { isFinalGameStatus, isLiveGameStatus, TRACKED_SUMMARY_POLL_MS } from './games-parity-contract.ts'

export type TeamStatsGameAccessContext = {
  viewerUserId?: string | null
  ownerUserId?: string | null
  isOfficial?: boolean
  isPlatformAdmin?: boolean
  membershipRole?: string | null
  membershipStatus?: string | null
  clubRoles?: string[]
}

export type TeamStatsGameCard = {
  id: string
  opponent: string | null
  opponentLogoUrl: string | null
  date: string | null
  venue: string | null
  round: number | null
  rawStatus: string | null
  status: 'Live' | 'Final' | 'Scheduled'
  activeQuarter: number | null
  squadSide: 'home' | 'away'
  homeGoals: number | null
  homeBehinds: number | null
  awayGoals: number | null
  awayBehinds: number | null
}

export type TeamStatsGameRow = {
  id?: string | null
  opponent?: string | null
  opponent_logo_path?: string | null
  date?: string | null
  venue?: string | null
  round?: number | null
  status?: string | null
  is_locked?: boolean | null
  tracker_mode?: string | null
  active_quarter?: number | null
  game_squads?: Array<{ squad_id?: string | null; team_side?: string | null }> | null
}

export type TeamStatsScoreEvent = {
  game_id?: string | null
  team_side?: string | null
  stat_key?: string | null
}

const normalized = (value?: string | null) => String(value ?? '').trim().toLowerCase()

export function canAccessTeamStatsGames(context: TeamStatsGameAccessContext) {
  const viewerId = context.viewerUserId?.trim()
  if (!viewerId) return false
  if (context.isPlatformAdmin || viewerId === context.ownerUserId) return true

  if (context.isOfficial) {
    const clubRoles = new Set((context.clubRoles ?? []).map(normalized))
    return clubRoles.has('admin') || clubRoles.has('coach')
  }

  if (normalized(context.membershipStatus) !== 'accepted') return false
  const role = normalized(context.membershipRole)
  return role === 'owner' || role === 'admin'
}

export function normalizeTeamStatsGameStatus(status?: string | null, isLocked = false): TeamStatsGameCard['status'] {
  if (isLocked || isFinalGameStatus(status)) return 'Final'
  if (isLiveGameStatus(status)) return 'Live'
  return 'Scheduled'
}

export function buildTeamStatsGameRoute(gameId: string) {
  return `/games/${encodeURIComponent(gameId)}`
}

export function teamStatsGamesPollInterval(games: TeamStatsGameCard[], visible = true) {
  return visible && games.some((game) => game.status === 'Live') ? TRACKED_SUMMARY_POLL_MS : null
}

export function buildTeamStatsGameCards({
  rows,
  events,
  squadId,
  resolveLogoUrl,
}: {
  rows: TeamStatsGameRow[]
  events: TeamStatsScoreEvent[]
  squadId: string
  resolveLogoUrl: (path?: string | null) => string | null
}) {
  const scoreByGame = new Map<string, { hg: number; hb: number; ag: number; ab: number; count: number }>()
  for (const event of events) {
    const gameId = event.game_id?.trim()
    if (!gameId) continue
    const score = scoreByGame.get(gameId) ?? { hg: 0, hb: 0, ag: 0, ab: 0, count: 0 }
    const side = normalized(event.team_side) === 'away' ? 'away' : 'home'
    const key = normalized(event.stat_key).toUpperCase()
    if (key === 'G' || key === 'GOAL') side === 'home' ? score.hg++ : score.ag++
    else if (key === 'B' || key === 'BEHIND') side === 'home' ? score.hb++ : score.ab++
    else if ((key === 'RB' || key === 'RUSHED_BEHIND') && side === 'away') score.hb++
    else continue
    score.count++
    scoreByGame.set(gameId, score)
  }

  return rows.flatMap<TeamStatsGameCard>((row) => {
    const id = row.id?.trim()
    const link = row.game_squads?.find((entry) => entry.squad_id === squadId)
    if (!id || normalized(row.tracker_mode) !== 'team_stats_game' || !link) return []
    const status = normalizeTeamStatsGameStatus(row.status, Boolean(row.is_locked))
    const score = scoreByGame.get(id)
    const showScore = status !== 'Scheduled' || Boolean(score?.count)
    return [{
      id,
      opponent: row.opponent ?? null,
      opponentLogoUrl: resolveLogoUrl(row.opponent_logo_path),
      date: row.date ?? null,
      venue: row.venue ?? null,
      round: row.round ?? null,
      rawStatus: row.status ?? null,
      status,
      activeQuarter: row.active_quarter ?? null,
      squadSide: normalized(link.team_side) === 'away' ? 'away' : 'home',
      homeGoals: showScore ? score?.hg ?? 0 : null,
      homeBehinds: showScore ? score?.hb ?? 0 : null,
      awayGoals: showScore ? score?.ag ?? 0 : null,
      awayBehinds: showScore ? score?.ab ?? 0 : null,
    }]
  }).sort((left, right) => {
    const dateOrder = (Date.parse(right.date ?? '') || 0) - (Date.parse(left.date ?? '') || 0)
    return dateOrder || right.id.localeCompare(left.id)
  })
}
