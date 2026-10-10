import type { PublicVoteCardContext, SelectedEntry, VoteCardCandidate, VoteCardEntry } from '@/components/vote-card/publicVoteCard.types'

export type VoteAccess = { canManage: boolean; canViewTally: boolean }
export type VoteAwardCategory = 'best_and_fairest' | 'incentive'
export type VoteMatchupSource = 'tracked_game' | 'manual'
export type VoteCardStatus = 'pending' | 'submitted' | 'void'

export type VoteAwardType = {
  id: string; groupId: string; name: string; category: VoteAwardCategory; pointValues: number[]
  maxCardsPerMatchup: number; colorKey: string | null; isActive: boolean
}
export type VoteGroup = {
  id: string; squadId: string; name: string; description: string | null; sortOrder: number
  isActive: boolean; awardTypes: VoteAwardType[]; matchupCount: number; pendingCardCount: number
}
export type VoteMember = {
  squadMemberId: string; userId: string | null; name: string; handle: string | null
  jerseyNumber: number | null; isGuest: boolean; selected: boolean
}
export type VoteCard = {
  id: string; matchupId: string; awardTypeId: string; awardTypeName: string
  category: VoteAwardCategory | 'custom'; cardIndex: number; status: VoteCardStatus
  assignedUserId: string | null; assignedVoterName: string | null; assignedVoterEmail: string | null
  assignmentMode: 'internal_user' | 'external_link' | 'unassigned'; submittedAt: string | null
}
export type VoteMatchup = {
  id: string; groupId: string; sourceType: VoteMatchupSource; roundLabel: string
  opponentName: string; matchupDate: string; gameId: string | null
  gameTeamSide: 'home' | 'away' | null; notes: string | null; cards: VoteCard[]
}
export type VoteGameOption = { id: string; opponent: string | null; date: string | null; round: number | null }
export type VoteAssignableUser = { userId: string; name: string; handle: string | null; jerseyNumber: number | null }
export type VoteLeaderboard = {
  awardTypeId: string; awardTypeName: string; category: VoteAwardCategory | 'custom'
  players: Array<{ subjectKey: string; subjectName: string; jerseyNumber: number | null; isGuest: boolean; squadMemberId: string | null; totalPoints: number }>
}
export type VoteTally = { group: { id: string; name: string }; leaderboards: VoteLeaderboard[]; submittedCards: unknown[] }
export type VoteBreakdown = { matchup: { id: string; groupId: string; roundLabel: string; opponentName: string; matchupDate: string }; cards: Array<VoteCard & { entries: Array<{ slotIndex: number; pointsValue: number; subjectName: string }> }> }

const record = (value: unknown): Record<string, any> => value && typeof value === 'object' ? value as Record<string, any> : {}
const array = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []

export function parsePointValues(value: string) {
  const points = value.split(',').map((item) => Number.parseInt(item.trim(), 10)).filter((item) => Number.isInteger(item) && item > 0)
  if (!points.length || new Set(points).size !== points.length) throw new Error('Enter unique positive point values, for example 5,4,3,2,1.')
  return points
}

export function matchesVoteManagementContract(input: {
  viewerUserId?: string | null; ownerUserId?: string | null; isOfficial?: boolean; isPlatformAdmin?: boolean
  squadRole?: string | null; squadMemberStatus?: string | null; clubRoles?: string[]
}) {
  if (!input.viewerUserId) return false
  if (input.isPlatformAdmin || input.viewerUserId === input.ownerUserId) return true
  if (input.isOfficial) return (input.clubRoles ?? []).some((role) => role === 'admin' || role === 'coach')
  return input.squadMemberStatus === 'accepted' && input.squadRole === 'admin'
}

export function validateVoteMatchupInput(input: { sourceType: VoteMatchupSource; roundLabel?: string | null; opponentName?: string | null; matchupDate?: string | null; gameId?: string | null }) {
  if (input.sourceType === 'tracked_game') {
    if (!input.gameId?.trim()) throw new Error('Choose a tracked game.')
    return
  }
  if (!input.roundLabel?.trim() || !input.opponentName?.trim() || !input.matchupDate) throw new Error('Manual matchups require a round, opponent and date.')
}

export function mapVoteGroupRows(groupRows: unknown[], awardRows: unknown[], matchupRows: unknown[], cardRows: unknown[]): VoteGroup[] {
  return groupRows.map((raw) => {
    const group = record(raw)
    const groupMatchups = matchupRows.map(record).filter((row) => row.group_id === group.id)
    const matchupIds = new Set(groupMatchups.map((row) => row.id))
    return {
      id: String(group.id), squadId: String(group.squad_id), name: String(group.name), description: group.description ?? null,
      sortOrder: Number(group.sort_order ?? 0), isActive: group.is_active !== false,
      awardTypes: awardRows.map(record).filter((row) => row.group_id === group.id).map((row) => ({
        id: String(row.id), groupId: String(row.group_id), name: String(row.name), category: row.category === 'incentive' ? 'incentive' : 'best_and_fairest',
        pointValues: array<number>(row.point_values).map(Number), maxCardsPerMatchup: Number(row.max_cards_per_matchup ?? 1), colorKey: row.color_key ?? null, isActive: row.is_active !== false,
      })),
      matchupCount: groupMatchups.length,
      pendingCardCount: cardRows.map(record).filter((row) => matchupIds.has(row.matchup_id) && row.status === 'pending').length,
    }
  })
}

export function mapVoteCardContext(payload: unknown): PublicVoteCardContext {
  const root = record(payload); const card = record(root.card); const squad = record(root.squad); const group = record(root.voteGroup); const matchup = record(root.matchup); const award = record(root.awardType)
  return {
    accessState: card.status === 'submitted' ? 'submitted' : card.status === 'pending' ? 'valid' : 'invalid', message: null,
    card: { id: card.id ?? null, cardIndex: Number(card.cardIndex ?? 1), status: card.status ?? null, assignedVoterName: card.assignedVoterName ?? null, assignedVoterEmail: card.assignedVoterEmail ?? null, enteredByName: card.enteredByName ?? null, submittedVia: card.submittedVia ?? null, submittedAt: card.submittedAt ?? null, lockedAt: card.lockedAt ?? null },
    squad: { id: squad.id ?? null, name: String(squad.name ?? 'Squad'), logoUrl: squad.logoUrl ?? null },
    voteGroup: { id: group.id ?? null, name: String(group.name ?? 'Vote group'), description: group.description ?? null },
    matchup: { id: matchup.id ?? null, sourceType: matchup.sourceType === 'tracked_game' ? 'tracked_game' : 'manual', roundLabel: String(matchup.roundLabel ?? 'Round'), opponentName: String(matchup.opponentName ?? 'Opponent'), matchupDate: matchup.matchupDate ?? null, gameId: matchup.gameId ?? null, gameSquadId: matchup.gameSquadId ?? null, gameTeamSide: matchup.gameTeamSide ?? null },
    awardType: { id: award.id ?? null, name: String(award.name ?? 'Vote card'), category: award.category === 'incentive' || award.category === 'custom' ? award.category : 'best_and_fairest', colorKey: award.colorKey ?? null, pointValues: array<number>(award.pointValues).map(Number), maxCardsPerMatchup: Number(award.maxCardsPerMatchup ?? 1) },
    candidatePool: array<Record<string, any>>(root.candidatePool).map((item) => ({ gamePlayerId: item.gamePlayerId ?? null, squadMemberId: item.squadMemberId ?? null, profileUserId: item.profileUserId ?? null, subjectKey: String(item.subjectKey ?? ''), subjectName: String(item.subjectName ?? 'Player'), jerseyNumber: item.jerseyNumber == null ? null : Number(item.jerseyNumber), isGuest: Boolean(item.isGuest) })),
    entries: array<Record<string, any>>(root.entries).map((item) => ({ id: item.id, slotIndex: Number(item.slotIndex), pointsValue: Number(item.pointsValue), subjectKey: String(item.subjectKey ?? ''), subjectName: String(item.subjectName ?? 'Player'), jerseyNumber: item.jerseyNumber == null ? null : Number(item.jerseyNumber), gamePlayerId: item.gamePlayerId ?? null, squadMemberId: item.squadMemberId ?? null, profileUserId: item.profileUserId ?? null, isGuest: Boolean(item.isGuest) })),
  }
}

export function buildAuthenticatedVoteCardRoute(squadId: string, cardId: string) { return `/teams/${encodeURIComponent(squadId)}/votes/cards/${encodeURIComponent(cardId)}` }
export function buildVoteGroupRoute(squadId: string) { return `/teams/${encodeURIComponent(squadId)}?tab=votes` }

export function getVoteSelectionKey(candidate: VoteCardCandidate | VoteCardEntry, sourceType: 'tracked_game' | 'manual') {
  return sourceType === 'tracked_game' ? candidate.gamePlayerId : candidate.squadMemberId
}

export function buildInitialVoteSelections(context: PublicVoteCardContext): SelectedEntry[] {
  const entries = new Map(context.entries.map((entry) => [entry.slotIndex, entry]))
  const candidates = new Map(context.candidatePool.map((candidate) => [getVoteSelectionKey(candidate, context.matchup.sourceType) ?? candidate.subjectKey, candidate]))
  return context.awardType.pointValues.map((pointsValue, index) => {
    const slotIndex = index + 1
    const existing = entries.get(slotIndex)
    const key = existing ? getVoteSelectionKey(existing, context.matchup.sourceType) ?? existing.subjectKey : null
    return { slotIndex, pointsValue, candidate: key ? candidates.get(key) ?? null : null }
  })
}

export function validateVoteSelections(context: PublicVoteCardContext, selections: SelectedEntry[]) {
  const slotErrors: Record<number, string> = {}
  const seen = new Set<string>()
  if (selections.length !== context.awardType.pointValues.length) return { formError: 'This card is not ready to submit yet. Please reload the page and try again.', slotErrors }
  for (const selection of selections) {
    if (!selection.candidate) { slotErrors[selection.slotIndex] = 'Select a player for this slot.'; continue }
    const key = getVoteSelectionKey(selection.candidate, context.matchup.sourceType)
    if (!key) { slotErrors[selection.slotIndex] = context.matchup.sourceType === 'tracked_game' ? 'This selection is missing a tracked player reference.' : 'This selection is missing a squad member reference.'; continue }
    if (seen.has(key)) { slotErrors[selection.slotIndex] = 'Each player can only be selected once.'; continue }
    seen.add(key)
  }
  return { formError: Object.keys(slotErrors).length ? 'Complete every vote slot before submitting.' : null, slotErrors }
}

export function buildVoteSubmitEntries(context: PublicVoteCardContext, selections: SelectedEntry[]) {
  return selections.map((selection) => ({ slotIndex: selection.slotIndex, gamePlayerId: context.matchup.sourceType === 'tracked_game' ? selection.candidate?.gamePlayerId ?? null : null, squadMemberId: context.matchup.sourceType === 'manual' ? selection.candidate?.squadMemberId ?? null : null }))
}
