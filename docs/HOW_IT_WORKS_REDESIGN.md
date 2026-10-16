# How It Works redesign

Implemented 15 October 2026. Frontend presentation only.

## Content and design

The guide now contains 16 walkthroughs grouped into Getting started, Match day, Your season and Club tools. All nine original workflows retain their identity, title, summary, four bullets and takeaway. The original product loop and introductory explanation remain. The original content module was not edited.

Added walkthroughs for team selections, single-player tracking, custom stat pads, mapping and match intelligence, Game Cards and album, Best & Fairest voting, and tallies and club awards. All 43 supplied product screenshots appear in the guide. The existing benchmark proof remains because it explains the original ratings guidance. Mobile screenshots are not presented as evidence of the desktop portal.

The navy palette, restrained green, athletic display headings and thin dividers follow the landing page. Desktop uses a grouped sticky index and a single readable walkthrough. iPad/phone pairs retain their device composition; other chapters use large screenshot galleries. Every screenshot opens the existing accessible same-page preview.

## Interaction and responsiveness

Arrow keys, Home and End switch desktop tabs and move focus. Keyboard changes are immediate. Pointer selection uses a short opacity/8px entrance; reduced motion disables that animation. There are no scroll-linked effects or hidden entrance content. Mobile and narrow tablets use a native grouped topic selector. The guide preserves existing sign-in, sign-up and portal destinations.

At 900px and below the index becomes the native picker. At phone widths media stacks or uses two columns, with wide poster compositions stacked. No new dependencies, backend changes or subscription changes.

## Validation

- Focused How It Works tests: 6 passed, including all 16 rendered selections, exact preservation of original text, all 43 screenshot assets, ARIA/keyboard contracts and responsive/reduced-motion rules.
- Full project tests: 522 passed.
- Typecheck: passed.
- Production build: passed (3.76 seconds).
- Git diff whitespace check: passed.
- Browser: profile, single-player, team selections, mapping and voting checked; image modal opens and Escape closes it, restoring body scrolling. End/Home navigation switches panels with pointer animation disabled. Native mobile selector switches guides.
- Responsive browser checks: 1920×1080, 1366×900, 1024×768, 768×1024 and 390×844. No horizontal overflow. Current mapping images loaded successfully. Screenshots saved in `docs/how-it-works-qa/`.

Build output: CSS 233.38 kB (38.95 kB gzip); main JS 1,829.12 kB (506.81 kB gzip). No before/after bundle claim is made. Existing large-chunk/Browserslist warnings remain; SSR tests expose the shared media component's existing React fetchPriority warning. Ten newly prepared screenshot sources add responsive WebP variants; the complete 43-screen set totals 7,700,740 bytes across all variants, loaded responsively/lazily by the shared components.

Physical devices and OS-level reduced-motion toggling were not tested. Reduced-motion rules were checked by focused tests. No claim is made of full cross-browser testing.

## Files

- `src/routes/HowItWorks.tsx`
- `src/routes/how-it-works.css`
- `src/components/landing/how-it-works-guides.ts`
- `src/components/landing/landing-assets.json`
- `scripts/prepare-landing-screenshots.py`
- Responsive image variants in `public/landing/images/`
- `tests/how-it-works.test.ts`
- This document and QA screenshots
