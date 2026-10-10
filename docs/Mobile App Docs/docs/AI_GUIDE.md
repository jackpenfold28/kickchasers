# AI Contributor Guide

Last verified: 2026-07-23
Source of truth: repository code/configuration, ordered Supabase migrations, and the current documentation set

This is a navigation guide for coding assistants, not a substitute for inspecting the implementation.

## Read first

1. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — product, platform, and known risks.
2. [PROJECT_MAP.md](PROJECT_MAP.md) — architecture and end-to-end flows.
3. [CURRENT_FEATURE_MATRIX.md](CURRENT_FEATURE_MATRIX.md) — shipped, partial, infrastructure-only, and absent capabilities.
4. [ROUTES_AND_QUERIES.md](ROUTES_AND_QUERIES.md) — route and data ownership.
5. [SUPABASE_CONTEXT.md](SUPABASE_CONTEXT.md), [DB_SCHEMA_NOTES.md](DB_SCHEMA_NOTES.md), and [RLS_AND_POLICIES.md](RLS_AND_POLICIES.md) before changing data access.

## Repository rules

- Expo Router owns navigation. The signed-in default route is `/feed`; `/(tabs)/index` exists as a hidden hub, not the default tab.
- Keep Supabase access behind existing hooks/helpers where practical, but verify the actual query and migration rather than relying on generated types.
- `supabase/migrations/` is the schema authority. The dated schema snapshots and `src/lib/database.types.ts` currently lag the migration chain.
- Only the single-player tracker has the Expo SQLite offline queue. Do not describe team tracker modes as offline-capable.
- Treat the four tracking modes separately: single-player, full team, linked two-device team, and Team Stats Game.
- Custom stats are counter definitions, capped at five, and are supported in tracker modes; manual game entry does not support arbitrary custom counters.
- “Momentum” has multiple meanings in the UI. Name the concrete representation: live stat differential, player influence timeline, score worm, or cross-game rating trend.
- Recaps are deterministic templates. No AI report/caption service or voice parser is implemented.
- Team-summary PDF export exists. Do not claim player or quarter-specific PDF products.
- Do not infer privacy from UI filters. Broad authenticated-read RLS policies exist on core match tables.

## Validation expectations

- Keep source, database, native, and dependency changes within the user-approved scope.
- Run `npm run lint` and `npm run typecheck` for code changes.
- For database work, inspect later migrations for policy/function replacements and verify against a local or linked database when available.
- Exercise auth, offline/reconnect, linked-device ownership, undo, quarter transitions, and summaries for tracker changes.
- Report configuration-dependent claims—push delivery, OAuth, Realtime publication, universal links, store state—as unverified unless tested in the target environment.

See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for the authority and status of every document.
