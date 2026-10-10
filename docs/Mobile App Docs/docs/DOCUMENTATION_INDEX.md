# KickChasers Documentation Index

Last verified: 2026-07-31
Source of truth: repository documentation inventory plus the 2026-07-23 code, migration, and configuration audit

“Authoritative” means the document was reconciled to the current repository during this audit. Code and ordered migrations still win when they disagree with prose. “Historical” material is retained for design or release context and must not be used to infer shipped behaviour.

## Recommended reading order

1. [Docs Quick Index](README.md) — choose references by task without reading the entire documentation set.
2. [Repository README](../README.md) — repository entry point and setup.
3. [Project Context](PROJECT_CONTEXT.md) — product state, architecture, platform, risks.
4. [Current Feature Matrix](CURRENT_FEATURE_MATRIX.md) — evidence-backed implementation status.
5. [Project Map](PROJECT_MAP.md) and [Routes and Queries](ROUTES_AND_QUERIES.md) — implementation navigation.
6. [Supabase Context](SUPABASE_CONTEXT.md), [Database Schema Notes](DB_SCHEMA_NOTES.md), and [RLS and Policies](RLS_AND_POLICIES.md) — backend authority and risk.
7. [Product Vision](PRODUCT_VISION.md), [Product Roadmap](PRODUCT_ROADMAP.md), and [Growth and Monetisation Context](GROWTH_AND_MONETISATION_CONTEXT.md) — direction and sequencing.

## Current authoritative references

| Document | Purpose | Primary source | Last verified | Category |
| --- | --- | --- | --- | --- |
| [Docs Quick Index](README.md) | Routes Codex/developers to the minimum references needed for a task | Current documentation map | 2026-07-28 | Authoritative navigation |
| [README](../README.md) | Product/repository entry point, setup, and headline risks | Code, config, migrations | 2026-07-23 | Authoritative |
| [TODO](../TODO.md) | Short current engineering queue | Confirmed gaps from audit | 2026-07-23 | Authoritative |
| [AI Contributor Guide](AI_GUIDE.md) | Guardrails and reading order for coding assistants | Current documentation and code conventions | 2026-07-23 | Authoritative |
| [Project Context](PROJECT_CONTEXT.md) | Current product, architecture, platform, and risks | Reachable code, config, migrations | 2026-07-23 | Authoritative |
| [Project Map](PROJECT_MAP.md) | Runtime layers and end-to-end flows | Routes, imports, navigation, data modules | 2026-07-23 | Authoritative |
| [Current Feature Matrix](CURRENT_FEATURE_MATRIX.md) | Status, platform, users, routes, implementation and limitations | Reachable UI, backend, configuration | 2026-07-23 | Authoritative |
| [Components Registry](COMPONENTS_REGISTRY.md) | Ownership and use of major reusable components | Reachable imports and component implementations | 2026-07-23 | Authoritative |
| [Routes and Queries](ROUTES_AND_QUERIES.md) | Route map, auth rules, and principal data access | All `app/**/*.tsx`, hooks, repositories | 2026-07-23 | Authoritative |
| [New Game Flow](NEW_GAME_FLOW.md) | Four current tracking modes and constraints | Tracker routes/components, libraries, migrations | 2026-07-23 | Authoritative |
| [Supabase Context](SUPABASE_CONTEXT.md) | Client, schema authority, functions, storage, Realtime | Supabase client/config/migrations/functions | 2026-07-23 | Authoritative |
| [Database Schema Notes](DB_SCHEMA_NOTES.md) | Current table/view/RPC catalogue and drift | Ordered migrations | 2026-07-23 | Authoritative |
| [RLS and Policies](RLS_AND_POLICIES.md) | Static access-control reconciliation | Ordered policies, grants, functions | 2026-07-23 | Authoritative |
| [Roles and Permissions](ROLES_AND_PERMISSIONS.md) | App, squad, club, tracker and admin roles | UI gates plus RLS/RPC checks | 2026-07-23 | Authoritative |
| [Notifications Specification](NOTIFICATIONS_SPEC.md) | Notification types, triggers, routing, and push path | Migrations, Edge Function, routing code | 2026-07-23 | Authoritative |
| [Benchmarks](BENCHMARKS.md) | Player benchmark bands and presentation | Benchmark code and consumers | 2026-07-23 | Authoritative subsystem |
| [Player Card Template Foundation — Stage 1](PLAYER_CARD_TEMPLATE_FOUNDATION_STAGE_1.md) | Dormant canonical model, adapters, template boundary, active-path inventory and parity findings | Active player-card paths and additive Stage 1 files | 2026-07-28 | Architecture foundation |
| [Player Cutout Engine — Stage 2A.1](PLAYER_CUTOUT_ENGINE_STAGE_2A_1.md) | iOS Apple Vision cutout engine foundation, Expo module, local cache, diagnostics and validation matrix | Player Cutout Engine module and Admin lab | 2026-07-30 | Technical foundation |
| [Player Cutout Engine — Stage 2A.2](PLAYER_CUTOUT_ENGINE_STAGE_2A_2.md) | Multi-subject detection contract, bounded session lifecycle, selection UI, cache v2 and physical-device gate | Player Cutout Engine module, focused tests and Admin lab | 2026-07-30 | Technical foundation |
| [Premium Player Cutout Editor — Stage 2B / 2B.1](PLAYER_CUTOUT_EDITOR_STAGE_2B.md) | Non-destructive editor, Quick Select/Refine UX, edge protection, gesture geometry, local draft cache and physical-device quality gate | Player Cutout Editor module, focused tests and Admin editor/lab | 2026-07-31 | Technical foundation |
| [Player Cutout Workflow — Stage 2B.2](PLAYER_CUTOUT_EDITOR_STAGE_2B_2.md) | Canonical image orientation, optional local pre-crop, clean circular Remove rasterisation, cache compatibility and device validation matrix | Player Cutout pipeline, editor compositor, Admin crop/editor/lab | 2026-07-31 | Technical foundation |
| [Performance Card Template Engine — Stage 2C](PERFORMANCE_CARD_TEMPLATE_ENGINE_STAGE_2C.md) | Reusable media-template contract, White Editorial template, mock production model, player positioning and 1080 × 1350 local export | Performance Card module and protected Admin positioning/preview flow | 2026-07-31 | Technical foundation |
| [White Editorial Visual Parity — Stage 2C.1](PERFORMANCE_CARD_WHITE_EDITORIAL_STAGE_2C_1.md) | Approved-reference comparison, typography/layout refinements, clean stats-panel layering and optional-logo export fallback | White Editorial template, generic renderer asset readiness and focused tests | 2026-07-31 | Visual refinement |
| [Performance Card Data Hydration — Stage 2D](PERFORMANCE_CARD_DATA_HYDRATION_STAGE_2D.md) | Canonical production-source adapters, media model projection, source parity fixtures and protected read-only preview | Performance Card model/builder, existing tracker/manual data sources and Admin developer tool | 2026-08-01 | Data integration foundation |
| [Automatic Player Card Generation — Stage 2E](PLAYER_CARD_AUTOMATIC_GENERATION_STAGE_2E.md) | Completed Team Tracker generation service, explicit local cutout association, exact PNG capture and protected preview | Stage 2D hydration, White Editorial renderer, local cache and Admin developer tool | 2026-08-02 | Generation pipeline proof |
| [Player Card Production Workflow — Stage 2E.1](PLAYER_CARD_PRODUCTION_WORKFLOW_STAGE_2E_1.md) | Two-decision photo-to-card workflow, automatic subject selection, optional editing and non-persistent PlayerImage contract | Existing Vision/editor modules, Stage 2E generation service and Admin prototype | 2026-08-02 | Production workflow prototype |
| [Player Card Final Refinements — Stage 2E.2](PLAYER_CARD_FINAL_REFINEMENTS_STAGE_2E_2.md) | White Editorial secondary text colour and source-backed Keep restoration for Vision-omitted pixels | White Editorial template and native Player Cutout Editor compositor | 2026-08-02 | Production workflow refinement |
| [Player Card Production Workflow — Stage 2F](PLAYER_CARD_PRODUCTION_WORKFLOW_STAGE_2F.md) | Production completed-game entry points, returning-player fast path, shared workflow route and Team Summary regression boundary | Existing Stage 2D hydration, Stage 2E generation/workflow services and production summaries/Game Log | 2026-08-02 | Production workflow integration |
| [Player Card Album](PLAYER_CARD_ALBUM.md) | Permanent cloud-backed Player Card collection, immutable assets, owner-only metadata, replacement and post-once semantics | `player_cards` migration, Album repository/services and Me Album UI | 2026-08-09 | Production player-card persistence |
| [AFL API Discovery Lab — Stage AFL-1](AFL_API_DISCOVERY_STAGE_AFL_1.md) | Verified API-Sports AFL contract, admin-only Edge Function boundary, versioned non-persistent DTOs and discovery limitations | Live provider responses, AFL module, Edge Function and protected Admin lab | 2026-08-09 | External-data discovery foundation |
| [AFL Player Card Proof — Stage AFL-2](AFL_PLAYER_CARD_POC_STAGE_AFL_2.md) | Development-only projection of one real AFL player match into the existing foundation model, templates and local PNG renderer | AFL normalized DTOs, dedicated adapter, availability-aware builder and protected Admin proof | 2026-08-09 | External-data integration proof |
| [AFL Card Refinement Build](AFL_CARD_REFINEMENT_BUILD.md) | Shared Fantasy and Impact7, explicit AFL club branding, and source-neutral handoff into the existing Player Card editor | Development-only AFL card refinement; no AFL persistence or publishing | 2026-08-10 | External-data card workflow proof |
| [Admin AFL Card Creator Integration](AFL_ADMIN_CARD_CREATOR_INTEGRATION.md) | Compact Admin AFL source selection, shared external projection, existing editor handoff and platform-admin Feed publishing | Existing AFL discovery/card modules, Player Card renderer/publisher, Feed posts and additive RLS guard | 2026-08-11 | Internal card-creator integration |
| [Stats Sequencing](STATS_SEQUENCING.md) | Tracker selection/modifier sequence | Active tracker handlers | 2026-07-23 | Authoritative subsystem |
| [Design Principles](DESIGN_PRINCIPLES.md) | Current visual/product interaction direction | Theme and reachable screens/components | 2026-07-23 | Authoritative |
| [Contributor Onboarding](onboarding.md) | Local setup, data rules, validation, safe first changes | Package/app/EAS/Supabase config | 2026-07-23 | Authoritative |

## Product and planning

| Document | Purpose | Primary source | Last verified | Category |
| --- | --- | --- | --- | --- |
| [Product Vision](PRODUCT_VISION.md) | Current value proposition and explicit aspirations | Implemented behaviour and owner context | 2026-07-23 | Current strategy |
| [Product Roadmap](PRODUCT_ROADMAP.md) | Now/Next/Later/Exploratory sequence with evidence and measures | Confirmed gaps and scaffolds | 2026-07-23 | Current strategy |
| [Growth and Monetisation Context](GROWTH_AND_MONETISATION_CONTEXT.md) | User context, segments, growth loop, commercial reality, recommended metrics | Owner brief and repository evidence | 2026-07-23 | Current strategy |
| [AI and Automation Opportunities](AI_AND_AUTOMATION_OPPORTUNITIES.md) | Implemented AI status and bounded future opportunities | Dependencies, UI, backend, generation code | 2026-07-23 | Current strategy |

## Operational, legal, and release records

| Document | Purpose | Primary source | Last verified | Category |
| --- | --- | --- | --- | --- |
| [Release Notes](../RELEASE_NOTES.md) | Historical 1.1.3 change record | Release document; implementation may have moved on | 2026-07-23 (status) | Release record |
| [Privacy Policy](privacy-policy.md) | User-facing privacy terms | Approved legal/operational text, not source code | Effective 2026-03-01; not legal-reviewed in this audit | Legal |
| [Terms of Service](terms-of-service.md) | User-facing service terms | Approved legal/operational text, not source code | Effective 2026-03-01; not legal-reviewed in this audit | Legal |
| [Community Guidelines](community-guidelines.md) | User behaviour and moderation expectations | Approved policy text | Effective 2026-03-01; not legal-reviewed in this audit | Policy |
| [Contact and Support](contact-support.md) | Support channels and expectations | Operational text | Effective 2026-03-01; not operationally verified in this audit | Operations |
| [Logo Asset README](../assets/logos/README.md) | Logo asset placement guidance | Asset directory | 2026-07-23 (inventory only) | Supporting |

## Historical and design references

| Document | Purpose | Primary source | Last verified | Category |
| --- | --- | --- | --- | --- |
| [Web Portal Plan](KICKCHASERS_WEB_PORTAL_PLAN.md) | Prior desktop/web product study | Historical design analysis | 2026-07-23 (classification only) | Historical/aspirational |
| [Legacy Team Summary Web](TEAM_SUMMARY_WEB.md) | Previous browser-route summary design | Legacy web architecture | 2026-07-23 (classification only) | Historical |
| [Container UI System](KickChasers%20Container%20UI%20System.md) | Container-first visual direction | Onboarding-era design snapshot | 2026-07-23 (classification only) | Historical design |
| [Team Tracker UI Documentation](Team%20tracker%20UI-DOCUMENTATION.md) | Prior visual specification | Design snapshot | 2026-07-23 (classification only) | Historical design |
| [Pass 4 Release Hardening](PASS_4_RELEASE_HARDENING.md) | Prior TestFlight/App Store checklist | Historical release activity | 2026-07-23 (classification only) | Historical operations |
| [Stats Sequencing Audit](STATS_SEQUENCING_AUDIT.md) | Earlier cross-tracker implementation comparison | Code snapshot and line references | 2026-07-23 (classification only) | Historical audit |
| [Tracker Redesign](../design/tracker-redesign.md) | Tracker redesign exploration | Design proposal | 2026-07-23 (classification only) | Historical design |
| [Team Tracker Behaviour](../design/team-tracker/BEHAVIOUR.md) | Intended interaction behaviour | Design specification | 2026-07-23 (classification only) | Design reference |
| [Team Tracker Components](../design/team-tracker/COMPONENTS.md) | Intended component breakdown | Design specification | 2026-07-23 (classification only) | Design reference |
| [Team Tracker Layout](../design/team-tracker/LAYOUT.md) | Intended responsive layout | Design specification | 2026-07-23 (classification only) | Design reference |
| [Team Tracker Style Tokens](../design/team-tracker/STYLE_TOKENS.md) | Design token snapshot | Design specification | 2026-07-23 (classification only) | Design reference |
| [iPad Air Team Tracker Spec](../design/team-tracker/IPAD_AIR_TEAM_TRACKER_SPEC_FOR_CODEX.md) | iPad-specific implementation brief | Design specification | 2026-07-23 (classification only) | Historical design |
| [Collapsible Side Menu](../design/team-tracker/Collapsible%20Side%20Menu%20%28Team%20Stats%20%3A%20Player%20Stats%20%3A%20Game%20Log%29.md) | Side-menu interaction concept | Design proposal | 2026-07-23 (classification only) | Historical design |

## Excluded generated/vendor documentation

`.expo/README.md` and Markdown under `ios/Pods/` are generated or third-party material. They are not KickChasers project documentation and are intentionally excluded from the authority tables.
