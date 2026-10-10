# P1 Canonical Position Inputs

## Scope

This stage resolves only P1-10 and P1-12: canonical position values in the active squad roster editor and complete Ruck support in onboarding/profile editing. It does not change game snapshots, historical records, Impact 7 formulas, stat counting, Team Selection, database schema, RLS, RPCs, or any other P1 finding.

## P1-10 Original Gap

The active squad-detail roster modal displayed `Forward`, `Midfield`, `Defence`, `Ruck`, `Utility`, and `Bench`, then passed the label directly to `squad_members.position`. The current backend constraint accepts only nullable `FWD`, `MID`, `RUC`, or `DEF`, so even valid-looking labels could fail and the unsupported options had no canonical stored meaning.

## P1-12 Original Gap

Web onboarding and the same route's profile-edit mode exposed only `DEF`, `MID`, and `FWD`. A profile already storing `RUC` was cast into the narrower type rather than validated, displayed as a raw code, and could not be reselected reliably.

## Current Mobile/Backend Position Domain

Current reachable mobile code in `constants/positions.ts` and the deployed constraint migration agree on four nullable stored values:

- `FWD` — Forward
- `MID` — Midfield
- `RUC` — Ruck
- `DEF` — Defender

The constraints cover profile, squad-member, manual-total subject, and game-player snapshot positions. This web stage changes only the first two active input boundaries. No schema extension is required.

## Canonical Web Registry

`src/lib/canonical/positions.ts` is the single web domain authority for active position forms. It defines the canonical union, ordered option records, mobile-matching labels and short labels, safe normalization, multi-source resolution, a strict stored-value type guard, display-label resolution, and optional mutation-input validation.

The mutation validator preserves `null`/blank as `null`, canonicalizes known aliases, and throws for arbitrary or ambiguous values before a repository call can persist them.

## Normalization Rules

The web mirrors only aliases present in current mobile code:

| Input | Canonical value |
|---|---|
| `FWD`, `Forward`, `Forwards` | `FWD` |
| `MID`, `Midfield`, `Midfielder` | `MID` |
| `RUC`, `Ruck` | `RUC` |
| `DEF`, `Defender`, `Defence`, `Defense` | `DEF` |

Matching is trim- and case-insensitive for normalization. The strict type guard accepts only exact stored codes. `Utility`, `Bench`, `Key Forward`, `Key Defender`, `Wing`, and other unknown values do not normalize. Existing unknown read values are not rewritten automatically: onboarding treats them as unselected, while roster display retains a non-destructive formatted fallback until the user chooses a supported value.

## Onboarding

The Player position sheet now renders all four registry entries with friendly label and short code. Selecting Ruck sets `RUC`. Profile hydration uses the canonical normalizer rather than a type assertion. The visible field and sheet subtitle use the friendly label rather than exposing the raw stored code.

Player position remains required only when the Player role is selected. `finishOnboarding` validates and canonicalizes again immediately before building the profile update payload. Non-player profiles retain the existing `null` behavior.

## Profile Editing

Profile editing continues to reuse `/onboarding?mode=edit`, so it cannot drift into a second option list. Existing `RUC` hydrates as Ruck, unchanged canonical values remain unchanged, and choosing another option writes its canonical code. The profile edit link now supplies `/profile` as the safe return destination; after a successful mutation the profile route remounts and its existing loader refetches the saved profile state.

## Roster Management

The active squad-detail position modal now uses the canonical registry and no longer offers `Utility` or `Bench`. Each friendly button passes its code to `updateMemberPosition`, and an explicit Clear position action preserves the backend/mobile nullable contract. The repository independently canonicalizes or rejects the runtime input before updating `squad_members.position`.

The dormant `RosterTable` free-text component has no reachable imports and was not expanded into this stage. The active repository boundary is nevertheless protected if a future caller is wired to it.

## Impact 7 / Benchmark Integration

The Stage 0 position resolver now delegates canonical codes and mobile aliases to the shared normalizer. Its outputs remain:

- `FWD` → Forward / General Forward
- `MID` → Mid
- `RUC` → Ruck
- `DEF` → Defender / General Defender
- unknown → Default

Historical benchmark-only composite strings (`FWD/MID`, `MID/FWD`, `MID/DEF`, `DEF/MID`) remain local compatibility inputs in the benchmark resolver. They are deliberately not accepted by form persistence. No formula, threshold, milestone, weighting, or stat logic changed.

## Files Changed

- `src/lib/canonical/positions.ts`
- `src/lib/canonical/position-benchmark.ts`
- `src/lib/onboarding.ts`
- `src/lib/squads.ts`
- `src/routes/Onboarding.tsx`
- `src/routes/portal/ProfilePage.tsx`
- `src/routes/portal/SquadDetailPage.tsx`
- `tests/position-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_POSITIONS.md`

## Tests

Twenty-seven focused tests cover the requested canonical domain, onboarding, profile, roster, nullable behavior and calculation-integration cases. They also cover strict stored-value validation, rejection of ambiguous aliases, repository-boundary wiring, safe multi-source reads, profile refetch routing, and preservation of Stage 0 historical composite benchmark behavior.

The complete web suite now contains 117 passing tests.

## Validation

- Focused position contracts: 27/27 passed.
- Full web test suite: 117/117 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; existing Browserslist and large-chunk advisories remain non-blocking.
- `git diff --check`: passed.
- Lint: not run because no lint script is configured.

## Remaining Risks

- Authenticated browser smoke testing is still required against hosted data for a real Ruck profile and an authorized roster editor.
- Unknown historical roster strings remain visible through a display fallback until a user explicitly saves a canonical value; this stage intentionally performs no mass rewrite.
- The generated database types continue to lag parts of the deployed migration history, as recorded in Stage 0.
- The dormant free-text roster component must use the canonical registry if it becomes reachable in a later UI refactor.

## Recommended Next P1 Stage

Proceed with P1-01 alone as a bounded canonical leaderboard filters/stat-vocabulary stage. It repairs an existing user-facing page, can consume the existing stat registry and backend reads without a migration, and should not be mixed with the broader team-hub or profile-content work.

Remaining unresolved P1 findings after this stage are P1-01, P1-08, P1-11, P1-13 and P1-15. P1-09 remains **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited.
