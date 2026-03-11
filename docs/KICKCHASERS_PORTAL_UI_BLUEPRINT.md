# KICKCHASERS_PORTAL_UI_BLUEPRINT.md

KickChasers Web Portal --- UI Blueprint

This document defines the recommended UI structure for the KickChasers
web portal. The design should feel like a professional sports analytics
platform similar to Hudl, Strava, Linear, Apple dashboards, and modern
SaaS admin portals.

The goal is a **clean, dense, professional desktop interface** that
mirrors the KickChasers mobile design language while adapting it for
large screens.

------------------------------------------------------------------------

# Core Layout Structure

The portal should use a **three-part layout**.

Sidebar (primary navigation) Topbar (search + account + notifications)
Main content canvas

Example structure:

Sidebar - Dashboard - Squads - Games - Stats - Notifications - Profile -
Settings - Admin (role gated)

Topbar - Global search - Notification bell - User avatar menu

Main Content - Page header - Page controls - Data tables / cards

------------------------------------------------------------------------

# Sidebar Design

Width: 240px

Style: - Dark navy background - Neon accent highlight (#39FF88) - Soft
hover states - Minimal icons + text labels

Example:

Dashboard Squads Games Stats Notifications Profile Settings

Admin (visible only for admins)

Active section should show a **left neon indicator bar**.

------------------------------------------------------------------------

# Top Navigation Bar

Height: \~64px

Contains: - Page title - Global search input - Notification bell - User
avatar dropdown

Dropdown actions:

Profile Settings Log out

------------------------------------------------------------------------

# Dashboard Layout

The dashboard should give users **quick insight into activity**.

Sections:

Pending Actions - join requests - invites - role requests

Recent Games - last 5 matches

My Squads - quick links to squads

Leaderboard Snapshot - top performers

Layout:

Grid system (12 column).

Example:

| Pending Actions \| Recent Games \|
| My Squads \| Leaderboard \|

Cards should have: - rounded corners - subtle border - dark surfaces -
accent stat pills

------------------------------------------------------------------------

# Squad Management UI

The **Squads section is the core of the portal**.

Layout:

Left panel: squad list Right panel: squad detail

Example:

Squad List - squad logo - squad name - role badge

Squad Detail Tabs:

Overview Roster Requests Invites Branding

Roster View:

Table layout:

Number \| Player \| Position \| Role \| Actions

Bulk edit controls should appear above the table.

------------------------------------------------------------------------

# Game Review UI

Games page should show:

Game list Game detail Game stats

Layout:

Left: game list Right: game summary

Game summary sections:

Score summary Team stats Player stats table

Stat table example:

Player \| Kicks \| Handballs \| Tackles \| Goals \| Total

------------------------------------------------------------------------

# Stats / Leaderboards

Stats page should allow filtering by:

League Club Season Age group

Table example:

Rank \| Player \| Squad \| Games \| Goals \| Disposals

Filters appear above the table.

------------------------------------------------------------------------

# Notifications Page

Notifications become a **management inbox**.

Layout:

Table with actions.

Columns:

Type Message Squad Date Actions

Actions:

Accept Decline View

------------------------------------------------------------------------

# Profile Page

Profile layout:

Left side: Avatar Name Club Roles

Right side: Stat summary cards Game log

Stat cards example:

Games Played Goals Disposals Tackles

------------------------------------------------------------------------

# Settings Page

Sections:

Account Security Notifications Blocked Users Roles

Use **stacked card layout**.

------------------------------------------------------------------------

# Admin Console

Visible only to platform admins.

Sections:

Directory Requests Squad Admin Requests League Management Moderation
Tools

Admin pages should use **table-heavy layouts**.

------------------------------------------------------------------------

# Design System Rules

Colors:

Primary surface: deep navy Accent color: #39FF88

Components:

Rounded cards Stat pills Badge indicators Icon buttons

Typography:

Strong headings Compact data tables Readable stat numbers

------------------------------------------------------------------------

# Animation Guidelines

Use subtle animations:

Card hover elevation Table row highlight Sidebar hover glow Stat
counters

Avoid heavy animation.

------------------------------------------------------------------------

# Desktop UX Improvements vs Mobile

Replace mobile UI patterns with desktop equivalents.

Mobile → Web

Bottom sheet → Modal / side panel Stacked lists → Data tables Vertical
forms → Multi-column forms Swipe actions → Action buttons

------------------------------------------------------------------------

# Implementation Order

Codex should implement UI in this order:

1.  Portal layout shell
2.  Sidebar navigation
3.  Dashboard
4.  Squads UI
5.  Games UI
6.  Stats UI
7.  Notifications
8.  Profile
9.  Settings
10. Admin console
