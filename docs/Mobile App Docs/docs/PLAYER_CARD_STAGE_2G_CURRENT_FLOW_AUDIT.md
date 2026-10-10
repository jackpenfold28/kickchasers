# Stage 2G Current Production Flow Audit

## Single-player completion before Stage 2G

`app/tracker.tsx` owns the Single Player Tracker completion path. End Game first synchronises queued events, then opens an in-place legacy `FeedSocialCard` preview modal. The modal offers `Post to Feed` and `Save No Post`.

- Both paths stop and persist the active game timer.
- Both update the existing game to `status = final` and `is_locked = true`, scoped to `created_by`.
- Posting optionally uploads a selected background to `post-images`, inserts a `player_stat_card` row, invalidates game/feed queries, and navigates to Feed.
- Saving performs the same finalisation without inserting a post, then exits to the home route.
- Offline event replay is completed through the existing `syncNow()` path before either operation.
- The legacy post uses `posts.game_id`, `author_id`, `image_url`, and a small payload containing `team_side` and `player_number`.

The game and events already exist before either button is pressed. The completion buttons control final locking, navigation, and optional publishing; they do not create the tracked game itself.

## Existing individual summary

`app/games/[id]/summary.tsx` is the canonical individual game summary. It loads the game, resolves the requested player identity, aggregates authoritative events, and displays the existing hero, statistics, benchmarks, map, and timeline. Stage 2F added a deliberate Player Card entry point without changing the summary data path.

## Existing feed and post rendering

`lib/feed-repository.ts` hydrates `posts` into `FeedItem`. `components/feed/FeedPostCard.tsx` is the authoritative full-post variant router:

- Team-tracked non-player posts → `TeamTrackedFeedSocialCard`
- Manual summaries → `ManualFeedSocialCard`
- Existing/historical `player_stat_card` posts → `FeedSocialCard`

Likes, comments, follow actions, moderation, ownership menus, and navigation are supplied outside the visual card and passed through this router.

## Existing image storage

Single-player and manual post flows upload to the existing `post-images` bucket under an author/post-scoped path and store the bucket-qualified path in `posts.image_url`. `lib/image-upload.ts` supplies the existing local-file byte conversion.

## Duplicate behaviour before Stage 2G

The old single-player flow disables buttons while a request is active but creates a random post UUID. It does not provide durable idempotency across app restarts or uncertain retries. Team Tracker separately checks for an existing post by `game_id` before inserting its one team post.

## Team Tracker boundary

Team Tracker finalises with `finalizeTrackedGame`, navigates to `app/new-game/team-tracker/summary.tsx`, and publishes through `createTeamGamePost`. That path, its payload, renderer, and one-post-per-game behaviour are outside Stage 2G and must remain unchanged.

## Manual and Game Log boundaries

Manual games use their own summary/post payload and are outside Stage 2G. Completed tracked games are reopened through the existing Game Log and individual summary routes. Stage 2F provides deliberate Player Card creation for eligible single-player and selected team-tracked player performances.

## Stage 2G schema decision

No migration is required. A versioned JSON payload can identify a White Editorial player-card post while canonical game, event, profile, squad, and player identity data remain authoritative. A deterministic valid UUID derived from game, player identity, template, and author can make retries converge on the same `posts.id` primary key. This preserves RLS and avoids a new publication system.
