# PORTAL_ROADMAP.md

KickChasers Web Portal -- Build Roadmap

This roadmap converts the KickChasers Web Portal Plan into a
step‑by‑step implementation guide for Codex. Each phase should be
completed before moving to the next to avoid architecture drift.

------------------------------------------------------------------------

# Phase 1 --- Portal Foundation

Goal: Create the base structure of the web portal.

Build: - Portal layout shell - Sidebar navigation - Top navigation bar -
Auth session gate - Onboarding redirect logic - Dashboard placeholder

Primary Navigation:

Dashboard Squads Games Stats Notifications Profile Settings Admin (role
gated)

Key Requirements: - Supabase auth parity with mobile - Protected routes
for authenticated users - Onboarding completion check before dashboard
access

------------------------------------------------------------------------

# Phase 2 --- Profile & Account System

Goal: Mirror mobile account management flows in a desktop‑friendly UI.

Features:

Profile Page - Profile summary - Avatar upload - Edit handle - Edit
roles

Account Settings - Update email - Password reset trigger - Blocked users
management - Role request screen - Account deletion

Reference Mobile Files: app/onboarding.tsx app/settings.tsx
components/profile/ProfileScreen.tsx

Supabase Tables: profiles profiles_directory user_blocks club_follows

------------------------------------------------------------------------

# Phase 3 --- Squad Management (Core Portal Feature)

Goal: Allow full squad administration through a desktop interface.

Features:

Squads Index - My squads - Following - Discovery

Create Squad Wizard - Squad name - Club association - Branding - League
/ grade

Squad Detail Page - Roster table - Member roles - Invite member - Join
requests - Guest player merges - Team colours - Delete squad

Supabase Tables: squads squad_members squad_join_requests
guest_merge_requests club_roles

RPC Functions: f_invite_member f_respond_invite
rpc_decide_squad_join_request rpc_decide_guest_merge_request

------------------------------------------------------------------------

# Phase 4 --- Games & Stats Review

Goal: Provide desktop stat analysis and game review.

Features:

Game Log - User game history - Team game history

Game Summary - Team stats - Player stats - Quarter breakdown

Stats Section - Leaderboards - Filters (league, club, state) - Player
comparisons

Supabase Tables: games events manual_player_game_totals game_players
game_squads

Views: v_counted_events

------------------------------------------------------------------------

# Phase 5 --- Notifications & Requests

Goal: Centralize all action requests into a desktop inbox.

Features:

Notifications Inbox - Squad invites - Join requests - Role requests -
Guest merge requests

Actions: - Accept / decline - Review context - Navigate to related squad

Supabase Tables: notifications squad_join_requests guest_merge_requests
squad_members

------------------------------------------------------------------------

# Phase 6 --- Platform Admin Portal

Goal: Provide internal management tools for platform administrators.

Features:

Admin Dashboard - Directory requests - Official squad admin requests -
League management

Moderation - Hide posts - Archive squads - Review reports

Admin Tools - Manual feed posting - League editing - Club management

Supabase Tables: platform_admins official_directory_requests
official_squad_admin_requests leagues clubs

RPC Functions: rpc_set_post_hidden rpc_set_squad_archived

------------------------------------------------------------------------

# Phase 7 --- Later Portal Enhancements

Features to build after core portal stabilizes:

-   Social feed authoring
-   Team selection poster builder
-   Live match viewer
-   Player comparison dashboards
-   Advanced analytics

These should not delay core management features.

------------------------------------------------------------------------

# Design System Rules

Maintain KickChasers visual identity:

Colors - Navy surfaces - Neon accent #39FF88

UI Patterns - Rounded cards - Stat pills - Squad header banners

Desktop Adaptations:

Mobile bottom sheets → Web modals / side panels Single column forms →
Multi‑column forms Lists → Table layouts

------------------------------------------------------------------------

# Implementation Order

Codex should always follow this order:

1.  Portal shell
2.  Profile & settings
3.  Squad management
4.  Games & stats
5.  Notifications
6.  Admin console

Do not skip phases.

------------------------------------------------------------------------

# Source of Truth Files

Codex must read these before implementing portal features:

KICKCHASERS_WEB_BUILD_GUIDE.md KICKCHASERS_WEB_PORTAL_PLAN.md
WEB_PORTAL_FEATURE_RULES.md PORTAL_ROADMAP.md
