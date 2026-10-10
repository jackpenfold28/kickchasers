# Stage 2G — Single-player summary and feed publishing

## Architecture

Stage 2G reuses the Stage 2A–2F pipeline. The production summary never hydrates raw rows or renders the White Editorial template itself:

`completed game → PlayerCardWorkflowScreen → production game resolver → PlayerPerformanceCardBuilder → PlayerPerformanceCardModel → Player Image workflow → White Editorial renderer → 1080×1350 PNG`

Publishing is a separate boundary:

`validated PNG + workflow identity → PlayerCardPublishingService → post-images → existing posts table → FeedPostCard → existing social shell`

No database schema, RLS policy, Team Tracker summary, Team Tracker post creator, template, renderer, export engine, or card model was changed.

## Existing flow replaced

The former single-player End Game handler synced the game and opened a legacy post-preview modal. It now:

1. syncs pending events;
2. stops and persists the existing timer;
3. marks the existing game `final` and `is_locked` using the existing owner-scoped update;
4. invalidates the existing game/feed queries;
5. opens the canonical individual game summary with `completion=player-card`.

The legacy modal is no longer reachable from End Game. Team Tracker still finalises through `finalizeTrackedGame` and opens its existing team summary.

## Summary workflow

The canonical individual summary embeds the shared production Player Card workflow above the existing statistics. A saved Player Image or resolved action photo starts automatic generation. If neither exists, the same area presents camera/photo-library selection. Game statistics remain available while card work is in progress.

The two completion outcomes are:

- **Save Game:** exits without creating a post. The game was already safely finalised before the summary opened.
- **Post & Save:** validates, uploads, and publishes the generated card. It is unavailable without a valid card or network connection.

Editing and changing the Player Image reuse the existing Stage 2F workflow and return to the same summary state.

## Post payload

New cards continue using the existing `posts` table and `player_stat_card` type. `payload` is extended with a versioned discriminator:

- `type: white_editorial_player_card`
- `schema_version: 1`
- `template_id` and `template_version`
- `game_id`
- `player_profile_id`
- `team_side`
- `player_number`
- `squad_member_id`
- `player_image_id`
- `render_version`
- `source_kind`

The full `PlayerPerformanceCardModel` is not stored. Canonical game/profile data remains authoritative.

## Generated asset and storage

Only a validated 1080×1350 PNG is accepted. It is uploaded to the existing public `post-images` bucket at:

`posts/{authorId}/{deterministicPostId}/white-editorial-{templateVersion}.png`

The post stores the existing bucket/path form in `image_url`. Temporary source photos, editable masks, and editor overlays are not uploaded.

## Duplicate prevention

The post ID is UUID v5 over author, game, player identity, side, number, and template ID. This gives one stable publication identity for the same player/game/template while allowing another author or future template to publish independently.

Protection exists at three levels:

1. the UI disables and synchronously locks Post & Save while publishing;
2. the service checks the deterministic ID before upload;
3. a duplicate-key response resolves and returns the existing post.

An uploaded file is written with `upsert`, so retrying after an uncertain network result is safe. Existing posts show **Posted** and **View Post** rather than an overwrite action.

## Feed rendering

`FeedPostCard` remains the authoritative variant router. Only versioned White Editorial payloads select the new image presentation. Historical `player_stat_card` posts have no discriminator and continue through the legacy renderer.

The generated image replaces only the visual card body. The existing `FeedSocialCard` shell continues to own likes, double-tap likes, comments, counts, caption, follow state, author navigation, overflow actions, permissions, moderation and blocking.

Profile posts now also use `FeedPostCard`, avoiding a second feed-variant switch.

## Game Log and team-tracked players

The self Game Log performs a read-only lookup of existing versioned Player Card posts. A completed game shows `POSTED` and opens the existing feed post when one exists; otherwise it retains the explicit `CARD` creation action.

The Game Log share button no longer opens the legacy stat-card publisher for individual performances. Single-player games and team-tracked games where the current user is the tracked player open the shared White Editorial generator. A Team Tracker who did not play continues directly into the existing team-card modal. When the tracker also played, that modal offers the existing team post or `Player card`; selecting `Player card` opens the generator instead of rendering the legacy stat card.

Only versioned White Editorial payloads count as a posted Player Card for this workflow. A historical legacy stat post therefore does not prevent its game from receiving a new White Editorial card.

Selecting a player from a Team Tracker summary still opens that player's canonical individual summary. The resolved player side and number are forwarded to the shared Player Card workflow. Publishing creates only that one explicit individual post. The team summary and its post remain independent and unchanged.

## Offline and failure behaviour

Generation/editing remain on-device. Network state disables Post & Save with a clear explanation; Save Game remains available. Upload or insert errors remain on the summary and expose the same Post & Save action for retry. The completed game is never rolled back or deleted.

There is no new background upload queue. Users must retry posting while online.

## Known limitations

- Player Images remain local under the Stage 2F model; there is no new persistent database asset.
- A retry after upload but before post insertion may re-upload the same deterministic path before inserting; it does not create duplicate posts.
- Physical-device validation is required for full photo/cutout/editor/upload latency and network interruption behaviour.
- No destructive replace/version action is exposed for an already-published card.

## Stage 2H recommendation

GO only after the physical-device matrix confirms single-player completion, saved-image and new-photo paths, offline Save Game, upload retry, feed social actions, and Team Tracker regression safety. Stage 2H should not add templates until production telemetry and support feedback establish that this first publishing flow is stable.
