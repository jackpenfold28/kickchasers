# P1 Profile Posts Remediation

## Scope

This stage resolves only the Profile Posts portion of P1-13 inside the existing web profile. It covers own and other-user authored posts, the post types reachable on mobile profiles, visibility, blocks, hidden and viewer-reported content, stable pagination, states, read-only social counts and canonical navigation. It does not implement Album, awards, Team Selection authoring/editing, Coaches/Team Stats Games, Best & Fairest, Dashboard/Feed replacement, P1-15, or any backend change.

## Original P1-13 Gap

`/profile` and `/users/:id` already rendered identity, follow state, season/career statistics and game history, and already exposed a Posts tab. That tab was a permanent “No posts yet” placeholder: it issued no post query, could not distinguish an empty list from failure or restricted access, and offered no recap navigation. The same audit finding also records the missing Player Card Album entry, which remains a separate open slice.

## Mobile Profile Posts Baseline

The reachable mobile `ProfileScreen` mounts `useProfilePostsInfinite`, which calls `fetchProfilePostsPage` for the exact viewed `authorId`. It requests 20 posts ordered newest first, deduplicates pages by post ID, and advances from the final creation timestamp. Own mode consumes both deployed visibility values. Other-user mode starts with public posts and adds follower posts only when the viewer is the author or follows the author.

The mobile repository checks either-direction blocks before reading posts, requires `hidden_at` to be null, and passes rows through its viewer moderation filters so a viewer does not see posts they reported. The profile query deliberately does not apply the general-feed Team Selection exclusion. Mobile renders the resulting feed items with the shared `FeedPostCard` switch and shows “No posts yet” when an accessible list is empty.

## Supported Post Types

Profile eligibility is author and permission based, not a hard-coded type allowlist. This preserves the current mobile behavior:

- `player_stat_card` renders as a player-stat recap, including its existing persisted card image, and targets the tracked game with the stable profile user ID.
- `manual_game_summary` or a row with `manual_game_id` renders as a manual recap, exposes available payload opponent/round/venue/headline stats, and targets the manual summary.
- Other rows with `game_id` render as team tracked recaps. Deployed game, squad and counted-event reads hydrate team names, match context and score.
- `team_selection` remains eligible because mobile profile reads do not exclude it. Its canonical payload context is displayed and its nearest supported web destination is the team Activity tab. This stage does not add a Team Selection editor or detail surface.
- Null, unknown and future authored types degrade to a generic post. They display only persisted body/image/count content and do not fabricate navigation without a supported stable identifier.

Admin/global posts do not appear merely because they exist: the repository always applies `author_id = viewedUserId`.

## Own Profile

The `/profile` route passes the authenticated user as both author and viewer only after the current profile dataset resolves. Its post read includes both public and follower visibility values, but still excludes platform-hidden and viewer-reported rows. The profile does not treat ownership as permission to reveal a platform-hidden post. Empty copy is specific to the owner, and the existing Stats and Games panels are unchanged.

## Other User Profile

The `/users/:id` route passes the route ID as the author and never falls back to the signed-in user. The signed-in ID is used only as viewer context for the block, follow, report and RLS contracts. A profile lookup failure remains the page-level unavailable state. Following or unfollowing from the existing profile hero refreshes an open Posts tab, so follower-only rows do not remain stale.

## Visibility / Blocks / Hidden Posts

The repository preserves the deployed authority chain:

`posts RLS + exact author` → `hidden_at is null` → `public/follower product filter` → `f_users_blocked` → viewer's existing `post_reports` → normalized profile page.

An either-direction block returns an explicit `blocked` access result before the post query, and the UI shows unavailable content rather than a false empty history. Platform-hidden rows are always excluded, including on the author's own profile. Posts reported by the current viewer are excluded through the existing reporter-readable moderation table. The implementation adds no policy, RLS or moderation mutation.

## Navigation

Navigation is resolved by a pure adapter:

| Post | Destination |
|---|---|
| Player stat recap with game ID | `/games/:gameId?profileUserId=:authorId` |
| Team tracked recap with game ID | `/games/:gameId` |
| Manual recap with manual ID | `/games/manual/:manualGameId` |
| Team Selection with squad ID | `/teams/:squadId?tab=activity` |
| Unsupported or incomplete record | No fabricated link |

All route segments and the profile query value are encoded independently. No profile post is routed to Dashboard or a nonexistent Feed detail route.

## Pagination

The repository requests 21 rows to expose a 20-item page and uses `(created_at, id)` descending keyset pagination. The ID tie-breaker makes equal timestamps deterministic. Page merging deduplicates by post ID and preserves newest-first order. “Load more” is shown only when another page exists, disables while pending, and never fetches the full history eagerly.

## Files Changed

- `src/lib/canonical/profile-posts.ts`
- `src/lib/profile-posts.ts`
- `src/hooks/useProfilePosts.ts`
- `src/components/portal/PostActivityCard.tsx`
- `src/routes/portal/ProfilePage.tsx`
- `tests/profile-post-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_PROFILE_POSTS.md`

## Tests

Thirty-five focused contracts cover exact own/other identity, public/follower visibility, supported and future post types, nested mobile payload context, manual headline stats, stable destinations, encoded IDs, deterministic ordering, compound cursors, deduplication, block-before-read behavior, hidden/moderation query boundaries, distinct loading/blocked/empty/error states, shared rendering, existing Stats/Game Log wiring, read-only social counts and the zero-backend-change boundary.

## Validation

- Focused profile-post contracts: 35/35 passed.
- Full web suite: 226/226 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with only the existing Browserslist-age and large-chunk advisories.
- `git diff --check`: passed.
- Lint: not configured in `package.json`.

## Album Status

At completion of this Profile Posts stage, Album remained **OPEN / OUT OF SCOPE**, not migration-deferred. It was subsequently completed as a separate owner-only consumption slice on 9 September 2026 using the existing cloud-backed contracts. See `docs/WEB_MOBILE_PARITY_P1_PLAYER_CARD_ALBUM.md`.

## Remaining Risks

- Hosted role/data smoke tests remain necessary for public, follower, blocked, viewer-reported and platform-hidden combinations.
- The web has no existing reusable likes/comments interaction surface. Counts are intentionally read-only; adding mutations belongs with a future general social/feed contract, not this profile slice.
- Mobile uses creation-time-only pagination; web adds the backend-compatible ID tie-breaker to avoid skips at identical timestamps. Representative hosted data should confirm PostgREST compound-filter behavior.
- Unknown post types remain visible like mobile but intentionally receive generic presentation until a canonical renderer exists.

## Recommended Next Stage

This historical recommendation was completed by the separate Player Card Album stage on 9 September 2026. P1-09 Team Selection remains **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited.
