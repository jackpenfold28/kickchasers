import { supabase } from '@/lib/supabase'
import { mapVoteCardContext, mapVoteGroupRows, validateVoteMatchupInput, type VoteAccess, type VoteAssignableUser, type VoteAwardCategory, type VoteBreakdown, type VoteGameOption, type VoteGroup, type VoteMatchup, type VoteMatchupSource, type VoteMember, type VoteTally } from '@/lib/canonical/squad-votes'

export async function getSquadVoteAccess(squadId: string): Promise<VoteAccess> {
  const [manage, tally] = await Promise.all([supabase.rpc('f_can_manage_squad_votes', { _squad_id: squadId }), supabase.rpc('f_can_view_squad_vote_tallies', { _squad_id: squadId })])
  if (manage.error) throw manage.error
  if (tally.error) throw tally.error
  return { canManage: Boolean(manage.data), canViewTally: Boolean(tally.data) }
}

export async function listSquadVoteGroups(squadId: string): Promise<VoteGroup[]> {
  const groups = await supabase.from('squad_vote_groups').select('id,squad_id,name,description,sort_order,is_active,created_at,updated_at').eq('squad_id', squadId).order('sort_order').order('created_at')
  if (groups.error) throw groups.error
  const groupIds = (groups.data ?? []).map((row: any) => row.id)
  if (!groupIds.length) return []
  const [awards, matchups] = await Promise.all([
    supabase.from('squad_vote_award_types').select('id,group_id,name,category,point_values,max_cards_per_matchup,color_key,is_active').in('group_id', groupIds).order('created_at'),
    supabase.from('squad_vote_matchups').select('id,group_id').in('group_id', groupIds),
  ])
  if (awards.error) throw awards.error
  if (matchups.error) throw matchups.error
  const matchupIds = (matchups.data ?? []).map((row: any) => row.id)
  const cards = matchupIds.length ? await supabase.from('squad_vote_cards').select('id,matchup_id,status').in('matchup_id', matchupIds) : { data: [], error: null }
  if (cards.error) throw cards.error
  return mapVoteGroupRows(groups.data ?? [], awards.data ?? [], matchups.data ?? [], cards.data ?? [])
}

export async function listVoteMembers(groupId: string): Promise<VoteMember[]> {
  const group = await supabase.from('squad_vote_groups').select('squad_id').eq('id', groupId).maybeSingle()
  if (group.error) throw group.error
  if (!group.data?.squad_id) return []
  const [selected, roster] = await Promise.all([
    supabase.from('squad_vote_group_members').select('squad_member_id').eq('group_id', groupId),
    supabase.from('squad_members').select('id,user_id,guest_name,handle,jersey_number,status').eq('squad_id', group.data.squad_id).eq('status', 'accepted').order('jersey_number'),
  ])
  if (selected.error) throw selected.error
  if (roster.error) throw roster.error
  const userIds = (roster.data ?? []).map((row: any) => row.user_id).filter(Boolean)
  const profiles = userIds.length ? await supabase.from('profiles_directory').select('user_id,name,handle').in('user_id', userIds) : { data: [], error: null }
  if (profiles.error) throw profiles.error
  const profileMap = new Map((profiles.data ?? []).map((row: any) => [row.user_id, row]))
  const selectedIds = new Set((selected.data ?? []).map((row: any) => row.squad_member_id))
  return (roster.data ?? []).map((row: any) => { const profile: any = profileMap.get(row.user_id); return { squadMemberId: row.id, userId: row.user_id ?? null, name: profile?.name ?? row.guest_name ?? row.handle ?? 'Squad member', handle: profile?.handle ?? row.handle ?? null, jerseyNumber: row.jersey_number ?? null, isGuest: !row.user_id, selected: selectedIds.has(row.id) } })
}

export async function listVoteMatchups(groupId: string): Promise<VoteMatchup[]> {
  const matchups = await supabase.from('squad_vote_matchups').select('id,group_id,source_type,round_label,opponent_name,matchup_date,game_id,game_team_side,notes').eq('group_id', groupId).order('matchup_date', { ascending: false })
  if (matchups.error) throw matchups.error
  const ids = (matchups.data ?? []).map((row: any) => row.id)
  if (!ids.length) return []
  const cards = await supabase.from('squad_vote_cards').select('id,matchup_id,award_type_id,card_index,status,assigned_user_id,assigned_voter_name,assigned_voter_email,submitted_at').in('matchup_id', ids).order('card_index')
  if (cards.error) throw cards.error
  const groupIds = [groupId]
  const awards = await supabase.from('squad_vote_award_types').select('id,name,category,color_key').in('group_id', groupIds)
  if (awards.error) throw awards.error
  const awardMap = new Map((awards.data ?? []).map((row: any) => [row.id, row]))
  return (matchups.data ?? []).map((row: any) => ({ id: row.id, groupId: row.group_id, sourceType: row.source_type, roundLabel: row.round_label, opponentName: row.opponent_name, matchupDate: row.matchup_date, gameId: row.game_id ?? null, gameTeamSide: row.game_team_side ?? null, notes: row.notes ?? null, cards: (cards.data ?? []).filter((card: any) => card.matchup_id === row.id).map((card: any) => { const award: any = awardMap.get(card.award_type_id) ?? {}; return { id: card.id, matchupId: card.matchup_id, awardTypeId: card.award_type_id, awardTypeName: award.name ?? 'Award', category: award.color_key === 'custom' ? 'custom' : award.category ?? 'best_and_fairest', cardIndex: card.card_index, status: card.status, assignedUserId: card.assigned_user_id ?? null, assignedVoterName: card.assigned_voter_name ?? null, assignedVoterEmail: card.assigned_voter_email ?? null, assignmentMode: card.assigned_user_id ? 'internal_user' : card.assigned_voter_name || card.assigned_voter_email ? 'external_link' : 'unassigned', submittedAt: card.submitted_at ?? null } }) })) as VoteMatchup[]
}

export async function listVoteGameOptions(squadId: string): Promise<VoteGameOption[]> {
  const links = await supabase.from('game_squads').select('game_id').eq('squad_id', squadId)
  if (links.error) throw links.error
  const ids = (links.data ?? []).map((row: any) => row.game_id).filter(Boolean)
  if (!ids.length) return []
  const games = await supabase.from('games').select('id,opponent,date,round').in('id', ids).neq('tracker_mode', 'team_stats_game').order('date', { ascending: false }).limit(12)
  if (games.error) throw games.error
  return games.data ?? []
}

export async function listVoteAssignableUsers(squadId: string): Promise<VoteAssignableUser[]> {
  const roster = await supabase.from('squad_members').select('user_id,jersey_number').eq('squad_id', squadId).eq('status', 'accepted').not('user_id', 'is', null)
  if (roster.error) throw roster.error
  const ids = (roster.data ?? []).map((row: any) => row.user_id)
  if (!ids.length) return []
  const profiles = await supabase.from('profiles_directory').select('user_id,name,handle').in('user_id', ids)
  if (profiles.error) throw profiles.error
  const numberMap = new Map((roster.data ?? []).map((row: any) => [row.user_id, row.jersey_number]))
  return (profiles.data ?? []).map((row: any) => ({ userId: row.user_id, name: row.name ?? row.handle ?? 'Kickchaser', handle: row.handle ?? null, jerseyNumber: numberMap.get(row.user_id) ?? null })).sort((a, b) => a.name.localeCompare(b.name))
}

async function rpc(name: string, args: Record<string, unknown>) { const result = await supabase.rpc(name, args); if (result.error) throw result.error; return result.data }
export const createVoteGroup = (squadId: string, name: string, description: string | null) => rpc('rpc_create_squad_vote_group', { _squad_id: squadId, _name: name.trim(), _description: description?.trim() || null, _member_squad_member_ids: null }) as Promise<string>
export const setVoteMembers = (groupId: string, ids: string[]) => rpc('rpc_set_squad_vote_group_members', { _group_id: groupId, _squad_member_ids: ids })
export const saveVoteAward = (input: { id?: string; groupId: string; name: string; category: VoteAwardCategory; pointValues: number[]; maxCards: number; colorKey?: string | null }) => rpc(input.id ? 'rpc_update_squad_vote_award_type' : 'rpc_create_squad_vote_award_type', input.id ? { _award_type_id: input.id, _name: input.name, _category: input.category, _point_values: input.pointValues, _max_cards_per_matchup: input.maxCards, _color_key: input.colorKey ?? null } : { _group_id: input.groupId, _name: input.name, _category: input.category, _point_values: input.pointValues, _max_cards_per_matchup: input.maxCards, _color_key: input.colorKey ?? null })
export const deleteVoteAward = (id: string) => rpc('rpc_delete_squad_vote_award_type', { _award_type_id: id })
export async function createVoteMatchup(input: { groupId: string; sourceType: VoteMatchupSource; roundLabel?: string | null; opponentName?: string | null; matchupDate?: string | null; gameId?: string | null; notes?: string | null }) { validateVoteMatchupInput(input); return rpc('rpc_create_squad_vote_matchup', { _group_id: input.groupId, _source_type: input.sourceType, _round_label: input.roundLabel ?? null, _opponent_name: input.opponentName ?? null, _matchup_date: input.matchupDate ?? null, _game_id: input.gameId ?? null, _notes: input.notes ?? null }) }
export const archiveOrDeleteVoteGroup = (id: string) => rpc('rpc_archive_or_delete_squad_vote_group', { _group_id: id })
export const restoreVoteGroup = (id: string) => rpc('rpc_restore_squad_vote_group', { _group_id: id })
export const deleteVoteMatchup = (id: string) => rpc('rpc_delete_squad_vote_matchup', { _matchup_id: id })
export async function assignVoteCard(input: { cardId: string; userId?: string | null; name?: string | null; email?: string | null }) { return rpc('rpc_assign_squad_vote_card', { _card_id: input.cardId, _assigned_user_id: input.userId ?? null, _assigned_voter_name: input.name?.trim() || null, _assigned_voter_email: input.email?.trim() || null, _assignment_note: null, _send_notification: true }) as Promise<any> }
export const deleteVoteCard = (id: string) => rpc('rpc_delete_squad_vote_card', { _card_id: id })
export const voidVoteCard = (id: string) => rpc('rpc_void_squad_vote_card', { _card_id: id })
export async function getVoteCardContext(id: string) { const data = await rpc('rpc_get_squad_vote_card_context', { _card_id: id }); return mapVoteCardContext(data) }
export async function submitVoteCard(id: string, entries: unknown[]) { const data = await rpc('rpc_submit_squad_vote_card', { _card_id: id, _entries: entries, _entered_by_user_id: null, _entered_by_name: null, _submitted_via: 'app' }); return mapVoteCardContext(data) }
export async function getVoteTally(groupId: string): Promise<VoteTally> { return rpc('rpc_get_squad_vote_tally', { _group_id: groupId }) as Promise<VoteTally> }
export async function getVoteBreakdown(matchupId: string): Promise<VoteBreakdown> { return rpc('rpc_get_squad_vote_matchup_breakdown', { _matchup_id: matchupId }) as Promise<VoteBreakdown> }
export function buildPublicVoteCardUrl(token: string) { return `${window.location.origin.replace(/\/+$/, '')}/vote-card/${token.trim()}` }
