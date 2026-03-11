
# WEB_PORTAL_FEATURE_RULES.md
KickChasers Web Portal — Implementation Rules

## Purpose
This document defines strict rules for what the KickChasers web portal should and should not implement.

The goal is to ensure the web portal remains a management and analysis platform, not a duplicate of the mobile match‑day application.

Codex should always read this file before implementing major portal features.

---

# Core Principle

KickChasers is a mobile-first match day product with a web-first management portal.

Mobile handles:
• Live stat tracking
• Match-day operations
• Sideline workflows
• Rapid touch interactions

Web handles:
• Setup
• Administration
• Management
• Review
• Analytics
• Organization workflows

The web portal should never attempt to replicate the match‑day operational interface.

---

# Features Allowed On Web

## Account & Profile Management

The web portal SHOULD allow users to:

• Create and manage accounts
• Update email/password
• Edit profile information
• Upload avatar / profile image
• Manage roles (player / coach / tracker)
• Request role upgrades
• Manage blocked users
• Delete account

Mobile Source Reference:
- app/settings.tsx
- app/onboarding.tsx
- components/profile/ProfileScreen.tsx

---

## Onboarding

Web onboarding should mirror mobile onboarding requirements but provide a better form experience.

Required fields:
• State
• League
• Club
• Role(s)
• Handle

Web can improve:
• multi-column layout
• searchable dropdowns
• faster navigation

Mobile Source Reference:
- app/onboarding.tsx

---

## Squad / Team Management

The web portal SHOULD provide full squad administration.

Allowed features:

• Create squad
• Edit squad details
• Manage roster
• Invite members
• Remove members
• Assign numbers / positions
• Manage squad branding
• Manage team colors
• Review join requests
• Accept / reject join requests
• Guest player merge management

Mobile Source Reference:
- app/teams.tsx
- app/teams/[id].tsx
- components/teams/CreateSquadSheet.tsx

Web UX improvements:
• roster tables
• bulk edits
• multi-column layouts

---

## Invitations & Requests

The web portal SHOULD implement a centralized inbox for requests.

Supported request types:

• squad invites
• join requests
• role requests
• guest merge requests

Portal Section:
Notifications / Requests

Mobile Source Reference:
- app/notifications.tsx

---

## Game Review

The web portal SHOULD allow reviewing game data.

Supported features:

• game log viewing
• match summaries
• player stat review
• team stat review

Mobile Source Reference:
- app/games/[id]/summary.tsx
- components/me/GameLogTab.tsx

---

## Leaderboards & Statistics

The web portal SHOULD provide full leaderboard views.

Supported features:

• leaderboard browsing
• stat filtering
• league filtering
• club filtering
• season filtering

Mobile Source Reference:
- app/(tabs)/leaderboards.tsx
- components/teams/StatsLeaderboard.tsx

Desktop advantages:

• larger stat tables
• better filtering UI
• comparison tools

---

## Notifications

The web portal SHOULD implement a notification inbox.

Supported notifications:

• squad invites
• join requests
• role requests
• moderation notices

Mobile Source Reference:
- app/notifications.tsx

---

## Platform Admin Tools

The web portal SHOULD support admin workflows.

Admin-only features:

• approve directory requests
• manage leagues
• moderate content
• approve official squads
• manage club roles

Mobile Source Reference:
- app/admin/index.tsx

---

# Features NOT Allowed On Web

The following features must remain mobile-only.

## Live Tracker

Mobile file:
app/tracker.tsx

Reason:
• requires extremely fast input
• optimized for touch capture
• sideline environment

Do not attempt to recreate this on web.

---

## Match-Day Tracking Interface

Mobile files:
- app/new-game/team-tracker/game.tsx
- app/(tabs)/new-game/index.tsx

Reason:
• operational sideline interface
• requires rapid stat entry

This is strictly mobile-first.

---

# UI Adaptation Rules

The web portal should preserve the KickChasers design language while adapting layout patterns for desktop.

Preserve:
• color palette
• neon accent (#39FF88)
• card layout language
• iconography
• stat pill components
• squad header designs

Adapt:

Mobile bottom sheets → web modals / side panels
Single-column forms → multi-column desktop forms
Mobile lists → table views

---

# Portal Navigation Structure

Dashboard
Squads
Games
Stats
Notifications
Profile
Settings
Admin (role gated)

---

# Codex Implementation Rules

When implementing portal features Codex must:

1. Reference the mobile source files listed in the portal plan.
2. Reuse Supabase queries and RPC functions where possible.
3. Respect RLS permissions.
4. Avoid duplicating match‑day capture workflows.
5. Prefer desktop UX patterns over mobile patterns.

---

# Source of Truth Files

Codex should read these files before implementing portal features:

KICKCHASERS_WEB_BUILD_GUIDE.md
KICKCHASERS_WEB_PORTAL_PLAN.md
WEB_PORTAL_FEATURE_RULES.md
