# P1 Dashboard Community Activity

## Scope

This stage resolves P1-08 through the approved bounded Dashboard adaptation. It adds recent community awareness to `/dashboard` without replacing the desktop home, adding a Feed route, or expanding social mutations.

## Approved Product Decision

The implemented decision is **Option 2 — keep Dashboard and add Activity**. Dashboard remains the signed-in desktop home. Community Activity is an additive, read-only module with a maximum of six posts.

## Mobile Feed Outcome Being Addressed

Web users can now see that they or somebody they follow published recent recap/activity content. Cards expose the author, canonical activity kind and context, stored image where present, existing like/comment counts, publication time and a safe canonical destination.

This addresses community awareness, not the complete mobile Feed product. It does not implement endless browsing, recommended authors/posts, likes, comments, post management, contextual reporting or blocking.

## Existing Dashboard Preserved

The stage retains:

- season identity and totals;
- Quick 6;
- match focus;
- Action Inbox;
- recent games;
- My Squads shortcuts;
- Profile Snapshot;
- Live Around Me;
- Leaderboard Snapshot; and
- existing notification/game movement, now clearly labelled **Portal Activity**.

Community query failure cannot replace those areas because its repository hook and UI state are independent of `loadDashboardData`.

## Data Source

`listDashboardCommunityPosts` reads the deployed security-invoker `feed` view in stable `created_at DESC, id DESC` order and caps the request at six rows. The view supplies author name/avatar fields together with canonical post data, avoiding per-card profile requests.

Both Dashboard Activity and Profile Posts use `normalizeProfilePostRow`. Relative stored post paths use the established public-storage URL resolver; avatar paths use the deployed `profile-avatars` bucket. Tracked team-game context is batch-hydrated through the existing games, game-squads and counted-events queries rather than per card.

The web application currently has no TanStack Query dependency or query client. This bounded stage therefore uses the established repository/hook pattern with request-version protection and browser-focus refresh. It adds neither an app-wide cache migration nor polling.

## Visibility Semantics

The deployed `feed` view scopes base rows to the signed-in author or authors they follow. Because it is security-invoker, the posts SELECT policy remains authoritative and excludes platform-hidden rows for normal users.

The client also applies the same moderation defense used by mobile:

- current follows are loaded and arbitrary/global authors are rejected locally;
- either-direction block rows involving the viewer exclude that author;
- post IDs reported by the viewer are excluded;
- public posts are accepted for self/followed authors;
- follower-only posts require self/followed eligibility;
- missing identifiers/dates are discarded; and
- rows are normalized, de-duplicated and capped before rendering.

No visibility or moderation rule is implemented in Dashboard JSX.

## Supported Post Types

The shared canonical post-kind adapter and `PostActivityCard` render:

- Player stat cards;
- manual game recaps;
- tracked team-game recaps;
- Team Selection activity; and
- safe generic fallback content for unknown/future types.

No Dashboard-specific post type or renderer was created.

## Rendering / Navigation

Cards preserve the row's exact stable author ID and display name/avatar when available. Author links use `/profile` for the signed-in user and `/users/:id` for another author.

Existing canonical destinations remain unchanged:

- Player stat card → `/games/:gameId?profileUserId=:authorId`;
- tracked team recap → `/games/:gameId`;
- manual recap → `/games/manual/:manualGameId`;
- Team Selection → `/teams/:squadId?tab=activity`; and
- generic/unsupported content without a safe identity → no fabricated content link.

Stored media is lazy-loaded with preserved aspect ratio, descriptive alternative text and an explicit failed-image fallback. Text-only posts remain valid. Like/comment counts are informational and have no mutation handlers.

## Loading / Empty / Error / Retry

The module owns four explicit states:

- local skeleton cards while loading;
- a non-error explanation when no recent eligible activity exists;
- an announced, isolated error panel; and
- a success grid of at most six cards.

The local **Try again** action reloads only Community Activity. Request IDs prevent stale responses from replacing newer data. Browser focus triggers a reasonable refresh; no timer or aggressive live polling was added.

## Responsive / Accessibility

The module renders as one column at narrow/tablet widths and two columns at large widths. Post stat tiles collapse to two columns on narrow screens, media uses width-constrained `object-contain`, and the layout introduces no fixed horizontal width.

Author/content links and retry actions are keyboard-focusable with visible focus treatment. The loading region exposes busy text, errors use `role="alert"`, icons used only for decoration are hidden from assistive technology, avatars/media have useful alternative text, and loading motion respects reduced-motion preferences.

Static source/type/build verification covered these properties. Authenticated browser credentials were not available, so screenshot, keyboard, zoom/reflow and assistive-technology execution were not claimed.

## Files Changed

- `src/lib/canonical/profile-posts.ts`
- `src/lib/profile-posts.ts`
- `src/hooks/useDashboardCommunityActivity.ts`
- `src/components/dashboard/DashboardCommunityActivity.tsx`
- `src/components/portal/PostActivityCard.tsx`
- `src/routes/portal/DashboardPage.tsx`
- `tests/dashboard-community-activity-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_DASHBOARD_ACTIVITY.md`

## Tests

Fifty focused tests cover self/followed scope, six-row maximum, stable order/de-duplication, identity, shared normalization, hidden-policy reliance, blocks, reports, visibility, supported/generic rendering, media/counts, exact author/content destinations, isolated states, retry/focus behavior, stale responses, responsive structure and regressions around the retained Dashboard, Profile Posts, Player Card Album, Match Day and Notifications.

## Validation

- Focused Community Activity tests: **50 passed**.
- Full web suite: **317 passed**.
- TypeScript typecheck: **passed**.
- Production build: **passed** (`vite` transformed 2,127 modules).
- `git diff --check`: **passed**.
- Lint: no lint script is configured.

Existing Browserslist-age and bundle-size warnings remain non-blocking unless the final build materially changes them.

## Intentional Differences from Mobile Feed

- Dashboard remains the authenticated home and a desktop overview.
- Activity is limited to six self/followed posts and has no pagination.
- No recommended/global posts or people recommendations are included.
- Like/comment counts are read-only.
- No post creation/edit/delete, comments, report/block controls or dedicated post route is added.
- Existing Match Day, game, profile, team, notification and leaderboard surfaces remain the full destinations for their domains.

## P1-08 Final Status

**RESOLVED — approved Dashboard + bounded Community Activity outcome implemented.** Estimated parity increases from **86/100** to **88/100**.

## Remaining P1 Work

- P1-11 Coaches / Team Stats Games.
- P1-11 Best & Fairest / voting management.
- P1-09 Team Selection remains **DEFERRED / PRODUCT CONSTRAINT** because migrations are prohibited.
- P1-15 admin Player Card authoring remains **DEFERRED / PRODUCT CONSTRAINT** pending a separately approved creator scope.

## Recommended Next Stage

Proceed with the remaining P1-11 **Coaches / Team Stats Games** slice. It is a core team workflow, uses existing deployed backend contracts, and can be kept separate from Best & Fairest/voting. Do not resume Team Selection or admin creator work under the current product constraints.
