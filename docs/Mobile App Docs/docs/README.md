# KickChasers Docs — Quick Index for Codex

Last verified: 2026-07-31

Source of truth: the documentation map in `DOCUMENTATION_INDEX.md`; current application code and ordered Supabase migrations remain authoritative

Use this file to choose the smallest useful set of references. Do not read every document by default.

## Start here by task

| If you need to… | Read this first | Then read only if needed |
| --- | --- | --- |
| Understand what KickChasers currently does | [CURRENT_FEATURE_MATRIX.md](CURRENT_FEATURE_MATRIX.md) | [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) |
| Understand the overall architecture or a data flow | [PROJECT_MAP.md](PROJECT_MAP.md) | [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) |
| Find a screen, route, redirect, auth gate, or its data access | [ROUTES_AND_QUERIES.md](ROUTES_AND_QUERIES.md) | [COMPONENTS_REGISTRY.md](COMPONENTS_REGISTRY.md) |
| Find the owner of a UI component or feature surface | [COMPONENTS_REGISTRY.md](COMPONENTS_REGISTRY.md) | [PROJECT_MAP.md](PROJECT_MAP.md) |
| Work on game creation, tracking, linked games, summaries, or exports | [NEW_GAME_FLOW.md](NEW_GAME_FLOW.md) | [STATS_SEQUENCING.md](STATS_SEQUENCING.md), [CURRENT_FEATURE_MATRIX.md](CURRENT_FEATURE_MATRIX.md) |
| Work with Supabase, Edge Functions, Storage, Realtime, or environments | [SUPABASE_CONTEXT.md](SUPABASE_CONTEXT.md) | [DB_SCHEMA_NOTES.md](DB_SCHEMA_NOTES.md) |
| Find a table, view, constraint, RPC, trigger, or schema contradiction | [DB_SCHEMA_NOTES.md](DB_SCHEMA_NOTES.md) | [SUPABASE_CONTEXT.md](SUPABASE_CONTEXT.md) |
| Review RLS, grants, public/authenticated access, or a Security Definer function | [RLS_AND_POLICIES.md](RLS_AND_POLICIES.md) | [ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md), [DB_SCHEMA_NOTES.md](DB_SCHEMA_NOTES.md) |
| Understand squad, club, tracker, or platform-admin permissions | [ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md) | [RLS_AND_POLICIES.md](RLS_AND_POLICIES.md) |
| Work on notifications or push delivery | [NOTIFICATIONS_SPEC.md](NOTIFICATIONS_SPEC.md) | [SUPABASE_CONTEXT.md](SUPABASE_CONTEXT.md), [ROUTES_AND_QUERIES.md](ROUTES_AND_QUERIES.md) |
| Match current visual and interaction conventions | [DESIGN_PRINCIPLES.md](DESIGN_PRINCIPLES.md) | Current nearby screen/components; older visual specs are historical |
| Work on player benchmarks or tracker sequencing | [BENCHMARKS.md](BENCHMARKS.md) or [STATS_SEQUENCING.md](STATS_SEQUENCING.md) | Active implementation files named in the selected document |
| Work on the premium cutout editor | [PLAYER_CUTOUT_EDITOR_STAGE_2B.md](PLAYER_CUTOUT_EDITOR_STAGE_2B.md) | [PLAYER_CUTOUT_ENGINE_STAGE_2A_2.md](PLAYER_CUTOUT_ENGINE_STAGE_2A_2.md) for its input pipeline |
| Work on iOS player cutouts or subject selection | [PLAYER_CUTOUT_ENGINE_STAGE_2A_2.md](PLAYER_CUTOUT_ENGINE_STAGE_2A_2.md) | [PLAYER_CUTOUT_ENGINE_STAGE_2A_1.md](PLAYER_CUTOUT_ENGINE_STAGE_2A_1.md) for the original foundation |
| Set up the repository or validate a change | [onboarding.md](onboarding.md) | [README.md](../README.md), [AI_GUIDE.md](AI_GUIDE.md) |
| Understand product direction or decide what is unfinished | [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md) | [PRODUCT_VISION.md](PRODUCT_VISION.md), [TODO.md](../TODO.md) |
| Work on growth, pricing, analytics, AI, or automation planning | [GROWTH_AND_MONETISATION_CONTEXT.md](GROWTH_AND_MONETISATION_CONTEXT.md) | [AI_AND_AUTOMATION_OPPORTUNITIES.md](AI_AND_AUTOMATION_OPPORTUNITIES.md) |
| Find every document or determine whether one is historical | [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Nothing else until a task requires it |

## Minimum reading rules

1. Read this index.
2. Open the one primary document matching the task.
3. Open secondary documents only when the task crosses those boundaries.
4. Before changing behaviour, inspect the active code named in the document.
5. Before changing the database, read migrations in filename order. Do not rely on schema snapshots or generated TypeScript types alone.
6. Do not use historical/design documents as proof of current functionality.

## Fast status reminders

- `supabase/migrations/` is the database authority.
- Reachable routes and active imports determine whether a UI feature is live.
- `/vote-card/[token]` is the only explicitly anonymous product route.
- `/share/game/[id]` is currently auth-gated.
- Only the single-player tracker has an offline SQLite event queue.
- Best & Fairest voting is live; Profile Awards is not connected.
- Voice tracking, AI reports, product analytics, and operational commerce are not implemented.
- Broad authenticated-read RLS policies on match/squad data remain a known privacy risk.

For the complete documentation catalogue and verification status, use [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md).
