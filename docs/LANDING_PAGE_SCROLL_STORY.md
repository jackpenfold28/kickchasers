# Landing Page Scroll Story

## Scope and current structure

This pass changes Landing motion only. The approved chapter order, existing copy, screenshots, CTA destinations, routes and hero are retained. Supporting chapters still include Profile, Squads, Voting and Social; the existing pricing section remains between Game Cards and the final CTA. The separate Pricing page's motion and the preceding annual-price/card redesign are preserved. No backend, authentication, entitlement, migration, dependency or asset changes.

The Landing no longer uses the reversible fade-out treatment from `useScrollExperience`; that remains scoped to the separate Pricing page. Ordinary Landing chapters reveal once and remain visible, as requested in the updated brief.

## Reveal architecture

`useLandingStory` observes each product chapter and the final CTA with one IntersectionObserver, a 0.18 threshold and a small negative bottom margin. Each chapter is unobserved on first entry. Its copy/heading and media animate as two meaningful groups using native Web Animations: 500ms for copy, 600ms for media, an 80ms media delay and the existing cubic-bezier(.23,1,.32,1) curve.

Single Player media enters from +40px horizontally; Team Tracking from -40px, with a small .98 scale. On mobile and tablet, media uses a 30px vertical entrance. Supporting chapter galleries animate as a single unit; rows, stats, icons and individual words are not staggered. The final CTA has a simple entrance.

No pending or hidden styles are applied before an observer callback. SSR, missing/broken IntersectionObserver, unsupported animation, fast scrolling and callbacks that never arrive all leave the original content visible. Entrance animations have no persistent filled end state. Keyboard input cancels active animations immediately; subsequent wheel/touch input restores pointer-mode entrances. Already revealed chapters never disappear or replay.

## Two desktop sticky moments

`ProductStoryStage` supplies a small wrapper and local three-step progress for Mapping and Game Cards only. The same children and screenshots remain in the DOM in every mode. Enhanced tracks are 220vh long and hold their stage at 100px below the page top. They release naturally into the following content without intercepting scroll.

Desktop staging requires at least 1101px width, 800px height and no reduced-motion preference. Stage sizing accounts for the heading, screenshots, captions and local progress so the complete scene fits on a laptop.

### Mapping

1. Select what to map: paired iPad/phone and existing explanation visible.
2. Map every stat: a small phone shift and active field-mapping explanation.
3. See the game move: focus moves to the Score Worm/momentum explanation.

The existing mapping screenshots already show the map and scoring context. They remain readable throughout; this pass does not invent alternate product states or replace assets. The local step and green line indicate the active focus. The phone remains in front of the iPad. No heavy zoom, blur or 3D transform.

### Premium Game Cards

1. Finished custom card leads; save/share and album screens are subdued.
2. The existing generated-card/save/share screen resolves beside it.
3. The album resolves into the final composition.

The first card rises only 24px and scales from .96; supporting media uses at most 32px lateral movement. State transitions use 450ms opacity/transform transitions. No rotations, flying chips, particles or glitter. The supplied save/share screen is retained rather than replacing it with a different creator screenshot. The stage releases into the already existing pricing section and CTA.

## Scroll progress and performance

One passive scroll listener drives both stages only when desktop staging is enabled. A single requestAnimationFrame coalesces scroll events. It uses cached document bounds and current scrollY, clamps progress to [0,1] and derives one of three states. Stage attributes update only when the state changes; local line transforms update only when progress changes.

Bounds are measured on setup, viewport changes and root ResizeObserver updates, covering disclosure/layout changes above the scenes. There are no DOM measurements in the scroll-frame updater. No permanent animation loop, global scroll context, wheel interception, snapping, animation dependency or added images. Transform and opacity are the motion properties; there is no shadow or large filter animation and no global progress bar.

Production bundle impact versus the preceding refined-pricing build: main JS +4,260 bytes raw / +1,457 bytes gzip; CSS +3,998 bytes raw / +648 bytes gzip. Combined additional compressed size approximately 2.1 KB, measured using Python gzip consistently on both builds. Existing large-chunk and Browserslist warnings remain.

## Responsive, reduced-motion and accessibility fallbacks

At <=1100px width, <=799px height, or reduced motion, tracks have automatic height and stages use normal static positioning. There are no empty sticky screens on phones/tablet portrait. All existing screenshots retain their original gallery/pair layout. CSS provides the fallback immediately even before the JS preference handler runs.

Reduced motion never starts entrances, cancels active animations, removes sticky enhancement and leaves all content visible. Keyboard input cancels entrances; keyboard/focus styles make staged media fully opaque with no transform or transition. Opening an image preview also restores all media to full opacity. Focus order and native image dialogs are unchanged. The same narrow-layout fallback handles constrained viewport widths associated with zoom.

The hero's existing reverse scrub was intentionally left alone. Team Tracking currently uses still screenshots, not the legacy video component. That component was not changed: its existing in-view, document-visibility, manual-pause and reduced-motion playback gates remain covered by the full suite. No video was added.

## Validation and visual QA

- Focused Landing/motion tests: 21 passed.
- Full project tests: 515 passed.
- `npm run typecheck`: passed.
- Production build: passed, output `/tmp/kickchasers-landing-story-final`.
- `git diff --check`: passed.
- No lint script is configured.

Browser checks verified all three Mapping and Cards states, slow/normal scroll, state reversal, fast scrolling past both tracks, natural release into subsequent content, unchanged chapter opacity after passing, and the image dialog restoring dimmed media. Hero structure and existing video gates were preserved. All current content and destinations are covered by existing Landing tests.

Responsive DOM/layout checks are recorded in `landing-story-qa/layout-checks.json`:

| CSS viewport | Sticky stages | Horizontal overflow |
| --- | --- | --- |
| 1920×1080 | Mapping and Cards | None |
| 1365×900 | Mapping and Cards | None |
| 1024×768 | None; static | None |
| 768×1024 | None; static | None |
| 391×844 | None; static | None |

The one-pixel laptop/mobile differences from the requested sizes result from the existing browser zoom/viewport rounding. At 1920/1365 widths both stage heights fit the available viewport. Normal-viewport desktop screenshots in `landing-story-qa/` show Mapping selection/map/momentum and Cards finished/share/album. Resized screenshot captures sometimes returned a blank navy surface despite visible DOM/geometry; these were not used as visual evidence. Default-viewport captures rendered correctly.

OS/browser reduced-motion emulation and native 200% browser zoom could not be verified through the available browser controls (the reset-zoom shortcut had no effect). Reduced-motion initial/change behaviour is covered by controller tests; static responsive behaviour was checked in the browser. Physical-device, screen-reader and cross-browser testing were not performed. These are the remaining validation limits, not claims of completed testing.

## Files changed in the Landing motion pass

- `src/routes/Landing.tsx`: adopt the Landing-specific hook and wrap the two existing chapter bodies.
- `src/components/landing/useLandingStory.ts`: one-time reveals, preferences, keyboard safety and bounded state progression.
- `src/components/landing/ProductStoryStage.tsx`: reusable two-story wrapper and local indicators.
- `src/components/landing/landing.css`: scoped staging and static fallbacks.
- `tests/landing-page-story.test.ts`: seven focused tests for default rendering, observer failure, coordinated entrance, keyboard/reduced motion, clamped progress, static fallbacks and preserved content.
- `tests/landing-redesign.test.ts`: update the Landing hook assertion.
- `docs/SCROLL_EXPERIENCE.md`: point to the superseding Landing treatment.
- This document and `docs/landing-story-qa/` evidence.

## Design result

The desktop experience has a guided product-story rhythm with exactly two bounded sticky moments. Ordinary chapters provide a stable reading experience and supporting sections give visual rest. Mobile remains a normal product page with gentle entrances. The design deliberately avoids hero rework, extra sticky scenes, continuous parallax, per-row effects and decorative spectacle.


## Entrance timing correction — 15 October 2026

The original observer watched whole chapters, including their outer spacing and tall sticky tracks. Its callback also treated the initial tiny intersection as an entrance, without checking the configured 18% threshold. This could finish an entrance before the screenshot itself reached a useful viewing position.

The shared observer now watches each actual copy block and media composition separately and requires at least 18% visibility within a viewport inset of 8%. Copy and media still animate as whole units, with an 80ms media offset; mobile screenshots wait for their own visibility instead of being consumed by the heading entrance. Desktop Single Player/Team media enter from opposite sides by 48px; other media enter vertically by 36px. Durations are 550ms for copy and 650ms for media. Pointer anchor navigation can reveal its destination; keyboard navigation remains instant. Reduced motion and observer failure retain immediately visible static content.

Regression coverage includes tiny initial intersections and independently arriving mobile media. Browser inspection during a real scroll confirmed Single Player copy at opacity 0/translateY(24px) and media at opacity 0/translateX(48px)/scale(.98), followed by opacity 1 and no transform once settled. No layout, pricing, routes, screenshots, sticky sequences or dependencies changed in this correction.


## Device sequencing and spacing refinement — 15 October 2026

This follow-up supersedes the earlier WAAPI entrance implementation and the original two-stage limit, following the owner's annotated request to reuse the approved three-phone interaction.

- Entrances are prepared in `useLayoutEffect` before paint, only for content below the viewport. Pending elements have no transition; revealing them enables a 600ms opacity/transform transition. Already-visible/restored-scroll content is never reset to hidden. Observer setup failure restores all prepared content.
- Each of the three tracking pairs observes its tablet and phone independently. Desktop devices enter from opposite sides; mobile uses a small vertical entrance. The phone remains in front. Browser scroll verification captured the tablet revealing while the phone was still pending, then the phone revealing on further scroll.
- Match Summary, Profile/Season and Voting galleries reuse `ProductStoryStage` with their existing captions as step labels. The mixed Club/poster composition remains static. Game Cards retains its approved progressive dim-to-visible sequence. Sticky galleries do not receive a competing observer entrance.
- Sticky track length is now the actual content height plus a 60vh flow spacer, rather than a fixed 220vh. A flow pseudo-element preserves a real sticky travel range without adding padding that prevents sticky containment. Section padding is 72px desktop and 48px mobile.
- Phone media uses proportional widths capped at 394/404px, with an explicit native screenshot aspect ratio to reserve space before lazy loading. This removes tall letterboxed image slots and prevents image loading from shifting anchor positions. At the owner's 1884×1453 CSS viewport, phones measure approximately 370–377px wide and 750–765px tall, in an approximately 796px gallery rather than a viewport-sized empty surface.
- Keyboard input exposes all pending content instantly. Reduced motion and tablet/mobile retain static stages; print exposes all content and removes scroll spacers. No dependencies, pricing, auth, screenshot assets or section order changed.

### Follow-up validation

Focused tests cover preparation before entrance, independently arriving tracking devices, observer failure, restored-scroll visibility, keyboard/reduced-motion changes, shared three-phone stages and reserved image dimensions. Full suite: 517 passing. TypeScript and production build pass; existing Browserslist/chunk-size warnings remain.

Browser geometry checks: 1884×1453, 768×1024 and 390×844 have no horizontal overflow. All five stages are static at tablet/mobile sizes. At desktop, the card stage holds at 100px and advances to state 1 with its progress/caption area inside the 960px viewport. Screenshot capture repeatedly returned blank navy output despite the measured visible layout; those invalid captures were discarded. Physical-device and cross-browser visual checks remain outstanding.


## Sticky headings and readable progress — 15 October 2026

The Match Summary, Profile/Season and Voting headings now render inside their existing sticky stages, before their galleries. They remain visible throughout the three phone states, matching Mapping and Game Cards. `ScreenGallery` accepts the existing heading markup rather than duplicating titles or creating a separate sticky header. Section order, copy and links remain unchanged.

Step labels increased from 12px to 16px, step numbers from 10px to 13px, captions from 13px to 15px. The local progress rail increased from 1px to 4px and from 560px to 840px maximum width. Phone sizing reserves additional space for the pinned heading and larger labels on shorter desktop screens.

Browser geometry verification at 1706×960: Profile heading stays at 100px during states 1 and 2; progress rail bottom is approximately 914px, inside the viewport. At 1884×1453 the heading remains inside the sticky stage, the rail is 4px and there is no horizontal overflow. Screenshot capture again returned a blank navy image; the invalid file was discarded. Regression coverage checks all three headings are passed into the stage and the updated progress sizing. Full suite: 518 passing; production build/typecheck and diff checks pass. Existing bundle-size/Browserslist warnings remain. Physical-device visual checks were not repeated.


## Standalone custom stat-pad chapter — 15 October 2026

The owner requested the existing two customization screenshots outside their Team Tracking disclosure. They now form `#custom-stat-pad`, immediately after Team Tracking and before Mapping, under “Your game. Your stat pad.” Each 340px desktop phone has an independent entrance, left then right direction respectively, using the existing observer and pre-paint preparation. This is a normal scrolling chapter, with no extra sticky stage or dependency. Narrow-screen entrances use the existing vertical/reduced-motion fallbacks. Browser checks confirmed the two desktop directions, removal of the disclosure, and no overflow at desktop or 390px mobile. Regression coverage includes standalone placement and independent entrances; all 521 tests and the production build/typecheck pass. Physical-device testing was not repeated.


## Hero iPad demo — 15 October 2026

The hero now includes the existing `team-tracking.mp4` directly beneath Get started / Explore the product, inside the supplied `screenshots/Ipad/blank Ipad.png` frame. The 4382×3105 frame has a transparent opening at approximately x126–4256/y130–2974; CSS places the video behind this opening without editing either asset. The decorative frame does not intercept pointer events, preserving native controls. Existing `TeamTrackingVideo` handles visibility, manual pause, reduced-motion, document hiding and poster/error fallback. No separate product chapter or dependency was added.

Browser checks confirmed playback while visible and paused playback after leaving the hero; 1884×1453 and 390×844 layouts have no horizontal overflow. Screenshot evidence: `landing-story-qa/hero-ipad-demo.png` (normal viewport). Full suite: 522 passing; production build/typecheck and diff checks pass. Existing large-bundle warning remains. Physical-device verification was not repeated.


## Framed video popup — 15 October 2026

Clicking the hero demo now opens a native modal matching the existing image-preview backdrop and close control. `TeamTrackingDemo` renders the same iPad frame in both sizes; the main video surface opens the popup while the bottom native control strip remains usable. The enlarged player mounts only while open, continues from the inline playhead and hands its position back on close. The inline player is suspended while the popup is open. Escape, close button and backdrop dismissal use native dialog behaviour; scrolling is locked only while open and focus returns to the enlarge button without scrolling.

Browser interaction verification confirmed an open framed popup, native controls, suspended inline playback, near-matching playheads, Escape dismissal, close-button dismissal, restored body overflow and returned focus. Popup bounds fit both 1706×960 desktop and 390×844 mobile without horizontal overflow. Screenshot evidence: `landing-story-qa/framed-video-popup.png` (capture crops the top of the popup, while measured dialog/close-control bounds remain within the viewport). No new dependencies, navigation or backend changes. Physical-device verification remains outstanding.


## Hero hold and analytics progress — 15 October 2026

Removed the portrait-film caption, wordmark overlay and manual still-image toggle as requested. The existing reduced-motion, media-error and narrow-screen poster fallback remains. The iPad demo has a 56px gap below the hero actions (previously 32px) and a 680px desktop maximum width (previously 620px); shorter desktop viewports use a responsive size so the full hero can remain readable.

The existing hero scroll controller now holds the left content only when it fits below the site header. The portrait film continues its existing reversible scrub while normal scrolling progresses through a bounded 70vh holding interval. Progress maps to the actual stage rather than extending beyond its end. A 4px local green rail follows progress, with “Taking professional analytics…” before halfway and “…to grassroots football.” after halfway. Screen readers receive the full sentence once; static/reduced-motion views show the complete phrase without a scrub indicator. No scroll interception or new dependency was introduced.

Browser verification: at 1706×960 the left column stays at 77px while 448px scrolling advances the rail to two-thirds and changes the phrase; the portrait video reaches an earlier frame. At 1884×1453 the iPad is approximately 672px wide and the progress remains visible. At 1365×900 the full 822px content fits below the 77px header and holds during scrolling. At 390×844 the portrait is static, content scrolls normally and there is no horizontal overflow. Evidence: `landing-story-qa/hero-scroll-progress.png`. All 523 tests, production build/typecheck and diff checks pass. Existing bundle-size warning remains; physical-device and OS reduced-motion verification were not repeated.
