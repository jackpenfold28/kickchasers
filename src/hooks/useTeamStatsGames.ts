import { useCallback, useEffect, useRef, useState } from 'react'
import { teamStatsGamesPollInterval } from '@/lib/canonical/team-stats-games'
import { listTeamStatsGamesForSquad, type TeamStatsGamesSnapshot } from '@/lib/team-stats-games'

type State =
  | { status: 'loading'; snapshot: null; error: null }
  | { status: 'ready'; snapshot: TeamStatsGamesSnapshot; error: null }
  | { status: 'error'; snapshot: null; error: string }

export function useTeamStatsGames(squadId: string, viewerUserId: string) {
  const [state, setState] = useState<State>({ status: 'loading', snapshot: null, error: null })
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const current = ++requestId.current
    try {
      const snapshot = await listTeamStatsGamesForSquad(squadId, viewerUserId)
      if (current === requestId.current) setState({ status: 'ready', snapshot, error: null })
    } catch (error) {
      if (current === requestId.current) setState({ status: 'error', snapshot: null, error: error instanceof Error ? error.message : 'Unable to load Team Stats Games.' })
    }
  }, [squadId, viewerUserId])

  useEffect(() => {
    setState({ status: 'loading', snapshot: null, error: null })
    void refresh()
    return () => { requestId.current++ }
  }, [refresh])

  useEffect(() => {
    const intervalMs = teamStatsGamesPollInterval(state.snapshot?.games ?? [], typeof document === 'undefined' || document.visibilityState === 'visible')
    if (!intervalMs) return undefined
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
    return () => window.clearInterval(interval)
  }, [refresh, state.snapshot?.games])

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  return { ...state, refresh }
}
