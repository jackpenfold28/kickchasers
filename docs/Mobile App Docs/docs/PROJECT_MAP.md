# KickChasers project map

Last verified: 2026-08-11

Source of truth: Expo Router files under `app/`, imports and navigation calls in reachable screens, active hooks/repositories, `app/_layout.tsx`, and `app/(tabs)/_layout.tsx`.

## Runtime layers

| Layer | Main paths | Responsibility |
| --- | --- | --- |
| Navigation/auth | `app/_layout.tsx`, `app/(tabs)/_layout.tsx` | Session, onboarding and verification gates; providers; push/deep-link handling; six main tabs |
| Screens | `app/` | Expo Router routes listed in `ROUTES_AND_QUERIES.md` |
| Feature UI | `components/` | 158 components covering tracker, summary, feed, squads, profile, moderation, and onboarding |
| Data hooks | `hooks/` | Query lifecycle, polling/realtime, profile/feed/match-day/notification state |
| Domain/data | `lib/` | Supabase repositories, aggregation, offline queue, timers, mapping, exports, permissions |
| Backend | `supabase/migrations/` | Ordered schema, RLS, triggers, RPCs, storage policies, Realtime publication |
| Edge Functions | `supabase/functions/send-push`, `supabase/functions/delete-account` | Expo push dispatch and privileged account deletion |
| Native/build | `app.json`, `eas.json`, `ios/` | iOS native project, managed Android build config, links, notifications, Sentry |

## Main product flows

### Single-player game

`/(tabs)/new-game/index` → game insert → `/tracker` → SQLite pending events → `events` sync → `/games/[id]/summary` → optional `player_stat_card` post → feed/profile/game log.

Important implementation: `app/tracker.tsx`, `lib/offline.ts`, `lib/tracker-stat-definitions.ts`, `hooks/use-tracker-stat-layout.ts`, `lib/game-stats.ts`, `components/field/*`.

### Full team game

`/new-game/team-tracker/setup` → squad selection → player selection → stat-pad setup → `createTrackedGameWithSquadsAndPlayers` → `/new-game/team-tracker/game` → `/new-game/team-tracker/summary`.

Data chain: `games` → `game_squads` → `game_players` → `events`. `squad_members` supply linked or guest players. New `game_players` rows snapshot the canonical position when known, preserving the game-time rating cohort independently of later roster/profile edits. Team summaries can create `team_game_summary` posts and PDFs.

### Linked two-device game

Creator enables both teams/share code → `rpc_generate_link_code` → joiner previews/claims code → joiner configures their squad → Realtime synchronises game lifecycle/events. Only the creator controls shared quarter/timer state; RLS restricts each linked actor to their side.

Important implementation: `lib/team-tracker-repository.ts`, July 2026 linked-state migrations, Realtime channel in `app/new-game/team-tracker/game.tsx`.

### Team Stats Game

`/new-game/team-stats-game/setup` → squad → shared stat pad → the common team-tracker live screen in `team_stats_game` mode → common team summary. Events use player number `0`/no player identity and represent team totals. Coaches/admins find these from `/teams/[id]/coaches`.

### Match Day/live consumption

Users follow leagues → `useMatchDay` fetches eligible official live/recent games → `/new-game/team-tracker/summary` polls until final. Team Stats Games are excluded and appear in the coaches area instead.

### Player history

Tracked accepted events and `manual_player_game_totals` feed game logs and profile calculations. `v_player_game_totals` exposes Hitouts as `ho` for season rating inputs. `ProfileScreen` computes last-three, season, and career scopes from loaded games; leaderboards use official counted-event views and client filters.

### Squads and club operations

Teams tab/directory → squad detail → roster roles, invites, approvals, guest merge, age/side groups, team colours, team selection, coaches area, and votes. Official squads use club roles; custom squads use squad roles.

### Awards/voting

`/teams/[id]/votes` → group and award setup → tracked/manual matchup → vote-card assignment or public token → submissions → matchup breakdown/tally. Backend: `squad_vote_*` tables and `rpc_*squad_vote*` functions.

### Social/moderation

Finalised/manual games and team selections create typed `posts`; the feed loads followed/self/recommended content, likes/comments, and live strips. Blocking removes follows. Reports enter admin moderation; platform admins hide/unhide posts.

## State and synchronisation

- TanStack Query: feed, match day, squads, votes, admin, profile summaries, notifications.
- Zustand: transient new-game setup, squads, players, join context, and stat-pad draft in `lib/game-tracker-store.ts`.
- SQLite: single-player `pending_events` only.
- File/AsyncStorage: local quarter clocks and selected tracker preferences that supplement server state.
- Supabase Realtime: linked team games and notifications. Match Day and summaries mainly poll.

## Redirect, compatibility, and internal routes

- `app/index.tsx` and `app/home/index.tsx` redirect to the authenticated feed.
- `app/(tabs)/index.tsx` is a built hub screen but hidden from the current tab navigator and bypassed by the root `/` redirect: `INTERNAL`.
- `app/(tabs)/new-game/team-tracker/index.tsx` redirects to setup.
- `app/new-game/team-stats-game/game.tsx` and `summary.tsx` redirect to the common team tracker/summary.
- `app/teams.tsx` is a compatibility entry for the Teams experience; the primary tab is `app/(tabs)/teams/index.tsx`.
- `docs/web-summary-reference/Summary.tsx` is reference code, not a route.

## Repository scale

The repository includes Expo routes, feature components, hooks, domain libraries, ordered migrations, two Edge Functions, and focused first-party Node tests for selected domain/model contracts. Counts drift as features are added; use `rg --files` for current inventory.
