import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationRow from '@/components/portal/NotificationRow'
import { usePortalNotificationState } from '@/components/portal/NotificationStateProvider'
import { resolveWebNotificationDestination } from '@/lib/portal-notification-routing'
import { visibleAutoReadIds } from '@/lib/canonical/notifications-parity'
import {
  decideJoinRequest,
  respondInvite,
  respondTrackRequest,
  type PortalNotification,
} from '@/lib/portal-notifications'
import { supabase } from '@/lib/supabase'

type NotificationSection = { label: string; items: PortalNotification[] }

function formatDayLabel(iso: string | null) {
  if (!iso) return 'Earlier'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Earlier'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(date); target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

function buildSections(rows: PortalNotification[]): NotificationSection[] {
  return rows.reduce<NotificationSection[]>((sections, notification) => {
    const label = formatDayLabel(notification.createdAt)
    const current = sections.at(-1)
    if (current?.label === label) current.items.push(notification)
    else sections.push({ label, items: [notification] })
    return sections
  }, [])
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { rows, listState, unreadCount, unreadState, error, hasMore, loadingMore, refresh, loadMore, markRead } = usePortalNotificationState()
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const sections = useMemo(() => buildSections(rows), [rows])

  useEffect(() => {
    if (listState !== 'success') return
    const ids = visibleAutoReadIds(rows)
    if (ids.length) void markRead(ids).catch(() => undefined)
  }, [listState, markRead, rows])

  async function withAction(id: string, action: (userId: string) => Promise<void>) {
    try {
      setWorkingId(id)
      setActionError(null)
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('Your session has expired.')
      await action(data.user.id)
      await refresh()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Action failed.')
    } finally {
      setWorkingId(null)
    }
  }

  async function handleOpen(notification: PortalNotification) {
    const destination = resolveWebNotificationDestination(notification)
    if (destination.status !== 'supported' && import.meta.env.DEV) {
      console.warn('[notifications] Using safe web destination', { notificationId: notification.id, type: notification.rawType, destination })
    }
    if (!notification.readAt) {
      try { await markRead([notification.id]) } catch { /* Navigation remains available if read state fails. */ }
    }
    if (destination.href === '/notifications') {
      setActionError(destination.reason || 'This notification destination is no longer available.')
      return
    }
    navigate(destination.href)
  }

  const action = (notification: PortalNotification, callback: (userId: string) => Promise<void>) =>
    withAction(notification.id, async (userId) => { await callback(userId); await markRead([notification.id]) })

  if (listState === 'loading' && rows.length === 0) {
    return <section className="mx-auto flex min-h-[60vh] w-full max-w-[840px] items-center justify-center px-4"><div className="flex items-center gap-3 text-sm text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#39FF88]" />Loading notifications</div></section>
  }

  const pageFailed = listState === 'error' && rows.length === 0
  return (
    <section className="mx-auto w-full max-w-[840px]">
      <header className="border-b border-white/8 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8BE3B3]">Inbox</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-3xl font-black tracking-[-0.03em] text-white sm:text-[34px]">Notifications</h1><p className="mt-2 max-w-[36rem] text-sm leading-6 text-slate-400">A single feed for squad operations, admin decisions, tracked games, and social activity.</p></div>
          <p className="text-sm text-slate-500">{unreadState === 'loading' ? 'Checking unread…' : unreadState === 'error' || unreadCount == null ? 'Unread unavailable' : unreadCount > 0 ? `${unreadCount} unread` : 'Caught up'}</p>
        </div>
      </header>

      {error || actionError ? <div className="mt-5 flex items-center justify-between gap-3 rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"><span>{actionError || error}</span><button type="button" className="shrink-0 font-semibold underline" onClick={() => { setActionError(null); void refresh() }}>Retry</button></div> : null}

      {pageFailed ? (
        <div className="mt-10 rounded-[22px] border border-red-500/20 bg-[#091321] px-6 py-14 text-center"><h2 className="text-xl font-semibold text-white">Notifications are unavailable</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">We couldn&apos;t load your inbox. Retry when your connection is available.</p><button type="button" className="mt-5 rounded-xl bg-[#39FF88] px-4 py-2 text-sm font-bold text-[#07121F]" onClick={() => void refresh()}>Try again</button></div>
      ) : rows.length ? (
        <div className="mt-6 space-y-7">
          {sections.map((section) => <section key={section.label} className="space-y-3"><div className="px-1"><h2 className="text-lg font-extrabold tracking-[-0.02em] text-white">{section.label}</h2></div><div className="overflow-hidden rounded-[20px] border border-white/8 bg-[#08111F]">{section.items.map((notification) => <NotificationRow key={notification.id} notification={notification} busy={workingId === notification.id} onOpen={handleOpen} onAcceptInvite={(item) => action(item, (uid) => { if (!item.refId) throw new Error('Invite reference missing.'); return respondInvite(uid, item.refId, true) })} onDeclineInvite={(item) => action(item, (uid) => { if (!item.refId) throw new Error('Invite reference missing.'); return respondInvite(uid, item.refId, false) })} onApproveJoinRequest={(item) => action(item, () => { const requestId = String(item.payload?.request_id || item.refId || ''); if (!requestId) throw new Error('Join request id missing.'); return decideJoinRequest(requestId, 'approve', String(item.payload?.requested_role || 'member')) })} onDeclineJoinRequest={(item) => action(item, () => { const requestId = String(item.payload?.request_id || item.refId || ''); if (!requestId) throw new Error('Join request id missing.'); return decideJoinRequest(requestId, 'decline', String(item.payload?.requested_role || 'member')) })} onAcceptTrackRequest={(item) => action(item, () => { const gameId = String(item.payload?.gameId || item.payload?.game_id || item.refId || ''); if (!gameId) throw new Error('Track request reference missing.'); return respondTrackRequest(gameId, 'accepted') })} onDeclineTrackRequest={(item) => action(item, () => { const gameId = String(item.payload?.gameId || item.payload?.game_id || item.refId || ''); if (!gameId) throw new Error('Track request reference missing.'); return respondTrackRequest(gameId, 'declined') })} />)}</div></section>)}
          {hasMore ? <div className="flex justify-center"><button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loadingMore ? 'Loading…' : 'Load older notifications'}</button></div> : null}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] border border-white/8 bg-[#091321] px-6 py-14 text-center"><h2 className="text-xl font-semibold text-white">You&apos;re caught up</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">New squad activity, admin requests, and game updates will land here.</p></div>
      )}
    </section>
  )
}
