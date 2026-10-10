# KickChasers database schema notes

Last verified: 2026-08-11

Source of truth: ordered SQL in `supabase/migrations/` through `20260720090000_platform_admin_moderation_feed.sql`. Later migrations override the January baseline. `supabase_schema.sql`, `supabase/prod_schema.sql`, `supabase/prod_public_schema.sql`, and TypeScript types are not authoritative.

## Core graph

`profiles` → follows/roles/memberships → `squads` → `game_squads` → `games` → `game_players` and `events`.

`events` is the canonical tracked-stat stream for all current tracker modes. Player history accepts only eligible player events; Team Stats Games deliberately have no player identity. `manual_player_game_totals` supplies manually entered player games. Typed `posts` connect final games/manual games/team selections to the feed. Notifications, reports, awards, and directory requests attach to these identities.

## Current table catalogue

### Identity, access, commerce infrastructure

- `profiles`: retained/tombstoned user profile keyed by `user_id`; name/handle, DOB/state, role preferences, club/league, avatar/action photo, player number/position, deletion fields.
- `profiles_directory` (view): authenticated directory projection with `age_years`; avoids direct cross-user reads of full `profiles`.
- `platform_admins`: platform-admin assignments.
- `club_roles`: club `admin`, `coach`, `tracker`, or `member` roles.
- `entitlements`, `products`, `prices`, `subscriptions`, `stripe_customers`: backend commerce catalogue/entitlement infrastructure. No active client purchase flow.
- `app_settings`: authenticated-readable runtime settings, currently system owner and app-update keys.
- `app_internal_settings`: no-client-access secrets for push webhook/anon-key lookup.

### Directory and following

- `states`, `leagues`, `league_grades`, `grade_catalog`, `clubs`: official/custom directory and grade hierarchy.
- `club_follows`, `league_follows`, `follows`: club, league, and user following.
- `official_directory_requests`: add league/club and related official-directory workflows.

### Squads and membership

- `squads`: custom/official squad, owner, club/league/grade, branding colours/media, archive state.
- `squad_members`: accepted/pending linked users or guest identity, jersey/position/role.
- `squad_join_requests`: player/coach/tracker/admin role requests and decisions.
- `official_squad_admin_requests`: official club/squad administration requests.
- `guest_merge_requests`: claim/merge guest roster identities into real users.
- `squad_player_groups`, `squad_player_group_members`: named sides/age groups and primary membership.

### Games and statistics

- `teams`: legacy/personal home-team identity used by single-player games.
- `games`: fixture/lifecycle, tracker mode, creator/track-for/link claims, sharing fields, stat-pad settings, attacking direction, and July linked-game timer state.
- `game_squads`: game ↔ squad/side links.
- `game_players`: per-game player snapshot linked to profile/squad member where available; nullable `position` stores the game-time `FWD`/`MID`/`RUC`/`DEF` value for new rows. Existing rows are intentionally not backfilled.
- `events`: canonical stat event with side, quarter, player identity, stat key/definition, actor, clock, and optional normalised field coordinates.
- `player_events`: older event table retained in schema; active trackers and summaries use `events`.
- `manual_player_game_totals`: manually entered personal game totals.
- `tracker_stat_definitions`: built-in and up-to-five active user/squad custom counter definitions.
- `tracker_stat_preferences`: per-user/per-squad grid and location/colour preferences; `tracker_type` now includes `single_player`, `team`, and `team_stats_game`.
- `stat_benchmarks`: retained schema data; active client scoring uses versioned constants, not this table as a runtime dependency.

### Social, moderation, and activity

- `posts`: typed game/manual/team-selection feed posts with visibility, counters, payload, image, hidden state.
- `post_likes`, `post_comments`: interactions.
- `user_blocks`: bilateral interaction block; insert trigger removes mutual follows.
- `post_reports`, `comment_reports`: moderation submissions and review status.
- `feed_follower_activity_views`: dedupe/view tracking for follower game stories.

### Awards

- `squad_vote_groups`: season/competition award program.
- `squad_vote_group_members`: eligible players.
- `squad_vote_award_types`: named categories and point rules.
- `squad_vote_matchups`: tracked-game or manual match.
- `squad_vote_cards`: internal/external assignments, public token, lifecycle.
- `squad_vote_entries`: ranked/point allocations.

### Notifications and operations

- `notifications`: in-app notification source.
- `user_push_tokens`: Expo push tokens.
- `game_live_push_notifications`: service-only deduplication for live-start notifications.
- `staging_clubs_import`: internal import staging, not a product feature.

## Important views

- `feed`: security-invoker self/followed post projection.
- `profiles_directory`: authenticated profile discovery projection.
- `v_counted_events`, `v_counted_events_for_squad`: accepted/countable player events.
- `v_official_counted_events`, `v_official_counted_events_for_squad`: events created under official tracker/platform-admin authority for leaderboards/squad statistics.
- `v_player_game_totals`, `v_player_season_averages`: tracked + manual player aggregation; excludes Team Stats Games. The game totals view exposes canonical Hitouts as `ho`.
- `v_my_squads`, `v_squads_access`, `my_features`: scoped access/feature helpers.

No materialized views exist in current migrations.

## Key constraints and invariants

- `games.tracker_mode`: `single_player`, `team_game`, or `team_stats_game`.
- Player positions on `profiles`, `squad_members`, `manual_player_game_totals`, and `game_players` are nullable and constrained to `FWD`, `MID`, `RUC`, or `DEF`.
- `events.location_x/y`: both null or both present, each in `[0,1]`.
- Custom stat definitions are `counter` only, server-generated keys, and max five active per user/squad scope.
- Linked team games restrict each actor to their assigned side; the creator controls shared match state.
- `active_quarter` is 1–4; linked quarter timer JSON must hold non-negative numeric keys 1–4.
- Vote card source is `tracked_game` or `manual`; entries reference configured award types/cards.
- Report status: `pending`, `reviewed`, `actioned`, or `dismissed`.
- Squad player groups have unique `(squad_id, slug)` and one primary group per member.
- Existing migrations enforce at most one official squad per club. This prevents treating the current system as a general multi-team club hierarchy.

## High-value RPC families

- Authentication/profile: `rpc_ensure_profile_exists`.
- Notifications: `f_notifications_list`, `f_notifications_mark_read`, `f_notifications_unread_count`.
- Squads/roles: `f_squads_for_user_v2`, `f_squad_members`, `f_invite_member`, `f_respond_invite`, `rpc_decide_squad_join_request`, `rpc_revoke_club_role`.
- Guest merge: `rpc_link_guest_squad_member`, `rpc_decide_guest_merge_request`.
- Tracking: `request_track_game`, `respond_track_game_request`, `rpc_start_tracked_game`, `rpc_finalize_tracked_game`, link-code RPCs.
- Linked state: `rpc_get_linked_team_match_state`, `rpc_control_linked_team_match_state`.
- Statistics: `rpc_list_squad_tracked_events`, `rpc_create_tracker_custom_stat`.
- Player groups: create/rename/archive/assign/backfill RPCs.
- Feed/content: manual summary, team game, team selection, visibility/moderation RPCs.
- Awards: create/manage groups, award types, matchups, cards, public/internal submission, breakdown, and tally RPCs.
- Platform admin: directory decisions, pending official requests, member overview, dashboard and moderation functions.
- Account deletion: `f_delete_account_data` called by the `delete-account` Edge Function.

## Realtime

- `notifications` is explicitly added to `supabase_realtime`.
- The linked team tracker subscribes to `games` updates and `events` insert/update/delete. Static migrations do not show a later explicit publication addition for these two tables; production publication state must be verified.
- Match Day and live summaries use polling even when Realtime is available.

## Schema drift

- The three root/prod SQL snapshots are dated 2026-03-01 and predate moderation, awards, custom stats, Team Stats Games, player groups, app updates, and linked timer state.
- `src/lib/database.types.ts` is dated 2026-06-15 yet lists only 26 tables and a small RPC subset. It omits active tables such as clubs/leagues/game_squads/notifications/votes/tracker definitions and omits active `events` columns including location and stat-definition identity.
- Application repositories commonly rely on untyped rows/`any` because generated types do not match migrations.
- `migrations_old/` is historical and must never be applied as an additional current migration stream.

## Open verification items

- Remote schema parity and Realtime publication state; local Docker/Supabase was unavailable during this audit.
- Whether legacy `player_events`, commerce tables, `staging_clubs_import`, and unused storage buckets contain live production data.
- Whether every security-definer function has retained intended grants after all ordered replacements.
