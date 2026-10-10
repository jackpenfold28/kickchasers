import type { PortalNotification } from '../portal-notifications.ts'

export const NOTIFICATIONS_PAGE_SIZE = 50

export function mergeNotificationPages(
  current: PortalNotification[],
  incoming: PortalNotification[],
  replace = false,
): PortalNotification[] {
  const ordered = replace ? [] : [...current]
  const indexes = new Map(ordered.map((item, index) => [item.id, index]))
  for (const item of incoming) {
    const existing = indexes.get(item.id)
    if (existing == null) {
      indexes.set(item.id, ordered.length)
      ordered.push(item)
    } else {
      ordered[existing] = item
    }
  }
  return ordered
}

export function applyNotificationsRead(rows: PortalNotification[], ids: readonly string[], readAt: string) {
  const selected = new Set(ids)
  return rows.map((row) => selected.has(row.id) && !row.readAt ? { ...row, readAt } : row)
}

export function countNewlyRead(rows: PortalNotification[], ids: readonly string[]) {
  const selected = new Set(ids)
  return rows.reduce((count, row) => count + (selected.has(row.id) && !row.readAt ? 1 : 0), 0)
}

export function visibleAutoReadIds(rows: PortalNotification[]) {
  return rows
    .filter((row) => !row.readAt && row.type !== 'squad_invite' && row.type !== 'track_request')
    .map((row) => row.id)
}
