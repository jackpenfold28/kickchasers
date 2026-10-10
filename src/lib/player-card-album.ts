import {
  PLAYER_CARD_ALBUM_BUCKET,
  PLAYER_CARD_ALBUM_PAGE_SIZE,
  albumCardCursor,
  playerCardPostState,
  type PlayerCardAlbumCard,
  type PlayerCardAlbumCursor,
  type PlayerCardAlbumPage,
  type PlayerCardAlbumSourceKind,
  type PlayerCardAlbumSummary,
} from '@/lib/canonical/player-card-album'
import { supabase } from '@/lib/supabase'

type PlayerCardRow = {
  id: string
  owner_profile_id: string
  player_profile_id: string | null
  squad_member_id: string | null
  source_kind: PlayerCardAlbumSourceKind
  source_id: string
  game_id: string | null
  manual_game_id: string | null
  team_side: 'home' | 'away' | null
  player_number: number | null
  subject_key: string
  template_id: string
  resolved_template_id: string | null
  template_version: string | null
  rating: number | string | null
  image_bucket: string
  image_path: string
  image_width: number
  image_height: number
  mime_type: string
  asset_revision: number
  feed_post_id: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
}

const PLAYER_CARD_COLUMNS = 'id,owner_profile_id,player_profile_id,squad_member_id,source_kind,source_id,game_id,manual_game_id,team_side,player_number,subject_key,template_id,resolved_template_id,template_version,rating,image_bucket,image_path,image_width,image_height,mime_type,asset_revision,feed_post_id,posted_at,created_at,updated_at'

function imageUrlFor(row: Pick<PlayerCardRow, 'image_bucket' | 'image_path'>): string | null {
  if (row.image_bucket !== PLAYER_CARD_ALBUM_BUCKET || !row.image_path?.trim()) return null
  return supabase.storage.from(row.image_bucket).getPublicUrl(row.image_path).data.publicUrl || null
}

function fromRow(row: PlayerCardRow): PlayerCardAlbumCard {
  return {
    id: row.id,
    ownerProfileId: row.owner_profile_id,
    playerProfileId: row.player_profile_id,
    squadMemberId: row.squad_member_id,
    sourceKind: row.source_kind,
    sourceId: row.source_id,
    gameId: row.game_id,
    manualGameId: row.manual_game_id,
    teamSide: row.team_side,
    playerNumber: row.player_number,
    subjectKey: row.subject_key,
    templateId: row.template_id,
    resolvedTemplateId: row.resolved_template_id,
    templateVersion: row.template_version,
    rating: row.rating == null ? null : Number(row.rating),
    imageBucket: row.image_bucket,
    imagePath: row.image_path,
    imageUrl: imageUrlFor(row),
    imageWidth: Number(row.image_width),
    imageHeight: Number(row.image_height),
    mimeType: row.mime_type,
    assetRevision: Number(row.asset_revision),
    feedPostId: row.feed_post_id,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    postState: playerCardPostState({ postedAt: row.posted_at, feedPostId: row.feed_post_id }),
  }
}

function assertOwnAlbum(ownerProfileId: string, viewerUserId: string): void {
  if (!ownerProfileId || !viewerUserId || ownerProfileId !== viewerUserId) {
    throw new Error('Player Card Albums are private to their owner.')
  }
}

export async function listPlayerCardAlbumPage({
  ownerProfileId,
  viewerUserId,
  cursor = null,
  limit = PLAYER_CARD_ALBUM_PAGE_SIZE,
}: {
  ownerProfileId: string
  viewerUserId: string
  cursor?: PlayerCardAlbumCursor | null
  limit?: number
}): Promise<PlayerCardAlbumPage> {
  assertOwnAlbum(ownerProfileId, viewerUserId)
  const requestLimit = Math.min(Math.max(limit, 1), 50)
  let query = supabase
    .from('player_cards')
    .select(PLAYER_CARD_COLUMNS)
    .eq('owner_profile_id', ownerProfileId)
    .is('deleted_at', null)
    .eq('asset_status', 'ready')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(requestLimit + 1)

  if (cursor) {
    const createdAt = cursor.createdAt.replaceAll('"', '')
    const id = cursor.id.replaceAll('"', '')
    query = query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as unknown as PlayerCardRow[]
  const items = rows.slice(0, requestLimit).filter((row) => row.owner_profile_id === ownerProfileId).map(fromRow)
  const last = items.at(-1)
  return {
    items,
    nextCursor: rows.length > requestLimit && last ? albumCardCursor(last) : null,
  }
}

export async function getPlayerCardAlbumSummary({
  ownerProfileId,
  viewerUserId,
}: {
  ownerProfileId: string
  viewerUserId: string
}): Promise<PlayerCardAlbumSummary> {
  assertOwnAlbum(ownerProfileId, viewerUserId)
  const { data, error } = await supabase.rpc('rpc_player_card_album_summary')
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
  return {
    totalCards: Number(row?.total_cards ?? 0),
    highestRating: row?.highest_rating == null ? null : Number(row.highest_rating),
    averageRating: row?.average_rating == null ? null : Number(row.average_rating),
    goldCards: Number(row?.gold_cards ?? 0),
    postedCards: Number(row?.posted_cards ?? 0),
  }
}

export async function getPlayerCardAlbumCard({
  cardId,
  ownerProfileId,
  viewerUserId,
}: {
  cardId: string
  ownerProfileId: string
  viewerUserId: string
}): Promise<PlayerCardAlbumCard | null> {
  assertOwnAlbum(ownerProfileId, viewerUserId)
  if (!cardId.trim()) return null
  const { data, error } = await supabase
    .from('player_cards')
    .select(PLAYER_CARD_COLUMNS)
    .eq('id', cardId)
    .eq('owner_profile_id', ownerProfileId)
    .is('deleted_at', null)
    .eq('asset_status', 'ready')
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  return data ? fromRow(data as unknown as PlayerCardRow) : null
}

