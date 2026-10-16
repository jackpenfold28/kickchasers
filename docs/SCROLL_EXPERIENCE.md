# Scroll experience

The Landing treatment described below has been superseded by the once-only chapter reveals and two bounded sticky stages in [LANDING_PAGE_SCROLL_STORY.md](LANDING_PAGE_SCROLL_STORY.md). The separate Pricing page retains its previous treatment.

Landing product chapters and pricing presentation now use reversible native CSS view timelines. Sections enter with opacity and a 36px translation / 0.985 scale, stay fully visible through the reading range, then fade out with a -24px translation / 0.99 scale. The motion follows scroll progress directly and reverses when the user scrolls back. The previous one-shot screenshot reveal was removed.

The hero retains its existing treatment. Pricing intro, cards, comparison introduction, shared free-feature explanation, category headings and optional add-on participate. Comparison table rows and the sticky mobile selector do not move or fade, preserving readability. Layout, prices, feature data, routes, image dialogs and subscription boundaries remain unchanged.

A small shared hook enables the effect after a wheel/touch gesture. Keyboard navigation disables it immediately; the next pointer scroll can resume it. Focused sections, anchor targets and any section with an open screenshot preview stay fully visible. Reduced motion, print, initial render, missing JavaScript and browsers without CSS view-timeline support use static content. Preference changes remove the enhancement. There is no scroll interception, animation library, sticky scene, scroll-frame JavaScript or measured layout loop. Gesture handling changes the root attribute only when its state changes.

Validation: 508 tests passed, including controller tests for keyboard input, preference changes, unsupported browsers and cleanup; TypeScript/production build and diff whitespace checks passed. Browser checked actual named-range keyframes, desktop fade/exit and reverse re-entry, keyboard opt-out, pricing table readability, and 390×844 mobile scrolling without horizontal overflow. Observed entrance at roughly 0.50 opacity, full reading state at 1, completed exit at 0 and reverse re-entry at 1. Screenshot evidence lives in `docs/scroll-experience-qa/`.

Physical-device testing and browser/OS reduced-motion emulation were not performed. Reduced-motion behaviour was checked through automated controller tests and the CSS preference guard. Existing Browserslist and bundle-size build warnings remain.
