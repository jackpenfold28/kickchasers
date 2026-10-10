import { useCallback, useEffect, useRef, useState } from 'react'

import { sortAndDedupeProfilePosts, type ProfilePost, type ProfilePostCursor } from '@/lib/canonical/profile-posts'
import { listDashboardCommunityPosts } from '@/lib/profile-posts'
import { setProfileFollowing } from '@/lib/portal-profile'

export type DashboardCommunityState = 'idle' | 'loading' | 'ready' | 'error'

export function useDashboardCommunityActivity(viewerId: string | null) {
  const [items, setItems] = useState<ProfilePost[]>([])
  const [state, setState] = useState<DashboardCommunityState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<ProfilePostCursor | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [followedAuthorIds, setFollowedAuthorIds] = useState<Set<string>>(new Set())
  const [followingAuthorIds, setFollowingAuthorIds] = useState<Set<string>>(new Set())
  const [followErrors, setFollowErrors] = useState<Record<string, string>>({})
  const [followNotice, setFollowNotice] = useState('')
  const activeViewer = useRef(viewerId)
  activeViewer.current = viewerId
  const requestId = useRef(0)
  const paging = useRef(false)
  const pendingFollows = useRef(new Set<string>())
  const followVersion = useRef(0)

  const refresh = useCallback(async () => {
    if (!viewerId) return
    const currentRequest = ++requestId.current
    const version = followVersion.current
    paging.current = false
    setLoadingMore(false)
    setState((current) => current === 'ready' ? 'ready' : 'loading')
    setError(null)
    try {
      const next = await listDashboardCommunityPosts({ viewerId })
      if (currentRequest !== requestId.current) return
      setItems(next.items)
      setCursor(next.nextCursor)
      setMoreError(null)
      if (version === followVersion.current) setFollowedAuthorIds(next.followedAuthorIds)
      setState('ready')
    } catch (reason) {
      if (currentRequest !== requestId.current) return
      setError(reason instanceof Error ? reason.message : 'Unable to load the feed right now.')
      setState('error')
    }
  }, [viewerId])

  const loadMore = async () => {
    if (!viewerId || !cursor || paging.current) return
    paging.current = true
    const currentRequest = requestId.current
    const version = followVersion.current
    setLoadingMore(true)
    setMoreError(null)
    try {
      const next = await listDashboardCommunityPosts({ viewerId, cursor })
      if (currentRequest !== requestId.current) return
      setItems((current) => sortAndDedupeProfilePosts([...current, ...next.items]))
      setCursor(next.nextCursor)
      if (version === followVersion.current) setFollowedAuthorIds(next.followedAuthorIds)
    } catch {
      if (currentRequest === requestId.current) setMoreError('Older posts could not be loaded. Try again.')
    } finally {
      if (currentRequest === requestId.current) { paging.current = false; setLoadingMore(false) }
    }
  }

  const followAuthor = async (authorId: string) => {
    if (!viewerId || authorId === viewerId || followedAuthorIds.has(authorId) || pendingFollows.current.has(authorId)) return false
    pendingFollows.current.add(authorId)
    setFollowingAuthorIds(new Set(pendingFollows.current))
    setFollowErrors((current) => ({ ...current, [authorId]: '' }))
    try {
      await setProfileFollowing(authorId, viewerId, true)
      if (activeViewer.current !== viewerId) return false
      ++followVersion.current
      setFollowedAuthorIds((current) => new Set([...current, authorId]))
      setFollowNotice('You are now following this author.')
      return true
    } catch {
      if (activeViewer.current === viewerId) setFollowErrors((current) => ({ ...current, [authorId]: 'Could not follow. Try again.' }))
      return false
    } finally {
      pendingFollows.current.delete(authorId)
      setFollowingAuthorIds(new Set(pendingFollows.current))
    }
  }

  useEffect(() => {
    setItems([])
    setCursor(null)
    setFollowedAuthorIds(new Set())
    setFollowErrors({})
    setFollowNotice('')
    if (!viewerId) { setState('idle'); return }
    void refresh()
    return () => { ++requestId.current }
  }, [refresh, viewerId])

  useEffect(() => {
    if (!viewerId) return
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh, viewerId])

  return { items, state, error, refresh, loadMore, hasMore: Boolean(cursor), loadingMore, moreError, followedAuthorIds, followingAuthorIds, followErrors, followNotice, followAuthor }
}
