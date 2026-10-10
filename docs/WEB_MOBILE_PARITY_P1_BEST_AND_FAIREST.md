# P1 Best & Fairest / Voting

## Scope

This final implementation-eligible P1 stage adds the current mobile squad voting workflow to the existing web team hub using only deployed contracts. It does not connect voting results to the placeholder Profile Awards product and does not modify Team Selection, Player Cards, Coaches, stats, Dashboard Activity, leaderboards or profile posts.

## Migration-Free Backend Audit

The deployed backend supports the complete reachable mobile management and submission flow. No required sub-flow needs a schema, RPC, policy, trigger, grant or migration change. Management and private-result access are security-definer capability checks; mutations are guarded security-definer RPCs; anonymous access is limited to hashed token RPCs.

The audit found no standalone “send reminder” management RPC or reachable mobile reminder action. The notification type exists for backend-produced reminders, but web does not invent a reminder sender.

## Mobile Baseline

Mobile exposes a manager-only `/teams/[id]/votes` module. Managers create active vote groups, configure accepted squad members and award templates, add manual or linked tracked-game matchups, assign internal or external cards, enter manager overrides, inspect completed/pending cards, and view private tallies and breakdowns. Archived groups can be restored or permanently deleted. Assigned users open a guarded authenticated card; external voters use the public token page.

## Existing Tables/RPCs

Tables read under existing RLS:

- `squad_vote_groups`
- `squad_vote_group_members`
- `squad_vote_award_types`
- `squad_vote_matchups`
- `squad_vote_cards`
- `squad_vote_entries` (never read directly by the new UI)

Capability functions:

- `f_can_manage_squad_votes`
- `f_can_view_squad_vote_tallies`
- `f_can_access_vote_card`

Management RPCs:

- `rpc_create_squad_vote_group`
- `rpc_set_squad_vote_group_members`
- `rpc_create_squad_vote_award_type`
- `rpc_update_squad_vote_award_type`
- `rpc_delete_squad_vote_award_type`
- `rpc_create_squad_vote_matchup`
- `rpc_create_squad_vote_cards` (available; normal matchup creation already generates configured cards)
- `rpc_assign_squad_vote_card`
- `rpc_delete_squad_vote_card`
- `rpc_void_squad_vote_card`
- `rpc_delete_squad_vote_matchup`
- `rpc_archive_or_delete_squad_vote_group`
- `rpc_restore_squad_vote_group`

Submission and private-result RPCs:

- `rpc_get_squad_vote_card_context`
- `rpc_submit_squad_vote_card`
- `rpc_get_public_squad_vote_card_context`
- `rpc_submit_public_squad_vote_card`
- `rpc_get_squad_vote_matchup_breakdown`
- `rpc_get_squad_vote_tally`

## Permission Model

| Viewer | Custom squad | Official squad |
|---|---:|---:|
| Squad owner | Manage and view tally | Manage and view tally |
| Accepted squad admin | Manage and view tally | Not by squad role alone |
| Custom coach | Denied | n/a |
| Tracker | Denied | Denied |
| Ordinary member | Denied | Denied |
| Guest/unrelated user | Denied | Denied |
| Club admin | n/a | Manage and view tally |
| Club coach | n/a | Manage and view tally |
| Platform admin | Manage and view tally | Manage and view tally |
| Assigned authenticated voter | Own card only | Own card only |
| External voter | Token-scoped card only | Token-scoped card only |

The web team entry uses the live capability RPC rather than profile role preferences or duplicated client authority.

## Vote Groups

The Voting tab lists exact-squad groups with active/archived separation, award/matchup/pending-card counts, name and description. Managers create groups through `rpc_create_squad_vote_group`. Active groups archive; archived groups restore or permanently delete through the deployed lifecycle RPCs.

## Eligible Members

Accepted squad members are loaded with stable `squad_members.id`. Linked profiles and guest players are both supported. Saving replaces the selection atomically through `rpc_set_squad_vote_group_members`; display names never act as keys.

## Award Types

Managers create and edit Best & Fairest, club-award and custom-labelled templates. The stored category remains `best_and_fairest` or `incentive`; `color_key = custom` carries the mobile custom presentation. Ordered unique positive point values and positive card limits are checked in the UI and revalidated by the RPC. Unused templates may be deleted through the guarded delete RPC.

## Matchups

Manual matchups require round, opponent and date. Tracked matchups retain the exact deployed game UUID, and the RPC verifies the game is linked to the vote group's squad. Web uses the same normal tracked-game eligibility as mobile and excludes playerless `team_stats_game` rows. Unsupported source types are rejected before the RPC and again by the backend.

## Vote Cards

Active templates generate cards when a matchup is created. Cards expose pending/submitted/void status and their award/index identity. Managers can assign an accepted linked user or enter an external voter name/email. The assignment RPC sends supported internal notifications and returns a one-time public token for external cards. Pending cards may be deleted; submitted cards may be voided, subject to the backend rules.

## Authenticated Voting

`/teams/:id/votes/cards/:cardId` is inside the protected portal. It loads only `rpc_get_squad_vote_card_context`, so access is limited to managers or the exact assigned user. The existing voting component now consumes shared pure selection logic. Every configured slot is required, duplicate candidates are rejected, and manual/tracked submissions use the correct stable identity before `rpc_submit_squad_vote_card` revalidates and locks the card.

## Public Token Voting

`/vote-card/:token` remains outside the authenticated layout. It reads and submits only through `rpc_get_public_squad_vote_card_context` and `rpc_submit_public_squad_vote_card`; it never reads raw vote tables. Tokens are hashed server-side, single-card scoped and consumed/cleared on successful submission.

## Breakdown / Tally

Matchup breakdown and group tallies come directly from the canonical server RPCs. Submitted and outstanding card status, award/card identity, stored player allocations, guest identity and total points are rendered without client recomputation. Leaderboard order and equal-point behavior remain the server/mobile order (points descending, then name; displayed positions follow list position like mobile).

## Privacy / Interim Results

Private tally and breakdown RPCs require `f_can_view_squad_vote_tallies`, currently identical to management authority. Ordinary members and assigned voters cannot call them. The authenticated card RPC returns only the single accessible card. The anonymous RPC returns only its token-scoped candidate/context payload. No general published-results surface or raw-entry browser query was added.

## Notifications

`vote_card_assigned` and `vote_card_reminder` now open `/teams/:squadId/votes/cards/:cardId` when both identities exist. If a legacy notification has a squad but no card ID, it falls back to the private Voting tab. The existing notification list, unread state and mutation architecture are unchanged.

## Files Changed

- `src/lib/canonical/squad-votes.ts`
- `src/lib/squad-votes.ts`
- `src/hooks/useSquadVotes.ts`
- `src/components/squads/BestAndFairestPanel.tsx`
- `src/components/vote-card/PublicVoteCard.tsx`
- `src/routes/portal/AuthenticatedVoteCardPage.tsx`
- `src/routes/portal/SquadDetailPage.tsx`
- `src/lib/portal-notification-routing.ts`
- `src/main.tsx`
- voting and notification contract tests
- parity documentation

## Tests

Sixty-nine focused Best & Fairest tests cover the exact permission matrix; groups and lifecycle; award rules; stable linked/guest eligibility; manual/tracked matchup validation; card mapping and assignment; authenticated/public submission rules; duplicate and incomplete votes; private tally/breakdown authority; exact routes; states; and regression boundaries.

## Validation

Required validation consists of focused voting tests, the full web suite, typecheck, production build and `git diff --check`. Existing Browserslist and chunk-size warnings remain non-blocking.

## Deferred Sub-Capabilities

None of the current reachable mobile Best & Fairest workflow is migration-blocked. Profile Awards projection/publication is a separate placeholder product and was not part of P1-11. No reminder-sending control was added because the deployed/reachable voting management flow exposes no canonical reminder RPC/action.

## Final P1-11 Status

**RESOLVED.** Player Groups / Sides, Coaches / Team Stats Games, and Best & Fairest / Voting are complete for the supported mobile/backend functionality.

## Remaining P1 Backlog

- P1-09 Team Selection cross-device persistence — **DEFERRED / PRODUCT CONSTRAINT**.
- P1-15 admin Player Card/manual authoring — **DEFERRED / PRODUCT CONSTRAINT**.

All implementation-eligible P1 work is complete. The next work should be a final parity/release audit and explicit product decisions on the two deferred findings before any P2/P3 implementation begins.
