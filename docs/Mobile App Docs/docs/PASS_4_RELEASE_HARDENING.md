# PASS 4 Release Hardening (TestFlight + App Store)

Status: historical release checklist; completion statements are not current production verification
Last verified: 2026-07-23
Source of truth: this file for its historical checklist; `README.md`, `PROJECT_CONTEXT.md`, `app.json`, `eas.json`, and the target EAS/store environments for current release posture

## Sentry setup (release only)

1. Install dependency (network required):
   - `npm install`
2. Set production DSN in EAS env:
   - `EXPO_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>`
   - Optional: `EXPO_PUBLIC_APP_ENV=production`
3. Sentry is initialized only when `!__DEV__` in `lib/sentry.ts`.
4. PII is disabled with `sendDefaultPii: false`, and email/ip/auth-like headers are stripped in `beforeSend`.

## EAS sourcemaps upload

Use Sentry auth values in your EAS environment:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Recommended build command:

- `eas build --platform ios --profile production`

During build, the Sentry RN tooling uploads source maps automatically when auth variables are present.

Note:

- Development EAS builds disable Sentry source map auto-upload via `SENTRY_DISABLE_AUTO_UPLOAD=true`.
- Production builds require `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for source map uploads.

## Local build smoke commands

Run in this order:

1. `npm install`
2. `npm run typecheck`
3. `npx expo-doctor`
4. `npx expo config --type introspect`
5. Optional (only if prebuild workflow is used): `npx expo prebuild --platform ios --no-install`

## Test crash in TestFlight

1. Open a throwaway route and temporarily add:
   - `throw new Error('Sentry TestFlight crash test')`
2. Launch app in TestFlight and open that route.
3. Confirm branded fallback screen appears with:
   - title `Something went wrong`
   - buttons `Try Again` and `Go Home`
   - visible error reference id
4. Revert the throw after verification.

## Verify in Sentry dashboard

1. Open Sentry project issues feed.
2. Confirm event includes:
   - release like `kickchasers-mobile@<version>+<build>`
   - environment `production` (or `EXPO_PUBLIC_APP_ENV`)
   - stack trace symbolicated (source maps uploaded)
3. Confirm user email/ip and auth headers are not present in event payload.

## iOS permissions hardening

Run:

- `npx expo config --type introspect`

Expected `Info.plist` keys:

- `NSUserNotificationsUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `ITSAppUsesNonExemptEncryption`
- `UISupportedInterfaceOrientations~ipad`

## OAuth redirect sanity

OAuth redirect remains:

- `kickchasers://auth/callback`

Config points:

- App scheme: `kickchasers` in `app.json`
- Android callback intent filter still targets `kickchasers://auth/callback`
- Runtime redirect builder remains `Linking.createURL("auth/callback")` in `lib/auth.ts`
