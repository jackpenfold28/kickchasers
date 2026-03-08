Last updated: 2026-03-24

# Roles and Permissions

## Role Vocabulary (authoritative)
- **Profile roles (UI only)**: `profiles.primary_role` and `profiles.game_day_roles[]` use enum `gameday_role` = `player`, `admin`, `coach`, `tracker`, `supporter`.
- **Club authority roles**: `club_roles.role` check constraint allows `player`, `coach`, `tracker`, `member`, `supporter`, `admin`, `club_member`.
- **Squad authority roles**: `squad_members.role` check constraint allows `owner`, `admin`, `member`.
- **Platform admin**: `platform_admins.profile_user_id` identifies users with global moderation/admin privileges.
- **Membership status**: `squad_members.status` = `pending`, `accepted`, `rejected`.
- **Join request status**: `squad_join_requests.status` = `pending`, `approved`, `declined`, `cancelled`.
- **Admin request status**: `official_squad_admin_requests.status` and `official_directory_requests.status` = `pending`, `approved`, `declined`, `cancelled`, `revoked`, `archived`.

## Interest vs Authority
- **Interest**: `club_follows`, `league_follows`, and `follows` are non-authoritative. They only enable read access where policies explicitly allow followers.
- **Authority**: `club_roles` (club-level), `squad_members` (squad-level), and `platform_admins` (global) are the only role-bearing tables used by RLS.

## How Roles Are Granted (current schema behavior)
- **Profile roles**: users set `profiles.game_day_roles[]` + `home_club_id` for UI hints; automatic sync to `club_roles` is currently disabled.
- **Club roles (self-grant)**: authenticated users can self-insert `club_roles.role='supporter'` only; other roles require admin paths.
- **Club roles (admin-grant)**: policy `club_roles_admin_insert` uses `f_is_club_admin(club_id)`; admin roles must exist already or be created via platform admin.
- **Platform admin**: `platform_admins_manage` allows platform admins to manage `platform_admins`, `club_roles`, `official_*_requests`, and update leagues (including logos). Platform admin-only RPCs include `rpc_set_post_hidden` and `rpc_set_squad_archived`.
- **Club follow**: `club_follows_*` policies allow authenticated users to follow/unfollow and read their own follow rows. `league_follows` mirrors this pattern for match-day.
- **Squad roles**: owners are created by `f_create_squad` (owner is added as `squad_members.role='owner'` and `status='accepted'`). Invites use `f_invite_member`/`f_bulk_add_squad_members` and create `squad_members` rows. Official squads additionally allow a self-join path (`squad_members_self_join_official`).
- **Join requests**: `squad_join_requests_insert_self` allows users to request to join (with `requested_role`); owners/admins can approve/decline with `squad_join_requests_update_admin` or `rpc_decide_squad_join_request`.

## Permissions Matrix (high-level)

### Club roles (`club_roles.role`)
These roles only affect **official** squad access via helper functions. They do **not** directly grant game/event permissions.

| Role | Clubs | Official squads | Unofficial squads | Games | Events | Notifications |
| --- | --- | --- | --- | --- | --- | --- |
| player | Read active clubs (auth) | No direct RLS access | No direct access | None | None | Recipient read/update only |
| coach | Read active clubs (auth) | No direct RLS access | No direct access | None | None | Recipient read/update only |
| tracker | Read active clubs (auth) | **Read roster** via `f_can_read_official_squad_members` | No direct access | None | None | Recipient read/update only |
| member | Read active clubs (auth) | No direct RLS access | No direct access | None | None | Recipient read/update only |
| supporter | Read active clubs (auth) | No direct RLS access (unless also follower) | No direct access | None | None | Recipient read/update only |
| admin | Read active clubs (auth) | **Manage roster** via `f_can_manage_official_squad_members` | No direct access | None | None | Recipient read/update only |
| club_member | Read active clubs (auth) | No direct RLS access | No direct access | None | None | Recipient read/update only |

### Squad roles (`squad_members.role`)
These roles affect squad access. Official-squad management is still gated by `f_can_manage_official_squad_members` (squad owner or club admin role).

| Role | Clubs | Official squads | Unofficial squads | Games | Events | Notifications |
| --- | --- | --- | --- | --- | --- | --- |
| owner | Read active clubs (auth) | Manage members if owner/admin; roster read only if follower/tracker | Full manage + roster read (via `f_can_view_squad`) | None | None | Recipient read/update only |
| admin | Read active clubs (auth) | No special rights beyond membership row | Manage members if owner grants updates; roster read (via `f_can_view_squad`) | None | None | Recipient read/update only |
| member (accepted) | Read active clubs (auth) | Can read **own** membership row; roster read only if follower/tracker | Roster read (via `f_can_view_squad`) | None | None | Recipient read/update only |

### Followers (`club_follows`)

| Role | Clubs | Official squads | Unofficial squads | Games | Events | Notifications |
| --- | --- | --- | --- | --- | --- | --- |
| follower | Read active clubs (auth) | **Read roster** via `f_can_read_official_squad_members` | No direct access | None | None | Recipient read/update only |

### Platform admin (`platform_admins`)
- Can manage `platform_admins`, `club_roles`, `official_squad_admin_requests`, `official_directory_requests`.
- Can insert leagues/grades/clubs and update leagues (including logos).
- Can moderate posts via `rpc_set_post_hidden` and archive official squads via `rpc_set_squad_archived`.

## Notes and Caveats
- Profile role `admin` is UI-only and does not auto-sync into `club_roles`.
- `club_roles` self-insert is restricted to `supporter`; elevated roles require admin approval.
- Games/events/game_players/game_squads are governed by ownership and track-request fields, not by club/squad roles. See `docs/RLS_AND_POLICIES.md` for the exact policy names.
- Notifications: insert is service-only (`notifications_insert_system`); only recipients can select/update their notifications.
