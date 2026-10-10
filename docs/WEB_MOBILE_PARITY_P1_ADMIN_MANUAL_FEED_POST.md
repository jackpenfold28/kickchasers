# P1 Admin Manual Feed Post

## Original P1-15 Gap

The web route `/admin/manual-feed-post` was linked from the platform-admin dashboard but rendered only explanatory placeholder copy. It did not load data, validate a form, or publish anything.

## Mobile/Admin Baseline

The current reachable mobile screen is `app/admin/manual-feed-post.tsx`. It is platform-admin-only and begins a Player Card workflow. Its manual path:

1. collects a player display name, stable club ID, optional canonical position, opponent identity, match metadata, and stats;
2. inserts a `manual_player_game_totals` record for the signed-in admin; and
3. routes to the mobile Player Card creator, which owns artwork creation, asset persistence, and eventual Feed publication.

Current mobile contract tests explicitly require this screen not to call `rpc_create_manual_game_summary_post`. The route name and older planning documents therefore no longer describe the complete production behaviour.

## Existing Backend Capability

The ordered migrations still contain the legacy `rpc_create_manual_game_summary_post` function, but the current mobile route no longer uses it. The current publication path instead relies on the Player Card contracts, including `rpc_reserve_player_card`, `rpc_finalise_player_card_asset`, and `rpc_publish_player_card`, together with the mobile-only editor/export pipeline.

The web app currently provides owner-only Player Card Album consumption and preview. It does not contain the Player Card creator, artwork generation, reserve/finalise pipeline, or publishing UI needed to reproduce the current mobile admin workflow faithfully.

Using the legacy manual-summary RPC from web would create a separate web-only authoring path contrary to the current mobile source of truth. No raw `posts` insert or substitute persistence flow was introduced.

## Decision

**REMOVE / HIDE — DEFERRED / PRODUCT CONSTRAINT.**

The exposed non-functional web feature was removed. P1-15 is deferred as functional parity because mobile still supports the workflow and web cannot reproduce its current Player Card authoring path within this bounded stage without introducing a second product flow.

No migration, RPC, RLS, Edge Function, storage-policy, or notification change is required or proposed.

## Removal

- Removed the platform-admin dashboard CTA for the manual feed tool.
- Removed the placeholder `AdminManualFeedPostPage` component and import.
- Did not connect web to the legacy `rpc_create_manual_game_summary_post` contract.
- Did not add direct inserts into `posts` or `manual_player_game_totals`.

## Authorization

The compatibility URL remains nested beneath `PortalLayout`, so the existing server-backed `f_is_platform_admin` route guard runs before any admin child route is meaningful. Server-side authorization remains canonical for all supported admin mutations.

## Routing

`/admin/manual-feed-post` is retained only as a compatibility redirect to `/admin` with `replace`. This gives old bookmarks deterministic browser history behaviour without advertising or rendering an unsupported tool. The supported admin overview and its existing controls are unchanged.

## Tests

Focused contract coverage verifies:

- admin navigation has no manual-feed CTA;
- the legacy URL redirects safely;
- the redirect remains inside the platform-admin-gated portal route tree;
- the placeholder import and component are gone;
- supported admin overview controls remain;
- the legacy manual-summary RPC is not adopted; and
- no raw insert workaround is introduced.

## Validation

The stage is validated with the focused contract tests, the full web test suite, TypeScript typecheck, production build, and `git diff --check`.

## Remaining Limitations

Web platform admins cannot initiate the current manual Player Card authoring workflow. Reintroducing the feature requires a separately approved web Player Card creator scope that uses the existing reserve/finalise/publish contracts and canonical renderer. This is frontend product work, not a migration request.

## Final P1-15 Status

**DEFERRED / PRODUCT CONSTRAINT.** The broken web exposure is resolved; cross-platform authoring parity is not claimed. The parity score remains **86/100**.

## Recommended Next Stage

Take a product decision on **P1-08 Dashboard / Feed** as a standalone stage. Do not combine it with the remaining P1-11 Coaches / Team Stats Games or Best & Fairest / voting slices. P1-09 Team Selection remains deferred while migrations are prohibited.
