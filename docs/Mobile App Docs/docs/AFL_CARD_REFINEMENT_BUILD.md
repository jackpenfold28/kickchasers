# AFL Card Refinement Build

Last updated: 2026-08-11
Status: implemented and physically validated on `feature/afl-player-card-poc`

## Scope

This refinement was first proven under `Admin → Developer Tools → AFL API Test`. It turns one in-memory API-Sports player-match snapshot into a rated, branded canonical Player Card and hands that source to the existing Player Card image/cutout/editor/export workflow. The same projection is now reused by the production Admin creator described in `AFL_ADMIN_CARD_CREATOR_INTEGRATION.md`.

It creates no migration or AFL table and writes no provider fixture, player, statistic, profile, squad member, Player Image, Album card, or post. The external source is explicitly `external-afl-performance`; it is not a `CompletedPlayerGameOption`.

## Shared Fantasy formula

The production implementation in `lib/player-event-aggregate.ts` was audited before the AFL path changed. `finalizeTotals` now delegates its unchanged calculation to the source-neutral `computeFantasyPoints` helper:

```text
Fantasy =
  kicks × 3
  + handballs × 2
  + marks × 3
  + tackles × 4
  + hitouts × 1
  + goals × 6
  + behinds × 1
  + freesFor × 1
  - freesAgainst × 3
```

Clearances are not included. The AFL adapter does not contain its own weights. All nine provider fields must be present; a supplied zero is valid, while an omitted field blocks Fantasy and Impact7 rather than becoming zero.

## Impact7 and position

The adapter calls the existing `buildPlayerCardRating`, which delegates to `computeGameRatingImpact7`. Its weighted input set is:

- disposals
- tackles
- goals
- behinds
- marks
- fantasy points
- frees for
- frees against

Its milestone input set is goals, tackles, marks, and disposals. The developer selects one existing `PositionCode`: `FWD`, `MID`, or `DEF`. `resolveBenchmarkGroup` passes this to the existing `Forward`, `Mid`, or `Defender` Impact7 cohort. No AFL-specific rating weights, override, benchmark context, or template thresholds exist.

The canonical rating is marked `source: computed`. Existing automatic template selection receives that numeric rating unchanged.

## Explicit team mapping

The temporary mapping in `modules/afl-team-branding` is provider-ID based. Names are presentation data only and are never used to infer identity.

| API-Sports team | Provider ID | KC club ID | KC official squad ID |
|---|---:|---|---|
| Adelaide Crows | 1 | `623bedbf-f50f-40b4-92b3-6386d567eaed` | `1bb269ac-8a78-4e2f-9231-a338d11aef27` |
| Brisbane Lions | 2 | `814a68bd-83ac-4a5d-a675-95c334c73830` | `aad48f0c-e780-4708-aaa9-3b61bb618932` |
| Carlton Blues | 3 | `c4741b17-7b05-4864-9297-6c6167ceffa0` | `ed445667-0357-41ba-88eb-163720472e88` |
| Collingwood Magpies | 4 | `f0208877-aa81-47d5-8d80-bc6a8e5ad406` | `04610dd9-e9f6-4c6b-a41e-a881a70fadd3` |
| Essendon Bombers | 5 | `a74df744-f199-42bb-887b-6413322aaa4d` | `c1fb7c29-22ba-47ac-9eaf-db442ae4328d` |
| Fremantle Dockers | 6 | `7d518e6e-6521-4f12-ad83-0016442cbc11` | `d330abd8-a20d-4567-a798-198d113d6b58` |
| Geelong Cats | 7 | `4e244b86-2beb-45b1-baa8-b7ab6feb6454` | `3ddeda7f-8f2f-4cdf-9e9b-b1aedcb36138` |
| Gold Coast Suns | 8 | `becb9b63-1099-4318-967f-4152697b43e9` | `409ec883-f5b5-4778-b2ab-47f7f766275e` |
| GWS Giants | 9 | `c8c0a355-0386-41ae-abcc-d32a13ea492e` | `3aa58e9c-b66a-4911-a0f0-90c9ee94ecbc` |
| Hawthorn Hawks | 10 | `9ae8f908-35c7-44b3-be68-f48f59f58aca` | `f6a29592-a679-4027-8527-9c2a2c0066a1` |
| Melbourne Demons | 11 | `cdf6800e-80e6-441c-b1df-fef866cc2713` | `f536e614-a339-4d76-8d72-3f89c937c876` |
| North Melbourne Kangaroos | 12 | `e9617ca5-3cd9-40c1-bba1-16c26d314e36` | `da8a90e1-5972-41db-b940-a0c726e99690` |
| Port Adelaide Power | 13 | `9e474e79-8872-4f5b-8784-7b6819d6fb1c` | `d3e4e4c1-867b-4a1b-9317-4e3ae5662bab` |
| Richmond Tigers | 14 | `8b5a0072-6003-41c3-baa8-c444399db69b` | `a3d84f50-4b61-4247-9069-e26517f32a63` |
| West Coast Eagles | 15 | `ad87735c-a95b-4b3d-a90a-b2972321afcf` | `491c4999-1e51-4df3-a2de-d451d615be1f` |
| St Kilda Saints | 16 | `eba74596-5f4c-43a5-82dd-49f4b4341f5a` | `50d5cbe2-371c-40a4-8ac7-dbbf1b8a1381` |
| Sydney Swans | 17 | `c4a02517-d369-4482-90ec-6b001e69767c` | `9a3feda9-67f3-4f7a-96d8-1f1e91370759` |
| Western Bulldogs | 18 | `f4a260e3-b6c6-4aad-aa7a-81ec4ad4a5c8` | `aa22a127-e3df-43cf-b09f-586f8566e78b` |

This configuration is a release-proof bridge and should move to a dedicated external AFL mapping table when the persistent AFL domain is approved.

## Staging branding audit and resolution

The ordered migrations seed the mapped AFL club/squad identities but do not establish complete logo/colour values. A read-only unauthenticated staging query was attempted; current RLS correctly returned no rows. No service-role secret or RLS bypass was introduced merely to inspect them.

The signed-in, platform-admin development screen therefore performs the authoritative runtime read of all 18 mapped club and squad rows using the existing app session. For the selected team and opponent it exposes the resolved IDs, names, logo availability, colours, and source in the proof inspector.

Resolution is field-safe and ordered:

1. mapped official squad logo/colours;
2. mapped club logo/colours;
3. explicit development-only AFL colour fallback;
4. neutral KickChasers fallback.

Stored logo paths are resolved with `resolveLogoPublicUrl`; colours use `normalizeHexColor`. API-Sports logo URLs remain only in provider diagnostics and are not used, downloaded, or persisted by the card path. Clubs have no tertiary column, so tertiary resolves from squad then the explicit test fallback.

## Canonical metadata

The foundation projection automatically supplies the provider player name and match guernsey number, team and opponent, scheduled date, round, venue, score, truthful win/loss/draw result, verified provider statistics, derived Fantasy, selected position, and computed Impact7. Missing provider data remains unavailable. No KickChasers game or player identity is manufactured.

### AFL match metadata presentation

The verified AFL-1 game fixture supplies:

```text
round: Regular Season - 22
week: 22
date: 2026-08-09T04:20:00+00:00
time: 04:20
timezone: UTC
venue: Optus Stadium
```

`AflNormalizedGameSnapshotV1` keeps those provider fields. The selected-player snapshot preserves the raw round label as `providerRoundLabel`, the numeric week as `providerWeek`, the full datetime as `scheduledAt`, and the venue unchanged.

The external AFL card projection derives presentation metadata without modifying that source:

```text
ROUND 22
9th AUG
OPTUS STADIUM
```

`formatAflCardDate` reads the explicit `YYYY-MM-DD` calendar component instead of converting the timestamp through the device timezone. This prevents a UTC/device conversion from moving the displayed match onto another day. It adds the correct English ordinal suffix and uppercase abbreviated month; the year and kickoff time are not placed in the card display model.

`resolveAflCardRound` uses a positive integer provider `week` first, then a trailing numeric round from the provider round label, then the optional developer-session manual override. A generic label such as `Regular Season` is never displayed as the card round. If none is available, the AFL round line is omitted. The manual field appears in the AFL Player Card Proof only when provider resolution fails and is never persisted.

White Editorial and Black Performance use the existing three footer positions for the AFL-only round/date/venue values. Existing non-AFL sources retain their current round/opponent/date footer content. Other templates receive the same clean canonical metadata and may display venue where their authored bindings support it.

## Existing editor handoff

`ExternalPlayerCardWorkflowSource` contains the complete foundation model and the existing automatic template selection. `PlayerCardProductionWorkflowService.createExternal` reuses the same photo preparation, Apple Vision subject detection, cutout draft, placement, template preview, and 1080 × 1350 export path. The final generation call is `prepareFromFoundation`, so production tracker hydration is never invoked.

In external mode the workflow does not query or persist the Player Image library, does not offer save-as-default, Album or post actions, and does not pass the source to publishing components. Local chosen media and generated output remain temporary.

## Creator identity and avatar

The AFL player and card creator remain separate canonical identities. The external AFL adapter leaves `player.profileId` and `player.avatarUrl` null, while the protected developer workflow reads the currently authenticated platform admin through the existing profile-summary hook and projects that profile into `author`. No admin ID is hardcoded and no profile, squad-member, or AFL identity record is created.

For `external-afl` foundations only, the media builder sources the small footer avatar from `author.avatarUrl`. The hero cutout continues to come from the temporary selected AFL player image. Existing tracked, manual, preview, and legacy sources retain their player-avatar behavior. A missing or unresolved admin avatar remains null and uses the existing template fallback: the avatar layer is omitted and card generation continues.

## Current constraints

- The developer proof's full selection → cutout → template → export journey, including the authenticated platform-admin avatar, has been physically validated.
- Physical-device validation remains required for the new production Admin source selector and its responsive layout.
- Provider-field completeness is validated per selected row; missing Fantasy inputs intentionally block rating.
- The club/squad mapping is explicit code configuration, not the future durable AFL domain.
- The staging branding report is visible under the authenticated developer session; headless anon access is intentionally insufficient under RLS.
- Persistent AFL storage, live polling, provider media, benchmarks derived from AFL data, and public AFL surfaces remain out of scope.
