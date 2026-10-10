# P1 Games / Summary / Match Day Remediation

Date: 18 August 2026

## Scope

This stage implements only tracked-game summaries, exact team-game player summaries, manual-game summaries and Match Day. It does not change Team Selection, Notifications, tracker writes, leaderboard semantics, platform-admin authority, directory decisions, database policies or schemas.

The reachable mobile implementation, ordered migrations and Stage 0 canonical modules were used in that order. Mobile polling remains authoritative: 10 seconds for unfinished tracked summaries and 25 seconds for Match Day.

## Findings Addressed

- P1-02 — tracked summary core data parity.
- P1-03 — live summary freshness and lifecycle.
- P1-04 — active player-summary route.
- P1-06 — manual summary parity.
- P1-07 — Match Day eligibility and automatic refresh.

P1-05 is not part of this stage. Normal game summaries remain authenticated; no anonymous read policy or token contract was introduced.

## Tracked Summary

`getGameSummary` now loads game context, game-time player position, profile-position fallback, custom-stat definition identity, event clock metadata and the existing viewer-safe linked-game clock RPC. Event totals still use the Stage 0 canonical reconciler.

The player table adds position, Impact 7, mobile rating band and dynamically labelled custom counters. Advanced mode retains all supported canonical totals. Impact 7 and per-stat benchmark bands are computed in the pure domain layer with game date, grade and quarter-length context; React only renders the view model.

Home/away player-number lookup is side-qualified, preventing same-number collisions across teams. A legitimate 0–0 game remains distinguishable from a failed query.

## Live Refresh

Tracked and exact-player summaries:

- refresh immediately and every 10 seconds while unfinished and visible;
- refresh after browser focus or visibility resume;
- suppress overlapping requests;
- remove timers/listeners on unmount;
- stop polling once final/finished/complete/completed is observed;
- use the existing live-clock RPC where supported and event clock metadata otherwise.

No Realtime subscription was added.

## Manual Summary

Manual games remain a separate stored-total source. Post-linked summaries use `rpc_get_manual_game_summary_for_post`; unlinked owner/game-log records use `manual_player_game_totals` under existing RLS.

The adapter mirrors mobile `mapManualTotals`: nullable availability is retained, disposals/fantasy are derived once, explicit fantasy/rating overrides remain authoritative, and Impact 7/benchmarks use the canonical position registry including Ruck and Default fallback.

The page now renders subject identity, player number/position, subject club/team branding, opponent branding, date/round/venue, stored player score, all available supported totals and browser share. It does not fabricate a match result, opponent score, event timeline, heat map or quarter split. Existing web did not expose manual editing or deletion, so this stage does not add a mutation surface or broaden authority.

## Match Day

Eligibility now matches current mobile behavior:

- authenticated followed leagues only;
- at least one official game squad;
- either home or away side may establish the followed league;
- live status for the live collection;
- final/completed within seven days for recent games;
- counted events required for recent finals but not for a legitimate zero-event live game;
- `team_stats_game` always excluded.

Current reachable mobile Match Day has live and recent collections, not a scheduled/upcoming collection, so web does not invent one. Live games sort by latest counted-event time; recent finals sort by match date, both descending with deterministic ID tie-breaking. Cards preserve teams, logos, colours, score, quarter/clock detail and `/games/:id` destination.

The full snapshot refreshes every 25 seconds while visible and on focus/visibility resume, which also moves a newly final game from live to recent without a manual reload. Query failures render an explicit error rather than a false empty state.

## Navigation Changes

- Match Day → `/games/:id`.
- Profile/Game Log tracked rows → `/games/:id` (unchanged).
- Profile/Game Log manual rows → `/games/manual/:manualId` (unchanged and source-specific).
- Team summary player row → `/player/:gameId/:gamePlayerId`.

The player route no longer guesses from the signed-in user or a first matching jumper number.

## Files Changed

- `src/lib/canonical/games-parity-contract.ts`
- `src/lib/portal-games.ts`
- `src/lib/portal-game-summary.ts`
- `src/lib/portal-match-day.ts`
- `src/components/portal/game-summary/SummaryMatchComponents.tsx`
- `src/components/portal/games/GameLogCard.tsx`
- `src/routes/portal/GameSummaryPage.tsx`
- `src/routes/portal/PlayerGameSummaryPage.tsx`
- `src/routes/portal/ManualGameSummaryPage.tsx`
- `src/routes/portal/MatchDayPage.tsx`
- `src/main.tsx`
- `tests/games-parity-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_GAMES.md`

## Tests Added

Deterministic P1 fixtures cover:

- final and live tracked games;
- exact team-game player routes;
- Ruck performance and fallback behavior;
- custom stats and a zero-score game;
- Q1–Q4 and total aggregation;
- normal, low-stat, Ruck and optional-field manual games;
- owner-only manual mutation authority;
- eligible official live/recent games;
- Team Stats Game and non-followed-league exclusion;
- ordering, destinations and polling/finalisation contracts;
- production repository and route wiring.

## Validation

- Focused/full web tests: PASS, 33/33.
- Web typecheck: PASS.
- Web production build: PASS (Browserslist-age and large-chunk warnings remain baseline warnings).
- Web lint: no configured script.
- `git diff --check`: PASS.
- Database integration: not run; no local Docker/Supabase runtime is available in this workspace.

## Remaining Risks

- Hosted-data smoke testing is still required for the embedded custom-stat relation, live-clock RPC visibility and representative official home/away league combinations.
- The generated database types lag current migrations, as documented in Stage 0.
- Spatial/score visual refinement and export unification remain presentation/export work; they must continue consuming the canonical summary model.
- Browser share availability depends on the user agent and secure context; clipboard is the fallback.

## Recommended Next P1 Stage

Proceed separately to Team Selection persistence/posting (P1-09) only after the hosted-data games smoke test. Do not combine that work with Notifications or query-cache modernization.
