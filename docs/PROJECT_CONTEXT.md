Last updated: 2026-03-24

# Project Context

## What is KickChasers?
- Mobile app for grassroots AFL teams to manage squads, track live stats, and share recaps. Built with Expo Router + React Native, Supabase for auth/data/storage, and React Query for data flow.
- Audience: players/coaches/trackers/supporters who need fast roster updates, live stat logging, and push notifications for invites/promotions.

## Core Product Goals
- Quick team setup: create squads, assign grades/leagues/states, invite players by handle/email, and manage official club squads.
- Game-day tracking: select squads, link to games, record events, generate summaries, and share recaps.
- Match-day discovery: follow leagues, track live games, and surface current scores and quarters.
- Communication: notify members about invites, acceptances, admin promotions, role changes, track-for-user requests/decisions, and join requests.
- Admin tooling: platform admins can vet official squad/admin requests, manage directory additions, moderate posts, and publish manual game summaries.
- Directory coverage: request missing leagues/clubs and surface official squad metadata for grading.

## Non-goals (current)
- Full fixture/ladder management (only single-game scheduling and recap).
- Payments/membership commerce (Stripe catalog exists but unused in UI).
- Rich content creation beyond posts with optional images and squad-linked recaps.
- Desktop/web parity for all flows (mobile-first; only summary preview uses web-friendly layout).

## High-level Data Flow
- **User** signs in -> `profiles` row created -> sets `game_day_roles`/`primary_role`/`home_club_id`.
- **Club** affiliation via `club_roles` (synced from profile) and `club_follows` (follower). Official squads tie to `clubs` + `leagues/grades`.
- **Squad** created by owner -> `squad_members` rows for roster (owner/admin/member, status) -> invites/requests update status and trigger notifications.
- **Game** created with linked squads (`game_squads`) -> players seeded from `squad_members` into `game_players` -> owner can request another user to be tracked (`track_request_status` pending/accepted/declined) -> actions logged to `events`/`player_events` -> summaries feed posts/notifications if shared.
- **Match day**: users follow leagues via `league_follows`, fetch live `games` + `game_squads` + latest `events` to render live score cards.
- **Manual stats**: `manual_player_game_totals` allow users to backfill games for personal profiles; totals merge into `v_player_game_totals`. Manual summary posts attach to `posts.manual_game_id`.
- **Platform admin**: official requests live in `official_squad_admin_requests` and `official_directory_requests`; admins can hide posts and archive official squads.
- **Guest merge**: guest members can be merged into real profiles via `guest_merge_requests`, triggering notifications to admins/owners.

## Data Ownership Expectations
- Owner rights live in `squads.owner_id` and accepted `squad_members.role='owner'`.
- Official squad roster reads depend on `club_follows` (followers) or `club_roles.role='tracker'`.
- Squad management for official squads depends on the owner or `club_roles.role='admin'` (platform admins can assign admin roles).
- Posts can be hidden by platform admins via `rpc_set_post_hidden`.

## Security Boundaries (current)
- **Private by default**: notifications, squad membership rows, join requests, guest merge requests, and profile edits are restricted to the authenticated user or owners/admins.
- **Membership or follow visibility**: official squad rosters require a `club_follows` row or tracker role; unofficial rosters require accepted membership.
- **Public today**: public posts (when not hidden), games/events with accepted/unset track requests, game_players, teams, and non-official squads (see `docs/RLS_AND_POLICIES.md`).
