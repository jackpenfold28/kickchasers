# KickChasers design principles

Last verified: 2026-07-23

Source of truth: current theme tokens in `constants/theme.ts`, the tab shell, current feed/match-day/profile/tracker/summary screens, and reusable UI under `components/`. Files under `design/` are references and may be historical.

## Direction

KickChasers is dark-forward, athletic, high-energy, and information-dense on match day. Neon green `#39FF88` is the primary action/live accent. Team/club colours personalise game and content surfaces without replacing semantic status colours.

## Principles

1. **Make the live state obvious.** Score, quarter, timer, sync state, active side/player, and pending location must be visible without hunting.
2. **Prioritise one-handed phone use; scale deliberately to iPad.** Phone trackers use carousels/pads; iPad trackers use landscape multi-panel layouts.
3. **Use identity and data together.** Club colours, logos, opponent, round, and player identity contextualise stats.
4. **Distinguish data representations.** Field heat, shot trajectories, influence timeline, score worm, team-stat momentum, and season momentum answer different questions.
5. **Keep capture fast.** Tracker buttons are high-contrast, large, haptic, and reversible. Modifiers and field placement follow the base stat.
6. **Use progressive disclosure.** Advanced statistics, filters, admin actions, and edit tools should not compete with primary match actions.
7. **Preserve consistent permission cues.** Hide or explain unavailable management actions, but never rely on UI gating for security.
8. **Make generated content honest.** Recaps/posters are deterministic templates. Do not label them AI-generated.

## Tokens and surfaces

- Use `getKickchasersPalette()` and palette properties rather than new isolated hard-coded colours.
- `palette.background`/`navBg`: screen and navigation backgrounds.
- `palette.surface`/`surfaceSoft`: raised cards, inputs, and selection rows.
- `palette.accent` and `accentOn`: primary action/selected/live pair.
- Use team tints for heroes, match cards, map markers, and comparison charts.
- Hard-coded stat colours are acceptable only in the established tracker/stat mapping systems.

## Typography

- Heroes, scores, ratings, and team names may use bold/italic display treatment.
- Body and helper copy should remain plain, concise, and legible.
- Uppercase is for short labels/statuses, not paragraphs.
- Do not compress text below legibility to preserve a decorative layout.

## Shape and spacing

The current application uses both square/full-bleed recap surfaces and rounded glass/modal shells. Consistency is local to the component family:

- feed and some stat cards: full-bleed/square;
- floating tab bar and modal sheets: rounded/glass;
- tracker controls: compact radii chosen for hit area and scan speed;
- selection rows: filled shells with clear selected state.

Default screen horizontal padding is approximately 20–22 px. Use shared scale/grid helpers for tablets and multi-column lists.

## Motion and feedback

- Keep motion short and functional: tab transitions, active underlines, tracker sequence feedback, collapse/sticky headers.
- Use haptics for tracker/tab actions where already established.
- Avoid animation that delays stat capture or hides synchronisation state.
- Preserve reduce-motion/system accessibility behavior where platform APIs provide it.

## Accessibility

- Aim for 44 px touch targets, especially tracker and modal actions.
- Maintain contrast over club-colour gradients.
- Pair colour with label/icon/state; do not signal live/error/selection by colour alone.
- Supply accessibility labels for icon-only and stat controls.
- Support dynamic screen sizes; do not assume the tested iPhone/iPad dimensions.

## Reuse guidance

- Use `SwipeDownModal`/`SelectionSheet` for pickers.
- Use `LiveLeagueGameCard` for compact live/final fixture display.
- Use the summary component family and `summary/theme.ts` only for recap layouts.
- Treat tracker/side-menu components as domain-specific, not generic primitives.
- Use `TeamSelectionPosterView`, feed cards, and Instagram poster components for their existing export formats.

## Known inconsistencies

- Older screens mix radius, padding, and legacy theme utilities.
- Some template-era components remain unused.
- Several very large route components combine data, layout, and mutation logic, making visual consistency harder to enforce.
- Accessibility and export layouts have no automated visual regression coverage.
