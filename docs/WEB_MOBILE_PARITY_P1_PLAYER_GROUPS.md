# P1 Player Groups / Sides Remediation

## Scope

This stage resolves only the player-groups/sides portion of P1-11 inside the existing team hub. It covers active groups, named sides, memberships, primary designation, create, rename, archive, roster integration, permissions and refresh behavior. It does not implement Coaches/Team Stats Games, Best & Fairest/voting, Team Selection, P1-08, P1-13, P1-15, or any backend change.

## Original P1-11 Gap

The web team hub handled roster members, invitations, requests, guests, branding, games and statistics, but had no player-side display or management. Authorized users had to use mobile to create or maintain sides, and web roster rows could not show or edit existing group membership.

## Mobile Baseline

The reachable mobile surface is `app/teams/[id].tsx`, supported by `lib/squad-player-groups-repository.ts` and `components/teams/SquadSideChips.tsx`. It lists active groups in `sort_order`, exposes create/rename/archive to its `canManageSides` role gate, filters player rows by all/unassigned/group, and shows the primary side in player metadata. Its roster action currently offers a primary-side quick editor; the repository and backend support the broader multi-group membership model.

Mobile's list repository calls `rpc_ensure_squad_player_groups`, and its assignment list calls `rpc_backfill_squad_player_group_assignments`, before reads. Those calls can create default groups and assignments. This web stage does not repeat that automatic mutation because the parity-project instruction explicitly prohibits production mutation on page load and says not to expose a backfill action absent an equivalent management control.

## Existing Backend Contracts

The deployed migration `20260615120000_squad_player_groups_phase_one.sql` is authoritative. This stage consumes:

- `squad_player_groups` for RLS-protected active group reads.
- `squad_player_group_members` for RLS-protected membership reads keyed by `squad_member_id`.
- `f_can_read_squad_player_groups` and `f_can_manage_squad_player_groups` for runtime capabilities.
- `rpc_create_squad_player_group`, `rpc_rename_squad_player_group`, and `rpc_archive_squad_player_group` for group mutations.
- `rpc_set_squad_member_player_groups` for one atomic full membership/primary update.

The repository deliberately does not call `rpc_ensure_squad_player_groups` or `rpc_backfill_squad_player_group_assignments`. The separate set-primary and remove-one RPCs remain available to mobile, but web uses the canonical bulk setter because one submitted editor state can add, preserve and remove multiple memberships without a browser-side mutation chain.

## Group Listing

The management panel reads only rows whose `archived_at` is null, orders by server `sort_order` then name, and joins memberships by stable group and squad-member UUIDs in its pure view model. Each active side displays its name, default marker where relevant, member count and explicit-primary count. Archived groups and their memberships are filtered from roster choices and badges.

Loading, request failure, unauthorized and genuine empty states are separate. A failed request is never rendered as “No active player sides.” Read-only users can see current side data without mutation controls.

## Create / Rename / Archive

Create and rename trim and reject blank names before calling the server. The backend remains responsible for authoritative slugs, duplicate-slug rejection, squad association and stable group identity. RPC errors remain visible and do not optimistically claim success.

Archive requires confirmation and calls the archive RPC rather than deleting a row. The deployed function sets `archived_at` and deletes that group's membership rows. It does not delete squad members, and the archived group identity remains as a historical group row. If the archived membership was primary, the backend does not infer a fallback primary from another group.

## Membership Assignment

The editor is opened from accepted roster-player rows and always passes the `squad_members.id`, never a name, handle or user ID. Linked players and accepted guest players share the backend identity model. Archived or pending members do not appear in the active player editor.

A player can be selected into multiple active groups. Group IDs are trimmed, deduplicated and submitted once to `rpc_set_squad_member_player_groups`. Unchecking one group preserves the others; “Unassign all” submits an empty group array and does not delete the squad member.

## Primary Group Semantics

The deployed unique partial index permits at most one `is_primary = true` membership per squad member. The bulk RPC accepts one nullable primary UUID, includes it in the submitted memberships if needed, clears old primary flags, removes memberships omitted from the submitted array, and upserts the remaining state atomically.

Web makes the first manually selected group primary for convenience. Users can explicitly change or clear the primary designation. Removing the current primary leaves `null`, even when other memberships remain; no fallback is inferred from sort order. This matches the backend remove/archive behavior.

## Permissions

The page uses `f_can_read_squad_player_groups` and `f_can_manage_squad_player_groups` as runtime UI capabilities; RPC and RLS checks remain the enforcement boundary.

| Context | Manage |
|---|---:|
| Squad owner | Yes |
| Platform admin | Yes |
| Custom accepted owner/admin/coach | Yes |
| Custom tracker/member/pending/unrelated user | No |
| Official club admin/coach | Yes |
| Official club tracker/member, or squad-role admin without a qualifying club role | No |

Guests are roster identities, not authenticated management authorities. They can be assigned by an authorized manager but cannot gain management rights merely by existing as a guest row.

## Official vs Custom Squads

For custom squads, the deployed capability accepts the squad owner or an accepted squad member with role `owner`, `admin`, or `coach`. For official squads, it accepts the squad owner or a `club_roles` row of `admin` or `coach`. Platform admins are accepted in both cases. Tracker authority used elsewhere for guest/tracking workflows does not extend to player-side management.

The current mobile local `canManageSides` expression does not include custom squad coaches even though the deployed function does. Web follows the server result instead of duplicating that local drift; the server remains canonical.

## Roster Integration

The People → Players list now shows every active side badge for a roster member and highlights the explicit primary badge. Its existing overflow action opens a compact responsive membership sheet. Position editing continues to consume the unchanged canonical `FWD`/`MID`/`RUC`/`DEF` registry.

Successful membership and archive mutations refetch both group state and squad roster/detail state. Create and rename refetch group state. No action requires a browser reload.

## Files Changed

- `src/lib/canonical/player-groups.ts`
- `src/lib/squad-player-groups.ts`
- `src/routes/portal/SquadDetailPage.tsx`
- `tests/player-group-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_PLAYER_GROUPS.md`

## Tests

Forty-two focused contracts cover active/archive ordering, counts, explicit primary resolution, stable member identity, validation, duplicate IDs, multi-membership, unassign/no-fallback semantics, the custom/official/platform role matrix, exact repository RPC boundaries, absence of ensure/backfill page-load mutations, roster integration, refresh states and the position/Team Selection/stats regression boundaries.

## Validation

- Focused player-group contracts: 42/42 passed.
- Full web suite: 191/191 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with only the existing Browserslist-age and large-chunk advisories.
- `git diff --check`: passed.
- Lint: not configured in `package.json`.

## Remaining P1-11 Slices

P1-11 remains partial. Coaches/Team Stats Games and Best & Fairest/voting are still open and were not touched. Team Selection remains separately **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited.

## Recommended Next Stage

Proceed with a bounded P1-13 profile-posts slice. It improves an existing core profile/community workflow, can reuse deployed post/read contracts without a migration, and can remain separate from the larger Player Card Album and incomplete awards surfaces. P1-15 remains a broken admin placeholder but requires product confirmation of its authoring contract; P1-08 still contains a Dashboard-versus-Feed product decision.
