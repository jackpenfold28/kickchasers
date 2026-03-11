import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import GameSummaryHeader from '@/components/portal/GameSummaryHeader'
import { getManualGameSummary, type ManualGameSummary } from '@/lib/portal-games'

const STAT_LABELS: Array<{ key: string; label: string }> = [
  { key: 'disposals', label: 'Disposals' },
  { key: 'kicks', label: 'Kicks' },
  { key: 'handballs', label: 'Handballs' },
  { key: 'marks', label: 'Marks' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'goals', label: 'Goals' },
  { key: 'behinds', label: 'Behinds' },
  { key: 'clearances', label: 'Clearances' },
  { key: 'inside50s', label: 'Inside 50s' },
  { key: 'rebound50s', label: 'Rebound 50s' },
  { key: 'hitouts', label: 'Hitouts' },
]

export default function ManualGameSummaryPage() {
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ManualGameSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!id) return
      try {
        const data = await getManualGameSummary(id)
        if (!cancelled) setSummary(data)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load manual summary.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading manual summary…</main>
  }

  if (!summary) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Manual summary not available.'}</p>
      </PortalCard>
    )
  }

  return (
    <section className="grid gap-6">
      <GameSummaryHeader
        title={`Manual Summary vs ${summary.opponent || 'Opponent'}`}
        dateLabel={summary.date ? new Date(summary.date).toLocaleString() : 'Date TBD'}
        venue={summary.venue}
        round={summary.round}
        status="Manual"
        homeLogoUrl={summary.opponentLogoUrl}
        awayLogoUrl={summary.opponentLogoUrl}
        homeGoals={Number(summary.stats.goals ?? 0)}
        homeBehinds={Number(summary.stats.behinds ?? 0)}
        awayGoals={0}
        awayBehinds={0}
        backHref="/games"
      />

      <PortalCard title="Manual Player Totals" subtitle="Stats from manual game submission">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_LABELS.map((stat) => (
            <div key={stat.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{Number(summary.stats[stat.key] ?? 0)}</p>
            </div>
          ))}
        </div>
      </PortalCard>

      <PortalCard>
        <p className="text-xs text-slate-500">
          Manual summaries currently render directly from `manual_player_game_totals`. Post-linked RPC hydration can be layered on next if strict parity is required.
        </p>
      </PortalCard>
    </section>
  )
}
