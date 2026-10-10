# How It Works Visual Critique

Method: dual-agent — Assessment A `/root/how_design_review`; Assessment B `/root/how_evidence_review`. Audit date: 10 October 2026. Target: `src/routes/HowItWorks.tsx`, rendered at `http://127.0.0.1:5174/how-it-works`, compared with the current cleaned-up landing page. Audit only: no source, CSS, component, route, content or backend changes.

## Executive Summary

**The information is useful; its presentation is over-framed.** This is a coherent product explainer inside a generic glossy feature-explorer treatment. The content communicates real football workflows, but a succession of rounded panels, borders, inner shells, glows and small uppercase labels makes the interface feel more complicated than the product explanation needs to be.

Preserve the intro → five-step Product Engine → nine-workflow tab explorer → footer structure. Preserve all nine workflows and their explanations. Do not replace the explorer with nine long landing-page chapters. The highest-value change is to expose the content and product evidence by removing decorative surfaces, relieving tablet column compression and presenting the engine as one clear diagram.

The three strongest parts are the meaningful tracked-game loop, predictable workflow navigation and authentic football product imagery. The three largest weaknesses are nested surface repetition, undersized or inappropriate product evidence, and the tablet/mobile pacing penalty.

A critical distinction: the page does **not** render nine stacked workflow sections. It renders one selected panel. Repetition happens within that panel and across selected states; a recommendation to delete nine long sections would misunderstand the implementation.

Evidence covers the full page at **1920×1080, 1366×900, 1024×768, 768×1024 and 390×844**, plus all nine workflow states on laptop. All seven image-bearing states loaded. Development and Ratings intentionally render placeholder panels; these are unfinished editorial slots, not broken network images. Evidence is in `docs/how-it-works-qa/`.

## Overall Score

**62/100 overall visual quality.** This is a holistic design judgement, not a test metric or arithmetic average. The useful content and working structure keep it above a failed experience; the visual treatment is materially behind the current landing page.

| Area | Score /100 | Main reason |
|---|---:|---|
| Hero | 66 | Clear purpose, weak visual anchor and unnecessary title wrapping |
| Navigation | 72 | Recognisable and clear on desktop; styling differs across public pages |
| Product Engine | 64 | Good sequence; overbuilt cards and excessive mobile height |
| Workflow hierarchy | 70 | Predictable structure; too many labels and repeated takeaway layers |
| Screenshot presentation | 44 | Small proof, nested frames, placeholders and mismatched examples |
| Typography | 66 | Readable family; long titles, faint metadata and weak brand relation |
| Spacing | 58 | Desktop empty space and tablet compression coexist |
| Colour / brand consistency | 80 | Correct core colours; surface and emphasis language diverge |
| Surface treatment | 42 | Almost every hierarchy level receives another rounded container |
| Mobile layout | 54 | No page overflow, but long engine and delayed small proof |
| Premium feel | 52 | Real product substance hidden by generic glossy styling |
| Overall polish | 60 | Visibly unfinished media states and inconsistent material language |

First viewport scores: **clarity 8/10; visual hierarchy 7/10; premium feel 5/10; brand consistency 6/10; product credibility 6/10**. The title makes the page's job clear. The opening is not yet a premium sports-tech walkthrough: useful product proof is absent from its immediate composition, while a decorative diagram shell receives significant emphasis.

Independent Assessment A estimated 58/100 and 8/10 generic-design risk. The synthesis gives slightly more weight to the preserved learning structure and verified canonical colours. Neither score represents an independent usability study.

### Supporting heuristic assessment

Assessment A evaluated the explainer as a reading/product-understanding experience, rather than a transactional app flow.

| Nielsen heuristic | Score /4 | Evidence |
|---|---:|---|
| Visibility of status | 3 | Desktop selected state clear; mobile selection weaker |
| Match with real world | 3 | Football language useful; structural marketing language abstract |
| Control and freedom | 3 | Direct workflow switching; long mobile panels separate index and proof |
| Consistency and standards | 2 | Internally consistent, visually inconsistent with landing |
| Error prevention | n/a | No consequential inputs in this audit |
| Recognition over recall | 3 | Named topics help; mobile later topics are offscreen |
| Efficiency | n/a | Expert accelerators not relevant to this visual explainer |
| Aesthetic/minimalist design | 1 | Heavy framing and small media |
| Error recovery | n/a | No meaningful recovery flow exercised |
| Help/documentation | 3 | Useful explanation, uneven visual substantiation |
| Applicable total | **18/28** | Seven applicable heuristics |

Cognitive load is moderate: nine peer topic choices are acceptable for a reference explorer, but the index's long blurbs, repeated label layers and equally prominent bullet cards increase scanning effort. The five engine steps are a sequence, not five simultaneous decisions. Do not remove useful topics merely to meet an arbitrary choice count.

## AI-Slop Risk

**7/10.** The strongest signals are glossy rounded containers at every level, stacked radial lighting, repeated inset shadows, tiny widely tracked labels, identical panel compositions and decorative styling on non-interactive diagram steps. This describes the visual impression, not how the page was authored.

The page is not empty marketing: real football imagery, meaningful workflow descriptions and genuine club context reduce the risk. Removing decorative shells and enlarging relevant proof should improve specificity without adding another aesthetic system. More motion, new fonts and more green lighting would move it in the wrong direction.

## Hero

**What works:** obvious page title, concise first proposition, calm left alignment and familiar public shell. The visitor understands that this is an explanation of KickChasers.

**What weakens it:** the H1 is constrained to `12ch`, producing a narrow two-line title even when ample desktop space exists. Two introductory paragraphs then repeat the platform's expanding value before the engine repeats it visually. The broad right side is empty without functioning as deliberate breathing room around strong product proof. Small uppercase labels supply atmosphere rather than useful hierarchy.

This is not a case for a giant hero image. The engine is the appropriate visual anchor. Move the opening toward a compact title/copy/diagram composition:

- Widen H1 from 12ch to approximately 16–20ch, aiming for a deliberate two-line wrap on laptop and mobile rather than a forced isolated “Works”. Keep the exact title.
- Retain both paragraphs initially; give the first stronger contrast and the second quieter supporting weight. Keep body measure around 50–60ch desktop and normal phone width.
- Reduce desktop intro top padding from 64px toward 48–56px; mobile 56px toward 32–40px.
- Keep the engine about 24–32px below the intro. Its current 24px margin is already reasonable; the problem is the engine's mass and repeated internal padding, not a giant intro-to-engine gap.
- Use one landing-family green 2px rule under the principal heading. Do not add floating UI, athlete film, particles or another large gradient.

The first section measures approximately **628px on wide/laptop**, **649px at 1024**, and **1105–1135px at portrait/mobile**. The mobile problem is largely the five stacked engine cards, not the title alone. On 390px, the workflow heading begins around page Y=1318px; reducing the engine is more effective than shrinking readable text.

## Navigation

Keep current destinations and navigation behaviour. Desktop active underline communicates location well. Logo and auth actions are recognisable; there is no need for another navigation model.

The public pages look different when traversed: How It Works has larger/softer logo-control proportions, rounded auth controls, translucent surfaces and a green sign-up halo. Landing uses a solid navy header, roughly 48px logo, 3px control corners and a solid green action with dark text. Align these visual properties within a route-scoped public-shell treatment, without accidentally changing other routes.

Recommended visual targets: roughly 76–88px desktop header, 44px minimum auth actions, landing-family control corners, no green shadow, consistent 2px active underline without glow. Preserve the current footer's destinations and tighten its spacing only as needed for parity.

At 390px, only logo and auth actions remain; the global section navigation is hidden. Landing has a separate mobile navigation row. Record this as a consistency difference, **not permission to introduce navigation behaviour in a visual-only cleanup**. Keep existing functionality unless a later brief explicitly authorises parity changes. At 768px, the desktop links fit but feel busy; shorten gaps before shrinking text below readable sizes.

There is no dedicated closing CTA block on this page: account actions are in the header/footer. Do not invent a new sales finale as part of this audit's proposed styling pass.

## Product Engine

Keep the exact five steps and order: **Track Game → Game Summary → Player Profiles → Leaderboards → Feed & Sharing**. This is the page's clearest system explanation.

The current outer 28px-radius shell contains five 18px-radius cards, shadows, gradients, tiny numbers and four separate arrow connectors. The first step receives selected-looking styling even though this is a static sequence. Hover lift and lighting suggest interactive cards without providing a meaningful interaction.

Recommended treatment:

- Remove the outer visible shell; retain its layout wrapper.
- Use five step labels on one shared baseline, modest numbers and a single thin connector language. Preserve numbering because sequence is meaningful here.
- Give steps equal visual weight. Green should connect the system or mark the start, not suggest a selected tab.
- Use a solid restrained green/neutral 1px connector with small consistent arrowheads; remove gradient arrow stems and step hover elevation.
- Desktop: approximately 64–88px diagram height after its short explanation, with 20–24px separation from subsequent content.
- Portrait/mobile: compact vertical timeline with approximately 44–52px label rows and integrated connectors. Target roughly 260–330px overall, rather than five padded cards plus independent 28px arrow gaps.

This preserves comprehension and avoids both a horizontal phone-scrolling diagram and a long stacked-card tour. The existing stack is understandable; it is simply overbuilt.

## Feature Index

**Keep the desktop sticky side index and current single-panel selection model.** It is useful for a reference page with nine topics. Converting it into nine long sections, a new accordion architecture or a table would be unnecessary scope.

Desktop improvement: remove the 30px outer shell, the selected 22px glossy card and boxed number chips. Keep a 1–2px green selected indicator, readable label, quiet optional one-line blurb and clear keyboard focus. Use approximately 56–72px rows rather than allowing every blurb to form another paragraph. Nine rows can remain visible and comprehensible without nine visible cards. The measured index at 1024px is roughly 1036px tall; a compact list should approach 600–750px depending on text wrapping.

Maintain useful distinction between a selected topic and hover. Increase faint 10–12px metadata to approximately 12–13px and improve contrast. Nine topics require scanning, not visual competition.

Below the sidebar breakpoint, retain the existing controlled horizontal tab strip. It is approximately **1622px of content within a 327px mobile viewport**. This is intentional contained overflow, not a page overflow defect. Later topics need a clearer continuation cue and the selected tab should have a sharp canonical green underline/fill rather than another glowing tile. Do not add a second mobile index or replace selection behaviour in the visual pass.

The “Explore the platform by workflow” header is useful but over-labelled. Its 48px desktop size can reduce toward 36–42px, with approximately 16px to its explanation and 24–32px to the index/panel. Preserve the useful paragraph; reduce the “Full Product Breakdown / Feature Index / Feature Explorer” label hierarchy before proposing content removal.

## Workflow Sections

All nine states were inspected. They share a useful structure: selected topic, title, explanation, four supporting points, takeaway and optional product evidence. Preserve this structure at the information level. It does not require a rounded card around each element.

| Workflow | What works / weak composition | Recommended refinement |
|---|---|---|
| Profile & Onboarding | Clear identity explanation; genuine three-phone profile collage. At about 279px total laptop width, each phone is tiny. | Make the central profile dominant and enlarge the existing composition. A focused profile crop may supplement the full original; do not edit screenshot contents. |
| Squads & Teams | Useful roster/role explanation; image is Tom Smith's player rating/profile rather than squad management. | Use verified roster, squad or role-management proof when an appropriate asset is available. Preserve the workflow and points. |
| Live Match Tracking | Relevant real stat pad; narrow portrait framing understates the live workflow. | Give authentic tracking media more width; use an existing landing tracking asset if it accurately illustrates this explanation. Keep score, quarter and stat controls recognisable. |
| Game Summaries | Authentic results and summary composition; two-phone details too small. | Enlarge the primary summary or use a focused score/quarter/player crop. Retain full source media access where practical. |
| Player Development | Useful long-term history explanation. Public panel shows a developer-facing screenshot placeholder. | Supply verified history/trend media. If unavailable, use a quiet factual text treatment and remove the development instruction from the public presentation; retain all explanatory content. |
| Leaderboards | Appropriate competitive evidence; tall image height differs from the profile collage. | Use a stable visual area, align to relevant ranking detail and avoid empty space from enclosing shells. Do not crop away leaderboard context merely to equalise heights. |
| Feed & Performance Sharing | Content-creation image supports sharing; it does not strongly demonstrate the follow-based feed described. | Clearly caption the current visual as content creation, or use an authentic performance-post/feed example. No new feed feature is implied. |
| Ratings & Benchmarking | Useful interpretive explanation; another developer-facing placeholder makes the most abstract workflow least credible. | Supply readable rating/band proof or an existing appropriate benchmark capture. Do not invent score data or a fake graph. |
| Portal & Club Management | Good desktop-management proposition; reuses onboarding's mobile profile collage. | Use actual desktop squad/admin evidence when supplied. Preserve management content and current selection. |

Long workflow titles are often 9–14 words and constrained to 18ch. On normal desktop that produces 3–4 lines; at 1024px it can produce five or more. Preserve factual copy initially, remove the layout constraint and allocate reading width. If a later copy pass is authorised, shorten structural phrasing such as “Build the structure that connects…” before touching useful details.

The current template produces similar visual emphasis for every paragraph, bullet box and takeaway. Use one strong title, one short introduction, real media, quiet supporting rows and a concise takeaway. On phones, media should appear after the introduction and before the detailed points, avoiding roughly three screens of explanation before proof. This is an internal responsive presentation change, not removal/reordering of the nine workflows.

## Screenshot / Media Treatment

Current nesting is the central mismatch with landing:

**workflow panel → screenshot outer panel → screenshot inner panel → glow/shadow wrapper → device artwork**.

Remove the visible workflow card and both decorative screenshot shells. Preserve layout wrappers where needed, image aspect ratios and intrinsic phone/device artwork. The user has already identified screenshot updates as separate asset work; a cleanup must not silently fabricate replacements.

Measured initial Profile media widths: approximately **279px on wide/laptop**, **228px at 1024**, **400px at portrait tablet**, **201px on narrow mobile**. The source profile collage is 1816×1488px. A three-phone collage at 201px is credible as a thumbnail but cannot explain controls.

Targets: desktop illustration generally 360–500px for portrait/collage content, with wider landscape evidence where relevant; mobile direct media near available 327–359px content width instead of approximately 201px. Do not force every asset to the same frame or stretch a portrait screenshot. Pair a focused detail with the correct explanation where the full UI remains too dense.

Use zero added border/background/glow by default; one soft dark shadow only when an asset needs separation. Retain intrinsic screen/device edges. Avoid decorative masks that remove important controls. All seven supplied images loaded during inspection; this audit found editorial relevance/scale problems, not missing file references.

## Spacing / Rhythm

The page is not excessively long on desktop. The issue is disproportion: underused opening width, heavy engine, a compressed tablet panel and multiple nested interior gutters. Do not impose the landing's old 35–45% shortening target here.

| Relationship | Existing evidence | Recommended target |
|---|---|---|
| Intro top padding | 64px desktop / 56px mobile | 48–56px / 32–40px |
| Intro to engine | 24px | Keep 24–32px; flatten the engine itself |
| Engine to explorer heading | Closing 32–48px + next-section 64–80px, about 96–128px before labels | About 64–88px desktop / 48–64px mobile total |
| Explorer heading to paragraph | 20px | About 14–16px |
| Explorer paragraph to index/detail | About 32px desktop; mobile adds separate 40px and 32px gaps around tabs | Approximately 24–32px, avoiding doubled mobile gaps |
| Detail card padding | 24px mobile / 32px desktop | No enclosing shell; preserve 0–16px intentional internal alignment |
| Media shell padding | Outer 20px plus inner 16–24px, inside workflow padding | Remove decorative nesting; give media the real available width |
| Supporting points | Four individual p16 bordered cards, 12px gaps | Simple rows, about 8–12px vertical gaps; no separate card shells |
| Takeaway | 28px top gap and padded 24px-radius panel | About 20–24px after points; one rule or unboxed text grouping |
| Footer transition | Standard section bottom padding plus footer | Approximately 48–64px after final content on mobile; retain clear closure |

At 1024px, measured inner columns are about **190px text / 320px media**, with a 32px gap. The panel has no measured horizontal overflow; its problem is readability. Stack inner text/media below roughly 1280px, or enable two columns only when text has at least 300–320px of useful width. The sidebar can remain if the detail interior stacks.

On mobile, the default profile image appears around **page Y=2729px**. Bring meaningful proof earlier by compacting the engine and placing media directly after the selected workflow's introductory paragraph. Preserve paragraph legibility rather than solving height with smaller type.

## Typography

Do not introduce a new font. Landing currently explicitly uses Arial/Helvetica; How It Works uses the Tailwind system-sans stack. This is a real family difference, but the stronger mismatch is weight, casing and material treatment: landing H1/H2 are athletic 900-weight italic uppercase, while this page uses 600-weight sentence case.

Recommended hierarchy:

- H1: adopt the existing public landing's athletic display treatment at approximately 48–60px desktop / 36–42px mobile; preserve readable wrapping and the current title.
- Main H2: 36–42px desktop / 30–34px mobile, with a restrained landing-family green rule.
- Workflow H3: neutral sentence case, 28–34px desktop / 26–30px mobile, natural line lengths. Long explanatory titles should not all become uppercase italic slogans.
- Body: 16px with 1.6–1.7 line height, around 50–65ch when width permits; avoid 190px text strips.
- Index labels: 14–15px; metadata 12–13px with sufficient contrast. Reserve 10–11px text for truly incidental information.

Reduce the visual prominence/count of “Product Walkthrough”, “Product Engine”, “Full Product Breakdown”, “Feature Index”, “Feature Explorer”, “Why it matters”, “Key concept” and “Product view”. The selected label and heading already establish location. Keep useful labels where they orient the reader; do not turn them all into decorative uppercase landmarks.

Copy is generally useful but often repeats the same proposition in summary, four points and takeaway. Preserve content in the first styling pass. A later authorised editorial pass could tighten repeated structural language; no automatic removal is justified by this audit alone.

## Background / Colour

**The core background and accent are already correct.** There is no reason to invent or approximate another navy/green system.

| Property | How It Works | Current landing | Recommendation |
|---|---|---|---|
| Base | #02091A | #02091A | Keep |
| Shared shell gradient | #02091A → #040B1C → #030A1A | Same canonical stops | Keep continuous page surface |
| Main green | #39FF14 | --lp-green: #39FF14 | Keep exact colour |
| Green hover | Public shell #50FF2F | #50FF2F | Keep |
| Secondary emphasis | Mint #98FFA3, multiple translucent green panels | Muted neutral copy, canonical green focus/action | Reduce decorative mint/panel emphasis |
| Additional local lighting | Intro blue/green radials, explorer turquoise/blue wash, multiple screenshot glows | Shared ambient treatment; largely transparent sections | Remove duplicated local lighting |

The explorer adds `rgba(0,255,150,0.1)` lighting, separate from the canonical `rgba(57,255,20,...)` green. The screen feels more blue/green and synthetic because of overlaid material effects, not because its base token is wrong. Align surface usage first.

## Green Usage

Prioritise green for selected index/tab state, active nav underline, main heading rule and the actual primary action. Use modest bullets only if they help scanning. Keep the five-step connector quiet and consistent.

Remove green blooms behind screenshots, glowing selected rails, bright green borders around takeaways, multiple active-looking engine surfaces and decorative gradient washes. Do not make every H3 green. The first static engine step should not look selected; the selected workflow should.

Green is over-distributed in surfaces while under-serving the principal hierarchy. Moving it to a few precise rules/states is stronger than adding more green area.

## Borders / Radius / Glow

| Existing treatment | Decision | Reason |
|---|---|---|
| Engine 28px outer container | Remove visible surface | One diagram needs no card around five more cards |
| Engine step 18px cards | Reduce to labels/connector | Sequence is useful, decorative cards are not |
| Sidebar 30px outer shell | Remove | Position and selected state establish grouping |
| Selected row 22px gradient/shadow | Reduce | Clear green indicator and focus suffice |
| Workflow 34px panel | Remove visible shell | Typography and layout can carry hierarchy |
| Screenshot 30px outer +24px inner shells | Remove | They reduce usable product area |
| Four 16px bullet cards | Remove shells | Supporting points should not compete with headline/media |
| Key concept 24px green panel | Reduce to rule/text | Keep the useful takeaway, reduce its decoration |
| Screenshot 420px glow + ProductShot 460px default glow | Remove | Duplicated light distracts from product |
| Actual device artwork | Retain | Intrinsic source media; asset refresh is a separate decision |
| Interactive focus outline / subtle grouping rules | Retain | These communicate actual interaction and hierarchy |

**Verified styling defect:** `border-white/8` on the supporting point cards resolves to opaque `rgb(229,231,235)` in the running app, rather than translucent white. The inner screenshot border does the same. This explains the conspicuous pale outlines. If any such border remains after the surface pass, use supported explicit arbitrary opacity/rgba and verify the computed colour. Do not blindly copy the invalid opacity pattern into shared styles. Similar `/18` classes deserve verification, rather than assuming they compile as intended.

## Motion

| Effect | Decision | Recommendation |
|---|---|---|
| Intro/explorer scroll Reveals | Reduce | Static or a single short initial reveal, without repeatedly dimmed copy |
| Keyed workflow panel Reveal, duration 420ms | Keep, simplify | A 150–220ms restrained transition can communicate selection change |
| Engine hover lift, extra shadow and radial highlight | Remove | Static diagram steps should not imply an action |
| Sticky desktop feature index | Keep | Useful reference/navigation support, not cinematic storytelling |
| Selected index colour/focus changes | Keep | Meaningful feedback |
| Screenshot/ambient decorative lighting | Remove | Static glow is not an explanatory animation |
| Animated connectors / scroll progress / parallax | Do not add | No comprehension problem requires them |

The existing Reveal computes opacity/translation/scale from scroll position; it is not simply a one-shot entrance. That can leave parts of the explainer visually subdued as the reader moves. Avoid making legibility depend on reveal progress. Respect the existing reduced-motion pathway and keep every panel understandable without motion. No scroll hijacking or video is needed.

## Mobile

This is the weakest composition despite measured **zero page-level horizontal overflow** at all five audited sizes.

- **Hero/engine:** five separate cards and arrow gaps dominate the first 1100px section. Use the compact vertical timeline while retaining all steps.
- **Index:** preserve the intentional horizontal tab strip; make selection and continuation clear. Do not label its 1622px scrollable content as a page overflow bug.
- **Panel order:** selected topic/title → introduction → meaningful product media → supporting points → takeaway. This retains the selected topic's contents while improving proof timing.
- **Gutters:** keep approximately 20–24px outer margins but remove the further 24+20+16px shell paddings. Product imagery should use the actual content width.
- **Screenshot:** the default profile collage is only about 201px wide; three internal phone screens are too small to explain anything. Enlarge it or show a purposeful primary detail.
- **Typography:** current long title/body remain readable when not compressed. Do not make them smaller to compensate for the engine's height.
- **Footer:** preserve all destinations; use readable 12–13px links and touch spacing. Avoid adding a promotional section to compensate for a quiet finish.
- **Tablet landscape:** stack the detail interior earlier. This is a stronger fix than reducing heading size until the 190px copy strip fits.

At portrait tablet, the screenshot expands to roughly 400px and the panel is easier to read, but the vertical engine still consumes too much height. Improve both 768 and 390 as distinct compositions; do not only fix the desktop breakpoint.

## Keep / Reduce / Merge / Remove

### KEEP

All nine workflow topics, selection model, five-step sequence, useful explanations, real assets, current navigation destinations, shared navy/green values, desktop sticky index, keyboard focus and reduced-motion support.

### REDUCE

Hero's constrained width; label layers; faint metadata; intro/explorer repetition; diagram height; sidebar blurbs' visual density; workflow title wrapping; large radii; local gradients and hover motion.

### MERGE

Merge redundant **visual wrappers**, not product topics: screenshot outer/inner shells become one layout wrapper; supporting point cards become a single list; selected label/number/meta become one quiet identity line; key-concept framing becomes part of the content flow. No major content section needs deletion or a new IA.

### REMOVE

Developer-facing placeholder instructions from public presentation, decorative screenshot glows, extra screenshot panel borders/backgrounds, generic glossy engine shells, non-interactive step hover lift and opaque accidental bullet outlines. Preserve source assets. Replace mismatched media with verified assets when supplied rather than deleting useful workflows.

## P0

Only issues that materially weaken public credibility or readability belong here.

| Section | Issue | Recommended change | Why / impact | Approximate scope |
|---|---|---|---|---|
| Development / Ratings | Public developer-facing placeholders | Supply accurate existing/new screenshots; if unavailable, use a quiet factual text presentation without development instructions | High credibility impact; removes visibly unfinished states while preserving content | Small UI change; asset sourcing dependent |
| Tablet workflow interior | About 190px text beside forced 320px media | Stack interior below ~1280px or enforce minimum usable copy width before splitting | High readability impact; long titles/paragraphs no longer form narrow towers | Small responsive layout change; inspect all nine states |
| Squads / Portal proof | Rating/profile imagery presented as roster/desktop-management evidence | Map verified suitable media to these states, or explicitly constrain captions to what the current image shows | High product credibility impact; avoids unsupported visual promises | Small binding/caption change once assets are available |

No verified broken route, image request or page-level overflow was found. Do not invent technical blockers to inflate P0.

## P1

| Section | Issue | Recommended change | Why / visual impact | Approximate scope |
|---|---|---|---|---|
| Workflow/media | Three decorative shells around small image | Remove visible outer detail card and both media shells; enlarge proof | Very high; strongest link to cleaned-up landing | Medium route-scoped styling pass |
| Supporting points/takeaway | Four bordered cards plus another green card | Flat list with quiet grouping; unboxed takeaway | High; lowers visual competition and corrects bright outline defect | Small/medium |
| Product Engine | Five SaaS cards inside another card; long phone stack | One continuous diagram; compact 44–52px mobile rows | High; clarity and pacing improve without changing sequence | Medium responsive component styling |
| Feature Index | Large shell, numbered chips, dense blurbs | Compact sticky list, crisp active state; clearer mobile strip continuation | High; preserves navigation and reduces noise | Medium styling, existing behaviour retained |
| Hero / explorer | Narrow display title, repeated labels, large accumulated gap | Wider title measure, fewer label layers, tighter macro rhythm | Medium/high; clearer first impression | Small/medium |
| Public family | Softer headings/header/buttons than landing | Reuse current public heading/control language selectively; H3/body stay readable | High brand cohesion | Medium, strictly route-scoped to avoid landing regression |
| Background/effects | Duplicate local washes and 420/460px media blooms | Keep canonical shared background; remove local decorative effects | High; makes it feel premium through proof rather than surfaces | Small |
| Mobile proof timing | Media after all points and takeaway | Place media after introduction on small screens; remove compounded gutters | High; proof becomes earlier/larger | Medium responsive composition change |

## P2

| Section | Issue | Recommended change | Why / visual impact | Approximate scope |
|---|---|---|---|---|
| Typography | Small faint tracked labels | 12–13px where useful, less tracking, better contrast | Medium scanability improvement | Small |
| Heading accents | Inconsistent green hierarchy | One 2px canonical rule at major headings; no halo | Modest distinctive brand signature | Small |
| Diagram connectors | Gradient stems, oversized independent arrow gaps | Consistent thin connector and arrow scale | Modest precision improvement | Small |
| Media rhythm | Different image proportions shift attention | Align to explanation and use sensible max heights without losing context | Medium | Small/medium per asset |
| Header/footer | Different proportions/corners/glow | Match existing public control styling and spacing; retain links/behaviour | Medium family consistency | Small |
| Tab transition | Long repeated reveal | Shorten transition, preserve legibility/reduced-motion fallback | Modest calmness improvement | Small |
| Tab semantics, separate optional work | Tab+Enter works; ArrowRight did not select; relationships lack conventional IDs/controls | If separately authorised, align to standard tab keyboard/ARIA relationships | Accessibility benefit, not a prerequisite for the visual-only scope | Small behaviour change; outside current styling brief |

Suggested implementation order: P0 media/readability → P1 surface/media/engine → public typography and accents → one bounded five-size review of all nine states. Do not start another landing redesign or backend task.

## Recommended Final Visual Direction

The ideal page is an **open, precise product walkthrough**, with the current football content and navigation intact. Its rhythm should be compact orientation → a clear system diagram → a useful index beside one readable explanation → real product evidence → supporting details → a concise takeaway → familiar footer.

Retain essentially all current information architecture: intro, exact five-step loop, exact nine topics, selected-panel model and public destinations. The visual shells disappear; the information does not. Keep the index sticky on sufficiently wide screens, stack inner content early enough for tablets, and make mobile's diagram and product-proof timing intentional.

The engine should look like a designed explanation of one connected platform, not five purchasable cards. The index should feel like a sharp table of contents, not a second dashboard. Screenshots should sit directly on the page, with enough scale to demonstrate the selected topic. Use the landing's exact background/green and sharper public typography/control language, while keeping explanatory H3/body text calmer than campaign headlines.

Keep the diagram, screenshots, background and supporting text static. Retain only short selection feedback and the useful desktop sticky index. No long sticky storytelling, floating devices, new gradients or blanket reveals are justified.

**Recommended next pass:** a constrained How It Works surface/readability cleanup, preserving all nine workflows and current behaviour, with an explicit asset mapping sheet for Profile/Squads/Tracking/Summary/Development/Leaderboards/Feed/Ratings/Portal. Confirm replacement media before implementing claims through imagery. The current page shares the landing's colours, but **does not yet visually match its material language or premium standard**.

### Evidence and limits

Assessment A completed before Assessment B detector findings entered synthesis. Both independently inspected fresh browser tabs; all agent-created audit tabs were closed. Root captured five sizes and all nine laptop workflow states, then restored the viewport. The user's pricing tab was retained.

The bundled CLI detector and target-slug command were each actually attempted by Assessment B and returned exit 126, permission denied: the launcher exists but is not executable. Deterministic finding counts/rules are **unknown**, not zero. Native skill snapshot/trend storage was skipped because slug resolution failed; this user-requested Markdown report is the persisted deliverable. No ignore file existed. Browser evaluation is read-only, so no detector overlay was injected and no detector live-server was started. Rendered screenshots, computed styles, state changes and source inspection supplied the fallback evidence.

No source changes or runtime tests were needed for this audit. This is not a complete accessibility, performance, product-feature or physical-device audit. OS reduced-motion switching and screen-reader interaction were not tested. Stitched full-page captures can place sticky headers mid-composite or change scrollbar geometry; dedicated viewport captures and DOM measurements were used to distinguish capture artifacts from actual defects. Scores are qualitative design judgements.

# Cleanup Implementation Result

Implemented the approved surface/responsive/media pass while preserving the five-step Engine, nine-topic tabbed explorer, single selected panel, content and navigation destinations. Eleven repeated surface categories were removed or flattened; route-local glow and scroll reveals were removed. Canonical green/background and landing heading/control language now align. The workflow interior stacks below 1280px, with a compact 260px mobile Engine and focused profile media.

Development and Ratings placeholders were replaced by accurate existing season-history/benchmark assets. Squads now uses real lineup proof; Feed uses the feed screen. Portal uses honest content-only presentation because no accurate desktop-management asset exists. Assets were preserved. Missing squad-management/Portal captures and further detail-proof improvements remain documented rather than hidden.

All 45 size/workflow combinations were captured and checked, with no positive page overflow, missing mounted media or placeholder copy. Focused tests 7/7, full suite 465/465, typecheck, production build and diff whitespace validation pass. Existing build warnings remain (old Browserslist data /large JS chunk). No backend changes or migrations.

Updated qualitative score: **80/100**, AI-slop risk **3/10**. Complete implementation and limitations: [HOW_IT_WORKS_VISUAL_CLEANUP.md](HOW_IT_WORKS_VISUAL_CLEANUP.md). This score is a post-pass judgement, not a new independent critique.
