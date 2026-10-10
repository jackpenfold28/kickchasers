import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const routesUrl = new URL('../src/main.tsx', import.meta.url)
const adminPageUrl = new URL('../src/routes/portal/AdminPage.tsx', import.meta.url)
const placeholderUrl = new URL('../src/routes/portal/admin/AdminManualFeedPostPage.tsx', import.meta.url)

test('admin navigation no longer exposes the unsupported manual feed tool', async () => {
  const adminPage = await readFile(adminPageUrl, 'utf8')
  assert.doesNotMatch(adminPage, /to=["'{]+\/admin\/manual-feed-post/)
  assert.doesNotMatch(adminPage, /Manual feed tool/)
})

test('legacy manual feed URL redirects safely to the admin overview', async () => {
  const routes = await readFile(routesUrl, 'utf8')
  assert.match(routes, /path: 'admin\/manual-feed-post', element: <Navigate to="\/admin" replace/)
})

test('legacy redirect remains behind the canonical portal admin guard', async () => {
  const routes = await readFile(routesUrl, 'utf8')
  const portalStart = routes.indexOf('element: <PortalLayout />')
  const redirect = routes.indexOf("path: 'admin/manual-feed-post'")
  const portalEnd = routes.indexOf('// Legacy game-day routes')
  assert.ok(portalStart >= 0 && redirect > portalStart && redirect < portalEnd)
})

test('placeholder page import and rendering are removed', async () => {
  const routes = await readFile(routesUrl, 'utf8')
  assert.doesNotMatch(routes, /AdminManualFeedPostPage/)
  await assert.rejects(access(placeholderUrl))
})

test('admin overview keeps its supported controls', async () => {
  const adminPage = await readFile(adminPageUrl, 'utf8')
  assert.match(adminPage, /to="\/admin\/users"/)
  assert.match(adminPage, /fetchAdminOverviewStats/)
  assert.match(adminPage, /listDirectoryRequests/)
})

test('web does not fall back to the legacy manual summary publishing RPC', async () => {
  const files = await Promise.all([readFile(routesUrl, 'utf8'), readFile(adminPageUrl, 'utf8')])
  assert.doesNotMatch(files.join('\n'), /rpc_create_manual_game_summary_post/)
})

test('web does not add a raw post or manual-game insert workaround', async () => {
  const files = await Promise.all([readFile(routesUrl, 'utf8'), readFile(adminPageUrl, 'utf8')])
  assert.doesNotMatch(files.join('\n'), /from\(['"](?:posts|manual_player_game_totals)['"]\)[\s\S]{0,120}\.insert\(/)
})
