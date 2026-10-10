import { useCallback, useEffect, useRef, useState } from 'react'

import { sortAndDedupeProfilePosts, type ProfilePost, type ProfilePostCursor } from '@/lib/canonical/profile-posts'
import { listProfilePosts, type ProfilePostAccess } from '@/lib/profile-posts'

export type ProfilePostsState = 'idle' | 'loading' | 'ready' | 'error'

export function useProfilePosts({
  authorId,
  viewerId,
  mode,
  enabled,
}: {
  authorId: string | null
  viewerId: string | null
  mode: 'self' | 'public'
  enabled: boolean
}) {
  const [items, setItems] = useState<ProfilePost[]>([])
  const [cursor, setCursor] = useState<ProfilePostCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [access, setAccess] = useState<ProfilePostAccess>('visible')
  const [state, setState] = useState<ProfilePostsState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (append: boolean) => {
    if (!enabled || !authorId) return
    const currentRequest = ++requestId.current
    append ? setLoadingMore(true) : setState('loading')
    if (!append) setError(null)
    try {
      const page = await listProfilePosts({ authorId, viewerId, mode, cursor: append ? cursor : null })
      if (currentRequest !== requestId.current) return
      setItems((current) => sortAndDedupeProfilePosts(append ? [...current, ...page.items] : page.items))
      setCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setAccess(page.access)
      setState('ready')
    } catch (reason) {
      if (currentRequest !== requestId.current) return
      setError(reason instanceof Error ? reason.message : 'Unable to load posts right now.')
      setState('error')
    } finally {
      if (currentRequest === requestId.current) setLoadingMore(false)
    }
  }, [authorId, cursor, enabled, mode, viewerId])

  useEffect(() => {
    const currentRequest = ++requestId.current
    setItems([])
    setCursor(null)
    setHasMore(false)
    setAccess('visible')
    setError(null)
    setState(enabled && authorId ? 'loading' : 'idle')
    if (!enabled || !authorId) return
    let active = true
    listProfilePosts({ authorId, viewerId, mode })
      .then((page) => {
        if (!active || currentRequest !== requestId.current) return
        setItems(sortAndDedupeProfilePosts(page.items))
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
        setAccess(page.access)
        setState('ready')
      })
      .catch((reason) => {
        if (!active || currentRequest !== requestId.current) return
        setError(reason instanceof Error ? reason.message : 'Unable to load posts right now.')
        setState('error')
      })
    return () => { active = false }
  }, [authorId, enabled, mode, viewerId])

  return {
    items,
    hasMore,
    access,
    state,
    error,
    loadingMore,
    loadMore: () => load(true),
    refresh: () => load(false),
  }
}
