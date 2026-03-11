import type { PortalNotification } from '@/lib/portal-notifications'

type NotificationRowProps = {
  notification: PortalNotification
  busy: boolean
  onMarkRead: (id: string) => Promise<void>
  onAcceptInvite: (notification: PortalNotification) => Promise<void>
  onDeclineInvite: (notification: PortalNotification) => Promise<void>
  onApproveJoinRequest: (notification: PortalNotification) => Promise<void>
  onDeclineJoinRequest: (notification: PortalNotification) => Promise<void>
  onApproveGuestMerge: (notification: PortalNotification) => Promise<void>
  onDeclineGuestMerge: (notification: PortalNotification) => Promise<void>
}

function typeLabel(type: string) {
  if (type === 'squad_invite') return 'Squad Invite'
  if (type === 'squad_join_request_created') return 'Join Request'
  if (type === 'guest_merge_request_created') return 'Guest Merge Request'
  if (type === 'squad_join_request_decided') return 'Join Request Update'
  if (type === 'guest_merge_request_decided') return 'Guest Merge Update'
  if (type === 'squad_role_changed') return 'Role Update'
  if (type === 'club_role_changed') return 'Club Role Update'
  return type.replaceAll('_', ' ')
}

export default function NotificationRow({
  notification,
  busy,
  onMarkRead,
  onAcceptInvite,
  onDeclineInvite,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onApproveGuestMerge,
  onDeclineGuestMerge,
}: NotificationRowProps) {
  const actor = notification.actorHandle || notification.actorName || 'Someone'
  const squad = notification.squadName || ((notification.payload?.squad_name as string | undefined) ?? 'this squad')

  return (
    <tr className="border-t border-white/5 text-slate-200 hover:bg-white/[0.03]">
      <td className="px-3 py-3 text-xs text-slate-400">{typeLabel(notification.type)}</td>
      <td className="px-3 py-3">
        <p className="font-medium text-white">{actor}</p>
        <p className="text-xs text-slate-400">{squad}</p>
      </td>
      <td className="px-3 py-3 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</td>
      <td className="px-3 py-3 text-xs">
        {notification.readAt ? <span className="text-emerald-300">Read</span> : <span className="text-amber-300">Unread</span>}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          {!notification.readAt && (
            <button className="btn btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => onMarkRead(notification.id)}>
              Mark read
            </button>
          )}

          {notification.type === 'squad_invite' && (
            <>
              <button className="btn btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => onAcceptInvite(notification)}>
                Accept
              </button>
              <button className="btn border-red-500/60 px-2 py-1 text-xs text-red-300" disabled={busy} onClick={() => onDeclineInvite(notification)}>
                Decline
              </button>
            </>
          )}

          {notification.type === 'squad_join_request_created' && (
            <>
              <button className="btn btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => onApproveJoinRequest(notification)}>
                Approve
              </button>
              <button className="btn border-red-500/60 px-2 py-1 text-xs text-red-300" disabled={busy} onClick={() => onDeclineJoinRequest(notification)}>
                Reject
              </button>
            </>
          )}

          {notification.type === 'guest_merge_request_created' && (
            <>
              <button className="btn btn-secondary px-2 py-1 text-xs" disabled={busy} onClick={() => onApproveGuestMerge(notification)}>
                Approve
              </button>
              <button className="btn border-red-500/60 px-2 py-1 text-xs text-red-300" disabled={busy} onClick={() => onDeclineGuestMerge(notification)}>
                Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
