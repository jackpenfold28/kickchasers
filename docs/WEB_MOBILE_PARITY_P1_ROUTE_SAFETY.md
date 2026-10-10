# P1 Route Safety Remediation

Date: 18 August 2026  
Estimated parity: **78/100**  
Backend changes: none

## Scope

This stage resolves only P1-05 and P1-16. It protects the existing `/game/:gameId` alias before any game query, carries a validated internal destination through supported authentication/onboarding paths, and moves the landing primary CTA from disabled New Game to Dashboard. It does not implement anonymous sharing or New Game.

## P1-05 Before

`/game/:gameId` was classified as public and rendered `PublicGamePage`, which called the authenticated `getGameSummary` repository directly. Signed-out access therefore attempted protected reads, while an already authenticated user on any route classified as public was redirected to Dashboard rather than the requested game.

## Authenticated Game Route

`/game/:gameId` remains a compatibility/deep-link alias inside the outer application auth gate. Once session and onboarding checks pass, `ProtectedGameRedirect` uses the existing canonical tracked-summary route builder to navigate to `/games/:id`. The alias never reads game data itself.

The signed-out flow is:

```text
/game/:gameId
→ /sign-in?redirect=<encoded internal game path>
→ email/password, OAuth, or registration/verification
→ onboarding first when incomplete
→ /game/:gameId
→ /games/:id
```

An existing authenticated, complete user proceeds directly to the canonical summary without a Dashboard detour.

## Safe Return Path

`src/lib/canonical/route-safety.ts` owns the pure return-path contract. It accepts only root-relative internal paths. It decodes nested encoded input before validation and rejects:

- absolute HTTP(S) URLs;
- protocol-relative URLs;
- JavaScript/data schemes;
- encoded external or protocol-relative URLs;
- backslash/control-character forms;
- malformed percent encoding.

Invalid or missing values resolve to `/dashboard`. The same sanitizer is consumed by the application gate, email/password sign-in, OAuth callback, registration, email confirmation and onboarding completion.

## Anonymous Sharing Decision

Anonymous game viewing remains intentionally unsupported. No public token, signed URL, anonymous query, proxy, service role, RLS change or migration was added. The anonymous vote-card token route remains unchanged. A future anonymous game-sharing feature requires a separate product/security decision and an explicitly approved backend contract.

## Permission/Error Behaviour

The canonical authenticated summary repository remains the authorization boundary. A null result retains a not-found outcome. Recognizable permission errors render a permission-specific message; network failures render a retryable connection message; other query failures render a generic retryable error without exposing backend details. None renders an empty or zero summary.

## P1-16 Before

The landing hero “Get Started” control used `/sign-in?redirect=/new`. `/new` intentionally renders `DisabledRoute`, so the primary acquisition flow ended at unavailable functionality.

## Landing CTA Behaviour

The primary CTA now targets `/sign-in?redirect=/dashboard`. Signed-out users follow the existing authentication and onboarding flow; signed-in users are resolved by the existing public-route session gate to Dashboard without redundant authentication. No active landing/acquisition control targets `/new`.

## Disabled Routes

`/new`, `/newgame/:gameId`, `/setup/:gameId`, `/summary/:gameId` and `/viewer/:gameId` remain intentional `DisabledRoute` compatibility entries. This stage stops supported public flows from targeting them; it does not implement or remove tracker functionality.

## Files Changed

- `src/lib/canonical/route-safety.ts`
- `src/main.tsx`
- `src/routes/App.tsx`
- `src/routes/ProtectedGameRedirect.tsx`
- `src/routes/PublicGamePage.tsx` (removed)
- `src/routes/Landing.tsx`
- `src/routes/auth/Login.tsx`
- `src/routes/auth/Register.tsx`
- `src/routes/auth/CheckEmail.tsx`
- `src/routes/auth/Callback.tsx`
- `src/routes/Onboarding.tsx`
- `src/routes/portal/GameSummaryPage.tsx`
- `tests/route-safety-contracts.test.ts`
- `docs/WEB_MOBILE_PARITY_AUDIT.md`
- `docs/WEB_MOBILE_PARITY_P1_ROUTE_SAFETY.md`

## Tests

The 23 route-safety contracts cover internal/external/encoded/malformed return paths, exact game identity, auth gating, email/password, OAuth, registration, email verification, onboarding resumption, permission/network/not-found outcomes, landing acquisition controls, vote cards, public informational routes and retained disabled aliases.

## Validation

- Focused route-safety tests: PASS, 23/23.
- Full web suite: PASS, 90/90.
- Typecheck: PASS.
- Production build: PASS with the existing Browserslist-age and bundle-size advisories.
- `git diff --check`: PASS.
- Lint: no package script exists.

## Remaining Risks

- Hosted role testing should confirm representative permitted and denied game reads; no database runtime was mutated in this stage.
- OAuth providers must allow the configured callback URL. The callback query carries only a sanitized internal route.
- RLS may intentionally make some unauthorized rows indistinguishable from missing rows; the UI distinguishes permission only when the backend returns a recognizable authorization error.
- Anonymous game sharing remains unsupported by design.

## Recommended Next Stage

Proceed with P1-10 and P1-12 together as the canonical position-input stage. Both use the existing `FWD`/`MID`/`RUC`/`DEF` backend contract and one shared pure value/label registry. Do not begin P1-09 while migrations remain prohibited.
