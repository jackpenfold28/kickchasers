import type { PortalNotification, PortalNotificationPayload } from '@/lib/portal-notifications'

export type WebNotificationDestination = {
  href: string
  status: 'supported' | 'fallback' | 'unsupported'
  reason: string | null
}

const SAFE_FALLBACK = '/notifications'

function coerceId(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  return text.length ? text : null
}

function route(path: string): WebNotificationDestination {
  return { href: path, status: 'supported', reason: null }
}

function fallback(path: string, reason: string): WebNotificationDestination {
  return { href: path, status: 'fallback', reason }
}

function unsupported(reason: string): WebNotificationDestination {
  return { href: SAFE_FALLBACK, status: 'unsupported', reason }
}

function entityRoute(prefix: string, id: string | null, missingReason: string) {
  return id ? route(`${prefix}/${encodeURIComponent(id)}`) : unsupported(missingReason)
}

export function resolveWebNotificationDestination(notification: PortalNotification): WebNotificationDestination {
  const payload = (notification.payload ?? {}) as PortalNotificationPayload
  const squadId = coerceId(notification.squadId ?? payload.squad_id ?? payload.official_squad_id)
  const refId = coerceId(notification.refId)
  const gameId = coerceId(payload.gameId ?? payload.game_id ?? refId)
  const manualGameId = coerceId(payload.manual_game_id)
  const voteCardId = coerceId(payload.card_id ?? refId)
  const actorId = coerceId(notification.actorId ?? payload.follower_user_id)

  switch (notification.type) {
    case 'squad_invite':
    case 'squad_invite_accepted':
    case 'squad_invite_declined':
    case 'squad_admin_promoted':
    case 'squad_role_changed':
    case 'guest_merge_request_created':
    case 'guest_merge_request_decided':
    case 'squad_join_request_decided':
      return entityRoute('/teams', squadId, `${notification.type} is missing a squad id.`)
    case 'squad_join_request_created':
      return squadId
        ? route(`/teams/${encodeURIComponent(squadId)}?tab=manage&focus=pending-requests`)
        : unsupported('squad_join_request_created is missing a squad id.')
    case 'club_role_changed':
      return route('/settings/roles')
    case 'official_squad_admin_request_created':
    case 'official_directory_request_created':
      return route('/admin/requests')
    case 'official_squad_admin_request_decided':
      return squadId
        ? entityRoute('/teams', squadId, 'Official squad admin decision is missing a squad id.')
        : fallback('/settings/roles', 'The decided squad is unavailable; roles is the nearest safe destination.')
    case 'official_directory_request_decided':
      return route('/settings')
    case 'track_request':
    case 'track_request_accepted':
    case 'track_request_declined':
      return entityRoute('/games', gameId, `${notification.type} is missing a game id.`)
    case 'official_game_live_started':
      if (!gameId) return unsupported('official_game_live_started is missing a game id.')
      return route(`/games/${encodeURIComponent(gameId)}`)
    case 'post_liked':
    case 'post_commented':
      if (manualGameId) return route(`/games/manual/${encodeURIComponent(manualGameId)}`)
      if (gameId && (payload.gameId || payload.game_id)) return route(`/games/${encodeURIComponent(gameId)}`)
      return unsupported('Web has no feed/post detail route for this social notification.')
    case 'user_followed':
      return entityRoute('/users', actorId, 'user_followed is missing the follower user id.')
    case 'team_selection_posted':
      return squadId
        ? fallback(`/teams/${encodeURIComponent(squadId)}?tab=activity`, 'Web has no dedicated team-selection activity detail; using team activity.')
        : unsupported('team_selection_posted is missing a squad id.')
    case 'vote_card_assigned':
    case 'vote_card_reminder':
      return squadId && voteCardId
        ? route(`/teams/${encodeURIComponent(squadId)}/votes/cards/${encodeURIComponent(voteCardId)}`)
        : squadId
          ? fallback(`/teams/${encodeURIComponent(squadId)}?tab=votes`, `${notification.type} is missing a vote card id; using private voting management.`)
          : unsupported(`${notification.type} is missing its squad or vote card identity.`)
    case 'unknown':
      return unsupported(`Unsupported notification type: ${notification.rawType ?? 'unknown'}.`)
  }
}

export function resolvePortalNotificationHref(notification: PortalNotification): string {
  return resolveWebNotificationDestination(notification).href
}
