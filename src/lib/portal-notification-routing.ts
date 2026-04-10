import type { PortalNotification, PortalNotificationPayload } from '@/lib/portal-notifications'

function coerceId(value: unknown) {
  if (value == null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

export function resolvePortalNotificationHref(notification: PortalNotification): string | null {
  const payload = (notification.payload ?? {}) as PortalNotificationPayload

  const squadId = coerceId(notification.squadId ?? payload.squad_id)
  const refId = coerceId(notification.refId)
  const gameId = coerceId(payload.gameId ?? payload.game_id ?? refId)
  const manualGameId = coerceId(payload.manual_game_id)

  switch (notification.type) {
    case 'squad_invite':
    case 'squad_invite_declined':
    case 'squad_role_changed':
    case 'guest_merge_request_created':
    case 'guest_merge_request_decided':
    case 'official_squad_admin_request_decided':
    case 'squad_join_request_decided':
      return squadId ? `/teams/${squadId}` : null
    case 'squad_join_request_created':
      return squadId ? `/teams/${squadId}?tab=manage&focus=pending-requests` : null
    case 'club_role_changed':
      return '/settings/roles'
    case 'official_squad_admin_request_created':
    case 'official_directory_request_created':
      return '/admin/requests'
    case 'official_directory_request_decided':
      return '/settings'
    case 'track_request':
    case 'track_request_accepted':
    case 'track_request_declined':
      return gameId ? `/games/${gameId}` : null
    case 'official_game_live_started':
      return gameId ? `/games/${gameId}` : null
    case 'post_liked':
    case 'post_commented':
      if (manualGameId) return `/games/manual/${manualGameId}`
      return null
    case 'vote_card_assigned':
    case 'vote_card_reminder':
      return squadId ? `/teams/${squadId}` : null
    case 'user_followed':
      return null
    default:
      break
  }

  if (manualGameId) return `/games/manual/${manualGameId}`
  if (gameId) return `/games/${gameId}`
  if (squadId) return `/teams/${squadId}`
  return null
}
