# KickChasers Landing Page Redesign

Complete first review version. Implemented locally, not published. Initial redesign verified 19 September 2026. Reverse-scroll hero video added and verified 22 September 2026.

## Previous Page Audit

Reviewed the existing rendered page, every landing section, all nine available image files, shared shell, motion components, pricing component, CTA destinations, routing/auth gates and product documentation before implementation.

| Previous section | Finding and decision |
| --- | --- |
| Hero | Correct dashboard return path; layered device artwork obscured the product story. Retain the route and move the linked-device proof into Team Stats. Use supplied coaches-box photography as one hero visual. |
| Three validation panels | Live tracking, ratings and development remain relevant; redistribute into the proof strip, match summary and profile/history sections. |
| Audience | Retain players, families and clubs; add coaches explicitly. Remove vague operational promises. |
| Live tracking | Retain single-player and linked-team artwork; add large current mapping and roster screenshots. Replace blanket “syncs instantly” language with specific, network-dependent linked tracking. |
| Performance insight | Retain summary, ratings and benchmark artwork. Rename the mislabelled ecosystem screenshot: it actually shows a player rating. |
| Leaderboards | Retain both feature and screenshot in Beyond Game Day. Avoid unsupported round-by-round ranking claims. |
| Football ecosystem | Consolidate duplicated audience/sync copy into audience and supporting features. |
| Portal | Retain profile, squad and season-history story and `/sign-in?redirect=%2Fhub` destination. |
| Social content | Retain all artwork; integrate with the expanded premium card story. Remove unverified “in seconds” promise. |
| Pricing | Existing table advertised future tiers and purchasing despite unlaunched billing. Do not render this stale offer. `PricingSection.tsx` remains untouched and available. Keep the legacy `#pricing` anchor at final account entry so existing public links resolve. |
| Final CTA | Retain account acquisition, consistently using the supported dashboard sign-in flow. |
| Public shell | Reuse shared header, logo, footer, auth links and legal/support routes. Add an opt-in editorial variant and mobile section links; other public pages keep their default shell. |

The README listed three screenshot files that do not exist (`06`, `08`, `12`), plus legacy fallbacks that do not exist. No new references to these missing files were added. All nine actual originals remain unchanged under `public/mockups/landing/`.

## Existing Assets Retained

| Original under `public/mockups/landing/` | Placement |
| --- | --- |
| `01-see-every-match-moment.png` | Beyond Game Day: community activity, paired with Match Day |
| `02-track-every-afl-stat-live.png` | Expanded mobile-tracking supplement below Single Player Mapping |
| `03-climb-the-leaderboards.png` | Beyond Game Day: leaderboards |
| `04-two-trackers-one-game.png` | Expanded linked-device supplement below Team Stats |
| `05-follow-local-footy.png` | Beyond Game Day: Match Day |
| `07-see-whos-dominating.png` | Match Summary: ratings and benchmarks |
| `09-professional-match-summaries.png` | Match Summary and Review walkthrough step |
| `10-your-complete-player-profile.png` | Beyond Game Day: profile, season totals and history |
| `11-instant-club-content-creation.png` | Expanded game-card collection |

All supplementary disclosures start **expanded** for the full first review. Visitors can collapse them with the keyboard or pointer.

## Existing Sections Retained

Live tracking, linked tracking, performance review, ratings, leaderboards, audiences including families, portal/profile/history, social content, account entry and public navigation remain. Duplicate audience and tracking copy is consolidated. Pricing is the sole substantive content exclusion, based on the repository's explicit unlaunched billing status, not page length.

## New Assets Added

Untouched copies live in `public/landing/originals/`. Responsive versions live in `public/landing/images/`. Mapping:

| Supplied filename | Asset ID | Placement |
| --- | --- | --- |
| `DB652DCB-1985-4BB9-B81B-E1CC0A69B866.PNG` | `coaches-box` | Retained in Team Stats after the video hero update |
| `Screenshot 2026-06-19 at 5.35.31 pm.png` | `single-player` | Large, uncropped Single Player Mapping proof |
| `Screenshot 2026-06-23 at 7.25.23 pm.png` | `team-tracking` | Large Team Stats proof and Track step |
| `Team Tracker.PNG` | `team-mapping` | Map/Analyse steps and full-screen mapping supplement |
| `91CB599B-F3D0-4633-9237-FE8FB50BF7EA.PNG` | `mapping-promo` | Major mapping section; supplied callouts remain part of artwork |
| `IMG_1040 2.PNG` | `premium-card` | Large premium performance card and Create step |
| `IMG_0263.PNG` | `card-creator` | Full creator screenshot alongside finished card; stacked on mobile |
| `16DD6C0A-6C4B-4418-B793-8A2234708DEC.PNG` | `premium-promo` | Expanded game-card collection |
| `Screenshot 2026-06-22 at 9.25.46 pm.png` | `team-selection` | Beyond Game Day: lineup poster and squad tools |
| `Subject 2.png` | `player-cutout` | Final game-day CTA |

The original screenshot filenames contain narrow spaces before “pm”; the preparation script retains those exact source names.

**Input update, 22 September:** The supplied `Kickchasers_marketing.mp4` is now integrated in the hero. No separate new Match Summary screenshot has been supplied; the existing summary artwork remains in use.

## Product Story

Track → Map → Analyse → Review → Create. Product screenshots provide the evidence; near-black/navy backgrounds, restrained green, athletic type and gold naturally drawn from the supplied card assets provide hierarchy.

Claims were checked against the repository. Mobile tracking is described as part of the app, not a new web tracking route. Web live tracking aliases remain disabled and no acquisition CTA points to them.

| Claim group | Repository evidence |
| --- | --- |
| Single/full-team tracking, linked games, custom stat selection/creation, locations, timers and modifiers | `docs/Mobile App Docs/docs/CURRENT_FEATURE_MATRIX.md`, `Team tracker UI-DOCUMENTATION.md`; supplied current UI |
| Influence Timeline, momentum and Score Worm | Current feature matrix and `src/lib/portal-game-summary.ts`; supplied tracker screens. These are statistical features, never labelled AI. |
| Summary, quarter scores, player/team totals | `src/routes/portal/GameSummaryPage.tsx`, `src/components/portal/game-summary/SummaryMatchComponents.tsx` |
| Card creation, save and publishing | `PLAYER_CARD_STAGE_2G.md`, `PLAYER_CARD_PRODUCTION_WORKFLOW_STAGE_2F.md`, `PLAYER_CARD_ALBUM.md`; current supplied creator/card images |
| Album and posting in web portal | `src/lib/player-card-album.ts`, `src/components/portal/PlayerCardAlbum.tsx`, `src/lib/profile-posts.ts` |
| Squad tools, groups and voting | `src/lib/squad-player-groups.ts`, `src/lib/squad-votes.ts`, squad panels and supplied lineup UI |
| Match Day, notifications and leaderboards | Existing portal routes/libraries and parity tests |
| Billing not launched | `GROWTH_AND_MONETISATION_CONTEXT.md`; current matrix marks subscription/paywall as infrastructure |

The older matrix's “premium variants planned” row is superseded for visual card design by the later card workflow documents and supplied screenshots; “premium” describes the presented designs, not paid availability. No subscription or store-availability claim is made. No active App Store CTA existed to retain. No Android availability claim was added.

## Final Sections

1. Reverse-scroll video hero, main CTA and walkthrough link; coaches-box image retained in Team Stats.
2. Compact Track / Map / Analyse / Create proof navigation.
3. Single Player Mapping with full landscape screenshot and mobile supplement.
4. Team Stats with full roster screenshot and linked-device supplement.
5. Five-step product walkthrough.
6. Mapping promotional artwork and full Team Mapping screen.
7. Match Summary with ratings/benchmark proof.
8. Premium Game Cards: finished card, complete creator screen, promo and legacy content collection.
9. Players / Coaches / Clubs / Families & Supporters.
10. Beyond Game Day: Match Day, community, notifications, leaderboards, profile, history, Album, squad groups, lineup content and Best & Fairest.
11. Final CTA with supplied player cutout, followed by retained footer.

## Video / Scroll Treatment

The supplied five-second portrait MP4 now accompanies the first two actual page sections: Hero and Single Player Mapping, with the compact pillar navigation between them. The film remains pinned to the right of that opening content on eligible desktop layouts. Scrolling down seeks from the last frame toward time zero; scrolling back up retraces those frames. At the end of the range the opening sunset frame holds while the film leaves with its container.

The original file is copied unchanged to `public/landing/video/kickchasers-marketing.mp4` (SHA-256 equality verified). A faithful last-frame poster, extracted locally with AVFoundation, is stored at `public/landing/video/hero-poster.webp`. No imagery was generated or retouched. Source properties: 1080×1920, 24 fps, roughly 5.06 seconds with one audio track (browser container duration reports approximately 5.085 seconds). Audio never plays: the video is muted, inline and paused, with its currentTime driven only by scroll position.

Passive scroll events schedule at most one animation frame for measurement. Seeks are serialised so fast scrolling replaces the target instead of building a seek queue. A ResizeObserver accounts for expanding/collapsing the mobile-tracking supplement. Frames, observers and event listeners are cleaned up on unmount or disabling the effect. There is no scroll interception, wheel lock, autoplay, continuous render loop or negative playbackRate.

At widths below 1000px, heights below 600px, reduced motion, or after a video error, the poster remains and the video element is not mounted. The normal desktop mode exposes a keyboard-operable “Use still image” toggle. The video uses preload auto only when the effect is enabled: this short clip needs seekable frames across its whole timeline. Before decoding, the last-frame poster prevents an opening-frame flash.

The later Track / Map / Analyse / Review / Create walkthrough remains screenshot-based. Its independent static mode and reduced-motion treatment are unchanged.

## Responsive Behaviour

Wide desktop is capped at 1440px content width. Tracker screenshots use the full content width. Cards use their original aspect ratios, with the creator alongside the finished card on larger screens and underneath on mobile. Supporting features use two columns on larger screens and stack on phones.

All product proofs link to untouched full-size originals in a new tab. This lets readers inspect dense stat screens on a narrow phone without cropping the UI or forcing the page to scroll sideways.

Tested 1920×1080, 1440×1000, 1024×768, 768×1024, 390×844 and an additional 320×740 viewport. No horizontal overflow was found. Browser screenshots are in `docs/landing-qa/`; the full-page desktop capture represents sticky media at one scroll position, so it is not a substitute for inspecting the live walkthrough.

## Motion

Only normal smooth anchor navigation, restrained text/hover transitions and sticky step changes are used. `prefers-reduced-motion` disables transitions and sticky presentation, displaying all proof states statically. Reduced-motion behavior was checked through source/contracts; the static mode was exercised live via its control and responsive breakpoints. OS-level reduced-motion emulation was not available through the browser tool.

Direct hash links are resolved after the auth gate mounts the page and the progressive layout settles. The effect cancels its scheduled frame on unmount. This fixes direct/public cross-page section navigation without changing authentication behavior.

## Accessibility

One h1, labelled sections, semantic headings, meaningful image descriptions, real links, native keyboard-operable disclosures, visible focus outlines, first-focus skip link and mobile navigation. The decorative duplicate sticky display is hidden from assistive technology; the complete step descriptions remain available. Static images retain alt descriptions. The manual presentation toggle exposes its pressed state.

The green account button uses dark text; body copy uses light neutral tones on dark backgrounds. All screenshot UI, names, stats, logos and buttons remain unchanged. There is no autoplay sound.

## Performance

No runtime dependency was added. `sharp`, already installed through `@vercel/og`, prepares the image derivatives with `node scripts/prepare-landing-assets.mjs [source-directory]`. It reads checked-in originals on repeat runs. It resizes without upscaling and encodes losslessly, with no cropping, retouching or content changes.

Each image has intrinsic dimensions, responsive srcset/sizes, async decoding and a PNG fallback. The hero poster is eager/high-priority; below-fold images are lazy. Eligible desktop layouts preload the short hero video for seeking. Original PNGs load only when opened or used as a failed-WebP fallback. Generated asset dimensions and bytes are recorded in `landing-assets.json`.

Decimal sizes:

| Measure | Before | After | Change |
| --- | --- | --- | --- |
| Main application JS | 1,768.56 kB | 1,752.52 kB | −16.04 kB |
| Main JS gzip | 486.84 kB | 485.51 kB | −1.33 kB |
| Main CSS | 197.69 kB | 199.94 kB | +2.25 kB |
| Main CSS gzip | 29.49 kB | 31.13 kB | +1.64 kB |

Baseline was built before editing in the same already-modified workspace; these are Vite-reported application bundle totals, not an isolated route chunk. Existing large-bundle and outdated Browserslist warnings remain.

- Nine old PNG assets: **11.34 MB**, retained.
- Ten new original PNG assets: **16.50 MB** added.
- All generated responsive WebP files: **32.51 MB** added to deployment storage.
- Total added public media storage: **49.00 MB**. Browsers do not fetch every variant or the original in normal browsing.
- One full-resolution WebP per asset totals **16.62 MB**, versus **27.84 MB** for the same 19 PNGs: about **40% smaller**.
- One smallest variant per asset totals **5.33 MB**. Actual transfer depends on viewport, pixel density, scrolling and cache reuse; this is not a measured first-load transfer.
- Hero WebP options: **341 kB / 1.24 MB / 1.50 MB** at 640 / 1280 / 1448px. Lossless fidelity carries a real photo-weight cost.

This full first pass intentionally retains a substantial media footprint. Repeated images can reuse cached URLs. The media-size report is saved alongside QA evidence. No Lighthouse or field-performance score is claimed.

## Files Changed

- `src/routes/Landing.tsx`: full product narrative, supported CTAs, direct-anchor handling.
- `src/components/landing/PublicSiteShell.tsx`: opt-in editorial shell, configurable navigation, mobile links and skip link.
- `src/components/landing/LandingMedia.tsx`: responsive faithful images, original links and fallback.
- `src/components/landing/ScrollProductStory.tsx`: progressive sticky/static walkthrough.
- `src/components/landing/landing.css`: scoped responsive presentation.
- `src/components/landing/landing-assets.json`: generated asset manifest.
- `index.html`: title and factual description metadata.
- `scripts/prepare-landing-assets.mjs`: reproducible lossless asset preparation.
- `public/landing/`: new originals and derivatives; old originals untouched.
- `tests/landing-redesign.test.ts`: focused contracts.
- `docs/LANDING_PAGE_REDESIGN.md`, `docs/landing-qa/`: audit, reports and visual evidence.
- Production build refreshes generated `dist/` files and TypeScript build info.

The workspace already had extensive unrelated changes. No reset, checkout, commit, publishing or auth-route change was performed.

## Tests

11 focused landing tests cover supported main routes, no `/new` acquisition link, all retained/new assets, every generated file path, navigation anchors, missing-video fallback, reduced-motion/static contracts, responsive image metadata, accessibility structure, metadata and direct-anchor lifecycle.

The existing route-safety suite covers safe sign-in return paths, verified/signed-in redirects and onboarding. Signed-out CTA navigation was exercised in-browser. Signed-in and incomplete-profile behavior was verified by unchanged source/contracts, not by creating or using live authenticated test accounts.

## Validation

- Focused landing suite: **11 passed**.
- Full project suite: **451 passed, 0 failed**.
- `npm run typecheck`: passed.
- `npm run build`: passed; existing bundle-size/Browserslist warnings only.
- `git diff --check`: passed using `/Library/Developer/CommandLineTools/usr/bin/git`. The system `/usr/bin/git` shim requested acceptance of an Xcode licence; no licence was accepted or system setting changed.
- Browser: signed-out main CTA → `/sign-in?redirect=%2Fdashboard`; How It Works and Support routes; hash links; native disclosures; five-screen static mode; sticky Track → Map update; no broken loaded images; no horizontal overflow at checked widths.
- Visual review: existing page and all old images audited; new hero, large single-player proof, mapping story, desktop/tablet/mobile card proportions, supporting feature grid and full-page rhythm reviewed. Wide, laptop, tablet landscape, tablet portrait and mobile captures saved.
- Initial-review limitations: no separate new summary image; no live authenticated-account exercise; no physical-device or OS reduced-motion run. The video supplied later has now been tested as described below. Dense tablet UI requires opening the original for small text on narrow phones.

## Candidate Sections To Trim Later

Nothing below was removed in this first pass:

1. The five-step walkthrough repeats proof from the dedicated sections. Shorten it after reviewing the full scroll experience.
2. The full Team Mapping supplement repeats the central screen in the promotional artwork. Choose one if page length becomes a concern.
3. The mobile/linked-device supplements retain useful older assets but could start collapsed in a later concise version.
4. The premium promo and legacy content collage overlap with the finished-card/creator pair; keep whichever tells the clearest story after review.
5. The four audiences could become a shorter editorial strip.
6. The four supporting feature stories could be reduced or moved to How It Works, preserving the current proof assets.
7. The closing player cutout is optional brand imagery; removing it would reduce media weight without losing feature coverage.

Review the complete version before making those cuts.

## Reverse-Scroll Hero Follow-up — 22 September 2026

- New implementation: `HeroVideoStage.tsx` and pure `hero-video-progress.ts` helpers. Scoped CSS pins the portrait video beside the hero and Single Player Mapping section, then returns to the existing full-width Team Stats section.
- No earlier imagery removed. Former coaches-box hero photography now appears below the linked-team supplement.
- Browser proof at the initial desktop viewport: scroll 0 → video time 5.035s; scroll 720 → 2.720s; scroll 1800 → 0s; scrolling back to 1080 → 1.562s. The video stayed muted and paused. The pinned media top was 110px during the active range.
- “Use still image” was exercised: no video element remained, the poster loaded, and the toggle exposed pressed=true.
- 390px mobile check: no video element, no horizontal overflow, poster in normal flow between the hero copy and pillar strip. Reduced-motion is covered by the same enablement gate and tests; OS-level preference was not changed.
- Seven added tests cover reverse timeline endpoints, monotonic/reversible seeking, overscroll and invalid duration, serial seeking, listener cleanup, motion/media fallbacks and real asset paths. Full project suite: **458 passed**. Typecheck and production build passed; diff check clean.
- Media addition: **4,247,454-byte MP4 + 1,471,512-byte lossless poster = 5.72 MB**. Smaller/reduced-motion layouts request only the poster. The original image media totals above describe the initial image-only redesign.
- Compared with the preceding redesign build: main JS 1,752.52 → 1,755.30 kB (+2.78 kB; gzip +0.85 kB); CSS 199.94 → 202.51 kB (+2.57 kB; gzip +0.45 kB). No new package dependency.
- Screenshots: `docs/landing-qa/hero-video-start.png`, `hero-video-middle.png`, `hero-video-mobile.png`. The preview shows live motion; still captures only demonstrate selected frames.

### Enlarged opening background — 22 September 2026

The desktop film now fills the right 48% of the page and the viewport below the header, with no outer frame or right gutter. Left and bottom gradients blend it into the page; captions and the still-image control overlay the lower edge. The crop favours the player's face. Reverse scroll scrubbing across the opening two sections and the mobile/reduced-motion fallbacks are retained. Browser checks confirmed reverse playback (5.035s to 2.771s on downward scroll), no horizontal overflow at 1280px or 390px, and no mobile video element. Preview: `docs/landing-qa/hero-background-desktop.png`. All 458 tests and the production build passed.
