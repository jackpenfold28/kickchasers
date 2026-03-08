# New Game Flow

## 1. High-Level Overview
- “New Game” lets a coach/analyst spin up a match, capture live stats, and export summaries. It spans creation (`/new`), roster prep (`/setup/:gameId`), live logging (`/game/:gameId`), and review/export (`/summary/:gameId`).
- Primary goals: pick teams/opponent quickly, optionally track both sides, log stats with optimistic writes to Supabase, keep a visible scoreboard/clock, and surface per‑quarter + full‑game breakdowns that can be shared or exported.

## 2. Navigation Flow
- **NewGameSetup** (`/new`, `/newgame/:gameId`)
  - Entry: Hub “New Game” CTA (not shown in code but routing supports `/new`), “Edit game setup” link from Setup, deep link with `:gameId` to edit.
  - Exit: “Cancel” -> browser back; “Continue/Save & Continue” -> `/setup/:id?both=1|0` (based on track both toggle); “Single Player (Preview)” -> `/player/preview/preview`.
  - Deep links: accepts `gameId` for edit; query `?both=` propagated to Setup.
  - Gestures: standard browser navigation only (no custom swipe handlers).
- **TeamSelection / PlayerSelection** (combined in `Setup.tsx` at `/setup/:gameId`)
  - Entry: from NewGame save redirect; manual deep link with params.
  - Exit: “Start Match” -> `/game/:gameId`; “Edit game setup” -> `/newgame/:gameId`; “Back” -> `/hub`; “Cancel Game” deletes game then `/hub`.
  - Deep links/params:
    - `?both=1|0` forces single vs dual-team tracking.
    - `?loadSquad=1&/squad=<name>` pulls a saved squad into Home.
  - Gestures: none beyond browser.
- **Opponent / Venue / Round** (fields inside NewGameSetup form)
  - Entry/exit as above; no distinct screen.
  - Deep link: `gameId` to prefill opponent/venue/date/quarter length/trackBoth/opponent logo.
- **Countdown** (not a separate screen): live header clock in Game; manual start/stop per quarter.
- **LiveGameTracker** (`Game.tsx` at `/game/:gameId`)
  - Entry: “Start Match” from Setup; direct deep link.
  - Exit: header links to `/hub` and `/summary/:gameId`; share toggle copies summary URL; browser back.
  - Deep links/params: `?both=1|0` overrides dual-team mode; `game:seg:<id>` in localStorage restores last viewed quarter tab.
  - Gestures: none; buttons/ripples only.
- **QuarterControl** (header within Game)
  - Entry: always visible in Game.
  - Exit: switching tabs sets segment/quarter; start/stop button controls local clock only.
- **StatsOverview** (`Summary.tsx` at `/summary/:gameId`)
  - Entry: from Game header, Hub links, or direct deep link.
  - Exit: back to Game/HUB via links; export buttons download files.
  - Deep links: `gameId`; internal segment toggle stored in component state only.
  - Gestures: none.
- **EndGameSummary** (same Summary screen; game status not required to be “final”).
- **Share / Export flow**
  - Entry: Game share toggle (copy/open link to Summary), Summary export buttons (Excel/PDF).
  - Exit: downloaded files or opened summary link.

## 3. Data Flow (Supabase + Local State)
- Game creation (`NewGame.tsx`)
  - On save: inserts/updates `games` with `home_team_id, opponent, date, venue, quarter_length, track_both_teams, opponent_logo_path, created_by, status='live', away_team_name`.
  - Graceful fallback removes optional columns if schema lacks them.
  - Local storage: `game:trackBoth:<id>` persisted.
- Roster prep (`Setup.tsx`)
  - Fetches `games` (for opponent/home names, track_both_* flags) and `game_players` for both sides.
  - If no home roster, backfills from most recent 5 games for that team or loads a saved squad (`squads` table) via query or picker.
  - Local state holds `home`/`away` arrays; not cached beyond component. Reset and add-row logic caps at 50.
  - On “Start Match”: deletes existing `game_players` rows for game, re-inserts current home list, optionally away list (skipped if single-team mode), then navigates to Game.
- Live tracking (`Game.tsx`)
  - Players: fetch `game_players` once; local state `home`/`away`.
  - Events: subscribes to Supabase realtime channel on `events` table filtered by `game_id`; initial fetch ordered by `timestamp_ms`. Stored in local state array.
  - Logging: `log`/`logAwayScore`/`logAwayStat` create optimistic event objects and attempt Supabase insert (requires auth session); rollback + warning on failure.
  - Selection state: `sel`, `seg`, `q` stored in React state; `seg` persisted to `localStorage` (`game:seg:<id>`). TrackBoth preference mirrored to `localStorage`.
  - Clock: local `running/startTs/elapsed`, not persisted.
- Summary (`Summary.tsx`)
  - Fetches `game_players` and `events` once on mount; no realtime subscription.
  - Aggregates rows in-memory per side/quarter; computes totals and exports.
- Player lists fetch: `game_players` table queried in Setup, Game, Summary, PlayerGame.
- Roster cache: prior games for same home team used as seed; saved squads from `squads` table; `localStorage` only stores trackBoth & selected quarter.
- Quarter state: purely local in Game (`q` + `seg`); not written to Supabase.
- Stats appending: events rows hold `game_id, team_side ('home'|'away'), quarter, timestamp_ms, player_number, stat_key, created_by`. Optimistic writes + realtime echo keep UI in sync.

## 4. Components Breakdown
- **PlayerTracker**: implemented by `Game.tsx` composition (header + two `TeamCol` columns). Manages selection, clock, quarter tabs, and stat logging handlers passed down.
- **PlayerTile**: the player buttons inside `TeamCol` (`grid` of squares showing number + last name). Props come from parent via `players`, `selected`, `onSelect`; emits selection changes to update `sel`.
- **EventButtonRow**: within `TeamCol` (and single-team sidebar) the grid of base stat tiles plus modifier column. Props: `onLog` (stat key), local `stage/baseStat` determine allowed modifiers; emits logs through parent handlers.
- **QuarterBar**: header quarter tabs in Game; uses `seg/q` state and `setSeg/setQ`, persists to `localStorage`. Also Start/Stop button controlling local clock.
- **ScoreSummaryCard**: header score blocks using `ScoreGlow` component; shows per-quarter breakdown (`fmtBreak`) and total points derived from events.
- **BottomActions**: header/hud buttons (Hub link, Summary link, Edit Players modal, Share toggle) plus undo buttons in `TeamCol` footer. Emit navigation, toggle `shareOn`, and call `undoById`.
- **Voice Input**: not implemented in the current flow; all input is tap/click based.

## 5. Game State Machine
- States (implicit via screens/flags):
  - `pregame`: after game row exists, before “Start Match”; managed in Setup.
  - `countdown/live`: entering Game; clock starts when user taps Start (no auto countdown).
  - Quarter transitions: quarter tab click updates `q/seg` (Q1→Q2→Q3→Q4) without persistence.
  - `paused`: `running=false` when clock stopped; stats can still be logged.
  - `finalised`: no explicit state; Summary accessible anytime; `games.status` remains `live` unless updated elsewhere.
- Edge cases:
  - Exiting early: browser back leaves data as-is; Setup “Cancel Game” deletes `games` + `game_players`.
  - Refresh: `seg` and `trackBoth` restored from `localStorage`; players/events reloaded from Supabase; selection resets unless single-team forces first home player.
  - App close: relies on Supabase persistence; unsaved roster edits in Setup lost unless “Start Match” clicked.

## 6. Stats Model
- Event shape (`events` table): `id`, `game_id`, `team_side`, `quarter`, `timestamp_ms`, `player_number`, `stat_key`, `created_by`.
- Stat keys (from `types.ts`): `K, HB, M, T, G, B, FF, FA, CL, I50, R50, K_EF, K_IF, HB_EF, HB_IF, MC, MUC, CON, UC, GBG, HO`.
- Derived values:
  - Disposals = K + HB (base counts; effectiveness variants tallied separately in Summary).
  - Score = Goals*6 + Behinds.
  - Marks contested/uncontested logged as `MC`/`MUC` when modifiers applied to base `M`.
  - Kick/Handball effectiveness logged as `K_EF/K_IF/HB_EF/HB_IF` when modifiers applied.
  - Ground ball get (`GBG`), contested/uncontested possessions (`CON/UC`), hitouts (`HO`) logged directly.
- Fantasy score (Summary/Hub): weighted sum with `AF_WEIGHTS` (K=3, H=2, M=3, T=4, G=6, B=1, FF=1, FA=-3, CL=3, I50=0, R50=0). Uses combined totals (effective/ineffective included).
- Benchmarks/averages: Hub computes season aggregates and leaderboards by summing events for home side; Summary compares home vs away per stat and per quarter (colorized tables).

## 7. Summary Screens
- Per-quarter summary: `segment` filter (Q1–Q4) in Summary filters events before aggregation. Scores recomputed per segment; tables show only that quarter.
- Full-game summary: `segment=0` aggregates all events. Team totals and player rows derive counts, disposals, AF.
- Totals/averages: player rows show raw counts; disposals derived. AF uses weights above. No per-minute normalisation; averages across games handled in Hub season view, not per-summary screen.

## 8. Persistence & Sync
- Realtime: Game subscribes to Supabase realtime channel on `events` for the current `game_id` to append new events as they arrive.
- Inserts/deletes: optimistic UI; rollback on Supabase error or missing auth session with user-facing warning (`authWarning`).
- React Query: not used; data managed via `useState`/`useEffect`.
- Multi-device sync: relies on realtime events subscription; rosters and game meta fetched fresh on mount so another device’s edits appear after reload; no conflict resolution beyond last write wins.
- Error handling: `alert` on creation errors; warnings when RLS blocks event inserts/deletes; console logging for fetch issues; Setup cancel guarded with busy flag.

## 9. Export / Sharing Flow
- Live share: Game “Share live” toggle reveals copy/open field pointing to `/summary/:gameId` (read-only viewer).
- Excel export: Summary builds sheets for home, away, and team totals using `xlsx`; filename `Stats Summary - <SEG>.xlsx`.
- PDF export: Summary uses `jspdf` + `jspdf-autotable` to render team totals and per-team player tables for TOTAL and each quarter; saved as `Stats Summary - <SEG>.pdf`.
- Email/share summary: no direct email integration; sharing is via copied summary URL or exported files.
- Stats formatting: export rows include base counts, effectiveness splits, disposals, marks contested/uncontested, GBG, HO, AF.

## 10. Areas to Improve
- Pain points: quarter clock is local-only (no persistence or sync); game status never flipped to “final”; single/dual-team mode stored in localStorage and can drift from DB; no guard against duplicate game creation; logo resolution heuristics are complex and repeated.
- Reliability: add React Query or SWR for caching + retry; persist clock/quarter to Supabase; transactionally upsert players when starting match; handle auth loss with re-login prompt instead of silent warnings.
- UX: add dedicated countdown/quarter end flow; provide true “End Game” action; surface undo history per team; clearer errors on offline inserts; implement voice input or keyboard shortcuts for rapid logging; add gestures on mobile (swipe to switch quarter, long-press to undo); streamline share by generating a read-only live viewer separate from summary exports.
