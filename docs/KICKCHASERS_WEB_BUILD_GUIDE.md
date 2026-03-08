# KICKCHASERS_WEB_BUILD_GUIDE.md

## Overview

KickChasers is a high‑performance sports analytics platform designed for
grassroots Australian Rules Football.

The platform allows teams, players, parents, and coaches to:

-   Track live match statistics
-   Measure player development over time
-   View detailed game summaries
-   Manage squads and rosters
-   Generate performance insights similar to elite level analytics
    platforms

KickChasers is designed to feel closer to **Strava, Hudl, or Catapult**
than a typical sports fan app.\
It is a **performance tracking tool**, not just a stats viewer.

The **mobile application is the primary product**, used during games to
capture live match statistics.

The **web portal is a secondary interface** designed for administration,
analysis, and viewing data on larger screens.

------------------------------------------------------------------------

# Source of Truth

The following systems are considered the **source of truth** for the
KickChasers platform:

1.  KickChasers Mobile Application
2.  Current Supabase Project (live database)
3.  Project documentation files

Codex must **not invent new schema structures, table names, policies, or
data models** unless explicitly instructed.

The web portal must follow the same:

-   table names
-   relationships
-   roles
-   permissions
-   naming conventions

as defined by the mobile application backend.

------------------------------------------------------------------------

# Objective of the Web Portal

The KickChasers web portal is **not intended to replicate the mobile app
interface**.

Instead, the web portal should function as a **desktop dashboard and
administration portal**.

It should focus on:

-   management tasks
-   roster administration
-   viewing statistics
-   reviewing game summaries
-   analysing player performance

The portal should feel like a **professional sports analytics
dashboard**.

------------------------------------------------------------------------

# Web Portal Version 1 Scope

The first version of the web portal should include the following areas.

## 1. Authentication

-   Supabase authentication
-   login
-   logout
-   account creation if required
-   password reset

Authentication must use the **same Supabase project as the mobile app**.

------------------------------------------------------------------------

## 2. Dashboard

The dashboard should show:

-   recent games
-   tracked squads
-   summary cards
-   season snapshot
-   notifications or updates

The goal is to give users a **quick overview of activity and
performance**.

------------------------------------------------------------------------

## 3. Teams / Squads

Users should be able to:

-   view squads they belong to
-   manage squad rosters
-   add or remove players
-   update squad settings
-   manage squad branding (team colours, logo)

This area should prioritise **administrative management**, which is
easier on desktop than mobile.

------------------------------------------------------------------------

## 4. Games

Users should be able to:

-   view recent games
-   view game summaries
-   review player statistics for a match
-   edit or correct data if required

The web portal is primarily for **reviewing and analysing games**, not
live tracking.

------------------------------------------------------------------------

## 5. Players

Player profiles should include:

-   player information
-   season statistics
-   game logs
-   performance trends

This should feel like a **player performance dashboard**.

------------------------------------------------------------------------

## 6. Profile / Account

Users should be able to:

-   update their profile
-   manage account settings
-   upload profile images
-   manage notifications

------------------------------------------------------------------------

# Out of Scope (Web v1)

The following features should **remain mobile-only for now**:

-   live in‑game stat tracking
-   stat entry pads optimized for touch devices
-   quick mobile actions used during matches

These features are better suited to the mobile experience.

------------------------------------------------------------------------

# Technical Constraints

The web portal must follow these rules:

1.  Use the **existing Supabase project**
2.  Never hardcode Supabase keys
3.  Use environment variables for configuration
4.  Respect all **RLS policies**
5.  Do not create duplicate tables
6.  Do not rename existing schema
7.  Avoid schema modifications unless explicitly approved

If schema issues are detected, Codex must **report them rather than
automatically change them**.

------------------------------------------------------------------------

# Supabase Connection Rules

The Supabase client must be created using environment variables.

Example:

``` ts
createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

Service role keys must **never be exposed to the client**.

------------------------------------------------------------------------

# Design Principles

The web portal should follow the same design language as the KickChasers
mobile app.

Design characteristics:

-   premium sports tech aesthetic
-   dark interface first
-   strong contrast
-   minimal clutter
-   bold stat cards
-   modern dashboard layout

Colour usage:

Primary: Navy / dark background\
Secondary: White\
Accent: Neon green used sparingly for highlights or performance
indicators

The interface should resemble **modern analytics dashboards** used in
sports performance platforms.

------------------------------------------------------------------------

# Required Codex Workflow

Before implementing new code, Codex must perform an audit.

Step 1 --- Audit the existing web application

-   locate Supabase client configuration
-   identify environment variables
-   identify old Supabase references
-   list all API queries
-   list tables used

Step 2 --- Compare with current backend

Compare the web app queries against:

-   current database schema
-   RLS policies
-   existing API routes
-   Supabase functions

Step 3 --- Identify mismatches

Common issues may include:

-   tables that no longer exist
-   renamed columns
-   missing policies
-   incorrect joins
-   deprecated RPC functions

Step 4 --- Produce an audit report

The report must include:

-   issues found
-   potential breaking points
-   recommended fixes

Step 5 --- Propose phased implementation

The implementation should be split into phases:

Phase 1 --- reconnect web app to Supabase\
Phase 2 --- repair broken queries\
Phase 3 --- build dashboard layout\
Phase 4 --- implement squads management\
Phase 5 --- implement games and players views

Codex must not attempt to complete everything in a single step.

------------------------------------------------------------------------

# Output Requirements for Codex

When returning results, Codex must provide:

1.  Audit findings
2.  Identified issues
3.  Implementation plan
4.  Exact file changes
5.  Database migration scripts if required
6.  Testing checklist

All code changes must be clearly separated and documented.

------------------------------------------------------------------------

# Key Project Documentation

Codex must read the following project files before beginning work:

1.  PROJECT_CONTEXT.md
2.  PROJECT_MAP.md
3.  SUPABASE_CONTEXT.md
4.  DB_SCHEMA_NOTES.md
5.  RLS_AND_POLICIES.md
6.  ROLES_AND_PERMISSIONS.md
7.  ROUTES_AND_QUERIES.md
8.  DESIGN_PRINCIPLES.md
9.  COMPONENTS_REGISTRY.md

These documents describe the architecture of the KickChasers system.

------------------------------------------------------------------------

# Final Rule

KickChasers mobile is the **product source of truth**.

The web portal must align with the existing architecture and should not
introduce architectural drift.
