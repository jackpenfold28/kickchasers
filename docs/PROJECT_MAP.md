Last updated: 2026-03-24

# Project Map

## App Sections (Expo Router)
- **Feed** – `(tabs)/feed.tsx`; uses `useFeed` (Supabase `public.feed`, `post_likes`, `post_comments`, `follows`) plus live trackers (`f_live_games_for_following`).
- **Hub** – `(tabs)/index.tsx`; dashboard for recent games, stats snapshot, and quick actions.
- **Match Day** – `(tabs)/match-day.tsx`; league follows and live game cards.
- **Teams hub** – `/teams.tsx` with pager tabs: Teams (club affiliations), My Squads (owned/accepted squads), Following (clubs followed). Detail routes: `/teams/[id].tsx` (manage), `/teams/preview/[id].tsx` (read-only), `/teams/[id]/team-colors.tsx`, `/teams/[id]/team-selection.tsx`.
- **Guest users** – `/teams/[id]/guest-users.tsx` for managing guest roster entries and merge actions.
- **Squad overview** – `/squad/[squadId]/overview.tsx` (lightweight read-only summary).
- **New Game + Tracker** – `(tabs)/new-game/*` setup, `/new-game/team-tracker/*` full-screen tracker + summary; `/tracker.tsx` standalone tracker entry; `/games/[id]/summary.tsx` recap.
- **Manual Stats** – `/add-game-stats.tsx` manual stat entry for personal game logs; `/games/manual/[id]/summary.tsx` for manual game recap share screens.
- **Notifications** – `/notifications.tsx` list + mark read; badge in `TopProfileBar`.
- **Profile & Settings** – `/profile.tsx`, `/settings.tsx`, `/settings/roles.tsx`, `/account/update-email.tsx`; onboarding at `/onboarding.tsx`; auth modals `/sign-in.tsx`, `/sign-up.tsx`.
- **Friends / Search** – `/friends.tsx` searchable list of users and official squads; follow/unfollow via `follows` + `club_follows`.
- **Admin** – `/admin/index.tsx` platform admin console for requests, moderation, and user controls; `/admin/manual-feed-post.tsx` for manual summary publishing.
- **League detail** – `/leagues/[id].tsx` (platform admin editing and league logo).
- **Directory requests** – `/request-league.tsx`, `/request-club.tsx` for official directory submissions.
- **Misc** – `/preview-card.tsx` (share card), `/users/[id].tsx` (profile view), `/home/index.tsx` and `/index.tsx` redirects to `/feed`.

## Navigation Relationships
- Root stack `app/_layout.tsx` wraps providers (Supabase, React Query, push registration) and hosts modal routes.
- `(tabs)/_layout.tsx` defines tab bar (Feed, Match Day, New Game, Teams, Leaderboards, Me). Some flows (full-screen tracker, preview card, notifications, admin) sit outside tabs but are reachable from tab buttons or CTA chips.
- Teams hub pushes to `/teams/[id]` for management; preview opens `/teams/preview/[id]`.
- New Game tab routes into in-tab tracker setup, but the live tracker and summary transition to `/new-game/team-tracker/{game,summary}` outside the tab stack for full-screen controls.

## Data Dependencies by Screen
- **Feed** – `public.feed`, `posts`, `post_comments`, `post_likes`, `profiles`, storage buckets (`posts`, `post-images`, `profile-avatars`, `team-logos`), `follows`, `f_live_games_for_following`.
- **Hub** – `games`, `game_squads`, `events`, `game_players`, `v_player_game_totals`, `profiles`.
- **Match Day** – `league_follows`, `leagues`, `clubs`, `games` (live), `game_squads`, `squads`, `league_grades`, `events` (latest quarter/clock).
- **Teams/My Squads/Following** – `profiles` (home club), `club_follows`, `club_roles`, `squads`, `squad_members`, `league_grades`, `grade_catalog`, `leagues`, `states`, `f_squad_members`, `f_squads_for_user`.
- **Squad Detail (/teams/[id])** – `squads`, `squad_members`, `squad_join_requests`, `guest_merge_requests`, `club_follows`, `club_roles`, `profiles`, `leagues/league_grades`, notifications triggers on role changes.
- **Guest users** – `squad_members` (guest rows), `profiles` (merge lookup), `guest_merge_requests`.
- **Team Colors** – `squads` color hex columns.
- **Team Selection** – `squad_members`, `game_players`, `game_squads`, `games`.
- **New Game/Tracker** – `squads`, `squad_members`, `games` (track-request metadata), `game_squads`, `game_players`, `events`, `player_events`, `teams`, `league_grades`, storage for logos.
- **Manual Stats** – `manual_player_game_totals`, `games`, `teams`, `posts.manual_game_id`, `rpc_get_manual_game_summary_for_post`, logo storage.
- **Notifications** – `notifications` table + realtime channel; app joins to `profiles` and `squads` client-side; includes `track_request*` rows tied to `games`.
- **Profile/Settings** – `profiles`, storage buckets for avatars/team logos, `user_push_tokens`, role sync trigger to `club_roles`.
- **Role requests** – `squad_join_requests` (requested roles), `squads` (official squad mapping), `club_roles` (active roles).
- **Friends/Search** – `profiles` search, `follows` graph, `club_follows` for official squads, `squads` (is_official) with league join for labels.
- **Directory requests** – `official_directory_requests`, `leagues`, `clubs`, `states`.
- **Admin** – `platform_admins`, `official_squad_admin_requests`, `official_directory_requests`, `guest_merge_requests`, `posts.hidden_at`, `squads.archived_at`, `manual_player_game_totals`, `posts.manual_game_id`.

## File System Highlights
- `app/` – Routes above; `(tabs)/new-game/team-tracker/*` (setup/players/squads), `new-game/team-tracker/*` (live/summary), `teams/*` (manage/preview/colors/selection), `games/[id]/summary.tsx`, auth/onboarding/settings/profile/notifications.
- `components/` – Feature UIs: feed cards, hub cards, match-day cards, teams sheets/pickers/roster rows, tracker controls, summary components, navigation primitives, themed primitives.
- `hooks/` – Data hooks: feed, notifications, profile summary, live trackers, games dashboard/summary, squads membership, match day, push registration, theme helpers.
- `lib/` – Supabase client + repositories for squads, team tracker, clubs, leagues, admin requests, notifications, manual stats, offline queue, logo storage, palette utilities.
- `supabase/` – Migrations and Edge Function `functions/send-push`.

## Security Boundaries (current)
- **Private by default**: notifications, join requests, admin requests, and membership edits require authentication and owner/admin checks.
- **Membership or follow visibility**: official squad rosters require a `club_follows` row or tracker role; unofficial rosters require accepted membership.
- **Public today**: public posts (when not hidden), games/events with accepted/unset track requests, game_players, teams, and non-official squads (see `docs/RLS_AND_POLICIES.md`).
