import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePortalAccess } from '../src/lib/canonical/portal-access.ts'

const access = (overrides: Partial<Parameters<typeof resolvePortalAccess>[0]> = {}) => resolvePortalAccess({ checking: true, userId: null, adminRoute: false, isAdmin: false, ...overrides })

test('a signed-in portal visit never redirects while identity is being restored', () => {
  assert.deepEqual([
    access(),
    access({ userId: 'viewer' }),
    access({ userId: 'viewer', checking: false }),
  ], ['loading', 'ready', 'ready'])
})

test('an anonymous visit redirects only after the session check finishes', () => {
  assert.equal(access(), 'loading')
  assert.equal(access({ checking: false }), 'sign-in')
})

test('admin routes wait for authorization even when identity is already known', () => {
  assert.equal(access({ adminRoute: true, userId: 'viewer' }), 'loading')
  assert.equal(access({ adminRoute: true, userId: 'viewer', checking: false }), 'dashboard')
  assert.equal(access({ adminRoute: true, userId: 'viewer', checking: false, isAdmin: true }), 'ready')
})

test('ordinary portal routes do not wait for a slow admin-role request', () => {
  assert.equal(access({ userId: 'viewer', checking: true, isAdmin: false }), 'ready')
})
