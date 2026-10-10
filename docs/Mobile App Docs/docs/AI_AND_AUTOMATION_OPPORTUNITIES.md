# AI and Automation Opportunities

Last verified: 2026-07-23
Source of truth: current dependencies, routes/components, Supabase migrations/functions/configuration, and content-generation code

## Implemented AI

None found.

KickChasers does not currently call a language, speech, vision, or recommendation model. Match recaps/captions are deterministic templates derived from structured data. Leaderboards, benchmarks, influence, momentum, and Impact7 are rule-based calculations. Supabase Studio's local OpenAI-key configuration is developer tooling and is not an app integration.

## Technically supported but not exposed

- A legacy `single_player_voice` entitlement identifier exists, but there is no audio capture dependency, voice UI, speech service, command parser, or correction workflow.
- Structured match events, stat definitions, summaries, and templates provide clean inputs for future assistance, but no model-facing service or data boundary exists.
- Products, prices, subscriptions, and entitlements could gate future capabilities, but the commerce and enforcement path is not implemented.
- Admin/moderation workflows provide human review surfaces, but no agent runtime uses them.

## Proposed product automation

### Voice-assisted stat capture

Use a constrained vocabulary and explicit confirmation/correction rather than open-ended dictation. Test in real ground noise and preserve fast tap fallback. Required decisions include consent, audio retention, latency, offline behaviour, player-name disambiguation, and responsibility for incorrect stats.

### Assisted match reports

Generate a draft only from cited match facts: score changes, quarter splits, leaders, field zones, and user-approved context. The UI should show the source stats and require a human to approve publishing. Measure factual error rate and edit distance, not just generation volume.

### Data-quality assistance

Flag likely duplicates, impossible sequences, missing squad mappings, guest/link inconsistencies, and abnormal stat outliers. Prefer deterministic checks first; use models only where they add measurable recall without auto-mutating records.

### Support and moderation assistance

Summarise reports, group duplicates, and propose response categories for a platform administrator. Maintain human decisions for hiding content, account actions, official status, or safety escalation.

### Awards workflow assistance

Check missing assignments, duplicate cards, incomplete voting, guest/player mapping, and publication readiness. Draft reminders from deterministic state. Do not infer votes, change entries, or publish outcomes autonomously.

## Proposed development and product-operations automation

### Product analytics and growth experiments

Define and validate an event dictionary, detect funnel regressions, segment tracker/player/supporter behaviour, and draft experiment readouts. An assistant can prepare experiment plans and guardrail checks, but exposure assignment and decisions need an owned analytics system and human approval.

### Marketing production and content creation

Turn approved product facts, match assets, and release notes into channel-specific draft copy, screenshot lists, or campaign variants. Generated marketing must not invent performance claims, testimonials, live metrics, or club endorsements.

### Competitor monitoring

Periodically summarise public release notes, pricing, store listings, and product changes with dated source links. This is external research, not an in-product feature, and results must distinguish observed facts from interpretation.

### Support-ticket and App Store review analysis

Cluster issues, identify recurrent device/version patterns, redact personal data, and propose backlog themes. Access and retention must be tightly scoped because tickets and reviews can contain sensitive player information.

### UX audits

Run scripted route/device walkthroughs, capture screenshots, compare states, and report accessibility or interaction regressions. Human review remains necessary for sideline usability, noisy environments, and tablet orientation.

### Release notes and release readiness

Generate draft notes from an approved diff, reconcile version/config values, and assemble evidence for build, link, push, migration, and store checklists. Automation must not submit builds or change store state without explicit approval.

### Regression testing

Generate and maintain cases for auth gates, tracking sequences, scoring, undo, reconnect, linked-side writes, summary totals, awards, and deletion. Prefer deterministic fixtures and database-policy tests over model judgement.

### Security review

Inspect diffs for authorization changes, broad grants, unsafe Security Definer functions, public storage exposure, secret handling, and account-deletion regressions. Findings require validation; an assistant should not silently mutate production policy.

### Database migration review

Compare ordered migrations with generated types, snapshots, repositories, RLS, grants, triggers, and rollback implications. Automation can flag drift and unsafe locks/data rewrites but cannot prove production parity without environment access.

## External operational agents

No external agents are implemented. Potential future agents could:

- prepare club onboarding checklists and identify missing directory data;
- monitor migration/type drift and release-readiness evidence;
- triage support requests into known product areas;
- assemble a weekly data-quality report;
- draft outreach for opted-in clubs after human approval.

Club outreach must use consented contact data, honour opt-out/suppression lists, avoid contacting minors, and keep a human approval step. Product analytics, growth, marketing, competitor monitoring, ticket/review analysis, UX audits, release work, testing, security, and migration review are all operational opportunities—not capabilities shipped in the KickChasers app.

Every external action needs least-privilege access, an audit trail, idempotency, explicit approval boundaries, and a way to reverse or escalate. Agents should not autonomously change roles, official status, moderation state, payments, or player records.

## Recommended sequence

1. Establish privacy rules, data provenance, tests, and product analytics.
2. Add deterministic data-quality checks.
3. Run a tightly scoped voice prototype with trackers.
4. Trial cited, human-approved match-report drafts.
5. Consider operational agents only after permissions and review queues are mature.

See [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) for dependencies, risks, and measures.
