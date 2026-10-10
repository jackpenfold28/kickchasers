# Admin AFL Card Creator Integration

Last updated: 2026-08-11
Status: compact creator and platform-admin Feed publishing implemented on `feature/afl-player-card-poc`; physical-device validation pending

## Entry point and source boundary

The existing protected `Admin → Manual Feed Post` card creator now presents three additive sources:

```text
Manual | KickChasers Game | AFL
```

Manual retains the existing `manual_player_game_totals` workflow. KickChasers Game opens the existing completed-game generator. AFL stays on the protected Admin route and performs a non-persistent external lookup. It does not create or update KickChasers games, events, game players, profiles, squad members, Player Images, or Album records. A finished generated PNG can be published as a normal Feed post by the authenticated platform admin.

## AFL selection flow

The selector progresses through season, round, completed game, player row, resolved player identity, and position. Seasons come from the normalized `/leagues` operation and default to the current AFL Premiership season. The selected season is requested once with the allow-listed `games` filter `{ league, season }`; numeric rounds and their game choices are derived locally from that response. The existing AFL client cache and in-flight request coalescing prevent duplicate requests during the Admin session.

Player statistics are fetched only after a game is selected. The selector uses provider player/team IDs and match guernsey information from that response; it does not request every player name. After one player row is selected, exactly that provider player ID is resolved through the existing player operation. Provider errors, including plan and historical-season restrictions, are converted to a concise Admin message and do not expose raw responses or quota diagnostics.

Upstream selection changes clear every downstream value so that a player, position, or card source cannot remain attached to a different season, round, or game.

## Shared canonical projection

Both the Developer AFL proof and production Admin AFL source call `buildAflExternalPlayerCardWorkflowSource`. That builder owns the single path from verified normalized AFL DTOs through:

```text
normalized game + selected player-match row + resolved player
    → AFL player-match snapshot
    → mapped team/opponent branding
    → AFL foundation adapter
    → ExternalPlayerCardWorkflowSource
```

The performance subject remains the external AFL player. The card author is the currently authenticated platform admin resolved through the existing profile-summary path. The admin avatar feeds the canonical author media field; the temporary selected AFL photo remains the hero image. No external player is assigned a KickChasers profile identity.

## Existing editor and output

The Admin AFL source embeds the existing `PlayerCardWorkflowScreen` through `PlayerCardProductionWorkflowService.createExternal`. Position, template selection, image/cutout preparation, template rendering, 1080 × 1350 export, and sharing therefore use the existing production components and renderer rather than an AFL-specific editor.

The external workflow continues to support local export and sharing. It also offers a dedicated source-neutral Feed action after rendering; it does not invoke the Album-coupled completion service or manufacture profile, game, or player identity.

## Responsive Admin presentation

The source picker uses the same compact visual rhythm as the Player Card editor with the established Admin yellow accent: a bounded editor-style header, small `MATCH`, `PLAYER`, `POSITION`, and `PERFORMANCE` labels, paired year/round controls where width permits, a branded match row, an inline FWD/MID/DEF segment, a concise performance confirmation, and an explicit readiness hint above the CTA. Selecting a game starts one player-stat query keyed by its stable provider game ID. The Player field shows a compact loading state, becomes interactive only after rows arrive, and terminates into explicit empty or error/retry states when necessary. Content is single-column on iPhone and capped at 680 points on wider iPad layouts. Discovery-only raw payload and quota inspectors remain confined to the Developer AFL API Test tool.

## Source-neutral Feed publishing

External AFL workflow preparations project into the existing versioned `player_stat_card` post contract. The payload uses `source_kind: external-afl` with only provider game/player identifiers for deterministic retry safety. `game_id`, `manual_game_id`, `player_profile_id`, and `squad_member_id` remain null. The authenticated platform admin is the post author; the external player remains only the performance subject.

Publishing reuses the existing direct Player Card image path. The validated 1080 × 1350 local PNG is uploaded once to the existing `post-images/posts/<admin-id>/...` namespace and referenced by the Feed post. A deterministic post ID and existing-post lookup protect repeat taps and uncertain retries. A failure leaves the generated card in the editor and the action retryable.

This path deliberately bypasses Player Card Album because Album ownership is tied to a persisted KickChasers player/game subject. Migration `20260811100000_secure_external_afl_player_card_posts.sql` preserves the existing post-insert rules and adds a server-enforced requirement that payloads marked `external-afl` may only be inserted by `f_is_platform_admin()`.

## Validation and remaining manual check

Focused tests cover request allow-listing, current-season defaulting, round derivation, downstream reset behavior, provider-plan messaging, shared source projection, external identity separation, creator-avatar media, external payload identity, deterministic posting, retry behavior, Feed rendering compatibility, and the absence of Album/tracker writes. Existing canonical builder and production workflow regression tests are included in the same focused run.

Manual validation is still required on an authenticated platform-admin device for the compact `Manual | KickChasers Game | AFL` selector, responsive iPhone/iPad presentation, season availability under the current API plan, and the complete AFL selection → image → cutout → template → Feed post journey.
