Last updated: 2026-03-24

# DB Schema Notes

- Text ER (primary flows): `profiles (user_id PK)` -> `club_roles (club_id, user_id, role)` -> `clubs (league_id -> leagues)`; `profiles` -> `squad_members (squad_id -> squads)` -> `squads (club_id? -> clubs, league_id -> leagues, grade_id -> league_grades, league_grade_id -> league_grades)` -> `squad_join_requests` / `guest_merge_requests`; `squads` -> `game_squads (team_side)` -> `games (home_team_id -> teams)` -> `events` / `game_players`; `clubs` -> `club_follows (user_id)`; `leagues` -> `league_follows`; `notifications (recipient_id, actor_id, squad_id, ref_id)` connects invites/promotions/track requests.
- Schema source of truth: `supabase/migrations/*` (latest) plus `supabase_schema.sql` snapshot.

## Key Tables

- **profiles**
  - PK: `user_id` (FK -> `auth.users`).
  - Important columns: `name`, `handle`, `game_day_roles[]` (`gameday_role` enum), `primary_role`, `home_club_id`, `home_league_id`, `home_state_code`, `avatar_url/path`, `team_logo_path/url`, `player_number`, `player_position`.
  - Notes: trigger `trg_sync_profile_roles_to_club_roles` maps `game_day_roles` to `club_roles` for the home club (supporter -> member, admin dropped). Includes account deletion tombstones (`deleted_at`, `deleted_reason`, `deleted_by`).

- **app_settings**
  - KV store for system-level settings (ex: `system_owner_user_id` used during account deletion).
  - RLS: authenticated select only.

- **clubs**
  - PK: `id` (uuid); FKs: `league_id` -> `leagues`.
  - Important columns: `name`, `slug`, `logo_path`, `is_active`, `primary_color`, `secondary_color`.
  - Notes: one official squad per club enforced by `uq_official_squad_per_club` on `squads` where `is_official = true`.

- **leagues** / **league_grades** / **states**
  - PKs: `leagues.id`, `league_grades.id`, `states.id`.
  - Important columns: `leagues.state_code/state_id`, `leagues.is_custom`, `leagues.is_active`, `leagues.logo_path`; `league_grades.league_id`, `code`, `name`, `sort_order`, `is_custom`, `grade_key`.
  - Notes: `leagues_update_platform_admin` allows platform admins to edit leagues (including logos).

- **grade_catalog**
  - Canonical grade reference (`grade_key`, `label`, `category`, `sort_order`, `min_age`, `max_age`, `is_active`).
  - `league_grades.grade_key` references `grade_catalog.grade_key`; `league_grades` joins are used for consistent labels.

- **league_follows**
  - PK: composite `(league_id, user_id)`.
  - Notes: drives match-day league subscriptions; RLS restricts to self rows only.

- **club_roles**
  - PK: composite `(club_id, user_id, role)`; FK -> `clubs`, `profiles`.
  - Important columns: `role` allows `player`, `coach`, `tracker`, `member`, `supporter`, `admin`, `club_member`.
  - Notes: platform admins can manage via `club_roles_platform_admin_manage`.

- **club_follows**
  - PK/unique `(club_id, user_id)`.
  - Notes: drives follower read access to official squad rosters (`f_can_read_official_squad_members`).

- **squads**
  - PK: `id`; FKs: optional `club_id` -> `clubs`, `league_id` -> `leagues`, `grade_id` -> `league_grades`.
  - Important columns: `owner_id`, `user_id` (creator), `name`, `number`, `set_name`, `logo_url`, `cover_image_url`, `grade_id`, `league_grade_id`, `is_official`, `primary_color_hex`, `secondary_color_hex`, `tertiary_color_hex`, `archived_at`, `archived_by`.
  - Notes: ownership is row-level; `is_official` ties squad to club helper functions; platform admins can archive official squads via `rpc_set_squad_archived`.

- **squad_members**
  - PK: `id`; FKs: `squad_id` -> `squads`, `user_id` -> `profiles` (nullable for guests), `invited_by` -> `profiles`.
  - Important columns: `role` (`owner`/`admin`/`member`), `status` (`pending`/`accepted`/`rejected`), `jersey_number`, `position`, `handle`, guest fields.
  - Constraints: unique `(squad_id, user_id)` plus `(squad_id, guest_name, jersey_number)`; check constraints on role/status/position.
  - Notes: `f_notify_squad_admin_promotion` triggers notifications when role flips to `admin`; invite/accept triggers create notifications; official squads are managed by `f_can_manage_official_squad_members` (owner or club admin role).

- **squad_join_requests**
  - PK: `id`; FKs: `squad_id` -> `squads`, `requester_user_id` -> `auth.users`, `decided_by` -> `auth.users`.
  - Important columns: `requested_role`, `status` (`pending`/`approved`/`declined`/`cancelled`), `decision_reason`, `decided_at`, `decided_by`.
  - Notes: join-request notifications emit `squad_join_request_created`/`squad_join_request_decided`.

- **guest_merge_requests**
  - PK: `id`; FKs: `squad_id`, `guest_squad_member_id`, `user_id`, `decided_by`.
  - Important columns: `guest_name`, `status` (`pending`/`approved`/`declined`), `decision_reason`, `decided_at`.
  - Notes: created when merging a guest roster entry into a real profile; emits notifications on create/decision.

- **official_squad_admin_requests** / **official_directory_requests**
  - Requests for official squad admin rights and directory additions.
  - `official_directory_requests.request_kind` supports `add_league`, `add_grade`, `add_club`, `add_squad`.
  - Status values include `pending`, `approved`, `declined`, `cancelled`, `revoked`, `archived`.

- **platform_admins**
  - PK: `profile_user_id` (auth user id).
  - Notes: `f_is_platform_admin()` gates admin-only policies and RPCs.

- **notifications**
  - PK: `id`.
  - Important columns: `recipient_id`, `actor_id`, `type`, `ref_id`, `squad_id`, `payload`, `read_at`, `created_at`.
  - Constraint: `notifications_type_check` includes role change, join request, guest merge, official requests, social (`post_*`), and follow events (see `docs/NOTIFICATIONS_SPEC.md`).

- **games** / **game_squads** / **game_players** / **events** / **player_events**
  - PKs: `games.id`, `game_squads.id`, `game_players.id`, `events.id`, `player_events.id`.
  - Important columns:
    - `games`: `home_team_id` -> `teams`, `opponent`, `date`, `status`, `round`, `grade_id`, `is_locked`, `share_enabled`, `track_both_teams`, track-for-user metadata (`tracked_for_profile_user_id`, `tracked_by_profile_user_id`, `track_request_status`, timestamps/decider), link-code metadata (`link_code`, `link_claimed_by_user_id`, `link_claimed_at`).
    - `game_squads`: `game_id`, `squad_id`, `team_side`, `is_primary`.
    - `game_players`: `game_id`, `team_side`, `number`, `name`, `squad_member_id`, `profile_user_id`.
    - `events`: `game_id`, `team_side`, `quarter`, `stat_key`, `player_number`, `profile_user_id`, `squad_member_id`.
    - `player_events`: `game_id`, `player_id`, `type`, `quarter`, `created_by`.
  - Notes: `prevent_edit_when_locked` blocks edits once locked; `set_created_by` fills creator where null.

- **manual_player_game_totals**
  - Stores manual stat entries per game; `user_id`/`game_id` can be NULL for admin-curated summaries.
  - New columns: `subject_display_name`, `subject_club_id`.
  - Views `v_player_game_totals` and `v_player_season_averages` union manual entries with event-based totals.

- **teams**
  - Owner-scoped team metadata backing `games.home_team_id` and tracking permissions.

- **posts** / **post_comments** / **post_likes**
  - Posts can include `squad_id`, `type`, `payload`, and `manual_game_id` (manual summary posts).
  - Moderation: `hidden_at`/`hidden_by` support platform admin hiding via `rpc_set_post_hidden`.

- **user_push_tokens**
  - Stores Expo push tokens per user; unique `(user_id, token)`.

## Constraints That Impact RLS and Security
- **Role checks**:
  - `club_roles_role_check`: allows `player`, `coach`, `tracker`, `member`, `supporter`, `admin`, `club_member`.
  - `squad_members_role_check`: `owner`, `admin`, `member` only.
- **Status checks**:
  - `squad_members_status_check`: `pending`, `accepted`, `rejected`.
  - `squad_join_requests_status_check`: `pending`, `approved`, `declined`, `cancelled`.
  - `games_status_check`: `scheduled`, `live`, `final`.
  - `games_track_request_status_check`: `pending`, `accepted`, `declined`, or NULL.
- **Notification types**: `notifications_type_check` restricts allowed types to the six values listed above.
  - **Notification types**: `notifications_type_check` lists the full set in `docs/NOTIFICATIONS_SPEC.md`.
- **Event checks**:
  - `events_team_side_check`: `home`, `away`.
  - `events_stat_key_check`: `K`, `HB`, `M`, `T`, `G`, `B`, `D`, `FF`, `FA`, `CL`, `I50`, `R50`, `HO`, `GBG`, `HR`, `CON`, `UC`, `MC`, `MUC`, `K_EF`, `K_IF`, `HB_EF`, `HB_IF`, `TO`, `INT`, `ONE_PERCENT`, `GA`.
  - `player_events_type_check`: `kick`, `handball`, `mark`, `tackle`, `goal`, `behind`, `clearance`, `inside50`, `rebound50`, `intercept`, `free_for`, `free_against`, `turnover`.
- **Foreign key dependencies used in policies**:
  - `squads.owner_id` and `squads.is_official` gate `squad_members` policies.
  - `club_follows` and `club_roles` are read by `f_can_read_official_squad_members`.
  - `teams.owner_user_id` gates `games_rw_owner_team` for writes.
  - `games.created_by`, `tracked_for_profile_user_id`, and `track_request_status` gate `events_*` policies.

## Common Query / Join Patterns
- Roster lookups: `f_squad_members(_squad_id)` joins `squad_members` -> `profiles` for display names/handles; official roster reads rely on `club_roles`/`club_follows` for RLS.
- Membership summary: `f_squads_for_user(_uid)` (owner rows + accepted memberships) joined to `league_grades`/`leagues` for labels.
- Grade labels: join `league_grades` to `grade_catalog` to normalize grade names/sort order.
- Team tabs: `squads` (owner or member) + `squad_members` (accepted) + `club_follows` (official follower view) + `club_roles` (tracker role for official roster reads).
- Match day: `league_follows` -> `games` (live) -> `game_squads` -> `squads` + `leagues` + `league_grades` with latest `events` for quarter/clock.
- Game linkage: `game_squads` connects squads to `games`; `game_players` upserts per side using squad member IDs; `events` and `player_events` filter by `game_id` and `team_side`.
- Notifications feed: select `notifications` by `recipient_id` and join `profiles` (actor) and `squads` (logo/name) in app code; mark-read via `read_at` updates.
