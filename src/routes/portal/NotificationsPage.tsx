import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import DataTable from '@/components/portal/DataTable'
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

  function notificationHref(notification: PortalNotification) {
    if (!notification.squadId) return '/notifications'
    if (notification.type === 'squad_join_request_created' || notification.type === 'guest_merge_request_created') {
      return `/teams/${notification.squadId}?tab=manage`
    }
    if (notification.type === 'squad_invite') {
      return `/teams/${notification.squadId}`
    }
    return `/teams/${notification.squadId}`
  }

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
        <DataTable
          rows={rows}
          getRowKey={(row) => row.id}
          emptyLabel="No notifications yet."
          mobileCardRender={(notification) => {
            const busy = workingId === notification.id
            const actor = notification.actorHandle || notification.actorName || 'Someone'
            const squad = notification.squadName || ((notification.payload?.squad_name as string | undefined) ?? 'this squad')
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{notification.type.replaceAll('_', ' ')}</p>
                    <p className="mt-1 font-medium text-white">{actor}</p>
                    <p className="text-sm text-slate-400">{squad}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${notification.readAt ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
                    {notification.readAt ? 'Read' : 'Unread'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                <div className="flex flex-wrap gap-2">
                  {notification.squadId && (
                    <Link className="btn btn-secondary flex-1 sm:flex-none" to={notificationHref(notification)}>
                      View team
                    </Link>
                  )}
                  {!notification.readAt && (
                    <button className="btn btn-secondary flex-1 sm:flex-none" disabled={busy} onClick={() => onMarkRead(notification.id)}>
                      Mark read
                    </button>
                  )}
                  {notification.type === 'squad_invite' && (
                    <>
                      <button className="btn btn-secondary flex-1 sm:flex-none" disabled={busy} onClick={() => onAcceptInvite(notification)}>
                        Accept
                      </button>
                      <button className="btn flex-1 border-red-500/60 text-red-300 sm:flex-none" disabled={busy} onClick={() => onDeclineInvite(notification)}>
                        Decline
                      </button>
                    </>
                  )}
                  {notification.type === 'squad_join_request_created' && (
                    <>
                      <button className="btn btn-secondary flex-1 sm:flex-none" disabled={busy} onClick={() => onApproveJoinRequest(notification)}>
                        Approve
                      </button>
                      <button className="btn flex-1 border-red-500/60 text-red-300 sm:flex-none" disabled={busy} onClick={() => onDeclineJoinRequest(notification)}>
                        Reject
                      </button>
                    </>
                  )}
                  {notification.type === 'guest_merge_request_created' && (
                    <>
                      <button className="btn btn-secondary flex-1 sm:flex-none" disabled={busy} onClick={() => onApproveGuestMerge(notification)}>
                        Approve
                      </button>
                      <button className="btn flex-1 border-red-500/60 text-red-300 sm:flex-none" disabled={busy} onClick={() => onDeclineGuestMerge(notification)}>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          }}
          columns={[
            {
              key: 'type',
              label: 'Type',
              render: (notification) => (
                <span className="text-xs text-slate-400">{notification.type.replaceAll('_', ' ')}</span>
              ),
            },
            {
              key: 'context',
              label: 'Context',
              render: (notification) => {
                const actor = notification.actorHandle || notification.actorName || 'Someone'
                const squad = notification.squadName || ((notification.payload?.squad_name as string | undefined) ?? 'this squad')
                return (
                  <>
                    <p className="font-medium text-white">{actor}</p>
                    <p className="text-xs text-slate-400">{squad}</p>
                  </>
                )
              },
            },
            {
              key: 'time',
              label: 'Time',
              render: (notification) => (
                <span className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (notification) =>
                notification.readAt ? <span className="text-emerald-300">Read</span> : <span className="text-amber-300">Unread</span>,
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (notification) => {
                const busy = workingId === notification.id
                return (
                  <div className="flex flex-wrap gap-2">
                    {notification.squadId && (
                      <Link className="btn btn-secondary px-2 py-1 text-xs" to={notificationHref(notification)}>
                        View team
                      </Link>
                    )}
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
                )
              },
            },
          ]}
        />
      </PortalCard>
    </section>
  )
}
