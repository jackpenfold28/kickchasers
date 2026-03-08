Last updated: 2026-03-24

# Supabase Context

## Architecture Snapshot
- Auth: Supabase auth with `handle_auth_user_created` and `handle_new_user` triggers seeding `profiles` on signup.
- Key data: `profiles`, `clubs` + `club_roles` + `club_follows`, `league_follows`, `squads` + `squad_members` + `squad_join_requests` + `guest_merge_requests`, `games` + `game_squads` + `game_players` + `events` + `player_events`, `manual_player_game_totals`, `notifications`, grade catalog (`grade_catalog`, `league_grades`), admin tables (`platform_admins`, `official_squad_admin_requests`, `official_directory_requests`), `app_settings`.
- Views/RPCs: `public.feed` (security invoker), `v_counted_events`, `v_counted_events_for_squad`, `v_player_game_totals`, `v_player_season_averages`; RPC helpers `f_squad_members`, `f_squads_for_user`, `f_create_squad`, `f_invite_member`, `f_bulk_add_squad_members`, `f_respond_invite`, `f_remove_squad_member`, `f_live_games_for_following`, `request_track_game`, `respond_track_game_request`, link-code RPCs (`rpc_generate_link_code`, `rpc_preview_link_game`, `rpc_claim_link_game`), platform admin RPCs (`f_is_platform_admin`, `rpc_set_post_hidden`, `rpc_set_squad_archived`), manual summary RPCs (`rpc_create_manual_game_summary_post`, `rpc_get_manual_game_summary_for_post`), account deletion (`rpc_prepare_account_deletion`). Official squad helpers: `f_can_manage_official_squad_members`, `f_can_read_official_squad_members`, `f_can_view_squad`.
- Storage: `team-logos`, `profile-avatars`, `post-images`, `posts` buckets used across feed, teams, notifications.
- Schema snapshot: `supabase_schema.sql` plus `supabase/migrations/*` (migrations contain the newest tables and policies).

## Role Sync Logic
- Profiles carry user-declared roles: `primary_role` + `game_day_roles[]` + `home_club_id`.
- Automatic sync to `club_roles` is disabled; role requests and admin tools are the current path for granting official roles.
- Club roles support `admin/supporter/club_member` values; only `supporter` can be self-inserted without admin approval.
- Official squad permissions rely on `club_roles` and helper functions (tracker role for roster reads; admin role for roster management).

## Notifications Responsibility
- DB-side: triggers on `squad_members` handle invite + accept + admin promotion notifications (`squad_invite`, `squad_invite_accepted`, `squad_admin_promoted`) and push dispatch via `call_push_function` -> Edge Function `send-push`; track-for-user (`track_request*`) rows come from RPCs (`request_track_game`, `respond_track_game_request`).
- DB-side: additional triggers cover role changes, join requests, guest merge requests, official directory/admin requests, follows, and post likes/comments.
- App-side: `lib/notifications-repository` reads/writes `notifications`, hydrates actor/squad metadata, and marks read.

## Platform Admin Responsibilities
- `platform_admins` defines global admin users; `f_is_platform_admin()` is the helper used in RLS and app checks.
- Admin requests: `official_squad_admin_requests` and `official_directory_requests` handle vetting flows for official squads/leagues/grades/clubs.
- Moderation: `rpc_set_post_hidden` toggles `posts.hidden_at/hidden_by`. `rpc_set_squad_archived` toggles `squads.archived_at/archived_by` for official squads.
- Manual summaries: `rpc_create_manual_game_summary_post` creates `manual_player_game_totals` and linked `posts.manual_game_id`.

## Known Issues / Gaps (docs vs SQL)
- Security-definer RPCs `f_notifications_list`, `f_notifications_mark_read`, `f_notifications_unread_count` are granted to `anon`/`authenticated` and do not validate `auth.uid()`.

## Hardening Roadmap (next pass)
1) Lock down events/games writes to explicit owners and tracked roles; remove broad authenticated reads where not needed.
2) Scope or remove anon reads unless share-gated (games/events/game_players/squads).
3) Prevent role escalation in `club_roles` (keep self-insert limited to supporter or admin-only flow).
4) Notifications integrity: audit RPC grants and add auth checks to the security-definer helpers.
5) Reduce duplicated or overlapping policies (notifications, player_events, games/game_squads).
