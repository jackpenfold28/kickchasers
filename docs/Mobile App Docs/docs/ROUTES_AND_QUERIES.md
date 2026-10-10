# Routes and queries

Last verified: 2026-07-23

Source of truth: every `.tsx` route under `app/`, the root/tab layouts, route navigation calls, and active hooks/repositories.

## Authentication rules

- Public auth routes: `/sign-in`, `/sign-up`, `/check-email`, `/forgot-password`, `/reset-password`, `/auth/callback`.
- Public product route: `/vote-card/[token]` only.
- Authenticated onboarding routes: `/onboarding`, `/request-club`, `/request-league`.
- Every other route is redirected to sign-in by `app/_layout.tsx` when no session exists, including `/share/game/[id]`.
- Authenticated users with incomplete profiles are forced through onboarding. Platform/squad/club role checks happen inside their screens and server operations.

## Primary tabs

| Route | Purpose | Main data |
| --- | --- | --- |
| `/(tabs)/feed` | Followed/self/recommended recap feed, live strips, likes/comments/report/block | `useFeed`, `feed-repository`, `posts`, interactions, follows |
| `/(tabs)/match-day` | Followed-league live/recent official games | `useMatchDay`, `match-day-repository`; 25-second live polling |
| `/(tabs)/new-game` | Choose single/team/Team Stats/link flow; single-game setup | games, directory, tracker stat setup, dashboard |
| `/(tabs)/teams/index` | Teams, My Squads, Following | squads, memberships, clubs/leagues, follows |
| `/(tabs)/leaderboards` | Official player leaderboards with state/league/club/age filters | official counted-event views, directory repositories |
| `/(tabs)/me` | Profile and game log pager | profile/game/manual totals/posts/platform-admin check |

`/(tabs)/index` contains a dashboard hub but is hidden and not the authenticated default: `INTERNAL`.

## Tracker setup and live routes

| Route | Status | Purpose/dependencies |
| --- | --- | --- |
| `/new-game/team-tracker/setup` | LIVE | fixture, both-team switch, share/link setting |
| `/new-game/team-tracker/select-squads` | LIVE | eligible squads, grade, linked-side setup |
| `/new-game/team-tracker/select-players` | LIVE | roster/guest player snapshots |
| `/new-game/team-tracker/stat-pad-setup` | LIVE | pad, modifiers, locations, custom stats, schedule/start |
| `/new-game/team-tracker/game` | LIVE | common live team/Team Stats tracker; events, timers, Realtime |
| `/new-game/team-tracker/summary` | LIVE | live/final team summary, maps, score worm, PDF, feed post |
| `/new-game/team-stats-game/setup` | LIVE | playerless two-team fixture |
| `/new-game/team-stats-game/select-squads` | LIVE | home squad/grade |
| `/new-game/team-stats-game/stat-pad-setup` | LIVE | shared two-side pad |
| `/new-game/team-stats-game/game` | Redirect | redirects to common team tracker |
| `/new-game/team-stats-game/summary` | Redirect | redirects to common team summary |
| `/tracker` | LIVE | single-player live tracker with SQLite queue |
| `/(tabs)/new-game/team-tracker/index` | Redirect | redirects to team setup |

The `app/(tabs)/new-game/*` paths keep setup within the tab stack. Full-screen live/summary paths live under `app/new-game/*`.

## Game and content routes

| Route | Purpose |
| --- | --- |
| `/games/[id]/summary` | single-player tracked summary; player identity params can target team-game players |
| `/games/manual/[id]/summary` | manually entered game summary |
| `/add-game-stats` | create/edit manual personal totals and optional recap |
| `/share/game/[id]` | web/app handoff snapshot; currently auth-gated by root layout |

Single summaries load `games`, target `game_players`/profile, `events`, custom definitions, teams/profile/directory metadata. Team summaries hydrate through `team-tracker-repository` and poll every 10 seconds while not final.

## Squad and club routes

| Route | Access/purpose |
| --- | --- |
| `/teams` | compatibility Teams entry |
| `/teams/[id]` | squad detail, roster, sides, activity, stats, management |
| `/teams/preview/[id]` | reduced squad preview/stats |
| `/squad/[squadId]/overview` | member/owner overview |
| `/teams/[id]/approvals` | role/join/official admin approvals |
| `/teams/[id]/guest-users` | guest management and merge |
| `/teams/[id]/team-colors` | authorised branding |
| `/teams/[id]/team-selection` | lineup and poster/post workflow |
| `/teams/[id]/coaches` | coach/admin Team Stats Game list |
| `/leagues/[id]` | league detail; maintenance actions are platform-admin gated |
| `/leagues/[id]/bulk-team-add` | platform-admin directory bulk addition |
| `/request-club`, `/request-league` | authenticated official directory requests |

## Awards routes

| Route | Purpose |
| --- | --- |
| `/teams/[id]/votes` | award groups |
| `/teams/[id]/votes/groups/[groupId]/setup` | eligible members and award types |
| `/teams/[id]/votes/groups/[groupId]` | matchups and previews |
| `/teams/[id]/votes/groups/[groupId]/tally` | leaderboards/tallies |
| `/teams/[id]/votes/matchups/[matchupId]` | cards, assignment, public links |
| `/teams/[id]/votes/cards/[cardId]` | authenticated card |
| `/vote-card/[token]` | anonymous token-scoped card |

All award mutations use `hooks/use-squad-votes.ts` and `lib/squad-votes-repository.ts` over guarded vote RPCs.

## Profile, community, settings

| Route | Purpose |
| --- | --- |
| `/users/[id]` | another authenticated user’s profile |
| `/profile` | own profile compatibility screen |
| `/friends` | profile/squad discovery and follows |
| `/notifications` | notification list, mark-read, deep links |
| `/settings` | account/profile/media/auth/account deletion |
| `/settings/blocked-users` | unblock/manage blocks |
| `/settings/roles` | club/squad role state |
| `/settings/profile/personal` | edit personal fields |
| `/settings/profile/photos` | edit avatar/action photo |
| `/settings/profile/club` | edit home club/league |
| `/settings/profile/role` | edit profile role preferences |
| `/account/update-email` | email change |

## Platform administration

| Route | Purpose |
| --- | --- |
| `/admin` | dashboard, users, leagues, requests, games, squads, moderation |
| `/admin/manual-feed-post` | platform-authored manual game/feed post |

The route renders an access-denied state when `f_is_platform_admin` is false; RPC/RLS checks remain required.

## Bootstrap/error routes

- `/`: session-aware redirect to `/feed`.
- `/home/index`: legacy redirect to `/feed`.
- `/error`: explicit error surface.
- Root error boundary renders `CrashFallbackScreen` in production.

## Deep links

- Custom scheme: `kickchasers://`.
- Auth callback: `kickchasers://auth/callback`.
- Shared game: `https://kickchasers.com/share/game/*` and `www` Android intent filters; iOS associated domains are declared.
- Vote cards use Expo Linking-generated `/vote-card/[token]` URLs.
- Notification routes are mapped in `lib/notification-routing.ts`.

Remote AASA/asset-links files and store builds were not available, so universal/app links are `PARTIAL`.

## Dead/legacy/duplicate notes

- No `/preview-card` route exists; older docs were stale.
- `/home/index` and root `/index` are redirects.
- The hidden hub `/(tabs)/index` is implemented but unreachable from current primary navigation.
- Team Stats game/live and summary aliases are intentional redirects, not independent implementations.
- `player_events` remains in the schema, but current trackers use `events`.
