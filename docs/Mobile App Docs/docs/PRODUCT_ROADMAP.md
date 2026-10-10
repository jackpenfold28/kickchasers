# Product Roadmap

Last verified: 2026-07-23
Source of truth: gaps confirmed in current routes/components, configuration, migrations, and the audited feature matrix

This is an evidence-based planning frame, not a delivery commitment. “Now/Next/Later/Exploratory” expresses dependency order rather than dates.

## Now

### Correct the match-data privacy boundary

- Problem/user: authenticated users can read match and squad records beyond the product relationships shown in the UI; this affects every player, squad, and club.
- Evidence: baseline `read_*_any_authenticated` RLS policies remain on `games`, `events`, `game_players`, `game_squads`, and `squads`.
- Dependencies: decide public/follower/member/participant visibility semantics; inventory every dependent query and Security Definer RPC.
- Risks: tightening policies without query coverage could break feeds, leaderboards, Match Day, share cards, and admin support.
- Measure: policy tests cover anonymous, unrelated authenticated, follower, member, tracker, coach, and platform-admin roles; zero unintended cross-user reads.

### Restore schema and type trust

- Problem/user: engineers cannot safely reason from the checked-in snapshots/types.
- Evidence: 131 ordered migrations include tables/columns/RPCs absent from the dated schema snapshots and generated TypeScript file.
- Dependencies: a reachable canonical environment, repeatable type generation, and a snapshot ownership decision.
- Risks: generation from the wrong environment can encode drift rather than remove it.
- Measure: generated types match the canonical schema in CI; every snapshot states provenance/date or is removed.

### Establish a release-quality safety net

- Problem/user: tracker, scoring, account, and permission regressions can reach users without automated detection.
- Evidence: no first-party test files or CI workflow were found.
- Dependencies: testing stack choice, seeded auth fixtures, local Supabase in CI, and core acceptance scenarios.
- Risks: brittle UI-only tests produce noise; database tests must cover policy semantics.
- Measure: protected checks cover auth gates, event/undo/scoring, offline replay, linked-side writes, awards voting, notifications, and account deletion.

### Verify production integrations and public handoff

- Problem/user: users can encounter broken push, OAuth, linked tracking, update prompts, Android links, or shared-game links.
- Evidence: configuration exists, but secrets/device/store state are external; `/share/game/[id]` is auth-gated; remote association files are outside the repo.
- Dependencies: staging/production credentials, physical devices, store records, a public-view privacy decision, and deployed Realtime inspection.
- Risks: link fixes can unintentionally expose match data; test pushes can notify real users.
- Measure: signed test matrix for iOS/Android/web covering auth, push, Realtime, update URLs, and every supported deep link.

## Next

### Add privacy-safe product analytics

- Problem/user: the team lacks reliable activation, retention, and funnel evidence for product and commercial decisions.
- Evidence: Sentry error telemetry exists, but no product analytics SDK or event taxonomy was found.
- Dependencies: metric definitions, consent/privacy review, identity rules, retention policy, and vendor/build decision.
- Risks: collecting player/minor data without strict minimisation; confusing admin aggregates with behavioural analytics.
- Measure: trusted dashboards for activation, weekly tracking, squad adoption, retention, sharing, and voting completion.

### Prototype voice-assisted tracking

- Problem/user: rapid match logging is attention-intensive for trackers.
- Evidence: there is no voice screen, recording dependency, parser, or service; only a legacy `single_player_voice` entitlement enum remains.
- Dependencies: constrained command vocabulary, correction flow, latency target, noisy-ground tests, consent, retention, and offline/failure behaviour.
- Risks: incorrect attribution damages stat trust; audio privacy and cost; hands-free interaction can be less safe than fast taps.
- Measure: error rate, corrected-command rate, median capture latency, abandoned sessions, and preference versus tap input in field trials.

### Complete awards visibility

- Problem/user: players can participate in Best & Fairest voting but cannot see a coherent awards history from their profile.
- Evidence: voting, public cards, tally and breakdown are live; the Profile Awards tab is a placeholder.
- Dependencies: privacy rules for published/unpublished results, season/group mapping, and empty states.
- Risks: exposing interim/private votes or misattributing guest/merged players.
- Measure: percentage of completed award programs published and viewed; support incidents about missing/incorrect results.

### Validate packaging before commerce

- Problem/user: the product is free and paid value has not been established.
- Evidence: products/prices/subscriptions/entitlements/Stripe-customer tables exist, but checkout, paywall, receipts, and enforcement do not.
- Dependencies: segment research, value proposition tests, App Store/Play billing strategy, support/refund model, and entitlement authority.
- Risks: building billing before proving willingness to pay; mobile store policy violations; fragmenting team workflows.
- Measure: interview/test conversion, stated and observed willingness to pay, package preference, and retained usage by target segment.

## Later

### Team-tracker offline resilience

- Problem/user: team trackers can lose events when connectivity is poor.
- Evidence: only `/tracker` uses the SQLite pending-event queue; team modes write directly to Supabase.
- Dependencies: idempotent event IDs, linked-writer conflict rules, persisted timer state, and reconciliation UI.
- Risks: duplicated or reordered events across devices.
- Measure: successful recovery rate, duplicate rate, and events lost per disconnected match.

### Granular notification preferences

- Problem/user: users receive many team/social/voting notification types without fine-grained control.
- Evidence: the push pipeline and token storage are live; no category preference model was found.
- Dependencies: taxonomy, mandatory service-message rules, settings schema, and trigger/Edge Function filtering.
- Risks: suppressing critical invitations or safety/admin messages.
- Measure: opt-out rate, category-level disablement, notification open rate, and complaint rate.

### Replace squad placeholders with validated workflows

- Problem/user: coaches need clearer insights and content management.
- Evidence: squad Insights and Posts destinations remain placeholder/incomplete while stats and feed primitives already exist.
- Dependencies: coach research, permissions, metric definitions, and content ownership.
- Risks: duplicating leaderboard/feed screens without a specific coaching job.
- Measure: weekly coach use, decisions/actions taken, and repeat usage per active squad.

### Reassess the club-to-team model

- Problem/user: multi-team clubs may need more than one official squad.
- Evidence: the current schema enforces one official squad per club.
- Dependencies: validated club hierarchy, grade/season identity, migration strategy, and permission inheritance.
- Risks: high-impact data migration and ambiguous ownership.
- Measure: number of qualified clubs blocked by the constraint and successful multi-team onboarding if changed.

## Exploratory

### Assisted match reports

- Problem/user: coaches and social managers spend time turning stats into useful narratives.
- Evidence: structured events and deterministic recap templates exist; no AI generation integration exists.
- Dependencies: accuracy rubric, approved data boundary, citations back to stats, human approval, model/cost policy.
- Risks: invented claims, unsafe content, and overconfident interpretation of youth/player data.
- Measure: edit distance, approval rate, time saved, factual-error rate, and publishing rate.

### Operational agents

- Problem/user: club onboarding, data-quality review, support triage, and release checks are repetitive.
- Evidence: admin and moderation tools exist, but no autonomous agent runtime or workflow is implemented.
- Dependencies: auditable permissions, human approval points, escalation rules, and connector/security review.
- Risks: unintended external actions, privacy leakage, and silent incorrect changes.
- Measure: cycle-time reduction, escalation precision, rollback rate, and human acceptance.
