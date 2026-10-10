import { useCallback, useEffect, useRef, useState } from 'react'

import {
  mergePlayerCardAlbumPages,
  type PlayerCardAlbumCard,
  type PlayerCardAlbumCursor,
  type PlayerCardAlbumSummary,
} from '@/lib/canonical/player-card-album'
import { getPlayerCardAlbumSummary, listPlayerCardAlbumPage } from '@/lib/player-card-album'

export type PlayerCardAlbumState = 'idle' | 'loading' | 'ready' | 'error'

export function usePlayerCardAlbum({
  ownerProfileId,
  viewerUserId,
  enabled,
}: {
  ownerProfileId: string | null
  viewerUserId: string | null
  enabled: boolean
}) {
  const [cards, setCards] = useState<PlayerCardAlbumCard[]>([])
  const [summary, setSummary] = useState<PlayerCardAlbumSummary | null>(null)
  const [cursor, setCursor] = useState<PlayerCardAlbumCursor | null>(null)
  const [state, setState] = useState<PlayerCardAlbumState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (append: boolean) => {
    if (!enabled || !ownerProfileId || !viewerUserId) return
    const activeRequest = ++requestId.current
    append ? setLoadingMore(true) : setState('loading')
    if (!append) setError(null)
    try {
      const page = await listPlayerCardAlbumPage({
        ownerProfileId,
        viewerUserId,
        cursor: append ? cursor : null,
      })
      if (activeRequest !== requestId.current) return
      setCards((current) => mergePlayerCardAlbumPages(append ? [...current, ...page.items] : page.items))
      setCursor(page.nextCursor)
      setState('ready')
      if (!append) {
        getPlayerCardAlbumSummary({ ownerProfileId, viewerUserId })
          .then((value) => { if (activeRequest === requestId.current) setSummary(value) })
          .catch(() => { if (activeRequest === requestId.current) setSummary(null) })
      }
    } catch (reason) {
      if (activeRequest !== requestId.current) return
      setError(reason instanceof Error ? reason.message : 'Your Album could not load.')
      setState('error')
    } finally {
      if (activeRequest === requestId.current) setLoadingMore(false)
    }
  }, [cursor, enabled, ownerProfileId, viewerUserId])

  useEffect(() => {
    const activeRequest = ++requestId.current
    setCards([])
    setSummary(null)
    setCursor(null)
    setError(null)
    setState(enabled && ownerProfileId && viewerUserId ? 'loading' : 'idle')
    if (!enabled || !ownerProfileId || !viewerUserId) return
    let active = true
    Promise.allSettled([
      listPlayerCardAlbumPage({ ownerProfileId, viewerUserId }),
      getPlayerCardAlbumSummary({ ownerProfileId, viewerUserId }),
    ]).then(([pageResult, summaryResult]) => {
      if (!active || activeRequest !== requestId.current) return
      if (pageResult.status === 'rejected') {
        setError(pageResult.reason instanceof Error ? pageResult.reason.message : 'Your Album could not load.')
        setState('error')
        return
      }
      setCards(mergePlayerCardAlbumPages(pageResult.value.items))
      setCursor(pageResult.value.nextCursor)
      setSummary(summaryResult.status === 'fulfilled' ? summaryResult.value : null)
      setState('ready')
    })
    return () => { active = false }
  }, [enabled, ownerProfileId, viewerUserId])

  return {
    cards,
    summary,
    state,
    error,
    hasMore: Boolean(cursor),
    loadingMore,
    loadMore: () => load(true),
    refresh: () => load(false),
  }
}
