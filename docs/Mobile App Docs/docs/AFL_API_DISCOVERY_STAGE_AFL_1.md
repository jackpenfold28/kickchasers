# AFL API Discovery Lab — Stage AFL-1

Last verified: 2026-08-09
Status: implemented on `feature/afl-api-discovery-lab`; non-persistent developer discovery only

## Purpose and boundary

Stage AFL-1 proves authenticated access to API-Sports AFL and records the real response contract before any Player Card integration. The reachable surface is `Admin → Developer Tools → AFL API Test`. It is hidden outside development builds, requires an authenticated KickChasers session in the app, and the Edge Function independently requires platform-admin authorization.

This stage does not write AFL data to Supabase or any local durable store. It does not create migrations or tables, and it does not read from or write to KickChasers `games`, `game_players`, `events`, summaries, feeds, Player Cards, Player Images, albums, publishing, Match Day, or tracker workflows.

## Security model

- The provider secret is named `API_SPORTS_KEY` and exists only in Supabase Edge Function environment configuration.
- Local development uses `supabase/.env.local`. That file is covered by both `supabase/.gitignore` and the repository root `.gitignore`.
- Start the local function with `supabase functions serve afl-api-test --env-file supabase/.env.local`.
- Never use `EXPO_PUBLIC_*` for the provider key. The mobile bundle contains neither the key nor a provider authorization header.
- `supabase/functions/afl-api-test/index.ts` accepts POST only, validates one of six fixed operations, uses fixed provider paths, rejects unknown fields, verifies the user JWT, and calls `f_is_platform_admin()` under that user session.
- Provider account name/email fields and common credential/token keys are redacted from the raw inspection payload. Errors returned to the app do not contain the key, request headers, or arbitrary upstream URLs.

For a hosted environment, set the function secret through Supabase secret management, for example `supabase secrets set API_SPORTS_KEY=...`; do not commit it. Deployment and hosted secret configuration are outside AFL-1.

## Verified provider contract

The following was established from the official AFL host using the smallest practical authenticated requests. No contract was copied from API-Football or another API-Sports product.

### Host, authentication and envelope

- Base URL: `https://v1.afl.api-sports.io`
- Authentication header: `x-apisports-key`
- Common envelope fields observed: `get`, `parameters`, `errors`, `results`, optional `paging`, and `response`.
- Provider logical errors can arrive in a successful HTTP response and must be detected through `errors`.
- No provider update timestamp was observed. The lab therefore reports `providerUpdatedAt: null`; its own `receivedAt` is the Edge Function receipt time, not a provider update time.

### Competitions and seasons

`GET /leagues` returned 16 league-season records. The AFL Premiership competition was observed as league ID `1`, with records for seasons 2011 through 2026 and `current: true` on 2026. A separate seasons request is not needed for this discovery journey.

### Games

Verified requests:

- `GET /games?date=YYYY-MM-DD` for a deliberately bounded day lookup.
- `GET /games?id=3604` for one selected game.

The game response supplied:

- `game.id`;
- `league.id` and `league.season`;
- `date`, `time`, a string `timestamp`, and `timezone`;
- `round`, `week`, `venue`, and optional `attendance`;
- `status.long` and `status.short`;
- home/away team `id`, `name`, and `logo`;
- home/away `score`, `goals`, `behinds`, `psgoals`, and `psbehinds`.

Observed status values included `{ long: "Finished", short: "FT" }`, `{ long: "Second Quarter", short: "Q2" }`, and `{ long: "HalfTime", short: "HT" }`. AFL-1 classifies only `FT` as final and the observed `Q1`–`Q4`/`HT` forms as live; every other code remains `other` until observed and verified.

The current free provider plan rejected a historical-season request and then rejected a historical date outside its permitted date window. The lab exposes those sanitized provider errors and does not silently widen a request.

### Quarters

`GET /games/quarters?id=3604` returned a game ID plus quarters 1–4. Each quarter supplied home and away team IDs, goals, behinds, and points. The observed values progressed cumulatively and quarter 4 matched the final score. AFL-1 preserves the values without deriving per-quarter increments.

### Players and match statistics

The verified match-stat request is:

`GET /games/statistics/players?id=3604`

`/games/statistics?id=3604` was tested and rejected by the provider as a nonexistent endpoint, so it is not exposed.

The response grouped player rows under `game → teams → team + players`. Every player row observed supplied:

- `player.id` and `player.number`;
- `goals.total` and `goals.assists`;
- `behinds`;
- `disposals`;
- `kicks`;
- `handballs`;
- `marks`;
- `tackles`;
- `hitouts`;
- `clearances`;
- `free_kicks.for` and `free_kicks.against`.

No player name was present in the match-stat response. `GET /players?id=757` separately returned only `id` and `name`. A team roster lookup required a season, and the free plan rejected the current 2026 season. The lab therefore presents provider player IDs and guernsey numbers, with name explicitly unavailable unless a separate manual player lookup is performed.

The response did not supply fantasy points, disposal efficiency, contested possessions, uncontested possessions, inside 50s, turnovers, intercepts, one percenters, position, or player images. These fields are not invented, defaulted to zero, or included in the normalized DTO.

A deliberately paired live check returned 25 and 26 player rows for game `3605` while its game status was `HT`. The live rows used the same field set as the finished-game response. This proves that the endpoint can return player statistics during a live match; it does not establish completeness, correction behaviour, refresh cadence, or production suitability.

### Pagination, quota and timing

- `paging: { current, total }` was observed on status/error envelopes. It was absent from successful game and player-stat envelopes inspected in AFL-1. The lab preserves it when supplied and returns `null` otherwise.
- Observed headers were `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-requests-limit`, and `x-ratelimit-requests-remaining`.
- At discovery time they represented a 10-request per-minute limit and 100-request daily limit. These values are displayed from each response header and must not be treated as permanent product constants.
- Some provider error responses omitted quota headers. Missing quota data remains `null`.

## Implementation map

```text
Admin development screen
  app/admin/afl-api-test.tsx
        ↓ authenticated Supabase Functions invoke
JWT + f_is_platform_admin() authorization
  supabase/functions/afl-api-test/index.ts
        ↓ fixed URL + x-apisports-key
API-Sports AFL
        ↓ sanitized provider envelope
Defensive AFL-1 normalization
  modules/afl-api/src/normalization.ts
        ↓
Normalized snapshots + sanitized raw + quota metadata
        ↓
In-memory five-minute session cache / duplicate-request coalescing
  modules/afl-api/src/client.ts
```

`modules/afl-api/src/request.ts` is the shared strict operation validator. `modules/afl-api/src/types.ts` defines the versioned normalized DTOs. These are discovery DTOs, not KickChasers tracker events and not `PlayerPerformanceCardModel`.

Allowed operations are `status`, `leagues`, `games`, `game-quarters`, `game-player-stats`, and single-ID `player`. There is no generic URL proxy. Game lookup exposes only the two filters verified in AFL-1: a positive provider game ID or one `YYYY-MM-DD` date. ID cannot be mixed with another filter.

## Normalization rules

- A verified numeric zero remains zero.
- A missing, null, malformed, or unverified stat remains absent.
- Required provider identity fields such as game/team/player ID cause normalization to fail closed when missing.
- Raw API field names terminate at the Edge Function normalization boundary for the typed UI path.
- Sanitized raw data remains available in the lab only for contract discovery.
- `schemaVersion: 1` makes later contract changes explicit.
- No AFL value is translated into KickChasers tracker stat keys or Player Card fields in this stage.

## Request and cache behaviour

All requests are initiated by explicit buttons; none run on render and there is no polling. Identical requests are coalesced while in flight and successful responses use a five-minute in-memory app-session cache. “Test Connection” and “Fetch Selected Game” explicitly force a fresh provider request; the response shows `provider` or `session-cache` as its source. Cache contents disappear with the app process and are never persisted.

The intended minimal journey is:

1. Test connection.
2. Optionally load competitions/seasons once.
3. Fetch one date's games.
4. Select and optionally refresh one game.
5. Fetch quarter scores and/or player match statistics for that one game.

## Known limitations and deferred work

- Live scores, `Q2`/`HT` status, and live player-stat rows were observed, but live stat completeness, correction behaviour, and update latency are not yet a reliable contract. AFL-1 performs no polling.
- Provider plan restrictions currently prevent reliable current-season roster/name enrichment in the discovery environment.
- Provider logos are represented as remote URLs in normalized data but are not persisted or reused elsewhere.
- Licensing, attribution, retention, redistribution, team marks, and player identity terms must be resolved before production use or persistence.
- API quotas, accessible seasons/date windows, fields, and endpoint behaviour are plan-dependent and can change.
- AFL-2 must not begin until this contract and product/licensing requirements are reviewed. Player Card mapping, database design, sync jobs, Match Day integration, and benchmarks are explicitly deferred.

## Validation

Focused tests live at `modules/afl-api/__tests__/afl-api-normalization.test.ts` and cover verified game/player fixtures, zero-versus-missing semantics, malformed required fields, and strict request rejection. The lab should additionally be validated locally with an authenticated platform-admin account and the ignored `supabase/.env.local` secret file.

## Next recommended stage

Proceed to an AFL-2 design/proof only after platform-admin device validation and licensing/retention review. The smallest AFL-2 should select one completed game and one returned player, optionally resolve that one player's name, and adapt the AFL-1 player-match DTO into the existing canonical Player Performance Card model entirely in memory. It should not add tables, season sync, live polling, benchmarks, new templates, or production entry points until that projection is proven.
