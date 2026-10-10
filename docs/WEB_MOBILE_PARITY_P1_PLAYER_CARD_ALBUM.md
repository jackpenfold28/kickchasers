# P1 Player Card Album Remediation

## Scope

This stage completes only the Player Card Album portion of P1-13. It adds an owner-only Album entry to the current web profile, a repository and hook over the deployed cloud contract, a responsive saved-card collection, stable preview route, source navigation, browser sharing where supported, and explicit loading/empty/request/asset states. It does not implement Player Card generation, templates, cutout editing, Player Image persistence, card replacement, Feed publication, Album deletion, Team Selection, P1-11 coaching/voting, Dashboard/Feed, P1-15, or any backend change.

## Original Album Gap

The web profile had identity, Stats, Game Log and the completed Posts slice but no Album entry. It had no `player_cards` read layer, aggregate summary, cursor handling, authoritative asset normalization, card preview, owner gate or missing-asset presentation. Player Card images could appear in social Posts, but Posts are not the canonical saved collection and cannot safely substitute for Album records.

## Mobile Album Baseline

Current mobile exposes `PlayerCardAlbumTab` only inside `Me`, never on another user's profile. It uses `PlayerCardAlbumRepository.listPage` with 20-item `(created_at, id)` descending pagination and `rpc_player_card_album_summary` for Total, Highest, Average, Gold and Posted metrics. Tiles show the persisted 4:5 PNG, template tier, rating and posted history. Tapping a tile opens `/player-card/album/[id]`, which reloads owner-visible ready cards and presents the stored image at full size.

The mobile viewer also owns native mutation/export actions. This web stage is deliberately the requested consumption parity slice: it implements stored-card discovery and preview, safe related navigation, original-image access and browser-native sharing. It does not reproduce native Photos, generation, publishing, replacement or deletion workflows.

## Existing Backend Contract

The deployed `20260809120000_player_card_album.sql` contract is used without modification:

- `player_cards.id` is the stable card UUID.
- `owner_profile_id` is the authenticated Album owner; `player_profile_id` and `squad_member_id` separately identify the represented player.
- `source_kind` is one of `team-tracker`, `single-player-tracker`, `manual-payload` or `manual-totals`; `source_id`, `game_id` and `manual_game_id` preserve the source performance.
- `subject_key`, `team_side` and `player_number` preserve subject identity where available.
- `template_id`, resolved template/version and `rating` preserve display metadata.
- `image_bucket`, `image_path`, width, height, MIME type and `asset_revision` identify the immutable cloud asset. The permitted bucket is `post-images`; production assets are 1080×1350 PNGs.
- `feed_post_id` and `posted_at` distinguish never posted, currently posted and previously posted history.
- `asset_status = ready` and `deleted_at is null` define active Album rows.
- `created_at desc, id desc` is the canonical stable order.
- `rpc_player_card_album_summary` returns total, highest/average rating, Gold and posted counts under the caller's RLS visibility.

Reserve, finalise, publish and soft-delete RPCs were traced but are not called by web Album consumption.

## Ownership / Visibility

The deployed select policy allows only `owner_profile_id = auth.uid()` for an active profile. Web reinforces this product boundary before every request: owner and viewer IDs must both be present and exactly equal. List and detail queries also apply the exact owner ID even though RLS remains authoritative.

Album appears only on `/profile`. `/users/:id` never displays an Album tab, regardless of follow or block state, because current mobile has no public Album and public storage URLs do not make private metadata public. Pending assets and soft-deleted cards are excluded. A direct preview URL reloads the session owner and returns a neutral unavailable state for missing, deleted, pending or unauthorized cards.

## Album Listing

The existing profile Performance hierarchy gains an Album tab only for self mode, including direct `/profile?tab=album` discovery. Its responsive grid uses two columns on narrow browsers, three on tablet and four on desktop while preserving the stored 4:5 aspect ratio with `object-contain`.

Cards display their authoritative image, readable template tier, rating and Posted badge. A separate summary rail shows the five deployed aggregate values when available. Summary failure does not turn a valid card list into an error. Pages are merged by stable card ID, sorted newest-first and deduplicated; a bounded Load More control appears only while a cursor exists.

## Card Preview

`/player-card/album/:id` is an authenticated portal route. It fetches the exact card ID for the current owner and displays the stored image without mounting a template renderer. The preview includes template, rating, source, saved date, asset revision, player number where stored, and the three post-history states.

The browser can open the authoritative original image in a new tab. Native Web Share is offered only when supported and share cancellation is not treated as an Album failure. No new export or generation pipeline was introduced.

## Navigation

Navigation uses only stored stable identities:

| Available source identity | Destination |
|---|---|
| `manual_game_id` | `/games/manual/:manualGameId` |
| `game_id` + `player_profile_id` | `/games/:gameId?profileUserId=:playerProfileId` |
| `game_id` only | `/games/:gameId` |
| No supported game identity | No fabricated related link |

Manual identity wins for legacy rows containing both source IDs. Each URL component is encoded independently. `squad_member_id`, free text and player number are never guessed into a game-player route.

## Asset Handling

The repository accepts only the deployed `post-images` bucket and converts the stored object path to its public asset URL. It never treats the public URL as metadata authority. Both grid and preview use faithful 4:5 containment rather than cropping.

A null/invalid asset reference and a browser image-load failure produce explicit card-image unavailable states while preserving the Album row and navigation. The web does not regenerate a card, silently remove its tile or misreport the whole Album as empty.

## Local-vs-Cloud Boundary

The web Album consumes only cloud-backed `player_cards` metadata and its referenced immutable `post-images` asset. Approved Player Images, cutout drafts, transformations still held only on a mobile device, and other local generation state are not synchronized or represented. A social `posts` row may reference the same image, but Posts and Album remain separate surfaces with separate canonical records.

## Files Changed

- `src/lib/canonical/player-card-album.ts`
- `src/lib/player-card-album.ts`
- `src/hooks/usePlayerCardAlbum.ts`
- `src/components/portal/PlayerCardAlbum.tsx`
- `src/routes/portal/PlayerCardAlbumPage.tsx`
- `src/routes/portal/ProfilePage.tsx`
- `src/main.tsx`
- `tests/player-card-album-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_PROFILE_POSTS.md`
- `docs/WEB_MOBILE_PARITY_P1_PLAYER_CARD_ALBUM.md`

## Tests

Thirty-four focused contracts cover the 20-card cloud contract, post-history states, ordering/tie-breaking, stable compound cursors, deduplication, display formatting, exact game/player/manual destinations, encoded identity, strict owner/viewer equality, deleted/pending exclusion, summary RPC, stored source identity, stored asset handling, failed-image fallbacks, exact preview lookup, distinct list states, owner-only profile integration, existing Posts/Stats/Game Log wiring, stable authenticated routing, and the no-generation/no-mutation/no-migration boundaries.

## Validation

- Focused Player Card Album contracts: 34/34 passed.
- Full web suite: 260/260 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with only the existing Browserslist-age and large-chunk advisories.
- `git diff --check`: passed.
- Lint: not configured in `package.json`.

## Remaining Limitations

- Hosted owner data is still required to smoke-test RLS, summary metrics, paginated equal-timestamp rows and missing storage objects end to end.
- The consumption slice does not create, replace, publish or delete cards. Those are separate mutation workflows with additional payload and confirmation requirements; they are not necessary for the requested Album discovery/preview outcome.
- “Open original image” depends on normal browser handling of the public asset. Web Share appears only on supporting browsers.
- The preview does not provide a multi-card swipe carousel; browser back returns to the Album grid and stable individual URLs support direct refresh/bookmarking.

## P1-13 Final Status

**RESOLVED.** Profile Posts and the cloud-backed owner Album are now implemented. Awards remain informational because current mobile awards are not a reliable parity target and are not used to keep P1-13 open.

## Recommended Next Stage

Proceed with a bounded P1-15 admin manual-feed-post decision/remediation: either connect the exposed route to an already approved deployed authoring contract or remove/hide the non-functional production entry. It is the clearest remaining broken page and can be resolved without a migration if existing contracts prove sufficient. Do not combine it with P1-08 Dashboard/Feed or the larger P1-11 coaching/voting workflows. P1-09 remains **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited.
