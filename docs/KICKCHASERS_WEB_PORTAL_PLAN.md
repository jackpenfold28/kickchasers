# KickChasers Web Portal Plan

## A. Executive summary
- The ideal KickChasers web portal should be a management-first desktop companion to mobile: profile/account setup, squad/club administration, invites/requests/roles, game summary/stat review, leaderboard/stat browsing, and platform-admin workflows.
- Mobile should remain primary for live sideline workflows (real-time stat capture/tracker controls, match-day capture UX, on-device quick actions), while web should own high-density admin/review tasks.
- The strongest v1 web value comes from flows already concentrated in:
[app/onboarding.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/onboarding.tsx), [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [app/teams.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams.tsx), [app/teams/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id].tsx), [app/notifications.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/notifications.tsx), [app/(tabs)/leaderboards.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/leaderboards.tsx), [components/profile/ProfileScreen.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/profile/ProfileScreen.tsx), [components/me/GameLogTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/me/GameLogTab.tsx), [app/admin/index.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/index.tsx).

## B. Feature audit table

| Feature | Mobile screen/file | Purpose | Classification | Notes |
|---|---|---|---|---|
| Auth (sign in/up/reset/email update) | [app/sign-in.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/sign-in.tsx), [app/sign-up.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/sign-up.tsx), [app/forgot-password.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/forgot-password.tsx), [app/account/update-email.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/account/update-email.tsx) | Access/account credential management | ESSENTIAL FOR WEB | Core portal entry and account ops |
| Onboarding/profile setup | [app/onboarding.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/onboarding.tsx), [app/request-league.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/request-league.tsx), [app/request-club.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/request-club.tsx) | Home club/league/state/roles/identity setup | ESSENTIAL FOR WEB | Strong desktop form fit |
| Profile editing and profile analytics view | [components/profile/ProfileScreen.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/profile/ProfileScreen.tsx), [app/profile.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/profile.tsx), [app/users/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/users/[id].tsx) | Public/self profile, game log stats, post history | ESSENTIAL FOR WEB | Heavy data density favors web |
| Settings + account lifecycle | [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [app/settings/blocked-users.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/blocked-users.tsx), [app/settings/roles.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/roles.tsx) | Handle, avatar/logo, role requests, blockers, deletion | ESSENTIAL FOR WEB | Includes edge-function account deletion |
| Squads landing + tabs | [app/teams.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams.tsx), [components/teams/TeamsTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/TeamsTab.tsx), [components/teams/MySquadsTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/MySquadsTab.tsx), [components/teams/FollowingTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/FollowingTab.tsx) | Squad discovery/entry/following/admin tabs | ESSENTIAL FOR WEB | Primary portal backbone |
| Squad creation | [components/teams/CreateSquadSheet.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/CreateSquadSheet.tsx) | Create custom/official squads + branding | ESSENTIAL FOR WEB | Better as full-page wizard on web |
| Squad detail management | [app/teams/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id].tsx) | Manage roster, roles, join requests, merge requests, branding, league/grade, delete | ESSENTIAL FOR WEB | Most important admin workflow |
| Guest player management/merge | [app/teams/[id]/guest-users.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/guest-users.tsx) | Edit/remove/link guest members | ESSENTIAL FOR WEB | Easier with table UI on desktop |
| Team colors/branding | [app/teams/[id]/team-colors.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/team-colors.tsx), [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx) | Club/squad color control | ESSENTIAL FOR WEB | Already permission-gated |
| Squad overview | [app/squad/[squadId]/overview.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/squad/[squadId]/overview.tsx) | Read-only metadata + leave squad | GOOD FOR WEB LATER | Useful but secondary to manage view |
| Invites + join/role request handling via notifications | [app/notifications.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/notifications.tsx), [hooks/use-notifications.ts](/Users/jackpenfold/Projects/kickchasers-mobile/hooks/use-notifications.ts) | Review/respond to invites/requests | ESSENTIAL FOR WEB | High-value inbox model on desktop |
| Friends/follow directory | [app/friends.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/friends.tsx) | Follow people/squads, search directory | GOOD FOR WEB LATER | Useful for growth, not core admin |
| Leaderboards/stat comparison | [app/(tabs)/leaderboards.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/leaderboards.tsx), [components/teams/StatsLeaderboard.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/StatsLeaderboard.tsx) | Cross-player stat leaders with filters | ESSENTIAL FOR WEB | Strong desktop analytics fit |
| Game summaries | [app/games/[id]/summary.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/games/[id]/summary.tsx), [app/games/manual/[id]/summary.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/games/manual/[id]/summary.tsx) | Per-game stat review/share | ESSENTIAL FOR WEB | Key viewing workflow |
| Game log + manual posting | [components/me/GameLogTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/me/GameLogTab.tsx) | User game history + summary posting | ESSENTIAL FOR WEB | High management/viewing value |
| Feed/social posting/moderation actions | [app/(tabs)/feed.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/feed.tsx), [hooks/use-feed.ts](/Users/jackpenfold/Projects/kickchasers-mobile/hooks/use-feed.ts) | Posts/comments/likes/report/block | GOOD FOR WEB LATER | Keep basic consume in v1, authoring later |
| Platform admin console | [app/admin/index.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/index.tsx), [app/admin/manual-feed-post.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/manual-feed-post.tsx), [app/leagues/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/leagues/[id].tsx) | Request approvals, moderation, official data admin | ESSENTIAL FOR WEB | Natural fit for back-office web |
| Team selection poster builder | [app/teams/[id]/team-selection.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/team-selection.tsx), [components/teams/TeamSelectionScreen.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/TeamSelectionScreen.tsx) | Build/export lineup poster | GOOD FOR WEB LATER | Good desktop canvas workflow |
| Match-day live games browsing | [app/(tabs)/match-day.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/match-day.tsx) | Live league game watch/list | GOOD FOR WEB LATER | Viewing okay on web |
| New game setup + track request | [app/(tabs)/new-game/index.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/new-game/index.tsx) | Create games and assign tracking | GOOD FOR WEB LATER | Setup is web-suitable; live execution is mobile-first |
| Live tracker capture | [app/tracker.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/tracker.tsx) | Real-time event capture at sideline | MOBILE ONLY | Touch-optimized, low-latency entry |
| Team tracker in-game stack | [app/new-game/team-tracker/game.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/new-game/team-tracker/game.tsx) | In-match stat capture/clocking | MOBILE ONLY | Operational flow, not portal admin |
| Icon test/preview utilities | [app/icon-test.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/icon-test.tsx), [app/preview-card.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/preview-card.tsx) | Internal tooling | NOT NEEDED ON WEB | Dev/test only |

## C. Management workflows audit

### Profile setup/edit
- Screens/files:
[app/onboarding.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/onboarding.tsx), [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [components/profile/ProfileScreen.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/profile/ProfileScreen.tsx), [hooks/use-profile-summary.ts](/Users/jackpenfold/Projects/kickchasers-mobile/hooks/use-profile-summary.ts).
- Workflow:
1. Auth user is redirected to onboarding until state+league+club+handle+role are present (root gate in [app/_layout.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/_layout.tsx)).
2. User picks state/league/club, roles, profile attributes, uploads avatar/action photo.
3. Save updates `profiles`, inserts `club_follows`, ensures official squad membership, optionally creates role requests.
4. Later edits happen in Settings/Profile.
- Main queries/mutations:
`profiles` select/update, `states`/`leagues`/`clubs` selects, `squads` official lookup, `squad_members` insert, `club_follows` insert, `createRoleRequest`, `rpc_ensure_profile_exists`, storage uploads (`profile-avatars`, `team-logos`).
- Tables/functions:
`profiles`, `profiles_directory`, `states`, `leagues`, `clubs`, `squads`, `squad_members`, `club_follows`, `squad_join_requests`, `official_directory_requests`, `rpc_ensure_profile_exists`, `f_leave_squad`.
- Roles/permissions:
Authenticated user; admin role is locked/preserved if already assigned.
- Dependencies:
Hard dependency on profile completeness for app entry.
- Mobile pain points web can improve:
Long form with many modal pickers and image actions in one vertical flow.

### Squads
- Screens/files:
[app/teams.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams.tsx), [components/teams/CreateSquadSheet.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/CreateSquadSheet.tsx), [app/teams/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id].tsx), [app/squad/[squadId]/overview.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/squad/[squadId]/overview.tsx).
- Workflow:
1. User sees My Squads / Teams / Following / (admin) Leagues tabs.
2. Create squad (custom or official) with optional media and league/grade context.
3. Open squad detail and manage members, numbers, positions, branding, grade/league.
4. Optional leave/delete squad paths.
- Main queries/mutations:
`listMySquads`, `getSquadDetail`, `listMembers`, `createSquad`, `createOfficialSquad`, `updateSquadBranding`, `updateSquadGrade`, `removeMember`, `updateMemberNumber`, `updateMemberPosition`, `deleteSquad`, `f_squad_members`, `f_squads_for_user_v2`, `f_leave_squad`.
- Tables/functions:
`squads`, `squad_members`, `game_squads`, `league_grades`, `clubs`, `leagues`, RPC set above.
- Roles/permissions:
Owner/admin controls differ; official squad management depends on `club_roles` + checks (`f_is_club_admin`, official admin requests).
- Dependencies:
Onboarding + accepted membership.
- Mobile pain points:
Action-sheet-heavy member operations and deep modal stack.

### Teams/clubs
- Screens/files:
[app/teams/[id]/team-colors.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/team-colors.tsx), [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [app/request-club.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/request-club.tsx), [app/request-league.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/request-league.tsx), [app/leagues/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/leagues/[id].tsx).
- Workflow:
1. Manage team/squad branding/colors.
2. Submit directory requests if club/league missing.
3. Platform admins approve/manage official directory entities.
- Main queries/mutations:
`updateSquadColors`, `createDirectoryRequest`, `listLeaguesAdmin`, `updateLeagueAdmin`, `approveDirectoryRequest`.
- Tables/functions:
`official_directory_requests`, `leagues`, `league_grades`, `clubs`, `squads`, `club_roles`.
- Roles/permissions:
Platform admin for official data; club admin/owner for official squad-specific edits.
- Pain points:
Cross-surface admin actions split between teams/settings/admin routes.

### Invites/roles/join requests
- Screens/files:
[components/teams/InviteMemberSheet.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/InviteMemberSheet.tsx), [app/teams/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id].tsx), [app/settings/roles.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/roles.tsx), [app/notifications.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/notifications.tsx), [lib/squad-membership-repository.ts](/Users/jackpenfold/Projects/kickchasers-mobile/lib/squad-membership-repository.ts).
- Workflow:
1. Invite by handle/follow connection.
2. Invitee accepts/declines from notifications.
3. Join requests/role requests appear in Manage; admin approves/declines or requester cancels.
4. Guest merge requests reviewed similarly.
- Main queries/mutations:
`f_invite_member`, `f_respond_invite`, `requestToJoinSquad`, `rpc_decide_squad_join_request`, `requestGuestMerge`, `rpc_decide_guest_merge_request`, `createRoleRequest`, `cancelRoleRequest`, `listPendingJoinRequests`, `listPendingRoleRequests`.
- Tables/functions:
`squad_members`, `squad_join_requests`, `guest_merge_requests`, `club_roles`, `notifications`.
- Roles/permissions:
Owner/admin/club-admin/platform-admin paths vary by official vs non-official squads.
- Pain points:
Decision actions distributed across notifications and squad manage tab; heavy contextual branching.

### Game summaries/stats
- Screens/files:
[app/games/[id]/summary.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/games/[id]/summary.tsx), [app/games/manual/[id]/summary.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/games/manual/[id]/summary.tsx), [components/me/GameLogTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/me/GameLogTab.tsx), [components/teams/StatsLeaderboard.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/StatsLeaderboard.tsx), [app/(tabs)/leaderboards.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/leaderboards.tsx), [hooks/use-game-summary.ts](/Users/jackpenfold/Projects/kickchasers-mobile/hooks/use-game-summary.ts).
- Workflow:
1. User opens game summary/game log to review totals and benchmark context.
2. Leaderboards apply state/league/club/age filters.
3. Users can publish summary posts from logs.
- Main queries/mutations:
`games`, `events`, `manual_player_game_totals`, `game_players`, `game_squads`, `profiles_directory`, `teams`, views/RPC `v_counted_events`, `rpc_get_manual_game_summary_for_post`.
- Roles/permissions:
Mostly read paths, plus author-owned post creation.
- Pain points:
Dense stat sets on small mobile layout.

### Account/settings
- Screens/files:
[app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [app/account/update-email.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/account/update-email.tsx), [app/settings/blocked-users.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/blocked-users.tsx), [supabase/functions/delete-account/index.ts](/Users/jackpenfold/Projects/kickchasers-mobile/supabase/functions/delete-account/index.ts).
- Workflow:
1. Update handle, email, password reset trigger, avatar/logo, colors.
2. Role request screen for player/coach/tracker.
3. Blocked users management.
4. Account deletion with confirmation flow and edge function.
- Main queries/mutations:
`profiles` update, `auth.updateUser`, `auth.resetPasswordForEmail`, `functions.invoke('delete-account')`, `user_blocks` list/delete, `user_push_tokens` delete.
- Roles/permissions:
Self-service user; deletion relies on backend cleanup RPC.
- Pain points:
Many unrelated settings bundled in one long page.

### Other relevant admin/management flows
- Platform admin console:
[app/admin/index.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/index.tsx), [lib/admin-requests.ts](/Users/jackpenfold/Projects/kickchasers-mobile/lib/admin-requests.ts), [lib/platform-admin.ts](/Users/jackpenfold/Projects/kickchasers-mobile/lib/platform-admin.ts).
- Social moderation:
[lib/moderation-repository.ts](/Users/jackpenfold/Projects/kickchasers-mobile/lib/moderation-repository.ts) with post/comment report + user block pathways.
- Manual official posting:
[app/admin/manual-feed-post.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/manual-feed-post.tsx) via `rpc_create_manual_game_summary_post`.

## D. UI / design language audit
- Palette/tokens:
`KickchasersDarkPalette`/`KickchasersLightPalette` with neon accent `#39FF88`, dark navy surfaces, soft borders, accent pills in [constants/theme.ts](/Users/jackpenfold/Projects/kickchasers-mobile/constants/theme.ts).
- Header pattern:
Sticky top bars with avatar + action icons + centered title/subtitle ([components/top-profile-bar.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/top-profile-bar.tsx), [components/me/MeHeader.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/me/MeHeader.tsx)).
- Hero/card pattern:
Large rounded cards/hero blocks, gradient overlays, strong iconography, compact metadata pills ([components/teams/SquadSummaryHeader.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/SquadSummaryHeader.tsx), [components/hub/hero-card.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/hub/hero-card.tsx)).
- Tabs/segmented controls:
Underline slider tabs and segmented chips used broadly for section switching ([app/teams.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams.tsx), [app/(tabs)/me.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/me.tsx), [app/(tabs)/leaderboards.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/leaderboards.tsx)).
- Lists:
Card rows with avatar/logo left, metadata center, contextual actions right; invite/request cards use status colors.
- Forms:
Single-column inputs, labeled sections, inline validation text, high-contrast primary CTA.
- Modals/sheets:
Bottom sheet with swipe-to-dismiss and dimmed backdrop ([components/ui/SwipeDownModal.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/ui/SwipeDownModal.tsx)).
- Stats presentation:
Stat pills, benchmark chips/bars, multi-group tables, season chips, filter chips.
- Official branding:
Verified badge + club/squad colors drive accents; logo-first identity in headers/cards.
- Web adaptation guidance:
Preserve token system, card language, badge semantics, and neon accent usage; convert bottom sheets to side panels/dialogs and move multi-step workflows into persistent split-pane/table layouts.

## E. Recommended web portal architecture

Primary nav (v1)
- Dashboard
- Squads
- Games
- Stats
- Notifications
- Profile
- Settings
- Admin (role-gated)

Section mapping and rollout
- Dashboard (v1):
Home snapshot of pending actions, invites/requests, recent games, quick links. Maps from hub + notifications + teams.
- Squads (v1):
My squads, followed clubs, squad detail manage panels (roster, invites, requests, branding, grade/league). Maps from teams routes and team detail.
- Games (v1):
Game log list, game summary detail, manual summary views. Maps from GameLogTab + summary routes.
- Stats (v1):
Leaderboards and player/team stat views with filter controls. Maps from leaderboards + StatsLeaderboard.
- Notifications (v1):
Unified action inbox for invites/requests/role changes/follows/social alerts. Maps from notifications route.
- Profile (v1):
Self/public profile view + edit profile entrypoints. Maps from ProfileScreen + onboarding edit mode.
- Settings (v1):
Account/security/email/password triggers/blocked users/role requests/branding basics.
- Admin (v1 for admins):
Official admin requests, directory requests, moderation actions, league management.
- Social Feed (later):
Create/edit/delete posts, comments, likes, moderation controls.
- Team Selection Poster (later):
Desktop lineup builder/export.

## F. Web build plan for Codex

### Phase 1: Foundation + shell
- Features:
Auth session flow, onboarding gate parity, portal shell/nav, role-aware route guards.
- Reference files:
[app/_layout.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/_layout.tsx), [app/sign-in.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/sign-in.tsx), [app/sign-up.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/sign-up.tsx).
- Backend deps:
Supabase auth, `profiles` completion checks.
- UI patterns:
Top nav + sticky header + segmented section nav.
- Risks:
Mismatch in onboarding-required fields vs current root-gate logic.

### Phase 2: Profile + settings/account
- Features:
Onboarding/edit profile, profile summary page, settings, email update, blocked users, role requests.
- Reference files:
[app/onboarding.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/onboarding.tsx), [app/settings.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings.tsx), [app/settings/roles.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/roles.tsx), [app/settings/blocked-users.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/settings/blocked-users.tsx), [app/account/update-email.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/account/update-email.tsx).
- Backend deps:
`profiles`, `profiles_directory`, `club_follows`, `squad_members`, `official_directory_requests`, `user_blocks`, `delete-account` edge function.
- Risks:
Storage uploads and account-deletion error handling parity.

### Phase 3: Squads + management core
- Features:
Teams index tabs, squad create, squad detail admin, invite flow, join/role/guest-merge decisions, colors and guest member tools.
- Reference files:
[app/teams.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams.tsx), [app/teams/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id].tsx), [components/teams/CreateSquadSheet.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/CreateSquadSheet.tsx), [components/teams/InviteMemberSheet.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/InviteMemberSheet.tsx), [app/teams/[id]/team-colors.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/team-colors.tsx), [app/teams/[id]/guest-users.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/guest-users.tsx).
- Backend deps:
`squads`, `squad_members`, `squad_join_requests`, `guest_merge_requests`, `club_roles`, RPCs `f_invite_member`, `f_respond_invite`, `rpc_decide_squad_join_request`, `rpc_decide_guest_merge_request`, `rpc_revoke_club_role`, `f_is_club_admin`.
- Risks:
Official vs non-official permission branching complexity.

### Phase 4: Games + stats + notifications
- Features:
Game log list, game summary detail, leaderboard/stat filters, notification inbox with action handling.
- Reference files:
[components/me/GameLogTab.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/me/GameLogTab.tsx), [app/games/[id]/summary.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/games/[id]/summary.tsx), [app/(tabs)/leaderboards.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/(tabs)/leaderboards.tsx), [components/teams/StatsLeaderboard.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/components/teams/StatsLeaderboard.tsx), [app/notifications.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/notifications.tsx).
- Backend deps:
`games`, `events`, `manual_player_game_totals`, `game_players`, `game_squads`, `notifications`, feed-related refs.
- Risks:
Large query fan-out on summary/leaderboard pages; need caching + pagination strategy.

### Phase 5: Admin and extended portal
- Features:
Platform admin console, official request workflows, moderation controls, league detail management, optional feed authoring and team-selection poster builder.
- Reference files:
[app/admin/index.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/index.tsx), [app/leagues/[id].tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/leagues/[id].tsx), [app/admin/manual-feed-post.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/admin/manual-feed-post.tsx), [app/teams/[id]/team-selection.tsx](/Users/jackpenfold/Projects/kickchasers-mobile/app/teams/[id]/team-selection.tsx).
- Backend deps:
`platform_admins`, `official_squad_admin_requests`, `official_directory_requests`, `rpc_set_post_hidden`, `rpc_set_squad_archived`, admin approval helpers.
- Risks:
Need strict role-guarding and auditability on privileged actions.

## G. Backend / schema / permissions dependencies

| Area | Required tables/views/functions | RLS/permission sensitivities | Roles needed | Mobile-tied assumptions |
|---|---|---|---|---|
| Auth/onboarding/profile | `profiles`, `profiles_directory`, `states`, `leagues`, `clubs`, `squads`, `squad_members`, `club_follows`, `rpc_ensure_profile_exists` | Profile update + membership inserts must stay self-scoped; onboarding gate logic currently hard-coded | Authenticated user | Image pickers and mobile modal selectors |
| Squad management | `squads`, `squad_members`, `squad_join_requests`, `guest_merge_requests`, `club_roles`, `f_squad_members`, `f_squads_for_user_v2`, `f_invite_member`, `f_respond_invite`, `f_remove_squad_member`, `rpc_decide_squad_join_request`, `rpc_decide_guest_merge_request` | Official squad controls rely on club role checks (`f_is_club_admin`, helper functions) | Owner/admin/club admin/platform admin | Action sheets and touch workflows |
| Team/league directory/admin | `official_directory_requests`, `official_squad_admin_requests`, `leagues`, `league_grades`, `clubs`, `platform_admins`, approval functions in `lib/admin-requests.ts` | Approvals and role grants must be admin-only and auditable | Platform admin (+ requesters) | Mobile request forms are limited context |
| Game summary/stats | `games`, `events`, `manual_player_game_totals`, `game_players`, `game_squads`, `v_counted_events`, summary RPCs | Read filters may differ for tracked-for-profile vs creator paths | Authenticated viewers, some public/read contexts | Mobile includes live-to-summary transitions |
| Leaderboards | `events`, `profiles_directory`, `squad_members`, `clubs`, `leagues`, `games` | Membership-filter logic depends on accepted roster and grade links | Authenticated user | Mobile performance constraints shaped current queries |
| Notifications/invites | `notifications`, `squad_join_requests`, `guest_merge_requests`, `squad_members`, `profiles_directory`, `user_push_tokens` | Payload-driven actions require strict recipient checks | Authenticated user/admin depending action | Push-token registration is mobile-specific |
| Feed/social moderation | `posts`, `post_likes`, `post_comments`, `post_reports`, `comment_reports`, `user_blocks`, `feed` view | Moderation/reporting and visibility policies must be mirrored exactly | Authenticated user, platform admin for hide/archive | Device image upload UX and native shares |
| Account deletion | Edge function `delete-account`, RPC `f_delete_account_data`, storage buckets | High-risk destructive flow; needs strong auth and error surface | Authenticated self-service | Mobile includes timed warning UX |

## H. Risks / ambiguities / open questions
- Official squad permission model is complex and split across row policies + helper functions + client-side branching; web should centralize capability checks server-side.
- There are dual concepts across legacy/new fields (`grade_id` vs `league_grade_id`, profile/team fields, official role flows); web API layer should normalize these.
- Notifications drive many management actions through payload conventions; define a typed notification action contract before web implementation.
- Social/feed and moderation are broad; if v1 scope is management-first, keep feed authoring minimal initially.
- Mobile uses bottom-sheet-heavy interactions; direct 1:1 web port would feel poor. Recompose into master-detail tables/forms.
- Live tracking/new-game capture flows are tightly mobile operational; avoid partial web implementations that blur ownership.
- Confirm whether web should include subscription management now, since settings currently states it is web-handled but no portal route is present in this repo.
- Supabase docs note existing hardening gaps (see [docs/SUPABASE_CONTEXT.md](/Users/jackpenfold/Projects/kickchasers-mobile/docs/SUPABASE_CONTEXT.md)); address before exposing broader web admin surfaces.
