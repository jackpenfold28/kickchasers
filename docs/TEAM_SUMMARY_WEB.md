# Team Summary – Web App

## 1. Purpose & High-Level Overview
- Shows season-level team performance for the signed-in user’s club: per-game averages, win/loss splits, and top player leaders across stats.
- Typical journey: user lands on `/hub`, switches to the “Team Averages” tab for season aggregates or “Player Leaders” for per-player leaders; they expect current season stats derived from all games where their team is the home side.

## 2. Route & Navigation Flow
- Route: `/hub` with tab control via query param `tab=games|team|players`.
- teamId source: derived from the signed-in user’s owned team (`teams.owner_user_id = user.id`), not from the URL.
- Navigation: buttons in the sticky mini-nav switch tabs (and push `/hub?tab=<key>`); “New Game” CTA goes to `/new`; “Stats Summary” per game goes to `/summary/:gameId`; “Open” goes to `/game/:gameId`.
- Filters/toggles: “Team Averages” tab has a wins/losses/all toggle for averages; “Player Leaders” shows a fixed set of stat categories; no date/competition filters.

## 3. Data Sources & Queries
- Supabase tables:
  - `profiles` (user profile: `name, team_logo_path, team_logo_url`).
  - `teams` (owned team lookup by `owner_user_id`).
  - `games` (list games where `home_team_id = team.id`, sorted by date desc; fields `id, opponent, date, venue, status`).
  - `events` (all stat events for the fetched games; fields `game_id, team_side, stat_key, player_number`).
  - `game_players` (maps player numbers to names per game; filtered to `team_side='home'` for labeling leaders).
- Query flow (inside `useEffect` on mount in `Hub.tsx`):
  1) `supabase.auth.getUser()` to identify user.
  2) `profiles` fetch for display name/logo; convert storage path to public URL via `supabase.storage.from('team-logos').getPublicUrl`.
  3) `teams` fetch (`owner_user_id = user.id`) to get `team.id/name`.
  4) `games` fetch (`home_team_id = team.id`) to power “Previous Games” list and to gather IDs.
  5) `events` fetch for those `game_id` IDs (all sides) to compute team totals, win/loss splits, and leaders.
  6) `game_players` fetch for those IDs (home side only) to map `player_number` → name when building leaderboards.
- Filters: only the wins/losses/all toggle affects aggregation. No season/grade/date filters are present.

## 4. Core Stats Model (Team Perspective)
- Base stats: `K, HB, M, T, G, B, FF, FA, CL, I50, R50, CON, UC, GBG, MUC, MC, KEF, KIF, HEF, HIF`.
- Derived:
  - Disposals `D = K + HB`.
  - AFL Fantasy `AF = Σ(stat * weight)` with weights `{K:3, HB:2, M:3, T:4, G:6, B:1, FF:1, FA:-3, CL:3, I50:0, R50:0}`.
- Team totals: sum of all home-side events across fetched games.
- Per-game averages: totals ÷ games played (or wins/losses count when filtered).
- Win/loss splits: each game bucketed by score (G*6 + B) comparison; stats aggregated separately for wins and losses.

## 5. UI Layout & Sections
- Header: user greeting, club logo (from profile/teams storage), quick actions (Profile, Load Squad, New Game, Logout).
- Sticky mini-nav: tab buttons for Games / Team Averages / Player Leaders; label reflects active tab.
- Highlight cards (Games tab only): disposals per game, inside 50s per game, leaders for disposals/tackles.
- Team Averages section:
  - Controls: wins/losses/all toggle; record pill (W–L–D).
  - Grid of primary averages (D, K, HB, M, T, G, B, I50, R50, CL, FF, FA, AF) with gradient backgrounds and win/loss comparison arrows vs the opposite bucket.
  - Advanced grid: contested/uncontested, GBG, mark variants, kick/handball effectiveness splits.
- Player Leaders section:
  - Cards per stat category showing top 3 (from sorted leaders list), icons from `STAT_META`, gradients from `STAT_GRADIENTS`.
- Previous Games section (Games tab): list with date/opponent/venue/status chips and actions to open game, open stats summary, or delete.
- Components are inline in `Hub.tsx`; no separate named subcomponents for these sections.

## 6. Component Breakdown
- `Hub` (src/routes/Hub.tsx)
  - Props: none (route component).
  - State: activeTab, games, loading, profile, team, logoUrl, seasonStats (+win/loss variants), record, avgFilter, leadersByStat, etc.
  - Outputs: navigations (Profile, Squad, New Game, Game, Summary), delete handler.
  - Performance: aggregation work done once on mount; per-game averages memoized (`useMemo`) for filter changes; no React Query/SWR caching.
- Inline UI blocks:
  - Tab buttons (sticky nav): set `activeTab` and push query param.
  - Team Averages grid: uses `perGame` (and `perGameWins/perGameLosses`) memo outputs.
  - Player Leaders cards: consume `leadersByStat`.
  - Games list: maps `games` array; delete uses Supabase delete.

## 7. Calculation & Aggregation Logic
- Raw events fetched for all games; processed synchronously in `useEffect`.
- Per-game tallies for home side stored in `perGameHomeCounts`; score tallies (`homeScore`, `awayScore`) used to classify wins/losses.
- Totals:
  - Overall `acc` sums home-side stats across all games.
  - Win/Loss totals accumulate from per-game tallies based on score outcome.
  - Derived `D` and `AF` added to all total buckets via `addDerived`.
- Leaders:
  - For each event on `team_side='home'`, increment maps per stat key; disposals leaders tracked separately as `K+HB`.
  - Names resolved via `game_players` map; fallback `#<player_number>`.
  - Top lists built by sorting descending and slicing top 5.
- Per-game averages:
  - `perGame` selects totals based on `avgFilter` (`all` uses `seasonStats`, `wins` uses `seasonStatsWin`, `losses` uses `seasonStatsLoss`).
  - Divides by count of games in that bucket (guarded with `Math.max(1, n)` to avoid divide-by-zero).
- Comparison arrows: in Team Averages cards, when filtered to wins/losses, compares current bucket value to the opposite bucket baseline.

## 8. State Management & Loading/Error Handling
- State: React `useState` + `useMemo` only; no React Query/SWR.
- Loading: boolean `loading` shows “Loading…” text in Games list; other tabs render immediately once state is set.
- Errors: no explicit UI; fetch/delete failures would only surface in console (no try/catch on main data load beyond auth guard).
- Empty states: Games list shows “No games yet.”; Player Leaders cards show “No data yet.” when no leader; Team Averages still render with zeros.

## 9. Constraints, Assumptions & Edge Cases
- Assumes the signed-in user owns exactly one team (selects first match).
- Only counts events where the team is the **home** side; away-side stats not included in team averages/leaders.
- Win/loss classification relies on goals/behinds events existing for both sides; missing scoring events may mislabel outcomes or create draws.
- Large game counts: aggregation is in-memory and synchronous; may grow slower with many events but no pagination is implemented.
- No season/competition filter: all games for the team are treated as one season.

## 10. Notes for Mobile Rebuild
- Replicate the same data inputs: games where `home_team_id = user-owned team.id`; events for those games; game_players for name resolution.
- Preserve aggregation logic:
  - Home-side only counts.
  - D = K + HB; AF weighted sum; win/loss bucketing via score (G*6 + B).
  - Per-game averages with wins/losses/all buckets; arrow comparisons vs opposite bucket.
  - Leaders: top 5 per stat, names via `game_players`.
- Navigation assumptions: tab-like separation (Games / Team averages / Player leaders) and links to Game/Summary; no teamId in route—derive from signed-in user.
- Essential UI pieces to carry over: per-game averages grid (primary + advanced), wins/losses toggle, record pill, leaders cards, previous games list with actions.
- Nice-to-have: gradients/icons styling, comparison arrows, mini highlight cards; can simplify visuals on mobile while keeping the same numbers/filters.
