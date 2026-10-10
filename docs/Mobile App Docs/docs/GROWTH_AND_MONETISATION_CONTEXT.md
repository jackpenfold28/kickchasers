# Growth and Monetisation Context

Last verified: 2026-07-23
Source of truth: owner-provided operating context in the 2026-07-23 documentation brief plus current repository evidence

## Current position

- Approximately 470 registered users.
- Around 50 or more games are regularly tracked.
- A large user segment is individual players tracking their own statistics.
- The product is currently free.
- Paid features are being evaluated; no commercial package is committed.
- Growth has primarily been organic and network-driven.

These figures are owner context, not values derived from an analytics warehouse. The repository has Sentry error telemetry and admin aggregates, but no product analytics instrumentation that can independently verify activation or retention.

## Core segments

| Segment | Primary job | Current evidence of value |
| --- | --- | --- |
| Player/self-tracker | Record a match and understand individual performance | Offline-capable single-player tracker, game log, benchmarks, Impact7, share cards |
| Volunteer tracker/parent | Capture stats quickly and reliably during a match | Tap tracker, undo, locations, custom counters; no dedicated parent role/preferences |
| Coach/team staff | Track a side, review players and coordinate selection | Team and linked tracking, summaries/PDF, squads, roles, team selection, awards |
| Club administrator | Establish official identity and manage access | Clubs, official squads, requests, club roles, directory/admin workflows |
| Supporter/follower | Follow teams and see match content | Follow graph, Match Day, live/recap feed, notifications; anonymous sharing is incomplete |
| Platform operator | Approve, moderate, support, and maintain integrity | Admin dashboard, official requests, moderation, archive and manual post tooling |

## Growth loops already present

1. A tracker records a game.
2. KickChasers generates a useful summary, card, recap, or team-selection asset.
3. The content reaches teammates/followers through the feed, notifications, or external sharing.
4. Recipients follow, join, vote, or become trackers themselves.

Squad invites, join requests, official-team following, public vote-card tokens, and linked tracking can strengthen this loop. The signed-out shared-game route currently weakens it because the root auth gate redirects unauthenticated visitors.

## Monetisation reality

Database primitives exist for products, prices, subscriptions, Stripe customers, and entitlements. A free product is seeded. The app does not expose checkout, mobile purchase flows, receipt validation, paywalls, premium selection, or a dependable client entitlement gate. These tables are infrastructure, not a launched subscription product.

Any paid plan should follow evidence about which segment receives recurring value. Plausible hypotheses—not current product commitments—include coach/team reporting, advanced club operations, richer exports, or labour-saving assistance. Core data ownership, privacy, and dependable recording should not be weakened to create artificial paywalls.

## Recommended measurement foundation

The following are recommendations, not existing dashboards:

- Activation: account created → onboarding completed → first meaningful action.
- Tracking activation: first game started and first game completed.
- Weekly active trackers and games per active tracker.
- Weekly tracked games.
- Unique live viewers and viewers per game.
- D1/D7/D30 retention by player, tracker, coach, and squad-admin segment.
- Player return rate and tracker retention.
- Squad activation: created/claimed → roster added → first tracked match → first selection/post.
- Match reliability: event write failures, offline recoveries, duplicates, abandoned games.
- Sharing loop: shares per game, invites per game, card/recap opens, and supporter-to-tracker conversion.
- Match Day and notification engagement by type.
- Awards funnel: matchup created → card assigned → submitted → results published/viewed.
- Club adoption: activated clubs, active squads per club, and retained club administrators.
- Monetisation research: qualified interview rate, offer-page intent, package choice, willingness-to-pay range, premium-feature engagement, trial-to-paid conversion, and retained use after trial.

Instrumentation should minimise personal data, distinguish operational logs from behavioural analytics, define retention, and account for youth participants.

## Decision gates

- Do not choose pricing from total registrations alone; regular game recorders are the stronger initial usage cohort.
- Do not build checkout until a segment, recurring job, offer, and success threshold are written down.
- Do not interpret subscription tables as proof of billing readiness.
- Resolve privacy/RLS, schema trust, and reliability baselines before charging for dependable team workflows.
- Treat organic network effects as a product surface: public-safe handoff, team identity, invitations, and attribution need deliberate measurement.
