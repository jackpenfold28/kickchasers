import { useCallback, useEffect, useRef, useState } from 'react'
import { getSquadVoteAccess, listSquadVoteGroups } from '@/lib/squad-votes'
import type { VoteAccess, VoteGroup } from '@/lib/canonical/squad-votes'

type VoteState =
  | { status: 'loading'; access: null; groups: VoteGroup[]; error: null }
  | { status: 'ready'; access: VoteAccess; groups: VoteGroup[]; error: null }
  | { status: 'error'; access: null; groups: VoteGroup[]; error: string }

export function useSquadVotes(squadId: string) {
  const [state, setState] = useState<VoteState>({ status: 'loading', access: null, groups: [], error: null })
  const request = useRef(0)
  const refresh = useCallback(async () => {
    const id = ++request.current
    try {
      const access = await getSquadVoteAccess(squadId)
      const groups = access.canManage ? await listSquadVoteGroups(squadId) : []
      if (id === request.current) setState({ status: 'ready', access, groups, error: null })
    } catch (error) {
      if (id === request.current) setState({ status: 'error', access: null, groups: [], error: error instanceof Error ? error.message : 'Unable to load voting.' })
    }
  }, [squadId])
  useEffect(() => { setState({ status: 'loading', access: null, groups: [], error: null }); void refresh(); return () => { request.current++ } }, [refresh])
  return { ...state, refresh }
}
