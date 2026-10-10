# P1 Coaches / Team Stats Games

## Scope

This stage resolves only the Coaches / Team Stats Games portion of P1-11 using the deployed backend. It adds an authorised, read-only web list and connects it to the existing canonical team summary. Best & Fairest, Team Selection, Player Card creation, tracker setup and unrelated team management are outside scope.

## Original P1-11 Gap

Mobile had a dedicated Coaches screen for a squad's playerless Team Stats Games. Web had the team hub and canonical game summary, but no Coaches entry, no exact Team Stats list, and no role-gated path from a team to those summaries.

## Mobile Baseline

The reachable mobile `/teams/[id]/coaches` screen reads Team Stats Games linked to the exact squad, includes scheduled/live/final rows, and opens the Team Stats Game summary with the game ID. Its current screen is consumption-only: it does not expose create, resume, archive or delete controls. Refresh is user initiated. Web additionally performs conservative live-only polling so live score changes appear without a browser reload, as required by the parity brief and consistent with the existing canonical summary lifecycle.

## Existing Backend Contracts

- `games` supplies game identity, opponent, date, venue, round, status, lock state, tracker mode and active quarter.
- `game_squads` supplies exact squad eligibility and home/away side context.
- `v_counted_events` supplies counted goal, behind and rushed-behind score events.
- `squad_members`, `club_roles`, squad ownership and `platform_admins` supply server-backed authority.
- `rpc_get_live_game_clock_state` and the existing canonical game-summary repository continue to supply detailed summary clock/events/custom-stat context.

The current general authenticated read policies are broader than product eligibility. The web repository therefore checks server-backed authority first and applies exact squad plus tracker-mode filters as defense in depth. This stage does not claim that row readability alone makes a game eligible.

## Permission Model

| Viewer | Custom squad | Official squad |
|---|---:|---:|
| Squad owner | Allowed | Allowed |
| Accepted squad admin | Allowed | Not by squad role alone |
| Custom squad coach | Denied | n/a |
| Tracker | Denied | Denied |
| Ordinary member | Denied | Denied |
| Guest / unrelated user | Denied | Denied |
| Club admin | n/a | Allowed |
| Club coach | n/a | Allowed |
| Platform admin | Allowed | Allowed |

Profile role preferences are never used as authority.

## Coaches Area

`SquadDetailPage` now includes a Coaches tab and hero action only when the canonical permission helper allows it. The panel has distinct loading, request-error/retry, unauthorised and neutral empty states. Game cards are keyboard-focusable and use the existing responsive match-card visual system.

## Team Stats Game Eligibility

Rows must have a valid ID, `tracker_mode = team_stats_game`, and a `game_squads` link whose `squad_id` exactly matches the current team. Normal `team_game` rows and rows from other squads are excluded. Scheduled, live and final/locked rows match the reachable mobile list. There is no deployed archived/deleted Team Stats field used by mobile, so no unverified lifecycle filter was invented.

## Live / Final Behaviour

Status normalization reuses canonical live/final helpers. `is_locked` is final. `active_quarter` remains the canonical list quarter. Counted score events produce goals/behinds/points; opponent-side rushed behinds count toward the home behind total, matching the existing canonical summary. The list refreshes on browser focus/visibility and polls every 10 seconds only while visible and containing a live game. Final-only, scheduled-only, hidden and empty lists do not poll.

## Summary Navigation

Every card routes to `/games/:id`; no player-summary route is used. `GameSummaryPage` reads `tracker_mode`, defaults Team Stats Games to the Team view, and removes the Players selector for this deliberately playerless mode. Home/away totals, quarters, live clock, score and supported custom stats remain owned by the existing canonical summary implementation.

## Creation / Tracking Capability Status

Web has no supported Team Stats Game setup or tracker route. Creation, Start, Resume, archive and delete actions are therefore intentionally omitted. Mobile's existing creation/tracking code was not copied into this stage. Adding controls without a valid web route would be misleading.

## Match Day Boundary

Team Stats Games remain excluded from Match Day, player history, general squad Activity and leaderboards. This keeps the coach/admin-oriented, playerless product separate from public/normal player-attributed game discovery.

## Notification Integration

`official_game_live_started` with `tracker_mode = team_stats_game` now treats `/games/:id` as a supported canonical destination. The route target is unchanged; only its former “no coach surface” fallback classification was removed.

## Files Changed

- `src/lib/canonical/team-stats-games.ts`
- `src/lib/team-stats-games.ts`
- `src/hooks/useTeamStatsGames.ts`
- `src/components/squads/TeamStatsGamesPanel.tsx`
- `src/routes/portal/SquadDetailPage.tsx`
- `src/lib/portal-games.ts`
- `src/routes/portal/GameSummaryPage.tsx`
- `src/components/portal/game-summary/SummaryMatchComponents.tsx`
- `src/lib/portal-notification-routing.ts`
- `tests/coaches-team-stats-contracts.test.ts`
- parity documentation

## Tests

Fifty focused tests cover the full role matrix; exact squad/mode eligibility; scheduled/live/final normalization; identity, side, quarter and score mapping; canonical navigation; live/final/focus refresh; distinct states; absence of unsupported actions; notification compatibility; and Match Day/player-history/leaderboard/player-group regressions.

## Validation

Required validation is the focused test file, full web suite, typecheck, production build and `git diff --check`. Existing Browserslist/chunk warnings remain non-blocking.

## Remaining Limitations

- Team Stats Game creation and tracking remain mobile-only because web has no existing supported tracker route.
- No archive/delete action is exposed because the reachable mobile Coaches list and current web contracts provide no canonical action for this surface.
- Broad authenticated backend readability remains a backend property; the web applies product eligibility before loading list rows but does not replace RLS.

## Remaining P1-11 Work

Best & Fairest / voting is the only unresolved P1-11 sub-slice.

## Recommended Next Stage

Audit and, if current deployed contracts are sufficient, implement Best & Fairest / voting as a separate final active P1 stage. P1-09 Team Selection and P1-15 admin Player Card/manual authoring remain deferred under product constraints.
