import { supabase } from '@/lib/supabase'
import { buildTeamLeaders, type TeamLeaderEvent, type TeamLeaderIdentity } from '@/lib/canonical/team-feed-leaders'
import { registerGradeAgeRange } from '@/lib/canonical/benchmarks'
import { resolvePlayerPosition } from '@/lib/canonical/positions'

export async function loadTeamFeedLeaders(gameId: string, signal: AbortSignal) {
  const [game, events, players] = await Promise.all([
    supabase.from('games').select('date,grade_id,quarter_length,track_both_teams').eq('id', gameId).abortSignal(signal).single(),
    supabase.from('events').select('profile_user_id,player_number,stat_key,team_side,player_display_name,quarter').eq('game_id', gameId).abortSignal(signal),
    supabase.from('game_players').select('team_side,number,position,squad_member_id').eq('game_id', gameId).abortSignal(signal),
  ])
  if (game.error) throw game.error
  if (events.error) throw events.error
  if (players.error) throw players.error
  const profileIds = Array.from(new Set((events.data ?? []).flatMap((row) => row.profile_user_id ? [row.profile_user_id] : [])))
  const memberIds = Array.from(new Set((players.data ?? []).flatMap((row) => row.squad_member_id ? [row.squad_member_id] : [])))
  const [profiles, members, grade] = await Promise.all([
    profileIds.length ? supabase.from('profiles_directory').select('user_id,name,avatar_url,avatar_path,player_position').in('user_id', profileIds).abortSignal(signal) : { data: [], error: null },
    memberIds.length ? supabase.from('squad_members').select('id,position').in('id', memberIds).abortSignal(signal) : { data: [], error: null },
    game.data.grade_id && !game.data.quarter_length ? supabase.from('league_grades').select('grade_catalog(min_age,max_age)').eq('id', game.data.grade_id).abortSignal(signal).maybeSingle() : { data: null, error: null },
  ])
  if (profiles.error) throw profiles.error
  if (members.error) throw members.error
  if (grade.error) throw grade.error
  const ages = grade.data?.grade_catalog as { min_age?: number | null; max_age?: number | null } | null
  if (game.data.grade_id && ages) registerGradeAgeRange(game.data.grade_id, { minAge: ages.min_age ?? null, maxAge: ages.max_age ?? null })
  const identities = new Map<string, TeamLeaderIdentity>((profiles.data ?? []).map((row) => [row.user_id, { name: row.name, position: row.player_position, avatarUrl: row.avatar_url || (row.avatar_path ? supabase.storage.from('profile-avatars').getPublicUrl(row.avatar_path).data.publicUrl : null) }]))
  const memberPositions = new Map((members.data ?? []).map((row) => [row.id, row.position]))
  const positions = new Map<string, string | null>((players.data ?? []).map((row) => {
    const event = events.data?.find((event) => event.team_side === row.team_side && event.player_number === row.number && event.profile_user_id)
    const profilePosition = event?.profile_user_id ? identities.get(event.profile_user_id)?.position : null
    return [`${row.team_side === 'away' ? 'away' : 'home'}:${row.number}`, resolvePlayerPosition(row.position, profilePosition, row.squad_member_id ? memberPositions.get(row.squad_member_id) : null)]
  }))
  return buildTeamLeaders((events.data ?? []) as TeamLeaderEvent[], game.data.track_both_teams !== false, identities, positions, { quarterLengthMinutes: game.data.quarter_length, gradeId: game.data.grade_id, gameDate: game.data.date })
}
