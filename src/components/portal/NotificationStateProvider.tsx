import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  getUnreadNotificationsCount,
  listNotifications,
  markNotificationsRead,
  type PortalNotification,
} from '@/lib/portal-notifications'
import {
  applyNotificationsRead,
  countNewlyRead,
  mergeNotificationPages,
  NOTIFICATIONS_PAGE_SIZE,
} from '@/lib/canonical/notifications-parity'
import { supabase } from '@/lib/supabase'

type LoadState = 'loading' | 'success' | 'error'

type NotificationState = {
  rows: PortalNotification[]
  listState: LoadState
  unreadCount: number | null
  unreadState: LoadState
  error: string | null
  hasMore: boolean
  loadingMore: boolean
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  markRead: (ids: string[]) => Promise<void>
}

const NotificationContext = createContext<NotificationState | null>(null)

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load notifications.'
}

export function NotificationStateProvider({ userId, accessToken, children }: { userId: string; accessToken: string | null; children: ReactNode }) {
  const [rows, setRows] = useState<PortalNotification[]>([])
  const [listState, setListState] = useState<LoadState>('loading')
  const [unreadCount, setUnreadCount] = useState<number | null>(null)
  const [unreadState, setUnreadState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const rowsRef = useRef(rows)
  const unreadCountRef = useRef(unreadCount)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryIndex = useRef(0)

  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { unreadCountRef.current = unreadCount }, [unreadCount])

  const refresh = useCallback(async () => {
    setListState((state) => rowsRef.current.length ? state : 'loading')
    setUnreadState((state) => unreadCountRef.current == null ? 'loading' : state)
    const [listResult, countResult] = await Promise.allSettled([
      listNotifications(userId, NOTIFICATIONS_PAGE_SIZE),
      getUnreadNotificationsCount(userId),
    ])

    if (listResult.status === 'fulfilled') {
      setRows((current) => mergeNotificationPages(current, listResult.value, true))
      setHasMore(listResult.value.length === NOTIFICATIONS_PAGE_SIZE)
      setListState('success')
    } else {
      setListState('error')
    }

    if (countResult.status === 'fulfilled') {
      unreadCountRef.current = countResult.value
      setUnreadCount(countResult.value)
      setUnreadState('success')
    } else {
      unreadCountRef.current = null
      setUnreadCount(null)
      setUnreadState('error')
    }

    const failure = listResult.status === 'rejected' ? listResult.reason : countResult.status === 'rejected' ? countResult.reason : null
    setError(failure ? messageOf(failure) : null)
  }, [userId])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => void refresh(), 200)
  }, [refresh])

  useEffect(() => {
    setRows([])
    rowsRef.current = []
    unreadCountRef.current = null
    setUnreadCount(null)
    setListState('loading')
    setUnreadState('loading')
    void refresh()

    const onFocus = () => scheduleRefresh()
    const onVisibility = () => { if (document.visibilityState === 'visible') scheduleRefresh() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    if (accessToken) void supabase.realtime.setAuth(accessToken)
    const channel = supabase
      .channel(`portal_notifications_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, scheduleRefresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          retryIndex.current = 0
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          const delays = [1000, 3000, 10000, 30000]
          const delay = delays[Math.min(retryIndex.current, delays.length - 1)]
          retryIndex.current += 1
          if (retryTimer.current) clearTimeout(retryTimer.current)
          retryTimer.current = setTimeout(scheduleRefresh, delay)
        }
      })

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      if (retryTimer.current) clearTimeout(retryTimer.current)
      void supabase.removeChannel(channel)
    }
  }, [accessToken, refresh, scheduleRefresh, userId])

  const markRead = useCallback(async (ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (!uniqueIds.length) return
    const previousRows = rowsRef.current
    const previousCount = unreadCountRef.current
    const newlyRead = countNewlyRead(previousRows, uniqueIds)
    const nextRows = applyNotificationsRead(previousRows, uniqueIds, new Date().toISOString())
    rowsRef.current = nextRows
    setRows(nextRows)
    if (previousCount != null) {
      unreadCountRef.current = Math.max(0, previousCount - newlyRead)
      setUnreadCount(unreadCountRef.current)
    }
    try {
      await markNotificationsRead(userId, uniqueIds)
      setError(null)
    } catch (markError) {
      rowsRef.current = previousRows
      setRows(previousRows)
      unreadCountRef.current = previousCount
      setUnreadCount(previousCount)
      setError(messageOf(markError))
      throw markError
    }
  }, [userId])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const cursor = rowsRef.current.at(-1)?.createdAt ?? null
    if (!cursor) return
    setLoadingMore(true)
    try {
      const next = await listNotifications(userId, NOTIFICATIONS_PAGE_SIZE, cursor)
      setRows((current) => mergeNotificationPages(current, next))
      setHasMore(next.length === NOTIFICATIONS_PAGE_SIZE)
      setError(null)
    } catch (loadError) {
      setError(messageOf(loadError))
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, userId])

  const value = useMemo(() => ({ rows, listState, unreadCount, unreadState, error, hasMore, loadingMore, refresh, loadMore, markRead }), [rows, listState, unreadCount, unreadState, error, hasMore, loadingMore, refresh, loadMore, markRead])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function usePortalNotificationState() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('usePortalNotificationState must be used within NotificationStateProvider.')
  return value
}
