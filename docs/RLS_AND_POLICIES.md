Last updated: 2026-03-24

# RLS and Policies

## Principles
- Least privilege, deny by default, and rely on RLS over client-side checks.
- Avoid client-side privilege escalation: never trust role strings from the client.
- Prefer RPCs for sensitive writes that need multi-row validation.
- Policy names and logic below are taken from `supabase_schema.sql` plus the latest `supabase/migrations/*`.

## Public vs Private (current behavior)

### Public / anon readable today
- `posts` via `Public / follow feed readable` (public posts unless hidden; auth also sees own/followed).
- `post_comments` via `Comments readable to all`.
- `post_likes` via `Likes readable to all`.
- `follows` via `Follow graph readable to all`.
- `products` via `Catalog readable to all`.
- `prices` via `Prices readable to all`.
- `stat_benchmarks` via `Benchmarks readable to all`.
- `grade_catalog` via `grade_catalog_select_all`.
- `games` via `games_select_visible` (track_request_status is NULL/accepted or viewer is owner/requester/target).
- `events` via `events_select_visible` (same visibility gate as games).
- `game_players` via `game_players_public_read_all`.
- `teams` via `teams_public_read_all`.
- `squads` via `squads_read_basic` (non-official squads only).
- `leagues` via `leagues_read_all` (no TO clause; applies to all roles).
- `storage.objects` for `post-images` via `post-images: public read`.

### Authenticated-only reads
- `profiles` via `profiles_directory_read`.
- `clubs` via `clubs_read_active`.
- `club_roles`, `club_follows`, `league_follows` (self rows only except admin policies).
- `squad_members`, `squad_join_requests`, `notifications` (recipient/role-based only).
- `league_grades` via `league_grades_read_all`.
- `states` via `states_read_all`.
- `app_settings` via `app_settings_select_authenticated`.
- `platform_admins`, `official_squad_admin_requests`, `official_directory_requests` (self rows or platform admin).
- `user_push_tokens` (self rows only).

### Desired (future, not implemented)
- Share-gated public access for official rosters or private squads. (Today, unofficial squads are publicly readable; official squads are not.)
- Harden notifications RPC grants and align app-side usage to service-only inserts.

## Table-by-table access rules (policy names + intent)

### profiles
- SELECT: `profiles_directory_read` (authenticated directory read).
- INSERT/UPDATE/DELETE: `profiles_self_rw` (self only).

### club_follows
- SELECT: `club_follows_read_self` (self rows only).
- INSERT: `club_follows_insert_self` (self only).
- UPDATE: `club_follows_update_self` (self only).
- DELETE: `club_follows_delete_self` (self only).

### league_follows
- SELECT: `select own league follows` (self only).
- INSERT: `insert own league follows` (self only).
- DELETE: `delete own league follows` (self only).

### club_roles
- SELECT: `club_roles_admin_read_club` (club admins only) and `club_roles_read_self` (self rows only).
- INSERT: `club_roles_admin_insert` (club admin) and `club_roles_self_insert_supporter` (self insert for `supporter`).
- UPDATE: `club_roles_admin_update` is hard-disabled (always false).
- DELETE: `club_roles_admin_delete` (club admin).
- Platform admin override: `club_roles_platform_admin_manage` (full access).

### app_settings
- SELECT: `app_settings_select_authenticated` (authenticated).

### grade_catalog
- SELECT: `grade_catalog_select_all` (anon + authenticated).

### guest_merge_requests
- SELECT: `guest_merge_requests_select_self` (requester) and `guest_merge_requests_select_admin` (platform admin, official managers, or squad owner/admin).
- INSERT: `guest_merge_requests_insert_self` (requester only).
- UPDATE: `guest_merge_requests_update_admin` (platform admin, official managers, or squad owner/admin).

### platform_admins
- SELECT: `platform_admins_select` (self or platform admin).
- ALL: `platform_admins_manage` (platform admin only).

### clubs
- SELECT: `clubs_read_active` (authenticated, `is_active = true`).
- INSERT: `clubs_insert_platform_admin` (platform admin).

### leagues / league_grades / states
- leagues SELECT: `leagues_read_all` (all roles).
- leagues INSERT: `leagues_insert_authenticated` (self or platform admin).
- leagues UPDATE: `leagues_update_platform_admin` (platform admin only).
- league_grades SELECT: `league_grades_read_all` (authenticated).
- league_grades INSERT: `league_grades_insert_platform_admin` (platform admin only).
- states SELECT: `states_read_all` (authenticated).

### squads
- SELECT: `squads_read_basic` (non-official squads for all roles) and `squads_read_for_authenticated` (all squads for authenticated).
- INSERT/UPDATE/DELETE: `squads_owner_write` (owner only). Official squad archiving is handled via `rpc_set_squad_archived`.

### squad_members
- SELECT: `squad_members_roster_read` (unofficial squads via `f_can_view_squad`; official via `f_can_read_official_squad_members` or own row) and `squad_members_self_read` (self/invited rows).
- INSERT: `inviter_can_insert_squad_members` and `squad_members_insert_inviter` (non-official invites by inviter), `squad_members_official_admin_insert` (official squad manager), `squad_members_self_join_official` (official self-join as accepted member).
- UPDATE: `squad_members_official_admin_update` (official manager), `squad_members_update_owner` (squad owner), `squad_members_owner_manage` (owner for unofficial).
- DELETE: `squad_members_official_admin_delete` (official manager), `squad_members_self_delete_official` (self leave), `squad_members_owner_manage` (owner for unofficial).

### squad_join_requests
- SELECT: `squad_join_requests_select_self` (requester) and `squad_join_requests_select_admin` (accepted owner/admin of squad).
- INSERT: `squad_join_requests_insert_self` (requester only).
- UPDATE: `squad_join_requests_update_admin` (owner/admin can approve/decline) and `squad_join_requests_update_self_cancel` (requester can cancel).

### official_squad_admin_requests
- SELECT: `official_squad_admin_requests_select_self` (requester) and `official_squad_admin_requests_select_admin` (platform admin, official managers, or squad owner/admin).
- INSERT: `official_squad_admin_requests_insert_self` (requester only).
- UPDATE: `official_squad_admin_requests_cancel_self` (requester cancel) and `official_squad_admin_requests_admin_update` (platform admin, official managers, or squad owner/admin).

### official_directory_requests
- SELECT: `official_directory_requests_select_self` (requester) and `official_directory_requests_select_admin` (platform admin).
- INSERT: `official_directory_requests_insert_self` (requester only).
- UPDATE: `official_directory_requests_cancel_self` (requester cancel) and `official_directory_requests_admin_update` (platform admin).

### notifications
- SELECT: `notif_select_self` and `notifications_select_own` (recipient only).
- UPDATE: `notif_update_self` and `notifications_update_own` (recipient only).
- INSERT: `notifications_insert_system` (service_role only).

### posts / post_comments / post_likes / follows
- posts SELECT: `Public / follow feed readable` (platform admin sees all; others only `hidden_at` IS NULL + public/follow rules).
- posts INSERT/UPDATE/DELETE: `Users can create own posts`, `Users can update own posts`, `Users can delete own posts` (updates blocked if hidden).
- post_comments SELECT: `Comments readable to all`.
- post_comments INSERT/UPDATE/DELETE: `Users can create comments`, `authors_can_update_own_comments`, `Users can delete own comments`, `Authors can moderate comments` (post author delete).
- post_likes SELECT/INSERT/DELETE: `Likes readable to all`, `Users can like`, `Users can unlike`.
- follows SELECT/INSERT/DELETE: `Follow graph readable to all`, `Users can follow`, `Users can unfollow`.

### games
- SELECT: `games_select_visible` (anon + authenticated) and `read_games_any_authenticated` (all authenticated).
- INSERT/UPDATE/DELETE: `games_rw_owner_team` (home team owner only).

### events
- SELECT: `events_select_visible` (anon + authenticated, visibility tied to game track-request status).
- INSERT: `events_insert_owned_games` (game creator only; track-request status must be NULL/pending/accepted; if tracked_for_profile_user_id set, event profile must match).
- UPDATE: `events_update_owned_games` (same constraints as insert).
- DELETE: `events_delete_owned_games` (game creator only; NULL/pending/accepted).

### game_squads
- SELECT: `game_squads_select_policy` (auth + game owner or squad owner/member) and `read_game_squads_any_authenticated` (all authenticated).
- INSERT: `game_squads_write_policy` (auth + game owner or squad owner/member).
- UPDATE: `game_squads_update_policy` (auth + game owner or squad owner/member).
- DELETE: `game_squads_delete_policy` (auth + game owner or squad owner/member).

### game_players
- SELECT: `game_players_public_read_all` (anon) and `read_game_players_any_authenticated` (authenticated).
- INSERT/UPDATE/DELETE: `game_players_rw_owner` (home team owner only).

### player_events
- SELECT: `player_events read for authenticated`.
- INSERT: `player_events insert own` and `player_events_insert_own` (created_by = auth.uid() or NULL).
- DELETE: `player_events delete own (undo)` (created_by = auth.uid()).

### manual_player_game_totals
- SELECT: `manual_player_game_totals_select_own` (self) and `manual_player_game_totals_select_authenticated` (all authenticated).
- INSERT/UPDATE/DELETE: `manual_player_game_totals_insert_own`, `manual_player_game_totals_update_own`, `manual_player_game_totals_delete_own` (self only).

### teams
- SELECT: `teams_public_read_all` (anon) and `teams_select_own` (owner).
- INSERT/UPDATE: `teams_insert_own`, `teams_update_own` (owner).

### entitlements / subscriptions / stripe_customers / prices
- entitlements SELECT: `Users read own entitlements`.
- subscriptions SELECT: `Users can read own subscription`.
- stripe_customers SELECT: `Self can read stripe mapping`.
- prices SELECT: `Prices readable to all`.

### user_push_tokens
- ALL: `upt_rw_self` (self rows only).

### storage.objects (policies used in app)
- `post-images: public read` (anyone can read post images).
- `post-images: upload own posts` (authenticated, path scoped to `posts/<uid>/...`).
- `profile-avatars: upload own action photos` (authenticated, path scoped to `action-photos/<uid>/...`).

## Game Tracking Security Model
- **Create/update games**: `games_rw_owner_team` allows only the `teams.owner_user_id` for the home team to write games.
- **Read games**: all authenticated can read due to `read_games_any_authenticated`. Anon reads are limited by `games_select_visible`.
- **Insert/update/delete events**: `events_*_owned_games` allow only the game creator (`games.created_by`) and only while `track_request_status` is NULL/pending/accepted. If a game is tracked for another profile, events must match `tracked_for_profile_user_id`.
- **Manage game_players**: `game_players_rw_owner` restricts writes to the home team owner. Reads are public (`game_players_public_read_all`).
- **Manage game_squads**: `game_squads_*_policy` allows authenticated game owners, squad owners, or accepted squad members to write links.

## Helper Functions Used in RLS
- `f_is_platform_admin()`
- `f_is_club_admin(club_id)`
- `f_is_club_tracker(club_id)`
- `f_can_manage_official_squad_members(squad_id)`
- `f_can_read_official_squad_members(squad_id)`
- `f_can_view_squad(squad_id)`
- `f_user_follows_club(club_id, uid)`

## Notes
- Duplicate policies were removed for `notifications` and `player_events` in the March hardening pass.
- Security-definer RPCs `f_notifications_list`, `f_notifications_mark_read`, and `f_notifications_unread_count` are granted to `anon` and `authenticated` and do not validate `auth.uid()`.
- `club_roles` self-insert is restricted to `supporter`; elevated roles require admin approval.
