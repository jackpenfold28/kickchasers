# KickChasers product vision

Last verified: 2026-07-23

Source of truth: implemented product behavior plus owner-supplied business context in `GROWTH_AND_MONETISATION_CONTEXT.md`. Aspirations are explicitly labelled.

## What KickChasers is today

KickChasers is a grassroots Australian football match-data and community platform. It lets a player or tracker capture a game once and turn that event stream into live scores, player and team analysis, player history, coach reporting, supporter viewing, social recaps, and club workflows.

The product is no longer a basic personal statistics notebook. Its centre of gravity is the match: capture it reliably, make it useful live, preserve it as player/team history, and distribute it to the people around the game.

## People served

- Individual players tracking themselves.
- Parents or friends tracking a player.
- Dedicated team trackers recording one or both teams.
- Coaches consuming team totals, player detail, maps, trends, and reports.
- Team and club administrators managing squads, roles, team selection, and awards.
- Supporters following players, clubs, leagues, recaps, and live games.
- Platform administrators maintaining directory quality and community safety.

There is no parent-specific role or notification product today; parents use general player/tracker/supporter flows.

## Core problem

Grassroots games generate valuable moments and performance data, but capture is fragmented and the result rarely reaches every stakeholder. Players want a record, coaches want actionable detail, supporters want a live view, and clubs need lightweight operations without enterprise complexity.

## Value proposition

Track once, reuse many times:

- immediate event capture for the tracker;
- live status and score for followers;
- structured review for coaches;
- durable history and benchmarks for players;
- shareable recap content for organic distribution;
- squad and awards workflows for club volunteers.

## Product pillars

1. **Fast, trustworthy match capture.**
2. **Live shared match context.**
3. **Player development history.**
4. **Coach and team insight.**
5. **Game-driven community distribution.**
6. **Lightweight grassroots squad operations.**

## Current differentiation

Evidence-backed differentiators include:

- four tracking paths sharing the match/event model: single-player, full team, linked two-device team, and playerless Team Stats Game;
- single-player offline capture;
- two-device side-linked team tracking and shared timer state;
- player and team field-location analysis;
- live/team/final content produced from the same events;
- official-counted tracking for leaderboards;
- team-selection posters and a complete squad vote-card/Best & Fairest workflow.

These are product capabilities, not claims of market superiority.

## Relationship between product systems

`Tracking` creates events → `live consumption` reads current state → `summaries` aggregate by player/team/quarter → `player history` joins eligible games over time → `content` packages final data → `follows/feed/notifications` distribute it → `squad operations` provide identities, permissions, team selection, and awards.

The value loop is strongest when a tracked game attracts viewers or recipients who later follow, join, share, or start tracking.

## Current boundaries and non-goals

- Not a competition management suite: no ladders, full fixtures, registration, payments, or umpire administration.
- Not a general-purpose social network: user content is mainly game/team-selection recap content.
- Not anonymous public live scoring: normal match access requires authentication.
- Not a full club hierarchy: users can manage multiple squads, but the schema permits one official squad per club.
- Not an AI product today: reports/captions are templates and voice tracking is absent.
- Not a paid product today: commerce tables are infrastructure only.
- Not full web parity: web mainly supports handoff/share and token voting.

## Aspirational direction

Potential next direction, subject to validation:

- make voice-assisted capture genuinely faster without reducing stat accuracy;
- connect squad award outcomes to player history;
- close public link/viewer conversion gaps;
- instrument the match-to-viewer-to-tracker growth loop;
- introduce paid value only after understanding which users repeatedly receive measurable benefit.

These are aspirations, not implemented commitments. The maintainable backlog is in `PRODUCT_ROADMAP.md`.
