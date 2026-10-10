# Stage 3A — Club Edition

## Approved visual reference

The Club Edition image attached to the Stage 3A implementation brief is the approved visual reference. It defines the full-bleed action photograph, dark photographic treatment, left club stripe, top-right rating ribbon, three-stat hierarchy, player identity block, and lower club branding.

The reference is intentionally interpreted through the existing 1080 × 1350 scene renderer so preview, positioning, generation, export, summary, and feed use the same implementation. The feed's social controls remain outside the exported template.

## Template architecture

> Superseded for production selection by Stage Gold-02. See
> `PLAYER_CARD_GOLD_CLUB_STAGE_GOLD_02.md` for the current ladder.

At the time of Stage 3A, `resolvePlayerCardTemplate(gameRating)` used:

- rating below 7.5: `club`
- rating 7.5 and above: `white-editorial`

Black Performance and Gold Elite are not registered. Their future bands can be added to the resolver without changing the renderer or generation service.

`clubEditionTemplate` builds scene data consumed by `PerformanceCardRenderer`. It does not query repositories or Supabase and receives only `PlayerPerformanceCardModel`.

## Image and colour behaviour

- The primary visual is `model.images.actionPhoto`, with the original-photo URI propagated by the Player Image and legacy cutout workflows.
- A dark tone layer and vertical vignette improve text contrast without changing the source asset.
- The left stripe and rating ribbon use the squad primary colour.
- Labels and secondary details use the squad secondary colour.
- A thin tertiary stripe is rendered only when the existing branding contract supplies `tertiaryColor`.
- Avatar, club logo, and opponent logo are optional assets; their absence does not block rendering or export.

## Smart headline statistics

The shared selector considers Disposals, Goals, AF Points, Tackles, and Marks. Qualifying values use the approved priority order; remaining positions are filled by relative threshold strength, with Disposals retained as the first fallback on games where no threshold is reached. Exactly three statistics are returned.

## Publishing and compatibility

Club Edition uses the existing deterministic publishing service and 1080 × 1350 PNG upload path. Its payload is versioned as `club_edition_player_card` with `template_id: club`. The authoritative feed router recognises it as a generated player card while historical player-stat payloads continue to use the legacy card.

White Editorial scene/layout code and Team Summary generation/posting code are unchanged.

## Visual QA

Final visual comparison must be completed on a physical iPhone using a representative original action photograph, real primary/secondary/tertiary squad colours, and all optional asset combinations. Compare the device preview side-by-side with the Stage 3A reference and verify crop, stripe widths, ribbon geometry, typography, vignette strength, stat hierarchy, and footer balance before production approval.
