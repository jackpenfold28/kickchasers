import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { resolveWebNotificationDestination } from '../src/lib/portal-notification-routing.ts'
import {
  applyNotificationsRead,
  countNewlyRead,
  mergeNotificationPages,
  visibleAutoReadIds,
} from '../src/lib/canonical/notifications-parity.ts'
import type { PortalNotification, PortalNotificationType } from '../src/lib/portal-notifications.ts'

function notification(type: PortalNotificationType, overrides: Partial<PortalNotification> = {}): PortalNotification {
  return {
    id: `${type}-id`, type, rawType: type, refId: 'game-1', squadId: 'squad-1', payload: {},
    actorId: 'user-1', readAt: null, createdAt: '2026-08-18T10:00:00Z', actorName: null,
    actorHandle: null, actorAvatarUrl: null, squadName: null, squadLogoUrl: null, ...overrides,
  }
}

test('notification page merge preserves canonical backend ordering', () => {
  const newer = notification('squad_invite', { id: 'newer' })
  const older = notification('squad_invite', { id: 'older' })
  assert.deepEqual(mergeNotificationPages([], [newer, older], true).map((item) => item.id), ['newer', 'older'])
})

test('pagination appends and deduplicates notification rows', () => {
  const first = notification('squad_invite', { id: 'first' })
  const second = notification('post_liked', { id: 'second' })
  assert.deepEqual(mergeNotificationPages([first], [first, second]).map((item) => item.id), ['first', 'second'])
})

test('unread and read rows remain represented independently', () => {
  const unread = notification('post_liked', { id: 'unread' })
  const read = notification('post_liked', { id: 'read', readAt: '2026-08-18T11:00:00Z' })
  assert.equal(unread.readAt, null)
  assert.ok(read.readAt)
})

test('optimistic mark read updates rows and computes the canonical count delta', () => {
  const rows = [notification('post_liked', { id: 'one' }), notification('post_liked', { id: 'two', readAt: 'already' })]
  assert.equal(countNewlyRead(rows, ['one', 'two']), 1)
  assert.equal(applyNotificationsRead(rows, ['one'], 'now')[0].readAt, 'now')
})

test('visible auto-read matches mobile exclusions for invites and track requests', () => {
  const rows = [notification('squad_invite'), notification('track_request'), notification('post_commented')]
  assert.deepEqual(visibleAutoReadIds(rows), ['post_commented-id'])
})

const routeFixtures: Array<[PortalNotificationType, Partial<PortalNotification>, string, string]> = [
  ['squad_invite', {}, '/teams/squad-1', 'supported'],
  ['squad_invite_accepted', {}, '/teams/squad-1', 'supported'],
  ['squad_invite_declined', {}, '/teams/squad-1', 'supported'],
  ['squad_admin_promoted', {}, '/teams/squad-1', 'supported'],
  ['squad_role_changed', {}, '/teams/squad-1', 'supported'],
  ['club_role_changed', {}, '/settings/roles', 'supported'],
  ['squad_join_request_created', {}, '/teams/squad-1?tab=manage&focus=pending-requests', 'supported'],
  ['squad_join_request_decided', {}, '/teams/squad-1', 'supported'],
  ['guest_merge_request_created', {}, '/teams/squad-1', 'supported'],
  ['guest_merge_request_decided', {}, '/teams/squad-1', 'supported'],
  ['official_squad_admin_request_created', {}, '/admin/requests', 'supported'],
  ['official_squad_admin_request_decided', {}, '/teams/squad-1', 'supported'],
  ['official_directory_request_created', {}, '/admin/requests', 'supported'],
  ['official_directory_request_decided', {}, '/settings', 'supported'],
  ['track_request', {}, '/games/game-1', 'supported'],
  ['track_request_accepted', {}, '/games/game-1', 'supported'],
  ['track_request_declined', {}, '/games/game-1', 'supported'],
  ['user_followed', {}, '/users/user-1', 'supported'],
  ['post_liked', { payload: { manual_game_id: 'manual/1' } }, '/games/manual/manual%2F1', 'supported'],
  ['post_commented', { payload: { game_id: 'game/2' } }, '/games/game%2F2', 'supported'],
  ['official_game_live_started', {}, '/games/game-1', 'supported'],
  ['team_selection_posted', {}, '/teams/squad-1?tab=activity', 'fallback'],
  ['vote_card_assigned', {}, '/teams/squad-1/votes/cards/game-1', 'supported'],
  ['vote_card_reminder', {}, '/teams/squad-1/votes/cards/game-1', 'supported'],
]

for (const [type, overrides, href, status] of routeFixtures) {
  test(`${type} resolves to its safe web destination`, () => {
    const destination = resolveWebNotificationDestination(notification(type, overrides))
    assert.equal(destination.href, href)
    assert.equal(destination.status, status)
  })
}

test('team stats live notification uses the supported canonical summary route', () => {
  const destination = resolveWebNotificationDestination(notification('official_game_live_started', { payload: { tracker_mode: 'team_stats_game' } }))
  assert.equal(destination.href, '/games/game-1')
  assert.equal(destination.status, 'supported')
})

test('social post without a web content route remains on notifications safely', () => {
  const destination = resolveWebNotificationDestination(notification('post_liked', { refId: 'post-1', payload: {} }))
  assert.equal(destination.href, '/notifications')
  assert.equal(destination.status, 'unsupported')
})

test('malformed entity payload remains on notifications safely', () => {
  const destination = resolveWebNotificationDestination(notification('squad_invite', { squadId: null, payload: {}, refId: null }))
  assert.equal(destination.href, '/notifications')
  assert.match(destination.reason || '', /missing a squad id/)
})

test('unknown notification types never masquerade as an invite', () => {
  const destination = resolveWebNotificationDestination(notification('unknown', { rawType: 'future_type' }))
  assert.equal(destination.status, 'unsupported')
  assert.match(destination.reason || '', /future_type/)
})

test('repository, unread badge, realtime lifecycle, and RPC mutations use one shared contract', async () => {
  const [repository, provider, layout, page] = await Promise.all([
    readFile(new URL('../src/lib/portal-notifications.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/portal/NotificationStateProvider.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/layout/PortalLayout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/routes/portal/NotificationsPage.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(repository, /rpc\('f_notifications_list'/)
  assert.match(repository, /rpc\('f_notifications_unread_count'/)
  assert.match(repository, /rpc\('f_notifications_mark_read'/)
  assert.doesNotMatch(repository, /from\('notifications'\)/)
  assert.match(provider, /recipient_id=eq\.\$\{userId\}/)
  assert.match(provider, /visibilitychange/)
  assert.match(provider, /removeChannel/)
  assert.match(layout, /unreadCount=\{unreadCount\}/)
  assert.match(page, /usePortalNotificationState/)
})
