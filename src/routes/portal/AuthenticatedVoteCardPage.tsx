import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import PublicVoteCard from '@/components/vote-card/PublicVoteCard'
import type { PublicVoteCardContext } from '@/components/vote-card/publicVoteCard.types'
import { getVoteCardContext, submitVoteCard } from '@/lib/squad-votes'

export default function AuthenticatedVoteCardPage() {
  const { id, cardId } = useParams<{ id: string; cardId: string }>()
  const [context, setContext] = useState<PublicVoteCardContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!cardId) return
      setLoading(true)
      try { const next = await getVoteCardContext(cardId); if (!cancelled) { setContext(next); setError(null) } }
      catch (loadError) { if (!cancelled) { setContext(null); setError(loadError instanceof Error ? loadError.message : 'Vote card unavailable.') } }
      finally { if (!cancelled) setLoading(false) }
    }
    void load(); return () => { cancelled = true }
  }, [cardId])
  if (loading) return <main className="min-h-screen p-6 app-bg">Loading secure vote card…</main>
  if (!context || !cardId) return <PortalCard><p className="text-sm font-semibold text-red-300">You cannot access this vote card.</p><p className="mt-1 text-sm text-slate-400">{error || 'The card is unavailable.'}</p>{id ? <Link className="mt-4 inline-flex rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white" to={`/teams/${encodeURIComponent(id)}?tab=votes`}>Back to voting</Link> : null}</PortalCard>
  return <PublicVoteCard context={context} mode="live" onSubmitLive={async ({ payload }) => { try { setContext(await submitVoteCard(cardId, payload)); return null } catch { return 'Your votes were not submitted. Review every selection and try again.' } }} />
}
