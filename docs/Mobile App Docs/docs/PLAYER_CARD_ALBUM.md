# Player Card Album

Last verified: 2026-08-09

## Purpose

The Player Card Album is the permanent, cloud-backed collection behind `Me → Album`. It stores the final 1080 × 1350 PNG produced by the existing Player Card renderer. The Album never mounts a renderer in its grid and never uses hidden Feed posts as storage records.

## Ownership and identity

`public.player_cards.owner_profile_id` is the signed-in profile (`auth.uid()`). Album metadata is private under owner-only RLS. The represented player is recorded separately with `player_profile_id`, `squad_member_id`, `team_side` and `player_number`.

One row exists for the tuple:

`owner_profile_id + source_kind + source_id + subject_key`

The shared subject-key order is profile, squad member, team side/player number, then owner fallback. A database unique index and advisory transaction lock protect the identity from concurrent saves.

Canonical sources are `single-player-tracker`, `team-tracker`, `manual-payload` and `manual-totals`. Manual totals are discovered directly through an owner-scoped game query; an existing Feed recap post is used when available but is not required for generation.

## Image storage and replacement

Album images reuse the public `post-images` bucket under an owner-scoped namespace:

`player-cards/{ownerId}/{playerCardId}/card-v{revision}.png`

Paths are immutable. Replacing artwork increments `asset_revision`, uploads a new object and updates the existing row. The old object is deleted only when neither an active Album row nor a Feed post references it. A posted revision is therefore retained permanently even when the Album copy advances to a newer revision.

The saved PNG is historically authoritative. Profile, club, Player Image, template and app updates do not silently regenerate it. `player_transform`, `player_image_id`, template IDs/versions and rating are retained for an explicit future regeneration flow; the full performance model and raw events are not stored.

## Post-once semantics

`posted_at` is permanent server-owned history. `feed_post_id` is the optional live relationship:

- both null: never posted;
- both present: posted, show **View Post**;
- `posted_at` present and `feed_post_id` null: Feed post was deleted, show **Previously Posted**.

The guarded `rpc_publish_player_card` locks the Album row, validates its owner and ready state, rejects any non-null `posted_at`, inserts the Feed post and links it atomically. The post ID is the Album card ID, so template replacement cannot create a second post identity. Feed deletion uses the foreign key's `ON DELETE SET NULL`; Album deletion never cascades to Feed.

New Feed posts reference the same Album image object. Publishing does not upload a second PNG. Replacing a posted Album card does not update the Feed post or its image.

## Repository and workflow boundaries

`PlayerCardAlbumRepository` owns Supabase table, RPC and Storage access. `PlayerCardSaveService` owns save, replacement, immutable upload, finalisation and Save & Post orchestration. Feed insertion remains in the shared `PlayerCardPublishingService`; its persisted-asset entry point calls the guarded Album RPC and never uploads the image again. React components only coordinate confirmation, progress and navigation.

Album publishing rehydrates canonical source data only when an already-saved card is posted from the viewer. It never rerenders or reuploads the PNG.

## Collection UI

The Album uses stable `(created_at, id)` keyset pagination, 20 items per page, newest first. `expo-image` provides memory/disk caching. A single aggregate RPC supplies total, highest/average rating, Gold and posted counts. The fullscreen viewer preserves the loaded collection order and provides Post/View/Previously Posted, Share, Save to Photos and soft delete.

## Offline behaviour and limitations

Cached images may remain viewable offline. Cloud save, replacement, posting and deletion are disabled and never report false success. V1 does not include an offline mutation queue or historical post backfill. Historical Feed cards continue using their existing payload and renderer behaviour.
