Last updated: 2026-03-24

# Routes and Queries

## App Routes (Expo Router) and Data Sources
- **/(tabs)/index.tsx** (Hub, auth required) – Uses `useGamesDashboard` (`games`, `events`, `game_squads`, score totals via `team-tracker-repository`) + `useProfileSummary`.
- **/(tabs)/feed.tsx** (auth required) – Uses `useFeed` -> `public.feed` view (`posts` + author profile fields), `post_comments`, `post_likes`, `follows`. Uses `useLiveTrackers` -> RPC `f_live_games_for_following` + `profiles`. Live team games row uses `games`, `game_squads`, `events`.
- **/(tabs)/teams/index.tsx** (auth required) – Profile summary + affiliated clubs via `club_follows`, `club_roles`, `squad_members` joined to `squads` with `club_id`.
- **/(tabs)/match-day.tsx** (auth required) – Match-day hub. Reads `league_follows`, `leagues`, `clubs`, `games` (live), `game_squads`, `squads`, `league_grades`, latest `events` for quarter/clock.
- **/(tabs)/new-game/* + /new-game/team-tracker/** (auth required) – Setup & tracker flow reads squads (`squads`, `f_squads_for_user`), grades (`league_grades`), members (`squad_members`), writes `games`, `game_squads`, `game_players`, `events`.
- **/(tabs)/me.tsx** (auth required) – Profile + game log. Uses `useProfileSummary`, `GameLogTab` (reads `games`, `events`, `player_events`, `manual_player_game_totals`, track request metadata), `ProfileScreen` for profile updates.
- **/(tabs)/leaderboards.tsx** – Placeholder/roadmap screen.

- **/teams.tsx** (auth required) – Tabs: Teams/My Squads/Following. Data from `listMySquads` (`squads` + accepted `squad_members` + `leagues/league_grades`), pending invites (`squad_members.status='pending'`), and follows (`club_follows`). Member counts via `f_squad_members`.
- **/teams/[id].tsx** (auth required) – Squad detail (`squads` + league/grade), members via `f_squad_members`, join requests (`squad_join_requests`), follow state (`club_follows`), membership role (`squad_members`). Official squad management is gated by `f_can_manage_official_squad_members`.
- **/teams/[id]/guest-users.tsx** (auth required) – Guest roster management; reads `squad_members` (guest rows) and `profiles` (merge lookup), writes updates/removals; can issue `guest_merge_requests` in admin flows.
- **/teams/[id]/team-colors.tsx** (auth required) – Squad color editor (`squads.primary_color_hex` etc) via `getSquadDetail`/`updateSquadColors`.
- **/teams/[id]/team-selection.tsx** (auth required) – Team selection for tracker; reads `squad_members`, `game_players`, `games`, `game_squads`.
- **/teams/preview/[id].tsx** (auth required) – Read-only squad preview; RLS limits roster visibility (followers or trackers for official squads; members for unofficial squads).
- **/squad/[squadId]/overview.tsx** (auth required) – Lightweight squad overview (reads `squads`, `clubs`, `leagues`, `squad_members`).

- **/notifications.tsx** (auth required) – `useNotifications` wraps `notifications` select/update; joins to `profiles` (actor) and `squads` (logo/name) in app code. Realtime subscription on `notifications` channel.
- **/games/[id]/summary.tsx** (auth required in app) – Reads `games`, `game_players`, `events`, `player_events` for recap export; DB allows anon reads for some tables, but app uses authenticated client.
- **/games/manual/[id]/summary.tsx** (auth required) – Manual summary view; reads `manual_player_game_totals`, `posts.manual_game_id`, `rpc_get_manual_game_summary_for_post`, plus `profiles`, `teams`, storage logos.
- **/add-game-stats.tsx** (auth required) – Manual stats entry; writes `manual_player_game_totals`, ensures `teams`/`games` linkage via `team-tracker-repository`.
- **/tracker.tsx** (auth required) – Standalone tracker entry; reads/writes `games`, `game_players`, `events`, `player_events`.

- **/admin/index.tsx** (platform admin) – Reads `official_squad_admin_requests`, `official_directory_requests`, `platform_admins`; writes approvals and admin notes; uses `rpc_set_post_hidden` and `rpc_set_squad_archived`.
- **/admin/manual-feed-post.tsx** (platform admin) – Manual summary publishing; writes `manual_player_game_totals` + `posts.manual_game_id` via `rpc_create_manual_game_summary_post`, uses `leagues`, `clubs`, `states`, storage `post-images`/`team-logos`.
- **/leagues/[id].tsx** (platform admin) – League detail editor (reads `leagues`, `squads`, `league_grades`); updates `leagues.logo_path` and admin metadata.

- **/friends.tsx** (auth required) – Search and follow flow for people and official squads. Queries `profiles` (search), `squads` (`is_official=true`), and toggles `follows`/`club_follows`.
- **/profile.tsx, /settings.tsx, /settings/roles.tsx, /account/update-email.tsx** (auth required) – Reads/writes `profiles`; role changes trigger `f_sync_profile_roles_to_club_roles`. Roles screen reads `club_roles`, `squad_join_requests`, `squads` (official mapping) and writes role requests.
- **/sign-in.tsx, /sign-up.tsx, /onboarding.tsx** – Auth + profile setup; `handle_new_user` seeds `profiles`.
- **/request-league.tsx, /request-club.tsx** (auth required) – Directory request flow; inserts into `official_directory_requests` and reads `leagues`/`states`.
- **/preview-card.tsx** – Share card preview (uses `StatCard`/summary data).
- **/users/[id].tsx** – Public-ish profile view; reads `profiles`, public posts, and squad metadata.
- **/home/index.tsx, /index.tsx** – Redirect to `/feed`.

## Important Logic Callouts
- **Match-day filtering** – Live games are limited to leagues the user follows (`league_follows`), and only games with official squads are shown.
- **Team tab logic** – Official roster read is granted to club followers (`club_follows`) and club trackers (`club_roles.role='tracker'`); squad ownership still governs management. Unofficial squads rely on `f_can_view_squad` (owner or accepted member).
- **Manage screen logic** – Promotion/removal operates on `squad_members` (role/status). Admin promotion triggers `f_notify_squad_admin_promotion` -> `notifications`.
- **Player roster queries** – `f_squad_members` (joins `profiles`) is the safest roster source; direct selects must respect `squad_members_roster_read`.
- **Feed gating** – Feed view filters by follow graph and `posts.hidden_at`; if feed items are missing, confirm `follows` rows exist and post visibility is `public`/`followers`.
- **Tracker data** – New game flow creates `game_squads` links per side; players inserted into `game_players` from selected squad members; live events write to `events` with `profile_user_id` and optional `squad_member_id`.
- **Link codes** – Single-team games can generate/join link codes via `rpc_generate_link_code`, `rpc_preview_link_game`, `rpc_claim_link_game`.
- **Manual feed posts** – `manual_game_summary` posts are limited to platform admins or manual-game owners; summaries read from `manual_player_game_totals` via `manual_game_id`.
- **Social notifications** – Post like notifications are batched per post (`post_liked` uses deterministic `ref_id`), comments fire `post_commented` with a trimmed preview.

## Safe Query Patterns
- Prefer RPCs for roster membership and summaries: `f_squad_members`, `f_squads_for_user`.
- Keep `club_roles` writes server-side or via restricted flows; avoid client-side role escalation.
- For notifications, write through server-controlled flows (triggers/RPCs) rather than direct inserts.
- For aggregates, use `v_player_game_totals`, `v_player_season_averages`, and `v_counted_events` instead of raw event scans.
- Platform admin actions should go through `rpc_set_post_hidden` and `rpc_set_squad_archived`.

## Troubleshooting Guide (common permission issues)
- Squad not visible on Teams tab -> ensure `squad_members.status='accepted'` or user is owner; for official squads verify a `club_follows` row exists if the user is only a follower.
- Cannot manage roster -> check `squads.owner_id` or official management via `f_can_manage_official_squad_members` (requires owner or a valid club admin role).
- Match day empty -> confirm the user follows the league (`league_follows`) and there are `games.status='live'` with official squads.
- Notifications empty -> confirm `notifications.type` matches the allowed set and `recipient_id` matches auth user.
- Join request stuck -> verify request row is `status='pending'` and updater is owner/admin of the squad.
- Track request invisible -> pending games/events only visible to owner/requester/target; check `games.track_request_status` and `tracked_for_profile_user_id`.
- Manual summary missing -> ensure `posts.manual_game_id` is set and `rpc_get_manual_game_summary_for_post` returns a row for the viewer.
