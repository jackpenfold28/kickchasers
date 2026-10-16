# Pricing Visual Critique

## Executive Summary

Method: dual-agent (A: `/root/pricing_design`; B: `/root/pricing_evidence`), followed by a responsive browser inspection and synthesis. Audit date: 11 October 2026. Scope: the public landing page's Pricing section only. No application code, commercial terms, account flow or checkout behaviour changed.

**Current score: 66/100. AI-slop risk: 4/10. Recommended direction: four compact editorial plan rows, with audience-led differentiation and a clearly separated launch-access message.**

The section has a credible foundation: continuous navy, athletic heading typography, readable prices, restrained green and open columns. It does not currently use four heavy rounded card shells. Adding more surfaces or glow would solve the wrong problem.

The largest problems are the competing messages of free launch access and apparent paid selection; repetitive vertical structure that makes mobile comparison slow; and audience differences buried under descriptions and inherited feature lists. Premium quality should come from clearer sequencing, stronger alignment and useful distinctions.

Keep Free, Member, Player and Club in that order. Preserve all prices and inclusions. Use Player's existing recommendation flag as a modest, persistent endorsement for the athlete audience; distinguish that from a visitor's selected state. Do not imply all supporters and club administrators should choose Player.

### Evidence and limits

- Live page inspected at 1920×1080, 1366×900, 1024×768, 768×1024 and 390×844. Both independent reviewers also inspected separate temporary desktop tabs. The user-supplied annotated image corroborates the target; findings below use the current rendered page and source.
- Read `PricingSection.tsx`, `pricing-plans.ts`, the pricing and shared rules in `landing.css`, pricing tests, and the relevant App/Register routing. Tested Yearly, Select Club and the comparison disclosure in a temporary tab. No account was created and no payment was attempted.
- DOM measurements: desktop grid max-width 1440px; at 1366px, columns approximately 290px wide with 28px gaps. Pricing section height approximately 1192px at 1920, 1177px at 1366, 1650px at 1024, 1699px at 768 and 2702px at 390. Heights include section padding and the closed comparison state; browser reflow can vary slightly.
- At 390px there was no document-level horizontal overflow. The open comparison table is intentionally 700px wide inside a 345px scrolling region. This is contained overflow, not a broken page.
- Impeccable context launcher failed with permission denied. The detector was attempted directly and through its shell launcher; the latter reported engine 0.1.11 absent and its cache directory unwritable. No deterministic scan result exists. Read-only browser APIs do not support the required overlay injection, so no overlay or detector live server was created. Manual source and rendered evidence were used instead.
- PRODUCT.md, DESIGN.md and the critique ignore file were absent. Slug/storage helper failed for the same missing engine; this requested document is the archive, with no generated trend history. Temporary review tabs were closed and the viewport override reset. The user's tab was preserved.
- No screen-reader session, 200% zoom, real-phone touch test, tax/currency confirmation, live checkout or backend entitlement enforcement audit was performed. “Most selected” has no supporting analytics in the inspected files.
- Skill application: Impeccable hierarchy and responsive critique; Taste's specificity and anti-template judgment; Animate's frequency/purpose/tool gates; Ponytail's smallest complete implementation. The explicit audit brief takes precedence over skill defaults to write code, randomize layouts, add GSAP, enlarge section spacing or restructure the entire page.

## Current Score

These are design judgments for the current presentation, not billing-system or approved entitlement scores. Overall score is the rounded unweighted mean.

| Dimension | /100 | Main reason |
|---|---:|---|
| Clarity | 70 | Plans and prices readable; launch versus future billing requires interpretation |
| Hierarchy | 66 | Useful heading and price scale; recommended plan arrives late on mobile |
| Visual design | 65 | Restrained but repetitive, with weak content rhythm |
| Product fit | 74 | Athletic brand and football tools present; audience distinctions underused |
| Plan differentiation | 68 | Real differences exist but sit beneath generic straplines |
| Feature comparison | 57 | Inheritance requires recall; table mixes unlike capabilities |
| CTA clarity | 62 | Account action is clear; plan selection has no continuation |
| Responsive design | 64 | No observed page overflow; phone and tablet reading paths are too long |
| Motion opportunity | 72 | A few simple feedback transitions would help without a framework |
| Premium feel | 60 | More deliberate information architecture is needed before decoration |
| **Overall** | **66** | **A useful foundation needing a focused presentation rebuild** |

Independent heuristic cross-check: visibility 3/4; real-world match 2/4; control 3/4; consistency 2/4; error prevention 2/4; recognition over recall 2/4; aesthetic/minimalist design 3/4. Efficiency accelerators, error recovery within this non-submitting section, and separate documentation were n/a. Total **17/28**, not 17/40. This narrower rubric is separate from the requested scorecard.

## AI-Slop Risk

**4/10.** The section is restrained and recognisably within KickChasers' visual system. There are no observed neon card glows, repeated gradients, floating cards, ornamental tier metals or checkmark explosions. Four plans are real product data, not template filler.

Template-like signals remain: equal repeated plan columns, abstract “performance tier” language, a tiny recommendation label, and four purchase-like selection buttons above a separate signup action. The answer is stronger product meaning and fewer decisions, not an unfamiliar layout for its own sake.

## Current Pricing Model

Source authority: `src/components/landing/pricing-plans.ts`. These are the current configured terms, not an independent verification of billing operations.

| Plan | Monthly | Yearly | Intended audience / job | Strongest current differentiator |
|---|---:|---:|---|---|
| Free | $0 | $0 | Players starting basic tracking and review | Basic stats, last 3 games, card creation, viewing stats |
| Member | $5 | $39.95 | Families and supporters following match day | Everything in Free plus live scores and stats |
| Player | $15 | $84.95 | Athletes reviewing development over time | Member inclusions, advanced stats, unlimited game/season/profile history, leaderboards and eligibility |
| Club | $99.95 | $999.95 | Squads, staff and official club programs | Everything above, official squad management, line-up generation, guest/opposition linking, roles and activities |

- Default reference cadence is Monthly; default locally selected tier is Player. Only Player has `highlight: true`.
- Current explicit launch rule: all features are free for all users for a limited time. The section says the plans show the structure once billing begins. No start date or trial length is supplied.
- Yearly displays the actual annual total, not a monthly equivalent. Displayed savings are correctly rounded: Member 33%, Player 53%, Club 17%. Free shows “Free plan” without a saving. Its unused savings calculation produces NaN internally; this is not a visible defect and does not justify a pricing rewrite.
- Selecting a plan only updates React state and its highlight. The shared account link remains `/sign-up`; neither tier nor cadence is carried forward. Register reads a safe redirect, not a plan or billing period. No checkout integration is called by this section.
- App routing sends verified signed-in visitors away from landing/auth entry to Dashboard or onboarding; unverified users go to email verification. Do not describe this visitor section as a logged-in upgrade screen.
- Currency is rendered only as `$`. Australian context suggests AUD but does not prove the billing currency or tax treatment. Confirm before adding an AUD/GST claim.
- The comparison rows include claims beyond the bullets, such as Player “Squad creation” and Club “Unlimited club-wide history.” These require product verification before any inclusion matrix is rewritten. Do not silently remove or extend entitlements.

## First Impression

The plans look orderly and credible at desktop width, but the section feels more like a list of future subscriptions than an invitation to start using a football product now. The large heading establishes brand; the four repeated blocks lose that momentum.

| Five-second assessment | /10 |
|---|---:|
| Clarity | 7 |
| Hierarchy | 6 |
| Trust | 6 |
| Premium feel | 5 |
| Product fit | 7 |
| Mobile usability | 6 |

The prices are already prominent enough. The important missing hierarchy is between launch access, future plan reference, audience fit and the real account action. Four choices are not excessive; the repeated prose and selection step increase cognitive load.

First-timer risk: “Selected Player” looks like an account commitment. Supporter risk: “performance tier” makes Member feel secondary despite its different job. Mobile risk: remembering Free and Member while scrolling to Player and Club.

## Tier Hierarchy

Keep the current order. It progresses from entry access through following, individual performance and club operations. Do not turn these into Player/Tracker/Club tiers: Tracker is not a configured plan.

Player merits restrained emphasis because the actual configuration highlights it and its advanced tracking/history align with the core athlete proposition. This is evidence of current presentation strategy, not proof of popularity or a universal best choice. “Most selected” needs analytics/business confirmation before retention in revised copy.

Use a static “Recommended” text marker beside Player plus a short green rule. Avoid lifting, enlarging, offsetting or filling its entire row. Keep every price on a shared alignment. A visitor exploring Club must not visually erase the product recommendation.

## Layout Options

| Direction | Evaluation | Decision |
|---|---|---|
| A — Refined four-column plan strip | Smallest markup change; good simultaneous desktop comparison. Retains repetitive blocks and two-row tablet composition; needs substantial mobile adaptation. | Viable fallback, not the strongest result |
| B — Audience-led editorial plan rows | Four horizontal rows with tier/audience, price/cadence and decisive capabilities. Open surface, variable content fits naturally, mobile can retain the same reading order. | **Recommended** |
| C — Plan selector and focused detail panel | Compact presentation, but hides alternatives, adds state and makes side-by-side comparison harder. An unnecessary selection model during free launch. | Reject for this scope |
| D — Full comparison-first matrix | Strong detailed comparison after entitlement verification; too dense as the first encounter, especially on phones. | Keep as optional detail only |

## Recommended Direction

**Audience-led editorial plan rows on the existing continuous navy surface.** The hierarchy becomes: current launch access and account action; future plan pricing with cadence control; four plan rows; optional full inclusion detail.

Use existing plan names as headings. Place an audience description directly beside/below each: players getting started; families and supporters; athletes tracking development; squads and staff. These are proposed presentation labels derived from existing descriptions, requiring copy approval before implementation.

The decisive differences should be readable without expanding anything: last 3 games/basic stats; live match-day access; advanced stats/unlimited history; official squad operations. Preserve all supporting inclusions in detail disclosures. No new tier, promise or product illustration is necessary.

## Surface / Card Design

- Preserve the page background based on #02091A and its existing subtle shell treatment. No independent panel behind pricing, no glass, no row gradients, no glow.
- Replace full-height repeated columns with rows separated by fine neutral rules. Keep the existing 3px button radius; do not introduce a new radius system.
- Desktop row proposal: 24% tier/audience, 18% price/cadence, remaining space for decisive capabilities and a subordinate inclusion disclosure. Use a gap of 24–32px, with `minmax(0, ...)` tracks and natural content heights.
- Give rows 24–28px vertical padding on desktop, 20–24px on phones. Do not impose identical fixed heights; align repeated price/name edges instead.
- Player gets a small green label/rule, not a green CTA that competes with account creation.
- Pricing should inherit its neighbours' typographic character while presenting factual information more quietly. No sports decoration, fake membership pass, stadium image or trophy emblem is needed here.

## Feature Lists

Main view: lead with real differences rather than inheritance. Free shows basic tracking and last-3-game history, with card creation retained visibly or immediately in details. Member leads with live scores/stats. Player leads with advanced stats and unlimited history, keeping leaderboard/eligibility access easy to discover. Club leads with official squad management and line-up/linking tools, retaining roles and activities in details.

Use one short inheritance line where helpful, followed by grouped capabilities. Avoid replacing bullets with a wall of checkmarks. An “Includes Member features” line can be secondary; it must not be the main explanation of Player.

All current material inclusions must remain accessible. Prefer one native inclusion disclosure per row to a new tabbed detail system. Avoid duplicating the entire feature set both inside each row and in a second matrix unless the matrix answers a genuinely different comparison need.

The present comparison's “Match day access” and “Squad tools” rows mix unrelated capabilities across plans. Rebuild into actual feature rows only after verifying the existing extra claims. A visual pass can preserve the current data untouched; semantic entitlement correction is a separate product decision.

## Typography

- Keep the existing athletic italic uppercase section-heading style and white/muted hierarchy. No font package or site-wide typography migration is justified. Actual current rendering uses Arial/Helvetica; a random Taste-prescribed font would break continuity.
- The existing heading is readable in two lines at reviewed sizes. Its problem is generic decision language, not line count. Proposed copy direction: “Your game. Your level.” with a plain factual launch message beneath; approve wording before implementation.
- Plan names: approximately 22–24px/1.2, bold. Audience labels: 14–15px/1.5. Feature text: 14–16px/1.5–1.6. Avoid 11px recommendation copy; raise it to 12–13px.
- Price: approximately 32–36px desktop and 28–32px mobile, tabular numerals. Keep `$99.95` and `$999.95` intact; do not split decimals or conceal the annual total. Cadence should remain adjacent at 13–14px.
- Current prices reach 40–44px; their prominence is adequate. Better alignment and context matter more than increasing size.
- Place “future plan pricing” context beside the cadence/price area so “Billed monthly” cannot be mistaken for an immediate charge. Do not introduce tax, currency or payment promises without confirmation.

## CTA UX

The actual conversion is account creation during free launch. Give “Create your account” one primary green button close to the launch explanation, before the plan reference. Keep `/sign-up` and auth handling unchanged.

Do not present plan selection as a necessary account step. Recommended eventual UI change: replace the local-only Select controls with neutral “View inclusions” disclosures. This changes presentation interaction, not billing or signup logic, and requires implementation approval. Do not wire plan state into signup or add checkout as part of a design pass.

The existing below-grid account CTA can become a subordinate text link if a convenient end-of-section repeat is useful on mobile. Avoid two equal primary buttons within this section. Leave the site's header signup and separate final page CTA outside this scope.

## Trust / Clarity

Keep the existing free-launch fact prominently visible. Separate “access now” from “plan structure once billing begins” using clear grouping, not fine print. Current repeated launch wording can be consolidated without losing the qualification that this is limited-time access.

Do not add “cancel anytime,” “no lock-in,” a free-trial duration, “no card required,” a price guarantee, per-seat/per-club units, contact-sales routing or a launch end date: none is proven by the inspected pricing/signup source. No need to invent trust badges or customer counts.

Verify “Most selected,” explicit currency and comparison-only entitlements before changing their wording. These are content questions, not evidence that the configured prices are wrong.

## Motion / Microinteractions

Gate: occasional visitor interaction; purpose is **feedback and state indication**. Pricing facts must remain stable while being read. The current section has no substantive card motion: billing/selection/disclosure states update immediately; the shared CTA has a 200ms background transition. Computed default `transition: all` on other controls had no nonzero duration, so it is not evidence of animated layout.

Recommended motion budget:

| Element | Recommendation | Tool / timing |
|---|---|---|
| Billing state | Optional small underline/indicator movement; prices update immediately without counting or rolling | CSS transform, 180ms, `cubic-bezier(0.77,0,0.175,1)` |
| Account CTA arrow | Move 2px horizontally on fine-pointer hover; preserve immediate focus outline | CSS transform, 160ms, ease |
| CTA press | Optional scale 0.98, no layout movement | CSS transform, 120ms, strong ease-out |
| Inclusion disclosure | Native instant open/close is sufficient for first build; icon may rotate 45 degrees | CSS transform, 160ms, `cubic-bezier(0.23,1,0.32,1)` |
| Recommendation | Static label and rule | No animation |
| Plan rows/features | Stable | No entrance reveal, stagger, floating or hover lift |

Reuse existing easing/duration tokens where present; do not create a parallel motion framework. Name properties explicitly, not `transition: all`. Rapid toggles must retarget smoothly and never delay price updates. Fine-pointer hover motion must be gated by `(hover:hover) and (pointer:fine)`.

Preserve the current reduced-motion override: instant content/state changes and visible focus remain valid. Optional colour feedback is acceptable; disable positional movement. No GSAP, spring library, scroll pinning, parallax, glow pulses or scroll-entry animation is justified. Keyboard operation should remain immediate.

## Mobile

At 390×844, the current intro/cadence occupy most of the first screen, Free starts about 582px down the viewport, Player starts about 1543px down, and the account action starts around 2697px down in the initial anchored view. Four plan blocks alone span roughly 1,885px, before inter-plan gaps. These are measured reading costs, not evidence of overflow.

Recommended mobile presentation: one compact full-width row per actual plan. Tier name/audience at the left; unbroken price and cadence at the right where they fit; one decisive capability beneath; inclusion disclosure directly below. Stack price under the name at narrower widths or zoom rather than compressing text.

Keep Free → Member → Player → Club order. Show all four plan names, prices and distinctions in the initial comparison sequence with details closed. A target is approximately 120–160px per compact row, subject to real copy and zoom; never enforce clipping or fixed row heights to hit this target.

Place the real account CTA before the plan reference so users can start without traversing the list. Avoid a sticky bottom CTA initially: it adds chrome and can obscure content. No horizontal plan carousel or tiny four-column table as the main decision surface. Retain a contained optional comparison scroll region if the full table remains, with an explicit horizontal-scroll hint and a visible first-column context.

## Tablet

Current 1024px and 768px layouts correctly switch to two plan columns, avoiding cramped four-up text. However, they create two complete plan rows and push Player/Club below Free/Member. At 768px the desktop two-column heading persists: bottom alignment places the heading well below the top of the longer launch description. This is a visible imbalance, not a hypothetical breakpoint issue.

Recommended behaviour: stack heading/launch explanation by about 900px. Use three-track editorial plan rows at 1024px while content fits; at approximately 900px and below use a name/price header plus a full-width capabilities line. These are proposed breakpoints to validate, not measured defects in every intermediate width. Keep 24–28px row spacing and comfortable text measure. Do not introduce three narrow plan columns.

## Accessibility

Keep named section H2, plan H3s, native buttons, native details/summary and explicit focus outlines. Current billing targets are 102×44px and plan buttons are at least 48px high; preserve a minimum 44px target for replacements.

Billing is already a named pressed-button group. It does not need tabs with fictitious panels. If plan selection is retained rather than removed, a named single-choice group would describe exclusivity more clearly; do not build a custom keyboard model unnecessarily.

Recommendation must remain textual, not colour-only. Disclosure state must use native expanded semantics. Keep content present and readable without hover or animation.

Four independent price live regions may produce verbose announcements without plan context. Validate with VoiceOver; a single concise status such as “Yearly prices shown” plus individually labeled price content is a cleaner future option. This is a proposed accessibility refinement, not a confirmed screen-reader failure.

Muted text is visibly readable on navy, but the audit did not measure every contrast pair. The implementation check must cover 4.5:1 body text, focus visibility, 200% zoom, long annual prices, table scroll and a real phone. Do not claim certification from screenshots.

## Implementation Restraint

The visual build should principally touch **PricingSection.tsx and its scoped pricing rules in landing.css**. Reuse the existing `pricing` array, `comparisonRows`, button styling and native details. Keep names, prices, entitlements, savings calculations, default cadence, account URL and auth/checkout paths unchanged.

No dependency is required. No new pricing component framework, image assets, backend, subscription model, plan persistence, global font migration or site-wide shell refactor. One component, scoped CSS, native disclosure and existing state are enough.

Any approved audience-copy adjustment can remain in the component or use existing descriptions. Change `pricing-plans.ts` only for explicitly approved editorial wording or verified comparison corrections; do not mutate commercial values during layout work. If selection controls are retired, delete their unused local state rather than adding a persistence layer.

Required later verification is bounded: desktop/laptop, both tablet sizes and mobile; monthly/yearly prices including Club annual total; keyboard disclosures/focus; reduced motion; signup destination unchanged. Reuse pricing invariant tests and add meaningful interaction checks only where behaviour changes. No tests were run for this documentation-only audit.

## Keep / Reduce / Remove / Rebuild

| Action | Element |
|---|---|
| KEEP | All four real tiers, order, prices, annual savings, inclusions, free-launch qualification, account routing |
| KEEP | Continuous navy, restrained green, athletic heading, open surfaces, focus outlines and native disclosure |
| REDUCE | Repeated generic prose, empty alignment space, repeated inheritance-led lists, multiple primary-looking actions |
| REMOVE in approved build | Purchase-like local-only Select buttons; unsupported popularity wording only after product review |
| REBUILD | Plan composition as editorial rows; launch-versus-future-pricing hierarchy; compact mobile presentation |
| REBUILD after entitlement verification | Comparison categories into genuinely comparable feature rows |
| DO NOT ADD | New tiers, commercial promises, decorative imagery, glowing shells, scroll choreography or a new framework |

## P0

**None observed.** No blocking layout defect, invalid displayed price or broken account destination was established. Selection semantics and launch/price framing are material P1 clarity issues, not grounds for an emergency commercial rewrite.

## P1

| Location / current problem | Proposed solution | Expected impact | Risk |
|---|---|---|---|
| Launch intro, billed labels and Select controls imply an immediate paid choice | Separate current free access from future plan reference; lead with the real account action; retire purchase-like selection in favour of inclusion disclosure | Clearer trust and next step | Low visual risk; modest interaction/copy approval needed |
| Four repeated desktop blocks become a long mobile and tablet reading path | Four audience-led editorial rows, compact details closed by default, no fixed prose heights | Faster comparison, stronger product character, less scroll | Medium layout risk; verify long copy, annual prices and zoom |
| Tablet heading retains desktop split at 768px | Stack heading/launch message earlier; responsive row tracks | More balanced first screen | Low; scoped breakpoint adjustment |
| Main differences buried; comparison mixes unlike capabilities and adds unverified claims | Lead with existing differentiators; keep all inclusions reachable; verify disputed comparison wording before restructuring it | Better understanding without invented entitlements | Medium product-content risk if verification is skipped |

## P2

| Current problem | Proposed solution | Expected impact | Risk |
|---|---|---|---|
| Recommendation label is 11px; recommendation and selection compete | 12–13px static textual endorsement for Player, separate from interaction state | Clearer recommendation | Low; no popularity claim added |
| Small feedback changes feel abrupt | Restricted CTA/billing/icon transitions from the motion plan | Crisp interaction feedback | Low with pointer and reduced-motion gating |
| Separate live price regions may announce noisily | Test actual announcements, then consolidate status feedback if needed | Cleaner assistive experience | Low to medium; validate with a screen reader |
| Table scroll is not self-explanatory on phone | Explicit hint and preserved row context, or verified per-plan details | Easier detailed comparison | Low; avoid expanding the main presentation |
| Currency/popularity context lacks evidence | Confirm currency/tax wording and “Most selected” support before publishing revised copy | Stronger commercial trust | Product decision; no guessed promises |

## Recommended Final Pricing Design

1. **Opening:** retain the athletic H2 style, with approved audience-relevant wording. Put the existing free-launch statement immediately beneath it and the actual “Create your account” CTA beside it on desktop, below it on mobile. Explain future pricing in a short separate paragraph.
2. **Reference toolbar:** clearly label the following plans as the structure once billing begins. Align the existing Monthly/Yearly control to this reference, not to the launch-access action. Preserve actual totals, cadence and valid savings.
3. **Four rows:** Free, Member, Player, Club. Align tier/audience, price and decisive capabilities across desktop tracks. Use thin horizontal rules and natural heights; no independent card shells. Player alone carries a restrained static recommendation.
4. **Details:** a native “View inclusions” disclosure on each row preserves all material features. Keep the full comparison only if it adds verified cross-plan clarity. Do not silently rewrite comparison-only entitlements.
5. **Responsive:** at desktop retain approximately 1200–1280px pricing content within the existing 1440px page grid, aligned to its left edge. Do not narrow the entire landing page. Use 24–32px column gaps, 24–28px row padding, about 24px before the row list and 28–32px before optional comparison. At tablet stack the intro earlier; at phone use compact name/price rows, 20–24px vertical padding and the existing roughly 4vw gutters. These are design targets for validation.
6. **Colour/type:** preserve the current navy shell and white/muted text. Green marks the real account action, billing state and modest Player endorsement. Keep existing fonts; use hierarchy and alignment to make the result feel sporting and precise.
7. **Interaction:** prices update immediately; optional indicator/arrow/icon motion stays at 120–180ms. No viewport entrances, moving facts, hover lifts, springs or added motion dependencies. Preserve keyboard and reduced-motion behaviour.
8. **Exact scope:** replace pricing composition and scoped responsive CSS; make approved presentation-copy and disclosure changes only; retain current commercial configuration, signup/auth and checkout behaviour. No changes outside the Pricing surface are needed.

Questions skipped: the user explicitly requested an audit and design direction before implementation. The unresolved product checks are recorded above; this document does not authorize commercial changes or begin the build.

# Pricing Redesign Implementation Result

Implemented 11 October 2026. This is a presentation-only rebuild of Pricing; surrounding landing sections are unchanged.

## Previous and final structure

Previously, four tall columns repeated plan descriptions, features and local-only selection controls. The final structure is four editorial rows: Free, Member, Player and Club. Desktop aligns audience, price/purpose and decisive inclusions across three tracks. Thin horizontal dividers replace independent card shells. Existing fonts, navy background and canonical green remain in use.

Free leads with basic tracking and post-game review; Member with live match following; Player with advanced performance and unlimited history; Club with official squad operations. These are presentation summaries of existing features. Full original descriptions and feature strings remain accessible without rewriting their meaning.

Player alone has a thin green top rule and textual “Recommended” label. Its row is not enlarged and has no heavy green surface or glow. The unsupported popularity strapline is no longer displayed; the source data remains untouched.

## Launch message and CTA

The existing limited-time free-access statement remains verbatim, beside a compact launch explanation and the section's single primary “Create your account” link. The plan toolbar now explicitly says “Plan pricing once billing begins.” This separates current launch access from future paid-plan reference prices without inventing dates, trials, cancellation terms or guarantees.

Removed the local-only plan selection state/buttons because they did not configure signup or purchase. The primary link still goes to `/sign-up`; browser verification reached the existing Create Account screen. Signup/auth logic and checkout behaviour are unchanged.

## Inclusions and comparison

Each plan has a closed native `details`/`summary` disclosure with a plan-specific accessible name. Every original plan feature and description remains inside its disclosure. Desktop previews show only decisive existing features: three for Free, one for Member, three for Player and two for Club. Member has only one distinct additional entitlement, so padding its preview with invented benefits would be misleading.

At 900px and below, previews disappear and complete features remain available through the disclosures. The comparison stays below the rows, closed initially and visually subordinate. Its original strings are retained verbatim. On narrow screens its named, keyboard-focusable scroll region has a compact horizontal-scroll instruction; the plan rows themselves never scroll horizontally.

## Entitlement mismatches retained for review

The audit's unresolved comparison-only claims remain unchanged:

- Player “Squad creation” is in the comparison but not the plan feature list.
- Club “Unlimited club-wide history” and “Advanced + team tracking” are more specific than its plan list.
- The “Match day access” comparison row mixes different capabilities across tiers rather than expressing one consistent entitlement.

No definitive entitlement authority in the inspected web sources resolves these claims. No pricing configuration, feature list, comparison data, entitlement gate, backend or migration was changed. Product confirmation is still needed before rewriting these commercial statements. Currency/tax context is also not newly asserted.

## Responsive behaviour and motion

The intro stacks at 900px. Tablet rows reduce to two tracks with the inclusion control under the value column. At 600px and below, plan identity and price share the first line, billing stays beside the audience, and the short distinction/disclosure span the width. A mobile grid gap found during QA was corrected by spanning the identity across the price and billing rows. Below 360px the layout falls back to one column for longer annual prices.

Motion is limited to a 160ms disclosure-chevron rotation and a two-pixel CTA arrow shift on fine-pointer hover. Row hover uses a very slight surface change without movement. Native disclosure content opens immediately, avoiding fragile height animation. Reduced-motion rules remove the pricing icon transitions and CTA movement; content visibility never depends on animation.

## Accessibility

Plan names remain semantic headings. Recommendation is textual. Native disclosures expose expanded/collapsed state and have distinct accessible names. Controls have at least 44px targets and visible keyboard focus. Billing uses labelled grouped buttons with pressed state and one polite price-status announcement. Prices keep their cadence and plan context. The comparison retains caption, column/row headers and a named keyboard-focusable scroll region. No custom focus trap or new interaction framework was introduced.

## Visual QA

Inspected the rendered section at all five requested sizes using a separate background browser tab, then reset the viewport and closed that tab. The user's tab was preserved.

| Viewport | Observed result |
| --- | --- |
| 1920×1080 | Aligned editorial rows, restrained Player emphasis, early launch CTA; no page overflow. |
| 1366×900 | Three tracks remain readable; no page overflow. |
| 1024×768 | Desktop tracks remain usable with natural short wrapping; no page overflow. |
| 768×1024 | Intro stacks; two-track rows and disclosures remain readable; no page overflow. |
| 390×844 | Compact identity/price rows, full-width early CTA, full-width disclosure controls; no page overflow. |

The final collapsed mobile section measured approximately 1497px high versus the audit's approximately 2702px. Individual collapsed phone rows measured 203–217px. Desktop does not promise less total section height: the gain is scan order, comparison alignment and reduced visual repetition.

Saved evidence in `docs/pricing-redesign-qa/`: `1920.png`, `1366.png`, `1024.png`, `768.png`, `390.png`, `390-rows.png` and `desktop-rows.png`. The first mobile capture predates the spacing correction; `390-rows.png` is the corrected result. Desktop row evidence includes a keyboard focus outline intentionally retained to demonstrate focus visibility.

Verified real Monthly/Yearly interaction, all four disclosures opening by pointer and closing with Enter, the expanded comparison and its narrow-screen scroll instruction, and account-route navigation. Annual prices remained $0, $39.95, $84.95 and $999.95, with paid-plan savings of 33%, 53% and 17%. Monthly prices remain $0, $5, $15 and $99.95. Reduced motion was verified through the scoped CSS guard and focused tests; an operating-system reduced-motion setting and physical screen-reader session were not exercised.

## Validation and scope

- Focused pricing tests: 7/7 passed.
- Full project suite after the final spacing change: 502/502 passed.
- Typecheck: passed.
- Production build: passed.
- `git diff --check`: passed.
- No new dependency, backend change, migration, commercial-data change or routing change.

Existing warnings are separate from this pricing pass: Vite reports the large application chunk and outdated Browserslist data. The landing hero produces a React `fetchPriority` DOM-prop warning. These were not expanded into unrelated changes. Generated build assets were restored after validation; existing unrelated workspace changes were preserved.

## Final assessment

Visual/product score: **85/100**, up from 66/100. AI-slop risk: **2/10**, down from 4/10. The improvement comes from a clear launch/pricing relationship, audience-first rows, working native details, meaningful comparison hierarchy and compact mobile presentation. Remaining limits are the unresolved comparison claims, unconfirmed currency/tax context, and lack of physical assistive-technology testing. No additional landing redesign is included or proposed by this implementation.

# Pricing Card Revision — User Reference

The user rejected the editorial row direction after seeing the implementation and requested a return to side-by-side cards, using their supplied mobile-plan comparison screenshot as a structural reference. This direction supersedes the row recommendation and its visual score above.

Pricing now uses four equal-height desktop cards with KickChasers navy surfaces, restrained borders, aligned plan names/prices, clear feature dividers and native full-inclusion disclosures. Player has a green border and a small rectangular Recommended tab across the top edge. The existing launch explanation, real account CTA, all commercial data and the subordinate comparison remain unchanged. No surrounding landing section was changed.

Cards use two columns at 1100px and below, and one column at 600px and below. Phone cards use natural content height rather than desktop minimum heights. Desktop 1366×900 inspection confirmed four equal 540px cards; tablet 1024×768 confirmed two columns; phone 390×844 confirmed one column and no page overflow. Native mobile disclosure interaction and yearly switching were exercised. Screenshots: `pricing-redesign-qa/cards-desktop.png` and `pricing-redesign-qa/cards-mobile.png`.

All 7 focused pricing tests passed. The full suite and production build were rerun for the card revision; results are recorded in the accompanying completion message. The build output was directed to a temporary folder to preserve tracked generated assets.

## Billing Price Motion and Italic Typography

Added on user request: amounts now use the existing landing display treatment (900 weight, italic). Monthly and yearly visual price frames share a fixed grid footprint, crossfading with a 20% vertical shift over 160ms using the existing pricing ease-out token. CSS transitions reverse from their current position during rapid toggles; no timers, counters or dependencies are used. Reduced motion retains only the fade, and keyboard-focused billing switches update without animation. One current accessible price remains exposed per plan; duplicate visual frames are hidden from assistive technology. Prices, cadence and savings remain unchanged. Browser checks confirmed yearly amounts, computed italic styling, and rapid reversal returning to monthly correctly. Evidence: `pricing-redesign-qa/animated-yearly-prices.png`.

## Plan Selection Login Entry

On explicit user request, every card now has a “Select [plan]” link to the existing `/sign-in?redirect=%2Fdashboard` flow. Player uses the primary green treatment; other plans use outlined controls. These are login entry points only: they do not save a subscription choice, charge, or activate entitlements, because subscription management has not been built. Existing prices and account/signup routes remain unchanged. Focused pricing tests passed (7/7), including four login destinations, and a browser click on Select Player verified the sign-in URL. Card grid stretching keeps the selection controls aligned across differing feature lengths.
