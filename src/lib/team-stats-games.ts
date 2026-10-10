import { resolveLogoPublicUrl } from '@/lib/logo-storage'
import { supabase } from '@/lib/supabase'
import { getSquadDetail, getSquadMembership, listClubRoles } from '@/lib/squads'
import {
  buildTeamStatsGameCards,
  canAccessTeamStatsGames,
  type TeamStatsGameCard,
  type TeamStatsGameRow,
  type TeamStatsScoreEvent,
} from '@/lib/canonical/team-stats-games'

export type TeamStatsGamesSnapshot = {
  access: 'authorized' | 'unauthorized'
  squadName: string | null
  squadLogoUrl: string | null
  primaryColorHex: string | null
  games: TeamStatsGameCard[]
}

export async function listTeamStatsGamesForSquad(squadId: string, viewerUserId: string): Promise<TeamStatsGamesSnapshot> {
  const [{ data: auth }, squad, membership, { data: platformAdmin, error: adminError }] = await Promise.all([
    supabase.auth.getUser(),
    getSquadDetail(squadId),
    getSquadMembership(squadId, viewerUserId),
    supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', viewerUserId).maybeSingle(),
  ])
  if (!auth.user || auth.user.id !== viewerUserId) throw new Error('Your session is no longer available.')
  if (adminError) throw adminError
  if (!squad) throw new Error('Team unavailable.')

  const clubRoles = squad.isOfficial && squad.clubId ? await listClubRoles(squad.clubId, viewerUserId) : []
  const authorized = canAccessTeamStatsGames({
    viewerUserId,
    ownerUserId: squad.ownerId,
    isOfficial: squad.isOfficial,
    isPlatformAdmin: Boolean(platformAdmin?.profile_user_id),
    membershipRole: membership.role,
    membershipStatus: membership.status,
    clubRoles,
  })
  const base = {
    squadName: squad.name,
    squadLogoUrl: squad.logoUrl,
    primaryColorHex: squad.primaryColorHex,
  }
  if (!authorized) return { ...base, access: 'unauthorized', games: [] }

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id,opponent,opponent_logo_path,date,venue,round,status,is_locked,tracker_mode,active_quarter,game_squads!inner(squad_id,team_side)')
    .eq('tracker_mode', 'team_stats_game')
    .eq('game_squads.squad_id', squadId)
    .order('date', { ascending: false })
    .order('id', { ascending: false })
  if (gamesError) throw gamesError

  const gameIds = ((games ?? []) as TeamStatsGameRow[]).map((game) => game.id).filter((id): id is string => Boolean(id))
  const scoreResult = gameIds.length
    ? await supabase.from('v_counted_events').select('game_id,team_side,stat_key').in('game_id', gameIds).in('stat_key', ['G', 'GOAL', 'B', 'BEHIND', 'RB', 'RUSHED_BEHIND'])
    : { data: [], error: null }
  if (scoreResult.error) throw scoreResult.error

  return {
    ...base,
    access: 'authorized',
    games: buildTeamStatsGameCards({
      rows: (games ?? []) as TeamStatsGameRow[],
      events: (scoreResult.data ?? []) as TeamStatsScoreEvent[],
      squadId,
      resolveLogoUrl: resolveLogoPublicUrl,
    }),
  }
}
