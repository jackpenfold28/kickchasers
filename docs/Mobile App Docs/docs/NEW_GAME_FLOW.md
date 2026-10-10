# Current New Game and Tracking Flows

Last verified: 2026-07-23
Source of truth: `app/new-game/**`, `app/tracker.tsx`, `app/new-game/team-tracker/**`, `components/team-tracker/**`, related `lib/` modules, and ordered Supabase migrations

KickChasers has four related but distinct tracking paths. Route names below use Expo Router file notation where useful.

## Entry and mode selection

The visible New Game tab is `/(tabs)/new-game`. It presents the available tracking paths and routes into their setup screens. Existing matches can also be reopened from Match Day, profiles, squad/coach views, notifications, and feed content.

| Mode | Setup and live route family | Player attribution | Offline event queue | Multi-device |
| --- | --- | --- | --- | --- |
| Single-player | `/new-game/single-player/**` → `/tracker` | One selected player | Yes, Expo SQLite pending-event queue | No linked-side protocol |
| Full team | `/new-game/team-tracker/**` | Selected home and optionally away players | No | Realtime viewing; one writer unless linked |
| Linked team | Team tracker link/create/join routes | Side-specific rosters and writers | No | Yes, link-code RPCs and side ownership |
| Team Stats Game | `/new-game/team-stats-game/**` → shared team tracker live/summary | None; team totals only | No | Uses common live match state |

## Single-player flow

Setup collects match/opponent context and the stats to expose. `/tracker` records base and modifier events, location where applicable, timer/quarter state, undo, and custom counters. Events can be queued locally while disconnected and replayed on reconnect through `lib/offline.ts`.

The resulting game appears in the player game log and summary surfaces. Share-card generation is on-device. This path does not provide a public anonymous live viewer.

## Full team flow

The team-tracker setup family selects the squad, opponent, date/match settings, which sides to track, players/guests, and enabled custom stats. The live tracker records player-attributed and scoring events, supports undo and quarter/timer controls, and writes directly to Supabase.

The summary aggregates players, team totals, score worm, field and influence views, live insight panels, custom counters, and export/share actions. Team-summary PDF generation uses Expo Print and Expo Sharing.

Because this path has no durable local event queue, loss of connectivity can interrupt writes even when the current UI state remains visible.

## Linked two-device flow

A creator generates a link code and another authenticated tracker joins a side. Database RPCs bind each participant to a side; RLS restricts writes to that side. Both clients use Supabase Realtime for game/event changes. Shared match-state migrations provide creator-controlled timer/quarter state.

Linked tracking must be verified against the deployed Realtime publication and RLS state. Generic baseline read policies remain broader than the linked-write rules.

## Team Stats Game flow

This is a playerless both-team mode for recording team totals. It shares the common team-tracker live and summary stack but intentionally omits player selection/attribution. Match Day excludes `team_stats_game` records from its official-team live list.

## End, summary, and content

Tracker end flows update match state and navigate to the appropriate summary. Summaries and recap posts are derived from recorded structured events. Recap copy is template-based; no AI model is called. Generated social cards/posters are on-device image captures.

## Known constraints

- Only single-player tracking has offline replay.
- `/share/game/[id]` is currently intercepted by the root auth gate for signed-out users.
- Team-summary PDF is the only dedicated PDF export found.
- Voice input is not implemented.
- Realtime publication membership and production link behaviour require environment verification.
- The generated database types lag active migrations, so inspect concrete queries and SQL before changing event payloads.
