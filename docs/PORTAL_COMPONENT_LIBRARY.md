
# PORTAL_COMPONENT_LIBRARY.md
KickChasers Web Portal — Component Library

This document defines the reusable UI components for the KickChasers web portal.
Codex should use these components consistently across all portal pages.

The goal is to maintain a **clean, professional sports analytics interface** similar to Hudl, Strava, and modern SaaS dashboards.

---

# Core Layout Components

## PortalLayout

Purpose:
Top-level layout used across all authenticated portal pages.

Structure:

Sidebar
Topbar
MainContent

Responsibilities:
- session guard
- role-based navigation
- responsive layout
- container width control

---

## SidebarNavigation

Purpose:
Primary navigation for the portal.

Items:

Dashboard
Squads
Games
Stats
Notifications
Profile
Settings
Admin (role gated)

Style:
- 240px width
- dark navy background
- neon highlight for active section
- icon + label

---

## Topbar

Purpose:
Global navigation actions.

Elements:

Search input
Notification bell
User avatar dropdown

Dropdown actions:

Profile
Settings
Logout

---

# Card Components

## PortalCard

Purpose:
Standard container for dashboard and page sections.

Properties:

Rounded corners
Subtle border
Dark surface background
Padding 20–24px

Used in:

Dashboard widgets
Profile stats
Squad overview panels

---

## StatCard

Purpose:
Highlight a key stat.

Layout:

Title
Large stat value
Optional trend indicator

Examples:

Games Played
Goals
Disposals
Tackles

---

# Table Components

## DataTable

Purpose:
Display structured data such as squads, players, stats, or notifications.

Features:

Sortable columns
Pagination
Row hover states
Action buttons

Used in:

Roster tables
Leaderboards
Notifications
Admin lists

---

## RosterTable

Purpose:
Display squad roster.

Columns:

Number
Player
Position
Role
Actions

Actions:

Edit
Remove
Promote role

Bulk actions supported.

---

# Squad Components

## SquadHeader

Purpose:
Top header for squad detail page.

Elements:

Squad logo
Squad name
League/grade
Member count

Optional actions:

Invite
Manage squad
Edit branding

---

## SquadMemberCard

Purpose:
Display a single squad member.

Fields:

Avatar
Name
Role
Number
Position

Actions:

Edit
Remove

---

# Game Components

## GameSummaryCard

Purpose:
Display overview of a game.

Fields:

Teams
Score
Date
Location

Action:

View summary

---

## PlayerStatRow

Purpose:
Display player stats inside stat tables.

Fields:

Player
Kicks
Handballs
Marks
Goals
Total disposals

---

# Notification Components

## NotificationRow

Purpose:
Display a notification inside the inbox.

Fields:

Type
Message
Related squad
Date

Actions:

Accept
Decline
View

---

# Form Components

## PortalForm

Purpose:
Standard form container.

Features:

Multi-column layout
Clear section headers
Validation messaging

Used in:

Onboarding
Squad creation
Profile editing

---

## AvatarUploader

Purpose:
Upload and preview user avatar or squad logo.

Features:

Drag-and-drop support
Preview image
Upload progress indicator

---

# Modal Components

## PortalModal

Purpose:
Reusable modal dialog.

Uses:

Confirm actions
Invite member
Edit squad

Features:

Centered modal
Dimmed background
ESC close
Confirm/cancel buttons

---

# Design Tokens

Colors:

Primary background: deep navy
Accent: #39FF88
Border: subtle grey

Typography:

Large headings for section titles
Compact text for tables
Bold stat numbers

---

# Animation Rules

Use subtle UI motion:

Card hover elevation
Table row hover highlight
Sidebar hover glow
Modal fade in

Avoid heavy animations.

---

# Implementation Rule

Codex should:

1. Reuse these components whenever possible.
2. Avoid building page-specific UI if a reusable component exists.
3. Keep styling consistent with the KickChasers design language.

