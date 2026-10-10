# KickChasers project context

Last verified: 2026-08-11

Source of truth: reachable code under `app/`, `components/`, `hooks/`, and `lib/`; `app.json`, `eas.json`, and `package.json`; and ordered migrations under `supabase/migrations/`. Schema snapshots and older Markdown are secondary evidence only.

## Product today

KickChasers is a mobile-first grassroots Australian football platform. It combines match-day data capture, live authenticated viewing, player history and benchmarks, squad operations, club/league discovery, recap-led social content, team-selection publishing, and squad awards voting.

One tracked game can serve several audiences:

1. A player or tracker records events and locations.
2. Events are stored against the game, side, player identity, quarter, timer, stat definition, and optional field coordinates.
3. Live team-game trackers reconcile linked devices through Supabase Realtime; Match Day and live summaries poll current data.
4. Players receive game/season/career aggregates; coaches receive team totals, comparisons, maps, score worm, and PDF export.
5. Supporters who are signed in can discover eligible official games and open live summaries.
6. Finalised games can create feed recaps and shareable image cards or links.

## Implemented product pillars

- **Tracking:** single-player, full-team player tracking, two-sided linked team tracking, and playerless Team Stats Games.
- **Analysis:** live scores, player/team totals, quarter scopes, position-aware Impact 7 benchmarks (Forward, Midfield, Ruck, Defender), influence timeline, field markers/heat maps, team momentum indicators, and score worm.
- **Player history:** tracked and manually entered games, game logs, season/career aggregates, averages, public-to-members profiles, and follow relationships.
- **Squad operations:** custom and official squads, roles, invitations, requests, guests, guest claiming/merging, age/side groups, colours, team selection, and selection posts.
- **Awards:** configurable squad vote groups, award types, matchups, internal or token-based public vote cards, tallies, and reminders/assignment notifications.
- **Community:** recap-oriented feed, follows, likes, comments, recommendations, blocking/reporting, and platform moderation.
- **Administration:** official directory/admin requests, platform dashboard, moderation, manual feed publishing, squad archiving, league maintenance, and account deletion.

See `docs/CURRENT_FEATURE_MATRIX.md` for status and implementation paths. Status terms are `LIVE`, `PARTIAL`, `INTERNAL`, `INFRASTRUCTURE`, `PLANNED`, `LEGACY`, and `UNKNOWN`.

## Architecture

- Expo SDK 54, React Native 0.81, TypeScript, and Expo Router.
- TanStack Query for server-state caching and polling; Zustand for the new-game/tracker draft.
- Supabase Auth, Postgres, RLS, Realtime, Storage, and Edge Functions.
- SQLite is used only for the single-player pending-event queue. Team trackers write directly to Supabase.
- Sentry provides production crash/error telemetry when `EXPO_PUBLIC_SENTRY_DSN` is configured. There is no product analytics SDK.
- Two Edge Functions exist: `send-push` and `delete-account`.

## Current product boundaries

- Authentication is required for the normal app, Match Day, profiles, and match summaries. `/vote-card/[token]` is the only route explicitly allowed through the root auth gate.
- The web share landing page contains snapshot metadata and app-store fallback logic, but `/share/game/[id]` is not exempted from the root auth gate. Public web live viewing is therefore not complete.
- Match Day includes eligible official team games from followed leagues and excludes `team_stats_game`. It refreshes at 25 seconds; live summaries refresh at 10 seconds.
- Team Stats Games are coach/admin-oriented and intentionally excluded from the public Match Day list.
- Feed content is primarily tracked-game, manual-game, and team-selection recap content. It is not a general arbitrary-status composer for normal users.
- “AI reports” and AI captions are not implemented. Current recap copy and visuals are deterministic templates assembled on-device or in SQL.
- Subscription, price, Stripe-customer, and entitlement tables exist, but there is no paywall, checkout, receipt validation, or selectable premium-card tier in the client.
- No voice/speech dependency, service, screen, or event parser exists. `single_player_voice` survives only as an entitlement enum value.
- Profile Awards is a placeholder. Squad Best & Fairest voting is live but is not projected into player profile awards.

## Platform status

- iOS has a checked-in native project, tablet support, associated-domain entitlements, Apple sign-in configuration, push integration, and landscape tracker behavior on iPad.
- Android has managed Expo/EAS configuration, package/intent filters, adaptive icons, and Expo Notifications code, but no checked-in `android/` project or repository evidence of production device/store validation.
- Web is configured as a static Expo output and is used for the shared-game landing flow; full web parity is not implemented.

## Data and security boundaries

- Full profile rows are self-readable/self-writable; authenticated directory consumers use `profiles_directory`.
- Posts respect visibility, following, hidden status, and block relationships.
- Notifications are recipient-only; direct client inserts were revoked and security-definer triggers/RPCs create them.
- Official and custom squad management is role-gated in both UI and RLS/RPC helpers.
- Current baseline policies still grant any authenticated user read access to `games`, `events`, `game_players`, and `game_squads`, and all authenticated users can read `squads`. This is broader than the UI’s discovery model and must be treated as a privacy risk, not “public anonymous access.”
- Storage buckets are public-read. Object upload/update/delete paths are scoped by owner/prefix policies, with some legacy bucket/policy overlap.
- Security-definer functions are widely used. Recent functions generally pin `search_path` and validate `auth.uid()`, but the set should be reviewed whenever migrations change.

## Known drift and risks

- `src/lib/database.types.ts` is dated 2026-06-15 but omits many active tables, views, RPCs, and post-May `events` columns. Runtime repositories therefore use untyped Supabase access extensively.
- `supabase_schema.sql`, `supabase/prod_schema.sql`, and `supabase/prod_public_schema.sql` are dated 2026-03-01 and predate awards, custom stats, Team Stats Games, player groups, and linked match state.
- Focused first-party Node tests cover benchmark/rating fixtures and Player Card model projection; there is still no repository CI workflow that runs them automatically.
- Single-player offline queuing is not shared by team modes. Linked match controls also require network access.
- Push, universal/app links, Android release readiness, and PDF output are configured in code but cannot be certified from static repository evidence.

## Open verification items

- Production deployment/version of both Edge Functions and the values in `app_internal_settings`.
- Store listing availability and remote AASA/Android asset-links files for universal/app links.
- End-to-end push delivery on current production iOS and Android builds.
- Whether the production database exactly matches all 131 migrations; the local Docker stack was unavailable during this audit.
- Export layout on the supported device/tablet matrix.
