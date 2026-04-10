import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationRow from '@/components/portal/NotificationRow'
import { resolvePortalNotificationHref } from '@/lib/portal-notification-routing'
import {
  decideJoinRequest,
  listNotifications,
  markNotificationsRead,
  respondInvite,
  respondTrackRequest,
  type PortalNotification,
} from '@/lib/portal-notifications'
import { supabase } from '@/lib/supabase'

type NotificationSection = {
  label: string
  items: PortalNotification[]
}

function formatDayLabel(iso: string | null) {
  if (!iso) return 'Earlier'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Earlier'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function buildSections(rows: PortalNotification[]): NotificationSection[] {
  const sections: NotificationSection[] = []
  let currentLabel: string | null = null

  rows.forEach((notification) => {
    const label = formatDayLabel(notification.createdAt)
    if (label !== currentLabel) {
      sections.push({ label, items: [notification] })
      currentLabel = label
      return
    }

    sections[sections.length - 1]?.items.push(notification)
  })

  return sections
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<PortalNotification[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load(userIdValue?: string | null) {
    const uid = userIdValue ?? userId
    if (!uid) return

    const list = await listNotifications(uid, 100)
    setRows(list)
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (cancelled) return
        setUserId(user.id)

        const list = await listNotifications(user.id, 100)
        if (!cancelled) {
          setRows(list)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`portal_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void load(userId)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const unreadCount = useMemo(() => rows.filter((row) => !row.readAt).length, [rows])
  const sections = useMemo(() => buildSections(rows), [rows])

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

  async function markReadOptimistic(notificationId: string) {
    if (!userId) return

    setRows((current) =>
      current.map((item) =>
        item.id === notificationId && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item
      )
    )
    await markNotificationsRead(userId, [notificationId])
  }

  async function handleOpen(notification: PortalNotification) {
    const href = resolvePortalNotificationHref(notification)
    if (!href) return

    if (!notification.readAt && userId) {
      try {
        await markReadOptimistic(notification.id)
      } catch {
        // Ignore read failures on navigation; destination matters more than badge freshness.
      }
    }

    navigate(href)
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

  async function onAcceptTrackRequest(notification: PortalNotification) {
    if (!userId) return
    const gameId =
      (notification.payload?.gameId as string | undefined) ??
      (notification.payload?.game_id as string | undefined) ??
      notification.refId

    if (!gameId) throw new Error('Track request reference missing.')

    await withAction(notification.id, async () => {
      await respondTrackRequest(gameId, 'accepted')
      await markNotificationsRead(userId, [notification.id])
    })
  }

  async function onDeclineTrackRequest(notification: PortalNotification) {
    if (!userId) return
    const gameId =
      (notification.payload?.gameId as string | undefined) ??
      (notification.payload?.game_id as string | undefined) ??
      notification.refId

    if (!gameId) throw new Error('Track request reference missing.')

    await withAction(notification.id, async () => {
      await respondTrackRequest(gameId, 'declined')
      await markNotificationsRead(userId, [notification.id])
    })
  }

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-[840px] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#39FF88]" />
          Loading notifications
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[840px]">
      <header className="border-b border-white/8 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8BE3B3]">Inbox</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.03em] text-white sm:text-[34px]">Notifications</h1>
            <p className="mt-2 max-w-[36rem] text-sm leading-6 text-slate-400">
              A single feed for squad operations, admin decisions, tracked games, and social activity.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'Caught up'}
          </p>
        </div>
      </header>

      {error ? (
        <div className="mt-5 rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {rows.length ? (
        <div className="mt-6 space-y-7">
          {sections.map((section) => (
            <section key={section.label} className="space-y-3">
              <div className="px-1">
                <h2 className="text-lg font-extrabold tracking-[-0.02em] text-white">{section.label}</h2>
              </div>

              <div className="overflow-hidden rounded-[20px] border border-white/8 bg-[#08111F]">
                {section.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    busy={workingId === notification.id}
                    onOpen={resolvePortalNotificationHref(notification) ? handleOpen : undefined}
                    onAcceptInvite={onAcceptInvite}
                    onDeclineInvite={onDeclineInvite}
                    onApproveJoinRequest={onApproveJoinRequest}
                    onDeclineJoinRequest={onDeclineJoinRequest}
                    onAcceptTrackRequest={onAcceptTrackRequest}
                    onDeclineTrackRequest={onDeclineTrackRequest}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] border border-white/8 bg-[#091321] px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-white">You&apos;re caught up</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            New squad activity, admin requests, and game updates will land here.
          </p>
        </div>
      )}
    </section>
  )
}
