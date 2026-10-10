# KickChasers Web ↔ Mobile Parity Audit

## Final parity and release-readiness status — 13 September 2026

The whole-product audit has now been recalculated from current code, completed parity reports, current mobile documentation/source, a deployed Supabase schema probe, browser inspection and the full web suite. The independent score is **93/100** rather than inheriting the earlier estimate.

One code-level release blocker was found and fixed: tracked summaries requested `stat_definition_id` from the deployed `v_counted_events` view, which returned Postgres `42703` and prevented every affected summary from loading. The web now queries only deployed counted-view columns and resolves optional custom-stat metadata by canonical `stat_key`. The corrected query was verified against the deployed schema.

The audit also added a branded catch-all route, kept legal/support pages available while signed in, made the mock vote-card route development-only in production builds, and redirected the stale `/squad` alias to `/teams`. No backend or migration change was made.

Final gate: **READY FOR STAGING VALIDATION**. Remaining code-level blockers: **0**. Production approval still requires the hosted role/RLS/OAuth/storage/Realtime/public-token/responsive/accessibility smoke plan and explicit disposition of the existing broad-authenticated match/squad visibility model. P1-09 remains a future backend/product project; P1-15 is intentional mobile-only creation for the current release. See `docs/WEB_MOBILE_PARITY_FINAL_RELEASE_AUDIT.md`.

Audit date: 18 August 2026  
Scope: current web routes in `src/main.tsx`, compared with reachable mobile code and the ordered Supabase migrations. This is an audit and implementation plan only; no application or backend changes were made.

## 1. Executive Summary

The audit found **62 reachable web route patterns**: **12 PASS**, **29 PARTIAL**, **14 FAIL**, **0 UNKNOWN**, and **7 intentional WEB-ONLY routes**. Among comparable routes, the simple auth/account paths are the most complete; the weakest areas are stats, game summaries, team selection, notifications, and admin decisions.

The report records **32 actionable findings**: **5 P0**, **16 P1**, **8 P2**, and **3 P3**. Overall parity is **46/100 — partial, with release-blocking data-integrity risks**. This score weights correct data, authority, permissions, and user outcomes more heavily than visual similarity. The public shell is visually strong, but several polished pages produce different results from mobile or cannot complete their primary action.

The five P0s should block new web feature development that consumes stats or admin decisions:

1. Global leaderboards use a different authority and include data mobile deliberately excludes.
2. Event modifiers can be counted as additional base stats; fantasy totals also differ.
3. Web benchmarks and “game rating” are not the mobile position-aware Impact 7 calculation.
4. The platform-admin UI gate is derived from a module-global pathname and can be stale after client navigation.
5. Directory-request approvals reimplement a multi-write backend workflow instead of using its canonical atomic RPC.

No new migration was required to begin Stage 0/P0 remediation. The safest first move was to make web consume the backend contracts already used by mobile, then place parity fixtures around the shared domain rules. P1-09 is the first re-verified stage that requires a new backend contract; its stop-condition record appears below.

### Stage 0 + P0 remediation status — 18 August 2026

Stage 0 and all five P0 code remediations have now been implemented. See `docs/WEB_MOBILE_PARITY_STAGE_0_P0.md` for the complete change/validation record.

| Finding | Before | Fix | Primary files | Validation | Result | Remaining risk |
|---|---|---|---|---|---|---|
| P0-01 | Broad `v_counted_events`; Team Stats Game/row-cap/dedup risk | Official side-qualified view, mode exclusion, pagination, dedup, player snapshot enrichment, season bounds | `portal-stats.ts`, canonical leaderboard/event modules | Golden countability/dedup/manual fixtures; typecheck/build | RESOLVED | Staging production-like dataset comparison |
| P0-02 | Base/modifier inflation and divergent fantasy | Mobile event reconciler used by leaderboard, summaries and profile | `portal-stats.ts`, `portal-games.ts`, `portal-game-summary.ts`, `portal-profile.ts` | Basic, modifier-only, sequence and quarter fixtures | RESOLVED | Sanitized historical-event smoke test |
| P0-03 | Web-only rating/generic bands; no Ruck | Canonical Impact 7, position resolver and benchmark engine | canonical benchmark/evaluation modules, `portal-profile.ts`, `ProfilePage.tsx` | Exact Forward/Mid/Defender/Ruck/Default fixtures | RESOLVED | Extract one physical shared package later |
| P0-04 | Module-global stale route flag and noncanonical fallback read | Current React Router path, focus/navigation recheck, `f_is_platform_admin()` only | `PortalLayout.tsx`, `platform-admin.ts`, admin contracts | Five-role fixture and migration/RLS inspection | RESOLVED IN CODE | Staging direct-URL/revocation/RLS matrix |
| P0-05 | Multi-call browser approval transaction | Canonical atomic RPC for league/club approve and decline | `portal-admin.ts`, request list/detail pages | RPC argument/kind fixtures and migration trace | RESOLVED IN CODE | Staging atomicity/duplicate/interruption test |

No migration or backend policy/function change was made. Updated estimated parity is **58/100**. P1 development can proceed after review, but production release remains gated on the listed staging checks.

### P1 Games Stage 1 remediation status — 18 August 2026

P1-02, P1-03, P1-04, P1-06 and P1-07 are now resolved for the approved functional scope. Tracked/manual summaries share canonical totals and Impact 7 semantics, exact game-player navigation is active, and Match Day/live-summary polling matches mobile eligibility and lifecycle behavior. See `docs/WEB_MOBILE_PARITY_P1_GAMES.md`.

No migration, RLS change or tracker-write change was made. After the migration-free P1 Canonical Leaderboard Filters remediation, updated estimated parity is **82/100**. Production release still requires the Stage 0 role/transaction gates plus hosted-data smoke tests for leaderboard filter combinations, custom definitions, live-clock visibility, manual post hydration, official Match Day side/league combinations and representative permitted/denied game deep links.

### P1 Route Safety remediation status — 18 August 2026

P1-05 and P1-16 are resolved. `/game/:gameId` now crosses the existing session/onboarding boundary before it canonicalizes to `/games/:id`; email/password, OAuth, registration/verification and incomplete onboarding preserve only a validated root-relative return path. The landing primary CTA targets Dashboard instead of disabled New Game. Anonymous game access remains intentionally unsupported, and vote-card/public informational routes are unchanged. See `docs/WEB_MOBILE_PARITY_P1_ROUTE_SAFETY.md`.

### P1 Canonical Position Inputs remediation status — 5 September 2026

P1-10 and P1-12 are resolved. Active onboarding/profile-edit and roster-edit forms now consume one canonical `FWD`/`MID`/`RUC`/`DEF` value-label registry matching current mobile and backend constraints. Ruck hydrates and saves as `RUC`; known mobile aliases normalize at read/write boundaries; unsupported values fail before persistence; nullable profile/roster semantics remain intact. The Stage 0 benchmark resolver consumes the same canonical normalizer while preserving its historical composite-group compatibility. See `docs/WEB_MOBILE_PARITY_P1_POSITIONS.md`.

### P1 Canonical Leaderboard Filters remediation status — 5 September 2026

P1-01 is resolved. `/stats` now consumes one canonical mobile-matching leaderboard metadata/filter module: the All Leaders selector exposes the current 21 tracked stats in mobile order and wording, while Fantasy remains featured-only. All Leaders filters the complete canonical population by represented state, dependent league/club IDs and the exact mobile age bands; invalid child selections clear predictably. Featured rankings aggregate per player-game and apply mobile caps, All Leaders uses uncapped player totals, and tied positive values receive ordinal ranks in stable source order. Calendar-season and rolling-seven-day bounds are explicit. The P0 official view, Team Stats Game exclusion, deduplication and event reconciliation are unchanged. See `docs/WEB_MOBILE_PARITY_P1_LEADERBOARD_FILTERS.md`.

### P1-11 Player Groups / Sides remediation status — 5 September 2026

The player-groups/sides sub-slice of P1-11 is resolved. The team hub now lists active sides in canonical order with member/primary counts; supports create, rename and archive through deployed RPCs; and atomically assigns accepted linked or guest roster identities to multiple groups with one optional primary group. Roster rows display all active memberships and identify the primary side. Runtime read/manage gates come from the deployed capability functions, preserving custom-versus-official role differences and platform-admin authority.

The web read path intentionally does not call the mobile repository's mutating ensure/backfill functions on page load. Existing persisted groups are read through RLS, and changes occur only after an explicit authorized action. Coaches/Team Stats Games and Best & Fairest/voting remain open P1-11 slices. No backend change was made. Updated estimated parity is **84/100**. See `docs/WEB_MOBILE_PARITY_P1_PLAYER_GROUPS.md`.

### P1-11 Coaches / Team Stats Games remediation status — 13 September 2026

The Coaches / Team Stats Games sub-slice of P1-11 is resolved. The existing team hub now exposes a role-gated Coaches tab to the exact current mobile audience: custom owners and accepted admins, official owners/club admins/club coaches, and platform admins. Custom coaches, trackers, ordinary members, guests and unrelated users remain excluded. The repository rechecks signed-in server-backed authority before querying and filters by both exact squad link and `tracker_mode = team_stats_game`.

The read-only list includes scheduled, live and final games, canonical score/status/quarter context, focus refresh, and 10-second polling only while a visible live game exists. Cards open the existing `/games/:id` canonical summary, which defaults playerless Team Stats Games to Team and hides the player surface. Match Day, player history, squad activity and leaderboards continue to exclude Team Stats Games. Creation, tracking/resume, archive and delete remain intentionally omitted because web has no supported Team Stats tracker route or canonical management action. No backend change or migration was made. P1-11 remains **PARTIAL** only for Best & Fairest/voting. Updated estimated parity is **91/100**. See `docs/WEB_MOBILE_PARITY_P1_COACHES_TEAM_STATS.md`.

### P1-11 Best & Fairest / Voting remediation status — 13 September 2026

The final supported P1-11 slice is resolved. The existing team hub now discovers voting through the deployed `f_can_manage_squad_votes` capability and provides active/archived vote groups, eligible linked/guest roster members, award-template create/edit/delete, manual and tracked-game matchups, generated cards, internal and external assignment, authenticated assigned-card voting, existing anonymous token voting, matchup breakdowns, and private server-produced tallies.

All vote mutations use existing guarded RPCs. Candidate and submission identities remain source-specific (`game_player_id` for tracked matchups and `squad_member_id` for manual matchups). Interim tallies, breakdowns, voter details and raw entries remain manager-only through `f_can_view_squad_vote_tallies`; assigned users receive only the card context authorised by `f_can_access_vote_card`; anonymous reads and submissions remain scoped to the hashed public token RPCs. Assigned/reminder notifications now open the exact protected card route when card identity is present. No migration, schema, RLS, grant, trigger, notification or backend change was made.

P1-11 is now **RESOLVED** for all current implementation-eligible mobile functionality. Updated estimated parity is **96/100**. P1-09 Team Selection cross-device persistence and P1-15 admin Player Card/manual authoring remain **DEFERRED / PRODUCT CONSTRAINT** rather than implementation-ready work. See `docs/WEB_MOBILE_PARITY_P1_BEST_AND_FAIREST.md`.

### P1-13 Profile Posts remediation status — 6 September 2026

The Profile Posts sub-slice of P1-13 is resolved. The existing Posts tab now loads the exact viewed author's current mobile-eligible post activity for both `/profile` and `/users/:id`, using deployed post, follow, block and moderation contracts. Public/follower visibility, platform-hidden rows, either-direction blocks, viewer-reported posts, stable 20-row keyset pagination and distinct loading/blocked/empty/error states are handled outside `ProfilePage`. Player-card, manual-game, team-game, Team Selection and unknown/future authored posts share one normalized renderer and route to the best canonical web destination where one exists. Counts are informational because web has no existing reusable social mutation surface.

P1-13 remains **PARTIALLY RESOLVED — Profile Posts complete, Album still open**. Mobile's Album is a separate production, cloud-backed `player_cards` product with owner-only RLS and guarded RPCs; its backend does exist, so it is not migration-blocked, but its web surface was explicitly outside this stage. Awards also remain an unreliable parity target. No backend change was made. Updated estimated parity is **85/100**. See `docs/WEB_MOBILE_PARITY_P1_PROFILE_POSTS.md`.

### P1-13 Player Card Album remediation status — 9 September 2026

The Player Card Album sub-slice is resolved and completes P1-13's reliable current mobile targets. The signed-in user's profile now exposes an owner-only Album backed directly by deployed `player_cards` rows and `rpc_player_card_album_summary`. Ready, non-deleted cards use stable 20-row `(created_at, id)` pagination, preserve source/game/player and post-history identity, display the authoritative stored 1080×1350 asset without regeneration, and open an authenticated card preview with safe game/manual navigation where identifiers exist. Other-user profiles never expose Album, matching the owner-only mobile surface and RLS policy.

Missing or failed assets, loading, empty, request failure and end-of-list are distinct. Browser-native sharing and opening the original stored image are progressive enhancements; card creation, replacement, Feed publication and deletion remain outside this consumption slice. Device-local Player Images and cutout drafts are not represented as cloud-synced. No backend or storage mutation was added. P1-13 is now **RESOLVED** and updated estimated parity is **86/100**. See `docs/WEB_MOBILE_PARITY_P1_PLAYER_CARD_ALBUM.md`.

### P1-08 Dashboard Community Activity remediation status — 10 September 2026

P1-08 is resolved for the approved Dashboard + Activity outcome. `/dashboard` remains the signed-in desktop home and preserves Quick 6, season/match context, Action Inbox, recent games, squad shortcuts, profile snapshot, Live Around Me, leaderboard snapshot and operational Portal Activity. A separately isolated Community Activity module now reads at most six recent rows from the deployed security-invoker `feed` view, reuses the Profile Posts canonical adapter and shared activity card, and preserves exact author, game, manual-game and squad identities.

The stream is restricted to the signed-in user and followed authors, with a local defense-in-depth scope/visibility check. Existing post RLS excludes platform-hidden rows; current follow, either-direction block and viewer-report contracts exclude ineligible authors/posts. Stored media, author avatars, post context and read-only like/comment counts render where present. Loading, empty, request-error and retry states remain local to the module, with stale-response protection and browser-focus refresh but no polling or pagination. No Feed route, recommendation system, social mutation, schema, RPC, policy or migration was added. Updated estimated parity is **88/100**. See `docs/WEB_MOBILE_PARITY_P1_DASHBOARD_ACTIVITY.md`.

### P1 Team Selection Stage 2 decision status — 18 August 2026

P1-09 was re-verified against the reachable mobile editor and ordered migrations. Contrary to the original audit wording, mobile does not persist an editable Team Selection canonically: its setup draft and recent-side lineups are stored in device `AsyncStorage`, while “Save lineup” captures a PNG to the device photo library. The only server mutation is the create-only `rpc_create_team_selection_post`; the corresponding list RPC reads published posts rather than editable drafts.

Using published `posts.payload` as draft storage would publish while saving, send notifications, create duplicates, and still lose empty-slot and stable context identity. Product direction now prohibits new database migrations, so the unrun proposed Team Selection migration and its dependent tests/design document were removed without a rollback migration. P1-09 is **DEFERRED / PRODUCT CONSTRAINT** and is not resolved. Subsequent migration-free Notifications, Route Safety, Canonical Position Inputs and Canonical Leaderboard Filters stages move overall estimated parity to **82/100**. See `docs/WEB_MOBILE_PARITY_P1_TEAM_SELECTION.md`, `docs/WEB_MOBILE_PARITY_P1_NOTIFICATIONS.md`, `docs/WEB_MOBILE_PARITY_P1_ROUTE_SAFETY.md`, `docs/WEB_MOBILE_PARITY_P1_POSITIONS.md` and `docs/WEB_MOBILE_PARITY_P1_LEADERBOARD_FILTERS.md`.

## 2. Source of Truth

Authority was applied in this order:

1. Reachable mobile production code in `/Users/jackpenfold/Projects/kickchasers-mobile`, branch `feature/player-card-album-production`.
2. Ordered migrations in `/Users/jackpenfold/Projects/kickchasers-mobile/supabase/migrations`, including the official-counted-event view, directory-decision RPC, Ruck position, and live-clock migrations through `20260812210000`.
3. Current documentation copied to `docs/Mobile App Docs/docs`, beginning with `DOCUMENTATION_INDEX.md` and the requested product, route/query, component, design, backend, RLS, roles, notifications, benchmarks, sequencing, and player-card documents.
4. Historical/design documents only as background, never as proof of current behaviour.

The web implementation audited is `/Users/jackpenfold/Projects/kickchasers`. It has no independent migration authority; it shares the mobile/backend Supabase project. Generated TypeScript database types were treated as convenience types, not schema truth.

Verified limitations:

- Public landing and sign-in states were inspected in a running desktop browser at 1440×900. Authenticated screens could not be visually exercised without test credentials, so their data, mutation, role, and navigation behaviour was traced statically from route to Supabase boundary.
- No production data was mutated and no RLS probe was performed against a hosted environment. Permission conclusions distinguish confirmed client defects from backend risks requiring role-matrix verification.
- Native-only behaviour such as push delivery, offline SQLite, haptics, orientation, and save-to-Photos was established from code/docs but not executed on a device.
- The mobile repository is outside this web repository. Shared extraction recommendations therefore describe a target architecture, not an assumed existing monorepo.

Baseline checks: web `npm run build` passed (`tsc -b && vite build`) with an outdated Browserslist warning and a 1.63 MB main chunk warning. No standalone web lint or test script exists. Mobile checks and audit-file validation are recorded at the end of this report.

## 3. Web Route Inventory

Abbreviations: `auth` = Supabase Auth; `tables/views` names are listed where they determine behaviour; “portal libs” refers to the named `src/lib/portal-*.ts` boundary. Roles shown are the intended UI audience, not proof that RLS grants the operation.

| # | Web route | Main component | Purpose | Auth | Roles | Primary data sources | Mutations | Mobile equivalent | Status |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `/vote-card/dev` | `src/routes/PublicVoteCardDevPage.tsx` | Mock vote-card preview | No | Anyone | `src/mocks/devVoteCard.ts` | Local mock vote | None; development fixture | FAIL |
| 2 | `/vote-card/:token` | `src/routes/PublicVoteCardPage.tsx` | Anonymous Best & Fairest vote card | No | Token holder | vote-card RPCs | Submit token vote | `app/vote-card/[token].tsx` | PASS |
| 3 | `/` | `src/routes/Landing.tsx` | Marketing landing | No | Anyone | Static content/assets | Navigation | Native app has no landing | WEB-ONLY |
| 4 | `/landing` | `src/routes/Landing.tsx` | Landing alias | No | Anyone | Static content/assets | Navigation | None | WEB-ONLY |
| 5 | `/how-it-works` | `src/routes/HowItWorks.tsx` | Product explanation | No | Anyone | Static content | Navigation | On-device help is distributed | WEB-ONLY |
| 6 | `/terms` | `src/routes/LegalDocumentPage.tsx` | Terms | No | Anyone | `src/content/legalDocuments.ts` | None | Settings legal link/document | WEB-ONLY |
| 7 | `/privacy` | `src/routes/LegalDocumentPage.tsx` | Privacy policy | No | Anyone | `src/content/legalDocuments.ts` | None | Settings legal link/document | WEB-ONLY |
| 8 | `/community-guidelines` | `src/routes/LegalDocumentPage.tsx` | Community rules | No | Anyone | `src/content/legalDocuments.ts` | None | Community/reporting surfaces | WEB-ONLY |
| 9 | `/support` | `src/routes/LegalDocumentPage.tsx` | Support information | No | Anyone | `src/content/legalDocuments.ts` | None | Settings support action | WEB-ONLY |
| 10 | `/login` | `src/routes/auth/Login.tsx` | Sign in alias | No | Signed-out user | auth | Password/OAuth sign-in | `app/(auth)/sign-in.tsx` | PASS |
| 11 | `/sign-in` | `src/routes/auth/Login.tsx` | Sign in | No | Signed-out user | auth | Password/OAuth sign-in | `app/(auth)/sign-in.tsx` | PASS |
| 12 | `/register` | `src/routes/auth/Register.tsx` | Registration alias | No | Signed-out user | auth, profiles | Sign up | `app/(auth)/sign-up.tsx` | PASS |
| 13 | `/signup` | `src/routes/auth/Register.tsx` | Registration alias | No | Signed-out user | auth, profiles | Sign up | `app/(auth)/sign-up.tsx` | PASS |
| 14 | `/sign-up` | `src/routes/auth/Register.tsx` | Registration | No | Signed-out user | auth, profiles | Sign up | `app/(auth)/sign-up.tsx` | PASS |
| 15 | `/check-email` | `src/routes/auth/CheckEmail.tsx` | Email confirmation state | No | Registrant | auth state | Resend/navigation | Auth confirmation flow | PASS |
| 16 | `/forgot` | `src/routes/auth/Forgot.tsx` | Request password reset | No | Signed-out user | auth | Send reset email | Mobile forgot-password flow | PASS |
| 17 | `/reset-password` | `src/routes/auth/ResetPassword.tsx` | Set new password | No | Recovery session | auth | Update password | Mobile recovery flow | PASS |
| 18 | `/onboarding` | `src/routes/Onboarding.tsx` | Profile, role, club/squad setup | Yes | User | profiles, directory/squad request helpers | Profile/member/request writes | Mobile onboarding routes/hooks | PARTIAL |
| 19 | `/request-league` | `src/routes/RequestLeague.tsx` | Request directory league | Yes | User | request helpers/tables | Create request | Mobile official-directory request flow | PARTIAL |
| 20 | `/request-club` | `src/routes/RequestClub.tsx` | Request club/squad | Yes | User | request helpers/tables | Create request | Mobile official-directory request flow | PARTIAL |
| 21 | `/game/:gameId` | `src/routes/ProtectedGameRedirect.tsx` | Authenticated shared-link compatibility alias | Yes | Authorized user | Existing session/onboarding gate, then canonical `/games/:id` repository | None | `app/share/game/[id].tsx` is auth-gated | PASS |
| 22 | `/hub` | React Router `Navigate` | Dashboard legacy redirect | Yes | User | None | Redirect | `(tabs)/feed`/home | PARTIAL |
| 23 | `/account/update-email` | React Router `Navigate` | Email settings alias | Yes | User | None | Redirect | Account email setting | PASS |
| 24 | `/squad` | `src/routes/Squad.tsx` | Legacy squad page | Yes | Member | legacy squad queries | Limited squad actions | Modern mobile team detail | FAIL |
| 25 | `/dashboard` | `src/routes/portal/DashboardPage.tsx` | Web home overview | Yes | User | portal dashboard/games/stats/notifications libs | Navigation, notification actions | Feed + Match Day + Leaderboards synthesis | PARTIAL |
| 26 | `/match-day` | `src/routes/portal/MatchDayPage.tsx` | Discover scheduled/live games | Yes | User | games, squads, `v_counted_events` | Manual refresh/navigation | `app/(tabs)/match-day.tsx`, `use-match-day` | PARTIAL |
| 27 | `/teams` | `src/routes/portal/SquadsPage.tsx` | Team list | Yes | User/member | squads/memberships | Join/create navigation | `app/(tabs)/teams.tsx` | PARTIAL |
| 28 | `/teams/new` | `src/routes/portal/SquadCreatePage.tsx` | Create custom team | Yes | User | squads/memberships/storage | Create team | Mobile create-team flow | PARTIAL |
| 29 | `/teams/:id` | `src/routes/portal/SquadDetailPage.tsx` | Team hub, roster, roles, stats | Yes | Member/coach/admin/owner | squads, members, invites, requests, stats, activity | Membership, branding, roster and role actions | `app/squad/[id]/*` | PARTIAL |
| 30 | `/teams/:id/team-selection` | `src/routes/portal/TeamSelectionPage.tsx` | Compose team-selection graphic | Yes | Member/owner | squad, members, local storage | Local lineup/logo and image export only | Mobile team-selection editor/post flow | FAIL |
| 31 | `/squads` | `src/routes/portal/SquadsPage.tsx` | Duplicate team-list alias | Yes | User/member | Same as `/teams` | Same | `app/(tabs)/teams.tsx` | PARTIAL |
| 32 | `/squads/new` | `src/routes/portal/SquadCreatePage.tsx` | Duplicate create alias | Yes | User | Same as `/teams/new` | Create team | Mobile create-team flow | PARTIAL |
| 33 | `/squads/:id` | `src/routes/portal/SquadDetailPage.tsx` | Duplicate team-detail alias | Yes | Member/coach/admin/owner | Same as `/teams/:id` | Same | `app/squad/[id]/*` | PARTIAL |
| 34 | `/squads/:id/team-selection` | `src/routes/portal/TeamSelectionPage.tsx` | Duplicate team-selection alias | Yes | Member/owner | Same as route 30 | Local state/export only | Mobile team-selection editor/post flow | FAIL |
| 35 | `/games` | `src/routes/portal/GamesPage.tsx` | User game history | Yes | User/player/tracker | portal games/profile libs | Filtering/navigation | Profile game history + game lists | PARTIAL |
| 36 | `/games/:id` | `src/routes/portal/GameSummaryPage.tsx` | Tracked-game summary | Yes | User/member/tracker | canonical summary adapter, `v_counted_events`, live-clock RPC | PDF/share/player navigation | Team Tracker summary/player summary | PASS (P1 FUNCTIONAL) |
| 37 | `/games/manual/:id` | `src/routes/portal/ManualGameSummaryPage.tsx` | Manual-game summary | Yes | User | manual totals/post RPC, identity and canonical benchmark adapters | Browser share | `app/games/manual/[id]/summary.tsx` | PASS (P1 FUNCTIONAL) |
| 38 | `/stats` | `src/routes/portal/StatsPage.tsx` | Global leaderboards | Yes | User | `getLeaderboardPlayers`, games, `v_counted_events` | Filters/navigation | `app/(tabs)/leaderboards.tsx` | FAIL |
| 39 | `/notifications` | `src/routes/portal/NotificationsPage.tsx` | Notification inbox/actions | Yes | User/member/tracker | canonical notification RPCs, shared state, Realtime, routing helper | Mark read, invite/join/track decisions | `app/notifications.tsx` + repository/RPCs | PARITY (safe web fallbacks documented) |
| 40 | `/profile` | `src/routes/portal/ProfilePage.tsx` | Own profile, games and stats | Yes | User | portal profile, profiles directory, events/manual games | Follow/edit navigation | `app/(tabs)/me.tsx`, profile routes | PARTIAL |
| 41 | `/users/:id` | `src/routes/portal/ProfilePage.tsx` | Other-user profile | Yes | User | Same as `/profile` | Follow/unfollow | `app/user/[id].tsx` | PARTIAL |
| 42 | `/settings` | `src/routes/portal/SettingsPage.tsx` | Account/settings hub | Yes | User | auth/profile/settings helpers | Sign out, delete account, navigation | Mobile settings routes | PARTIAL |
| 43 | `/settings/update-email` | `src/routes/portal/settings/UpdateEmailPage.tsx` | Change email | Yes | User | auth | Update email | Mobile account-email flow | PASS |
| 44 | `/settings/roles` | `src/routes/portal/settings/RolesPage.tsx` | Role preferences/requests | Yes | User/coach/tracker | profiles, official role requests | Update preferences/create request | Mobile role settings | PARTIAL |
| 45 | `/settings/blocked-users` | `src/routes/portal/settings/BlockedUsersPage.tsx` | Manage blocks | Yes | User | blocks/profiles | Unblock | Mobile blocked-users setting | PASS |
| 46 | `/admin` | `src/routes/portal/AdminPage.tsx` | Platform-admin dashboard | Yes | Platform admin | admin portal helpers | Navigation/admin actions | Mobile admin index/surfaces | PARTIAL |
| 47 | `/admin/leagues` | `src/routes/portal/admin/AdminLeaguesPage.tsx` | Manage official leagues | Yes | Platform admin | leagues/admin helpers | Create/update/delete | Mobile platform-admin league tools | PARTIAL |
| 48 | `/admin/official-squads` | `src/routes/portal/admin/AdminOfficialSquadsPage.tsx` | Manage official squads | Yes | Platform admin | official squads/admin helpers | Create/update | Mobile official-directory admin | PARTIAL |
| 49 | `/admin/moderation` | `src/routes/portal/admin/AdminModerationPage.tsx` | Moderation queue | Yes | Platform admin | reports/moderation helpers | Resolve reports | Mobile moderation admin | PARTIAL |
| 50 | `/admin/users` | `src/routes/portal/admin/AdminUsersPage.tsx` | User/admin management | Yes | Platform admin | profiles/platform_admins | Admin grants/removals and user actions | Mobile platform-admin user tools | PARTIAL |
| 51 | `/admin/requests` | `src/routes/portal/admin/AdminRequestsPage.tsx` | Directory/role request queue | Yes | Platform admin | request tables/admin helpers | Decisions | Mobile request queues | PARTIAL |
| 52 | `/admin/games` | `src/routes/portal/admin/AdminGamesPage.tsx` | Game administration | Yes | Platform admin | games/admin helpers | Administrative game actions | Mobile game admin/finalisation tools | PARTIAL |
| 53 | `/admin/manual-feed-post` | React Router `Navigate` | Legacy admin-authoring compatibility redirect | Yes | Platform admin | Existing `PortalLayout` admin guard | Redirect only | Current mobile Player Card authoring flow | DEFERRED / PRODUCT CONSTRAINT (dead exposure removed) |
| 54 | `/admin/requests/:requestType/:requestId` | `src/routes/portal/admin/AdminRequestDetailPage.tsx` | Decide a request | Yes | Platform admin | `portal-admin`, request tables | Approve/reject | Mobile request decision flow | PARTIAL |
| 55 | `/leagues/:id` | `src/routes/portal/admin/LeagueAdminDetailPage.tsx` | League administration detail | Yes | Platform admin/official role | leagues/clubs/squads/admin helpers | Directory management | Mobile league admin/detail tools | PARTIAL |
| 56 | `/new` | `src/routes/DisabledRoute.tsx` | Legacy new-game entry | Yes | User/tracker | None | None | `app/(tabs)/new-game.tsx` | FAIL |
| 57 | `/newgame/:gameId` | `src/routes/DisabledRoute.tsx` | Legacy tracker | Yes | Tracker | None | None | Mobile tracking-mode routes | FAIL |
| 58 | `/setup/:gameId` | `src/routes/DisabledRoute.tsx` | Legacy setup | Yes | Creator/tracker | None | None | Mobile setup routes | FAIL |
| 59 | `/summary/:gameId` | `src/routes/DisabledRoute.tsx` | Legacy summary | Yes | User/member | None | None | Mobile tracker summary | FAIL |
| 60 | `/viewer/:gameId` | `src/routes/DisabledRoute.tsx` | Legacy live viewer | Yes | User/member | None | None | Mobile live summary/viewer | FAIL |
| 61 | `/player/:gameId/:playerId` | `src/routes/portal/PlayerGameSummaryPage.tsx` | Exact game-player summary | Yes | User/member | canonical tracked summary adapter | Quarter filtering/back navigation | Mobile player summary | PASS (P1 FUNCTIONAL) |
| 62 | `/auth/callback` | `src/routes/auth/Callback.tsx` | OAuth/email callback | No | Auth callback | auth | Session exchange/redirect | Mobile deep-link callback | PARTIAL |

Inventory notes:

- `/teams*` and `/squads*` are duplicate route families backed by the same components.
- `/login`, `/sign-in`, and the three registration paths are intentional aliases.
- The six legacy game-day routes are explicitly disabled, but two are still targeted by active UI.
- There is no catch-all/404 route.

## 4. Mobile Baseline

The current mobile implementation establishes these relevant product rules:

- **Navigation:** Feed, Match Day, New Game, Teams, Leaderboards, and Me are the signed-in primary areas; signed-in default is Feed.
- **Profiles:** own/other profiles, tracked and manual history, season/career aggregation, follows, posts, position-aware benchmarks, Impact 7, and an emerging awards surface. Player Card Album is production code; awards remain partly placeholder.
- **Teams:** memberships, invitations, requests, guests, role-aware administration, official/custom distinctions, player groups/sides, team selection persistence and post creation, Coaches/Team Stats Games, stats, leaderboards, and Best & Fairest voting.
- **Games:** single-player, full-team, linked-team, and Team Stats Game modes; manual games are a separate source. `events` is the canonical tracked stream; `player_events` is legacy. Team Tracker summaries poll while live and support clock/state/finalisation behaviour.
- **Stats:** accepted/countable events are reconciled so base events and modifier events do not become duplicate base stats. Official squad leaderboards use `v_official_counted_events_for_squad`, exclude `tracker_mode = 'team_stats_game'`, preserve team side and player identity, and paginate. Manual totals remain separate.
- **Positions and ratings:** canonical persisted positions are `FWD`, `MID`, `RUC`, and `DEF`. Benchmarks are position-aware. Impact 7 is computed by the canonical mobile domain helper and may honour a manual override.
- **Summaries:** quarter/player/team totals, score, advanced stats, positions, custom stats, spatial data/maps, score worm/timeline, benchmarks, Impact 7, live clock, share, and post hydration are available according to game mode/data.
- **Community:** Feed supplies posts, likes, comments, follow/recommendation/visibility behaviour, reports, blocks, and live-game discovery. These are not represented by a current web Feed page.
- **Notifications:** repository/RPC-backed list and mark-read behaviour, Realtime, type-specific deep links, and role-aware destinations. Examples include follower profiles, feed highlights, team selection, vote cards, and coach/team-stat destinations.
- **Administration:** current backend authority includes `rpc_decide_official_directory_request`; admin clients should not recreate its multi-table transaction.
- **Live/cache behaviour:** Match Day polls approximately every 25 seconds; an unfinished Team Tracker summary polls approximately every 10 seconds. Mobile repositories/hooks perform refresh and reconciliation around mutations.
- **Anonymous scope:** vote-card tokens are the confirmed anonymous flow. The current mobile shared-game route is auth-gated; a generally public game summary is not an established baseline.

## 5. Parity Matrix

Legend: ✅ equivalent outcome, ⚠️ partial/different, ❌ absent or materially wrong, `?` runtime/backend verification still required. Alias routes are combined where they share one implementation.

| Web Page | Mobile Equivalent | Data | Actions | Permissions | Navigation | Live Behaviour | UX | Overall |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Vote card `/vote-card/:token` | Anonymous vote card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Auth aliases | Mobile auth | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | PASS |
| Onboarding | Mobile onboarding | ⚠️ | ⚠️ | ⚠️ | ✅ | n/a | ⚠️ | PARTIAL |
| League/club requests | Official-directory request flow | ⚠️ | ⚠️ | ⚠️ | ✅ | n/a | ✅ | PARTIAL |
| Public game | Auth-gated shared game | ❌ | n/a | ❌ | ⚠️ | ❌ | ⚠️ | FAIL |
| Dashboard | Feed/Match Day/Leaderboards synthesis | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | PASS (P1 APPROVED OUTCOME) |
| Match Day | Match Day tab | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS (P1 FUNCTIONAL) |
| Team list/create | Teams tab/create flow | ✅ | ⚠️ | ⚠️ | ✅ | n/a | ✅ | PARTIAL |
| Team detail | Squad route family | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | PARTIAL |
| Team selection | Team-selection editor/post | ✅ | ❌ | ⚠️ | ✅ | n/a | ✅ | FAIL |
| Games list | Profile/game history | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | PARTIAL |
| Tracked summary | Team Tracker summary | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | PASS (P1 FUNCTIONAL) |
| Manual summary | Manual-game summary | ✅ | ✅ | ✅ | ✅ | n/a | ⚠️ | PASS (P1 FUNCTIONAL) |
| Global stats | Leaderboards tab | ❌ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | FAIL |
| Notifications | Notification screen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PARITY (platform fallbacks) |
| Profile/user | Me/other profile | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | PARTIAL |
| Settings | Settings route family | ✅ | ✅ | ✅ | ⚠️ | n/a | ✅ | PARTIAL |
| Roles | Role settings | ⚠️ | ⚠️ | ⚠️ | ✅ | n/a | ✅ | PARTIAL |
| Admin pages | Mobile/admin backend tools | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ | PARTIAL |
| Legacy game-day routes | Mobile New Game/Tracker | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | FAIL |
| Marketing/legal pages | No direct native equivalent | ✅ | ✅ | ⚠️ | ⚠️ | n/a | ✅ | WEB-ONLY |

## 6. Detailed Findings

The numbered findings below are the source for the severity counts in section 1.

### `/stats` and leaderboard consumers (`/dashboard`, `/teams/:id`)

#### P0-01 — Global leaderboard does not use the official mobile authority

- **Files/functions:** `src/lib/portal-stats.ts`, `getLeaderboardPlayers`; mobile `components/teams/StatsLeaderboard.tsx`; migration-defined `v_official_counted_events_for_squad`.
- **Web:** loads games for a date range and aggregates `v_counted_events`; it does not exclude `tracker_mode = 'team_stats_game'` and does not require the official, side-qualified squad event view.
- **Mobile:** official leaderboards use `v_official_counted_events_for_squad`, exclude Team Stats Games, paginate, and retain player/team-side identity.
- **Expected:** every web leaderboard entry must be drawn from the same countable official population as mobile.
- **User impact:** unofficial or team-stat-only records can change rankings and totals; dashboard highlights inherit the same error.
- **Recommended remediation:** replace the web query with a typed adapter over the existing official view and duplicate mobile filters/pagination. Add fixture/query-contract tests before changing UI.

#### P0-02 — Modifier events can be double-counted as base stats

- **Files/functions:** `src/lib/portal-stats.ts`, `getLeaderboardPlayers`; `src/lib/portal-games.ts`, `EVENT_KEY_MAP`/`summarizeEvents`; `src/lib/portal-game-summary.ts`, `applyDerivedStats`; mobile `lib/player-event-aggregate.ts`, `lib/team-tracker-summary.ts` and leaderboard aggregation helpers.
- **Web:** maps `K_EF`/`K_IF` to kicks and `HB_EF`/`HB_IF` to handballs while also counting the base `K`/`HB`; summary code then derives kick/handball totals by adding modifier counts again. Fantasy calculation is based on that inflated sum and omits the mobile hit-out treatment.
- **Mobile:** reconciles base and modifier records and calculates derived stats/fantasy once from canonical totals.
- **Expected:** identical event fixtures must produce identical base stats, disposals, scores, and fantasy totals on both clients.
- **User impact:** displayed stats, player comparisons, rankings, and exports can be wrong.
- **Recommended remediation:** port canonical aggregation behind one shared pure function, remove `EVENT_KEY_MAP` as an authority, and run golden fixtures containing base-only, modifier-only, paired, duplicate, quarter, side, custom, and hit-out events.

#### P1-01 — Leaderboard filter/stat vocabulary is incomplete

**Status (2026-09-05): RESOLVED.** The existing `/stats` experience now uses the canonical mobile selector vocabulary, labels, age bands, date ranges, represented-player directory IDs, parent/child reset rules and stable ordinal ranking semantics. Weekly featured rows aggregate per player-game with mobile caps; All Leaders uses uncapped player totals. Loading, empty and query-failure outcomes are distinct. Mobile exposes no global position filter or historical-season selector, so neither was invented for the web page; the repository still accepts an explicit bounded season year for existing Dashboard consumers.

- **Files/functions:** `src/routes/portal/StatsPage.tsx`, `STAT_OPTIONS`; `src/lib/portal-stats.ts`, `getLeaderboardPlayers`; mobile leaderboard components/constants.
- **Web:** omits current mobile categories such as ground-ball gets, contested/uncontested possessions and contested marks. A selected season year is not applied consistently; the range helper defaults to the current season.
- **Mobile:** exposes the current supported stat list and applies explicit season/range filters.
- **Expected:** web filter values and result population should match mobile for the same season/squad/stat.
- **User impact:** users cannot reproduce mobile rankings and may see the wrong season.
- **Recommended remediation:** source stat metadata from the canonical stat registry and pass season boundaries explicitly to the backend adapter.

### `/games/:id`, `/game/:gameId`, and game links

#### P0-03 — Web rating and benchmark semantics differ from Impact 7

- **Files/functions:** `src/lib/portal-profile.ts`, `gameRatingScore` and `benchmarkBand`; mobile Impact 7 helper and `constants/benchmarks.ts`.
- **Web:** uses an independent linear “game rating” and generic threshold bands.
- **Mobile:** uses position-aware benchmarks, current `RUC` support, the canonical Impact 7 calculation, and a manual override where present.
- **Expected:** the same player/game/position must show the same named metric and benchmark band.
- **User impact:** web can misrepresent performance and award different ratings from mobile.
- **Recommended remediation:** remove the ad-hoc formula from product output, share/extract the mobile pure calculator and benchmark tables, and label historical values explicitly if retained.

#### P1-02 — Tracked summary omits core mobile summary data

**Status: RESOLVED in P1 Games Stage 1.** The repository now preserves game/player position and custom-stat definitions, and the summary renders canonical full/quarter totals, Impact 7, benchmark bands, team identity, score and exact player drill-down data. Desktop spatial/score visual refinement remains a later presentation task and is not an alternate calculation path.

- **Files/functions:** `src/routes/portal/GameSummaryPage.tsx`; `src/components/portal/game-summary/*`; `src/lib/portal-game-summary.ts`; mobile `app/new-game/team-tracker/summary.tsx` and summary components.
- **Web:** provides quarter-filtered tables, score, share and PDF, but ignores custom `CUS_*` stats and lacks positions, spatial maps/heat map, shot paths, score worm/timeline, current benchmarks, Impact 7, and several advanced fields.
- **Mobile:** renders those capabilities when the event/game mode supplies them.
- **Expected:** existing web summary should preserve all domain data and progressively disclose desktop-appropriate visualisations.
- **User impact:** a completed game has less and sometimes different meaning on web; custom tracking can disappear.
- **Recommended remediation:** fix aggregation first, then expose canonical summary view models in independent slices: identity/position, custom columns, ratings, spatial/score timeline.

#### P1-03 — Live summaries remain stale

**Status: RESOLVED in P1 Games Stage 1.** Unfinished summaries refresh at the mobile 10-second interval, refresh on focus/visibility resume, pause while hidden, avoid overlapping requests, clean up on unmount and stop after a final status. The existing viewer-safe live-clock RPC is consumed where supported.

- **Files/functions:** `src/routes/portal/GameSummaryPage.tsx`; mobile `app/new-game/team-tracker/summary.tsx` polling effect and live-clock repositories.
- **Web:** performs a one-time load and has no Realtime subscription or live polling/clock reconciliation.
- **Mobile:** refreshes unfinished summaries about every 10 seconds and consumes current game-clock state.
- **Expected:** a live web summary updates without full navigation/reload and stops polling when final.
- **User impact:** scores, events, quarter and final state lag during the primary live use case.
- **Recommended remediation:** add a shared query key and status-aware polling interval after the summary data contract is corrected; reconcile on focus/reconnect and stop on final.

#### P1-04 — Active player links target a disabled route

**Status: RESOLVED in P1 Games Stage 1.** `/player/:gameId/:playerId` now resolves the exact `game_players.id`, side, number, profile snapshot and event subset through a thin canonical player-summary route; the old disabled route was removed.

- **Files/functions:** `src/components/portal/game-summary/SummaryMatchComponents.tsx`, row navigation to `/player/${gameId}/${playerId}`; `src/main.tsx`, disabled `/player/:gameId/:playerId`.
- **Web:** a player row offers navigation that always lands on `DisabledRoute`.
- **Mobile:** reaches a player summary with per-quarter/player data.
- **Expected:** either route the action to an implemented web player summary or remove the affordance until it exists.
- **User impact:** a prominent summary drill-down is a dead end.
- **Recommended remediation:** after the canonical summary view model exists, implement the existing player-summary route as a thin filtered view; add a route-target test.

#### P1-05 — “Public game” has no matching anonymous backend contract

**Status (2026-08-18): RESOLVED.** `/game/:gameId` is no longer public or data-loading. The existing application gate authenticates first, preserves only a sanitized internal return destination, honors incomplete onboarding, and then redirects the exact encoded game ID to the canonical `/games/:id` summary. Permission, network/query and missing outcomes remain distinct where the backend exposes that distinction. Anonymous sharing remains an explicit future product/security decision. See `docs/WEB_MOBILE_PARITY_P1_ROUTE_SAFETY.md`.

- **Files/functions:** `src/routes/PublicGamePage.tsx`; `src/lib/portal-game-summary.ts`; `src/routes/App.tsx` public-route handling; mobile `app/share/game/[id].tsx`; current RLS documentation/migrations.
- **Web:** treats `/game/:gameId` as public but reads game/event sources intended for authenticated access.
- **Mobile:** its shared-game route remains inside the auth-gated route tree; vote-card tokens are the confirmed anonymous exception.
- **Expected:** do not broaden game visibility implicitly. Product must choose auth-gating or a deliberately scoped token/public RPC.
- **User impact:** signed-out links generally fail as “not found,” while a casual RLS fix could expose sensitive game data.
- **Recommended remediation:** immediately auth-gate the route for parity; treat anonymous sharing as a separate product/security decision with an explicit backend contract.

#### P2-01 — Summary/export implementations can drift

- **Files/functions:** `src/lib/export.ts`; active summary PDF/export helpers; mobile team PDF/share helpers.
- **Web:** has multiple summary/export paths, including a generic raw-event export separate from the active summary model.
- **Mobile:** exports from its canonical aggregated summary.
- **Expected:** screen, share, and PDF must consume one normalized summary object.
- **User impact:** exported numbers or labels can differ from the page/mobile.
- **Recommended remediation:** make all web exporters consumers of the tested canonical view model; snapshot key PDF fields.

### `/games/manual/:id`

#### P1-06 — Manual summary is a placeholder relative to the mobile outcome

**Status: RESOLVED in P1 Games Stage 1.** Manual summaries hydrate through the post RPC when post-linked and otherwise through the manual record, preserve nullable-field availability, use canonical derived totals/Impact 7/benchmarks including Ruck, render correct subject/team/opponent identity and provide browser share without inventing event or quarter data. No new edit/delete surface or authority was added.

- **Files/functions:** `src/routes/portal/ManualGameSummaryPage.tsx`; mobile `app/games/manual/[id]/summary.tsx`, `rpc_get_manual_game_summary_for_post` consumer.
- **Web:** displays a small fixed set of totals, uses the opponent logo on both header sides, and explicitly leaves post-linked hydration for later.
- **Mobile:** provides richer totals, position-aware benchmarks, Impact 7, share and post hydration.
- **Expected:** the existing manual-summary page should represent the same stored manual game and enable the same non-native outcomes.
- **User impact:** manual games look incomplete and incorrectly branded; users cannot share/post the equivalent result.
- **Recommended remediation:** create a manual-summary adapter over the existing RPC/repository contract, fix identity mapping, then add benchmark/rating/share/post slices.

### `/match-day` and `/dashboard`

#### P1-07 — Match Day can include the wrong mode and only refreshes manually

**Status: RESOLVED in P1 Games Stage 1.** Match Day now applies the mobile official-side/followed-league predicate to either side, explicitly excludes `team_stats_game`, requires counted events for recent finals, preserves legitimate zero-event live games, sorts live by latest event and recent by date, and refreshes the complete snapshot every 25 seconds with focus/visibility lifecycle handling.

- **Files/functions:** `src/routes/portal/MatchDayPage.tsx`; portal game-candidate loader; mobile `hooks/use-match-day.ts`.
- **Web:** loads once, exposes manual Refresh, and does not consistently exclude Team Stats Games from public Match Day candidates.
- **Mobile:** excludes that mode and polls around every 25 seconds.
- **Expected:** identical candidate eligibility and automatic scheduled/live/final transitions.
- **User impact:** private/internal tracking games may surface and live status goes stale.
- **Recommended remediation:** centralize the eligibility predicate, add status-aware polling/focus refresh, and test all four tracking modes.

#### P1-08 — Dashboard inherits incorrect stats and is not a Feed equivalent

**Status (2026-09-10): RESOLVED FOR APPROVED OPTION 2.** The earlier embedded leaderboard and notification-contract defects were remediated by their dedicated stages. Dashboard now adds the missing bounded community-awareness outcome while retaining its useful desktop match, performance, team and action context. At most six eligible self/followed posts load through the security-invoker `feed` view, shared canonical Profile Posts normalization and shared renderer, with exact destinations, stored media, counts and isolated states. A full Feed route, recommendations and social mutations remain intentional differences rather than part of this finding. See `docs/WEB_MOBILE_PARITY_P1_DASHBOARD_FEED_DECISION.md` and `docs/WEB_MOBILE_PARITY_P1_DASHBOARD_ACTIVITY.md`.

- **Files/functions:** `src/routes/portal/DashboardPage.tsx`; `src/lib/portal-dashboard.ts`; existing Profile Posts canonical/repository/renderer files.
- **Web:** Dashboard supplies strong desktop match, performance, team and action context plus a bounded, read-only self/followed community-post stream. It intentionally has no full Feed interaction surface.
- **Mobile:** signed-in home is Feed, with self/followed posts, conditional recommendations, live discovery, interactions, and contextual moderation.
- **Expected:** preserve Dashboard as the desktop home and add only the missing recent-community-awareness outcome in a bounded module.
- **User impact:** users can now discover recent recap activity from themselves and followed people without leaving the desktop home.
- **Remediation delivered:** up to six read-only eligible Feed rows with canonical rendering and destinations; dedicated Feed browsing, recommendations and interaction mutations remain intentionally out of scope.

### `/teams/:id/team-selection` and `/squads/:id/team-selection`

#### P1-09 — Team selection cannot be saved or posted

**Status: DEFERRED / PRODUCT CONSTRAINT.** Mobile drafts remain device-local, the existing backend only supports publication, and project direction prohibits the new migration required for canonical editable cross-device persistence. P1-09 is not resolved. See `docs/WEB_MOBILE_PARITY_P1_TEAM_SELECTION.md`.

- **Files/functions:** `src/routes/portal/TeamSelectionPage.tsx`, `saveSponsorLogoState` and `handleExportImage`; mobile team-selection editor/repository and `rpc_create_team_selection_post`.
- **Web:** lineup state is local, sponsor state is browser local storage, and the only completed outcome is image export.
- **Mobile:** auto-saves a device-local `AsyncStorage` draft and recent-side lineup, saves a PNG to Photos on explicit Save, and creates a separate published post through the backend RPC. It does not reload an editable canonical backend selection.
- **Expected:** authorized web users must be able to complete the equivalent persistent workflow, with export as an additional web action.
- **User impact:** work is lost across devices and never reaches teammates/feed.
- **Recommended remediation:** do not continue full P1-09 under the current no-migration constraint. Retain the existing post RPC unchanged; revisit canonical cross-device drafts only if the product constraint changes. Any publication-only web adaptation must be classified as partial and must not claim save/reload parity.

#### P2-02 — Team-selection authorization is too coarse in the UI

- **Files/functions:** `src/routes/portal/TeamSelectionPage.tsx`, `isMemberOrOwner`; mobile team-selection capability checks and backend RPC.
- **Web:** collapses access to accepted member-or-owner while the action semantics involve creator/admin/coach/team roles and backend rules.
- **Mobile:** UI capability and RPC validation are role-aware.
- **Expected:** render capabilities from the same role contract and always rely on backend enforcement.
- **User impact:** users can see an action that will fail, or a role may be denied an action it should have.
- **Recommended remediation:** expose a backend/canonical capability result; do not add more client-only booleans.

### `/teams/:id`, `/squads/:id`, list/create routes

#### P1-10 — Roster position form can write non-canonical values

**Status (2026-09-05): RESOLVED.** The active roster editor renders the shared canonical registry, writes only `FWD`, `MID`, `RUC`, `DEF` or `null`, and validates/normalizes again in `updateMemberPosition` before the Supabase mutation. Unsupported `Utility` and `Bench` values were removed from the persistence UI. Existing canonical values display with current mobile labels and round-trip unchanged.

- **Files/functions:** `src/routes/portal/SquadDetailPage.tsx`, `POSITION_OPTIONS` and roster update handler; `src/lib/squads.ts`, `updateMemberPosition`; mobile `constants/positions.ts`; migration `20260811120000_ruck_position_and_game_player_snapshot.sql`.
- **Web:** presents `Forward`, `Midfield`, `Defence`, `Ruck`, `Utility`, and `Bench` and passes the selected value to the update helper.
- **Mobile/backend:** persisted player positions are `FWD`, `MID`, `RUC`, `DEF`.
- **Expected:** labels may be friendly, but stored values must be canonical and unsupported values must never be submitted.
- **User impact:** updates can fail validation or leave web unable to represent the stored position.
- **Recommended remediation:** use a shared `{value,label}` position registry; remove unsupported persistence values unless a distinct lineup-slot field exists.

#### P1-11 — Existing team hub lacks current mobile management slices

**Status (2026-09-13): RESOLVED.** Player Groups / Sides, Coaches / Team Stats Games, and Best & Fairest / Voting now use their deployed capability functions and canonical backend contracts. Voting management, assigned and token-scoped submission, private breakdowns and tallies are available without backend changes.

- **Files/functions:** `src/routes/portal/SquadDetailPage.tsx` and `src/lib/squads.ts`; mobile `app/squad/[id]/*`, player-group, coaches/team-stats, and voting repositories.
- **Web:** covers roster, invites, requests, guests, branding, activity, stats, player groups/sides, read-only Coaches/Team Stats Games, and the supported Best & Fairest management/voting workflow.
- **Mobile:** exposes these as parts of the current team product.
- **Expected:** because a team hub already exists, missing in-hub actions are existing-page parity gaps even if desktop uses tabs/panels instead of native routes.
- **User impact:** coaches/admins must switch platforms for core team tasks.
- **Recommended remediation:** add one bounded slice at a time after role capabilities are canonical: groups/sides, coaches/team-stat games, then voting.

#### P2-03 — Duplicate team route families increase navigation drift

- **Files/functions:** `src/main.tsx`; links across portal components.
- **Web:** both `/teams*` and `/squads*` are first-class routes, and legacy `/squad` remains separate.
- **Mobile:** uses one canonical squad route family.
- **Expected:** one canonical web URL with compatibility redirects.
- **User impact:** inconsistent back paths, analytics, bookmarks and notification destinations.
- **Recommended remediation:** choose `/teams*` as product-facing URLs (matching current nav terminology), redirect aliases, and add a central route builder.

### `/profile`, `/users/:id`, and `/onboarding`

#### P1-12 — Onboarding/edit cannot represent Ruck

**Status (2026-09-05): RESOLVED.** Onboarding and its profile-edit mode now share the canonical registry, hydrate stored values through the current mobile alias normalizer, render friendly labels, and include Ruck with stored code `RUC`. Player-role submission validates the value before updating `profiles`; returning from profile edit reloads `/profile` through its existing page loader.

- **Files/functions:** `src/lib/onboarding.ts`, position values in onboarding profile update; mobile `constants/positions.ts` and Ruck migration.
- **Web:** supports only DEF/MID/FWD choices.
- **Mobile/backend:** supports `RUC` as a canonical current position.
- **Expected:** existing Ruck users retain their value and new users can choose it.
- **User impact:** onboarding is incomplete and profile editing can erase or fail to preserve valid data.
- **Recommended remediation:** use the shared canonical registry and add a regression test for round-tripping all four values.

#### P1-13 — Profile omits current data inside an existing profile surface

**Status (2026-09-09): RESOLVED.** The Profile Posts slice exposes eligible own/other-user activity with mobile-matching visibility, block, moderation and pagination behavior. The owner-only Album slice now consumes deployed cloud-backed `player_cards` contracts through a responsive collection and stable preview route, while keeping Album out of other-user profiles. Stored assets, source identities and post history are preserved without regeneration or backend changes. Awards remain informational because mobile awards are not a reliable parity target. See `docs/WEB_MOBILE_PARITY_P1_PROFILE_POSTS.md` and `docs/WEB_MOBILE_PARITY_P1_PLAYER_CARD_ALBUM.md`.

- **Files/functions:** `src/routes/portal/ProfilePage.tsx`; `src/lib/portal-profile.ts`; mobile Me/user profile routes, post and Player Card Album components.
- **Web:** covers identity, follow state, games and season/career totals but omits profile posts and current player-card/album entry; awards are also absent, though mobile awards are only partly complete.
- **Mobile:** displays posts and production player-card album features; awards are not yet a fully reliable parity target.
- **Expected:** add posts and an Album entry as bounded existing-profile slices; do not claim awards parity until the mobile surface is complete.
- **User impact:** profiles are less useful and social identity does not carry across platforms.
- **Recommended remediation:** first correct aggregation/rating, then reuse backend post/card contracts with web-native presentation. Keep awards informational.

#### P2-04 — Profile and onboarding duplicate normalization/business rules

- **Files/functions:** `src/lib/onboarding.ts`, `src/lib/portal-profile.ts`; mobile profile/onboarding hooks and repositories.
- **Web:** separately normalizes positions, roles, totals, benchmark bands and profile completion.
- **Mobile:** has current domain helpers and route guards.
- **Expected:** share pure normalization/completion rules and keep form/UI adapters platform-specific.
- **User impact:** completion redirects and displayed identity can drift after schema/product changes.
- **Recommended remediation:** extract fixtures and pure functions first; avoid sharing full route components.

### `/notifications`

#### P1-14 — Several notification types route to the wrong place or nowhere

**Status (2026-08-18): REMEDIATED.** The web now uses an exhaustive pure destination adapter for the current mobile/backend type set, marks supported/fallback/unsupported outcomes explicitly, and safely retains malformed or feed-only items in Notifications. Listing, unread count and mark-read use the existing canonical RPCs; the layout and page share a recipient-scoped Realtime/lifecycle state source. Dedicated team-selection, authenticated vote-card, feed-detail and coach-only Team Stats surfaces do not exist on web, so their nearest safe destinations are documented and fixture-tested rather than fabricated. See `docs/WEB_MOBILE_PARITY_P1_NOTIFICATIONS.md`.

- **Files/functions:** `src/lib/portal-notification-routing.ts`; `src/routes/portal/NotificationsPage.tsx`; mobile notification route map/repository.
- **Web:** `user_followed` returns no destination; like/comment notifications often return none; team-selection and several squad-role types are absent; vote-card assignment/reminder goes to team detail rather than the assigned card; official-game-live routing does not distinguish coach/team-stat context.
- **Mobile:** routes those types to the follower profile, highlighted feed/manual summary, team selection, vote card, or role-appropriate game surface.
- **Expected:** one notification payload should resolve to equivalent intent on each platform through a shared descriptor and platform-specific URL adapter.
- **User impact:** clicking a notification is a dead end or lands without the object/action that caused it.
- **Recommended remediation:** create exhaustive payload fixtures for every current type, share destination descriptors, and add web route adapters/fallback telemetry.

#### P2-05 — Notification reads/mutations bypass canonical repository contracts

**Status (2026-08-18): REMEDIATED WITH P1-14.** Direct web notification reads/updates were replaced by `f_notifications_list`, `f_notifications_unread_count` and `f_notifications_mark_read`, with cursor pagination and shared list/count invalidation.

- **Files/functions:** web notification loader/mutations; mobile notification repository using list/mark-read functions; `f_notifications_list` and `f_notifications_mark_read`.
- **Web:** directly selects/updates the notifications table and uses a bounded list without robust pagination.
- **Mobile:** uses canonical functions/repository behaviour plus Realtime.
- **Expected:** same visibility, ordering, unread count, pagination and mark-read semantics.
- **User impact:** history/unread state may differ and future backend changes must be implemented twice.
- **Recommended remediation:** switch web to the existing functions, add cursor pagination and invalidate list/count together.

### `/admin*` and `/leagues/:id`

#### P0-04 — Platform-admin route gating can become stale during SPA navigation

- **Files/functions:** `src/components/layout/PortalLayout.tsx`, module-scope `isAdminRoute` and layout authorization branch.
- **Web:** computes admin-route state from global `location.pathname` outside React routing state, so the value is captured at module evaluation rather than following client navigation.
- **Mobile/backend:** admin access is evaluated from current route/capability, while Supabase must enforce every operation independently.
- **Expected:** current location drives UI gating and every admin query/mutation is backend-authorized.
- **User impact:** an admin screen may not be gated or a legitimate admin may be redirected, depending on the page used to load the bundle. Backend RLS/RPC should limit impact, but that must be verified rather than assumed.
- **Recommended remediation:** derive the flag from React Router `useLocation`, centralize a platform-admin guard, then execute the full role/RLS matrix for every admin mutation.

#### P0-05 — Directory approval recreates a canonical atomic workflow in the browser

- **Files/functions:** `src/lib/portal-admin.ts`, `approveDirectoryRequest`; mobile `lib/admin-requests.ts`; migration `20260413030000_rpc_decide_official_directory_request.sql`.
- **Web:** manually inserts/updates league, club, squad and request records across several calls.
- **Mobile/backend:** calls `rpc_decide_official_directory_request`, which owns decision validation and atomic side effects.
- **Expected:** web calls the same RPC and renders its typed result.
- **User impact:** partial failure can create incomplete directory records, duplicate side effects or status disagreement.
- **Recommended remediation:** replace the browser transaction with the RPC before touching the admin UI. Add idempotency, approve/reject, race and rollback integration tests.

#### P1-15 — Manual feed-post admin route is only a placeholder

**Status (2026-09-10): DEFERRED / PRODUCT CONSTRAINT; broken web exposure removed.** The current reachable mobile route now creates a manual-game source and hands off to the full Player Card editor; current mobile contract tests explicitly forbid its use of the legacy `rpc_create_manual_game_summary_post`. Web has Album consumption but no equivalent creator/reserve/finalise/publish pipeline. The misleading admin CTA and placeholder component were removed, while the legacy URL now redirects through the existing platform-admin-gated route tree to `/admin`. No backend or migration change was made. See `docs/WEB_MOBILE_PARITY_P1_ADMIN_MANUAL_FEED_POST.md`.

- **Files/functions:** `src/routes/portal/admin/AdminManualFeedPostPage.tsx`.
- **Web:** renders explanatory placeholder text and performs no data load or mutation.
- **Mobile/backend:** current feed tooling/contracts exist elsewhere in the product.
- **Expected:** either implement the intentionally exposed admin task against an approved contract or remove it from production navigation/routes.
- **User impact:** administrators encounter a non-functional tool.
- **Recommended remediation:** confirm the intended authoring contract; implement as a bounded stage-3 task or hide/redirect until approved.

#### P2-06 — Admin UI capabilities are fragmented across page-specific checks

- **Files/functions:** `src/components/layout/PortalLayout.tsx`; `src/routes/portal/admin/*`; `src/lib/portal-admin.ts`.
- **Web:** most pages assume the layout gate and then expose direct table/RPC operations; capability, loading and permission-denied handling are not centralized.
- **Mobile/backend:** distinguishes platform admin, official-club roles, team roles, creator/tracker and other authorities.
- **Expected:** a server-backed capability layer should drive UI while RLS/RPC remains authoritative.
- **User impact:** over-broad controls, confusing failures, and regression risk as roles evolve.
- **Recommended remediation:** inventory each mutation against its policy/function, return capability flags, and test unrelated-user denial.

### Authentication, navigation, and application shell

#### P1-16 — Landing primary CTA points to disabled New Game

**Status (2026-08-18): RESOLVED.** The primary landing CTA now enters the existing authentication/onboarding flow with `/dashboard` as its safe supported destination. Active public acquisition controls no longer target `/new`; intentional disabled legacy tracker routes remain in place. See `docs/WEB_MOBILE_PARITY_P1_ROUTE_SAFETY.md`.

- **Files/functions:** `src/routes/Landing.tsx`, `authLink('/new')`; `src/main.tsx`, disabled `/new`.
- **Web:** “Get Started” preserves `/new` as the post-login destination, then sends the user to `DisabledRoute`.
- **Mobile:** New Game is an active core tab/workflow.
- **Expected:** a production CTA must lead to a supported outcome; until web game creation is in scope, use onboarding/dashboard/Match Day.
- **User impact:** the main acquisition flow ends at a feature-unavailable page.
- **Recommended remediation:** immediately point the CTA at the best current supported destination; treat New Game itself as a separate missing-page decision.

#### P2-07 — OAuth loses the requested destination and auth state is not centrally reactive

- **Files/functions:** `src/routes/auth/Login.tsx`; `src/routes/auth/Callback.tsx`; `src/routes/App.tsx` session gate.
- **Web:** email login preserves a redirect, but OAuth callback returns to `/`; the app shell performs an initial session check without a clear central `onAuthStateChange`-driven route/cache reset.
- **Mobile:** deep-link/auth routing restores the intended post-auth state and reacts through its auth provider.
- **Expected:** validate and preserve an internal redirect through OAuth, then update protected routing/caches on sign-in, sign-out and account deletion.
- **User impact:** users lose context; expired/deleted sessions can leave stale protected UI until a request fails.
- **Recommended remediation:** use signed/validated same-origin state, a central auth provider, and callback/session transition tests.

#### P2-08 — Signed-in users are redirected away from legal/support pages; no 404 exists

- **Files/functions:** `src/routes/App.tsx`, public-route redirect list; `src/main.tsx` route table.
- **Web:** authenticated users are redirected from terms, privacy, guidelines, support and how-it-works; unmatched URLs have no explicit catch-all.
- **Mobile:** legal/support remain reachable from settings and invalid navigation has controlled handling.
- **Expected:** informational public pages remain accessible regardless of session, and unknown paths offer recovery.
- **User impact:** users cannot review policies/support while signed in; bad deep links fail unclearly.
- **Recommended remediation:** split “auth-only pages” from “public informational pages” and add a branded not-found route with safe destinations.

### Cross-route UX/design findings

#### P3-01 — Authenticated screens lack one enforced token/component system

- **Files/functions:** portal route/component styles and `src/index.css`; mobile theme/design constants.
- **Web:** the inspected public landing/sign-in screens consistently use a dark athletic system, but portal pages mix local hard-coded colours, spacing and status treatments.
- **Mobile:** central palette and status semantics are used as the current design baseline.
- **Expected:** desktop layout can differ while identity, semantic colour, typography and component states stay coherent.
- **User impact:** visual trust and state recognition vary between pages.
- **Recommended remediation:** inventory existing CSS variables first, map semantic tokens, and migrate touched components incrementally; do not redesign the shell.

#### P3-02 — Dense data pages need a defined responsive information hierarchy

- **Files/functions:** game-summary tables, team roster, stats, and admin page components.
- **Web:** desktop-first dense tables are present, but mobile-sized behaviour is implemented inconsistently and was not covered by visual regression checks.
- **Mobile:** uses progressive disclosure and identity-plus-data cards appropriate to narrow screens.
- **Expected:** desktop retains comparison density; tablet/mobile web collapses secondary columns into details without losing actions or live state.
- **User impact:** smaller browsers may require horizontal scanning or hide important context.
- **Recommended remediation:** define per-page column priority and breakpoint acceptance screenshots after functional parity.

#### P3-03 — Accessibility and motion claims are unverified

- **Files/functions:** interactive portal components, modal/dialog controls, status colours, export/editor controls.
- **Web:** visual inspection showed generally strong contrast on public pages, but there is no automated accessibility script or recorded keyboard/screen-reader coverage.
- **Mobile:** accessibility and functional motion are stated design requirements.
- **Expected:** focus order, names, dialogs, keyboard operation, reduced motion and non-colour status cues must be tested.
- **User impact:** assistive-technology and keyboard users may be blocked by otherwise polished flows.
- **Recommended remediation:** add axe checks, keyboard scripts, focus trapping/restoration tests and manual screen-reader smoke tests in stage 5/6.

## 7. Cross-Cutting Architecture Findings

### Duplicated business logic

The highest-risk duplication is domain logic, not UI: event reconciliation, base/derived stat totals, fantasy score, score semantics, Impact 7, benchmark bands, position normalization, role/capability checks, notification destinations, date/season ranges, and game-mode eligibility. These calculations should not exist independently in web and mobile.

Recommended incremental target:

1. Establish language-neutral JSON fixtures for events, players, positions, permissions and notification payloads.
2. Extract small pure TypeScript domain modules: `aggregatePlayerEvents`, scoring/fantasy, Impact 7/benchmarks, position registry, tracking-mode eligibility, and destination descriptors.
3. Consume them from platform repositories/view-models. Do not share React route components.
4. If a package workspace is too disruptive initially, mirror the canonical helpers with the same fixtures in both repos, then extract after outputs are stable.

### Query and backend contracts

Canonical existing contracts should be preferred in this order:

- `events` for tracked events; never introduce new `player_events` consumers.
- `v_counted_events` for accepted/countable general event reads.
- `v_official_counted_events_for_squad` for official leaderboards with side identity and Team Stats Game exclusion.
- Existing notification list/mark-read functions.
- `rpc_decide_official_directory_request` for directory decisions.
- Existing team-selection post, vote, finalisation and live-clock RPCs for their corresponding mutations.

No backend change should be the default response to a web mismatch. Add an RPC/view only when no current contract can provide the required outcome, then inventory mobile callers, retain backward compatibility, deploy backend first, and roll clients forward independently.

### Permissions

Do not reduce the role model to `isAdmin`. A shared capability vocabulary should cover normal user, accepted member/player, squad owner/admin, coach, tracker, linked-side tracker, official club role, platform admin, game creator and voting authority. The UI consumes capabilities for affordances; RLS/security-definer RPCs remain the enforcement boundary. Every direct table mutation in admin, squads and notifications needs an explicit policy/RPC mapping.

### Shared types

Generated database types remain per-client build artifacts. Share stable domain types instead: canonical position/stat keys, normalized event/summary shapes, role capabilities, notification destination descriptors, and RPC input/output contracts. Version backend results additively so older mobile clients continue working during web rollout.

### Caching and live state

Web currently uses page-local effects and refreshes. Introduce one query/cache layer incrementally rather than rewriting every page. Define keys for game summary, Match Day, team, roster, leaderboard, notifications/count and profile. Mutations should invalidate the smallest relevant set. Poll only scheduled/live resources, refresh on focus/reconnect, merge Realtime events idempotently, and stop polling at final.

### Navigation

Create typed route builders for profile, team, game, notification and settings destinations. Add a test that walks all in-app route targets and fails for `DisabledRoute`, missing params or unknown routes. Keep alias redirects for compatibility, but generate only canonical URLs.

### Responsive design

Share semantics, not layouts. Desktop should use its width for comparison tables, side panels and persistent filters. Narrow web can use cards/drawers and progressive disclosure. Both must show the same identity, state, permissions, data and primary outcome. Club/team colours remain contextual accents rather than replacing semantic success/warning/live colours.

### Test coverage

The repository currently has a typechecked production build but no declared web test/lint scripts. Add:

- pure golden tests executed against the same event/rating/benchmark fixtures in web and mobile;
- SQL/RPC integration tests for the complete role matrix and atomic admin/team-selection flows;
- repository contract tests for filters, pagination, modes and side identity;
- router tests for auth/deep links/notification targets;
- fake-timer tests for polling stop/reconnect/invalidation;
- Playwright browser tests for primary existing-page outcomes at desktop/tablet/mobile widths;
- screenshot, axe and keyboard checks for high-value states.

## 8. Missing Web Pages

This section is informational only. None of these pages is automatically included in the remediation plan unless an existing web page already exposes part of the feature.

### Likely future web feature

- A dedicated Community Feed with post detail, likes, comments, recommendations, and contextual moderation is a possible later feature, but is not required by the resolved P1-08 approved outcome.
- Full New Game/tracking flows for single-player, full-team, linked-team and Team Stats Game modes.
- Team player-group/side management as dedicated workspace views.
- Coaches area and Team Stats Game management.
- Best & Fairest/vote setup, management and results beyond anonymous vote cards.
- Player Card Album/create/editor surfaces linked from profile.
- Dedicated profile editing routes and richer profile posts.
- Manual-game entry/editing, not only summary display.

### Probably mobile-only

- Offline on-device event capture and SQLite queueing.
- Native push-token registration, app icon badge and OS notification permissions.
- Haptics, device orientation locking and native tracker ergonomics.
- Save-to-Photos/native share-sheet integrations.
- Camera/photo-library and native image-cutout workflows where a file-picker/CSS web adaptation would not preserve value.

### Requires product decision

- Whether any game summary should be anonymous, and if so which fields, expiry/token model, revocation and indexing rules apply.
- The signed-in web home remains Dashboard. Its bounded self/followed Community Activity module is the delivered adaptation; a separate full Feed route is not currently justified.
- Whether live event capture is a web goal or web remains a viewer/management companion.
- Whether the full Player Card editor belongs on desktop or web only views/shares finished cards.
- Whether manual admin feed authoring is still a supported product need.

## 9. Remediation Plan

### Stage 0 — Safety / canonical contracts

- **Objective:** freeze expected outputs and map every high-risk web call to an existing canonical backend/domain contract.
- **Likely areas:** `src/lib/portal-stats.ts`, `portal-games.ts`, `portal-game-summary.ts`, `portal-profile.ts`, `portal-admin.ts`, notifications/squads helpers; mobile aggregation, benchmarks, repositories; Supabase migration tests.
- **Dependencies:** representative sanitized fixtures for each tracking mode, modifier pairing, manual games, positions, roles and notifications.
- **Database changes:** none expected. Inspect deployed availability/version of existing views/RPCs; do not alter policies.
- **Risks:** fixtures that accidentally encode current web bugs; changing displayed historical totals without communication.
- **Regression surfaces:** mobile leaderboards/summaries, exports, profile totals, admin decisions.
- **Validation:** dual-client golden outputs, query/RPC contract matrix, role-policy inventory, baseline screenshots/builds.
- **Estimated complexity:** **6/10**.

### Stage 1 — P0 issues

- **Objective:** make leaderboard/stat/rating outputs canonical and make admin access/decisions safe.
- **Likely areas:** replace leaderboard query; replace event aggregation and rating/benchmark helpers; update `PortalLayout`; switch `approveDirectoryRequest` to the existing RPC.
- **Dependencies:** Stage 0 fixtures/contracts; backend RPC/view already deployed.
- **Database changes:** none expected. A migration is justified only if deployment audit shows a current contract is absent, with mobile compatibility and backend-first rollout documented.
- **Risks:** leaderboard/rating numbers visibly change; cached/exported values may disagree during rollout; admin request result typing may differ.
- **Regression surfaces:** `/stats`, Dashboard, team stats, both summary types, profile, exports, all `/admin*` routes.
- **Validation:** exact mobile-vs-web fixture equality; accepted/unaccepted, mode, side and duplicate-event cases; platform-admin/unrelated-user tests; atomic approve/reject/race tests; production-like read-only smoke tests.
- **Estimated complexity:** **8/10**.

### Stage 2 — Core P1 parity

- **Objective:** repair the highest-value existing user outcomes.
- **Likely areas:** tracked summary, manual summary, team-selection persistence/posting, Match Day eligibility, active broken links/CTA, Ruck/position forms.
- **Dependencies:** Stage 1 normalized summary/role contracts.
- **Database changes:** none expected; use existing summary/team-selection/live contracts.
- **Risks:** large summary UI surface, duplicate team-selection submission, role confusion, historical data gaps.
- **Regression surfaces:** game navigation, PDFs/shares/posts, roster editing, dashboard links, team activity/notifications.
- **Validation:** all four tracking modes, manual/final/live, every canonical position, save/post retry/idempotency, route-target suite and responsive outcome tests.
- **Estimated complexity:** **9/10**.

### Stage 3 — Remaining functional parity

- **Objective:** complete existing team/profile/notification/admin page slices without adding unrelated missing pages.
- **Likely areas:** squad groups/coaches/voting panels, profile posts/Album entry, exhaustive notification routing, leaderboard filters, admin placeholder decision.
- **Dependencies:** shared capability/navigation descriptors; stable Stage 1/2 data contracts.
- **Database changes:** none by default; any unavailable feature contract becomes a separate reviewed proposal.
- **Risks:** scope expansion into whole missing mobile routes; official/custom squad role differences.
- **Regression surfaces:** team membership/activity, feed/post visibility, notification deep links, admin navigation.
- **Validation:** type-by-type notification fixtures; role-by-action matrix; feature-specific empty/error states; backwards-compatible route redirects.
- **Estimated complexity:** **8/10**.

### Stage 4 — Live state and caching

- **Objective:** make existing pages update with mobile-equivalent freshness and deterministic invalidation.
- **Likely areas:** Match Day, game summary, notifications, team detail/selection and shared web query/cache infrastructure.
- **Dependencies:** canonical repositories and stable query keys from Stages 1–3.
- **Database changes:** none expected; use existing Realtime/live-clock support.
- **Risks:** request storms, duplicate Realtime records, stale cache after role/membership changes.
- **Regression surfaces:** battery/network usage, finalisation, unread counts, live clock, browser focus/reconnect.
- **Validation:** fake timers, one-subscription assertions, reconnect/focus tests, final-state polling stop, throttled/offline browser scenarios.
- **Estimated complexity:** **7/10**.

### Stage 5 — UX and responsive parity

- **Objective:** align information hierarchy, terminology, status semantics and accessibility while retaining desktop advantages.
- **Likely areas:** shared CSS tokens/components, dense summary/roster/stats/admin pages, legal/support routing, loading/empty/error patterns.
- **Dependencies:** functional states stabilized; design-state fixtures.
- **Database changes:** none.
- **Risks:** accidental redesign, hiding secondary data, visual churn across many pages.
- **Regression surfaces:** desktop density, tablet breakpoints, exported/captured team selection, dialogs and keyboard flows.
- **Validation:** screenshot matrix at desktop/tablet/mobile widths, axe, keyboard/focus, reduced motion, contrast and terminology review.
- **Estimated complexity:** **6/10**.

### Stage 6 — Hardening

- **Objective:** prevent future drift and document ownership.
- **Likely areas:** CI scripts, shared fixture package, route inventory generator, contract docs and monitoring/telemetry.
- **Dependencies:** all prior stages.
- **Database changes:** only additive test fixtures/functions in isolated test environments if required; never production-policy changes for test convenience.
- **Risks:** flaky E2E/live tests, over-coupled shared package releases.
- **Regression surfaces:** both repository pipelines and client release compatibility.
- **Validation:** required CI gates, migration/RPC compatibility checks, route/capability coverage, dependency/version policy, audit rerun.
- **Estimated complexity:** **5/10**.

## 10. Recommended Implementation Order

Each item is intentionally small enough to be a standalone Codex implementation prompt.

1. Add shared golden event fixtures and assert the current mobile aggregation/score/fantasy output.
2. Add web tests against those fixtures, initially recording the expected failures without changing production code.
3. Replace web event/stat aggregation with the canonical pure helper; make screen and export consume the same view model.
4. Replace global leaderboard reads with `v_official_counted_events_for_squad`, explicit Team Stats Game exclusion, side identity and pagination.
5. Port/extract canonical Impact 7, benchmark tables and the `FWD/MID/RUC/DEF` registry; remove the web-only formula from product output.
6. Fix `PortalLayout` to derive admin-route state from React Router and add current-route guard tests.
7. Replace `approveDirectoryRequest` multi-write logic with `rpc_decide_official_directory_request`; add atomicity/race/authorization integration tests.
8. Map every admin mutation to its enforcing policy/RPC and test platform admin versus unrelated authenticated user.
9. Change the landing CTA and summary player links so no active control targets `DisabledRoute`.
10. Correct Match Day mode eligibility, then add 25-second scheduled/live polling with final-state stop.
11. Add status-aware 10-second refresh/live-clock reconciliation to tracked summaries.
12. Add custom stats, position, Impact 7 and benchmark fields to the tracked-summary view model and UI.
13. Implement the existing player-summary route as a filtered canonical summary, or remove its affordance until that task is approved.
14. Rebuild manual-summary data loading on the canonical manual-summary/post contract; fix team identity/logo mapping.
15. Add manual-summary benchmark/rating/share/post capabilities in separate changes.
16. Replace team/roster position options with the canonical value-label registry and round-trip tests.
17. Add persistent team-selection save, then add post creation as a second idempotent task with role tests.
18. Move notification list/mark-read to canonical functions and introduce coherent query invalidation/pagination.
19. Implement exhaustive notification destination fixtures and web route adapters.
20. Canonicalize `/teams*` URLs and turn `/squads*` plus `/squad` into compatibility redirects.
21. Add team hub slices one at a time: groups/sides, Coaches/Team Stats Games, then voting.
22. Add profile posts and Album entry only after profile stats/rating is canonical.
23. Revisit web admin Player Card authoring only after a separately approved creator scope; the dead manual-feed placeholder and CTA are removed.
24. Separate public informational pages from signed-out auth pages; preserve safe OAuth redirects and add a 404.
25. Introduce incremental query caching/invalidation across the stabilized repositories.
26. Apply semantic design tokens, responsive column priorities and accessibility fixes page by page.
27. Make parity fixtures, route-target checks, role/RLS tests, responsive E2E and build/typecheck required CI gates.

## 11. Verification Matrix

### Authentication

For every applicable route verify:

- Signed out: public/auth pages work; protected pages preserve a safe return path; no protected data flashes.
- Signed in with complete onboarding: auth pages redirect appropriately, while legal/support pages remain reachable.
- Signed in with incomplete onboarding: protected routes redirect consistently and onboarding can save all canonical values including `RUC`.
- OAuth/email/password recovery: callback restores only validated internal destinations.
- Session expiry, sign-out and deleted account: subscriptions/cache are cleared and protected UI exits immediately.

### User roles

Run both visible-control and backend-denial assertions for:

| Role | Required focus |
|---|---|
| Normal user | Own profile/settings, public team/game reads only as permitted |
| Player/member | Roster/profile, team selection/vote eligibility |
| Squad owner | Membership, roles, branding, team selection and voting management |
| Squad admin | Explicit delegated team capabilities without owner-only escalation |
| Coach | Coaches/Team Stats Game and selection capabilities only where granted |
| Tracker | Created/assigned game access and finalisation boundaries |
| Official club role | Official directory/team capabilities distinct from custom squad admin |
| Platform admin | All intended admin routes and RPCs |
| Unrelated authenticated user | Denied all private team/game/admin mutations and hidden affordances |

### Screens

Every one of the 62 audited route patterns must have at least a routing/auth assertion. Every unique rendered page must additionally be exercised at:

- Desktop: 1440×900.
- Tablet-sized browser: 1024×768.
- Mobile-sized browser where supported: 390×844.

Alias routes must resolve to the canonical page/URL. Disabled, placeholder and mock routes must either be intentionally removed/guarded or have an explicit approved outcome. Capture high-value visual baselines for landing, auth, Dashboard, Match Day, team detail/selection, both summaries, Stats, Notifications, Profile, Settings and admin detail.

### Data states

For each data-driven page verify:

- loading with stable layout and disabled duplicate submissions;
- empty with a correct role-aware next action;
- populated with pagination/filter/sort parity;
- recoverable error with no false “not found” for permission/network failures;
- stale/reconnect/focus refresh where relevant;
- partial related records (missing avatar/logo/player mapping) without identity corruption.

### Game states

Use shared fixtures to cover:

- scheduled, live, quarter transitions, paused clock and final;
- manual game and tracked game separation;
- single-player, Team Tracker/full team, linked team and Team Stats Game;
- accepted/rejected/duplicate modifier events;
- home/away side and linked-side player identity;
- custom stats, location/shot data and score timeline;
- all canonical positions including Ruck;
- finalisation retry/idempotency and post/export after final.

### Exact parity assertions

- Web/mobile totals, disposals, score, fantasy, Impact 7 and benchmark band are byte-for-byte equal for golden fixtures.
- Official leaderboards exclude Team Stats Games and non-official/non-countable events and preserve pagination order.
- Manual totals never enter tracked-event leaderboards unless an explicit mobile contract does so.
- Every notification fixture resolves to an existing, authorized route and marks read once.
- Every mutation has success, validation, permission-denied, network failure, retry and post-mutation refresh coverage.
- Admin directory decisions are atomic and idempotent under repeated/racing decisions.
- Polling starts only for eligible states, merges without duplication and stops on final/unmount.

### Audit baseline checks

- Web production build/typecheck: **PASS** via `npm run build`.
- Web lint: **NOT AVAILABLE** as a package script.
- Web automated tests: **PASS** — `npm test` runs 33 deterministic contract tests, including the P1 games/summary/Match Day fixture matrix.
- Mobile lint: **BLOCKED BY BASELINE ENVIRONMENT/WORKTREE STATE** — `expo lint` reached ESLint but could not write its cache under the read-only mobile repository (`EPERM` at `.expo/cache/eslint/...`). This is not attributed to the web audit.
- Mobile typecheck: **FAIL (PRE-EXISTING BASELINE)** — `npm run typecheck` reports a large existing error set across Friends, manual summary, Settings, Teams, Profile, navigation, feed/card modules, test imports and Deno Edge Functions. Representative failures include duplicate object keys, missing/renamed properties, route-type mismatches, React Navigation generic drift, and test `.ts` import configuration. No failures were changed or fixed during this audit.
- Visual smoke: landing and sign-in rendered successfully at 1440×900; authenticated visual coverage awaits a safe test account/fixture environment.
- Build warning baseline: outdated Browserslist data and an approximately 1.63 MB main JavaScript chunk.

## 12. Open Questions / Product Decisions

1. **Anonymous game sharing:** should `/game/:gameId` be authenticated like current mobile, or should a new revocable/tokenized public contract expose a deliberately limited summary?
2. **Dashboard community depth:** after the approved bounded self/followed activity slice is measured, do users need a dedicated interaction surface for comments, likes, recommendations, or moderation? A separate `/feed` route is not approved by the current decision.
3. **Web tracking scope:** should web eventually create/capture games, or intentionally remain a viewer, management and export companion?
4. **Team terminology/URL:** confirm `/teams*` as the canonical user-facing web family while retaining redirects for `/squads*` and `/squad`.
5. **Web Player Card creation:** should a future approved stage port the current mobile editor/reserve/finalise/publish pipeline? The obsolete `/admin/manual-feed-post` placeholder and CTA are removed in the meantime.
6. **Player Card scope:** should web support the full editor/cutout pipeline, or only Album/view/share finished cards?
7. **Historical metric labels:** when canonical Impact 7 replaces the web-only rating, should previously displayed rating be removed, renamed “legacy,” or shown temporarily beside Impact 7?
