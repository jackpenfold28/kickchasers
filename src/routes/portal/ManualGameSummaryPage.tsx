import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { getManualGameSummary, type ManualGameSummary } from '@/lib/portal-games'
import type { TotalsWithDerived } from '@/lib/canonical/player-event-aggregate'
import type { StatKey } from '@/lib/canonical/benchmarks'
import { formatRoundLabel } from '@/lib/round-label'

const STAT_LABELS: Array<{ key: keyof TotalsWithDerived; label: string; benchmark?: StatKey }> = [
  { key: 'disposals', label: 'Disposals', benchmark: 'disposals' },
  { key: 'kicks', label: 'Kicks', benchmark: 'kicks' },
  { key: 'handballs', label: 'Handballs', benchmark: 'handballs' },
  { key: 'marks', label: 'Marks', benchmark: 'marks' },
  { key: 'tackles', label: 'Tackles', benchmark: 'tackles' },
  { key: 'goals', label: 'Goals', benchmark: 'goals' },
  { key: 'behinds', label: 'Behinds', benchmark: 'behinds' },
  { key: 'clearances', label: 'Clearances', benchmark: 'clearances' },
  { key: 'inside50s', label: 'Inside 50s', benchmark: 'inside_50s' },
  { key: 'rebound50s', label: 'Rebound 50s', benchmark: 'rebound_50s' },
  { key: 'hitouts', label: 'Hitouts', benchmark: 'hitouts' },
  { key: 'groundBallGets', label: 'Ground Ball Gets', benchmark: 'ground_ball_gets' },
  { key: 'handballReceives', label: 'Handball Receives' },
  { key: 'turnovers', label: 'Turnovers', benchmark: 'turnovers' },
  { key: 'intercepts', label: 'Intercepts', benchmark: 'intercepts' },
  { key: 'onePercenters', label: 'One Percenters', benchmark: 'one_percenters' },
  { key: 'goalAssists', label: 'Goal Assists', benchmark: 'goal_assists' },
  { key: 'contestedPossessions', label: 'Contested Possessions', benchmark: 'contested_possessions' },
  { key: 'uncontestedPossessions', label: 'Uncontested Possessions', benchmark: 'uncontested_possessions' },
  { key: 'contestedMarks', label: 'Contested Marks', benchmark: 'contested_marks' },
  { key: 'uncontestedMarks', label: 'Uncontested Marks' },
  { key: 'effectiveKicks', label: 'Effective Kicks' },
  { key: 'ineffectiveKicks', label: 'Ineffective Kicks' },
  { key: 'effectiveHandballs', label: 'Effective Handballs' },
  { key: 'ineffectiveHandballs', label: 'Ineffective Handballs' },
  { key: 'freesFor', label: 'Frees For', benchmark: 'frees_for' },
  { key: 'freesAgainst', label: 'Frees Against', benchmark: 'frees_against' },
  { key: 'fantasy', label: 'Fantasy Points', benchmark: 'fantasy_points' },
]

export default function ManualGameSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ManualGameSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) { setLoading(false); return }
      try {
        const data = await getManualGameSummary(id)
        if (!cancelled) setSummary(data)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load manual summary.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <main className="min-h-screen p-6 app-bg">Loading manual summary…</main>
  if (error) return <PortalCard><p className="text-sm text-red-300">{error}</p></PortalCard>
  if (!summary) return <PortalCard><p className="text-sm text-red-300">Manual summary not found or you do not have access.</p></PortalCard>

  const visibleStats = STAT_LABELS.filter((stat) => summary.availability[stat.key])
  const handleShare = async () => {
    const text = `${summary.subjectName || 'Player'} vs ${summary.opponent || 'Opponent'} — ${summary.stats.goals}.${summary.stats.behinds} (${summary.stats.points}), Impact 7 ${summary.impact7.toFixed(1)}`
    try {
      if (navigator.share) await navigator.share({ title: 'KickChasers Manual Game Summary', text })
      else if (navigator.clipboard) await navigator.clipboard.writeText(text)
    } catch {
      // Native/browser share cancellation is not a summary failure.
    }
  }

  return (
    <section className="grid gap-6 pb-10">
      <PortalCard>
        <div className="flex items-center justify-between gap-3"><Link to="/games" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#39FF88]">← Game log</Link><button type="button" onClick={() => void handleShare()} className="btn btn-secondary">Share summary</button></div>
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center gap-4">
            {summary.teamLogoUrl ? <img src={summary.teamLogoUrl} alt={summary.teamName || 'Team'} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="h-16 w-16 rounded-2xl bg-white/5" />}
            <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Player</p><h1 className="mt-1 text-2xl font-black text-white">{summary.subjectName || 'Manual game'}</h1><p className="text-sm text-slate-400">{summary.teamName || 'Team not recorded'}{summary.playerNumber != null ? ` • #${summary.playerNumber}` : ''}{summary.position ? ` • ${summary.position}` : ''}</p></div>
          </div>
          <div className="text-center"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Manual summary</p><p className="mt-1 text-lg font-semibold text-white">vs</p></div>
          <div className="flex items-center justify-end gap-4 text-right">
            <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opponent</p><h2 className="mt-1 text-2xl font-black text-white">{summary.opponent || 'Opponent'}</h2></div>
            {summary.opponentLogoUrl ? <img src={summary.opponentLogoUrl} alt={summary.opponent || 'Opponent'} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="h-16 w-16 rounded-2xl bg-white/5" />}
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">{summary.date ? new Date(summary.date).toLocaleDateString() : 'Date not recorded'} • {formatRoundLabel(summary.round, 'Round not recorded')} • {summary.venue || 'Venue not recorded'}</p>
      </PortalCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <PortalCard title="Impact 7" subtitle={`${summary.position || 'Default'} benchmark group`}><p className="text-4xl font-black text-white">{summary.impact7.toFixed(1)}</p><p className="mt-1 text-sm text-slate-400">{summary.impactBand}</p></PortalCard>
        <PortalCard title="Recorded score" subtitle="Manual games store the player score, not an event timeline"><p className="text-4xl font-black text-white">{summary.stats.goals}.{summary.stats.behinds} ({summary.stats.points})</p></PortalCard>
      </div>

      <PortalCard title="Manual Player Totals" subtitle="Stored manual fields; unavailable optional fields are not fabricated">
        {visibleStats.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleStats.map((stat) => <div key={stat.key} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>{stat.benchmark && summary.benchmarkBands[stat.benchmark] ? <span className="text-[10px] uppercase text-[#9CE8BE]">{summary.benchmarkBands[stat.benchmark]}</span> : null}</div><p className="mt-1 text-2xl font-semibold text-white">{Number(summary.stats[stat.key] ?? 0)}</p></div>)}</div> : <p className="text-sm text-slate-400">This manual record contains no supported stat totals.</p>}
      </PortalCard>

      {summary.canEditDelete ? <PortalCard><p className="text-sm text-slate-400">This is your manual record. Editing and deletion remain in the existing game-log workflow; this summary does not broaden mutation rights.</p></PortalCard> : null}
    </section>
  )
}
