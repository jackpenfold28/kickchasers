export type AccessState = 'valid' | 'submitted' | 'invalid'
export type MatchupSourceType = 'tracked_game' | 'manual'

export type VoteCardCandidate = {
  gamePlayerId: string | null
  squadMemberId: string | null
  profileUserId: string | null
  subjectKey: string
  subjectName: string
  jerseyNumber: number | null
  isGuest: boolean
  avatarUrl?: string | null
  positionLabel?: string | null
  ratingValue?: number | null
}

export type VoteCardEntry = {
  id?: string
  slotIndex: number
  pointsValue: number
  subjectKey: string
  subjectName: string
  jerseyNumber: number | null
  gamePlayerId: string | null
  squadMemberId: string | null
  profileUserId: string | null
  isGuest: boolean
  avatarUrl?: string | null
  positionLabel?: string | null
  ratingValue?: number | null
}

export type VoteCardRecommendation = {
  slotIndex?: number | null
  pointsValue?: number | null
  subjectKey: string
  subjectName: string
  jerseyNumber?: number | null
  ratingValue?: number | null
}

export type PublicVoteCardContext = {
  accessState: AccessState
  message: string | null
  card: {
    id: string | null
    cardIndex: number
    status: 'pending' | 'submitted' | 'void' | null
    assignedVoterName: string | null
    assignedVoterEmail: string | null
    enteredByName: string | null
    submittedVia: 'app' | 'external_link' | 'manual_admin' | null
    submittedAt: string | null
    lockedAt: string | null
  }
  squad: {
    id: string | null
    name: string
    logoUrl: string | null
    primaryColorHex?: string | null
    secondaryColorHex?: string | null
  }
  voteGroup: {
    id: string | null
    name: string
    description: string | null
  }
  matchup: {
    id: string | null
    sourceType: MatchupSourceType
    roundLabel: string
    opponentName: string
    opponentLogoUrl?: string | null
    matchupDate: string | null
    gameId: string | null
    gameSquadId: string | null
    gameTeamSide: 'home' | 'away' | null
  }
  awardType: {
    id: string | null
    name: string
    category: 'best_and_fairest' | 'incentive' | 'custom'
    colorKey: string | null
    pointValues: number[]
    maxCardsPerMatchup: number
  }
  candidatePool: VoteCardCandidate[]
  entries: VoteCardEntry[]
  recommendations?: VoteCardRecommendation[] | null
}

export type SelectedEntry = {
  slotIndex: number
  pointsValue: number
  candidate: VoteCardCandidate | null
}
