# Stage 2C.1 — White Editorial Visual Parity

## Scope

Stage 2C.1 is a visual-refinement pass over the existing White Editorial template. It does not change the cutout engine, editor, player-performance data contract, feed, Supabase integration, public navigation, or production card paths.

The approved mock-up and the first physical-device output were supplied inline on 31 July 2026. The chat images were not exposed as local files, so they cannot be copied into the repository without substituting or regenerating the approved artwork. The approved reference remains documented in `design-reference/WHITE_EDITORIAL_PERFORMANCE_CARD_REFERENCE.md`.

## Differences identified

- The first player render continued below the intended hero area and remained visible beneath the name and statistics.
- The jersey-number watermark was too small, too high and did not fill the composition behind the player.
- The blue accent rendered as a large right triangle rather than the narrower cropped diagonal ribbon in the approved design.
- Tight text frames risked clipping italic glyphs and did not adapt to longer names.
- The statistics row sat too tightly against its labels and dividers.
- A missing opponent-logo asset was treated as fatal and disabled PNG export.

## Refinements

`WHITE_EDITORIAL_LAYOUT` now holds the template's canonical 1080 × 1350 measurements for the rating, watermark, player, blue accent, player-name block, statistics grid, rules, logos and footer copy.

A solid content panel is composited above the player layer at canvas Y 846. It creates the same clean editorial termination as the approved design and guarantees that no player pixels, shadows or alpha residue can appear behind the player name, statistics or footer.

The jersey watermark uses a larger, lower composition with reduced opacity. The blue accent is a four-point diagonal ribbon cropped by the right edge and the content panel.

The final parity pass increases the compact rating unit, uses one cobalt token for rating, ribbon, player metadata, stat labels and translucent rules, and constructs the ribbon from two mathematically parallel angled edges before the content-panel crop.

## Typography

The rating label, rating value, player name, stat values and jersey watermark all use `KICKCHASERS_DISPLAY_FONT`. This deliberately resolves to the native system face used by `FeedSocialCard` player names and stat values, with the same 900 weight and italic treatment. Text frames include additional vertical and horizontal breathing room. The generic renderer enables single-line font fitting with a conservative minimum scale so unusually long content reduces before it clips.

## Optional artwork and export

Club and opponent logos remain part of the unchanged `PlayerPerformanceCardModel` shape, but empty logo URIs are valid. The template omits absent layers and selects balanced footer frames for two logos, home only, opponent only or no logos. When optional logo artwork is supplied but cannot load, it settles without an error and does not block export.

Optional artwork is explicitly marked at the generic image-layer level so future secondary branding and sponsor layers can use the same non-blocking behaviour without adding White Editorial branches to the renderer.

## Exact-size PNG export

The original capture supplied 1080 × 1350 as logical iOS points. On a 3× iPhone, `react-native-view-shot` therefore created 3240 × 4050 pixels. Stage 2C.1 now divides capture dimensions by the active device pixel ratio, producing a native 1080 × 1350 target on 2× and 3× devices.

Every capture then passes through an exact-size normalization boundary. A correctly sized PNG is retained unchanged; any density- or platform-dependent result is losslessly resized to 1080 × 1350 PNG and validated again before it enters the session cache or Photos. A PNG without explicit physical-DPI metadata remains standards-valid; Instagram composition depends on the verified pixel dimensions and 4:5 aspect ratio.

## Validation boundary

Focused tests cover layer ordering, content-panel isolation, approved watermark/accent geometry, shared italic display typography and opponent-logo absence. Final pixel parity still requires a new physical-device preview/export capture beside the approved mock-up because the protected native workflow and device-local cutout cannot be rendered in the repository test runner.
