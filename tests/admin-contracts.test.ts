import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildDirectoryDecisionArgs,
  canEnterPlatformAdminRoute,
  isPlatformAdminPath,
  usesAtomicDirectoryDecision,
} from '../src/lib/canonical/admin-contracts.ts'

test('admin route classification follows current navigation', () => {
  assert.equal(isPlatformAdminPath('/dashboard'), false)
  assert.equal(isPlatformAdminPath('/admin'), true)
  assert.equal(isPlatformAdminPath('/admin/requests/directory/id'), true)
  assert.equal(isPlatformAdminPath('/leagues/id'), true)
})

test('only server-confirmed platform admins enter platform-admin routes', () => {
  const fixtures = [
    { role: 'unauthenticated', authenticated: false, platformAdmin: false, expected: false },
    { role: 'normal user', authenticated: true, platformAdmin: false, expected: false },
    { role: 'squad admin', authenticated: true, platformAdmin: false, expected: false },
    { role: 'club admin', authenticated: true, platformAdmin: false, expected: false },
    { role: 'platform admin', authenticated: true, platformAdmin: true, expected: true },
  ]
  for (const fixture of fixtures) {
    assert.equal(
      canEnterPlatformAdminRoute(fixture.authenticated, fixture.platformAdmin),
      fixture.expected,
      fixture.role
    )
  }
})

test('league and club decisions use the canonical atomic RPC contract', () => {
  assert.equal(usesAtomicDirectoryDecision('add_league'), true)
  assert.equal(usesAtomicDirectoryDecision('add_club'), true)
  assert.equal(usesAtomicDirectoryDecision('add_grade'), false)
  assert.deepEqual(buildDirectoryDecisionArgs('request-1', 'declined', 'duplicate'), {
    _request_id: 'request-1',
    _decision: 'declined',
    _admin_notes: 'duplicate',
  })
})

test('web admin repositories are wired to canonical server authorities', async () => {
  const [adminSource, platformSource] = await Promise.all([
    readFile(new URL('../src/lib/portal-admin.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/platform-admin.ts', import.meta.url), 'utf8'),
  ])
  assert.match(adminSource, /rpc_decide_official_directory_request/)
  assert.match(platformSource, /rpc\('f_is_platform_admin'\)/)
  const fetchBody = platformSource.slice(
    platformSource.indexOf('export async function fetchPlatformAdminStatus'),
    platformSource.indexOf('export async function setPlatformAdminStatus')
  )
  assert.doesNotMatch(fetchBody, /from\('platform_admins'\)/)
})
