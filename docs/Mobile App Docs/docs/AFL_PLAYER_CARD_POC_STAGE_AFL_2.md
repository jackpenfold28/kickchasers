# AFL Player Card Proof — Stage AFL-2

Last verified: 2026-08-09
Status: development-only, non-persistent proof on `feature/afl-player-card-poc`

## Purpose and outcome

AFL-2 proves that one real API-Sports AFL player-match performance can be projected into the existing KickChasers Player Card engine without creating tracker data, a KickChasers profile, or persistent AFL records.

```text
API-Sports AFL
  → AFL-1 Edge Function and sanitized response
  → AflNormalizedPlayerMatchStatRowV1
  → one selected-player /players?id=<id> lookup
  → AflNormalizedPlayerMatchSnapshotV1
  → buildAflFoundationPlayerPerformanceCardModel
  → PlayerPerformanceCardBuilder.fromFoundation
  → PlayerCardGenerationService.prepareFromFoundation
  → existing White Editorial / Black Performance renderer
  → local 1080 × 1350 PNG
```

The reachable surface remains `Admin → Developer Tools → AFL API Test`, behind `__DEV__`, authenticated Supabase invocation, and platform-admin authorization. The **Player Card Proof** section is an internal diagnostic surface, not a production AFL product.

## Source and adapter boundary

`modules/afl-api/src/types.ts` distinguishes the provider match-stat row from the enriched card snapshot:

- `AflNormalizedPlayerMatchStatRowV1` is the AFL-1 normalized row. It has provider IDs, guernsey number, and only verified match statistics.
- `AflNormalizedPlayerMatchSnapshotV1` is assembled in memory by `buildAflNormalizedPlayerMatchSnapshot` after combining the selected row, selected normalized game, and one matching player-name response.
- `buildAflFoundationPlayerPerformanceCardModel` in `modules/afl-player-card/src/adapter.ts` is the only AFL-to-Player-Card mapping boundary.

No raw API-Sports response shape, Supabase row, `FeedItem`, tracker event, manual-total row, or fabricated completed-game option enters the card engine.

## Player selection and request behaviour

Player match statistics are fetched once for the selected game through the AFL-1 operation. Selecting one row triggers one `player` operation for that provider player ID. Successful names are retained in an in-memory component-session map, while the existing AFL client cache also coalesces duplicate requests and retains successful responses for five minutes. Names are not fetched for the full match roster.

Changing games clears the selected proof state but does not persist or upload anything. There is no polling.

## Verified stat mapping

| Provider normalized stat | Foundation built-in field | Availability |
| --- | --- | --- |
| `disposals` | `disposals` | Provider supplied |
| `kicks` | `kicks` | Provider supplied |
| `handballs` | `handballs` | Provider supplied |
| `marks` | `marks` | Provider supplied |
| `tackles` | `tackles` | Provider supplied |
| `goals` | `goals` | Provider supplied |
| `behinds` | `behinds` | Provider supplied |
| `goalAssists` | `goalAssists` | Provider supplied |
| `hitouts` | `hitouts` | Provider supplied |
| `clearances` | `clearances` | Provider supplied |
| `freeKicksFor` | `freesFor` | Provider supplied |
| `freeKicksAgainst` | `freesAgainst` | Provider supplied |

A provider-supplied zero is copied and its canonical key is included in `availableBuiltInStats`. An absent provider field is not included in that list and can never be selected for display. The foundation contract remains a dense compatibility structure, so unavailable numeric slots retain their neutral storage value; availability—not that storage slot—is authoritative for external sources.

The preferred AFL headline sequence is Disposals, Goals, Tackles, Marks, followed by Kicks, Handballs, and Clearances when a preferred field is unavailable. A supplied zero remains eligible. No missing field is inserted merely to fill a slot.

## Unavailable fields

AFL-2 does not claim availability for inside 50s, rebound 50s, contested possessions, uncontested possessions, disposal efficiency, turnovers, intercepts, one percenters, fantasy/AFL Points, position, or any other field not established in AFL-1.

### AFL Points

The media builder now checks canonical availability before adding AFL Points. For this source:

- `performance.fantasy` is `null`;
- `hasFantasyScore` is false;
- no `afl-points` headline is created;
- JSON templates that require rating and AFL Points fail closed rather than substituting zero.

Existing tracker/manual cards retain their original numeric fantasy values and headline behaviour.

### Rating and benchmarks

AFL-2 does not calculate Impact7 from an incomplete external input set and does not introduce an AFL-specific rating formula. The foundation rating is explicitly unavailable, the media `performance.rating` is `null`, and White Editorial/Black Performance omit the rating badge. No AFL benchmark bands are calculated. Existing sources with complete inputs retain their current rating, benchmark, and template-selection behaviour.

## Identity, team, and media

The external player identity is namespaced as `api-sports-afl:player:<providerPlayerId>`. Game and team identifiers are similarly namespaced. `playerProfileId`, `squadMemberId`, `authorProfileId`, profile identity, and Album ownership remain null. Provider team/opponent names and scores are projected as text context; provider logo URLs are not attached to the card.

The developer chooses a temporary local test cutout through the existing photo-library picker. An already-cut-out PNG is recommended. The URI is passed directly to the existing renderer and bounded local generation-output cache. AFL-2 does not create a Player Image row, read or write the persistent Player Image library, upload media, attach an Album record, or scrape/download player photography.

## Generation path

`PlayerCardGenerationService.prepareFromFoundation` is an additive source-neutral entry point. It accepts a canonical foundation model, temporary player image, and explicit compatible template. It validates final-match status, calls `PlayerPerformanceCardBuilder.fromFoundation`, and reuses the existing render-request preparation, template registry, transform defaults, hidden `PlayerCardGenerationRenderer`, and `GenerationOutputRepository`.

The proof exposes White Editorial and Black Performance only. Both use the existing scene renderer and support truthful omission of unavailable rating. The output repository verifies and retains a local 1080 × 1350 PNG. Production completion, Album, Feed, publishing, and profile actions are not exposed.

## Database and regression boundary

AFL-2 creates no migration or table and performs no AFL-data write. It does not write to profiles, squads, games, game players, events, manual totals, posts, Feed, Player Images, Albums, benchmarks, leaderboards, awards, or notifications. The only server-side database interaction remains the existing platform-admin authorization check in AFL-1.

Existing `prepare` and `prepareWithPlayerImage` generation methods are unchanged at their call sites. Tracker/manual adapters, source hydration, automatic production selection, Player Card workflow, templates for available ratings, Match Day, summaries, PDF export, and publishing paths retain their existing behaviour.

## Developer reproduction

1. Open `Admin → Developer Tools → AFL API Test` in a development build as a platform admin.
2. Fetch a date containing a completed match and select it.
3. Fetch player statistics.
4. In **Player Card Proof**, select one player and wait for the single name lookup.
5. Choose a permitted local test cutout PNG.
6. Choose Black Performance or White Editorial.
7. Build the card model, preview it, then generate the PNG.
8. Inspect the normalized snapshot, foundation model, media model, template, dimensions, and local URI.

## Known limitations and next recommendation

- Manual device validation is still required for real provider data, local picker behaviour, visual composition, and final PNG dimensions.
- No provider photography or marks are used; licensing, attribution, caching, redistribution, and team/player identity terms remain unresolved for production.
- The free-plan quota and data window remain provider-controlled.
- External stats are intentionally session-only, with no season sync, correction model, live polling, or durable identity catalogue.

If this device proof succeeds, AFL-3 should be a design/audit stage for production identity, licensing, retention, and a dedicated external AFL cache model before any live-data or public Player Card surface is built.
