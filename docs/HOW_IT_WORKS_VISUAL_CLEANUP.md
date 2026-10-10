# How It Works Visual Cleanup

## Audit Baseline
62/100, AI-slop risk 7/10. Preserve all nine workflows, five engine stages, one selected panel and navigation destinations. Read-mode refinement using the existing landing identity. No PRODUCT.md or DESIGN.md was found; incumbent source and the critique supply context.

## Screenshot-to-Workflow Asset Map
The repository's public/mockups/landing, public/landing/images and public/landing/originals were searched and visually reviewed before UI changes. Existing optimized variants are reused; originals are preserved.

| Workflow | Previous Asset | Claim / accuracy | Replacement candidate / final asset | Reason |
|---|---|---|---|---|
| Profile & Onboarding | 10-your-complete-player-profile | Identity/history; supports profile, not every onboarding step | 10-your-complete-player-profile | Retain; focus central profile on mobile; caption scope |
| Squads & Teams | 07-see-whos-dominating | Rosters/roles/lineups; rating screenshot mismatched | team-selection | Actual lineup preview supports team presentation; does not demonstrate permissions. Updated capture still recommended |
| Live Match Tracking | 02-track-every-afl-stat-live | Live roster/stat capture; accurate single-player but limited team context | 04-two-trackers-one-game | Existing team tracking tablet + phone, more representative |
| Game Summaries | 09-professional-match-summaries | Totals/quarter splits/recap; accurate | 09-professional-match-summaries | Retain optimized responsive versions |
| Player Development | None / placeholder | Season history/trends | 10-your-complete-player-profile | Existing season totals and history support record; dedicated trends capture still recommended |
| Leaderboards | 03-climb-the-leaderboards | Stat/league rankings; accurate | 03-climb-the-leaderboards | Retain |
| Feed & Performance Sharing | 11-instant-club-content-creation | Follow-based posts; creator collage only partial | 05-follow-local-footy | Real feed shows tracked game posts |
| Ratings & Benchmarking | None / placeholder | Benchmark bands/Impact-7 | 07-see-whos-dominating | Actual benchmark bands and rating visible |
| Portal & Club Management | 10-your-complete-player-profile | Desktop management; mobile profile inaccurate | None | Honest content-only layout. Updated capture still recommended: desktop squad roster/roles/approvals |

## Product Engine Changes
All five stages remain in a single ordered list. Horizontal flat sequence above 900px; compact vertical 52px rows below it (260px total). Equal emphasis, thin canonical green connectors, no separate cards, hover lift or outer shell. Intro uses 52px desktop /36px narrow-mobile top padding; existing copy and eyebrow retained as explicitly requested.

## Feature Index Changes
Nine topics remain in one tablist. Desktop sticky index uses simple rows, unboxed numbers and a 1px green active rail. Index height is bounded to the viewport with internal scrolling when necessary. Below 901px it retains the horizontal selectable strip with a green bottom indicator. No change to public destinations or workflow selection model.

## Surface Cleanup
Removed/reduced 11 recurring surface categories: engine outer shell; step cards; index outer shell; active index card; boxed index numbers; workflow outer panel; screenshot outer shell; screenshot inner shell; supporting bullet cards; concept card; workflow number badge. Removed the two decorative screenshot glow layers and route-local lighting. Structural wrappers and intrinsic device artwork remain. No source assets deleted or edited.

## Placeholder Removal
Development now uses the existing profile/season-history asset. Ratings uses the real Impact-7/benchmark-band asset. Removed all public developer commentary and placeholder markup. Portal is content-only, with its complete explanation, four points and takeaway; no empty media slot.

## Squads / Portal Corrections
Squads now shows real team selection/lineup presentation rather than a player rating. Its caption explicitly describes the demonstrated subworkflow, not role administration. Portal no longer misrepresents mobile profile imagery as desktop management. These are honest corrections, not claims that all management tooling has been visually documented.

## Responsive Changes
Selected workflow text/media stack below 1280px. Sidebar remains at 1024px; horizontal tabs replace it below 901px. At 1024, body width is approximately 623px rather than the audited 190px. At narrow mobile it is approximately 345px (scrollbar affects available content width). Media precedes supporting points in stacked layouts. Profile/Development centre the existing profile collage through CSS clipping on narrow phones; the full original remains accessible through the established LandingMedia full-size link. Other portrait images cap at 760px high to avoid needless tablet length. No screenshot file was cropped.

## Typography
Existing Arial/Helvetica public landing family; major H1/H2 use the landing's bold italic uppercase hierarchy, with 2px green rules. Explanatory H3/body remain sentence case and readable. H1 caps at 60px, H2 at 42px; mobile 40/30px. Body is 16px with 1.65–1.7 line-height. Removed redundant Full Product Breakdown, Feature Explorer, Product View, Why It Matters and Key Concept micro-label layers; substantive copy remains intact.

## Colour / Borders
Canonical base #02091A and shared shell gradient #02091A → #040B1C → #030A1A retained. Green #39FF14 and hover #50FF2F reused. Removed local turquoise washes, mint emphasis and green screenshot glow. Unintended opaque borders came from unsupported Tailwind border-white/8 opacity usage; those elements no longer use that class. Remaining local separators use explicit rgba(255,255,255,.1/.12). Header button changes are route-scoped: green primary action with dark text, 3px corners, no glow. Shared PublicSiteShell source is unchanged by this pass.

## Motion
Removed scroll-position-driven Reveal wrappers and static-step hover motion. Selected panel uses one 180ms opacity transition from an already visible state. Sticky index and active colour feedback remain. Reduced-motion media query disables local animation and transitions. No parallax, video or connector animation added.

## Accessibility
Preserved visible keyboard focus and semantic headings; engine/supporting points are real lists. Added roving tab focus, Arrow keys, Home/End selection and explicit tab/panel ARIA relationships. Keyboard Home then ArrowRight was verified to select and focus Squads. Only one selected panel renders. Alt text describes actual product evidence. Reduced motion verified by CSS/contract inspection; OS setting and screen reader were not physically tested. Mobile public-navigation visibility behaviour remains unchanged.

## Performance
Reuse LandingMedia and the existing optimized WebP manifest, width/height attributes, responsive srcset, async decoding and lazy loading. Only the selected workflow image is mounted; Portal mounts none. Inactive workflows do not eagerly load eight screenshots. The enlarged mobile profile crop has its own responsive sizes hint. No new media files, dependencies or backend requests. Previously visited images may remain browser-cached.

## Files Changed
- src/routes/HowItWorks.tsx — route composition, selected workflow and keyboard semantics.
- src/routes/how-it-works.css — new route-scoped styling.
- src/components/landing/how-it-works-content.ts — existing explanations extracted unchanged with corrected asset bindings/captions.
- tests/how-it-works.test.ts — focused contracts.
- docs/HOW_IT_WORKS_VISUAL_CLEANUP.md and docs/HOW_IT_WORKS_VISUAL_CRITIQUE.md.
- docs/how-it-works-cleanup-qa/ — 45 captured states and measurement evidence.
- Production build regenerates dist and TypeScript build metadata; the workspace already had unrelated pending changes. No unrelated source, API, auth, backend or migration changes made.

## Tests
Focused How It Works: 7 passed. Full project: 465 passed, 0 failed. Typecheck passed. Production build passed. git diff --check passed. Existing warnings: Browserslist data is 14 months old; main minified JS exceeds 500kB. Final build totals recorded from validation output, not a clean-checkout comparison; unrelated workspace changes preclude attributing total bundle size to this pass. Impeccable CLI was already unavailable earlier in this session (non-executable launcher), so direct project/context inspection and rendered browser evidence supplied the fallback; no permissions or skill files were altered.

## Visual QA
All nine workflows were switched, captured and inspected at each requested size (45 combinations), followed by one bounded confirmation round. Evidence: docs/how-it-works-cleanup-qa/measurements.json and <width>-<workflow index>.png. A capture batch timed out after 42 states; remaining mobile captures were completed without changing scope.

| Size | States | Result |
|---|---:|---|
| 1920×1080 | 9 | Wide media/text, horizontal Engine, sticky index; no positive page overflow |
| 1366×900 | 9 | Text at least ~415px, readable media, bounded index; no positive page overflow |
| 1024×768 | 9 | Stacked workflow interior; comfortable text; desktop index usable; no overflow |
| 768×1024 | 9 | Compact vertical Engine, horizontal index, full-width panel; no overflow |
| 390×844 | 9 | 260px Engine; focused profile; ~345px body/media frame; no page overflow |

All 45 confirmations had exactly one panel, zero public placeholder text and all mounted workflow images loaded. Intentional index overflow stays within its strip. Browser console returned no errors/warnings during the final interaction check. Sticky/index position and viewport constraints were inspected. Screenshots can stitch sticky elements differently; viewport proof is also saved as final-laptop.png. Browser test tab was closed and viewport override reset; user's original tab retained.

Post-cleanup qualitative visual score: **80/100**. AI-slop risk: **3/10**. This is a design assessment, not an automated quality metric. The page now belongs to the landing's product family. It is deliberately still an explanatory page, with all its workflow detail.

## Remaining Asset Captures Needed
- **Portal: Updated capture still recommended** — actual desktop squad roster, approvals and role management. Current content-only presentation is intentional and accurate.
- **Squads: Updated capture still recommended** — squad membership/invites/permissions; existing lineup asset only proves team selection/presentation.
- Development: dedicated trends/history capture recommended; current profile shows season totals and game history accurately.
- Profile: dedicated onboarding capture optional; current image proves football identity, not every setup screen.
- Summary/Tracking: dense landscape UI remains overview-level on phones; originals are accessible, but dedicated detail captures could improve instructional legibility.

No further redesign or feature work started. Existing screenshot artwork, including device frames and embedded app colours, is preserved; it is the principal remaining visual inconsistency.
