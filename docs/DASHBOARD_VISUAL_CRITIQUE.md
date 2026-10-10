# Dashboard Visual Critique

> Latest feed refinement (10 October 2026): the user subsequently requested artwork-only feed previews and expansion. See the implementation record at the end; this supersedes earlier descriptions of recap headers/footers.

## Executive Summary

**Keep the Dashboard fundamentally unchanged. Overall: 84/100. AI-slop risk: 2/10. No P0 visual issue demonstrated.**

This is a conservative audit of the authenticated `/dashboard`, completed on 10 October 2026. All existing Dashboard card designs are approved and locked. Recommendations concern their external layout, the page header, and the surrounding shell. No implementation, card edits, data changes, query changes, backend changes, or migrations were made.

The three strongest parts are the distinctly KickChasers Quick 6 / Match Focus starting point, the consistent dark canvas and aligned content boundaries, and the sensible progression from personal summaries and operational work to community content.

The three highest-value tidy areas are:

1. Stop neighbouring modules from stretching shorter cards into large empty panels.
2. Arrange the four existing mobile header tiles in two columns, retaining their internal design.
3. Reduce the header-divider-to-content separation from 40px to 24px.

There is no case for a new visual language, new card design, wholesale reordering, wider canvas, or marketing-page composition.

**Method: dual-agent (A: `/root/design_review`; B: `/root/evidence_review`), with parent browser inspection and synthesis.** A formed its independent design judgment before B's evidence was released. Both reviewers inspected supplied rendered evidence; the parent completed all five requested viewport inspections. B attempted the deterministic detector, but it was unavailable. The scores below are qualitative design judgments, not automated measurements or a complete accessibility certification.

The authenticated fresh audit tab initially remained in loading, then completed. This limitation was resolved before the final audit. Initial full-page captures also omitted lazy-loaded recap media; a final bounded confirmation pass scrolled Community into view and verified all six images loaded. Community conclusions use that final evidence, not the incomplete captures. Full-page captures can reposition fixed navigation; apparent duplicated sidebar images in stitched captures were excluded as capture artifacts.

## Overall Score

| Dimension | Score /100 | Assessment |
|---|---:|---|
| Overall hierarchy | 88 | Summary and match information lead; operational and social areas follow logically. |
| Grid/layout | 82 | Strong shared edges; external equal-height stretching produces empty panels. |
| Spacing | 82 | Regular 24px rhythm works; header separation and mobile packing can tighten. |
| Page-level typography | 82 | Athletic identity is clear; small, muted page labels are less readable. |
| Navigation/shell relationship | 86 | Useful labelled sidebar and compact mobile chrome; collapse-button focus is faint. |
| Responsive design | 78 | All five sizes render; mobile header and tablet Community density are the main opportunities. |
| Visual consistency | 85 | Coherent authenticated system; public and portal accent tokens currently differ. |
| Scanability | 83 | Clear modules; long content and stretched panels slow the lower-page scan. |
| Product identity | 93 | Football-specific content, imagery, naming, and athletic type feel authored. |
| Overall polish | 81 | Solid foundation with a small number of external refinements. |
| **Overall** | **84** | **Arithmetic mean; good, with a limited tidy-up scope.** |

The approved card visual design is not being scored as something to replace.

Supplementary heuristic review is deliberately limited to what this visual audit exercised:

| Nielsen heuristic | Score /4 | Evidence / limit |
|---|---:|---|
| Visibility of system status | 3 | Loading and explicit resolved/empty status are visible; state composition can improve. |
| Match with the real world | 4 | Football language, season context, squads, and match information are specific and recognisable. |
| User control and freedom | n/a | No consequential workflow, cancellation, or undo was exercised. |
| Consistency and standards | 3 | Coherent portal system; page/shell accent divergence is documented. |
| Error prevention | n/a | No form submission or destructive action was exercised. |
| Recognition rather than recall | 3 | Labelled navigation and clear module destinations. |
| Flexibility and efficiency | 2 | Direct destinations exist; shortcuts and complete task efficiency were not tested. |
| Aesthetic and minimalist design | 3 | Relevant modules; external stretching and mobile header packing are the main distractions. |
| Error recovery | n/a | Error variants were not triggered; source alone cannot verify recovery. |
| Help and documentation | n/a | A help journey was outside this Dashboard visual review. |
| **Assessed total** | **18/24** | **75%; partial heuristic review, separate from the 84/100 visual score.** |

## AI-Slop Risk

**2/10**, where 1 means intentional/custom product UI and 10 means generic AI dashboard/template.

Cards are appropriate for this authenticated operating interface. Football identity, match information, custom stat icons, squad imagery, and Quick 6 prevent it from feeling interchangeable with a generic admin template. Page-level decoration is restrained. No parallax, scroll reveals, floating cards, or animated page background was observed. The card-specific gradients and colours are intentional and outside the critique scope.

The residual template-like impression comes mainly from empty stretched panel areas, not the existence or styling of cards. Do not remove surfaces to chase a lower score.

## First Impression

The starting point is obvious on desktop: greeting and season context, then Quick 6 and Match Focus, with Action Inbox on the right. The page feels organised rather than chaotic. It has substantial content, but module boundaries and the dark canvas contain it well. Green does not cover every page-level element.

| First-five-seconds quality | Score /10 |
|---|---:|
| Hierarchy | 8.8 |
| Scanability | 8.3 |
| Balance | 8.2 |
| Polish | 8.1 |
| Product identity | 9.3 |

Desktop density is appropriate. At 390px, the first impression is more header-heavy: useful Quick 6 content starts around 533px down the document. At tablet width, the stack is understandable but long.

There is no evidence that an important module is buried behind less important social content. Keep the order: Quick 6 → Match Focus → Action Inbox → Recent Games → My Squads → Profile Snapshot → Live Around Me → Leaderboard Snapshot → Community Activity → Portal Activity. Wide-screen adjacency naturally changes the scan into rows without changing that logical progression.

For a returning player, the summary and match destination are recognisable. For a keyboard user, the faint sidebar collapse focus deserves attention. For a distracted mobile user, the four-row header is the clearest avoidable delay. The many sidebar destinations are expected navigation, not an unstructured decision form requiring fewer options.

## Page Hierarchy

The welcome/name area provides identity without a large redundant Dashboard headline. The existing active navigation communicates location. Do not add a second visible title solely to make the page resemble a public landing page.

The season control belongs with the existing header summary. At desktop widths, the horizontal header is compact and balanced. At tablet widths it becomes a greeting plus a two-by-two summary/control grid. Mobile alone expands those four tiles into four rows.

The divider is sufficient separation. Its lower clearance combines 16px header bottom padding with the root's 24px gap: **40px before Quick 6**. Remove the redundant 16px lower padding to produce **24px**, retaining the divider and its existing space above. Do not shrink the first card or its internal header to achieve this.

Quick 6 remains the right primary summary. Match Focus has the appropriate prominence below it. The right-hand Action Inbox is visible and useful at wide sizes; its current three resolved entries do not justify changing its data, filters, status treatment, or order. A populated pending state was not tested. The first desktop grid's alignment can remain as it is.

## Card Grid

Keep the regular **24px horizontal and vertical gaps**, the **16px gap between Quick 6 and Match Focus**, and the **360px desktop inbox column**. These values form a readable system.

The strongest external issue is default grid stretching:

- At 1920px, Recent Games, My Squads, and Profile Snapshot are all approximately **1392px high**. Six squad cards determine that row's height. Recent Games and Profile Snapshot have substantial blank painted tails beneath their content.
- At 1366px, that row is approximately **1444px high**, with the same imbalance.
- The empty Live Around Me module is approximately **590px high** at 1920px and **610px** at 1366px because it stretches alongside the populated leaderboard.

Use start alignment on these **two external parent grids** so each card keeps its natural height. Preserve shared top edges and existing column definitions. No PortalCard implementation or internal card spacing needs changing.

**Important limit:** start alignment removes empty painted card area; it does not shorten a grid row below its tallest child. It will expose page background under shorter cards. Do not promise a shorter overall page, add masonry, relocate modules into the gaps, or truncate squads to conceal the imbalance.

At 1366px, the lower three columns measure approximately **444 / 291 / 280px**. This is the tightest desktop arrangement: some names wrap or truncate, but modules remain usable. Keep these proportions for the first tidy pass. Do not force this three-column row onto 1024px.

## Spacing / Rhythm

| Location | Current evidence | Recommendation |
|---|---|---|
| Page horizontal padding | 12px below 640px; 24px from 640px | Keep. Mobile cards use available width effectively. |
| Page vertical padding | 16px mobile; 24px small/tablet; 32px desktop | Keep. No material duplicate loaded-page padding issue. |
| Header divider → Quick 6 | 40px combined | Reduce to 24px by removing only redundant header bottom padding. |
| Main module groups | 24px | Keep consistently across sizes. |
| Quick 6 → Match Focus | 16px parent-grid gap | Keep. Do not interpret internal card whitespace as a page gap. |
| Header tile grid | 10px | Keep; change only mobile column count. |
| Community post grid | 16px | Keep. |
| End of page | 16px mobile / 24px tablet / 32px desktop shell padding | Keep; no large empty footer section found. |

Do not globally reduce every gap to 16px. That would merge distinct modules and save little compared with the content length. The mobile header can become shorter without compressing the actual content cards. Additional separation before Community is unnecessary: its heading, wrapper, and existing 24px boundary already establish a new group.

## Page Width

Keep the **1320px maximum width**, centered within the area remaining beside the sidebar. At 1920px, the side margins provide useful containment; card proportions do not warrant a wider or narrower cap. At 1366px, the page uses the available width with 24px side padding.

Actual measured content widths, including the browser's 15px vertical scrollbar allowance:

| Viewport | Content width | Shell |
|---|---:|---|
| 1920×1080 | 1320px | 240px permanent sidebar; centered content |
| 1366×900 | 1063px | 240px permanent sidebar |
| 1024×768 | 721px | 240px permanent sidebar |
| 768×1024 | 705px | Sidebar off canvas; mobile navigation bar |
| 390×844 | 351px | Sidebar off canvas; 12px page padding |

The narrowest desktop state has almost the same usable width as the tablet state. Stacking the main module grids at 1024px is therefore sensible. Do not lower their breakpoints just to fill horizontal space.

## Typography Outside Cards

Keep the bold italic player name, the modest greeting, and the current overall scale. They connect the authenticated app to the athletic brand without importing large marketing headings.

The welcome eyebrow is **11px, #64748B**, with wide tracking. A modest contrast increase toward the existing lighter slate text is worthwhile optional polish. The season label is **9px, #475569** and particularly subdued; if the page-level selector is included in a later accessibility pass, consider an 11px label with stronger contrast. Preserve the summary tiles' internal typography and hierarchy.

The page greeting is currently a paragraph, while the sidebar's “Web Portal” is the H1. Optional semantic polish can make the existing visible welcome/name area the page heading without adding visible copy or changing its appearance. This is a structural accessibility observation, not a request to redesign headings inside cards.

No blanket uppercase removal, font replacement, or card-heading typography changes are recommended. A rendered comparison of the public Landing and How It Works pages was not performed in this audit; brand comparison uses their documented cleanup and the existing project principles.

## Colour / Background

Keep the loaded page's flat dark **#070F1E** canvas and the sidebar's **#081225** surface. They support scanning and make the approved cards legible. No extra page wash, gradient, glow, or landing-style lighting is needed.

The requested canonical green is **#39FF14**, with **#50FF2F** hover. Current portal navigation and header stat accents use **#39FF88**. This is not random drift: the existing portal blueprint and older design-principles document explicitly specify the mint green. The public-page cleanup documents use the newer canonical green. The user's current brief takes precedence for this audit.

Optional consistency polish: align only the active navigation indicator/icon and applicable page-level hover/focus accents with the requested canonical pair. Keep all approved card colours, status colours, header statistic tile treatments, and post artwork. Do not run a global colour replacement or make every page control neon. Readability/focus contrast matters more than matching a hex value alone.

## Section Wrappers

**No unnecessary outer panel around the major card grids was found.** The parent grids themselves are structural and unpainted.

PortalCard wrappers around Recent Games, My Squads, Profile Snapshot, Live Around Me, Leaderboard, Community, and Portal Activity have a function: they establish the module heading and contain related content/actions. Community's wrapper is meaningful section grouping. Nested game, squad, and post cards are part of the approved authenticated system.

Recommend **zero wrapper removals**. The loading route's extra full-height background is a separate page-state issue, discussed below; it is not a reason to flatten loaded cards.

## Community Activity

Community is correctly placed after personal and operational modules. Keep all **six posts**, their order, their imagery, and PostActivityCard's compact presentation. Do not shrink images, edit post typography, change controls, or limit the query to reduce page length.

With all six lazy-loaded recap images actually loaded, the section measures approximately:

| Viewport | Columns | Section height |
|---|---:|---:|
| 1920px | 2 | 1881px |
| 1366px | 2 | 1881px |
| 1024px | 2 | 1864px |
| 768px | 1 | 3588px |
| 390px | 1 | 3542px |

This is a substantial secondary section, not a compact teaser. On desktop it does not interfere with the starting hierarchy because it is below the core Dashboard. On mobile it is content-driven scrolling, which should not be “fixed” by changing locked cards.

**Optional tablet polish:** switch only the surrounding post grid to two columns from 768px instead of 1024px. At 768px each post would be about 324px wide, close to the approximately 332px posts actually inspected at 1024px. That is a concrete basis for an earlier breakpoint, rather than an arbitrary desire for density. Keep 390px single-column, the 16px gap, and all six posts. Verify author/date wrapping and action accessibility before adopting it. This is P2, not necessary for the core cleanup.

No three-column desktop grid or new pagination/load-more behaviour is recommended. Heading alignment and the loaded section boundary work. Community loading/empty/error variants were inspected in source, not forced in the browser.

## Responsive Design

**All five requested viewports were inspected in the rendered authenticated audit tab.** Browser inner dimensions were verified. Full-page composition, header, stacking, and Community media were reviewed; final Community measurements include loaded images.

| Viewport | Observed behaviour | Verdict |
|---|---|---|
| 1920×1080 | Contained 1320px canvas; summary/match plus inbox; three-column personal modules; two-column Community | Strong wide-screen layout. Tidy external stretching. |
| 1366×900 | 1063px content; same main desktop structure; lower side columns about 291/280px | Naturally dense; narrower names wrap but no page overflow. Preserve breakpoints initially. |
| 1024×768 | Permanent sidebar; 721px content; main modules stack; Community stays two columns | Sensible protection against cramped main cards. Do not add an inbox side column here. |
| 768×1024 | Mobile shell; 705px content; two-by-two header tiles; main modules and Community stack | Clear sequence. Optional earlier two-column Community grid. |
| 390×844 | 351px content; four-row header; two-column Quick 6 summary; main modules and Community stack | No observed horizontal page overflow; compact header layout is the main tidy. |

Measured document scroll widths were 1905, 1351, 1009, 753, and 375px respectively, matching available document width after the 15px scrollbar. No positive horizontal page overflow was observed in these loaded states. This does not certify every future username, translation, or data state.

The final loaded page is long: about 5181px at wide desktop, 5254px at laptop, 7733px at 1024px, 10186px at tablet, and 11053px at mobile. Most length is genuine stacked card and recap content. Do not attribute that length to 24px group gaps or promise that start alignment eliminates it.

## Mobile

At 390px, the shell is compact, the greeting is recognisable, and cards use nearly all available width. The navigation button is 44×44px. The sticky navigation bar remains useful while scrolling. There is no need for a new top navigation design or mobile-only Dashboard title.

The existing four header tiles occupy four rows before Quick 6 begins at **y≈533px**. Arrange these existing containers in a **2×2 external grid** below 640px, retaining the 10px gap, appearance, stat text, and season behaviour. This should reclaim roughly two tile rows, approximately 150px for the current content; the exact result needs implementation-time confirmation. Combined with the 16px header-gap reduction, useful summary content would arrive materially sooner.

Keep mobile page padding at 12px, main group gaps at 24px, and Community single-column. Do not compress Quick 6, Match Focus, squads, or post internals. Action Inbox follows the primary summary/match area in the current logical order. Moving it above those cards is not justified by the inspected resolved-items state.

Season arrows are 28×28px and were disabled in this account's only available season. Enabled hover/focus behaviour could not be exercised. If these page-level controls are addressed later, aim for 44px hit areas while retaining their glyphs and logic; this is outside the smallest grid/spacing-only cleanup.

## Navigation / Shell

Keep the 240px expanded sidebar, existing collapse option, labelled destinations, active rail, account area, and mobile drawer model. There is no need to add a desktop topbar or duplicate account controls.

The shell's 24px desktop/tablet horizontal padding and centered max-width align the greeting, first grid, lower modules, and Community wrapper. No unexplained 4–12px first-column offset was established. The wider left offset at 1920px is deliberate centering within the remaining content area.

Keyboard Tab was used to focus the sidebar collapse button. Its outline is transparent and its visible custom ring is **2px white at 10% opacity**. The ring is present but faint against the navy surface. Optional accessibility polish should strengthen that existing focus indicator to an unmistakable contrasting ring. Do not remove focus styling for visual neatness. This was a targeted visual keyboard check, not a complete keyboard or screen-reader audit.

## Alignment

Shared left edges are consistent between greeting, divider, Quick 6, lower grids, and Community. Main rows have shared top edges. The inbox aligns with the summary area's start. The mobile bar and content follow the same outer bounds.

The issue is unequal **content height within externally stretched row items**, rather than a misaligned top edge. Use parent start alignment and retain column/gap definitions. Card-internal indentation is intentional and should not be “corrected” to the outer heading edge.

No defensible series of 4–12px alignment fixes was found. Do not manufacture one.

## Motion

| Effect | Classification | Recommendation |
|---|---|---|
| Ordinary hover/active/focus feedback | KEEP | Supports navigation and interaction; retain restrained timing. |
| Sidebar/content layout transitions | KEEP | Source uses approximately 300ms shell and 200ms navigation transitions. No marketing-style replacement needed. |
| Community loading pulse | KEEP | Source has a reduced-motion opt-out. This specific skeleton was not observed active. |
| Shell transition under reduced-motion preference | REDUCE, optional | Add an appropriate preference override if shell motion is later touched. OS preference was not tested. |
| Decorative Dashboard motion | REMOVE: none identified | No observed scroll reveals, parallax, floating cards, or animated page canvas to remove. |

No new animation is recommended. Breakpoint transition frames and full-page capture artifacts are not evidence of permanently mispositioned navigation.

## Empty / Loading / Error

**Rendered:** Dashboard loading and the empty Live Around Me module. The Dashboard's loading route adds a nested `main` with `min-h-screen`, 24px padding, and the public-style `app-bg` gradient inside the portal shell. It creates a visibly lighter inset full-height rectangle and unnecessary vertical extent. Optional page-state polish should inherit the shell canvas and normal content alignment, retaining the loading message and existing logic.

The empty Live module's message is compact; its excessive desktop footprint comes from external row stretching. Fix the grid alignment, not its empty-card styling.

**Source inspected only:** global Dashboard error; Action Inbox empty state; Community skeleton, empty state, error explanation, and retry. The Community error identifies the problem and preserves context that other Dashboard information remains available. The empty state has an explanation and destination. No forced network errors, data mutations, artificial empty datasets, or retries were used. Their full visual parity and focus behaviour cannot be certified from this run.

A long initial load was observed in new tabs, but this visual audit does not establish its cause or classify it as a backend defect. Do not change loading/query behaviour as part of the tidy-up.

## Keep Exactly As Is

- All approved card internals: layout, colours, surfaces, borders, radius, typography, icons, controls, spacing, information hierarchy, and content arrangement.
- Quick 6 and Match Focus prominence, current module order, and the desktop inbox relationship.
- 1320px maximum content width and the loaded dark page canvas.
- 24px module gaps, 16px summary-to-match and Community-grid gaps, and current outer page padding.
- Functional PortalCard grouping wrappers, including Community.
- Six Community posts, existing imagery, post controls, and single-column phone presentation.
- Labelled sidebar navigation, account access, mobile shell, and restrained interaction feedback.

## Tidy

The recommended first pass is three changes in Dashboard composition only: start-align the two affected lower grids, use two mobile header columns, and remove the redundant 16px header bottom padding. These changes preserve the incumbent character and require no card redesign.

## Optional Polish

Consider the tablet Community breakpoint, clearer page-level labels, stronger sidebar-collapse focus, selective canonical navigation green, and loading-canvas consistency. These are separate choices, not prerequisites for a successful conservative cleanup. Reduced-motion shell handling and semantic heading markup can accompany a dedicated shell/accessibility pass.

## Do Not Touch

Do not alter PortalCard, Quick6SummaryCard, MatchScoreCard, GameLogCard, PostActivityCard, or any approved card's internal markup/styles. Do not flatten surfaces, remove borders, replace gradients, recolour card accents, change radii, or reduce card-specific padding.

Do not change data, queries, post counts, squad counts, notifications, operational rules, season logic, navigation destinations, backend, migrations, modules, or functionality. Do not add masonry, marketing whitespace, large editorial headings, decorative wrappers, new animation, or landing-page screenshot staging.

Do not globally replace `#39FF88`. The older authenticated design explicitly uses it; only a narrowly scoped page/shell accent change is optional under this brief.

## P0

**None demonstrated.** No inspected visual issue prevented task access or made the Dashboard unusable. Unexercised error and pending states are not claimed to be verified.

## P1

P1 here follows the brief's meaning: high-value, low-risk tidy-up, not a release-blocking defect.

| ID / location | Current issue | Recommended adjustment | Why | Risk | Expected impact |
|---|---|---|---|---|---|
| P1-1: Recent Games / My Squads / Profile grid; Live / Leaderboard grid | Shorter modules stretch to the tallest neighbour, leaving large empty panel tails | Start-align children on these two parent grids; keep natural card heights and shared top edges | Makes the painted card boundaries reflect their content | Low; exposed background remains below short items, and row height still follows tallest item | Noticeably cleaner desktop balance; no promised scroll reduction |
| P1-2: mobile header tile grid | Four rows delay Quick 6 to about y533 | Two columns below 640px; keep 10px gap and every tile's internals | Reaches useful content sooner without removing information | Low; verify season container fit and long names at 390px | Approximately two header rows reclaimed for this account |
| P1-3: welcome/header divider → first grid | Combined lower clearance is 40px | Remove redundant 16px header bottom padding, retaining 24px root gap | Aligns header rhythm with the rest of the page | Low; retain divider's upper separation | Subtle, consistent 16px tightening at each size |

## P2

| ID / location | Current issue | Recommended adjustment | Why | Risk | Expected impact |
|---|---|---|---|---|---|
| P2-1: Community outer post grid at 768–1023px | Six full-width media posts create about 3588px of section height at 768px | Optional two columns from 768px; preserve mobile single-column, 16px gap, six posts, and post internals | Proposed ~324px post width closely matches inspected ~332px at 1024px | Low–medium; confirm author/date wrapping and action readability | Substantially shorter tablet Community section |
| P2-2: page welcome and season labels | 11px muted welcome; 9px especially muted season label | Increase page-label contrast modestly; consider 11px season label only in a page-control accessibility pass | Improves secondary context readability | Low; preserve tile stat hierarchy and disabled distinctions | Small legibility gain |
| P2-3: sidebar collapse focus | Existing 2px white/10 ring is faint | Strengthen the existing focus ring, preserving a visible keyboard indicator | Makes focus easier to locate | Low; verify contrast against the actual surrounding navy | Better keyboard usability |
| P2-4: active navigation accent | Portal mint differs from requested canonical green | Optional active rail/icon #39FF14 and applicable hover #50FF2F; no card recolouring | Connects shell detail to current public brand | Low–medium; older portal documents explicitly use mint | Small brand consistency gain |
| P2-5: Dashboard loading canvas | Inset gradient, duplicate padding and full-height minimum differ from loaded page | Inherit portal background and normal page alignment; avoid extra full-viewport height | Maintains composition through loading | Low; loading logic and message remain intact | More deliberate state presentation |
| P2-6: page-level accessibility | Greeting lacks page-heading semantics; season arrows are 28px; shell reduced-motion override not evident | Preserve visible heading appearance while improving semantics; separately consider 44px season hit areas and reduced-motion shell transitions | Improves access without new visual hierarchy | Low–medium; enabled season and OS reduced-motion states need verification | Accessibility polish; outside smallest cleanup |

## Recommended Cleanup Scope

**Recommended implementation: one composition file, three small changes.** In `src/routes/portal/DashboardPage.tsx`:

1. Add start alignment to the existing Recent Games / My Squads / Profile parent grid and Live Around Me / Leaderboard parent grid.
2. Give the existing header-tile parent grid two columns on mobile, preserving its current desktop column definition, tile internals, and 10px gap.
3. Remove the header wrapper's redundant 16px bottom padding so the divider-to-content gap becomes 24px.

Keep all other grid breakpoints, max-width, outer padding, main gaps, module order, card components, and data behaviour. This is a visual refinement; the Dashboard should remain fundamentally unchanged.

If tablet feed length remains a concern after that pass, separately change only the post-grid breakpoint in `DashboardCommunityActivity.tsx` from 1024px to 768px. That file contains the section composition, but the permitted change is solely the grid surrounding PostActivityCard; do not edit the post card, PortalCard, images, or query. Treat this as optional scope, not part of the one-file baseline.

Other P2 items would touch page-header or shell presentation and should remain separate from the minimal cleanup. Do not edit shared components merely to implement the three baseline changes. Implementation-time verification should revisit the same five viewports, wait for actual recap images, check header tile fit, and confirm external alignment without card-style changes.

Audit run notes: launcher context attempt failed with permission denied; existing project context was read directly. No root PRODUCT.md, DESIGN.md, AGENTS.md, or critique ignore list was found. The existing design-principles, portal blueprint, and How It Works cleanup documents supplied brand context. Detector attempt failed with exit 127: engine 0.1.11 was not installed and its cache directory could not be created. No deterministic counts/rules or browser overlay are claimed. Read-only browser evaluation did not support mutable script injection; no overlay/live server was started. Critique-storage slug/snapshot tooling was unavailable with the engine, so this requested Markdown file is the persisted report. Reviewer tabs were temporary; the parent audit tab was closed and its viewport override reset. The user's original tab was retained. Temporary screenshot evidence was used for independent review and removed after synthesis. No application build/tests were run because application source was unchanged.

Questions skipped: the user requested an audit artifact only and explicitly deferred implementation; the scope and constraints already determine the next-step recommendation.


# Tidy-Up Implementation Result

Implemented 10 October 2026. This is a conservative composition pass. The Dashboard remains fundamentally unchanged. Updated visual assessment: **88/100**; AI-slop risk **2/10**; **no P0 issue identified**. These are qualitative design assessments of the inspected account and viewports.

## P1 implemented

- Removed the redundant 16px header-bottom padding. Measured divider-to-Quick-6 clearance is now 24px at every requested viewport, down from 40px.
- Added `items-start` only to the existing Games / Squads / Profile and Live / Leaderboard parent grids. Cards retain natural heights, existing widths and module order. Rows still follow their tallest item; exposed page background below shorter cards is intentional and does not promise shorter desktop scrolling.
- Made the existing four header tiles a 2×2 grid on mobile. Their own styling, controls, contents and padding are unchanged. At 390px, each tile is approximately 170.5px wide and 69.8px tall. Quick 6 starts at y364.6 rather than approximately y532.7: roughly **168px sooner**.

## P2 implemented and deliberately skipped

- Community Activity uses two columns from 768px, for both the loaded-post grid and the grid around the existing loading skeletons. At 768px each post is 323.5px wide; author/date wrapping, media and actions remain readable. All six actual recap images were loaded for QA. The section measures 1862.1px rather than approximately 3588px in the original audit. Mobile remains one column; no PostActivityCard implementation was changed.
- Improved only the page-level “Welcome Back” label from slate-500 to slate-400. Its size, weight, tracking and hierarchy stay unchanged. Season-tile typography was deliberately left alone under the locked-tile constraint.
- Strengthened the existing sidebar collapse/expand focus ring from white/10 to white/60. Keyboard Tab visibly focused the collapse control; its settled computed ring was 2px with 60% white. No new motion or control redesign.
- Removed the loading branch's nested full-height gradient canvas and duplicate padding; it now presents the same loading message on the existing portal canvas. Loading logic, request timing and error logic are unchanged. The initial loading state was observed visually, but no separate loading screenshot is claimed.
- Skipped navigation recolouring: the current active rail/icon already reads clearly. No additional green was needed.
- Deferred broader semantics, season hit-area changes and reduced-motion shell refinements; they exceed this small composition pass. No additional wrapper removal was necessary.

## Files changed by this pass

- `src/routes/portal/DashboardPage.tsx`: external composition, one page label and loading presentation.
- `src/components/dashboard/DashboardCommunityActivity.tsx`: only two external grid breakpoint classes.
- `src/components/layout/SidebarNavigation.tsx`: only focus-ring opacity on the existing collapse/expand button.
- `tests/dashboard-community-activity-contracts.test.ts`: updated Community breakpoint contract and checks for module order, external alignment, mobile tile layout, retained max-width and outer padding.
- `docs/DASHBOARD_VISUAL_CRITIQUE.md`: this appended implementation record; original critique retained.
- `docs/dashboard-tidy-qa/`: rendered captures, measurements, task-specific patch and scope proof.

The working tree already contained substantial unrelated edits. Production build also regenerated existing build output and TypeScript build metadata; these generated files are not an additional design change. Existing user changes were not reset or overwritten.

## Responsive and visual QA

Authenticated rendered Dashboard inspected at all five requested sizes, including loaded Community media and the lower page. The 1320px maximum width, existing outer padding and regular 24px section gaps remain unchanged. No new clipping or horizontal overflow was observed. Existing card typography and responsive internal arrangements remain intact.

| Viewport | Divider → Quick 6 | Quick 6 document y | Community columns | Community height | Horizontal overflow |
|---|---:|---:|---:|---:|---:|
| 1920×1080 | 24px | 142.8px | 2 | 1881.0px | 0px |
| 1366×900 | 24px | 142.8px | 2 | 1881.0px | 0px |
| 1024×768 | 24px | 294.6px | 2 | 1864.1px | 0px |
| 768×1024 | 24px | 372.6px | 2 | 1862.1px | 0px |
| 390×844 | 24px | 364.6px | 1 | 3564.0px | 0px |

- **1920×1080:** natural Games / Squads / Profile heights approximately 721 / 1392 / 684px. Live / Leaderboard approximately 188 / 590px. Shared row tops retained; no arbitrary fixed height added.
- **1366×900:** natural Games / Squads / Profile heights approximately 721 / 1444 / 891px. Live / Leaderboard approximately 188 / 610px. Existing column proportions remain comfortable.
- **1024×768:** existing stacked operational modules remain; Community keeps its established two-column treatment. No forced compression of the main card grids.
- **768×1024:** existing stacked module order remains intentional. Two-column Community reduces feed length substantially while preserving six posts and readable actions.
- **390×844:** balanced 2×2 header, all four tiles visible, useful content approximately 168px sooner. All main cards retain their existing single-column arrangement and Community retains one column.

Evidence: [mobile header](dashboard-tidy-qa/mobile-header.jpg), [tablet Community](dashboard-tidy-qa/768-community.jpg), [keyboard focus](dashboard-tidy-qa/desktop-focus.jpg), [measurements](dashboard-tidy-qa/measurements.json). Full-page captures are named `1920-full.jpg`, `1366-full.jpg`, `1024-full.jpg`, `768-full.jpg` and `390-full.jpg`. Stitched full-page captures relocate fixed shell elements; those stitching artifacts were excluded from layout findings and checked against normal viewport captures.

## Locked-card and behaviour proof

A SHA-256 comparison against a snapshot taken immediately before this implementation found exactly the four allowed source/test files above changed; every other snapshotted source, test, configuration and backend file was byte-identical. Card-component hashes and unchanged-file count are recorded in [scope-proof.json](dashboard-tidy-qa/scope-proof.json). The comparison uses the task-start working tree, preserving earlier user work, rather than incorrectly attributing the whole Git diff to this pass.

The [task-specific patch](dashboard-tidy-qa/implementation.patch) shows that inline card contents in DashboardPage are unchanged: only parent layout classes, the welcome label and loading presentation differ. Community's section component differs only in its two grid classes. Quick 6, Match Focus, Action Inbox, Games, Squads, Profile, Live, Leaderboard and post card internals/styles were untouched. Module order, queries, mutations, data, loading conditions, caching, routes, permissions, backend and migrations are unchanged by this pass.

## Validation

- Focused Dashboard tests: **52/52 passed**.
- Full project suite: **467/467 passed**.
- Typecheck: **passed**.
- Production build: **passed** (Vite 5.4.19). Existing advisory warnings remain for stale Browserslist data and a bundle chunk over 500kB; no dependency or bundling work was added to this tidy-up.
- `git diff --check`: **passed**.
- Impeccable's optional deterministic detector remained unavailable: its engine was not installed and cache creation failed in the earlier audit attempt. No detector-derived score or rule count is claimed; browser review, scope comparison and project checks supplied validation.

## Remaining scope

No further visual change is necessary for this pass. A separate accessibility review could consider page-control semantics, season-control hit areas and shell reduced-motion preferences. Preserve the approved cards, current module order, container width, outer padding, navigation treatment and restrained motion. Do not begin a Dashboard redesign.

# Annotation Follow-Up — 10 October 2026

The subsequent browser annotations explicitly revise the earlier locked-card brief for three targeted changes:

- Games / Squads / Profile now share equal panel heights on desktop. My Squads previews the first three existing squads, with “See more squads” opening the existing Teams workspace. Other squads remain available; no data is removed. Existing widths and responsive stacking remain intact.
- Community Activity now presents all six existing recap artworks in a horizontal, manually controlled carousel, without its former enclosing panel. Clicking a preview opens a larger, focused native dialog with the existing full PostActivityCard and a comments section. Controls support keyboard focus, Escape, close button, backdrop dismissal, focus restoration, scroll containment and reduced-motion preferences. Existing feed selection remains unchanged.
- Quick 6 adds a restrained green glow for a positive difference and red for a negative difference against the labelled reference. Equal, rounded-equal and unavailable comparisons stay neutral. The existing delta arrows and values remain, so colour is supplementary. No numbers are fabricated to demonstrate the effect.

Comments are read from the existing `post_comments` contract verified against the companion mobile app's `lib/feed-repository.ts`. Author names come from `profiles_directory`; either-direction blocks and viewer-reported comments are filtered. Queries run only when a recap opens and are cancelled when it closes. Loading, empty and retry states are included. This adds frontend comment reading only: no comment writing, backend change or migration.

Changed application files: `DashboardPage.tsx`, `DashboardCommunityActivity.tsx`, `Quick6SummaryCard.tsx`, `src/index.css`, new `src/lib/post-comments.ts`, and new `src/lib/canonical/quick6-comparison.ts`. Tests updated in `dashboard-community-activity-contracts.test.ts`; numeric comparison cases added in `dashboard-quick6-comparison.test.ts`. Shared PostActivityCard, PortalCard, MatchScoreCard and GameLogCard implementations remain untouched by this follow-up.

Rendered review covered 1920×1080, 1366×900, 1024×768, 768×1024 and 390×844, with no horizontal page overflow. The three overview panels measured equal heights at desktop (approximately 761px at 1920 and 891px at 1366). Tablet Community now occupies approximately 476px. Mobile expansion shows the larger artwork and comments underneath, while desktop shows comments beside it. Keyboard dismissal restores focus to the originating recap. Navigation, max-width, outer padding and module order remain unchanged.

Evidence is in `docs/dashboard-annotation-qa/`. All six inspected recaps currently have zero comments; actual loading and empty comment responses were verified, but a populated live comment thread and error response were not available for visual inspection. Current Quick 6 scopes also compare equal for this account, so the live neutral state was verified; positive/negative/rounded-equal/unavailable calculations are covered by tests.

Validation: **471/471 tests passed**, typecheck passed, production build passed, `git diff --check` passed. Existing build advisory warnings remain for stale Browserslist data and the large bundle chunk. Optional Impeccable detector remains unavailable as documented in the original audit. Existing unrelated working-tree changes were preserved.

# Feed Presentation Follow-Up — 10 October 2026

Implemented the two subsequent browser annotations:

- Renamed Community Activity to **The Feed**. Previews contain only the existing artwork, with no author or comment captions. Removed the visible scrollbar while retaining touch scrolling, snap alignment and previous/next controls.
- Added a restrained visibility-based scale, lift and brightness transition, plus a small hover lift. Reduced-motion preferences disable these effects and use instant arrow scrolling. Nothing auto-advances.
- Expanded recaps now display the image with a soft shadow, without the former author header, social footer or enclosing card surface. Comments sit beside the image on desktop and below it on mobile. Like/unlike sits beside the Comments heading.
- Like state and count read the existing `post_likes` / `posts` contract. The explicitly requested like action inserts or deletes only the current viewer's relation to that post, using the same contract as the mobile app. Loading, error and retry handling prevent an assumed or fabricated liked state. No backend or schema changes were made. Shared PostActivityCard remains unchanged.

Rendered checks covered 1920×1080, 1366×900, 1024×768, 768×1024 and 390×844. Artwork remained contained and readable. No horizontal page overflow was observed. Desktop and mobile expansion were inspected; native Escape dismissal restored focus. Arrow scrolling changed preview visibility and depth as intended. The live like read completed and enabled its control; live like mutations were not exercised to avoid altering the account's social activity during QA. Available recaps still have empty comment threads.

Evidence: `docs/dashboard-feed-polish-qa/feed-desktop.png`, `feed-mobile.png`, `expanded-desktop.png`, and `expanded-mobile.png`.

Validation: **472/472 tests passed**, typecheck and production build passed, and `git diff --check` passed. Existing large-bundle build advisory remains. This follow-up changes the feed component, its small CSS rules, adds `src/lib/post-likes.ts`, and updates the contract test and this record. Other Dashboard cards retain their approved presentation.

# Feed Discovery Follow-Up — 10 October 2026

The user requested all eligible posts in The Feed, with a Follow button for authors the viewer does not follow. The Dashboard now reads `posts` under its existing RLS instead of the `feed` view, whose SQL restricts results to the viewer and followed authors. Public posts from other authors are eligible; follower-only visibility, hidden rows, either-direction blocks and viewer reports remain enforced. Author metadata is hydrated in one batch from `profiles_directory`.

The former six-post total cap is replaced by 20-post cursor pages, ordered by creation time and ID. **Load more posts** appends and deduplicates older results, retaining the current carousel position. The cursor advances using raw rows even if moderation removes all visible results in a page. Paging has its own pending/error/retry state. Existing focus refresh behavior remains.

A compact Follow control appears on previews from unfollowed authors, excluding the viewer's own posts. It reuses `setProfileFollowing`, prevents repeated clicks while pending, updates all loaded posts by that author after success, announces success and returns focus to the artwork. Failure retains the control with retry guidance. Artwork expansion, comments, likes, the scrollbar-free carousel, motion preferences and other Dashboard modules are retained. Text-only posts remain eligible; expansion displays their full body.

Live review confirmed public posts from multiple unfollowed authors and successful pagination from 20 to 40 rendered posts. No real follow relationship was created during QA; the mutation uses the established profile contract. Evidence is stored in `docs/dashboard-feed-discovery-qa/`. Validation: 474 tests pass; production build and typecheck pass, with the existing large-bundle advisory. No backend/schema changes.

# Team Feed Card Follow-Up — 10 October 2026

The user supplied four mobile screenshots showing that tracked team posts require live card artwork rather than the text-only fallback. Added a dedicated web renderer with the same ordered pages: **Final score**, **Top ratings**, **Top disposals**, **Top scorers**. It includes team logos/monograms, club colours, final points and goals/behinds, finals round labels, league/date metadata, top-five player rows, first-place gold treatment and category indicators. Arrow and dot controls are separate from the artwork expansion button. Expansion retains the selected category and keeps the existing comments/like layout.

Team branding and scores extend the existing batched game-context read. Rankings load only when a ranking category is selected, from the companion app's existing `games`, `events`, `game_players`, `squad_members`, `profiles_directory` and grade-context contracts. Pending requests are cancelled on unmount/category change. Loading, empty and retry guidance are rendered honestly. The native feed's event adapter counts contested/uncontested marks as marks and every K/HB variant; this adapter remains separate from the web's existing summary aggregation. Impact 7 uses the existing canonical rating calculation with position and grade/quarter-length context. Scorers sort by goals, then behinds, then name; all categories show up to five players. Unknown team/player images use initials. Existing stored player-card artwork remains untouched.

Tests cover top-five bounds, sorting, opponent tracking, distinct opposing-player identities, profile naming, jumper changes, native event-adapter ratings, finals labels and four-page control wiring. No backend/schema changes, social writes or changes to other Dashboard cards are included.

Live verification against the supplied Macclesfield–Kersbrook screenshots matched final points **68–55**, breakdown **9.14 | 8.7**, ratings **9.1, 9.1, 8.5, 8.4, 8.3**, disposals **24, 21, 19, 16, 15**, and scorer lines **3.2, 1.2, 1.2, 1.0, 1.0**, with the same player ordering. Team labels use the native card's compact naming convention while accessible descriptions retain full team names and actual values. Match dates use the same `en-AU` formatting and local browser timezone; the QA browser's timezone can display a different calendar day from the phone.

Rendered checks covered desktop 1366×900 and mobile 390×844, with working category controls, comments/likes retained and no mobile horizontal overflow. Evidence: `docs/dashboard-team-feed-qa/`. **485 tests passed**, typecheck and production build passed; the existing bundle-size advisory remains. `git diff --check` passed.

## Team Score Artwork Polish — 10 October 2026

User-authorized scope: match team feed artwork to the player cards and redesign the final-score face with a modern sports presentation. This supersedes the original card lock only for this team artwork and its sizing.

- All four team slides now use the same 4:5 portrait footprint as player artwork. The slide controls occupy a reserved 44px band inside that footprint, with no nested buttons.
- The score face uses opposing angular club-colour fields over the existing dark canvas, larger italic scores, separate club crests and names, and a distinct league/venue/date footer. Full club names have a two-line allowance; three-digit scores use a smaller size to fit.
- Ranking slides use the additional vertical room while preserving their existing categories, values, order, and colour treatment. Expanded team artwork fits the available viewport height.
- Feed loading, queries, permissions, follow/like/comment behavior, and other Dashboard cards were outside this change.

Verification: inspected authenticated renders at 1366×900 and 390×844. Team and player slots both measured 260×325 CSS pixels on desktop and approximately 268×334 on mobile. Neither viewport had horizontal document overflow. Opened the real Macclesfield–Kersbrook score and ratings; checked all five rating rows stay above the slide controls. Production build and all 485 existing tests pass. Existing build size and Browserslist advisories remain.

Evidence: [desktop feed](dashboard-team-score-polish-qa/feed-desktop.png), [desktop score](dashboard-team-score-polish-qa/score-desktop.png), [mobile feed](dashboard-team-score-polish-qa/feed-mobile.png), [mobile score](dashboard-team-score-polish-qa/score-mobile.png), [mobile rankings](dashboard-team-score-polish-qa/ratings-mobile.png).

### Score background adjustment

Replaced the angular score-cover fields with the same smooth diagonal gradient treatment as the team artwork: home primary colour at the upper left, dark centre, away primary colour at the lower right. The colours continue to come from the existing squad `primary_color_hex` / opponent primary-colour fields. Portrait sizing, score layout, rankings and controls remain unchanged.

## Leaderboard Snapshot Follow-Up — 10 October 2026

User-authorized changes apply to this module only:

- Added Club / All tabs, with Club selected initially. Club finds accepted members of squads the viewer belongs to or owns, filters the full existing season ranking before selecting its top five, and numbers ranks within that group. All shows the existing global top five. Users with no qualifying squad results see an explicit empty state.
- Added profile photos with initials when missing or unavailable, a small separate rank, borderless player rows, and bold italic totals matching the Dashboard's sports numerals.
- Row backgrounds blend the linked club's primary and secondary squad colours through the existing dark surface. Colour lookup prefers the player's home club and supports players without a current squad membership. Missing palette data uses neutral fallbacks. A dark overlay preserves text contrast, including against light club colours.
- Added accessible keyboard-operated tabs, visible focus, loading feedback and a retry state. Existing leaderboard scoring and season aggregation remain unchanged; no backend/schema or data writes were introduced.

Verification: inspected Club and All in the authenticated Dashboard at 1366×900 and 390×844. Club correctly showed Tom Smith outside the global top five; All retained the five existing global leaders, including their real profile images. Verified Imperial blue and Macclesfield red/black palettes, zero row borders, keyboard switching and no mobile horizontal overflow. Production build passes; 489 tests pass, including filtering before limiting, empty membership handling, preservation of global order, and palette input validation.

Evidence: [All desktop](dashboard-leaderboard-qa/all-desktop.png), [Club desktop](dashboard-leaderboard-qa/club-desktop.png), [All mobile](dashboard-leaderboard-qa/all-mobile.png), [Club mobile](dashboard-leaderboard-qa/club-mobile.png).

## Supporting Containers Follow-Up — 10 October 2026

Applied the approved leaderboard principles only to the three newly annotated modules, preserving their distinct roles and every existing data/action path:

- **Action Inbox:** borderless blue-to-dark-to-green rows, with a restrained amber treatment for items already identified by the existing logic as needing attention. Clearer actor/context typography, quieter timestamps and handles, fewer dividers, and 44px review links. Status labels and destinations are unchanged.
- **Profile Snapshot:** a smooth dark green identity surface, stronger player name, a consistent two-column numerical summary, lightweight role/form details, and borderless recent-game links. Preserved all original figures, profile fields and game destinations. Removed the decorative top line and multiple inset shadows.
- **Portal Activity:** quiet blue rows for notifications and green rows for games, no inner outlines, readable timestamps and a single-column narrow-screen arrangement. Existing event icons, order, titles, text and links remain intact.

Shared section shells retain their existing boundaries. New treatments are scoped to these modules; Recent Games, My Squads, Quick 6, Match Focus, Feed and Leaderboard were not restyled. No queries, data, backend or functionality changed.

Verification: inspected authenticated desktop (1366×900), tablet (1024×768) and mobile (390×844). Profile stats remain two columns on mobile, action links measure 44px high, affected inner rows have zero borders, and neither mobile nor tablet produces horizontal document overflow. Production build and all 489 existing tests pass.

Evidence: [Inbox desktop](dashboard-containers-qa/inbox-desktop.png), [Profile desktop](dashboard-containers-qa/profile-desktop.png), [Activity desktop](dashboard-containers-qa/activity-desktop.png), [Inbox mobile](dashboard-containers-qa/inbox-mobile.png), [Profile mobile](dashboard-containers-qa/profile-mobile.png), [Activity mobile](dashboard-containers-qa/activity-mobile.png), [Profile tablet](dashboard-containers-qa/profile-tablet.png).

## Squad Colour and Layout Annotations — 10 October 2026

Completed the nine follow-up annotations:

- Inbox rows, Profile identity and Profile recent-game rows now use the user's squad primary/secondary gradient. The squad linked to the profile's home club supplies the palette when the listed membership lacks colours; this resolves Northside blue/gold for the authenticated user. Status text remains semantic.
- My Squads cards use each squad's own saved primary and secondary colours, preserving their other styling and controls.
- Removed Roles and Goals / Tackles from the Profile summary only; underlying data remains intact.
- Portal Activity displays actor photos for personal notifications and squad logos for game notifications/summaries, with existing icon fallbacks when no image is available.
- Added faint 9% primary and 7% secondary squad-colour washes behind the Dashboard content. Dark card surfaces and readable content remain intact.
- Moved The Feed to the full-width section immediately after the hero/inbox row and before Recent Games / My Squads / Profile. Updated the module-order check to reflect the requested order.

Verification: inspected authenticated renders at 1366×900 and 390×844. Confirmed real squad palettes on My Squads, Northside blue/gold on Inbox and Profile, computed page tint, removed profile fields, Imperial logos in game notifications, Feed ordering and no horizontal document overflow. Production build and all 489 tests pass. Existing data calculations, actions and destinations are preserved; reads were extended for existing squad branding fields only.

Evidence: [Squads and Profile desktop](dashboard-squad-colours-qa/squads-profile-desktop.png), [Inbox desktop](dashboard-squad-colours-qa/hero-inbox-desktop.png), [Feed placement](dashboard-squad-colours-qa/feed-position-desktop.png), [Activity imagery](dashboard-squad-colours-qa/activity-desktop.png), [Profile mobile](dashboard-squad-colours-qa/profile-mobile.png), [Activity mobile](dashboard-squad-colours-qa/activity-mobile.png).

### Dashboard background reverted

At the user's request, removed the squad-colour page wash and its styling variables, restoring the prior Dashboard background. Squad colours inside the cards, Feed placement, activity images and Profile simplification are retained.
