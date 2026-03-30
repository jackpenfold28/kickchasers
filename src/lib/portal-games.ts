import { supabase } from '@/lib/supabase'

export type GameLogRow = {
  id: string
  manualId: string | null
  isManual: boolean
  date: string | null
  venue: string | null
  status: string | null
  round: number | null
  opponent: string | null
  squadName: string | null
  squadLogoUrl: string | null
  opponentLogoUrl: string | null
  scoreHomeGoals: number | null
  scoreHomeBehinds: number | null
  scoreAwayGoals: number | null
  scoreAwayBehinds: number | null
}

export type PlayerSummaryStat = {
  playerId: string
  profileUserId: string | null
  teamSide: 'home' | 'away'
  number: number | null
  name: string
  kicks: number
  handballs: number
  marks: number
  tackles: number
  goals: number
  behinds: number
  disposals: number
}

export type GameSummaryPlayer = {
  id: string
  profileUserId: string | null
  teamSide: 'home' | 'away'
  number: number | null
  name: string
}

export type GameSummaryEvent = {
  statKey: string
  quarter: number | null
  teamSide: 'home' | 'away'
  playerNumber: number | null
  profileUserId: string | null
}

export type TeamSummaryStat = {
  teamSide: 'home' | 'away'
  kicks: number
  handballs: number
  marks: number
  tackles: number
  goals: number
  behinds: number
  disposals: number
}

export type GameSummary = {
  id: string
  opponent: string | null
  date: string | null
  venue: string | null
  status: string | null
  round: number | null
  trackBothTeams: boolean
  homeTeamName: string | null
  awayTeamName: string | null
  squadName: string | null
  squadLogoUrl: string | null
  opponentLogoUrl: string | null
  homePrimaryColorHex: string | null
  awayPrimaryColorHex: string | null
  scoreHomeGoals: number
  scoreHomeBehinds: number
  scoreAwayGoals: number
  scoreAwayBehinds: number
  teamStats: TeamSummaryStat[]
  playerStats: PlayerSummaryStat[]
  players: GameSummaryPlayer[]
  events: GameSummaryEvent[]
  quarterBreakdown: Array<{
    quarter: number
    homeGoals: number
    homeBehinds: number
    awayGoals: number
    awayBehinds: number
  }>
}

export type ManualGameSummary = {
  id: string
  gameId: string | null
  userId: string | null
  opponent: string | null
  date: string | null
  venue: string | null
  round: number | null
  opponentLogoUrl: string | null
  stats: Record<string, number>
}

const EVENT_KEY_MAP: Record<string, keyof Omit<PlayerSummaryStat, 'playerId' | 'profileUserId' | 'teamSide' | 'number' | 'name' | 'disposals'>> = {
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
}

function toPublicLogo(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath

  const clean = urlOrPath.replace(/^\/+/, '')
  const explicit = clean.match(/^([^:]+)::(.+)$/)

  if (explicit) {
    const { data } = supabase.storage.from(explicit[1]).getPublicUrl(explicit[2])
    return data.publicUrl || urlOrPath
  }

  if (clean.includes('/')) {
    const [bucket, ...rest] = clean.split('/')
    if (bucket && rest.length > 0) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(rest.join('/'))
      return data.publicUrl || urlOrPath
    }
  }

  const { data } = supabase.storage.from('team-logos').getPublicUrl(clean)
  return data.publicUrl || urlOrPath
}

function parseTeamSide(value: string | null | undefined): 'home' | 'away' {
  return value === 'away' ? 'away' : 'home'
}

function emptyTeam(teamSide: 'home' | 'away'): TeamSummaryStat {
  return {
    teamSide,
    kicks: 0,
    handballs: 0,
    marks: 0,
    tackles: 0,
    goals: 0,
    behinds: 0,
    disposals: 0,
  }
}

function summarizeEvents(
  events: Array<{ stat_key?: string | null; team_side?: string | null; player_number?: number | null; quarter?: number | null; profile_user_id?: string | null }>,
  players: Array<{ id: string; number?: number | null; name?: string | null; team_side?: string | null; profile_user_id?: string | null }>
) {
  const playerMap = new Map<string, PlayerSummaryStat>()
  const teamMap = new Map<'home' | 'away', TeamSummaryStat>([
    ['home', emptyTeam('home')],
    ['away', emptyTeam('away')],
  ])
  const quarterMap = new Map<number, { homeGoals: number; homeBehinds: number; awayGoals: number; awayBehinds: number }>()

  for (const player of players) {
    const side = parseTeamSide(player.team_side)
    const key = `${side}:${player.number ?? 'x'}:${player.profile_user_id ?? player.id}`
    playerMap.set(key, {
      playerId: player.id,
      profileUserId: player.profile_user_id ?? null,
      teamSide: side,
      number: player.number ?? null,
      name: player.name || `#${player.number ?? '-'}`,
      kicks: 0,
      handballs: 0,
      marks: 0,
      tackles: 0,
      goals: 0,
      behinds: 0,
      disposals: 0,
    })
  }

  const ensureQuarter = (q: number) => {
    if (!quarterMap.has(q)) {
      quarterMap.set(q, { homeGoals: 0, homeBehinds: 0, awayGoals: 0, awayBehinds: 0 })
    }
    return quarterMap.get(q)!
  }

  const resolvePlayerKey = (side: 'home' | 'away', number: number | null, profileId: string | null) => {
    if (profileId) {
      for (const [key, row] of playerMap.entries()) {
        if (row.teamSide === side && row.profileUserId === profileId) return key
      }
    }

    if (number != null) {
      for (const [key, row] of playerMap.entries()) {
        if (row.teamSide === side && row.number === number) return key
      }
    }

    const fallbackKey = `${side}:${number ?? 'x'}:${profileId ?? crypto.randomUUID()}`
    if (!playerMap.has(fallbackKey)) {
      playerMap.set(fallbackKey, {
        playerId: fallbackKey,
        profileUserId: profileId,
        teamSide: side,
        number,
        name: number != null ? `#${number}` : 'Unknown',
        kicks: 0,
        handballs: 0,
        marks: 0,
        tackles: 0,
        goals: 0,
        behinds: 0,
        disposals: 0,
      })
    }
    return fallbackKey
  }

  for (const event of events) {
    const raw = (event.stat_key || '').toUpperCase()
    const mapped = EVENT_KEY_MAP[raw]
    if (!mapped) continue

    const side = parseTeamSide(event.team_side)
    const playerKey = resolvePlayerKey(side, event.player_number ?? null, event.profile_user_id ?? null)
    const player = playerMap.get(playerKey)
    const team = teamMap.get(side)

    if (!player || !team) continue

    player[mapped] += 1
    team[mapped] += 1

    if (mapped === 'kicks' || mapped === 'handballs') {
      player.disposals += 1
      team.disposals += 1
    }

    const q = Number(event.quarter ?? 0)
    if (q > 0) {
      const quarter = ensureQuarter(q)
      if (mapped === 'goals') {
        if (side === 'home') quarter.homeGoals += 1
        else quarter.awayGoals += 1
      }
      if (mapped === 'behinds') {
        if (side === 'home') quarter.homeBehinds += 1
        else quarter.awayBehinds += 1
      }
    }
  }

  const playerStats = Array.from(playerMap.values()).sort((a, b) => {
    if (a.teamSide !== b.teamSide) return a.teamSide === 'home' ? -1 : 1
    if ((a.number ?? 0) !== (b.number ?? 0)) return (a.number ?? 0) - (b.number ?? 0)
    return a.name.localeCompare(b.name)
  })

  const teamStats = [teamMap.get('home')!, teamMap.get('away')!]
  const quarterBreakdown = Array.from(quarterMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([quarter, value]) => ({ quarter, ...value }))

  return { playerStats, teamStats, quarterBreakdown }
}

async function scoreFromEvents(gameId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('team_side,stat_key')
    .eq('game_id', gameId)
    .in('stat_key', ['G', 'GOAL', 'B', 'BEHIND'])

  if (error) return { hg: 0, hb: 0, ag: 0, ab: 0 }

  let hg = 0
  let hb = 0
  let ag = 0
  let ab = 0

  for (const row of data ?? []) {
    const side = parseTeamSide((row as { team_side?: string | null }).team_side)
    const stat = ((row as { stat_key?: string | null }).stat_key || '').toUpperCase()
    if (stat === 'G' || stat === 'GOAL') {
      if (side === 'home') hg += 1
      else ag += 1
    }
    if (stat === 'B' || stat === 'BEHIND') {
      if (side === 'home') hb += 1
      else ab += 1
    }
  }

  return { hg, hb, ag, ab }
}

export async function listUserGames(userId: string): Promise<GameLogRow[]> {
  const [eventRes, ownGamesRes, manualRes] = await Promise.all([
    supabase
      .from('events')
      .select('game_id,created_by,profile_user_id,games(track_request_status,tracked_for_profile_user_id)')
      .or(`profile_user_id.eq.${userId},created_by.eq.${userId}`),
    supabase
      .from('games')
      .select('id,opponent,date,venue,round,status,track_both_teams,opponent_logo_path,created_by,game_squads(team_side,squads(name,logo_url))')
      .eq('created_by', userId),
    supabase
      .from('manual_player_game_totals')
      .select('id,user_id,game_id,opponent_name,opponent_logo_url,opponent_logo_path,venue,round,match_date,games(id,opponent,date,venue,round,status,opponent_logo_path)')
      .eq('user_id', userId),
  ])

  if (eventRes.error) throw eventRes.error
  if (ownGamesRes.error) throw ownGamesRes.error
  if (manualRes.error && manualRes.error.code !== 'PGRST116') throw manualRes.error

  const allowedIds = new Set<string>()

  for (const row of eventRes.data ?? []) {
    const gameId = (row as { game_id?: string | null }).game_id
    if (!gameId) continue
    const createdBy = (row as { created_by?: string | null }).created_by
    const profileId = (row as { profile_user_id?: string | null }).profile_user_id
    const gameMeta = (row as { games?: { track_request_status?: string | null; tracked_for_profile_user_id?: string | null } | null }).games

    if (createdBy === userId) {
      if (gameMeta?.track_request_status === 'accepted' && gameMeta?.tracked_for_profile_user_id && gameMeta.tracked_for_profile_user_id !== userId) {
        continue
      }
      allowedIds.add(gameId)
      continue
    }

    if (profileId === userId) {
      if (gameMeta?.track_request_status && gameMeta.track_request_status !== 'accepted') continue
      allowedIds.add(gameId)
    }
  }

  for (const game of ownGamesRes.data ?? []) {
    const id = (game as { id?: string | null }).id
    if (id) allowedIds.add(id)
  }

  const trackedIds = Array.from(allowedIds)
  const trackedRows = trackedIds.length
    ? await supabase
        .from('games')
        .select('id,opponent,date,venue,round,status,track_both_teams,opponent_logo_path,game_squads(team_side,squads(name,logo_url))')
        .in('id', trackedIds)
    : { data: [], error: null }

  if (trackedRows.error) throw trackedRows.error

  const tracked = await Promise.all(
    ((trackedRows.data ?? []) as any[]).map(async (game) => {
      const squads = Array.isArray(game.game_squads) ? game.game_squads : []
      const homeSquad = squads.find((sq: any) => sq.team_side === 'home') ?? squads[0] ?? null
      const awaySquad = squads.find((sq: any) => sq.team_side === 'away') ?? null
      const score = await scoreFromEvents(game.id)

      return {
        id: game.id,
        manualId: null,
        isManual: false,
        date: game.date ?? null,
        venue: game.venue ?? null,
        status: game.status ?? null,
        round: game.round ?? null,
        opponent: game.opponent ?? null,
        squadName: homeSquad?.squads?.name ?? null,
        squadLogoUrl: toPublicLogo(homeSquad?.squads?.logo_url ?? null),
        opponentLogoUrl: toPublicLogo(awaySquad?.squads?.logo_url ?? game.opponent_logo_path ?? null),
        scoreHomeGoals: score.hg,
        scoreHomeBehinds: score.hb,
        scoreAwayGoals: score.ag,
        scoreAwayBehinds: score.ab,
      } as GameLogRow
    })
  )

  const manual: GameLogRow[] = ((manualRes.data ?? []) as any[])
    .map((row) => {
      const linkedGame = row.games ?? null
      const date = row.match_date ?? linkedGame?.date ?? null
      return {
        id: linkedGame?.id ?? row.game_id ?? `manual-${row.id}`,
        manualId: row.id,
        isManual: true,
        date,
        venue: row.venue ?? linkedGame?.venue ?? null,
        status: linkedGame?.status ?? 'final',
        round: row.round ?? linkedGame?.round ?? null,
        opponent: row.opponent_name ?? linkedGame?.opponent ?? null,
        squadName: null,
        squadLogoUrl: toPublicLogo(row.opponent_logo_url ?? row.opponent_logo_path ?? null),
        opponentLogoUrl: toPublicLogo(row.opponent_logo_url ?? row.opponent_logo_path ?? linkedGame?.opponent_logo_path ?? null),
        scoreHomeGoals: null,
        scoreHomeBehinds: null,
        scoreAwayGoals: null,
        scoreAwayBehinds: null,
      }
    })
    .filter((row) => row.manualId)

  const manualGameIds = new Set(manual.map((row) => row.id))
  const merged = [...tracked.filter((row) => !manualGameIds.has(row.id)), ...manual]

  return merged.sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0
    const tb = b.date ? new Date(b.date).getTime() : 0
    return tb - ta
  })
}

export async function getGameSummary(gameId: string): Promise<GameSummary | null> {
  const { data: game, error } = await supabase
    .from('games')
    .select(
      'id,opponent,date,venue,status,round,track_both_teams,opponent_logo_path,game_squads(team_side,squads(name,logo_url,primary_color_hex))'
    )
    .eq('id', gameId)
    .maybeSingle()

  if (error) throw error
  if (!game) return null

  const [playersRes, eventsRes] = await Promise.all([
    supabase
      .from('game_players')
      .select('id,number,name,team_side,profile_user_id')
      .eq('game_id', gameId)
      .order('team_side', { ascending: true })
      .order('number', { ascending: true }),
    supabase
      .from('v_counted_events')
      .select('stat_key,quarter,team_side,player_number,profile_user_id')
      .eq('game_id', gameId),
  ])

  if (playersRes.error) throw playersRes.error
  if (eventsRes.error) throw eventsRes.error

  const squads = Array.isArray((game as any).game_squads) ? (game as any).game_squads : []
  const homeSquad = squads.find((sq: any) => sq.team_side === 'home') ?? squads[0] ?? null
  const awaySquad = squads.find((sq: any) => sq.team_side === 'away') ?? null

  const { playerStats, teamStats, quarterBreakdown } = summarizeEvents((eventsRes.data ?? []) as any[], (playersRes.data ?? []) as any[])
  const players: GameSummaryPlayer[] = ((playersRes.data ?? []) as any[]).map((player) => ({
    id: String(player.id),
    profileUserId: player.profile_user_id ?? null,
    teamSide: parseTeamSide(player.team_side),
    number: player.number ?? null,
    name: player.name || `#${player.number ?? '-'}`,
  }))
  const events: GameSummaryEvent[] = ((eventsRes.data ?? []) as any[]).map((event) => ({
    statKey: String(event.stat_key || '').toUpperCase(),
    quarter: event.quarter ?? null,
    teamSide: parseTeamSide(event.team_side),
    playerNumber: event.player_number ?? null,
    profileUserId: event.profile_user_id ?? null,
  }))

  const scoreHomeGoals = teamStats.find((item) => item.teamSide === 'home')?.goals ?? 0
  const scoreHomeBehinds = teamStats.find((item) => item.teamSide === 'home')?.behinds ?? 0
  const scoreAwayGoals = teamStats.find((item) => item.teamSide === 'away')?.goals ?? 0
  const scoreAwayBehinds = teamStats.find((item) => item.teamSide === 'away')?.behinds ?? 0

  return {
    id: game.id,
    opponent: game.opponent ?? null,
    date: game.date ?? null,
    venue: game.venue ?? null,
    status: game.status ?? null,
    round: game.round ?? null,
    trackBothTeams: Boolean((game as any).track_both_teams),
    homeTeamName: homeSquad?.squads?.name ?? null,
    awayTeamName: awaySquad?.squads?.name ?? game.opponent ?? null,
    squadName: homeSquad?.squads?.name ?? null,
    squadLogoUrl: toPublicLogo(homeSquad?.squads?.logo_url ?? null),
    opponentLogoUrl: toPublicLogo(awaySquad?.squads?.logo_url ?? (game as any).opponent_logo_path ?? null),
    homePrimaryColorHex: homeSquad?.squads?.primary_color_hex ?? null,
    awayPrimaryColorHex: awaySquad?.squads?.primary_color_hex ?? null,
    scoreHomeGoals,
    scoreHomeBehinds,
    scoreAwayGoals,
    scoreAwayBehinds,
    teamStats,
    playerStats,
    players,
    events,
    quarterBreakdown,
  }
}

export async function getManualGameSummary(manualId: string): Promise<ManualGameSummary | null> {
  const { data, error } = await supabase.from('manual_player_game_totals').select('*').eq('id', manualId).maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as Record<string, any>
  const stats = {
    kicks: Number(row.k ?? 0),
    handballs: Number(row.hb ?? 0),
    marks: Number(row.m ?? 0),
    tackles: Number(row.t ?? 0),
    goals: Number(row.g ?? 0),
    behinds: Number(row.b ?? 0),
    disposals: Number(row.disposals ?? Number(row.k ?? 0) + Number(row.hb ?? 0)),
    clearances: Number(row.clearances ?? row.cl ?? 0),
    inside50s: Number(row.inside_50s ?? row.i50 ?? 0),
    rebound50s: Number(row.rebound_50s ?? row.r50 ?? 0),
    hitouts: Number(row.hitouts ?? row.ho ?? 0),
  }

  return {
    id: row.id,
    gameId: row.game_id ?? null,
    userId: row.user_id ?? null,
    opponent: row.opponent_name ?? null,
    date: row.match_date ?? null,
    venue: row.venue ?? null,
    round: row.round ?? null,
    opponentLogoUrl: toPublicLogo(row.opponent_logo_url ?? row.opponent_logo_path ?? null),
    stats,
  }
}
