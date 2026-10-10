# KickChasers Landing Page Visual Critique

Method: dual-agent (A: `/root/visual_design_review` · B: `/root/design_evidence_review`). Assessment A finished before detector/evidence findings entered synthesis.

Reviewed 8 October 2026. Target: `/Users/jackpenfold/Projects/kickchasers/src/routes/Landing.tsx`, rendered at `http://127.0.0.1:5174/`.

This is a visual/product design critique of the public landing page. It does not assess feature completeness, tracking accuracy, authentication, payments or the authenticated product. No application source, behaviour or assets were changed. All proposed changes below remain recommendations.

## Executive Summary

KickChasers already has a credible visual foundation: an Australian football oval, recognisable match controls, navy-and-gold club identity, a coach using the product, and a finished card that turns performance into something personal. Those are stronger differentiators than another layer of animation or styling.

The page lacks editorial restraint. It introduces tracking, mapping, analysis, summaries and cards, repeats them in a five-step walkthrough, then demonstrates several of them again. Supporting galleries remain open by default. The result feels like an extensive asset catalogue rather than a carefully directed product launch.

The strongest opportunity is **selection and pacing**. Give each major promise one clear demonstration. Keep the athletic opening, the team demo and the finished card. Shorten the route between them. Use the card as the final major reward, followed immediately by the CTA.

The shell is substantially more restrained than a generic glowing SaaS template. The risk comes from repeated slogan pairs, inconsistent media treatments, a single recurring example athlete and promotional posters embedded within an already promotional page. Green itself is appropriate to the product; excessive repetition is the greater problem.

**Verdict:** functional-looking and recognisably football, but not yet visually ready for the premium launch standard in the brief. This calls for a structural edit, responsive media direction and a final typography pass. It does not call for a wholesale brand replacement.

Inspection covered real scrolling through the entire rendered page at **1920×1080, 1366×900, 1024×768, 768×1024 and 390×844**. A second independent browser pass checked 1440×900 and 390×844. Captures are in [the evidence directory](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique). Full-page captures distort the placement of sticky elements, so dedicated viewport captures were used for hero and walkthrough judgments. Lazy images changed document height while scrolling; dimensions below are approximate observed states, not exact layout contracts or a measured layout-shift score.

## Overall Score

**Overall visual score: 68/100.** Equal-weight mean of the eleven requested categories, rounded from 67.9. This is an expert design judgment, not a user-test result.

| Category | /100 | Main reason |
|---|---:|---|
| Hero / first impression | 76 | Strong athletic impact and CTA; product proof is delayed |
| Visual hierarchy | 78 | Clear major headings; lower-page sections compete at similar weight |
| Product clarity | 68 | Concrete interface evidence, diluted by repeated explanations |
| Screenshot presentation | 62 | Valuable assets, inconsistent framing and dense mobile scaling |
| Typography | 65 | Sports energy, but repeated italic slogans and very small labels |
| Spacing / rhythm | 60 | Competent local grids; excessive cumulative length and empty travel |
| Motion | 70 | Purposeful reverse scrub and demo; overlong walkthrough and offscreen loop |
| Brand identity | 80 | Oval, kit, club identity and performance cards give specificity |
| Premium feel | 66 | Strong ingredients; too much is shown at equal importance |
| Mobile design | 58 | CTA remains visible; desktop inventory becomes a long, tiny-screen catalogue |
| Overall polish | 64 | Several good compositions, insufficient consistency and editing |

For Impeccable's persuasion-surface review, the separate Nielsen score is **17/24 (71%, Good)**. It is narrower than the visual launch score and should not be averaged into it.

| # | Heuristic | /4 | Visible-surface assessment |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Walkthrough step and disclosure state are visible |
| 2 | Match with the real world | 3 | Footy terminology, oval and quarters work; app labels need context |
| 3 | User control and freedom | 3 | Still-image option, walkthrough alternative and video controls exist |
| 4 | Consistency and standards | 3 | Coherent shell; conflicting image treatments and numbering systems |
| 5 | Error prevention | n/a | No consequential input flow evaluated |
| 6 | Recognition rather than recall | 3 | Named chapters and navigation help; repeated evidence burdens scanning |
| 7 | Flexibility and efficiency | n/a | No expert operating workflow assessed on this marketing surface |
| 8 | Aesthetic and minimalist design | 2 | Restrained components, excessive repeated content |
| 9 | Error recovery | n/a | Error/recovery flows outside this visual review |
| 10 | Help and documentation | n/a | How-it-works is linked; documentation not evaluated |
| | **Total** | **17/24** | Six applicable heuristics |

## AI-Slop Risk

**4/10**, where 1 is clearly custom and credible and 10 is obviously generic/template-like. This rates visual perception; it makes no claim about whether any asset was generated with AI.

What raises the risk:

- Many paired italic slogans use the same white-first-line, muted-second-line formula.
- The same tracking/mapping screens recur without a substantially different visual explanation.
- Glossy promotional composites, raw screenshots, phone mockups and lifestyle imagery feel assembled from different campaigns.
- The “NEW PREMIUM CARDS” poster is an advertisement inside an advertisement, repeating the card promise with louder effects.
- One example player and club dominate almost every proof point. That can feel demonstrative rather than lived-in; do not imply customer endorsement without evidence.

What lowers it:

- The product is visibly about Australian football, not a generic dashboard with renamed labels.
- The oval, stat pad, quarters, Score Worm and player identity make the content specific.
- The outer shell avoids endless glass cards, ambient particles and neon borders on everything.
- Gold has a useful, separate role in the card section.

The cure is better editing and more intentional media framing, not adding distressed textures, more green, or a new ornamental motif.

## Hero Critique

See [wide desktop hero](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/1920-hero.jpg) and [mobile hero](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/390-hero.jpg).

| First-five-second question | Assessment |
|---|---|
| Is KickChasers immediately clear? | Broadly: football stats/performance technology. The athlete is more dominant than the interface, so the operating model takes longer to understand. |
| Does it feel like Australian football? | Yes. The explicit eyebrow, club kit and surrounding product material establish it. |
| Is the hero strong enough? | Visually yes. Its product credibility is weaker than its campaign impact. |
| Too much text? | Not an excessive volume, but the intro combines four capabilities and a second slogan. One precise product sentence would be stronger. |
| Is the CTA obvious? | Yes. The green Get started button is conspicuous and visible in the first mobile viewport. |
| Is the primary product visual strong enough? | The portrait is strong brand imagery. It is insufficient as the only dominant first-view evidence of a technology product. |
| Too tall? | Desktop copy is reasonable. The portrait-plus-pillar sequence is too tall on mobile and tablet portrait. |
| Too busy? | No. This is one of the cleaner parts of the page. |
| Premium? | Promising, particularly desktop. Tight typography and a towering portrait feel less resolved on narrower screens. |
| Real? | Football-specific, yes. The illustrative athlete/club do not establish adoption or endorsement. |

| Hero quality | Desktop /10 | Mobile /10 |
|---|---:|---:|
| Hierarchy | 8 | 7 |
| Visual impact | 8 | 6 |
| Clarity | 7 | 6 |
| Product credibility | 5 | 4 |
| Premium feel | 7 | 6 |

Keep “Track the game. Know your impact.” and the primary CTA. A recommended shorter supporting sentence is: **“Track a player or team live, map the action, and turn the match into a performance card.”** This uses existing product claims; it is proposed copy, not an implemented change. Clarify who records the match when that product truth is confirmed rather than inventing an operating claim.

The desktop hero's 70px top padding is not the main problem. The right-hand image stays dominant into the single-player section while the actual UI is confined to the left half. End that dominance around the first meaningful product reveal, or let the interface expand across more of the page at that point.

On mobile, the copy is about 495px tall below a roughly 95px header, then the portrait figure adds about 643px. The first dedicated product section begins around 1,490px down before later image shifts. Keep the CTA where it is; reduce the portrait to a deliberate **300–360px crop** and bring compact product proof forward. At tablet portrait, replace the narrow centred 400px portrait column with an intentional wider crop or split composition.

## Section-by-Section Review

Heights are observed examples. Desktop measurements vary with viewport and loaded media; use the recommendations as design budgets, not fixed-height requirements.

### Header and product pillars

**Works:** recognisable logo, conventional actions, simple divider and useful Track / Map / Analyse / Create orientation. The four pillars are navigation, not customer proof.

**Weakness:** four navigation choices plus Sign In/Sign Up compete in the header. At tablet portrait the header is crowded; mobile labels are very small. The separate pillar block repeats the later walkthrough vocabulary.

**Composition:** the roughly 190px desktop pillar block can become 120–150px; mobile 160–190px is adequate. Keep 20–24px internal gaps. No screenshot here is necessary. Copy is already short. Keep static, retain one compact orientation row, and avoid turning it into another card grid. Merge its storytelling role into the core chapters rather than adding another explanation.

### Single-player tracking — “Every touch. Every part of the ground.”

**Works:** actual live totals, map and stat pad make the promise concrete. The paragraph is an appropriate length and the heading has football energy.

**Weakness:** the athlete competes with the screenshot. Desktop proof is only about 624×433px in a representative laptop layout; a large original UI becomes a compressed diagram. The headline wraps into three lines within the narrow column. Tiny underlined tags add density without much hierarchy.

**Height, spacing and media:** this chapter is roughly 1,475px at wide desktop and 1,278px in an initial mobile state, partly because the phone supplement is open. End the film stage before it or widen the proof area. Use one primary interface view and a compact phone inset/disclosure. Target a 220–300px mobile supplement if retained, rather than another roughly 493px block. Use 48–56px mobile section padding and 24–32px between text and proof. Retain the dark background; stronger separation is unnecessary once the layout opens up.

**Decision:** keep as core proof, with two short benefit annotations replacing four low-weight tags. Integrate it into the single narrative spine. Static media is sufficient; no floating or rotating interface.

### Team tracking — “One screen. Your whole team.”

**Works:** the numbered features now stand out, the demo shows a real sequence, and the full roster explains the product quickly. The navy band creates useful separation. “Every action in sequence” is more specific than generic ease-of-use copy.

**Weakness:** four benefit descriptions, a very large video, an open linked-device supplement and a coach photo create several competing beats. Desktop section height is roughly 2,300–2,400px. The video can occupy more than one viewport in height at full content width.

**Height, spacing and media:** keep the current 68px desktop / 44px mobile section padding. Do not tighten it indiscriminately. Constrain the desktop demo to approximately 900–1,150px wide or 70–80vh where practical, maintaining its aspect ratio and enough label readability. Use the full-size option for deeper inspection. On mobile, pair the overview with a focused selected-player/stat crop; full UI alone is too small to explain the interaction. Keep 24–28px from benefit row to video. Reduce the coach photo from 850px to around 550–650px or place it as an inset. Reduce its 50px top separation to 32–40px.

**Copy and grouping:** one 25–40-word explanation is enough. Retain four features if they remain short; reduce descriptions before cutting useful distinctions. Close or condense linked-device proof rather than allowing its approximately 525px mobile block to become another main section.

**Decision:** keep the chapter and action-led loop. Keep the human context, with less area. Merge linked tracking into supporting content. Motion should play when relevant, with native controls and a still fallback; pause offscreen.

### Five-step workflow — “One game. The whole story.”

**Works:** one sticky proof area is an effective way to explain progression without juggling multiple competing screens. Explicit step names orient the visitor.

**Weakness:** it repeats the surrounding page. Map and Analyse use the identical full screenshot, so a label change substitutes for a new visual insight. Five 60vh steps generate a roughly 3,200–3,700px desktop chapter. Tablet portrait can exceed 4,000px. Mobile stacks five images that appear again in dedicated sections.

**Height, spacing and media:** this is the largest pacing problem. Do not fix it by shaving 8px from article gaps. Remove its standalone duplication and absorb its verbs into tracking, mapping/analysis, summary and cards. If sticky storytelling is retained, make it the core container for those chapters and remove their duplicate standalone versions. Use three focused states at roughly 35–40vh of travel each. Replace the identical Map/Analyse overview with meaningful oval and Score Worm crops. Keep text-to-proof separation around 24–32px on narrow screens.

**Decision:** merge; do not retain both full tours. Keep the sticky technique only where it carries the selected core story. No extra full-page transition is required.

### Mapping / match intelligence — “Know where the game is being won.”

**Works:** the oval is one of the site's most distinctive assets. The centred composition provides variety and the promise is concise.

**Weakness:** the annotated promo is already a complete poster, with its own typography, glowing callouts and device frame. It is followed by another full mapping screenshot. The main chapter can approach 2,800–2,900px on desktop. On mobile the baked-in annotations are microscopic.

**Height, spacing and media:** retain one main composition around 1,000–1,200px wide, with the relevant oval/event or momentum area made large. Use two or three readable HTML annotations at 14–16px. Make the complete interface secondary. The existing large full-screen supplement contributes roughly 1,150px on wide desktop and about 337px on mobile. Default closed would help, but first remove narrative duplication. Reduce desktop section padding from 100px to 80–88px and heading-to-media gap from about 45px to 32–40px; mobile 48–56px and 24–28px respectively.

**Decision:** keep as a core differentiator; merge live analysis here. Existing short copy can stay. No additional glow or parallax. A brief event-placement demonstration or focused transition could explain the product if real captured material supports it.

### Match summary / performance rating — “The final siren. The full picture.”

**Works:** this is a logical outcome of live tracking. The summary and benchmark belong together. The desktop main/aside hierarchy is useful.

**Weakness:** two paragraphs repeat Review and Score Worm claims. Mobile puts the benchmark into a cramped two-column arrangement: the image is around 165×180px, and “Understand your performance” competes for space. The summary artwork itself contains cropped phone content; that is an asset limitation, not evidence of CSS clipping.

**Height, spacing and media:** approximately 1,000px desktop / 940px mobile is too much after the same summary has appeared in the workflow. Use 25–35 words total and one primary proof group. Aim for roughly 650–800px of proof area on desktop, with a shorter mobile composition and a legible selected result. Reduce 100px desktop padding to 80–88px, mobile 58px to 48–56px. Keep 32–40px between main proof and benchmark. On mobile either stack a focused benchmark crop or deliberately pair a concise label with a 160–190px image; do not squeeze a full explanation into that half-column.

**Decision:** keep, merged with performance context. Static presentation works; no new animated chart is needed for this page.

### Premium game cards — “Your performance. Your card.”

**Works:** gold gives the reward a different register. The finished card is personal, legible and aspirational. This is the clearest emotional payoff on the page.

**Weakness:** finished card, tall creator screenshot, promotional poster and sharing collage extend the chapter to roughly 2,200–2,500px. The creator shows a different card and statistics from the main finished card. Multiple examples are legitimate, but they weaken the implied one-performance journey. Audience and portal sections then dilute the peak.

**Height, spacing and media:** keep one large finished card, a clearly subordinate creator detail and an optional closed collection. Target 1,100–1,400px desktop / 850–1,150px mobile. Detailed direction appears below. Current paragraph volume can halve. The gold accent is enough separation; no glass stage or glowing pedestal is needed.

**Decision:** keep and move near the end. Remove the promotional poster and sharing collage from the default landing flow, retaining their assets. A single quiet reveal can improve the finale.

### Audience — “Your footy. From every angle.”

**Works:** four roles are easy to understand, and the unboxed layout provides visual rest.

**Weakness:** a large heading and another section spend roughly 500–580px confirming coverage already shown elsewhere. It offers no new visual proof.

**Height, spacing and media:** the role copy is already short. Reduce the container, not the type. Use a compact row with 56–64px desktop / 40–48px mobile padding, or integrate it with supporting features. A standalone treatment should occupy closer to 280–340px desktop / 360–420px mobile. No screenshots or motion needed. Preserve contrast with fine dividers and clear role names.

**Decision:** merge with compact supporting breadth before cards, or distribute roles beside the relevant proof.

### Beyond game day / portal

**Works:** match-day activity, leaderboards, history and team selection establish breadth. Team selection is particularly relevant to club identity.

**Weakness:** four large media rows restart the catalogue after the card reward. Desktop uses a 430px media slot per tile; mobile can devote up to 400px to each image. The first phone pair is about 163px wide per phone: visually tall, yet too small for embedded text. The chapter grows to roughly 1,600px desktop / 2,100px mobile.

**Height, spacing and media:** select one overview plus short capability summaries, or use smaller focused crops in an edited 2×2 group. Target 900–1,100px desktop / 900–1,200px mobile. Mobile individual media can be 180–240px tall, with the first pair capped around 240–280px. Put the benefit before the image so visitors know what to notice. Reduce desktop padding 100px to 72–80px; mobile 58px to 48px. Reduce row gaps 60px to 36–40px desktop and 38px to 28–32px mobile.

**Decision:** keep supporting breadth, merge audience here, reduce media count, move before Premium Cards. Keep one portal CTA. Static imagery is appropriate; no carousel or horizontal scroll is needed.

### Final CTA and footer

**Works:** green returns to action, the full-body player gives football closure, and the CTA is straightforward. The footer is appropriately plain.

**Weakness:** the small mobile athlete feels squeezed next to the copy. The final CTA is separated from the card payoff by substantial supporting material. “Bring your next performance into focus” adds another broad marketing phrase.

**Height, spacing and media:** roughly 610px desktop can become 500–560px when directly after cards. Existing 50–70px top / 65px bottom spacing is adequate. On mobile protect a 240–280px copy area and crop the athlete intentionally at the edge, or place it in a compact lower row. Keep the supporting copy to one direct sentence. Footer links need more comfortable mobile spacing, with essential targets around 44px high without enlarging every visual label.

**Decision:** keep. Merge it visually with the card ending through proximity. No new motion.

## Spacing / Vertical Rhythm

Observed total document lengths ranged from roughly **14,600 to 18,100px**, depending on viewport and when media settled. The settled mobile capture is **16,124px**, about nineteen 844px viewport heights. This is excessive for the amount of distinct story being told.

The important reduction is content duplication, not a universal negative margin. Team Tracking already has tighter, sensible spacing. A global squeeze would make its benefits cramped while leaving the long walkthrough intact.

| Area | Current tendency | Recommended spacing or budget |
|---|---|---|
| Hero headline → paragraph | Large display followed by broad gap | 24–32px desktop; 22–28px mobile |
| Paragraph → CTA | Clear but somewhat stretched | 24–30px; keep breathing room around action |
| Standard major chapters | 100px top and bottom desktop | 80–96px; use 96–112px only for a deliberate new act |
| Standard mobile chapters | Mostly 58px each side | 48–56px; keep Team's existing 44px |
| Section heading → proof | Often 44–45px | 28–36px; Mapping 32–40px desktop |
| Team features → demo | Around 24px | Keep 24–28px |
| Coach photo separation | 50px plus a large photo | 32–40px with smaller contextual image |
| Workflow | Five 60vh steps | No duplicate chapter; if retained, three 35–40vh states |
| Optional supplements | Four expanded blocks | Closed/compact; no full-screen default galleries |
| Portal row gaps | 60px desktop / 38px mobile | 36–40px / 28–32px |
| Cards → final action | Two major sections intervene | CTA immediately after the card chapter; 48–64px transition |

Use purposeful changes in density: active tracking proof, a calm outcome summary, a compact support beat, then a spacious collectible finale. Repeating identical 100px padding and white/muted slogans creates a template rhythm even when each individual gap looks tidy.

Retain 72–96px of separation between Team Tracking and Mapping if they become adjacent major chapters; reduce space *inside* each chapter first. The current intervening walkthrough makes that transition feel much farther apart than it needs to be.

## Screenshot / Media Treatment

The page contains 19 distinct static asset references, plus repeated workflow proofs. This is not a count of simultaneously visible images: fallback and CSS-hidden images also exist. The visible issue is repeated placements, not the mere existence of a large asset library.

Adopt three presentation roles:

1. **Product proof:** clean screenshot/video, one benefit, readable focus, consistent caption.
2. **Football context:** one athlete opening and one restrained coach/ground moment.
3. **Collectible reward:** one large finished card, with minimal surrounding UI.

| Media | Recommended treatment |
|---|---|
| Hero portrait/video | Keep right-side cinematic role on desktop; finish persistence around first product proof; intentional 300–360px mobile crop |
| Single-player interface | Increase desktop share beyond the half-column; focus stat/action/map on mobile |
| Phone tracker supplement | Compact inset or closed disclosure; remove duplicate status-bar emphasis |
| Team demo | Keep large and useful; avoid more-than-viewport height; mobile overview plus selected interaction focus |
| Linked-device artwork | Closed/compact supporting proof; do not make it a second hero |
| Coach photo | Keep context at 550–650px width or as inset; no parallax required |
| Workflow images | Remove repeated default placements; make Map and Analyse distinct if retained |
| Mapping promotional poster | Replace default explanatory role with clean product focus and readable adjacent annotations |
| Full mapping screen | One core placement, with full-size inspection available; avoid repeating directly under poster |
| Match summary | One selected outcome; consistent crop rather than multiple competing phone collages |
| Rating aside | Increase emphasis on selected rating/result; reduce cramped text/image split |
| Finished card | Main visual; about 420–520px desktop / 300–340px mobile |
| Creator screen | Subordinate, around 230–280px desktop; compact mobile detail rather than another long full screen |
| Card promo and sharing collage | Remove from default flow; optional collection only |
| Portal feed/match-day pair | One selected view or focused pair with a readable benefit above |
| Leaderboards | Crop meaningful leaders/result; reduce full-phone height |
| Player profile collage | One history/profile focus; avoid three tiny phones as proof of three separate claims |
| Team selection | Show the finished lineup/poster detail prominently rather than the entire creation page at 184px wide |
| Final player cutout | Deliberate edge crop or compact mobile lower-row composition |

At mobile, single-player renders around 343×238px from a 2360×1640px source; mapping around 343×257px from 2732×2048px. These communicate the UI's shape but cannot make every label readable. Increasing the entire screenshot height cannot solve this within a narrow screen. Crop to the important action and explain it in live text. Keep originals accessible for deeper inspection.

Device frames help distinguish phone contexts but waste space when repeated. Use them sparingly for portal/creator context; remove redundant frames from explanatory product proof. Use thin, consistent borders and restrained shadows. Do not add outer neon halos to already colourful UI. Almost full-width treatment belongs to one core tracking/mapping demonstration, not every supporting image.

## Typography

The italic uppercase display style supports sport and urgency. Its repetition makes all chapters sound equally emphatic. Arial/Helvetica body typography is serviceable, but the extremely tight headline spacing and repeated slogan construction lack a refined typographic hierarchy.

- Preserve the hero's force. Tune tracking around −0.035em to −0.045em before committing to the current −0.065em; visually verify the actual font and wrapping.
- Use uppercase italic for hero and selected chapter headlines. Use upright, mixed-case benefit headings and captions for contrast.
- Major desktop headings can remain roughly 44–58px; mobile 30–36px. Avoid reducing them simply to rescue an overfilled layout.
- Body text should generally be 16–17px desktop / 15–16px mobile with 1.6–1.75 line height and about 45–65 characters per line. Current 1.8 line height adds length to narrow paragraphs.
- Essential captions and navigation should not depend on 9–10px text. Use 12–13px for meaningful labels, while truly optional metadata can remain quieter.
- Keep the Team feature titles approximately 18–20px desktop / 16px mobile. They are already more visible; do not return them to thin underlined tags.
- Reduce repeated kicker/title/body/caption stacks when they all communicate the same point. Number chapters once; avoid four separate number systems implying competing sequences.
- A distinctive licensed sports display face could improve brand ownership later, but font replacement is not the first fix. Establish layout and editorial hierarchy first.

Recommended copy direction:

| Existing text | Tighter direction |
|---|---|
| Long hero capabilities + “story you share” | “Track a player or team live, map the action, and turn the match into a performance card.” |
| Team lead + repeated roster paragraph | “Switch players, record each action and keep the match in sequence.” Follow with only essential context. |
| Two summary paragraphs | “Review the score, player totals and quarter breakdowns in one match summary.” |
| Two card paragraphs including app action labels | “Your photo. Your club. Your match stats. Create a card worth keeping.” |
| “Your season keeps going after the siren…” | “Follow local footy, review your history and keep your squad connected.” |
| Final broad performance phrase | “Create your KickChasers account.” |

These are proposed edits using existing capabilities, not new product claims. “Post & Save,” “Advanced modifiers” and “Fantasy points” need plain context where they matter; do not force visitors to decode interface terminology to understand a benefit.

## Colour / Glow / Effects

Keep near-black, navy, green and the separate card gold. The restrained shell and mostly square actions work. The bright green should remain an action/orientation colour: primary CTA, active state, occasional section marker. It should not also illuminate every border, heading, caption and screenshot frame.

The main excess lives inside artwork: mapping callout glow, card particles, stadium lighting and the second card promo. On their own these can fit sports promotion; together they create competing campaign languages. Reduce their simultaneous exposure. Use clean mapping proof with readable annotations, and reserve the gold spectacle for one final card.

Keep the hero edge gradient where it supports text/image integration. Reduce any broad overlay that obscures product labels. Avoid extra vignettes around screenshots, glass panels behind copy, ambient green washes, glowing buttons or new particle effects. Fine navy dividers are sufficient for most separation.

## Motion Audit

| Existing effect | Decision | Reason and recommendation |
|---|---|---|
| Reverse scroll-scrubbed hero film | **KEEP / REDUCE extent** | Distinctive football campaign moment. Observed time changed from about 5.035s at top to 1.190s after scrolling 1,080px. End its visual dominance around first product proof; keep direct natural scrolling. |
| Hero sticky right-hand stage | **REDUCE** | Strong opening, but competes with the narrow player interface. Shorter persistence gives the product its own moment. |
| Mobile hero static poster | **KEEP, resize** | Appropriate calm fallback; reduce height rather than adding mobile scrub. |
| Team video autoplay loop | **KEEP / REDUCE incidental playback** | Shows real switching/sequencing. It was playing offscreen at page top and later near the mobile portal. Start when visible and pause offscreen; retain looping, controls and reduced-motion handling. |
| Five-step sticky proof | **KEEP concept / MERGE placement** | Sticky explanation helps; five 60vh stages duplicate the page. Use it only as part of the selected core narrative. |
| Instant workflow image swaps | **REDUCE abruptness / ADD focus** | Identical Map/Analyse screenshot teaches little. Use different crops and a short 150–220ms transition where needed. |
| Smooth anchor scrolling | **KEEP** | Supports navigation; retain reduced-motion override and avoid prolonged travel. |
| Brief hover / active-colour transitions | **KEEP** | Useful affordances, restrained duration. |
| Disclosure state indicator | **KEEP** | Communicates expanded state. Prefer closed supporting galleries. |
| Duplicate mobile walkthrough screenshots | **REMOVE duplicate presentation** | This is repeated static content, not an animation defect. Remove if core feature chapters remain. |

**ADD:** at most one subtle card reveal/settle as the emotional finale. An opacity reveal with 8–12px movement over roughly 180–240ms is sufficient, once per entry and disabled for reduced motion. This is a proposal, not an existing effect.

No endless floating elements, rotating screens, cursor glows, automatic horizontal carousels, scroll locking or broad entrance choreography were observed in the current landing. Do not “fix” effects that are not present. Do not add motion to every heading or portal tile.

The team video is about 25.82MiB and 41.46 seconds. `preload="metadata"` does not prove a full eager download; streaming, network and frame performance were not benchmarked. Confirmed offscreen playback justifies visibility-based playback and a later media delivery check. The hero film is about 4.05MiB with a 1.40MiB poster. Performance recommendations here are limited to what affects visual pacing and the observed playback behaviour.

## Repetition / Clutter

The central repetition is structural:

- Team tracker appears in its dedicated chapter and again in Track.
- The same mapping screenshot appears in Map, Analyse and the full-screen mapping supplement, with additional imagery inside the promo poster.
- Summary appears in Review and the summary chapter.
- Finished card appears in Create and the card chapter, followed by another card advertisement.
- Track / Map / Analyse / Create appears in the pillar navigation, workflow and chapter messaging.

Choose **one proof per promise**. Keep a compact jump row, then let dedicated chapters tell the sequence. Remove the separate five-step repetition. If a sticky walkthrough is preferred instead, it must replace the duplicate chapters rather than sit between them.

All four supplements are open by default. Mobile measured heights are approximately 493px phone tracker, 525px linked devices, 337px full mapping screen and 889px card collection. Closing secondary material would remove roughly 2,000px from default mobile flow, before any structural editing. That is a useful cleanup, but it cannot substitute for choosing a coherent narrative.

Local choice sets are generally manageable: four pillars, four team benefits, four audiences and four portal examples. The main cognitive load is sequential repetition and abbreviation-dense imagery, not one enormous feature menu.

Persona red flags:

- **Jordan, first-time visitor:** the athlete communicates ambition before the first usable product proof; “who records this?” remains ambiguous. Bring a concrete product sentence and selected interface forward.
- **Casey, distracted mobile visitor:** a 643px portrait, five repeated proof screens and long portal rows ask for too much attention. Preserve the first-view CTA and shorten the route to evidence.
- **Riley, sceptical evaluator:** one recurring sample player and inconsistent card stats look demonstrative. Keep example data consistent through the story; use actual attributable proof only if supplied.

## Section Order

Preferred exact order:

1. **Hero:** what KickChasers is, football identity, main CTA; compact pillar navigation within this opening.
2. **Single-player tracking:** one clear live-action/map proof.
3. **Team tracking:** sequencing video, concise benefits, small coach context; linked devices optional.
4. **Mapping + live match intelligence:** oval, event location, Score Worm/momentum focus.
5. **Match summary + performance context:** concise final-siren result.
6. **Beyond game day:** compact portal breadth with audience roles integrated.
7. **Premium performance cards:** finished card as the final major demonstration, small creator proof.
8. **Get started CTA + footer.**

Remove the standalone five-step workflow from this order and absorb its sequence into chapters 2–5 and 7. This keeps the core progression requested in the brief while placing supporting features before the reward. A sticky transition may live within Mapping/Analysis; it should not create another full tour.

## Premium Game Cards

This should feel like the match becoming something you own. Currently it feels like a large feature gallery with an extra advertisement attached.

Give one finished card the dominant position. Use a 420–520px desktop card, a 230–280px creator detail and enough empty dark space to show their hierarchy. The creator should explain how the reward is made; it should not become an equally tall second destination. If using overlap, keep it slight—roughly 24–40px—and never obscure card name, rating or key statistics. The current side-by-side layout can also work without overlap; spectacle is not mandatory.

On mobile, present one 300–340px finished card. Follow with a compact creator crop showing the relevant controls or a closed detail. Do not stack the full tall creator screenshot, a premium promo poster and a sharing collage after it. Keep approximately 28–36px from heading/copy to card, and 24–32px between reward and creation proof.

Maintain one performance example through summary → creator → finished card where source material supports it. The current 9.2 finished card and 8.9 creator example are not inherently wrong, but they weaken continuity. Do not fabricate statistics to force consistency.

Keep gold as the chapter accent on a near-black field. Reduce surrounding spark/particle competition; the artwork already contains enough. One short line about photo, club and real match stats is stronger than operational instructions about Album and Post & Save. Put those details in subordinate copy.

Move the chapter after supporting portal content and directly before the final CTA. The emotional arc should be **ambition → action → insight → ownership → start**, with no new catalogue after ownership.

## Mobile / Responsive

| Viewport | Observed composition | Priority |
|---|---|---|
| 1920×1080 | Powerful large portrait; product left column feels subordinate; very long total story | Give product proof more width and edit repeated chapters |
| 1366×900 | Hero CTA stays visible; tall team/mapping/card sections dominate scroll | Constrain media height and collapse supporting material |
| 1024×768 landscape | Desktop sticky pattern still active; crowded header and limited usable vertical space | Shorten sticky travel and protect proof from header interference |
| 768×1024 portrait | Stacked hero with narrow centred portrait; static five-step tour becomes very long | Design an intentional tablet crop; remove duplicate static tour |
| 390×844 mobile | CTA visible; portrait delays product; dense screenshots and long supporting rows | Bring proof forward, crop for meaning, reduce page length |

No horizontal document overflow or major overlapping layout obstruction was observed at these sizes. This does not verify every intermediate breakpoint. A source-only 761–767px navigation breakpoint discrepancy was noted; verify that narrow range during implementation QA before treating it as a confirmed defect.

Mobile headline wrapping is forceful but takes four lines; keep it legible rather than forcing a two-line desktop composition. The CTA can remain primary with a quieter secondary link; stack only if width requires it. The main issue is what follows the CTA, not its visibility.

Keep mobile free of hero scrub, long pinned walkthroughs, horizontal storytelling and image parallax. Retain static poster and reduced-motion fallbacks. Team autoplay can remain muted and inline when visible, with controls; its small full-screen interface needs adjacent explanatory focus. Do not replace the footage's own sequence with decorative motion.

Portrait tablet needs its own treatment: a 400px-wide 9:16 image floating in a much wider column wastes horizontal opportunity. Use a deliberate landscape crop or balanced split. On mobile, use full-width **focused** product proof, not a series of full-width **complete** desktop interfaces.

Evidence: [tablet portrait hero](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/768-hero.jpg), [mobile core sequence](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/390-detail-0.jpg), [mobile repeated workflow](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/390-detail-1.jpg), [mobile card/portal transition](/Users/jackpenfold/Projects/kickchasers/docs/landing-qa/visual-critique/390-detail-2.jpg).

Limits: IAB viewport emulation, not physical touch hardware; no connection throttling or full accessibility conformance testing. Reduced-motion paths were read in source, not separately emulated. No adoption claims, image provenance or authenticated functionality were verified.

## Keep / Reduce / Merge / Remove

### KEEP

- Football-specific hero identity and clear green CTA.
- Single-player tracking proof and team sequencing demo.
- Oval mapping, match intelligence and summary outcomes.
- One coach/ground context image.
- Finished premium card, gold accent and final CTA.
- Restrained ink/navy shell, fine dividers, user motion controls and static fallbacks.

### REDUCE

- Mobile hero portrait height and desktop persistence into product proof.
- Number of default visible screenshots and full-phone compositions.
- Team demo's overwhelming desktop height, without sacrificing readability.
- Caption/kicker stacks, repeated italic slogan pairs and long paragraphs.
- Portal media area, card creator scale and ambient playback outside view.
- Embedded promotional glows and repeated particle-heavy artwork.

### MERGE

- Five-step workflow into the actual product chapters.
- Mapping and live analysis into one strong intelligence chapter.
- Summary and rating/benchmark into one outcome composition.
- Audience roles into compact supporting portal breadth.
- Linked-device evidence into a compact optional team detail.

### REMOVE

- Standalone duplicate walkthrough if dedicated chapters remain.
- Repeated identical full mapping placements in the default story.
- “NEW PREMIUM CARDS” poster and sharing collage from default landing flow.
- Expanded-by-default secondary galleries.
- Decorative framing that makes a screenshot smaller without explaining device context.

“Remove” means remove the default page placement, not delete asset files or product capabilities.

## P0 Changes

**No confirmed P0 visual blocker was found.** The CTA is visible, the page renders, and no major layout obstruction or sideways overflow was observed at the five required sizes.

Do not inflate pacing and taste issues into showstoppers. The page still falls short of the requested premium standard because the P1 issues materially weaken clarity and perceived quality. This is not certification of untested functionality or accessibility.

## P1 Changes

Scope estimates describe the work area, not a delivery commitment.

| Section | Problem | Recommended change | Why | Approximate scope | Expected impact |
|---|---|---|---|---|---|
| Entire story | 15–18kpx of repeated promises and media | Choose dedicated chapters as the spine; absorb standalone workflow, close supplements, cut duplicate placements | Visitors should see progress rather than another explanation of the same screen | Medium: page composition and selected copy; no new functionality. Use Impeccable distill/shape | Very high: shorter, more confident narrative |
| Hero / mobile | Full portrait delays meaningful product proof | 300–360px intentional portrait crop; product sentence and selected UI proof earlier; tablet-specific crop | Establish technology credibility while preserving sports identity | Medium: responsive hero/media layout. Use adapt | High: faster comprehension and stronger mobile first impression |
| Single-player / mapping / summary | Full desktop UIs shrink to unreadable mobile diagrams | Focused crops plus readable adjacent labels; one full overview where useful; reduce device-frame waste | Each proof must visibly support its claim without requiring zoom | Medium–large: responsive media direction across core chapters. Use adapt/layout | Very high: product understanding |
| Cards / lower-page order | Reward followed by another catalogue | Move compact support before cards; one hero card, subordinate creator, immediate CTA | Preserve the emotional peak and a decisive ending | Medium: reorder and compose existing content. Use shape/distill | High: premium feel and clearer action |

## P2 Polish

| Section | Problem | Recommended change | Why | Approximate scope | Expected impact |
|---|---|---|---|---|---|
| Global type | Repeated aggressive slogans and tiny meaningful labels | Tune headline tracking; upright benefit headings; 12–13px essential labels; shorter copy | Create hierarchy through contrast rather than constant volume | Small–medium: type and copy pass. Use typeset/clarify | Medium–high |
| Product media | Raw captures, phone frames and promos lack common direction | Establish three media roles, consistent captions/borders, intentional crops | Makes the page feel authored as one campaign | Medium: presentation rules and selected artwork treatment. Use polish | High |
| Section spacing | Uniform large padding plus huge supplements | Apply differentiated 48–96px rhythm and 24–40px local gaps after structural edit | Preserves whitespace while restoring momentum | Small–medium: CSS spacing pass. Use layout | Medium |
| Team video | Confirmed playback when far offscreen | Play when visible, pause offscreen; review encoding/delivery without changing the loop's content | Keeps motion attached to the story and avoids unnecessary playback | Small–medium: playback lifecycle and media check. Use optimize | Medium |
| Mapping transition | Same image for Map and Analyse | Distinct focused views, optional 150–220ms transition | Makes motion explanatory | Medium if captured crops suffice. Use animate | Medium |
| Cards | Large creator/galleries compete with reward | Reduce creator scale, coherent example, optional single card reveal | Makes the result feel collectible | Small–medium: composition, no invented stats. Use quieter/polish | High |
| Header / footer | Tiny mobile navigation and tight link spacing | Comfortable hit areas, clearer wrapping; verify 761–767px range | Improves responsive finish without a new navigation system | Small: responsive refinement. Use adapt/polish | Medium |
| Final CTA | Cramped mobile cutout and generic supporting line | Deliberate crop, stronger copy area, one direct sentence | Cleaner ending | Small: layout/copy. Use polish/clarify | Medium |

Within this requested P0/P1/P2 plan, the last two rows are lowest-priority finishing work. Do the structural changes before these details.

## Recommended Final Page Structure

Aim for **eight major chapters including hero and final CTA**, with compact navigation and footer outside that count. Use approximately **six major product proof compositions**, one team video and no more than two football-context moments. A composition may contain a small supporting crop; it should still make one main point. Do not count every device within a collage as another necessary proof.

Initial length budget: **roughly 8,000–10,000px desktop and 8,000–10,000px mobile**, then adjust to actual content rather than adding spacer height. A shorter mobile target is possible if the creator/portal are particularly selective. The goal is about 35–45% less default scroll, not an arbitrary pixel quota.

| Chapter | Main visual | Pacing |
|---|---|---|
| Hero | Athlete film/poster plus early compact product cue | Cinematic opening, clear action |
| Player tracking | One selected tracking/map proof | Direct, concrete |
| Team tracking | Sequencing video; small coach context | Active product demonstration |
| Mapping / intelligence | Oval focus and one momentum result | Only potential sticky explanatory sequence |
| Match summary | Score/totals/benchmark composition | Calm visual rest and outcome |
| Beyond game day | Edited portal overview + short roles | Compact breadth, no catalogue restart |
| Premium Cards | One finished card, small creator detail | Spacious, aspirational finale |
| CTA / footer | Action and restrained player accent | Decisive close |

## Ideal Motion Plan

1. **Opening:** retain reverse hero scrub on eligible desktop screens. Keep the still-image control and reduced-motion poster. Set a shorter narrative boundary around the opening/product reveal rather than keeping the athlete dominant through the entire player explanation.
2. **Team:** keep muted looping captured action with native controls. Activate around visibility, pause offscreen. Do not add a floating tablet or constant scale animation.
3. **Mapping/intelligence:** one optional sticky sequence showing oval/event focus, then Score Worm/momentum. Natural scroll, two or three purposeful states, short transitions. No duplicate full walkthrough elsewhere.
4. **Summary and supporting breadth:** static. These sections should let the visitor absorb the evidence.
5. **Cards:** one optional subtle reveal of the finished card. Keep it still afterwards so the details can be appreciated.
6. **CTA:** immediate, static and legible. Retain restrained hover feedback.

Disable pinned storytelling, scrub and parallax on mobile. Respect reduced motion throughout. Avoid animation on every card, repeated entrance reveals, endless pulsing, rotating screens, simulated cursor trails and horizontal scroll experiences.

## Final Design Direction

The finished page should feel like a precise match-day instrument with an emotional football reward. Lead with an athlete and ambition, prove the live workflow, show the intelligence, give the visitor a calm result, briefly establish wider usefulness, then finish with ownership of a performance card.

Its premium quality should come from readable product evidence, controlled scale, consistent media direction and the confidence to leave material out. Keep the ink/navy palette, green action language, football oval, club identity and gold collectible moment. Give dramatic imagery a few deliberate appearances rather than making every chapter cinematic.

The next step is to approve a cleanup brief limited to the P1 narrative edit and responsive media plan, followed by P2 polish. Build in that order: structure → media composition → spacing/type → motion refinement → one bounded five-viewport verification. Preserve assets and product capabilities; avoid adding new functionality during this cleanup.

Design decisions to settle before implementation: dedicated chapters versus a replacing sticky narrative; existing typography refinement versus a later display-face exploration. The recommended choices are dedicated chapters with one compact mapping sticky moment, and refinement of the existing type first.

# Cleanup Implementation Result

Implemented 8 October 2026. The user approved dedicated product chapters, one compact Mapping sticky moment and refinement of the existing type system. Full implementation record: [LANDING_PAGE_CLEANUP.md](LANDING_PAGE_CLEANUP.md). Rendered evidence: `docs/landing-qa/cleanup/`.

## Recommendations implemented

- Removed the duplicate five-stage walkthrough from the live route and consolidated audiences/supporting features.
- Reordered the narrative: **Hero → Single Player → Team → Mapping / Intelligence → Match Summary → Supporting Features / Audiences → Premium Cards → CTA / Footer**.
- Enlarged desktop Single Player and Summary proof, tightened chapter spacing and shortened copy. Standardised restrained media framing and refined existing typography without changing fonts or palette.
- Retained Team's strong composition and loop, with offscreen/document-hidden/reduced-motion/manual-pause handling.
- Used one Mapping asset in a compact two-state sticky composition, with a static fallback. Removed duplicate mapping views from default flow.
- Made the finished gold Premium Card dominant, creator subordinate, and Cards the final major product demonstration. Removed the promotional poster from default flow.
- Added intentional mobile CSS crops and access to original assets; shortened hero media to 330px, improved navigation/footer spacing and checked horizontal overflow.

## Recommendations intentionally not implemented

No new display font, long replacing sticky narrative, optional Card reveal, additional parallax or invented product UI. Cards are deliberately static because Hero, Team and Mapping provide sufficient motion. Dense source screenshots were not edited or re-created. Original files remain accessible. No unrelated app or backend work was performed.

## Live-flow removals and asset preservation

The five-step walkthrough is no longer rendered. Standalone audience and large portal/catalogue galleries were merged into one compact section. Mapping promotional artwork, NEW PREMIUM CARDS poster and repeated sharing/feature galleries no longer appear by default. Secondary phone, linked-device, benchmark, profile and team-selection examples are closed disclosures.

Every source asset and manifest entry is preserved, including duplicate mapping artwork, older promotional images and all landing screenshots/videos. The unused walkthrough component remains in the repository. No media was re-encoded and no dependency was added.

## Structural and responsive comparison

Previously the live flow contained roughly twelve large blocks, a five-stage duplicated narrative and several open secondary galleries. It now has eight primary chapters, with supporting proof closed by default.

| Viewport | Critique baseline | Cleanup | Approx. reduction | Overflow |
|---|---:|---:|---:|---:|
| 1920 × 1080 | 18,109px | 9,250px | 49% | 0px |
| 1366 × 900 | 16,788px | 8,709px | 48% | 0px |
| 1024 × 768 | 14,758px | 7,923px | 46% | 0px |
| 768 × 1024 | 16,020px | 6,987px | 56% | 0px |
| 390 × 844 | 16,124px | 7,644px | 53% | 0px |

The approximately 50% overall reduction is greater than the initial 35–45% estimate because entire duplicated sequences were removed; larger desktop product proof was retained. Baselines come from archived settled critique captures, so values are approximate.

All five sizes were visually inspected in the browser, followed by one correction batch and final confirmation. Product chapters are clearer, the first mobile proof arrives sooner, mobile media communicates selected meaningful UI, Cards finish the story, and no horizontal overflow was measured. Portrait/mobile Mapping is static. Dense app UI cannot all be legible simultaneously on a phone; focused crops and original-image access address this without modifying screenshots.

## Motion changes

Retained reverse Hero scrub within the shortened opening and Team's muted inline loop. Removed the redundant animated walkthrough. Added one controlled Mapping focus transition across two short explanations; natural scrolling remains intact. Team playback was observed in view and paused offscreen. Summary, supporting features, Cards and CTA are static. Reduced-motion policies are covered by source/tests; OS preference switching on a physical device was not tested.

## Validation and remaining issues

Focused landing/hero tests **16/16**; full suite **456/456**; typecheck, production build and `git diff --check` passed. All visible media references resolve. Primary CTA remains `/sign-in?redirect=%2Fdashboard`, with no active `/new` CTA or broken landing anchors. No backend changes.

Production main JS is 1,751.40kB (485.34kB gzip), CSS 202.82kB (31.63kB gzip). Existing caniuse-lite age, large-chunk and React development `fetchPriority` warnings remain. Media size/encoding is unchanged. App-wide splitting/dependency updates were outside scope.

Post-cleanup design assessment: **81/100 visual quality**, **3/10 AI-slop risk**. This reflects improved structure, product emphasis and restraint rather than a new aesthetic. Remaining visual limitations: dense legacy UI on small phones, limited table detail in the current Summary collage and different example performances across card assets. Purpose-captured, consistent future source assets would improve those details. Physical-device and throttled-network checks remain before full launch sign-off. No further redesign was started.
