# KickChasers UI Design Principles

Last updated: 2026-02-14

This document describes the current product design language. Use it as the source of truth for new UI and refactors. If a change conflicts, update this document first.

## 1) Visual Direction
- Athletic, high-energy, and premium. The UI should feel fast, loud, and confident without becoming cluttered.
- Dark-forward surfaces with bright neon accents; light mode should still feel bold, not washed out.
- Strong hierarchy through type weight, slanted display text, and contrast instead of heavy chrome.

## 2) Color System + Gradients
- Use `palette.background` for main screens, `palette.surface` for raised shells, and `palette.surfaceSoft` for inputs, list rows, and selection shells.
- Accent is neon green `#39FF88`. It signals primary actions, selection, and live states. Pair it with `palette.accentOn` or `#0B1224` for text.
- Borders are minimal: default to none or hairline `palette.border`. Selection uses accent borders.
- Gradients are purposeful and layered:
  - Match-day cards blend team tints with a diagonal dark overlay and a neon edge line.
  - Summary hero uses a multi-stop diagonal gradient with a bright highlight cap.
- Do not introduce new hardcoded colors unless they are already part of a controlled visual system (e.g., status tones or stat grids). Use palette tokens otherwise.

## 3) Typography + Hierarchy
- Display type is bold and often italicized for impact (scores, hero names, ratings). Use heavy weights (800-900) with tight tracking.
- Screen titles: 24-28 / weight 700-800.
- Section headings: 16-18 / weight 700-800.
- Labels: 11-13 / weight 700, uppercase with 0.3-0.4 letter-spacing.
- Body: 14-16 / weight 400-600; line height around 20-22.
- Use uppercase sparingly (labels, status chips, short tags). Avoid uppercasing paragraphs.

## 4) Layout + Spacing
- Default horizontal padding: 20-22. Vertical padding: 12-24. Large sections separated by ~18-24.
- Use `SafeAreaView` for screen bounds and set background color at the safe area container.
- Keep content linear and scannable; avoid nested scroll views outside modals.
- Embrace whitespace and consistent gaps instead of adding dividers.

## 5) Shape Language + Elevation
- Inputs, select fields, and primary CTA buttons are sharp (radius 0-4).
- Cards and modals can be rounded (12-20) for a premium feel, but stay consistent within a screen.
- Use shadows sparingly and only for hero surfaces or key highlights; most surfaces remain flat.

## 6) Core Components
- Feed cards are hero-driven with bold, italic display stats, strong imagery, and minimal UI chrome.
- Match-day cards use tinted gradients, italic score type, and a centered pill for live/final status.
- Profile and summary hero sections use layered gradients, large ghost numerals, and strong avatar rings.
- Tabs use neon underline sliders rather than full background fills.

## 7) Modals + Sheets
- Use `SwipeDownModal` for pickers (state, league, club, round). Title centered at 18/800.
- Option rows are filled shells, not outlined lists. Selected rows use `palette.accentSoft`, an accent border, and a checkmark.
- Share/preview modals use a dimmed backdrop with a centered card, soft radius (16-20), and stacked content.

## 8) Data + Status Visuals
- Stat tracking and score surfaces use distinct, vibrant tones with optional glow for quick scanning.
- Live status should use accent color and high contrast; finals can use strong red tones.
- Keep numbers large, condensed, and italic when they are the focus.

## 9) Motion + Feedback
- Motion is short and intentional: smooth cubic easing, subtle fades, and small translate/scale shifts.
- Press states use opacity or slight dimming, not heavy ripples.
- Avoid overly playful or springy animations; the feel is precise and athletic.

## 10) Copy Tone
- Short, direct, confident. Avoid corporate language.
- Microcopy should be action-driven and specific (e.g., “Select league”, “Add a quick caption”).
- Errors are clear and constructive without blaming the user.

## 11) Accessibility + Touch Targets
- Tap targets are at least 36-44px in both dimensions.
- Ensure contrast is strong on dark surfaces, especially for muted text.
- Keep text sizes legible; do not rely on color alone to convey state.

## 12) Do / Don’t
- DO use `palette.surfaceSoft` for inputs and selection rows.
- DO use neon accent for primary actions and selected states only.
- DO lean on italic display type for scores, ratings, and hero text.
- DON’T introduce new color tokens or icon packs without aligning to the palette system.
- DON’T add decorative borders or shadows unless they reinforce a hero surface.
- DON’T build new dropdowns; use the existing `SwipeDownModal` pattern.

## 13) Implementation Guardrails
- Start new screens from the existing screen scaffolds (safe area, scroll content, consistent padding).
- Reuse patterns from feed, match-day, and summary hero components rather than inventing new card layouts.
- If a new UI needs a different pattern, update this document first.
