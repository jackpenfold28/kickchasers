export const PLAYER_CARD_ALBUM_PAGE_SIZE = 20
export const PLAYER_CARD_ALBUM_BUCKET = 'post-images'

export type PlayerCardAlbumSourceKind =
  | 'team-tracker'
  | 'single-player-tracker'
  | 'manual-payload'
  | 'manual-totals'

export type PlayerCardAlbumPostState = 'never-posted' | 'posted' | 'previously-posted'

export type PlayerCardAlbumCursor = {
  createdAt: string
  id: string
}

export type PlayerCardAlbumCard = {
  id: string
  ownerProfileId: string
  playerProfileId: string | null
  squadMemberId: string | null
  sourceKind: PlayerCardAlbumSourceKind
  sourceId: string
  gameId: string | null
  manualGameId: string | null
  teamSide: 'home' | 'away' | null
  playerNumber: number | null
  subjectKey: string
  templateId: string
  resolvedTemplateId: string | null
  templateVersion: string | null
  rating: number | null
  imageBucket: string
  imagePath: string
  imageUrl: string | null
  imageWidth: number
  imageHeight: number
  mimeType: string
  assetRevision: number
  feedPostId: string | null
  postedAt: string | null
  createdAt: string
  updatedAt: string
  postState: PlayerCardAlbumPostState
}

export type PlayerCardAlbumPage = {
  items: PlayerCardAlbumCard[]
  nextCursor: PlayerCardAlbumCursor | null
}

export type PlayerCardAlbumSummary = {
  totalCards: number
  highestRating: number | null
  averageRating: number | null
  goldCards: number
  postedCards: number
}

export type PlayerCardAlbumDestination = {
  href: string
  label: string
}

export function playerCardPostState(input: { postedAt?: string | null; feedPostId?: string | null }): PlayerCardAlbumPostState {
  if (!input.postedAt) return 'never-posted'
  return input.feedPostId ? 'posted' : 'previously-posted'
}

export function albumCardCursor(card: Pick<PlayerCardAlbumCard, 'createdAt' | 'id'>): PlayerCardAlbumCursor {
  return { createdAt: card.createdAt, id: card.id }
}

export function mergePlayerCardAlbumPages(cards: PlayerCardAlbumCard[]): PlayerCardAlbumCard[] {
  const byId = new Map<string, PlayerCardAlbumCard>()
  cards.forEach((card) => {
    if (!byId.has(card.id)) byId.set(card.id, card)
  })
  return Array.from(byId.values()).sort((left, right) => {
    const createdOrder = right.createdAt.localeCompare(left.createdAt)
    return createdOrder || right.id.localeCompare(left.id)
  })
}

export function albumCardDestination(card: Pick<PlayerCardAlbumCard, 'gameId' | 'manualGameId' | 'playerProfileId'>): PlayerCardAlbumDestination | null {
  if (card.manualGameId) {
    return { href: `/games/manual/${encodeURIComponent(card.manualGameId)}`, label: 'View manual game' }
  }
  if (card.gameId && card.playerProfileId) {
    return {
      href: `/games/${encodeURIComponent(card.gameId)}?profileUserId=${encodeURIComponent(card.playerProfileId)}`,
      label: 'View player summary',
    }
  }
  if (card.gameId) {
    return { href: `/games/${encodeURIComponent(card.gameId)}`, label: 'View game summary' }
  }
  return null
}

export function formatPlayerCardTemplate(templateId: string): string {
  const normalized = templateId.trim().replace(/[-_]+/g, ' ')
  if (!normalized) return 'Player Card'
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatPlayerCardRating(rating: number | null): string {
  return rating == null || !Number.isFinite(rating) ? '—' : rating.toFixed(1).replace(/\.0$/, '')
}

