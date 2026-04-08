import type { PublicVoteCardContext, VoteCardCandidate } from '@/components/vote-card/publicVoteCard.types'

function createCandidate({
  index,
  name,
  jerseyNumber,
  isGuest = false,
  positionLabel,
  ratingValue,
}: {
  index: number
  name: string
  jerseyNumber: number | null
  isGuest?: boolean
  positionLabel?: string
  ratingValue?: number
}): VoteCardCandidate {
  return {
    gamePlayerId: `dev-game-player-${index}`,
    squadMemberId: `dev-squad-member-${index}`,
    profileUserId: isGuest ? null : `dev-profile-${index}`,
    subjectKey: `dev-subject-${index}`,
    subjectName: name,
    jerseyNumber,
    isGuest,
    avatarUrl: null,
    positionLabel: positionLabel ?? null,
    ratingValue: ratingValue ?? null,
  }
}

const candidatePool: VoteCardCandidate[] = [
  createCandidate({ index: 1, name: 'Jack Penfold', jerseyNumber: 4, positionLabel: 'MID', ratingValue: 9.6 }),
  createCandidate({ index: 2, name: 'Dylan Hollitt', jerseyNumber: 9, positionLabel: 'FWD', ratingValue: 9.2 }),
  createCandidate({ index: 3, name: 'Riley Daniels', jerseyNumber: 12, positionLabel: 'MID', ratingValue: 8.9 }),
  createCandidate({ index: 4, name: 'Cameron Ball', jerseyNumber: 23, positionLabel: 'DEF', ratingValue: 8.4 }),
  createCandidate({ index: 5, name: 'Nathan Daish', jerseyNumber: 16, positionLabel: 'FWD', ratingValue: 8.2 }),
  createCandidate({ index: 6, name: 'Lachlan Briggs', jerseyNumber: 7, positionLabel: 'DEF', ratingValue: 8.0 }),
  createCandidate({ index: 7, name: 'Oscar Carver', jerseyNumber: 18, positionLabel: 'RUC', ratingValue: 7.8 }),
  createCandidate({ index: 8, name: 'Mason Turner', jerseyNumber: 26, positionLabel: 'MID', ratingValue: 7.7 }),
  createCandidate({ index: 9, name: 'Joel Matthews', jerseyNumber: 14, positionLabel: 'FWD', ratingValue: 7.6 }),
  createCandidate({ index: 10, name: 'Harvey Collins', jerseyNumber: 2, positionLabel: 'DEF', ratingValue: 7.5 }),
  createCandidate({ index: 11, name: 'Noah Pearce', jerseyNumber: 31, positionLabel: 'MID', ratingValue: 7.3 }),
  createCandidate({ index: 12, name: 'Riley Daniels', jerseyNumber: 27, positionLabel: 'MID', ratingValue: 7.1 }),
  createCandidate({ index: 13, name: 'Cooper Lane', jerseyNumber: 33, positionLabel: 'FWD', ratingValue: 7.0 }),
  createCandidate({ index: 14, name: 'Tommy Hales', jerseyNumber: 1, positionLabel: 'DEF', ratingValue: 6.9 }),
  createCandidate({ index: 15, name: 'Ethan Russo', jerseyNumber: 28, positionLabel: 'MID', ratingValue: 6.8 }),
  createCandidate({ index: 16, name: 'Mitchell Rowe', jerseyNumber: 20, positionLabel: 'DEF', ratingValue: 6.7 }),
  createCandidate({ index: 17, name: 'Jordan Pike', jerseyNumber: 11, positionLabel: 'FWD', ratingValue: 6.6 }),
  createCandidate({ index: 18, name: 'Aiden Murphy', jerseyNumber: 19, positionLabel: 'MID', ratingValue: 6.5 }),
  createCandidate({ index: 19, name: 'Sam Fenton', jerseyNumber: 29, positionLabel: 'DEF', ratingValue: 6.3 }),
  createCandidate({ index: 20, name: 'Leo Pearson', jerseyNumber: 36, positionLabel: 'MID', ratingValue: 6.2 }),
  createCandidate({ index: 21, name: 'Guest Player One', jerseyNumber: null, isGuest: true, positionLabel: 'Utility', ratingValue: 6.1 }),
  createCandidate({ index: 22, name: 'Guest Player Two', jerseyNumber: 45, isGuest: true, positionLabel: 'Forward', ratingValue: 5.9 }),
  createCandidate({ index: 23, name: 'Cameron Ball', jerseyNumber: 40, positionLabel: 'DEF', ratingValue: 5.8 }),
  createCandidate({ index: 24, name: 'Tyler Nash', jerseyNumber: 6, positionLabel: 'MID', ratingValue: 5.7 }),
  createCandidate({ index: 25, name: 'Ben Hargreaves', jerseyNumber: 38, positionLabel: 'FWD', ratingValue: 5.6 }),
]

export const devVoteCardContext: PublicVoteCardContext = {
  accessState: 'valid',
  message: null,
  card: {
    id: 'dev-card-1',
    cardIndex: 1,
    status: 'pending',
    assignedVoterName: null,
    assignedVoterEmail: 'coach@imperialfc.test',
    enteredByName: null,
    submittedVia: null,
    submittedAt: null,
    lockedAt: null,
  },
  squad: {
    id: 'dev-squad-imperial',
    name: 'Imperial Football Club',
    logoUrl: '/kickchasers_logo.png',
    primaryColorHex: '#0C4D8B',
    secondaryColorHex: '#D4AF37',
  },
  voteGroup: {
    id: 'dev-vote-group-1',
    name: 'Coaches Votes',
    description: 'Design sandbox for the public vote-card flow. This context stays local and never touches Supabase.',
  },
  matchup: {
    id: 'dev-matchup-1',
    sourceType: 'tracked_game',
    roundLabel: 'Round 1',
    opponentName: 'South Adelaide',
    opponentLogoUrl: '/assets/onboarding/eastern-vipers-logo.jpeg',
    matchupDate: new Date().toISOString(),
    gameId: 'dev-game-1',
    gameSquadId: 'dev-game-squad-1',
    gameTeamSide: 'home',
  },
  awardType: {
    id: 'dev-award-1',
    name: 'Best & Fairest',
    category: 'best_and_fairest',
    colorKey: 'gold',
    pointValues: [5, 4, 3, 2, 1],
    maxCardsPerMatchup: 1,
  },
  candidatePool,
  entries: [],
  recommendations: candidatePool.slice(0, 5).map((candidate, index) => ({
    slotIndex: index + 1,
    pointsValue: [5, 4, 3, 2, 1][index],
    subjectKey: candidate.subjectKey,
    subjectName: candidate.subjectName,
    jerseyNumber: candidate.jerseyNumber,
    ratingValue: candidate.ratingValue,
  })),
}
