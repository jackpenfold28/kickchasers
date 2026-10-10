# Player-performance card template foundation — Stage 1

Status: dormant, additive architecture

Verified: 2026-07-28

Branch: `feature/player-card-template-foundation-stage-1`

> The new player-card architecture is not yet connected to active production rendering.

## Safety boundary

Stage 1 adds a canonical model, pure source adapters, a template contract,
metadata registry, semantic tokens, canvases, fixtures and tests. It does not
change current rendering, post creation, queries, formulas, database schema,
social controls, sharing, Instagram output or export dimensions.

No active component imports `components/feed/player-card/adapters` or
`components/feed/player-card/template-registry`. The legacy components remain
the only production rendering paths.

## Active path verification

| Surface / state | Source and parent | Post/data source | Business logic | Renderer | Export behavior | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| Main feed | `app/(tabs)/feed.tsx` → `FeedPostCard` | `useFeed` / `feed-repository`, `FeedItem` | `FeedPostCard` variant switch; tracked details from `usePostBenchmarks`; manual details from `manual-post-adapter` | `FeedSocialCard`, `ManualFeedSocialCard`, or team renderer | Native capture and Instagram modal are owned by `FeedSocialCardBase` | Active |
| Profile posts | `components/profile/ProfileScreen.tsx` | `fetchFeedItemsByIds` and profile queries | Local branch mirrors the feed variants | Direct `FeedSocialCard`, `ManualFeedSocialCard`, `TeamTrackedFeedSocialCard` | Same card-owned native/Instagram behavior | Active |
| Game log share preview | `components/me/GameLogTab.tsx` | Game rows, event/stat queries, manual totals RPC/table data; constructs preview `FeedItem` | Game-log share decision and post payload construction; manual adapter for manual preview | Direct `FeedSocialCard`, `ManualFeedSocialCard`, or team renderer | Preview only; confirming writes the existing post, then normal card export applies | Active |
| Tracker end-game preview | `app/tracker.tsx` | In-memory tracker state plus persisted game/events; constructs `previewPost` | Tracker totals and existing `usePostBenchmarks` query path | `FeedSocialCard` | Same card-owned native/Instagram behavior; uploaded background remains 4:5 | Active |
| Manual-game preview | `app/add-game-stats.tsx` | Form payload/manual game state | Existing manual payload builder and adapter | `ManualFeedSocialCard` | Same card-owned export after render | Active |
| Admin manual preview | `app/admin/manual-feed-post.tsx` | Admin form, manual post payload/RPC | Existing manual adapter | `ManualFeedSocialCard` | Same card-owned export after render | Active |
| Onboarding/demo | `components/onboarding/steps/PhotosStep.tsx` | In-memory demo `FeedItem` and benchmark data | Locally constructed demo values | `FeedSocialCardBase` | Card shell is demonstrated; no new adapter | Active demo |
| Moderation post preview | `components/admin/ModerationPostCard.tsx` → `FeedPostCard` | Moderation result hydrated as `FeedItem` | Normal `FeedPostCard` variant switch | Normal production renderers | Same renderer behavior if controls are reachable | Active admin |
| Native share | `FeedSocialCardBase` in `components/feed/FeedSocialCard.tsx` | Already rendered native view | `captureRef` PNG quality `0.95`, then React Native `Share.share` | Captures the current card ref | Existing dimensions/layout are untouched | Active |
| Instagram preview/export | `FeedSocialCardBase` → `InstagramPosterPreviewModal` → `InstagramPosterView` | Display post, three poster stats, optional rating | Modal derives player number from payload; view formats rating and visual band | Dedicated legacy poster renderer | `captureRef` PNG quality `1`, temporary file, save to media library; 4:5 preview | Active |
| Legacy player stat card | `components/feed/PlayerStatCardPost.tsx` → `components/StatCard.tsx` | Direct Supabase/React Query fetch by post/game/team/player | Component-local query and data assembly | `StatCard` | No active export route found | Orphaned/legacy |
| Standalone `StatCard` | Only imported by `PlayerStatCardPost` | Props supplied by legacy parent | Local rating/stat presentation | `StatCard` | None found | Orphaned/legacy |

### Active component relationships

```text
feed / moderation
  └─ FeedPostCard
      ├─ FeedSocialCard ─┐
      ├─ ManualFeedSocialCard ── FeedSocialCardBase
      └─ TeamTrackedFeedSocialCard

profile / game log
  ├─ FeedSocialCard ─────┐
  ├─ ManualFeedSocialCard ── FeedSocialCardBase
  └─ TeamTrackedFeedSocialCard

FeedSocialCardBase
  ├─ native capture/share
  └─ InstagramPosterPreviewModal
      └─ InstagramPosterView

PlayerStatCardPost
  └─ StatCard (no reachable production caller found)
```

## Current tracked data flow

```text
posts/feed view + games + events + profiles_directory + league_grades
  ↓ feed-repository / direct Supabase queries
FeedItem
  ↓ usePostBenchmarks (React Query)
payload team_side/player_number + game metadata + event counts
  ↓ computeCoreStatsFromEvents / headline utility / benchmark utilities / Impact7
FeedSocialCardBenchmarkData
  ↓ FeedSocialCard
FeedSocialCardBase
  ↓ native render, capture/share, or Instagram poster modal
```

Tracker creation remains in `app/tracker.tsx`: it writes a
`player_stat_card` post with `team_side` and `player_number` in the existing
payload and links the game. Stage 1 does not alter that write.

## Current manual data flow

```text
manual_game_summary post
  ├─ structured post payload
  └─ manual_game_id → manual totals row/RPC plus club/profile/game context
      ↓
manual-post-adapter (React Query + Supabase + manual normalization)
      ↓
display FeedItem + FeedSocialCardBenchmarkData
      ↓
ManualFeedSocialCard
      ↓
FeedSocialCardBase → native render/share/Instagram
```

## Canonical model

`PlayerPerformanceCardModel` is versioned and split into:

- identifiers;
- player and distinct author identities;
- match context and explicit score/result/status state;
- complete normalized built-in stats and availability;
- custom stats, headline stats, benchmark bands, Impact7, quarter splits and
  location points;
- resolved branding and image-source classification;
- post content and source classification;
- derived capability flags;
- benchmark context and explicit compatibility metadata.

The final model never exposes a Supabase row or `FeedItem`. Raw source shapes
exist only at the adapter boundary.

## Source adapters

- `buildTrackedPlayerPerformanceCardModel` consumes prepared tracked post,
  identity, match, branding and event inputs.
- `buildManualPayloadPlayerPerformanceCardModel` maps the current payload stat
  aliases through `mapManualTotals`.
- `buildManualTotalsPlayerPerformanceCardModel` consumes the existing
  `ManualTotalsRow` contract used by the RPC/table-backed path.
- `buildPreviewPlayerPerformanceCardModel` uses the tracked normalization path
  but marks the model as preview.
- `buildPlayerPerformanceCardModel` is a discriminated-union dispatcher.
- `buildLegacyPlayerPerformanceCardModel` is an opt-in source classification
  adapter only; it does not render the legacy card.

Adapters accept URL resolvers. Tests use deterministic pass-through resolution.
Future production integration can explicitly pass the existing
`resolveImageUrl` and `resolveLogoPublicUrl` bundle from
`production-resolvers.ts`. This prevents pure tests from initializing Supabase.

## Authoritative logic reused

| Concern | Existing source reused |
| --- | --- |
| Event aggregation, custom codes, fantasy, efficiency, quarters | `lib/player-event-aggregate.ts` |
| Manual alias/availability/override mapping | `lib/manual-game-totals.ts` |
| Headline ranking and priority inclusion | `lib/card-headline-stats.ts` |
| Impact7 and stat bands | `lib/stats-eval.ts` |
| Position groups | `lib/position-benchmark.ts` |
| Benchmark thresholds/types | `constants/benchmarks.ts` |
| Colour normalization | `lib/color-utils.ts` |
| Production image URL resolution | `lib/feed-repository.ts` via opt-in resolver |
| Production logo URL resolution | `lib/logo-storage.ts` via opt-in resolver |

No formula was added or changed.

## Compatibility findings

1. Manual payloads and totals can contain authoritative `af` and `rating`
   overrides. Tracked cards compute both. The canonical rating and compatibility
   metadata preserve the source.
2. Current manual sources have no quarter, event-location or custom-stat
   collection. These arrays remain empty and capability flags are false.
3. Current tracked `usePostBenchmarks` has a smaller event projection and a
   separate count-building path from `player-event-aggregate`. Standard `K`,
   `HB`, `D`, `M`, `T`, `G`, `B`, `FF`, and `FA` events are parity-tested.
   Modifier-only `K_EF`/`K_IF`/`HB_EF`/`HB_IF` records are more completely
   represented by the authoritative aggregator; this edge case needs
   production-data parity measurement before migration.
4. Tracked team-game hydration resolves position from the game-player snapshot,
   then current linked profile, then current squad member, with legacy payload
   data as a final compatibility source. Manual totals resolve subject position
   through explicit, subject-profile and legacy-author fallbacks. The data layer
   supplies the normalized position to the canonical model.
5. Manual payload normalization accepts the established compact and long-form
   aliases. Existing stored payloads remain untouched.
6. Date formatting intentionally mirrors the current `en-AU`, short-month,
   numeric-day display, and rating remains `toFixed(1)`.
7. The current Instagram poster treats ratings above `9` as the gold elite
   visual treatment while the semantic band becomes Elite at `8`. Both existing
   thresholds are documented; Stage 1 does not reconcile them.

## Template contract and registry

`PlayerPerformanceCardTemplateProps` contains only the canonical model, one of
`feed | preview | share | export`, a typed canvas, layout metrics, semantic
tokens, visual-only configuration, and an optional presentation press callback.

The dormant registry contains only `legacy-player-recap-v1` metadata. It has no
component reference. Missing or unknown IDs resolve to this definition. It does
not persist template IDs and is not imported by any active path.

## Capabilities

All capability flags are computed once from canonical fields:
action photo, avatar, jersey number, position, rating, benchmark, fantasy,
location, scoring map, quarters, custom stats, team/opponent/league branding,
result, score and advanced stats. Callers do not manually supply flags.

## Future canvases and tokens

The dormant configurations define:

- logical feed portrait: 400×500 (4:5);
- Instagram portrait: 1080×1350 (4:5);
- square: 1080×1080 (1:1);
- story: 1080×1920 (9:16).

Semantic tokens name typography, spacing, radius, overlay, shadow/glow,
rating-band colour, club fallback and image fallback roles. They do not replace
current hard-coded styles.

## Stage 2 boundary

A separately approved Stage 2 should:

1. build template-only visual implementations against fixtures;
2. add visual parity evidence for the legacy design;
3. measure the tracked modifier-event compatibility issue against anonymized
   production-shaped data;
4. keep social controls and export orchestration outside templates;
5. choose one low-risk preview surface for an explicit, reversible integration
   experiment before any feed migration.

Stage 2 must not automatically migrate feed, profile, game log, tracker,
onboarding, moderation, native sharing or Instagram export.
