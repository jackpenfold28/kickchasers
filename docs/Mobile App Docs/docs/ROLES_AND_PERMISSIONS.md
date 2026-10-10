# Roles and permissions

Last verified: 2026-07-23

Source of truth: UI gates in squad/admin routes plus active RLS and RPC helpers in `supabase/migrations/`. UI checks are usability only; server checks are authoritative.

## Role systems

KickChasers has separate role concepts:

- Profile preferences: `primary_role`, `game_day_role`, `game_day_roles` for onboarding/personalisation.
- Custom squad membership: `owner`, `admin`, `coach`, `tracker`, `player`/`member` as accepted or pending membership/request values.
- Official club roles: `admin`, `coach`, `tracker`, `member`.
- Platform administration: row in `platform_admins`.
- Game authority: creator/tracker and, for linked team games, claimed second-side tracker.
- Vote authority: squad/club manager/coach access plus assigned internal card or public token.

Do not infer permissions from profile preferences alone.

## Capability matrix

| Capability | Custom squad | Official squad |
| --- | --- | --- |
| View public/basic squad | Authenticated users; detail may be reduced | Authenticated users; roster detail follows official helpers |
| Manage roster/roles/branding | Owner, squad admin; platform admin | Owner, club admin; platform admin |
| Add/manage guests | Owner, squad admin/tracker; platform admin | Owner, club admin/tracker; platform admin |
| Manage player sides/groups | Owner, squad admin/coach; platform admin | Owner, club admin/coach; platform admin |
| Team selection | Owner or accepted member in current UI; server RPC validates squad access | Same plus official access rules |
| Coaches Team Stats area | Owner, squad admin; platform admin | Owner, club admin/coach; platform admin |
| Manage votes/Best & Fairest | Owner, squad admin | Owner, club admin/coach; platform admin |
| Change league | Owner/admin | Platform admin only |
| Delete/archive | Owner/admin for custom delete | Platform admin for official archive/delete controls |
| Track official counted stats | N/A | Club tracker/admin or platform admin authority is required for official leaderboard counting |

## Platform admin

`/admin` is guarded by `f_is_platform_admin`. Platform admins can:

- view dashboard metrics and active/tracked squads/games;
- decide official league/club/directory requests;
- decide official squad/admin and pending member/guest requests;
- inspect users/squad memberships;
- publish manual feed posts;
- review reports and hide/unhide posts;
- archive official squads;
- maintain league/directory records.

Platform admin does not automatically mean the app should bypass every domain rule; current RPCs explicitly include the role where intended.

## Game authority

- Single/team creator: creates, starts, records, undoes, finalises, and may delete own eligible game.
- Track-for-another-player: requires mutual follow in the client; server creates pending request. Counted player history requires acceptance.
- Linked team tracker: joins by one-time link code, configures one side, and can record/undo only that side while live/unlocked.
- Linked creator: controls shared quarter/timer and finalisation.
- Viewer: authenticated read of eligible summaries; database policies are broader than discovery UI.

## Community permissions

- Users follow/unfollow players and clubs; block removes reciprocal follows.
- Post authors edit/delete own posts and may moderate comments on their posts.
- Users like/comment when not blocked and can report posts/comments.
- Platform admins handle report resolution and hidden state.

## Public-token permissions

`/vote-card/[token]` can be used without app authentication. The token resolves one card through guarded RPCs; it is not general squad/game access. External voter name/email may be captured according to the card flow.

## Permission risks

- App screens sometimes compute roles client-side; all new mutations must still use RLS or guarded RPCs.
- Broad authenticated reads of match/squad data mean “not shown in UI” does not equal private.
- Official/custom role vocabularies overlap but do not have identical power.
- `profiles.game_day_roles` syncing to `club_roles` is not a substitute for verified official admin approval.
