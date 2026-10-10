# Supabase context

Last verified: 2026-07-23

Source of truth: `lib/supabase.ts`, active repositories/hooks, `supabase/config.toml`, `supabase/migrations/`, and `supabase/functions/`.

## Client

`lib/supabase.ts` creates the mobile client from:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- optional `EXPO_PUBLIC_REALTIME_DEBUG`

Auth is persisted and refreshed; app foreground/network state is connected to TanStack Query. Realtime auth is synchronised globally for RLS-aware channels.

## Backend responsibilities

- Auth: email/password, email OTP/recovery, Google OAuth, Apple OAuth.
- Postgres/RLS: all product data and permissions.
- Realtime: notifications and linked team-game reconciliation.
- Storage: public-read media with owner/prefix write policies.
- Edge Functions: push dispatch and privileged account deletion.
- `pg_net`: notification trigger invokes `send-push`.
- `pgcrypto`: public vote-card token generation.

## Edge Functions

### `send-push`

Triggered indirectly after notification inserts. It:

- requires bearer auth plus constant-time `x-webhook-secret` validation;
- resolves recipient Expo tokens through service credentials;
- creates notification-type-specific copy;
- sends badge-aware messages to Expo Push;
- handles invalid tokens.

The database trigger obtains the anon key and webhook secret from `app_internal_settings`. Deployment and current secret values cannot be established from the repository.

### `delete-account`

Requires the user bearer token, uses service role for storage/auth deletion, calls `f_delete_account_data`, removes known user storage prefixes, and deletes the Auth user. Product history is anonymised/reassigned rather than universally erased.

Risk: each storage-prefix lookup is capped at 1,000 objects and storage failures are logged as best-effort, so large accounts could leave orphaned objects.

## Storage

Migrations create public buckets:

- `avatars`
- `post-images`
- `posts`
- `profile-avatars`
- `stat-cards`
- `team-logos`

Policies also reference `item-logos`, but the migration does not create that bucket. Active client code primarily uses `post-images`, `profile-avatars`, and `team-logos`. `posts`, `avatars`, `stat-cards`, and `item-logos` are legacy/uncertain.

All listed media is public-read. “Public” here applies to object URLs, not to full unauthenticated app navigation.

## Database operational rules

- Apply only `supabase/migrations/` in timestamp order.
- Do not apply `migrations_old/` after the baseline.
- Do not regenerate migrations from the March schema snapshots.
- Refresh TypeScript database types from the migrated remote/local database after schema changes.
- Internal push settings belong in `app_internal_settings`, not `app_settings`.
- `app_settings` is readable to every authenticated user and must not contain secrets.

## Environment and deployment

Local app:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for account deletion
- `PUSH_WEBHOOK_SECRET` for push

Sentry variables are separate and documented in `README.md`.

## Local development

1. `npm install`
2. `npx supabase start`
3. Put the printed local URL and anon key in `.env`.
4. `npx supabase db reset` to reproduce all migrations and seed data.
5. `npx supabase functions serve --env-file supabase/.env` when testing Edge Functions.

During this audit, Docker was not running, so migrations were reconciled statically rather than against a local database.

## Current risks

- Generated database types and schema snapshots lag migrations.
- Realtime publication is explicit for notifications but not conclusively established in migrations for `games`/`events`.
- The push trigger contains a project-specific function URL; migration/redeploy to another project requires adjustment.
- Public storage plus broad authenticated match-data reads makes content classification important.
- Edge Function deployment/configuration cannot be verified from source alone.
