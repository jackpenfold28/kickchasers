# Stage 0 + P0 Remediation

Date: 18 August 2026

## Summary

Stage 0 and all five audited P0 code remediations are complete. The web app now consumes the existing official leaderboard view and atomic directory-decision RPC, uses the mobile event aggregation/Impact 7/benchmark rules, and derives platform-admin access from the current route plus the canonical server RPC.

No database migration, RLS change, stored-event rewrite, or mobile production change was made.

Result: **all five P0s are resolved in the web implementation**. P0-04 and P0-05 still require a staging/local Supabase role-and-transaction smoke test before production release because no database runtime was available in this workspace. That is a deployment verification gate, not a request for a new migration.

Updated estimated web/mobile parity: **58/100**, up from 46/100. The remaining gap is dominated by the already-audited P1–P3 work, which was intentionally not started.

## Files Changed

Production/configuration:

- `package.json`
- `tsconfig.json`
- `src/components/layout/PortalLayout.tsx`
- `src/lib/platform-admin.ts`
- `src/lib/portal-admin.ts`
- `src/lib/portal-game-summary.ts`
- `src/lib/portal-games.ts`
- `src/lib/portal-profile.ts`
- `src/lib/portal-stats.ts`
- `src/routes/portal/ProfilePage.tsx`
- `src/routes/portal/admin/AdminRequestDetailPage.tsx`
- `src/routes/portal/admin/AdminRequestsPage.tsx`
- `src/lib/canonical/admin-contracts.ts`
- `src/lib/canonical/benchmarks.ts`
- `src/lib/canonical/leaderboard-contract.ts`
- `src/lib/canonical/player-event-aggregate.ts`
- `src/lib/canonical/position-benchmark.ts`
- `src/lib/canonical/stats-eval.ts`

Tests/documentation:

- `tests/admin-contracts.test.ts`
- `tests/impact7-contracts.test.ts`
- `tests/stat-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_STAGE_0_P0.md`

Pre-existing `.DS_Store`, copied mobile documentation, and card-asset worktree changes were not touched. Generated Vite bundles were removed after validation.

## Canonical Contracts Established

### Database-owned

- Official leaderboard events: `v_official_counted_events_for_squad`.
- Team Stats Game exclusion: both the view and web game query exclude `tracker_mode = 'team_stats_game'`.
- Official tracker authority, accepted request state, positive player number, official squad and side identity: enforced by the existing view definition in `20260531123000_team_stats_game_reuse_first_adjustments.sql`.
- Platform-admin identity: `f_is_platform_admin()`.
- Atomic league/club decisions: `rpc_decide_official_directory_request` from `20260413030000_rpc_decide_official_directory_request.sql`.
- Existing RLS/security-definer checks remain the enforcement boundary; the React guard is only an affordance/access gate.

### Pure domain logic

- Event reconciliation and fantasy: canonical snapshot of mobile `lib/player-event-aggregate.ts`.
- Benchmark thresholds/cohort/quarter scaling: canonical snapshot of mobile `constants/benchmarks.ts`.
- Impact 7, milestone and lower-is-better evaluation: canonical snapshot of mobile `lib/stats-eval.ts`; only the native debug logger branch was removed.
- Position resolution: canonical `FWD`/`MID`/`RUC`/`DEF` and supported legacy labels mapped to Forward/Mid/Ruck/Defender/Default.

The repositories are not currently a shared workspace/package, so Stage 0 places these pure modules behind `src/lib/canonical`. Characterization fixtures protect exact mobile outputs. A later hardening task should publish/mount this directory as one versioned shared package rather than maintaining two physical copies; performing that mobile refactor in this stage would have exceeded the regression boundary.

### Platform-specific adapters

- Supabase pagination/query composition remains web-specific.
- React Router path detection and focus/navigation rechecks remain web-specific.
- Profile rendering and web labels remain web-specific while consuming canonical results.

## P0-1

**Finding:** P0-01 — Global leaderboard did not use the official mobile authority.

**Before**

- `src/lib/portal-stats.ts` queried broad `v_counted_events`.
- Team Stats Games were not excluded.
- Results were limited by default Supabase row caps.
- A side-qualified official event could be duplicated by the view join unless deduplicated.
- Missing `profile_user_id` was not reconciled from the game-player snapshot.
- `seasonYear` was dropped by the global leaderboard adapter.

**Fix**

- Query `v_official_counted_events_for_squad`.
- Explicitly exclude `team_stats_game` while selecting games.
- Page games/events in stable order and chunk game IDs.
- Deduplicate global events by event ID, matching mobile.
- Reconcile linked player identity by `(game_id, team_side, player_number)` from `game_players`.
- Pass the selected season year into date bounds.
- Keep manual games outside the tracked official-event path.
- Add current mobile leaderboard stat keys for ground-ball gets, contested/uncontested possessions and contested marks.

**Reproducible comparison**

Fixture: Player A has 27 official player disposals, plus 3 rows in a `team_stats_game`.

- Mobile: 27 disposals.
- Web before: 30 disposals from the broad counted-event population.
- Web after: 27 disposals from the official side-qualified view.
- Expected: PASS.

**Validation:** query contract source check, Team Stats Game/dedup/manual fixtures, typecheck and production build pass. A hosted-data comparison remains required before release.

**Status:** **RESOLVED in code; staging data smoke test pending.**

## P0-2

**Finding:** P0-02 — Modifier events could be double-counted as base stats.

**Before**

- `K_EF`/`K_IF` incremented kicks and `HB_EF`/`HB_IF` incremented handballs in leaderboard and summary-specific maps.
- `MC`/`MUC` incremented marks.
- Advanced summary then added modifier counts to base counts again for fantasy.
- Web fantasy included clearances but omitted hitouts, unlike the mobile canonical formula.

**Fix**

- Leaderboard, basic summary, advanced summary and tracked profile aggregation now call the same mobile `buildTotalsFromEvents`/`aggregatePlayerEvents` rules.
- Base `K`, `HB`, `M` remain independently countable.
- `K_EF`, `K_IF`, `HB_EF`, `HB_IF`, `MC`, `MUC`, `CON`, and `UC` remain available as modifier/derived categories without becoming duplicate bases.
- Legacy modifier-only rows retain the mobile fallback of one base attempt.
- Fantasy now includes hitouts and uses the exact mobile weights.
- Counted events are loaded in stable creation/id order before sequential reconciliation.

**Reproducible comparison**

Fixture: two kicks (one effective, one ineffective), two handballs (one effective, one ineffective), two marks (one contested, one uncontested).

- Mobile: K 2, HB 2, D 4, M 2.
- Web before: K 4, HB 4, D 8, M 4 on affected paths.
- Web after: K 2, HB 2, D 4, M 2.
- Expected: PASS.

**Validation:** basic, sequence, modifier-only and multi-quarter fixtures pass; web summary/leaderboard legacy mappings were removed; typecheck/build pass.

**Status:** **RESOLVED.**

## P0-3

**Finding:** P0-03 — Web rating/benchmark semantics differed from mobile Impact 7.

**Before**

- `gameRatingScore` used a web-only linear formula.
- `benchmarkBand` used generic thresholds and treated every unrecognized stat as `[3,6,10]`.
- Position, Ruck, benchmark context, lower-is-better metrics and current mobile milestone calibration were absent.

**Fix**

- Profile ratings use canonical `computeGameRatingImpact7`.
- Manual rating remains an authoritative override, matching mobile.
- Game season, quarter length and grade are supplied as benchmark context.
- Profile position is resolved through Forward/Mid/Ruck/Defender/Default.
- Benchmark dots use the current 2025 mobile thresholds, cohort/quarter scaling and lower-is-better logic.
- Unsupported benchmark fields return no band instead of a fabricated generic band.
- UI label changed from “Best Game Rating” to “Best Impact 7”.

**Reproducible comparison**

Fixture: Forward, 12 disposals, 6 marks, 3 tackles, 3 goals, 3 behinds, 85 fantasy, 1 free against.

- Mobile: Impact 7 = 9.3.
- Web before: ad-hoc rating = 7.9.
- Web after: Impact 7 = 9.3.
- Expected: PASS.

Additional exact characterizations cover Forward low/strong/elite, Mid average/strong, Defender, Ruck hitout/complete, Default fallback, Ruck thresholds and lower-is-better frees against.

**Status:** **RESOLVED.**

## P0-4

**Finding:** P0-04 — Platform-admin route gating could be stale during SPA navigation.

**Before**

- `isAdminRoute` was a module-scope value read from global `location.pathname`.
- Loading `/dashboard` then navigating to `/admin` could retain the non-admin-route value.
- Admin status fell back to a direct `platform_admins` select rather than using one canonical check.

**Fix**

- Route classification derives from React Router’s current `location.pathname` on every render.
- Admin status is fetched only through `f_is_platform_admin()`.
- Access is fail-closed on RPC/session errors.
- The role is rechecked on route changes and browser focus, covering direct URLs, navigation and revocation after focus.
- Admin pages remain protected by existing RLS/security-definer functions; no client value is treated as the security boundary.

**Reproducible comparison**

Fixture: normal authenticated user loads `/dashboard`, then directly navigates to `/admin/requests`.

- Before: the module-captured route flag could remain false and skip the layout redirect; backend calls still depended on RLS.
- After: the current path is classified as admin, `f_is_platform_admin()` is rechecked, and the user is redirected before the outlet renders.
- Platform admin fixture remains allowed; unauthenticated, normal, squad-admin and club-admin fixtures are denied.
- Expected: PASS.

**Validation:** route/role fixtures pass; migration inspection confirms admin table policies/RPCs call `f_is_platform_admin()`. No local Supabase runtime was available for a live revoked-role/direct-mutation test.

**Status:** **RESOLVED in code; staging role/RLS smoke test pending.**

## P0-5

**Finding:** P0-05 — Web directory decisions recreated an atomic backend workflow.

**Before**

- League approval inserted a league and updated the request in separate client calls.
- Club approval updated the request and depended on disconnected browser/backend side effects.
- Decline directly patched status even where the canonical decision RPC applied.
- A network interruption could leave partial state.

**Fix**

- `add_league` and `add_club` approve/decline actions call `rpc_decide_official_directory_request` with `_request_id`, `_decision`, and `_admin_notes`.
- Both admin request list and detail pages use the same decision adapter.
- `add_grade`/`add_squad` retain their existing path because the current canonical RPC supports only league and club requests; broadening the RPC would require a separately approved backend change.
- The existing RPC owns row locking, pending-state check, platform-admin authorization, duplicate handling, entity resolution/creation and final request update in one transaction.

**Reproducible comparison**

Fixture: approve a pending `add_league` request while the connection fails after the first browser call.

- Before: league insert could commit while the request remained pending.
- After: web sends one atomic RPC; PostgreSQL commits the entity and decision together or rolls both back.
- Duplicate/stale request: RPC rejects because status is no longer pending.
- Unauthorized caller: RPC rejects through `f_is_platform_admin()`.
- Expected: PASS by contract.

**Validation:** decision-kind/argument fixtures and production build pass; migration implementation was traced for approve, decline, row lock, duplicate/stale state and authorization. Live database interruption/rollback testing remains pending because Docker/Supabase runtime is unavailable (`docker` is not installed).

**Status:** **RESOLVED in code; staging transaction smoke test pending.**

## Golden Fixtures

`tests/stat-contracts.test.ts` covers:

- Basic K/HB/D/M/T/G/B, points and fantasy.
- K/HB effective and ineffective modifier sequences.
- Contested/uncontested possession and mark modifiers.
- Modifier-only legacy fallback.
- Total and quarter 1/2/4 aggregation.
- Team Stats Game exclusion contract.
- Official view event deduplication.
- Manual totals remaining outside the tracked event contract.

`tests/impact7-contracts.test.ts` covers:

- Forward low, strong and elite output.
- Mid average and strong output.
- Defender output.
- Ruck hitout-heavy and complete output.
- Default/unknown position fallback.
- Ruck threshold selection.
- Lower-is-better benchmark behaviour.

`tests/admin-contracts.test.ts` covers:

- Current-route detection for `/admin*` and `/leagues/:id`.
- Unauthenticated, normal user, squad admin, club admin and platform admin access fixtures.
- Atomic decision-kind selection and exact RPC arguments.

Total: **21 focused tests, all passing**.

## Validation Results

### Web

- `npm test`: **PASS — 21/21**.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**.
- `git diff --check`: **PASS**.
- Lint: **not available**; the web package has no ESLint configuration/script. Typecheck remains separate from the production build through the new `typecheck` script.
- Build warnings remain baseline-only: Browserslist data is stale and the main chunk is approximately 1.65 MB.

### Mobile/shared source

- Mobile production files were not edited.
- Web canonical aggregation/benchmark modules were copied from the current mobile implementations, with only source-path/provenance comments and the native-only Impact 7 debug logger branch changed.
- Exact current mobile characterization values pass in the web suite.
- Direct mobile focused test invocation is **environment-blocked**: Node cannot resolve the mobile `@/` alias without its missing test runner integration.
- `npm run lint -- --no-cache` remains **environment-blocked** by `EPERM` on the read-only `.expo/cache/eslint` file.
- `npm run typecheck` remains **FAIL on the documented pre-existing mobile baseline** across unrelated Friends, Teams, Settings, Profile, navigation, feed/card, test import and Deno function files. No web change imports into or modifies the mobile repository, so no new mobile error was introduced.

### Backend

- No Docker executable/local Supabase runtime is available, so live role/RPC integration tests could not be run safely.
- Ordered migration inspection confirms the official leaderboard view, platform-admin function/RLS and atomic directory-decision RPC exist with the required guards.

## Remaining Risks

1. Run a staging/local database matrix before production release: normal/squad/club/platform admin reads and mutations on every admin page.
2. Exercise `rpc_decide_official_directory_request` approve, decline, duplicate, stale row, unauthorized caller and simulated interruption; read back resolved IDs and related entities.
3. Compare at least one sanitized production-like official leaderboard dataset between mobile and web, including a two-official-squad game and a Team Stats Game.
4. The canonical pure modules physically exist in two repositories. Characterization tests limit drift, but a versioned shared package should eventually become the single physical source.
5. Mobile’s broad existing typecheck baseline reduces whole-app regression signal. It should be handled separately, not folded into P1 parity work.

No remaining risk requires a database migration. The first three are release verification gates.

## Recommended Next Stage

It is safe to begin **Stage 2 / P1 remediation in development** after reviewing this change set. Do not deploy the admin/leaderboard P0 changes to production until the staging database checks in Remaining Risks 1–3 pass.

The next implementation should stay dependency-aware and begin with the highest-value existing-page P1 tasks that now rely on these contracts: tracked summary completion, manual summary, team-selection persistence/posting, Match Day eligibility/live refresh, and broken active route targets. Do not combine those into one risky change.
