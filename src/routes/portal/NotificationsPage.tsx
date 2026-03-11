import { useEffect, useMemo, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import NotificationRow from '@/components/portal/NotificationRow'
import {
  decideGuestMerge,
  decideJoinRequest,
  listNotifications,
  markNotificationsRead,
  respondInvite,
  type PortalNotification,
} from '@/lib/portal-notifications'
import { supabase } from '@/lib/supabase'

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<PortalNotification[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load(userIdValue?: string | null) {
    const uid = userIdValue ?? userId
    if (!uid) return

    const list = await listNotifications(uid)
    setRows(list)
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) {
          setError('Not authenticated.')
          return
        }

        if (cancelled) return
        setUserId(user.id)

        const list = await listNotifications(user.id)
        if (!cancelled) setRows(list)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const unreadCount = useMemo(() => rows.filter((row) => !row.readAt).length, [rows])

  async function withAction(id: string, action: () => Promise<void>) {
    try {
      setWorkingId(id)
      setError(null)
      await action()
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.')
    } finally {
      setWorkingId(null)
    }
  }

  async function onMarkRead(id: string) {
    if (!userId) return
    await withAction(id, async () => {
      await markNotificationsRead(userId, [id])
    })
  }

  async function onAcceptInvite(notification: PortalNotification) {
    if (!userId) return
    if (!notification.refId) throw new Error('Invite reference missing.')

    await withAction(notification.id, async () => {
      await respondInvite(userId, notification.refId!, true)
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onDeclineInvite(notification: PortalNotification) {
    if (!userId) return
    if (!notification.refId) throw new Error('Invite reference missing.')

    await withAction(notification.id, async () => {
      await respondInvite(userId, notification.refId!, false)
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onApproveJoinRequest(notification: PortalNotification) {
    if (!userId) return
    const requestId = (notification.payload?.request_id as string | undefined) ?? notification.refId
    const role = (notification.payload?.requested_role as string | undefined) ?? 'member'
    if (!requestId) throw new Error('Join request id missing.')

    await withAction(notification.id, async () => {
      await decideJoinRequest(requestId, 'approve', role)
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onDeclineJoinRequest(notification: PortalNotification) {
    if (!userId) return
    const requestId = (notification.payload?.request_id as string | undefined) ?? notification.refId
    const role = (notification.payload?.requested_role as string | undefined) ?? 'member'
    if (!requestId) throw new Error('Join request id missing.')

    await withAction(notification.id, async () => {
      await decideJoinRequest(requestId, 'decline', role)
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onApproveGuestMerge(notification: PortalNotification) {
    if (!userId) return
    const requestId = (notification.payload?.request_id as string | undefined) ?? notification.refId
    if (!requestId) throw new Error('Guest merge request id missing.')

    await withAction(notification.id, async () => {
      await decideGuestMerge(requestId, 'approve')
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onDeclineGuestMerge(notification: PortalNotification) {
    if (!userId) return
    const requestId = (notification.payload?.request_id as string | undefined) ?? notification.refId
    if (!requestId) throw new Error('Guest merge request id missing.')

    await withAction(notification.id, async () => {
      await decideGuestMerge(requestId, 'decline')
      await markNotificationsRead(userId, [notification.id])
    })
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading notifications…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <h2 className="text-2xl font-semibold text-white">Notifications Inbox</h2>
        <p className="mt-1 text-sm text-slate-400">
          Action-driven inbox for invites, requests, and account/squad updates.
        </p>
      </PortalCard>

      <PortalCard title="Overview">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">Total: {rows.length}</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-300/10 px-3 py-1 text-amber-200">Unread: {unreadCount}</span>
        </div>
      </PortalCard>

      {error && (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      <PortalCard title="Inbox" subtitle="Supported actions are enabled where payload contracts are clear">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Context</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    busy={workingId === notification.id}
                    onMarkRead={onMarkRead}
                    onAcceptInvite={onAcceptInvite}
                    onDeclineInvite={onDeclineInvite}
                    onApproveJoinRequest={onApproveJoinRequest}
                    onDeclineJoinRequest={onDeclineJoinRequest}
                    onApproveGuestMerge={onApproveGuestMerge}
                    onDeclineGuestMerge={onDeclineGuestMerge}
                  />
                ))
              ) : (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-400" colSpan={5}>
                    No notifications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </section>
  )
}
