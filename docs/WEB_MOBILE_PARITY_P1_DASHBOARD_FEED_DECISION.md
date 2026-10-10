# P1 Dashboard / Feed Product Decision

## Current Problem

Mobile opens authenticated users on Feed. Web opens authenticated users on Dashboard. The original P1-08 finding treated this structural difference and the Dashboard's then-incorrect embedded stats as one issue.

The canonical leaderboard and notification-contract defects have since been remediated. The remaining question is whether Dashboard denies web users an important product outcome merely because it is not shaped like the mobile Feed.

This decision is based on current reachable source, repositories, routes, tests, ordered backend migrations, and current documentation. Visual capture was attempted, but the in-app browser blocked the local development URL and Chrome was unavailable. Authenticated visual, keyboard, responsive, and accessibility behaviour was therefore not claimed or used as evidence.

## Mobile Feed Baseline

The current mobile tab layout sets `feed` as `initialRouteName`; the older dashboard-like `/(tabs)/index` is hidden from tab navigation. Root and legacy home routes redirect to Feed.

### Mobile Feed User Outcomes

| Capability | Importance | Data source | Action | Destination | Equivalent already on web? |
| --- | --- | --- | --- | --- | --- |
| Self and followed-user recap stream | High | Security-invoker `feed` view over `posts`; `useFeed` | Refresh, paginate, open content | Manual summary, tracked/player summary, author profile | Only per-profile Posts; no aggregate home stream |
| Recommended recap posts | Medium | Public `posts` from recommended authors | Open, follow/unfollow | Author profile or recap | No |
| People recommendations | Medium | `profiles_directory`, `follows`, blocks, home club/league/state affinity | Follow/unfollow, dismiss, open profile | User profile | Direct profile following exists; discovery does not |
| Live followed-team games | High | Affiliated clubs, official squads, `games`, `game_squads`, counted events | Open live team summary | Team Tracker summary | Yes: Dashboard Live Around Me and `/match-day` |
| Live/recent followed-player tracker rail | Medium | Follow graph, games, game players, counted events | Open exact player/game summary | Game/player summary | Partly: summaries exist; aggregate rail does not |
| Typed recap rendering | High | Canonical post type/payload plus game/manual/player-card hydration | Read recap and open underlying object | Game, manual game, team, player, profile | Yes on Profile Posts, game summaries, and Player Card Album |
| Likes | Medium | `post_likes` and count triggers | Like/unlike | Same Feed card | No web mutation; counts render on Profile Posts |
| Comments | Medium | `post_comments` and count triggers | Add, expand, edit, delete | Same Feed card | No web comment surface; counts render on Profile Posts |
| Content ownership | Medium | `posts`, storage, server policies | Edit/delete own post; upload a game photo | Same Feed card | Not on Dashboard or Profile Posts |
| Safety and moderation | High when needed | Reports, blocks, hidden state, server policies | Report post/comment, block user | Feed remains filtered | Blocking management exists in Settings and platform moderation in Admin; no contextual post action |
| Offline and refresh feedback | Medium | Network state and React Query lifecycle | Pull to refresh/retry | Feed | Web has page loading/error states but not Feed-specific offline messaging |

Current mobile Feed deliberately excludes `team_selection` from its main Feed query. Team Selection remains visible through team/profile activity contracts, so it is not a missing Dashboard Feed requirement.

## Web Dashboard Baseline

`/dashboard` currently loads one authenticated, desktop-oriented overview with:

- profile identity plus season selector and season totals;
- Quick 6 summary with scope switching;
- next/live/recent match focus with canonical game routing;
- Action Inbox derived from notification contracts;
- recent tracked and manual games;
- managed/member squad shortcuts and pending-attention counts;
- profile snapshot, roles, recent form, and direct Profile access;
- Live Around Me for followed/member squads;
- a canonical leaderboard snapshot linking to `/stats`; and
- Recent Activity containing notification and game-summary events.

Dashboard also provides explicit loading, fatal request error, and section-level empty states. It does not read `feed`, render followed/self posts, expose people/content recommendations, or provide post interactions.

These desktop summaries are useful precisely because the wider viewport can show match, team, performance, and pending-work context together. Their absence from mobile Feed is not automatically a defect.

## Capability Matrix

| Capability | Mobile Feed | Web Dashboard | Elsewhere on Web | Gap? | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Recent posts/activity | Self/followed recap stream | Notifications and games only | Per-profile Posts | A — Must add | Add bounded Community Activity |
| Own posts | Included | Not shown | Own Profile → Posts | B — Elsewhere | Keep Profile as full own-post history; Dashboard may naturally include recent items |
| Followed-user posts | Included | Not shown | Only by visiting each profile | A — Must add | Include through canonical `feed` view |
| Live games | Team and player live rails | Live Around Me + match focus | `/match-day`, game summaries | B/C | Keep current Dashboard adaptation |
| Match Day | Supporting Feed rail | Match focus and Live Around Me | Full `/match-day` parity surface | B/C | No duplication beyond existing snapshot |
| Recent games | Recap posts where published | Dedicated Recent Games | `/games`, Profile game history | C — Desktop difference | Keep Dashboard cards |
| Team/squad shortcuts | Primary Teams tab | My Squads with attention state | `/teams` and team detail | C — Desktop difference | Keep Dashboard workspace shortcuts |
| Leaderboard snapshot | Separate primary tab, not Feed core | Compact canonical teaser | Full `/stats` | C — Desktop difference | Keep Dashboard teaser |
| Notifications | Top-bar access | Action Inbox | Full `/notifications` with shared state | C — Desktop difference | Keep actionable preview |
| Follow recommendations | Conditional rail and posts | None | Follow toggle after reaching a user profile | A, lower priority | Do not mix into first activity slice; reassess from usage |
| Comments/likes | Inline read/write | None | Counts only on Profile Posts | A, separate interaction scope | Show counts in first slice; defer mutations/detail UI |
| Team Selection activity | Excluded from current main Feed | None | Profile Posts and team Activity destination | B/E | No Dashboard work; editable draft parity remains constrained |
| Profile/player-card activity | Typed recap cards | Profile snapshot only | Profile Posts and owner-only Album | B plus small awareness gap | Include eligible post/card activity through canonical Feed rows |
| Reporting/blocking | Contextual Feed actions | None | Blocked Users setting and Admin moderation | B for management, A for contextual action | Keep out of read-only first slice; do not weaken filtering |

Classification meanings: A = must add to Dashboard or a directly connected home outcome; B = already available elsewhere; C = intentional desktop difference; D = mobile-only/not required; E = deferred by an existing constraint.

## Must-Have Missing Outcomes

The only outcome required in the next bounded pass is **recent community awareness**:

- show that the user or someone they follow published a recap;
- preserve the server's feed visibility, hidden, blocked, and reported-content semantics;
- identify the author and recap type;
- expose the stored image and available context without regenerating cards;
- show like/comment counts as social proof; and
- open the author profile or the existing canonical game/manual/team/player destination.

This closes the most material first-screen gap while keeping Dashboard concise. Follow recommendations and inline engagement remain genuine social gaps, but they are not prerequisites for the first home module and should not turn this stage into a full Feed implementation.

## Intentional Desktop Differences

- Dashboard remains the authenticated default and the route name remains `/dashboard`.
- Season, Quick 6, match focus, Action Inbox, recent games, squads, profile form, Live Around Me, and leaderboard cards stay in place.
- The wider desktop surface keeps parallel summary panels rather than a single endless content column.
- Match Day remains the complete live/recent official-game destination.
- Profile remains the complete author-specific Posts destination.
- Notifications remains the complete action inbox.
- Web does not copy native pull-to-refresh, haptics, save-to-Photos, or mobile tab ergonomics.

## Options Considered

### Option 1 — Replace Dashboard

**Rejected.** It would achieve visual/structural similarity at the cost of removing useful desktop performance, team, match, and action context. It would also create a broad Feed implementation with pagination, interaction, moderation, recommendation, and live-refresh risk. Existing links and authenticated redirects already treat `/dashboard` as the stable web home.

Estimated implementation complexity: 9/10. Regression risk: high.

### Option 2 — Dashboard + Activity

**Recommended.** Keep the web-specific overview and add a bounded self/followed Community Activity module. This supplies the missing discovery outcome while reusing the current Feed view, Profile Posts domain model, content destinations, and responsive card language.

Estimated implementation complexity for the approved first slice: 5/10. Regression risk: low-to-medium.

### Option 3 — Dashboard + Separate Feed

**Not currently justified.** A dedicated route would make sense only if web commits to deeper browsing, comments, likes, recommendations, moderation, and post-detail navigation. It adds a primary navigation decision and duplicates live/profile/game content already distributed across strong web surfaces.

Estimated implementation complexity: 8/10. Regression risk: medium-to-high.

## Recommended Direction

Choose **Option 2 — keep Dashboard and add Activity**.

Parity for the signed-in home should be judged by access to important outcomes, not identical information architecture. The Dashboard is a deliberate web workspace; it is not a failed Feed clone. Its missing community-awareness outcome can be added without replacing the route or introducing a second full social product.

## Exact Implementation Scope

The next coding stage should be one controlled, read-only Community Activity slice:

1. Add a small repository function that loads at most six current-user/self-and-followed Feed rows from the existing `feed` view.
2. Preserve server/RLS visibility and also enforce hidden, blocked, and viewer-reported exclusions consistently with Profile Posts.
3. Extract or reuse one canonical row-to-`ProfilePost` adapter rather than duplicating post-type normalization.
4. Reuse `PostActivityCard` where possible, extending it only for author identity/profile navigation and compact Dashboard presentation.
5. Render stored media, canonical post title/context/stats, like/comment counts, author, time, and the existing canonical destination.
6. Replace or clearly separate the current notification/game-only `Recent Activity` label so users can distinguish community posts from operational activity.
7. Provide loading, empty, request-error, retry, and stale-request protection for only this module; the rest of Dashboard must remain usable if community loading fails.
8. Refresh the module on Dashboard focus and after known local post-state invalidation where an existing signal is available. Do not introduce aggressive polling.
9. Add focused repository/domain/component contract tests plus Dashboard regression coverage.

Expected production areas:

- `src/routes/portal/DashboardPage.tsx`
- `src/lib/portal-dashboard.ts` or a bounded `src/lib/dashboard-community.ts`
- `src/lib/profile-posts.ts`
- `src/lib/canonical/profile-posts.ts`
- `src/components/portal/PostActivityCard.tsx`
- a small Dashboard community component/hook if isolation improves failure handling
- focused tests and this audit documentation

## Explicitly Out of Scope

- replacing `/dashboard`;
- adding `/feed` or changing primary navigation;
- infinite scrolling or Feed pagination UI;
- recommended people or recommended public posts;
- like/unlike and comment mutations;
- post/comment editing or deletion;
- post creation or Player Card creation;
- contextual report/block controls;
- a new post-detail route;
- duplicating Match Day live strips;
- Team Selection editing/publication;
- P1-11 Coaches, Team Stats Games, or Best & Fairest work; and
- visual redesign of unrelated Dashboard cards.

## Backend Compatibility

Existing backend contracts are sufficient for the approved first slice:

- the security-invoker `feed` view already limits its base stream to the signed-in user and followed authors;
- `posts` RLS and `hidden_at` semantics remain canonical;
- existing `f_users_blocked`, `post_reports`, profiles, game/manual identity, and storage URL patterns already support filtering and hydration; and
- the Profile Posts canonical model already recognizes player-stat, manual-game, tracked-game, Team Selection, and generic post fallbacks.

The implementation must verify the final ordered definition and policy behaviour rather than assuming the view alone covers every moderation exclusion. No new persistence contract is needed.

## Regression Risks

- accidentally broadening Feed scope beyond self/followed authors;
- leaking follower-only, hidden, blocked, or reported content;
- duplicating normalization and drifting from Profile Posts;
- fetching game context per card and creating avoidable query fan-out;
- one community request failure taking down the whole Dashboard;
- confusing operational `Recent Activity` with community posts; and
- stretching a six-item module into an unbounded Feed route.

## Testing Required

- self and followed authors are included; unrelated authors are excluded;
- public and eligible follower visibility round-trip correctly;
- hidden, blocked, and viewer-reported posts are excluded;
- stable newest-first ordering and deduplication hold;
- each supported/unknown post type renders safely through the canonical adapter;
- author and game/manual/team/player destinations preserve stable IDs;
- missing images, payload fields, or destinations degrade safely;
- module loading, empty, error, retry, and stale-response states are distinct;
- a community module failure does not replace existing Dashboard data;
- existing Match Focus, Action Inbox, Recent Games, Squads, Profile, Live Around Me, and Leaderboard cards remain wired; and
- full tests, typecheck, build, and `git diff --check` pass.

Authenticated screenshot, keyboard, zoom/reflow, and assistive-technology checks remain required during the implementation stage because they could not be captured in this decision run.

## Expected Parity Impact

This documentation-only decision does not change the current estimated score: **86/100**.

Completing the approved Community Activity slice is expected to raise parity to approximately **88/100**. It would resolve the material home-awareness gap without claiming full mobile social interaction parity.

## Remaining P1 Work After This

- implement the approved P1-08 Community Activity slice;
- complete P1-11 Coaches / Team Stats Games;
- complete P1-11 Best & Fairest / voting;
- keep P1-09 Team Selection **DEFERRED / PRODUCT CONSTRAINT** while migrations are prohibited; and
- keep P1-15 admin Player Card authoring **DEFERRED / PRODUCT CONSTRAINT** until a separately approved creator scope exists.
