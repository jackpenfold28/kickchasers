# P1 Canonical Leaderboard Filters

## Scope

This stage resolves only P1-01 on the existing `/stats` route: selectable stat vocabulary, labels and keys; weekly/current-season ranges; represented-player state, league, club and age filters; dependent resets; ranking/ties; and distinct loading, empty and error behavior. It does not change Dashboard product direction, team management, profiles, admin feed authoring or any other remaining P1 finding.

The Stage 0/P0 official-counted-event authority is retained unchanged. No schema, view, RPC, RLS or migration work was performed.

## Original P1-01 Gap

The web All Leaders selector omitted Ground Ball Gets, Contested Possessions, Uncontested Possessions and Contested Marks; included Fantasy where mobile exposes it only in Featured; and used longer non-mobile labels. Web ranking also applied featured outlier caps to every category and added disposal/name tie-breakers absent from mobile. Featured cards aggregated a player's whole week rather than ranking player-game performances.

Directory options were loaded from the whole directory instead of the players represented by the current leaderboard stat/range. Although state and league click handlers cleared children, unavailable combinations and age bands could remain visible. Season bounds lived inside the repository rather than a testable canonical contract.

## Mobile Baseline

Reachable mobile global leaderboards provide:

- Featured weekly player-game cards for Disposals, Fantasy and Goals, with the existing outlier caps.
- All Leaders player totals for a rolling seven-day range or the current calendar season.
- Twenty-one selectable tracked stats; Fantasy is not in the All Leaders selector.
- State, league, club and age filtering derived from linked leaderboard players.
- Age groups `Any`, `U10`, `U12`, `U14`, `U16`, `U18`, `18+`, `30+`.
- Positive-value descending ranking; ties retain stable source order and receive ordinal row numbers.
- No global position filter and no historical-season selector.

## Supported Stat Vocabulary

The canonical metadata registry is `src/lib/canonical/leaderboard-filters.ts`. All selectable values are internal keys; UI labels never become query/event keys.

| Canonical key | Mobile label | Unit | Source |
|---|---|---|---|
| `disposals` | Disposals | count | canonical reconciled total |
| `kicks` | Kicks | count | canonical reconciled total |
| `handballs` | Handballs | count | canonical reconciled total |
| `marks` | Marks | count | canonical reconciled total |
| `tackles` | Tackles | count | canonical reconciled total |
| `goals` | Goals | count | canonical reconciled total |
| `behinds` | Behinds | count | canonical reconciled total |
| `goal_assists` | Goal assists | count | canonical reconciled total |
| `turnovers` | Turnovers | count | canonical reconciled total |
| `intercepts` | Intercepts | count | canonical reconciled total |
| `one_percenters` | 1%ers | count | canonical reconciled total |
| `ground_ball_gets` | GBGs | count | canonical reconciled total |
| `contested_possessions` | Contested | count | canonical reconciled total |
| `uncontested_possessions` | Uncontested | count | canonical reconciled total |
| `clearances` | Clearances | count | canonical reconciled total |
| `inside_50s` | Inside 50s | count | canonical reconciled total |
| `rebound_50s` | Rebound 50s | count | canonical reconciled total |
| `contested_marks` | Cont. marks | count | canonical reconciled total |
| `hitouts` | Hitouts | count | canonical reconciled total |
| `frees_for` | Frees for | count | canonical reconciled total |
| `frees_against` | Frees against | count | canonical reconciled total |

`fantasy_points` remains canonical and derived through the shared AFL Fantasy/event aggregation logic, but its registry availability is Featured-only. `goals_behinds` and `disposal_efficiency_pct` exist in the broader benchmark stat type but are not exposed because current mobile global leaderboards do not select them.

Every leaderboard category sorts descending, including Turnovers and Frees Against, matching current mobile leaderboard behavior. Their lower-is-better benchmark meaning is separate from leaderboard ordering and was not changed.

## Season Behaviour

`This week` is a rolling seven-day window ending at request time. `Season` defaults to January 1 of the browser's current calendar year and ends at the final millisecond before the next local calendar year. This matches the effective current-season mobile population while making the repository boundary explicit and deterministic.

The `/stats` page does not add a historical selector because mobile does not provide one. Existing repository consumers such as Dashboard may pass an explicit season year; it is now normalized and bounded to that year. Invalid years safely fall back to the current year.

## State / League / Club Filters

All Leaders first loads the complete official linked-player population for the selected stat range, matching mobile, and then applies UI filters to canonical profile metadata:

- State uses normalized directory codes.
- League options are limited to represented players in the selected state.
- Club options are limited to represented players in the selected state and league.
- Changing State clears League and Club.
- Changing League clears Club.
- A stat/range change reconciles selections against newly available IDs and clears invalid values.
- Club and league labels come from official directory tables; custom squad labels are not promoted into directory filter IDs.

Featured queries receive the same selected filters but retain their player-game aggregation.

## Age / Position Filters

Age uses the current `profiles_directory.age_years` value, matching mobile. Lower bounds are inclusive and upper bounds exclusive: U10 is below 10, U12 is 10–11, U14 is 12–13, U16 is 14–15, U18 is 16–17, `18+` begins at 18 and `30+` begins at 30. Missing, negative or non-finite ages are excluded from a selected band and remain eligible for `Any`.

Available age chips are derived from players with a positive value for the selected stat/range. Current mobile global leaderboards do not expose a position filter, so this stage deliberately does not add one or duplicate the canonical position registry.

## Ranking / Tie Behaviour

Only finite positive values appear. Zero, null, missing, NaN and infinite values are excluded. Rows sort by value descending. Equal values preserve their source order and receive ordinal row ranks (`1`, `2`, `3`), exactly as mobile's stable sort plus row index does; web-only disposal/name tie-breakers were removed.

Featured cards apply mobile's Disposals, Goals and Fantasy caps and rank individual player-game performances. All Leaders and existing season leaderboard consumers do not apply those featured caps.

## Canonical Modules Used

- `src/lib/canonical/leaderboard-filters.ts` — supported metadata, labels, age/range rules, filter normalization/dependencies and ranking.
- `src/lib/canonical/player-event-aggregate.ts` — base/modifier reconciliation, derived totals and Fantasy.
- `src/lib/canonical/leaderboard-contract.ts` — official event deduplication.
- `src/lib/portal-stats.ts` — web Supabase adapter over `v_official_counted_events_for_squad`.

No URL/search-param filter state existed on `/stats`; this stage retains component-state persistence across Featured/All tabs and validates every value internally rather than introducing a new URL scheme.

## Files Changed

- `src/lib/canonical/leaderboard-filters.ts`
- `src/lib/portal-stats.ts`
- `src/routes/portal/StatsPage.tsx`
- `tests/leaderboard-filter-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_LEADERBOARD_FILTERS.md`

## Tests

Thirty-two focused tests cover canonical keys and labels, derived totals, Featured-only Fantasy, ordering metadata, weekly/current/historical/invalid season inputs, geography scoping and reset behavior, exact age bands and boundaries, stable ties, zero/null handling, per-game Featured behavior, filter application, distinct page states and all four required P0 regression boundaries.

The complete web suite contains 149 passing tests.

## Validation

- Focused leaderboard contracts: 32/32 passed.
- Full web suite: 149/149 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with only the existing Browserslist-age and large-chunk advisories.
- `git diff --check`: passed.
- Lint: not run because no lint script is configured.

## Remaining Limitations

- Authenticated hosted-data smoke testing remains required for representative state/league/club combinations and a player with missing `age_years`.
- `profiles_directory.age_years` is the deployed/current age authority; age bands therefore move as that value changes rather than being frozen to a past season date.
- `/stats` intentionally supports current Season only because that is the current mobile global UI. The bounded historical repository input serves existing non-Stats consumers but is not a new selector.
- There is intentionally no position filter until mobile exposes one.
- The UI retains ordinal ranks for ties rather than competition ranks because that is current mobile behavior.

## Recommended Next Stage

Proceed with the first bounded P1-11 team-hub slice: player groups/sides management only. It is a core existing-team workflow with current mobile/backend contracts and can be implemented without a migration. Do not combine it with Coaches/Team Stats Games or Best & Fairest management.

Remaining unresolved P1 findings are P1-08, P1-11, P1-13 and P1-15. P1-09 remains **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited.
