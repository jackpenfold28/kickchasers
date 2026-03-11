# AI_WORKFLOW.md
KickChasers Web Portal — AI Workflow

This document defines the required workflow for Codex when working on the KickChasers web portal.

The goal is to keep implementation consistent, grounded in the mobile product and backend, and free from architecture drift.

---

# Core Rule

Codex must not jump straight into coding major features.

For any meaningful portal change, follow this workflow:

1. Audit
2. Plan
3. Implement
4. Verify
5. Summarize

---

# 1. Audit First

Before making changes, Codex must inspect:

- relevant existing web files
- relevant mobile source files
- current portal docs in `/docs`
- required Supabase tables / RPCs / policies
- existing route and component structure

Questions Codex must answer during audit:

- What already exists?
- What should be reused?
- What mobile source is the feature based on?
- What backend dependencies are required?
- What permissions / RLS rules may affect this feature?
- Is this feature web-suitable or mobile-only?

For large changes, Codex should provide a short audit summary before implementation.

---

# 2. Plan Before Implementing

Before coding, Codex should define:

- feature scope
- files to create or update
- key components needed
- data dependencies
- routing implications
- risks / edge cases

For larger features, Codex should break implementation into small steps.

Examples:
- build page shell
- wire data fetching
- add forms / mutations
- add validation
- add loading / error states
- add permissions handling

Codex should avoid broad refactors unless required.

---

# 3. Implement in Phases

Codex should implement the smallest clean version of the feature first.

Preferred order:

- page/layout shell
- data loading
- core actions
- validation
- loading/error/empty states
- polish

Do not overbuild first pass versions.

Do not add features outside the defined scope.

---

# 4. Verify Before Finishing

After changes, Codex should verify:

- build passes
- routing still works
- auth/permissions still work
- types pass if applicable
- no unrelated files were changed unnecessarily
- feature matches the docs and mobile intent

If something cannot be verified, Codex should clearly say so.

---

# 5. Summarize Clearly

At the end of each task, Codex should return:

- what was changed
- which files were added/updated
- what mobile files were referenced
- what backend tables / RPCs were used
- any risks / follow-up items
- anything still intentionally not implemented

---

# Scope Control Rules

Codex must always respect these files:

- KICKCHASERS_WEB_BUILD_GUIDE.md
- KICKCHASERS_WEB_PORTAL_PLAN.md
- WEB_PORTAL_FEATURE_RULES.md
- PORTAL_ROADMAP.md
- KICKCHASERS_PORTAL_UI_BLUEPRINT.md
- PORTAL_COMPONENT_LIBRARY.md
- PORTAL_DASHBOARD_SPEC.md
- AI_WORKFLOW.md

If instructions conflict, follow:
1. WEB_PORTAL_FEATURE_RULES.md
2. KICKCHASERS_WEB_BUILD_GUIDE.md
3. KICKCHASERS_WEB_PORTAL_PLAN.md
4. task-specific prompt

---

# Web Portal Principles

Codex must remember:

- the web portal is management-first
- mobile remains match-day-first
- do not recreate live tracker flows on web
- preserve backend naming and schema
- adapt mobile UX patterns for desktop, do not clone them blindly
- prefer reusable components over page-specific one-offs

---

# UI Workflow Rules

When building UI, Codex should:

1. use existing portal layout/components first
2. follow the blueprint and component library
3. keep styling consistent
4. avoid container clutter
5. avoid overcomplicated animations
6. use desktop-friendly layouts:
   - tables
   - side panels
   - tabs
   - split views
   - structured forms

---

# Data / Backend Rules

When building data-driven features, Codex should:

- inspect current queries/mutations first
- reuse existing Supabase patterns where possible
- call out missing RPCs or schema mismatches
- never invent table/column names
- never silently change backend assumptions
- respect role and RLS requirements

If backend support is missing, Codex should say exactly what is missing.

---

# Feature Delivery Rules

For major features, Codex should prefer this delivery style:

Phase A:
- route/page shell
- layout
- static states

Phase B:
- live data
- queries
- loading/error states

Phase C:
- mutations/actions
- validation
- permissions

Phase D:
- polish
- responsive behavior
- UX improvements

---

# Commit Mindset

Codex should aim for changes that are:

- small
- reversible
- understandable
- well-scoped
- easy to test

Avoid:
- giant mixed-purpose changes
- unnecessary rewrites
- speculative improvements outside task scope

---

# Recommended Task Response Format

When given a build task, Codex should ideally respond in this structure:

1. Audit Summary
2. Plan
3. Implementation
4. Verification
5. Follow-ups

This keeps work consistent and easy to review.

---

# Final Rule

If a feature is unclear, Codex should inspect the repo and docs first, then make the safest grounded implementation choice.

The priority is:
accurate portal evolution > speed > novelty
