import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DEFAULT_AUTH_RETURN_PATH,
  buildOnboardingPath,
  buildSignInPath,
  classifyProtectedReadFailure,
  getSafeReturnPath,
} from '../src/lib/canonical/route-safety.ts'
import { buildTrackedSummaryRoute } from '../src/lib/canonical/games-parity-contract.ts'

test('normal internal return paths are allowed', () => {
  assert.equal(getSafeReturnPath('/game/abc?quarter=2'), '/game/abc?quarter=2')
  assert.equal(getSafeReturnPath('/teams/123'), '/teams/123')
})

test('external HTTPS return paths are rejected', () => {
  assert.equal(getSafeReturnPath('https://evil.example'), DEFAULT_AUTH_RETURN_PATH)
})

test('protocol-relative return paths are rejected', () => {
  assert.equal(getSafeReturnPath('//evil.example/path'), DEFAULT_AUTH_RETURN_PATH)
})

test('encoded external return paths are decoded and rejected', () => {
  assert.equal(getSafeReturnPath('https%3A%2F%2Fevil.example'), DEFAULT_AUTH_RETURN_PATH)
  assert.equal(getSafeReturnPath('%252F%252Fevil.example'), DEFAULT_AUTH_RETURN_PATH)
})

test('javascript, data, and backslash redirect forms are rejected', () => {
  assert.equal(getSafeReturnPath('javascript:alert(1)'), DEFAULT_AUTH_RETURN_PATH)
  assert.equal(getSafeReturnPath('data:text/html,bad'), DEFAULT_AUTH_RETURN_PATH)
  assert.equal(getSafeReturnPath('/%5C%5Cevil.example'), DEFAULT_AUTH_RETURN_PATH)
})

test('malformed encoded return paths fall back safely', () => {
  assert.equal(getSafeReturnPath('/game/%E0%A4%A'), DEFAULT_AUTH_RETURN_PATH)
})

test('missing return paths use the safe dashboard default', () => {
  assert.equal(getSafeReturnPath(null), '/dashboard')
  assert.equal(getSafeReturnPath('', '//evil.example'), '/dashboard')
})

test('sign-in path preserves the exact encoded internal game destination', () => {
  assert.equal(buildSignInPath('/game/abc?mode=team'), '/sign-in?redirect=%2Fgame%2Fabc%3Fmode%3Dteam')
})

test('onboarding path preserves the game without bypassing onboarding', () => {
  assert.equal(buildOnboardingPath('/game/abc'), '/onboarding?returnTo=%2Fgame%2Fabc')
})

test('game identifiers are preserved and safely encoded by the canonical summary route', () => {
  assert.equal(buildTrackedSummaryRoute('game/a'), '/games/game%2Fa')
})

test('permission failures are distinguishable without exposing protected data', () => {
  assert.equal(classifyProtectedReadFailure({ code: '42501', message: 'permission denied' }), 'permission')
  assert.equal(classifyProtectedReadFailure({ status: 403 }), 'permission')
})

test('network and ordinary query failures remain distinct', () => {
  assert.equal(classifyProtectedReadFailure(new TypeError('Failed to fetch')), 'network')
  assert.equal(classifyProtectedReadFailure(new Error('database unavailable')), 'query')
})

test('signed-out game route is protected before the game redirect renders', async () => {
  const [app, routes] = await Promise.all([
    readFile(new URL('../src/routes/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(app, /pathname\.startsWith\('\/game\/'\).*public/i)
  assert.match(app, /buildSignInPath\(`\$\{pathname\}\$\{location\.search/)
  assert.match(routes, /path: 'game\/:gameId', element: <ProtectedGameRedirect/)
  assert.doesNotMatch(routes, /PublicGamePage/)
})

test('authenticated game alias reaches the existing canonical summary directly', async () => {
  const redirect = await readFile(new URL('../src/routes/ProtectedGameRedirect.tsx', import.meta.url), 'utf8')
  assert.match(redirect, /buildTrackedSummaryRoute\(gameId\)/)
  assert.doesNotMatch(redirect, /dashboard/)
})

test('email password sign-in uses only the sanitized return destination', async () => {
  const login = await readFile(new URL('../src/routes/auth/Login.tsx', import.meta.url), 'utf8')
  assert.match(login, /getSafeReturnPath\(qp\.get\('redirect'\)\)/)
  assert.match(login, /navigate\(redirectTo, \{ replace: true \}\)/)
})

test('OAuth callback retains and sanitizes the internal return destination', async () => {
  const [login, callback] = await Promise.all([
    readFile(new URL('../src/routes/auth/Login.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/auth/Callback.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(login, /authCallbackUrl\}\?redirect=\$\{encodedRedirect\}/)
  assert.match(callback, /getSafeReturnPath\(getParam\('redirect'\)\)/)
})

test('registration and email verification retain the same safe return destination', async () => {
  const [register, checkEmail] = await Promise.all([
    readFile(new URL('../src/routes/auth/Register.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/auth/CheckEmail.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(register, /getSafeReturnPath\(query\.get\('redirect'\)\)/)
  assert.match(register, /emailRedirectTo: `\$\{authCallbackUrl\}\?redirect=/)
  assert.match(checkEmail, /navigate\(redirectTo, \{ replace: true \}\)/)
})

test('incomplete profiles finish onboarding before resuming the game', async () => {
  const [app, onboarding] = await Promise.all([
    readFile(new URL('../src/routes/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/Onboarding.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(app, /pathname\.startsWith\('\/game\/'\) \? buildOnboardingPath\(returnPath\)/)
  assert.match(onboarding, /getSafeReturnPath\(query\.get\('returnTo'\)\)/)
  assert.match(onboarding, /navigate\(returnPath, \{ replace: true \}\)/)
})

test('missing, permission, and network game outcomes do not render an empty summary', async () => {
  const summary = await readFile(new URL('../src/routes/portal/GameSummaryPage.tsx', import.meta.url), 'utf8')
  assert.match(summary, /Game summary not found/)
  assert.match(summary, /do not have permission to view this game/)
  assert.match(summary, /Check your connection and try again/)
  assert.match(summary, /Try again/)
})

test('landing primary CTA targets dashboard and never disabled New Game', async () => {
  const landing = await readFile(new URL('../src/routes/Landing.tsx', import.meta.url), 'utf8')
  assert.match(landing, /to=\{authLink\('\/dashboard'\)\}/)
  assert.doesNotMatch(landing, /authLink\('\/new'\)/)
})

test('active public acquisition controls do not target DisabledRoute', async () => {
  const [landing, shell] = await Promise.all([
    readFile(new URL('../src/routes/Landing.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/landing/PublicSiteShell.tsx', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(`${landing}\n${shell}`, /(?:to|href)=.*['"`]\/new(?:['"`?}])/)
})

test('anonymous vote-card and informational public routes remain unchanged', async () => {
  const [routes, app] = await Promise.all([
    readFile(new URL('../src/main.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/App.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(routes, /path: 'vote-card\/:token', element: <PublicVoteCardPage/)
  for (const path of ['/', '/how-it-works', '/terms', '/privacy', '/community-guidelines', '/support']) {
    assert.match(app, new RegExp(`['"]${path.replaceAll('/', '\\/')}['"]`))
  }
})

test('intentional legacy DisabledRoute aliases remain present but inactive from acquisition', async () => {
  const routes = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
  assert.match(routes, /path: 'new', element: <DisabledRoute/)
  assert.match(routes, /path: 'newgame\/:gameId', element: <DisabledRoute/)
})

test('production route safety includes a branded catch-all and hides the vote-card fixture', async () => {
  const routes = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
  const notFound = await readFile(new URL('../src/routes/NotFoundPage.tsx', import.meta.url), 'utf8')
  assert.match(routes, /path: '\*', element: <NotFoundPage/)
  assert.match(routes, /path: 'vote-card\/dev', element: import\.meta\.env\.DEV/)
  assert.match(notFound, /That page isn’t available/)
})

test('signed-in users can still read informational and support routes', async () => {
  const app = await readFile(new URL('../src/routes/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /const shouldLeavePublicEntry/)
  assert.doesNotMatch(app, /if \(\(publicRoute \|\| onCheckEmailRoute\)/)
  assert.match(app, /!onboardingAllowedRoute && !publicRoute/)
})

test('the legacy singular squad route resolves to the canonical teams index', async () => {
  const routes = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
  assert.match(routes, /path: 'squad', element: <Navigate to="\/teams" replace/)
})
