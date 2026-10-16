# Screenshot-led Landing Redesign

Implemented 12 October 2026 using the supplied Emil Design Engineering skill.

## Scope

Rebuilt the product sections around 30 selected screenshots from the 44 supplied images. The hero markup, hero media/behaviour, pricing component and pricing-specific styles remain unchanged. Existing signup and login destinations remain supported. No backend, subscription, dependency or migration changes.

## Product story

1. Player tracking: copy beside an iPad/iPhone pair.
2. Team tracking: reversed composition, with configurable stat-pad screenshots behind native details.
3. Field mapping: a larger paired-device demonstration with action filtering and match-flow explanations.
4. Match review: summary, Match Day and individual performance screens.
5. Season: profile, history and leaderboards, with weekly leaders available on expansion.
6. Squads: club home, management and team selection, with members/guests/roles in details.
7. Voting: Best & Fairest card, assigning voters and season tally; shared links and other awards in details.
8. Player cards: custom card, generated result and album, with the feed available on expansion.

Every paired device composition has the iPad at layer 1 and the phone at layer 2. The phone remains in front at every breakpoint. Existing screenshot frames are preserved; no extra fake device frames were added. Every screenshot opens its supplied original in a new tab for closer inspection.

## Images and implementation

`ProductScreens.tsx` contains two small presentation components: DevicePair and ScreenGallery. Both reuse existing LandingMedia lazy loading, dimensions, responsive sources and original-image access. The existing asset manifest is extended without altering old entries.

`scripts/prepare-landing-screenshots.py` creates WebP variants in `public/landing/images`. It trims only transparent outer canvas and never removes screen content or changes supplied originals. All 30 assets across their responsive variants total approximately 5.58 MB; browsers request only the appropriate version and lazily load below-the-fold images. Original PNGs remain untouched in `public/landing/screenshots`.

The desktop layout alternates device/copy placement. Tablet stacks paired devices beneath compact copy; phones retain an overlapping foreground position. Phone galleries use a larger lead image and two supporting screens below on mobile. Details remain native and keyboard-operable. Motion is restrained to instant fine-pointer press feedback; product images remain readable without scroll entrances, looping movement or new animation dependencies. Existing reduced-motion behaviour is retained.

## Validation

- Full project tests: 503/503 passed, including added coverage for real capture references and paired-device layering.
- Production build (including TypeScript check): passed; output directed to a temporary directory to preserve tracked build assets.
- `git diff --check`: passed.
- Verified hero markup against HEAD and verified every pre-existing manifest entry unchanged.
- Browser inspections: desktop (~1280px and 1440px), tablet 768×1024, mobile 390×844.
- Verified no horizontal page overflow on mobile or mapping desktop, real responsive image loading, all three pair layer orders, pointer expansion and Enter collapse for native details.
- Existing large bundle/Browserslist build warnings remain outside this task. Physical-device and screen-reader testing were not performed.

Screenshots are saved in `docs/landing-screenshots-qa/`, including player desktop/tablet/mobile, team desktop, mapping desktop, squad/voting desktop and player-card desktop/mobile evidence. The user's original browser tab was preserved and temporary viewport changes reset.

No commit, push or deployment was performed.

## Social story and annotated refinements

Added a standalone social section with the supplied team-selection design and generated team-result artwork. The selection composite also replaces the plain lineup screen in the centre of the squad gallery; on phones it becomes the lead image above the two squad screens. Voting now uses `teams.png` and explains keeping every club team's votes together.

Removed the members/guests/roles, voting-link/other-awards and feed disclosures from Landing. Their original assets remain available for a future How It Works update; that page was not changed. Removed the marked hero chapter-link strip; the hero heading, video and main actions remain unchanged. Mapping copy now accompanies the explanatory points beside the devices (below on tablet/mobile).

Restrained blue story surfaces and muted gold voting accents distinguish sections. Screenshot groups receive a once-only 420ms opacity/18px entrance using IntersectionObserver and the native Web Animations API. Nothing is hidden by default. Reduced motion skips entrance and hover movement, including when preferences change while the page is open. Fine-pointer hover uses a 180ms transition; keyboard focus remains immediate. No dependency added. Phones remain in front of iPads. Pricing remains untouched.

Validation: 504 tests pass; production build/typecheck pass; diff whitespace check passes. Rendered desktop social, 390px mobile social/squads and 768px tablet mapping; no horizontal overflow in checked views, new images loaded. Evidence: `landing-screenshots-qa/social-desktop.png`, `landing-screenshots-qa/social-mobile.png`. Existing build warnings about Browserslist age and large chunks remain.
