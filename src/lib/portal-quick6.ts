import type { GameLogRow } from '@/lib/portal-games'
import { supabase } from '@/lib/supabase'

export type Quick6Scope = 'last3' | 'season' | 'career'

export type Quick6StatKey = 'disposals' | 'kicks' | 'handballs' | 'marks' | 'tackles' | 'fantasy'

export type Quick6ScopeStat = {
  value: number | null
  display: string
  available: boolean
}

export type Quick6StatSummary = {
  key: Quick6StatKey
  label: string
  season: Quick6ScopeStat
  last3: Quick6ScopeStat
  career: Quick6ScopeStat
}

export type Quick6Summary = {
  seasonYear: number | null
  availableSeasonYears: number[]
  seasonGameCount: number
  canUseLast3: boolean
  stats: Quick6StatSummary[]
}

type Quick6GameTotals = {
  kicks: number
  handballs: number
  disposals: number
  marks: number
  tackles: number
  goals: number
  behinds: number
  freesFor: number
  freesAgainst: number
  hitouts: number
  fantasy: number
}

type Quick6GameRow = {
  id: string
  date: string | null
  seasonYear: number | null
  timestamp: number
  totals: Quick6GameTotals
}

export type Quick6Dataset = {
  loggedGames: Quick6GameRow[]
  availableSeasonYears: number[]
}

type RawEventRow = {
  game_id: string | null
  stat_key: string | null
  profile_user_id?: string | null
}

type ManualRow = {
  id: string
  game_id: string | null
  match_date: string | null
  k: number | null
  hb: number | null
  t: number | null
  g: number | null
  b: number | null
  m: number | null
  frees_for: number | null
  frees_against: number | null
  hitouts: number | null
  af: number | null
}

function parseSeasonYear(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear()
}

function createEmptyTotals(): Omit<Quick6GameTotals, 'fantasy'> {
  return {
    kicks: 0,
    handballs: 0,
    disposals: 0,
    marks: 0,
    tackles: 0,
    goals: 0,
    behinds: 0,
    freesFor: 0,
    freesAgainst: 0,
    hitouts: 0,
  }
}

function finalizeFantasy(totals: Omit<Quick6GameTotals, 'fantasy'>) {
  return (
    totals.kicks * 3 +
    totals.handballs * 2 +
    totals.marks * 3 +
    totals.tackles * 4 +
    totals.hitouts * 1 +
    totals.goals * 6 +
    totals.behinds * 1 +
    totals.freesFor * 1 -
    totals.freesAgainst * 3
  )
}

function aggregateEventTotals(events: RawEventRow[]) {
  const totals = createEmptyTotals()
  let effectiveKicks = 0
  let ineffectiveKicks = 0
  let effectiveHandballs = 0
  let ineffectiveHandballs = 0

  for (const event of events) {
    const code = String(event.stat_key || '').toUpperCase()

    switch (code) {
      case 'K':
        totals.kicks += 1
        totals.disposals += 1
        break
      case 'K_EF':
        if (totals.kicks === effectiveKicks + ineffectiveKicks) {
          totals.kicks += 1
          totals.disposals += 1
        }
        effectiveKicks += 1
        break
      case 'K_IF':
        if (totals.kicks === effectiveKicks + ineffectiveKicks) {
          totals.kicks += 1
          totals.disposals += 1
        }
        ineffectiveKicks += 1
        break
      case 'HB':
        totals.handballs += 1
        totals.disposals += 1
        break
      case 'HB_EF':
        if (totals.handballs === effectiveHandballs + ineffectiveHandballs) {
          totals.handballs += 1
          totals.disposals += 1
        }
        effectiveHandballs += 1
        break
      case 'HB_IF':
        if (totals.handballs === effectiveHandballs + ineffectiveHandballs) {
          totals.handballs += 1
          totals.disposals += 1
        }
        ineffectiveHandballs += 1
        break
      case 'D':
        totals.disposals += 1
        break
      case 'M':
        totals.marks += 1
        break
      case 'T':
        totals.tackles += 1
        break
      case 'G':
      case 'GOAL':
        totals.goals += 1
        break
      case 'B':
      case 'BEHIND':
        totals.behinds += 1
        break
      case 'FF':
        totals.freesFor += 1
        break
      case 'FA':
        totals.freesAgainst += 1
        break
      case 'HO':
        totals.hitouts += 1
        break
      default:
        break
    }
  }

  return {
    ...totals,
    fantasy: Math.round(finalizeFantasy(totals)),
  }
}

function manualTotals(row: ManualRow) {
  const totals = {
    kicks: Number(row.k ?? 0),
    handballs: Number(row.hb ?? 0),
    disposals: Number(row.k ?? 0) + Number(row.hb ?? 0),
    marks: Number(row.m ?? 0),
    tackles: Number(row.t ?? 0),
    goals: Number(row.g ?? 0),
    behinds: Number(row.b ?? 0),
    freesFor: Number(row.frees_for ?? 0),
    freesAgainst: Number(row.frees_against ?? 0),
    hitouts: Number(row.hitouts ?? 0),
  }

  return {
    ...totals,
    fantasy: row.af != null ? Math.round(Number(row.af)) : Math.round(finalizeFantasy(totals)),
  }
}

function average(values: number[]) {
  if (!values.length) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function formatAverage(value: number | null) {
  return value != null && Number.isFinite(value) ? value.toFixed(1) : '—'
}

function buildScopeStat(values: number[], available: boolean): Quick6ScopeStat {
  const averageValue = available ? average(values) : null
  return {
    value: averageValue,
    display: available ? formatAverage(averageValue) : '—',
    available,
  }
}

export async function loadQuick6Dataset(userId: string, games: GameLogRow[]): Promise<Quick6Dataset> {
  const gameMetaById = new Map<string, GameLogRow>()
  const trackedGameIds: string[] = []

  for (const game of games) {
    const key = game.id
    gameMetaById.set(key, game)
    if (!game.isManual) trackedGameIds.push(game.id)
  }

  const [eventsRes, manualRes] = await Promise.all([
    trackedGameIds.length
      ? supabase
          .from('v_counted_events')
          .select('game_id,stat_key,profile_user_id')
          .in('game_id', trackedGameIds)
          .eq('profile_user_id', userId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('manual_player_game_totals')
      .select('id,game_id,match_date,k,hb,t,g,b,m,frees_for,frees_against,hitouts,af')
      .eq('user_id', userId),
  ])

  if (eventsRes.error) throw eventsRes.error
  if (manualRes.error && manualRes.error.code !== 'PGRST116') throw manualRes.error

  const eventsByGame = new Map<string, RawEventRow[]>()
  for (const row of (eventsRes.data ?? []) as RawEventRow[]) {
    if (!row.game_id) continue
    const existing = eventsByGame.get(row.game_id) ?? []
    existing.push(row)
    eventsByGame.set(row.game_id, existing)
  }

  const manualByGame = new Map<string, ManualRow>()
  for (const row of (manualRes.data ?? []) as ManualRow[]) {
    if (row.game_id) {
      manualByGame.set(row.game_id, row)
    }
  }

  const loggedGames: Quick6GameRow[] = []

  for (const [id, meta] of gameMetaById.entries()) {
    const gameEvents = eventsByGame.get(id) ?? []
    const manualRow = manualByGame.get(id) ?? null

    if (!gameEvents.length && !manualRow) continue

    const date = manualRow?.match_date ?? meta.date ?? null
    const timestamp = date ? new Date(date).getTime() : 0
    const totals = gameEvents.length ? aggregateEventTotals(gameEvents) : manualTotals(manualRow as ManualRow)

    loggedGames.push({
      id,
      date,
      seasonYear: parseSeasonYear(date),
      timestamp: Number.isNaN(timestamp) ? 0 : timestamp,
      totals,
    })
  }

  loggedGames.sort((a, b) => b.timestamp - a.timestamp)

  const distinctYears = Array.from(
    new Set(loggedGames.map((game) => game.seasonYear).filter((year): year is number => year != null))
  ).sort((a, b) => b - a)

  return {
    loggedGames,
    availableSeasonYears: distinctYears,
  }
}

export async function loadQuick6Summary(
  userId: string,
  games: GameLogRow[],
  selectedSeasonYear?: number | null
): Promise<Quick6Summary> {
  const { loggedGames, availableSeasonYears } = await loadQuick6Dataset(userId, games)

  const currentYear = new Date().getFullYear()
  const seasonYear =
    selectedSeasonYear != null && availableSeasonYears.includes(selectedSeasonYear)
      ? selectedSeasonYear
      : availableSeasonYears.includes(currentYear)
        ? currentYear
        : (availableSeasonYears[0] ?? null)

  const seasonGames = seasonYear == null ? [] : loggedGames.filter((game) => game.seasonYear === seasonYear)
  const last3Games = seasonGames.slice(0, 3)
  const canUseLast3 = last3Games.length >= 3

  const pickValues = (rows: Quick6GameRow[], key: Quick6StatKey) =>
    rows.map((row) => row.totals[key])

  const statDefs: Array<{ key: Quick6StatKey; label: string }> = [
    { key: 'disposals', label: 'Disposals' },
    { key: 'kicks', label: 'Kicks' },
    { key: 'handballs', label: 'Handballs' },
    { key: 'marks', label: 'Marks' },
    { key: 'tackles', label: 'Tackles' },
    { key: 'fantasy', label: 'AF' },
  ]

  const stats = statDefs.map(({ key, label }) => ({
    key,
    label,
    season: buildScopeStat(pickValues(seasonGames, key), seasonGames.length > 0),
    last3: buildScopeStat(pickValues(last3Games, key), canUseLast3),
    career: buildScopeStat(pickValues(loggedGames, key), loggedGames.length > 0),
  }))

  return {
    seasonYear,
    availableSeasonYears,
    seasonGameCount: seasonGames.length,
    canUseLast3,
    stats,
  }
}
