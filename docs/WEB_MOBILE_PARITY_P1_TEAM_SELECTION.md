# P1 Team Selection Remediation

Date: 18 August 2026
Status: **DEFERRED / PRODUCT CONSTRAINT**

## Scope

This report records the verified P1-09 Team Selection gap and the product decision that no new database migrations may be introduced. The unrun canonical Team Selection migration and all migration-dependent tests/documentation have been removed. No existing Supabase table, function, RPC, RLS policy, mobile behavior or web Team Selection production code was changed.

## Decision

No new canonical Team Selection backend will be introduced under the current product constraint. P1-09 is deferred rather than resolved because exact cross-device editable-draft parity requires server-side persistence that the existing schema does not provide.

The abandoned migration was never deployed, so no rollback migration is necessary or permitted.

## P1-09 Original Gap

The web routes `/teams/:id/team-selection` and `/squads/:id/team-selection` render `src/routes/portal/TeamSelectionPage.tsx`. The page loads squad identity and members, keeps lineup state in React, stores sponsor configuration in browser `localStorage`, and exports a PNG. It does not publish Team Selection activity or load an editable server-side selection.

The mobile route `app/teams/[id]/team-selection.tsx` renders `components/teams/TeamSelectionScreen.tsx`. Mobile has device-local draft restoration and existing backend publication, but it also has no editable canonical server-side Team Selection entity.

## Current Supported Behaviour

### Mobile

- Setup drafts auto-save to device `AsyncStorage` under `team-selection:setup-draft:v1:<squadId>`.
- Recent side lineups use `team-selection:recent-sides:v1:<squadId>`.
- “Save lineup” captures the poster to the native photo library.
- “Post to squad” uses the existing `rpc_create_team_selection_post(uuid, jsonb)` path.
- Published activity is read through `rpc_list_team_selection_posts_for_squad`.

### Web

- The current editor can build the four mobile lineup sections and export the poster as PNG.
- Sponsor configuration remains browser-local.
- No existing backend contract can save, update or reload an unpublished editable selection across devices.
- Browser `localStorage` will not be introduced as a hidden substitute for canonical persistence.

## Existing Domain Model

Current mobile uses four lineup buckets and capacities:

- Defenders: 6
- Midfielders: 6
- Forwards: 6
- Interchange: 5

Player assignment uses stable `squad_members.id` values while the player remains in the current roster. Eligible mobile roster entries are accepted members who are players, accepted guests, or accepted members with player metadata. Duplicate assignment is prevented and empty slots are permitted while editing. Captain, vice-captain and emergencies are not current mobile Team Selection features.

The version-1 published post payload contains squad branding snapshots, side label, round/grade/venue/date labels, opponent snapshot, compact poster sections, ins/outs, and poster colour settings. It is a published presentation payload, not an editable draft format.

## Deferred Capabilities

Under the no-migration constraint, the following remain deferred:

- cross-device drafts;
- server-side draft reload after logout/login or on another device;
- canonical selection IDs;
- revision and stale-edit protection;
- historical editable player snapshots;
- exact canonical saved-lineup hydration;
- atomic save-then-publish linkage;
- idempotent publication tied to a saved selection.

These capabilities must not be simulated by treating `posts` as draft storage. The legacy RPC publishes immediately, sends notifications, and creates a new post on each successful call.

## Existing Backend Capability Retained

`rpc_create_team_selection_post(uuid, jsonb)` remains unchanged and supported. It:

- requires authentication;
- validates `type = 'team_selection'`;
- applies `f_can_post_team_selection` authorization;
- inserts an authored `team_selection` post with `followers` visibility;
- emits the existing `team_selection_posted` notifications.

`rpc_list_team_selection_posts_for_squad(uuid, integer)` remains the existing published-activity read path. Neither RPC is an editable selection persistence contract.

## Permissions

The retained posting authority remains:

- squad owner;
- accepted custom-squad admin or coach;
- official club admin or coach.

Tracker, normal member/player, guest, unrelated authenticated user and standalone platform admin are not authorized solely by those roles. UI affordances are not a security boundary; the existing RPC remains authoritative.

## Posting and Activity

Current released mobile posting, payload construction, notification delivery and squad-activity invalidation remain untouched. No replacement or overload of the legacy RPC was introduced.

Web publication-only parity could be considered as a separate bounded product decision using the legacy RPC, but it would not resolve the saved-draft, reload and editing requirements that define P1-09. This cleanup does not add that partial behavior.

## Poster and Responsive Behaviour

Existing native photo-library capture and web PNG export remain separate platform adaptations. The current web poster/editor is unchanged. No browser persistence, UI redesign or mobile behavior change was introduced during cleanup.

## Files Removed

- `supabase/migrations/20260818120000_team_selection_canonical_backend.sql`
- `tests/team-selection-backend-contract.test.ts`
- `docs/TEAM_SELECTION_CANONICAL_BACKEND.md`

## Files Updated

- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_TEAM_SELECTION.md`

## Tests

The 29 tests that only asserted the abandoned migration contract were removed. No useful current-production domain tests existed in that file independently of the proposed tables/RPCs.

The retained full web suite validates the existing Stage 0/P0 and P1 Games work. There are no assertions for database objects that will not exist.

## Validation

- Repository search confirms no active production references to the abandoned tables or RPCs.
- The existing legacy `rpc_create_team_selection_post` remains present in mobile migrations/repositories and is unchanged.
- Full web tests: PASS, 33/33.
- Web typecheck: PASS.
- Web production build: PASS; existing Browserslist-age and large-chunk warnings remain.
- `git diff --check`: PASS.
- Web lint: no configured script.
- No migration was deployed, executed or replaced with a rollback.

## Remaining Risks

- Drafts remain device/browser-local and cannot follow a user across devices.
- Web and mobile cannot hydrate one editable canonical selection.
- Current mobile draft sanitization can drop roster identities that are no longer eligible/current.
- Legacy publication retry behavior can create more than one post because it is not tied to a canonical saved selection.

## Recommended Next P1 Stage

Do not continue P1-09 while the no-migration constraint remains. Proceed separately to P1-14 Notifications routing/repository parity, which can use the existing notification tables, `f_notifications_list`, `f_notifications_mark_read`, existing payloads and web route adapters without a new migration.
