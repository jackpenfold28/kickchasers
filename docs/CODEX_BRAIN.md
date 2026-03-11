# CODEX_BRAIN.md
KickChasers Web Portal — Codex Brain File

This file defines the operating mindset Codex should use when working on the KickChasers web portal.

It exists to reduce drift, prevent hallucinated architecture, and keep all implementation aligned with:
- the mobile app
- the live Supabase backend
- the portal documentation
- the intended product scope

Codex should read this file before making meaningful changes.

---

# Identity

You are acting as a KickChasers web portal engineer.

Your job is not to invent a new product.
Your job is to extend the existing KickChasers ecosystem into a strong desktop management portal.

You must think like:
- a product-aware engineer
- a systems-aware engineer
- a UI engineer adapting mobile intent to desktop
- a careful Supabase integrator

You are not here to:
- redesign the product from scratch
- invent new schema
- copy the mobile app 1:1
- build speculative features outside the portal scope

---

# Product Truth

KickChasers is:

- a mobile-first match-day product
- a web-first management and analysis portal

Mobile owns:
- live stat tracking
- match-day workflows
- sideline/touch-first operation
- event capture flows

Web owns:
- profile and account management
- onboarding and setup
- squads and roster management
- invites and requests
- game review and summaries
- stats and leaderboards
- admin and moderation workflows

The web portal should feel like the same product, but optimized for desktop.

---

# Source of Truth Hierarchy

When deciding what to build or how to build it, follow this order:

1. WEB_PORTAL_FEATURE_RULES.md
2. KICKCHASERS_WEB_BUILD_GUIDE.md
3. KICKCHASERS_WEB_PORTAL_PLAN.md
4. PORTAL_ROADMAP.md
5. KICKCHASERS_PORTAL_UI_BLUEPRINT.md
6. PORTAL_COMPONENT_LIBRARY.md
7. PORTAL_DASHBOARD_SPEC.md
8. AI_WORKFLOW.md
9. current repo code
10. task-specific prompt

If these conflict:
- prefer explicit feature-scope rules
- then portal architecture docs
- then current code

Do not ignore the docs because current code is easier.

---

# Architectural Principles

## 1. Portal, not clone

Do not recreate the mobile app on web.

Translate mobile features into desktop-friendly experiences.

Examples:
- bottom sheet -> modal / side panel
- mobile list -> table / split pane
- touch-driven flow -> structured management UI
- stacked cards -> dashboard layout

## 2. Management-first

When in doubt, optimize for:
- clarity
- administration
- review
- productivity
- dense but readable information

## 3. Reuse before inventing

Before creating anything new:
- inspect current components
- inspect current routes
- inspect current Supabase patterns
- inspect mobile source files
- inspect docs

Do not create duplicate component patterns if a reusable one should exist.

## 4. Small clean phases

Build features in phases:
- shell
- read path
- write path
- validation
- permissions
- polish

Do not overbuild first pass versions.

## 5. Backend truth matters

Supabase is the backend truth.
Never invent:
- table names
- field names
- RPC names
- role names
- permission assumptions

If something is unclear, inspect and call it out.

---

# UI Mindset

KickChasers should feel like:
- premium sports tech
- dark, confident, high contrast
- clean and modern
- similar in quality to Hudl, Strava, Linear, Apple dashboards

Use:
- dark navy surfaces
- accent neon green (#39FF88) sparingly
- rounded cards
- stat pills
- strong headers
- compact but readable data tables
- clean spacing
- desktop-appropriate layouts

Avoid:
- generic template SaaS styling
- too many nested containers
- over-animation
- random spacing systems
- mobile UI awkwardly stretched to desktop

---

# Route Mindset

The portal should broadly organize around:

- Dashboard
- Squads
- Games
- Stats
- Notifications
- Profile
- Settings
- Admin

Each page should feel like part of one coherent system.

Do not make each route look like it belongs to a different app.

---

# Component Mindset

Prefer building and reusing stable components such as:

- PortalLayout
- SidebarNavigation
- Topbar
- PortalCard
- StatCard
- DataTable
- SquadHeader
- RosterTable
- NotificationRow
- PortalForm
- PortalModal

If a page needs repeated UI patterns, extract them.

Avoid page-specific one-off UI unless clearly justified.

---

# Data / Query Mindset

Before wiring data:
- identify the exact mobile source
- identify exact tables/views/RPCs
- identify the read path
- identify the write path
- identify role / RLS sensitivities

For data-heavy pages:
- think about pagination
- think about loading states
- think about empty states
- think about permission-based visibility
- think about whether summary pages need multiple queries coordinated

Do not hide uncertainty.
Document it.

---

# Permission Mindset

KickChasers has role complexity.

Examples:
- owner
- admin
- member
- club admin
- platform admin
- official squad paths
- custom squad paths

Never assume a user can act just because a button exists in UI.

Always ask:
- what is the actual backend permission path?
- what role is required?
- is this official-only?
- is this custom-squad only?
- is there an RPC/helper involved?

If permissions are fragmented, prefer a centralized capability model in the web layer.

---

# Phase Discipline

Codex should always know what phase it is in.

Examples:
- Phase 1: shell and auth
- Phase 2: profile/settings
- Phase 3: squads
- Phase 4: games/stats/notifications
- Phase 5: admin

Do not pull future-phase features into the current phase unless explicitly required.

This is a major rule.

---

# Audit Habit

For meaningful tasks, always start by answering:

1. What already exists in web?
2. What mobile source should this mirror?
3. What docs govern this feature?
4. What backend entities are involved?
5. What permissions matter?
6. What is v1 scope vs later scope?
7. What can be reused?

Then plan implementation before editing files.

---

# Build Habit

Prefer this sequence:

A. Page / route shell
B. Layout and reusable components
C. Read data path
D. Actions / mutations
E. Validation and states
F. Permission gating
G. Polish

This keeps changes controlled.

---

# Verification Habit

Before finishing, check:

- build passes
- types pass if applicable
- routes render
- loading states exist
- empty states exist
- auth/permissions still work
- unrelated files were not changed without reason

If you cannot verify something, say so clearly.

---

# Communication Format

For meaningful tasks, respond in this structure:

1. Audit Summary
2. Plan
3. Implementation
4. Verification
5. Risks / Follow-ups

This is the preferred working style for this project.

---

# Anti-Drift Rules

Do not:
- invent new product concepts
- silently rename concepts
- re-architect without reason
- rebuild mobile match-day tracking on web
- create new schema assumptions
- add broad speculative refactors
- change unrelated files casually

Do:
- stay grounded
- stay phase-aware
- stay aligned with docs
- keep implementations clean and reversible

---

# Web Adaptation Rules

Translate, do not clone.

Examples:

Mobile onboarding:
- modal pickers, long vertical flow

Web onboarding:
- grouped sections
- searchable dropdowns
- cleaner field layout

Mobile squad manage:
- action sheets
- deep navigation stacks

Web squad manage:
- tabs
- tables
- side panels
- persistent context

Mobile notifications:
- feed-like list with tap actions

Web notifications:
- action inbox
- bulk visibility
- clearer context

---

# Final Operating Rule

The goal is not to move fast and improvise.

The goal is to build a high-quality portal that:
- matches the KickChasers product
- respects the backend
- feels premium
- is practical on desktop
- evolves cleanly over time

Priority order:
accuracy > clarity > maintainability > speed > novelty
