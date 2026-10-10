# KickChasers Landing Page Cleanup

Implemented 8 October 2026 using the approved dedicated-chapter direction and existing typography, palette and assets. This is a landing-only composition edit; no backend, auth, tracking, database, API, RLS or game logic changes were made.

## Final structure

1. Hero
2. Single Player Tracking
3. Team Tracking
4. Mapping / Match Intelligence
5. Match Summary
6. Supporting Features / Audiences
7. Premium Game Cards
8. Final CTA / Footer

Previously, a five-stage Track / Map / Analyse / Review / Create walkthrough repeated the product chapters, and large audience, portal and promotional galleries restarted the narrative. That walkthrough is no longer imported or rendered. Audiences and supporting features now share one compact section. Cards lead directly into the CTA.

## Implementation

- **Hero:** retained athlete imagery and reverse scrub, shortened the opening boundary and copy, improved CTA spacing. The Single Player chapter now sits outside the split hero composition. Mobile hero media is 330px tall.
- **Single Player:** increased desktop product proof to chapter width, reduced explanatory bullets and framing. Mobile uses a CSS crop around the map and adjacent live controls, with a link to the unmodified full image. The secondary phone example is in a closed disclosure.
- **Team:** retained the heading, concise sequencing description and four prominent features. Kept the large looping demonstration; mobile crop balances roster and action pad. Coach context is subordinate, linked-device proof is closed by default.
- **Mapping:** one primary mapping asset, two short explanations, approximately 96vh of story travel on eligible desktop layouts. Media pins at 112px and transitions once from the oval view to Score Worm / momentum detail. No scroll locking. Below 1000px, in short viewports or with reduced motion, both explanations and the media remain static.
- **Summary:** larger outcome composition with concise copy. The benchmark example is closed by default; mapping explanations are not repeated.
- **Supporting breadth:** four short audience rows and one portal action replace separate large audience/support sections. Profile and team-selection proof remains available inside a closed season-tools disclosure.
- **Cards:** finished gold card is dominant (up to 520px desktop / 340px mobile); creator is supporting (280px / 230px). Mobile creator framing focuses on the card and save controls. Removed the promotional poster and sharing gallery from default flow. Cards are the final major product demonstration.
- **Type and spacing:** existing fonts retained; refined heading scale, line height, tracking, casing and paragraph widths. Working chapter padding is 88px desktop, 80px tablet and 52px mobile, with tighter Team spacing. Media uses a consistent subtle border/radius family. Removed excess decorative framing, repeated slogans and numbered feature furniture.
- **Navigation/footer:** corrected the mobile navigation breakpoint gap, retained valid landing anchors and CTA destinations, tightened footer layout and mobile links.

## Media and motion

Hero reverse scrub remains on eligible desktops; its video is paused and seeks with scroll. Team video remains muted, inline, looping and manually controllable. It plays only when at least 20% visible, the document is visible, reduced motion is off and the user has not paused it. IntersectionObserver, visibility/preference listeners, geometry fallback and cleanup prevent offscreen playback; late play resolutions recheck eligibility.

Browser verification observed Team playing in view and paused after reaching Mapping and the footer. Hero is not an autoplaying second video. Removed the duplicate animated walkthrough. Added only the restrained Mapping focus transition. Summary, supporting features, Cards and CTA remain static; no optional Card reveal was necessary.

## Preserved assets and intentional omissions

No source screenshots, videos, promotional artwork or manifest entries were deleted or re-encoded. No new media or dependencies were added. Preserved but removed from default flow: mapping promotional artwork, NEW PREMIUM CARDS poster, instant club-content artwork, repeated mapping/tracking/summary/card walkthrough media, local-footy and leaderboard gallery screenshots. Phone, linked-device, benchmark, profile and team-selection examples remain in closed disclosures.

The old walkthrough component remains in the repository for future use but is not imported by the landing page. No new font, simulated dashboard, edited app screenshot, card spin, particle effect or extra reveal system was introduced. The existing creator demonstrates a second performance card rather than pretending it exactly matches the finished 9.2 card.

## Before / after length

Approximate settled page heights, using the critique's archived captures as the baseline and the same five viewport sizes. Heights can vary slightly with browser gutters and media loading; these are composition measurements, not performance benchmarks.

| Viewport | Before | After | Reduction | Horizontal overflow | Mapping |
|---|---:|---:|---:|---:|---|
| Wide desktop 1920 × 1080 | 18,109px | 9,250px | 49% | 0px | Compact sticky |
| Laptop 1366 × 900 | 16,788px | 8,709px | 48% | 0px | Compact sticky |
| Tablet landscape 1024 × 768 | 14,758px | 7,923px | 46% | 0px | Compact sticky |
| Tablet portrait 768 × 1024 | 16,020px | 6,987px | 56% | 0px | Static |
| Narrow mobile 390 × 844 | 16,124px | 7,644px | 53% | 0px | Static |

The roughly 50% reduction exceeds the initial 35–45% estimate because duplicate storytelling and default-open galleries were removed wholesale. Main desktop product proof is larger, rather than uniformly shrunk to reach a quota.

## Responsive visual QA

Inspected all five sizes in the rendered browser, then made one correction batch and one final confirmation pass. Corrected the Team mobile crop and Mapping state timing/travel in that batch. Final screenshots and measurements are in `docs/landing-qa/cleanup/` (`*-full-final.png`, `*-final-contact.jpg`, Mapping viewport captures and `measurements.json`).

- All five layouts: no forced horizontal overflow, visible media resolved, final CTA reachable, shorter chapter transitions, Cards last.
- Wide/laptop: Single Player and Summary have substantial product width; Mapping has two legible states; finished card dominates creator.
- Landscape tablet: native-scroll sticky remains compact, headings/media fit without oversized blank intervals.
- Portrait tablet: static Mapping fallback, stacked content and readable text; no long pinned sequence.
- Narrow mobile: 330px hero media, CTA in the opening view, first product proof arrives sooner; focused Single Player / Team / Mapping / Summary frames replace tiny landscape thumbnails. Full originals remain accessible. Creator is much smaller than finished card.

Reduced-motion policies were checked in source and tests; static fallback was visually confirmed at portrait/mobile sizes. Physical-device, OS reduced-motion switching and throttled-network testing were not performed. Full-page stitched captures may place the sticky header within the composite; dedicated viewport captures show its actual position.

## Validation

| Check | Result |
|---|---|
| Focused landing and hero tests | 16/16 passed |
| Full project suite | 456/456 passed; no failures or skips |
| Typecheck | Passed |
| Production build | Passed, 2,143 modules, 3.60s |
| Git diff whitespace check | Passed |

Tests cover CTA destination, absence of active `/new` CTA, chapter order, anchor validity, visible media resolution, preserved source assets, closed secondary galleries, Mapping static fallback/cleanup, video playback eligibility and lifecycle, and mobile crop/full-image access. They avoid exact marketing-copy assertions.

Final production output: main JavaScript 1,751.40kB (485.34kB gzip); CSS 202.82kB (31.63kB gzip). No media bytes or media encoding changed. Existing warnings remain: outdated caniuse-lite data and a main chunk over 500kB. The development console also reports the existing React `fetchPriority` prop warning. Dependency upgrades and app-wide bundle splitting are outside this landing cleanup.

## Remaining limitations and assessment

Post-cleanup visual assessment: **81/100**, up from 68/100. AI/template risk: **3/10**, down from 4/10. These are design judgements based on the rendered five-size review, not independent measured quality scores.

The structure is substantially stronger, calmer and more product-led. Remaining limits come mainly from dense source UI on small phones, the existing Summary collage's limited table detail, and differing example matches across card assets. A future asset refresh could provide consistent match data and purpose-captured Summary details without another structural redesign. The page has reached the requested cleanup standard; physical-device checks and the existing app-wide performance warnings remain before a broader launch sign-off.

# Brand Surface Cleanup

Implemented 8 October 2026 as a style-only refinement. Section order, copy, media files, responsive crop strategy, video lifecycle and motion architecture are unchanged. No backend, routing, auth, database, feature or unrelated-test changes.

## Canonical reference

The live `/how-it-works` page and its shared `PublicSiteShell.tsx` were inspected in the browser and source. No separate How To route/component exists in this web checkout; the verified public How It Works experience is the reference, rather than an invented second reference.

- **Green:** exact existing **#39FF14** (`rgb(57,255,20)`), used by HowItWorks active accents and PublicSiteShell navigation underline/focus states. These references use literals, not a named global token. Landing's existing `--lp-green` now aliases that same literal instead of the previous #39FF88. Hover uses the existing public-shell **#50FF2F** instead of #87FFB5.
- **Background:** exact existing base **#02091A** (`rgb(2,9,26)`) and shared-shell gradient `linear-gradient(180deg,#02091A 0%,#040B1C 44%,#030A1A 100%)`. Re-enabled the shell's existing ambient background layers instead of inventing another lighting system. Header uses the same base; footer uses the existing **#030A1A**. Removed alternate #0E1620 / #080C11 section surfaces.
- **Accent line:** reused the reference's 2px rounded green line language, as a consistent 72px line below major chapter headings. No glow is attached to it. Existing heading typography remains intact.

## Screenshot containers and retained surfaces

Removed added border, background and rounded-shell styling from `.lp-product-frame` and Team video. Removed decorative radius from mobile Hero film, coach image, finished card wrapper and creator crop. Team, Mapping and Premium Card section bands are transparent and no longer have enclosing border strips. Major proof now sits directly in the continuous page composition.

Retained structural wrappers and overflow clipping where required for responsive crops and the existing Mapping focus transition. They have no visible panel fill or border. Retained neutral hairline dividers for feature rows, disclosures, navigation and footer because they communicate grouping and interaction. Retained button fills, keyboard focus rings and small control radii for interactive affordance. Retained original screenshot UI/device edges and the finished card's intrinsic gold border: these belong to the supplied assets and were not altered.

## Changes by area

- **Hero:** canonical green headline/action accents, matching navy surface and edge fades; mobile decorative radius removed. Structure and reverse scrub preserved.
- **Single Player:** transparent, border-free product wrapper; existing wide scale and mobile crop preserved.
- **Team:** no added video border, radius or panel background; feature separators now neutral instead of translucent mint. Playback and size unchanged.
- **Mapping:** transparent wrapper, canonical green active explanation, existing compact sticky transition/static fallback preserved.
- **Summary:** removed the added screenshot frame; current readable scale unchanged.
- **Supporting features:** neutral rows and dividers remain; no new cards or surfaces.
- **Premium Cards:** continuous page background, no enclosing section border or decorative media radius. Finished card remains dominant and creator subordinate. Gold comes from the existing artwork/heading accent.
- **CTA:** existing button geometry and interaction retained, canonical green fill/hover/focus. No new button component or animation.

No screenshot shadows or green halos were added. The existing small dark text shadow on the Hero caption remains for image legibility. Selection colour, labels, links, focus states, headline accents and active Mapping state now use the same landing green variable. Screenshot/video pixels retain their original colours as explicitly required.

## Responsive visual verification

Rendered and inspected all five specified sizes in one batched pass. Evidence is saved in `docs/landing-qa/brand-surfaces/`: hero/full-page captures, contact sheets, a laptop product-proof screenshot and measurements. No correction batch was necessary.

| Viewport | Horizontal overflow | Added product-frame borders | Final CTA |
|---|---:|---:|---|
| 1920 × 1080 | 0px | 0 | Reachable |
| 1366 × 900 | 0px | 0 | Reachable |
| 1024 × 768 | 0px | 0 | Reachable |
| 768 × 1024 | 0px | 0 | Reachable |
| 390 × 844 | 0px | 0 | Reachable |

Computed styles confirmed #39FF14 and the exact canonical navy gradient. Screenshots showed one continuous surface, readable media at existing sizes, understated green chapter lines and Premium Cards as the final payoff. Original mobile crops and static Mapping fallbacks remain. Lazy images in closed disclosures are intentionally unloaded and are not broken visible media. Stitched full-page captures can show the sticky header mid-composite; the dedicated viewport proof shows actual positioning.

## Validation and assessment

- Focused landing/hero tests: **16/16 passed**.
- Full project suite: **456/456 passed**, no failures or skips.
- Typecheck: passed.
- Production build: passed, 4.33s. No media/dependency changes.
- `git diff --check`: passed.
- Existing warnings remain: outdated caniuse-lite data, large main bundle and React development `fetchPriority` warning. No unrelated fixes were introduced.

Post-pass visual judgement: **84/100**, AI/template risk **2/10**. The improvement comes from product-family colour consistency and removal of decorative surfaces, not another structural redesign. Remaining inconsistencies are inherent to preserved source assets: their greens/backgrounds vary, Summary contains device mockups, and sample card performances differ. The editorial italic landing typography intentionally remains different from the explanatory How It Works page. Physical-device and throttled-network checks remain outside this desktop-browser verification.

# Pricing Restoration

Restored pricing as an ordinary extension of the existing landing page, using the plans, descriptions, inclusions and comparison rows verified on kickchasers.com on **10 October 2026**. The existing design system and page identity remain the reference; this work introduces no new design identity or structural redesign.

| Plan | Monthly | Yearly |
|---|---:|---:|
| Free | $0 | $0 |
| Member | $5 | $39.95 |
| Player | $15 | $84.95 |
| Club | $99.95 | $999.95 |

`pricing-plans.ts` holds the original plan content. `PricingSection.tsx` uses the existing navy/green palette, flat dividers and a responsive four-, two- and one-column layout. Monthly/Yearly buttons update the displayed prices and annual savings (33%, 53% and 17%); plan selection is presentation only. The comparison disclosure exposes the detailed inclusions, and the CTA leads to `/sign-up`. The live site's message that all features are free during launch is prominent.

Pricing sits between Premium Cards and the final CTA. Navigation now links “Pricing” to `#pricing`, replacing “Beyond game day”; the final CTA anchor is `#get-started`. There are no backend, billing, payment-charge, media or dependency changes.

## Verification and disposition

Screenshots in `docs/landing-qa/pricing/` cover **1920 × 1080, 1366 × 900, 1024 × 768, 768 × 1024 and 390 × 844**. No document overflow was measured. A minor scrollbar artifact in stitched full-page captures is a capture limitation. Browser checks confirmed yearly prices/savings and the selected Club pressed state.

Focused tests passed **18/18** and the full suite passed **458/458**, with no failures or skips. Typecheck and production build passed (3.68s); existing project warnings remain. Finish review disposition: **ship**, with no material issue found in source and screenshot review. That review was not an independent interaction test.
