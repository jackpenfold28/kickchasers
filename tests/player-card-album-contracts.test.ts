import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  PLAYER_CARD_ALBUM_BUCKET,
  PLAYER_CARD_ALBUM_PAGE_SIZE,
  albumCardCursor,
  albumCardDestination,
  formatPlayerCardRating,
  formatPlayerCardTemplate,
  mergePlayerCardAlbumPages,
  playerCardPostState,
  type PlayerCardAlbumCard,
} from '../src/lib/canonical/player-card-album.ts'

const card = (overrides: Partial<PlayerCardAlbumCard> = {}): PlayerCardAlbumCard => ({
  id: 'card-1', ownerProfileId: 'owner-1', playerProfileId: 'player-1', squadMemberId: null,
  sourceKind: 'team-tracker', sourceId: 'source-1', gameId: 'game-1', manualGameId: null,
  teamSide: 'home', playerNumber: 12, subjectKey: 'profile:player-1', templateId: 'gold-club',
  resolvedTemplateId: 'gold-club', templateVersion: '1', rating: 8.4, imageBucket: 'post-images',
  imagePath: 'player-cards/owner-1/card-1/card-v1.png', imageUrl: 'https://example.test/card.png',
  imageWidth: 1080, imageHeight: 1350, mimeType: 'image/png', assetRevision: 1, feedPostId: null,
  postedAt: null, createdAt: '2026-09-09T08:00:00.000Z', updatedAt: '2026-09-09T08:00:00.000Z',
  postState: 'never-posted', ...overrides,
})

test('Album page size matches the current mobile contract', () => assert.equal(PLAYER_CARD_ALBUM_PAGE_SIZE, 20))
test('Album assets use only the canonical cloud bucket', () => assert.equal(PLAYER_CARD_ALBUM_BUCKET, 'post-images'))
test('never-published card state remains explicit', () => assert.equal(playerCardPostState({ postedAt: null, feedPostId: null }), 'never-posted'))
test('live Feed relationship maps to posted state', () => assert.equal(playerCardPostState({ postedAt: 'now', feedPostId: 'post-1' }), 'posted'))
test('deleted Feed relationship preserves previously-posted history', () => assert.equal(playerCardPostState({ postedAt: 'now', feedPostId: null }), 'previously-posted'))

test('cards are ordered newest first', () => assert.deepEqual(mergePlayerCardAlbumPages([card({ id: 'old', createdAt: '2026-01-01' }), card({ id: 'new', createdAt: '2026-02-01' })]).map((item) => item.id), ['new', 'old']))
test('equal timestamps use descending stable card id', () => assert.deepEqual(mergePlayerCardAlbumPages([card({ id: 'a' }), card({ id: 'b' })]).map((item) => item.id), ['b', 'a']))
test('pagination merge removes duplicate card ids', () => assert.equal(mergePlayerCardAlbumPages([card(), card(), card({ id: 'card-2' })]).length, 2))
test('compound cursor preserves exact card identity', () => assert.deepEqual(albumCardCursor(card()), { createdAt: '2026-09-09T08:00:00.000Z', id: 'card-1' }))
test('template labels are presentation-only and readable', () => assert.equal(formatPlayerCardTemplate('gold-club'), 'Gold Club'))
test('blank template labels fail gracefully', () => assert.equal(formatPlayerCardTemplate(''), 'Player Card'))
test('ratings retain one useful decimal', () => assert.equal(formatPlayerCardRating(8.4), '8.4'))
test('whole-number ratings do not show noise', () => assert.equal(formatPlayerCardRating(8), '8'))
test('missing ratings remain unavailable', () => assert.equal(formatPlayerCardRating(null), '—'))

test('tracked card preserves exact game and player identity', () => assert.deepEqual(albumCardDestination(card()), { href: '/games/game-1?profileUserId=player-1', label: 'View player summary' }))
test('tracked card without profile identity routes only to game summary', () => assert.deepEqual(albumCardDestination(card({ playerProfileId: null })), { href: '/games/game-1', label: 'View game summary' }))
test('manual card opens the canonical manual game route', () => assert.deepEqual(albumCardDestination(card({ gameId: null, playerProfileId: null, manualGameId: 'manual-1' })), { href: '/games/manual/manual-1', label: 'View manual game' }))
test('manual identity takes priority when both legacy source ids exist', () => assert.equal(albumCardDestination(card({ manualGameId: 'manual-1' }))?.href, '/games/manual/manual-1'))
test('route identifiers are encoded independently', () => assert.equal(albumCardDestination(card({ gameId: 'game/1', playerProfileId: 'player/1' }))?.href, '/games/game%2F1?profileUserId=player%2F1'))
test('missing source identity never fabricates navigation', () => assert.equal(albumCardDestination(card({ gameId: null, manualGameId: null, playerProfileId: null })), null))

test('repository loads the exact owner and never substitutes viewer identity', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /\.eq\('owner_profile_id', ownerProfileId\)/)
  assert.match(source, /ownerProfileId !== viewerUserId/)
  assert.doesNotMatch(source, /=\s*(ownerProfileId \|\| viewerUserId|viewerUserId \|\| ownerProfileId)/)
})

test('another user cannot request private Album metadata', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /Player Card Albums are private to their owner/)
  assert.ok(source.indexOf('assertOwnAlbum(ownerProfileId, viewerUserId)') < source.indexOf(".from('player_cards')"))
})

test('listing excludes deleted, pending and non-owner cards', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /\.is\('deleted_at', null\)/)
  assert.match(source, /\.eq\('asset_status', 'ready'\)/)
  assert.match(source, /row\.owner_profile_id === ownerProfileId/)
})

test('listing uses mobile stable order and a bounded extra row', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /\.order\('created_at', \{ ascending: false \}\)/)
  assert.match(source, /\.order\('id', \{ ascending: false \}\)/)
  assert.match(source, /\.limit\(requestLimit \+ 1\)/)
})

test('repository preserves stable card and source identity fields', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  for (const field of ['id: row.id', 'playerProfileId: row.player_profile_id', 'sourceId: row.source_id', 'gameId: row.game_id', 'manualGameId: row.manual_game_id']) assert.match(source, new RegExp(field.replace('.', '\\.')))
})

test('summary uses the deployed owner-scoped aggregate RPC', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /rpc\('rpc_player_card_album_summary'\)/)
})

test('valid asset uses the stored bucket and path rather than regeneration', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.match(source, /storage\.from\(row\.image_bucket\)\.getPublicUrl\(row\.image_path\)/)
  assert.doesNotMatch(source, /render|generate|canvas|html2canvas/i)
})

test('missing and failed assets have explicit UI fallbacks', async () => {
  const [album, preview] = await Promise.all([
    readFile(new URL('../src/components/portal/PlayerCardAlbum.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/PlayerCardAlbumPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(album, /Card image unavailable/)
  assert.match(album, /onError=\{\(\) => setFailed\(true\)\}/)
  assert.match(preview, /Stored card image unavailable/)
  assert.match(preview, /onError=\{\(\) => setAssetFailed\(true\)\}/)
})

test('preview fetches the exact requested card for the signed-in owner', async () => {
  const source = await readFile(new URL('../src/routes/portal/PlayerCardAlbumPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /cardId: id, ownerProfileId, viewerUserId: ownerProfileId/)
  assert.match(source, /Card unavailable/)
})

test('loading empty request error and pagination end are distinct', async () => {
  const source = await readFile(new URL('../src/components/portal/PlayerCardAlbum.tsx', import.meta.url), 'utf8')
  assert.match(source, /Loading Player Card Album/)
  assert.match(source, /Your collection starts here/)
  assert.match(source, /Your Album couldn’t load/)
  assert.match(source, /album\.hasMore/)
})

test('Album tab is owner-only while Posts Stats and Games remain wired', async () => {
  const source = await readFile(new URL('../src/routes/portal/ProfilePage.tsx', import.meta.url), 'utf8')
  assert.match(source, /if \(mode === 'self'\) tabs\.push\(\['album', 'Album'\]\)/)
  assert.match(source, /mode === 'public' && activeTab === 'album'/)
  assert.match(source, /<ProfilePosts/)
  assert.match(source, /<AllStats/)
  assert.match(source, /<AllGames/)
})

test('preview has a stable authenticated route', async () => {
  const source = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
  assert.match(source, /path: 'player-card\/album\/:id'/)
  assert.match(source, /PlayerCardAlbumPage/)
})

test('Album consumption does not import or modify generation workflows', async () => {
  const files = await Promise.all([
    readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/hooks/usePlayerCardAlbum.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/portal/PlayerCardAlbum.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/PlayerCardAlbumPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(files.join('\n'), /player.image|cutout|reserve_player_card|finalise_player_card|soft_delete_player_card|publish_player_card/i)
})

test('Album repository contains no backend mutation or migration work', async () => {
  const source = await readFile(new URL('../src/lib/player-card-album.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(|\.upload\(|\.remove\(|create table|alter table|create policy/i)
})
