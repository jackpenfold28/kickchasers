# 2027 Pricing Design Preview

## Scope

Frontend presentation only, using the user-provided proposed 2027 feature decisions. Landing retains its existing four-card pricing location. `/pricing` adds the same cards followed by the complete comparison and optional Live Squad Pass explanation. The landing comparison link avoids placing 57 feature rows into the product story. No surrounding landing sections were changed in this pass.

The existing `pricing-plans.ts` remains untouched. The new `pricing-preview-2027.ts` is explicitly presentation-only and is imported only by the pricing UI and its tests; it must never determine production entitlements.

## Source review and conflicts

The requested `docs/KICKCHASERS_2027_MASTER_ROADMAP.md` and `docs/roadmap-2027/KC-2027-01-DESIGN-BRIEF.md` are absent from this checkout. A search of existing Markdown documentation found no 2027/Tracker Pro/Live Squad Pass decisions. Roadmap alignment could not be verified; no roadmap was created or modified.

The current public configuration uses Player, annual pricing and older inclusions (including a four-row comparison). This preview instead displays the user's proposed Tracker Pro name, monthly-only prices and detailed 2027 inclusions. These are deliberate presentation differences, not changes to production access or the old pricing configuration.

## Presentation

- Free: $0/month AUD; basic entry-level tracking.
- Member: $5/month AUD; live match scores and statistics.
- Tracker Pro: $15/month AUD; advanced tracking, 24 tracked players per game and unlimited personal squads. Restrained green top rule and existing italic price typography.
- Club: $99.95/month AUD; official club operations. Neutral top rule and a clearly planned Coaches Corner feature.
- The optional Live Squad Pass is $25 per squad, per season, separate from Tracker Pro's monthly price. Its detailed explanation includes the 25-member cap including guests, 24 tracked players, seasonal validity, separate passes and official broadcasting distinction. It is not a fifth plan.

Cards have short feature lists and aligned detail links. The existing `/sign-up` account link remains; per-plan actions now say “View … details”, taking users to the public comparison with the chosen tier. There is no plan activation, saved purchase selection or checkout. Preview and current launch-access copy make this explicit.

## Complete comparison

57 rows across six categories: core tracking/statistics; performance/player development; cards/sharing; Match Day/live statistics; personal squads/management; coaching/club tools/reports. Native disclosures retain complete data; the first category starts open. Text accompanies inclusion indicators. Planned features show “Coming 2027”; undecided Evolution access shows “Under review”.

Free/Member squad count and guest access are under review. Their proposed “Up to 5” membership values retain an asterisk and explicit product-confirmation footnote. Live-stat exceptions for Free squad members with an active Live Squad Pass are preserved. Following and notifications are separated into “Free for everyone”. Published training-plan viewing remains free subject to squad membership and visibility permissions, with planned administration reserved for Club and appropriate roles.

## Responsive and accessibility

Four cards on wide desktop, two below 1100px, one below 600px. Below 900px, a labelled native select shows one comparison tier alongside feature labels, using the same data rather than forcing a horizontally scrolling table. Category disclosures and plan selection are keyboard-operable; controls have visible focus and 44–48px minimum targets. Native summary indicator transitions are 160ms, immediate on keyboard focus and disabled for reduced motion. No entrance animation or new animation dependency.

`/pricing` is registered as an informational route outside the authenticated app outlet. Authentication implementation, session rules and existing protected routes are untouched.

## Validation

- Full suite: 505 tests passed, including six focused 2027 pricing tests and retained legacy commercial-configuration tests.
- TypeScript: `npm run typecheck` passed.
- Production build passed, output directed outside the repository's `dist`.
- `git diff --check` passed.
- Rendered desktop at 1440×1200; tablet at 1024×768 and 768×1024; mobile at 390×844. Four cards/six categories verified. No horizontal overflow in checked views.
- Browser verified landing comparison link, public direct route, per-plan detail navigation, mobile plan switching and category expansion.
- Evidence in `docs/pricing-2027-qa/`: desktop cards/comparison, tablet cards, mobile cards/comparison.
- No lint script is configured. Physical-device and screen-reader testing were not performed.
- Existing production-build warnings: outdated Browserslist data and bundle chunks exceeding 500 kB.

## Boundaries

No payments, purchases, subscription permissions, feature access, authentication implementation, Supabase calls, RLS, migrations, backend changes or dependencies added. No subscription discovery audit or master-roadmap edit performed. Existing unrelated uncommitted workspace changes remain intact.

## Follow-up: restored yearly pricing and restrained cards

At the owner's subsequent request, the preview now supports Monthly/Yearly again. Restored the original annual totals: Free $0, Member $39.95, Tracker Pro (previously Player) $84.95, Club $999.95; savings 33%, 53% and 17% respectively. This supersedes the initial monthly-only presentation requirement. Monthly totals and all 57 feature rows remain unchanged. The Live Squad Pass remains $25/squad/season.

Cards now use quiet borders, smaller corner radii, italic plan/price typography, consistent price alignment, flat feature lists and simple footer detail links. Tracker Pro has a small Recommended label/top rule. The existing green account CTA remains primary. Reused 160ms interruptible price transitions and added a 180ms toggle thumb; keyboard actions are immediate and reduced-motion removes translation. Annual detail links preserve the billing view through a presentation-only query parameter.

Validation: 508 full-suite tests and production build/typecheck passed. Browser checked annual totals, keyboard transition suppression and 390px mobile overflow. Screenshot: `pricing-2027-qa/refined-yearly-cards.png`. No purchases, permission changes or backend changes.
