# KickChasers contributor onboarding

Last verified: 2026-07-23

Source of truth: `package.json`, `app.json`, `eas.json`, `lib/supabase.ts`, `supabase/config.toml`, migrations, and current repository layout.

## Prerequisites

- Node.js 20+ and npm.
- Xcode for iOS development and/or Android Studio for Android emulator work.
- Docker Desktop plus Supabase CLI for the local backend.
- Expo/EAS access for signed preview/production builds.
- Supabase project access for remote development.

## Install

```bash
npm install
```

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run start` | Expo development server |
| `npm run ios` | prebuild/run iOS |
| `npm run android` | prebuild/run managed Android |
| `npm run web` | static web development |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | Expo ESLint |

There is no first-party automated test command or test suite.

## Environment

Create `.env` with:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

Optional runtime variables:

```dotenv
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_REALTIME_DEBUG=0
EXPO_PUBLIC_WEB_ORIGIN=https://kickchasers.com
EXPO_PUBLIC_IOS_APP_STORE_URL=
EXPO_PUBLIC_ANDROID_PLAY_STORE_URL=
```

Never expose the Supabase service-role key through `EXPO_PUBLIC_*`.

## Local Supabase

```bash
npx supabase start
npx supabase db reset
npx supabase functions serve --env-file supabase/.env
```

`db reset` applies `supabase/migrations/` in order and then `supabase/seed.sql`. Do not apply `supabase/migrations_old/`. Do not treat the March root/prod schema snapshots as migration input.

Edge Function secrets are required for full testing:

- `PUSH_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for `delete-account`

The database also expects internal push values in `app_internal_settings`.

## App startup and accounts

- The root layout requires authentication except auth screens and `/vote-card/[token]`.
- New/incomplete users are routed to `/onboarding`.
- OAuth callback support exists for Google and Apple; provider console redirects must match Supabase and the `kickchasers://auth/callback` scheme.
- Use a development build for reliable native module, link, push, SQLite, print, and orientation testing.

## Database workflow

1. Add a new timestamped file under `supabase/migrations/`.
2. Reset locally from zero.
3. Test RLS using distinct owner/member/outsider/anon identities.
4. Regenerate `src/lib/database.types.ts` from the migrated database.
5. Run typecheck/lint and relevant device flows.
6. Document security-definer grants and `search_path`.

The current generated types are incomplete; do not copy their omissions into a new migration.

## Native/build context

- iOS native files are checked in under `ios/`.
- Android is managed from `app.json`/EAS; there is no checked-in `android/` directory.
- App version is `1.2.0`; iOS build number and Android version code are `5` in `app.json`.
- iOS supports iPad and associated domains. Android declares shared-game and auth intent filters.
- Sentry source upload is enabled for preview/production but allowed to fail.

## Required smoke test

1. Sign in and complete onboarding.
2. Create a single-player game, log/map/undo a stat, disconnect/reconnect, and finalise.
3. Create a team game, select squads/players, log both player and score events, open live summary, export PDF.
4. Create a Team Stats Game and open it from the coaches area.
5. Create/use a custom stat and confirm it in summary/PDF.
6. Exercise feed like/comment/share/report/block.
7. Exercise squad invite/request/guest merge/team selection.
8. Exercise award group → matchup → card → public token → tally.
9. Test notification routing and badge on physical iOS/Android devices.
10. Test account deletion with storage objects.

## Troubleshooting

- Missing columns/RPCs: confirm all 131 current migrations ran; ignore old snapshots.
- Images fail: verify active buckets and user-prefix policies, especially `profile-avatars`, `team-logos`, and `post-images`.
- Linked tracker does not update: verify `games`/`events` Realtime publication and RLS for both users.
- Push fails: inspect `pg_net`, internal settings, Edge Function logs, tokens, and APNs/FCM credentials.
- Web share asks for sign-in: this is the currently documented root-auth-gate limitation.
