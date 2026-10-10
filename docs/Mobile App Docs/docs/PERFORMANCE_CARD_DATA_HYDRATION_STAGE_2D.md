# Stage 2D — Production Player Performance Card Hydration

## Scope

Stage 2D connects existing KickChasers player-game data to the performance-card model. It does not change feed rendering, card design, export, calculations, database schema, subscriptions or public navigation.

The only UI addition is a `__DEV__` and platform-admin protected data preview. It performs read-only queries and renders the existing White Editorial template.

## Canonical pipeline

```text
Existing production source
  ├─ Team Tracker events
  ├─ Single Player Tracker events
  ├─ Manual post payload
  ├─ Manual totals RPC
  ├─ Existing recap compatibility
  └─ Existing preview compatibility
            ↓
PlayerPerformanceCardSource
            ↓
Stage 1 player-card adapters
            ↓
Normalized foundation PlayerPerformanceCardModel
            ↓
PlayerPerformanceCardBuilder
            ↓
Media PlayerPerformanceCardModel
            ↓
Template registry → generic renderer
```

There are deliberately two model boundaries. The Stage 1 foundation model is the complete normalized player-performance contract already proven by fixture parity. The media model adds the stable card-facing identity, image and headline fields required by the template engine while retaining the complete foundation data.

Templates receive only the media `PlayerPerformanceCardModel`. They never receive a Supabase client, database row, `FeedItem`, hook or repository.

## Source coverage

### Team Tracker and Single Player Tracker

Both sources use the same `tracked` adapter. The repository supplies the original event stream, selected team side and player number, profile identity, game context, squad branding, opponent branding and custom-stat definitions. The existing event aggregator then computes built-in totals, fantasy, Impact7, benchmarks, headline statistics, quarter splits and locations.

The post type remains available to distinguish team-tracked and single-player recap provenance without creating a second calculation path.

### Manual stat posts

Embedded `manual_game_summary` payloads use `manual-payload`. Older posts with `manual_game_id` use the existing `rpc_get_manual_game_summary_for_post` result through `manual-totals`. Existing aliases and explicit fantasy/rating values remain authoritative.

### Recap, preview and existing export compatibility

The Stage 1 `legacy` and `preview` adapters can be projected by `PlayerPerformanceCardBuilder.fromFoundation`. `fromExistingModel` is an intentional no-op compatibility boundary for an already hydrated model. Existing export code continues to consume the same media model and was not changed.

## Reused production logic

Stage 2D does not contain formulas. It delegates to the existing modules for:

- player-event aggregation and stat aliases;
- manual totals and manual overrides;
- fantasy scoring;
- Impact7 rating;
- positional benchmarks;
- headline-stat selection;
- custom-stat extraction;
- match, image, logo and colour normalization;
- capability derivation.

The media builder performs only deterministic projection. It preserves the full normalized built-in statistics, available-stat list, custom stats, benchmarks, quarter splits, locations, image bundle, branding, capabilities, compatibility notes and identifiers.

White Editorial requires four visual stat slots. The builder places AFL Points first, then uses the existing authoritative headline selection. If fewer than four lines are returned, it fills remaining visual slots from already-normalized built-in values in a fixed order. It does not recalculate any statistic.

## Read-only production repository

`production-source-repository.ts` is the only new production-data boundary. It:

1. obtains recent supported posts through the existing feed repository;
2. classifies each as team tracked, single tracked, manual payload or manual totals;
3. retrieves the existing game/event/profile/custom-stat context required by the matching source adapter;
4. builds the canonical media model.

It performs no insert, update, delete, upload or RPC mutation. Manual totals use the existing read RPC. No table or schema change is required.

## Developer preview

Open:

```text
Admin → Developer Tools → Performance Data Preview
```

The screen is compiled behind `__DEV__`, repeats the platform-admin check, lists recent supported player games, hydrates the selected source and renders White Editorial from the resulting media model only. Diagnostics show source type, identifiers, Impact7, fantasy, headline values and capability flags.

The preview intentionally has no export, editing, feed publishing or database-write controls.

## Model contract

The expanded media model includes:

- all source, post, game, player, author, squad, club and manual identifiers;
- player identity, position, number, team side and image candidates;
- match round, date, venue, grade, competition, status, result and score;
- normalized club/opponent identity, branding, logos and colours;
- rating and complete structured Impact7 metadata;
- fantasy, four display headlines and every normalized built-in statistic;
- available-stat flags, custom stats, benchmarks, quarter splits and locations;
- image bundle and capability flags;
- source compatibility and builder provenance.

The White Editorial template continues to read only the subset it requires. Future templates can use the richer fields without returning to raw production rows.

## Testing and parity

Fixture tests compare the media projection against the existing Stage 1 adapter output for:

- tracked games;
- equivalent team and single-player tracked paths;
- manual payloads and aliases;
- manual totals with rating/fantasy overrides;
- preview, legacy recap and existing-model compatibility;
- custom stats, branding, images and capability flags.

The comparison asserts that normalized statistics, fantasy, Impact7, benchmarks and availability are unchanged.

## Known limitations

- The development preview depends on the current user having platform-admin access and read access to the underlying production records.
- Older feed posts can lack player identity, action photos, logos or detailed match fields. The model records those limitations through null values and capabilities; it does not fabricate production data.
- Apple Vision cutouts are local assets and are not stored in production. The preview uses the best existing production action/post/avatar image candidate. A final premium card still needs the normal cutout workflow for true transparent-player composition.
- Apple and device-level rendering remain outside this data-only stage.
- Physical-device verification is required against real production examples from every source category.

## Stage boundary

Stage 2D ends at canonical model hydration and the protected preview. Production feed integration, automatic cutout association, public template selection and publishing remain future work.
