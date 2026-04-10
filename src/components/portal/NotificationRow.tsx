import { type MouseEvent } from 'react'
import clsx from 'clsx'
import { Building2, Shield } from 'lucide-react'
import type { PortalNotification, PortalNotificationPayload } from '@/lib/portal-notifications'

type NotificationRowProps = {
  notification: PortalNotification
  busy: boolean
  onOpen?: (notification: PortalNotification) => void
  onAcceptInvite: (notification: PortalNotification) => Promise<void>
  onDeclineInvite: (notification: PortalNotification) => Promise<void>
  onApproveJoinRequest: (notification: PortalNotification) => Promise<void>
  onDeclineJoinRequest: (notification: PortalNotification) => Promise<void>
  onAcceptTrackRequest: (notification: PortalNotification) => Promise<void>
  onDeclineTrackRequest: (notification: PortalNotification) => Promise<void>
}

type NotificationCopy = {
  title: string
  body: string
  media:
    | { kind: 'logo'; src: string | null; fallback: string }
    | { kind: 'avatar'; src: string | null; fallback: string }
    | { kind: 'icon'; icon: 'shield' | 'directory'; fallback: string }
}

const ACTIONABLE_TYPES = new Set<PortalNotification['type']>([
  'squad_invite',
  'track_request',
  'squad_join_request_created',
])

function getInitial(value: string | null | undefined) {
  return value?.trim()?.charAt(0)?.toUpperCase() || 'K'
}

function formatRoleLabel(role: string | null | undefined) {
  const normalized = String(role || 'member').trim().toLowerCase()
  if (normalized === 'player') return 'Player'
  if (normalized === 'tracker') return 'Tracker'
  if (normalized === 'coach') return 'Coach'
  if (normalized === 'admin') return 'Admin'
  return 'Member'
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const deltaMs = Date.now() - date.getTime()
  const minutes = Math.round(deltaMs / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function buildNotificationCopy(notification: PortalNotification): NotificationCopy {
  const payload = (notification.payload ?? {}) as PortalNotificationPayload
  const actorLabel = notification.actorName || (notification.actorHandle ? `@${notification.actorHandle}` : 'Someone')
  const squadLabel = payload.squad_name || notification.squadName || 'this squad'
  const squadLogo = payload.squad_logo_url || notification.squadLogoUrl || null
  const actorAvatar = notification.actorAvatarUrl || null
  const actorInitial = getInitial(notification.actorName || notification.actorHandle)
  const squadInitial = getInitial(squadLabel)
  const roleLabel = formatRoleLabel((payload.requested_role as string | null | undefined) ?? (payload.new_role as string | null | undefined))
  const status = String(payload.status || '').toLowerCase()
  const requestKind = String(payload.request_kind || '').toLowerCase()
  const requestedLabel = typeof payload.requested_label === 'string' && payload.requested_label.trim() ? payload.requested_label.trim() : null
  const guestName = typeof payload.guest_name === 'string' && payload.guest_name.trim() ? payload.guest_name.trim() : 'guest player'

  switch (notification.type) {
    case 'squad_invite':
      return {
        title: squadLabel,
        body: `${actorLabel} invited you to join.`,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
    case 'track_request':
      return {
        title: actorLabel,
        body: 'tracked a game for you.',
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'track_request_accepted':
      return {
        title: 'Track request accepted',
        body: `${actorLabel} accepted your tracked game.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'track_request_declined':
      return {
        title: 'Track request declined',
        body: `${actorLabel} declined your tracked game.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'squad_join_request_created':
      return {
        title: 'Join request',
        body: `${actorLabel} wants to join ${squadLabel} as ${roleLabel}.`,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
    case 'squad_join_request_decided':
      return {
        title: status === 'approved' ? 'Join request approved' : status === 'declined' ? 'Join request declined' : 'Join request updated',
        body:
          status === 'approved'
            ? `Your request to join ${squadLabel} was approved.`
            : status === 'declined'
              ? `Your request to join ${squadLabel} was declined.`
              : `Your request for ${squadLabel} was updated.`,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
    case 'guest_merge_request_created':
      return {
        title: 'Guest merge request',
        body: `${actorLabel} wants to claim ${guestName}.`,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
    case 'guest_merge_request_decided':
      return {
        title: status === 'approved' ? 'Guest merge approved' : status === 'declined' ? 'Guest merge declined' : 'Guest merge updated',
        body:
          status === 'approved'
            ? `Your request to claim ${guestName} was approved.`
            : status === 'declined'
              ? `Your request to claim ${guestName} was declined.`
              : `Your request to claim ${guestName} was updated.`,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
    case 'squad_role_changed':
      return {
        title: 'Role updated',
        body: `${actorLabel} changed your role to ${roleLabel} in ${squadLabel}.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'club_role_changed': {
      const clubLabel = typeof payload.club_name === 'string' && payload.club_name.trim() ? payload.club_name.trim() : 'your club'
      const oldLabel = formatRoleLabel(payload.old_role as string | null | undefined)
      const action = String(payload.action || '').toLowerCase()
      const body =
        action === 'revoked'
          ? `Your ${oldLabel} role for ${clubLabel} was removed.`
          : action === 'changed'
            ? `Your role for ${clubLabel} changed to ${roleLabel}.`
            : `You were granted ${roleLabel} role for ${clubLabel}.`
      return {
        title: 'Club role updated',
        body,
        media: { kind: 'avatar', src: null, fallback: getInitial(clubLabel) },
      }
    }
    case 'official_squad_admin_request_created':
      return {
        title: 'New official admin request',
        body: `${actorLabel} requested admin access for ${squadLabel}.`,
        media: { kind: 'icon', icon: 'shield', fallback: 'OA' },
      }
    case 'official_squad_admin_request_decided':
      return {
        title:
          status === 'approved'
            ? 'Official admin request approved'
            : status === 'declined'
              ? 'Official admin request declined'
              : 'Official admin request updated',
        body: `Squad: ${squadLabel}`,
        media: { kind: 'icon', icon: 'shield', fallback: 'OA' },
      }
    case 'official_directory_request_created': {
      const kindLabel = requestKind === 'add_league' ? 'league' : requestKind === 'add_club' ? 'club' : 'directory item'
      return {
        title: requestedLabel ? `New ${kindLabel} request` : 'New directory request',
        body: requestedLabel ? `${actorLabel} requested ${requestedLabel}.` : 'Tap to review.',
        media: { kind: 'icon', icon: 'directory', fallback: 'DR' },
      }
    }
    case 'official_directory_request_decided': {
      const kindLabel = requestKind === 'add_league' ? 'league' : requestKind === 'add_club' ? 'club' : 'directory item'
      return {
        title:
          status === 'approved'
            ? `${kindLabel} request approved`
            : status === 'declined'
              ? `${kindLabel} request declined`
              : `${kindLabel} request updated`,
        body: typeof payload.admin_notes === 'string' && payload.admin_notes.trim() ? payload.admin_notes.trim() : 'Tap to update your settings.',
        media: { kind: 'icon', icon: 'directory', fallback: 'DR' },
      }
    }
    case 'post_liked':
      return {
        title: 'Post liked',
        body: `${actorLabel} liked your post.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'post_commented': {
      const preview = typeof payload.comment_preview === 'string' && payload.comment_preview.trim() ? payload.comment_preview.trim() : null
      return {
        title: 'New comment',
        body: preview ? `${actorLabel} commented: ${preview}` : `${actorLabel} commented on your post.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    }
    case 'user_followed': {
      const followerName = typeof payload.follower_name === 'string' && payload.follower_name.trim() ? payload.follower_name.trim() : actorLabel
      return {
        title: `${followerName} followed you`,
        body: 'New follower on KickChasers.',
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    }
    case 'official_game_live_started': {
      const home = typeof payload.home_team_name === 'string' && payload.home_team_name.trim() ? payload.home_team_name.trim() : 'Home Team'
      const away = typeof payload.away_team_name === 'string' && payload.away_team_name.trim() ? payload.away_team_name.trim() : 'Away Team'
      return {
        title: 'Game started',
        body: `${home} vs ${away}`,
        media: { kind: 'logo', src: squadLogo, fallback: getInitial(home) },
      }
    }
    case 'vote_card_assigned':
    case 'vote_card_reminder': {
      const awardType = typeof payload.award_type_name === 'string' && payload.award_type_name.trim() ? payload.award_type_name.trim() : 'Vote card'
      const voteGroup = typeof payload.vote_group_name === 'string' && payload.vote_group_name.trim() ? payload.vote_group_name.trim() : squadLabel
      return {
        title: notification.type === 'vote_card_reminder' ? 'Vote card reminder' : 'Vote card assigned',
        body:
          notification.type === 'vote_card_reminder'
            ? `${awardType} is still waiting in ${voteGroup}.`
            : `${awardType} has been assigned in ${voteGroup}.`,
        media: { kind: 'logo', src: squadLogo, fallback: getInitial(awardType) },
      }
    }
    case 'squad_invite_accepted':
      return {
        title: 'Invite accepted',
        body: `${actorLabel} accepted your invite to ${squadLabel}.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'squad_invite_declined':
      return {
        title: 'Invite declined',
        body: `${actorLabel} declined your invite to ${squadLabel}.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    case 'squad_admin_promoted':
      return {
        title: 'Admin access granted',
        body: `${actorLabel} promoted you to admin of ${squadLabel}.`,
        media: { kind: 'avatar', src: actorAvatar, fallback: actorInitial },
      }
    default:
      return {
        title: squadLabel,
        body: actorLabel,
        media: { kind: 'logo', src: squadLogo, fallback: squadInitial },
      }
  }
}

function NotificationMedia({
  notification,
  media,
}: {
  notification: PortalNotification
  media: NotificationCopy['media']
}) {
  return (
    <div
      className={clsx(
        'relative flex shrink-0 items-center justify-center overflow-hidden',
        media.kind === 'logo' ? 'h-14 w-14 rounded-[18px] bg-[#111B33]' : 'h-12 w-12 rounded-full bg-[#111B33]'
      )}
    >
      {media.kind === 'icon' ? (
        media.icon === 'shield' ? (
          <Shield className="h-5 w-5 text-[#39FF88]" />
        ) : (
          <Building2 className="h-5 w-5 text-[#39FF88]" />
        )
      ) : media.src ? (
        <img src={media.src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-[#39FF88]">{media.fallback}</span>
      )}

      {!notification.readAt ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#39FF88]" /> : null}
    </div>
  )
}

function InlineActionButton({
  label,
  tone,
  disabled,
  onClick,
}: {
  label: string
  tone: 'positive' | 'danger'
  disabled: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex min-h-[40px] min-w-[112px] items-center justify-center rounded-[14px] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        tone === 'positive'
          ? 'bg-[#39FF88] text-[#091321] hover:bg-[#53ff99]'
          : 'border border-[#7f1d1d]/70 bg-[#241315] text-[#fca5a5] hover:bg-[#2d1719]'
      )}
    >
      {label}
    </button>
  )
}

export default function NotificationRow({
  notification,
  busy,
  onOpen,
  onAcceptInvite,
  onDeclineInvite,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onAcceptTrackRequest,
  onDeclineTrackRequest,
}: NotificationRowProps) {
  const copy = buildNotificationCopy(notification)
  const isPremium = ACTIONABLE_TYPES.has(notification.type)
  const isInteractive = typeof onOpen === 'function'
  const timestamp = formatRelativeTime(notification.createdAt)
  const canReviewJoinRequest =
    notification.type === 'squad_join_request_created' &&
    (() => {
      const status = String((notification.payload?.status as string | null | undefined) || '').toLowerCase()
      return !status || status === 'pending' || status === 'created'
    })()

  function handleOpen() {
    if (!onOpen) return
    onOpen(notification)
  }

  return (
    <article
      className={clsx(
        'w-full border-b border-black/30 px-4 py-4 sm:px-5',
        isPremium
          ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012)),#0D1526]'
          : 'bg-[#0B1424]',
        isInteractive && 'cursor-pointer transition hover:bg-[#101b2d]'
      )}
      onClick={handleOpen}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleOpen()
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-4">
        <NotificationMedia notification={notification} media={copy.media} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={clsx(
                  'truncate text-white',
                  isPremium ? 'text-[17px] font-extrabold tracking-[-0.02em]' : 'text-[15px] font-semibold'
                )}
              >
                {copy.title}
              </h3>
              <p
                className={clsx(
                  'mt-1 max-w-[62ch] text-sm leading-5',
                  isPremium ? 'text-slate-300' : 'text-slate-400'
                )}
              >
                {copy.body}
              </p>
            </div>

            {timestamp ? <span className="shrink-0 pt-0.5 text-xs text-slate-500">{timestamp}</span> : null}
          </div>

          {notification.type === 'squad_invite' ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <InlineActionButton
                label="Accept"
                tone="positive"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onAcceptInvite(notification)
                }}
              />
              <InlineActionButton
                label="Decline"
                tone="danger"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeclineInvite(notification)
                }}
              />
            </div>
          ) : null}

          {notification.type === 'track_request' ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <InlineActionButton
                label="Accept"
                tone="positive"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onAcceptTrackRequest(notification)
                }}
              />
              <InlineActionButton
                label="Decline"
                tone="danger"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeclineTrackRequest(notification)
                }}
              />
            </div>
          ) : null}

          {canReviewJoinRequest ? (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <InlineActionButton
                label="Approve"
                tone="positive"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onApproveJoinRequest(notification)
                }}
              />
              <InlineActionButton
                label="Decline"
                tone="danger"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation()
                  void onDeclineJoinRequest(notification)
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
