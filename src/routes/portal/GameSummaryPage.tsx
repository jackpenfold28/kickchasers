import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import GameSummaryHeader from '@/components/portal/GameSummaryHeader'
import TeamStatCards from '@/components/portal/TeamStatCards'
import PlayerStatsTable from '@/components/portal/PlayerStatsTable'
import { getGameSummary, type GameSummary } from '@/lib/portal-games'

export default function GameSummaryPage() {
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!id) return
      try {
        const data = await getGameSummary(id)
        if (!cancelled) setSummary(data)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load game summary.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading summary…</main>
  }

  if (!summary) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Game summary not available.'}</p>
      </PortalCard>
    )
  }

  return (
    <section className="grid gap-6">
      <GameSummaryHeader
        title={`${summary.squadName || 'Home'} vs ${summary.opponent || 'Opponent'}`}
        dateLabel={summary.date ? new Date(summary.date).toLocaleString() : 'Date TBD'}
        venue={summary.venue}
        round={summary.round}
        status={summary.status}
        homeLogoUrl={summary.squadLogoUrl}
        awayLogoUrl={summary.opponentLogoUrl}
        homeGoals={summary.scoreHomeGoals}
        homeBehinds={summary.scoreHomeBehinds}
        awayGoals={summary.scoreAwayGoals}
        awayBehinds={summary.scoreAwayBehinds}
        backHref="/games"
      />

      <TeamStatCards stats={summary.teamStats} />

      <PortalCard title="Player Stats" subtitle="Sortable player-level stat table">
        <PlayerStatsTable rows={summary.playerStats} />
      </PortalCard>

      <PortalCard title="Quarter Breakdown" subtitle="Scoring by quarter">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Quarter</th>
                <th className="px-3 py-2">Home</th>
                <th className="px-3 py-2">Away</th>
              </tr>
            </thead>
            <tbody>
              {summary.quarterBreakdown.length ? (
                summary.quarterBreakdown.map((quarter) => (
                  <tr key={quarter.quarter} className="border-b border-white/5 text-slate-200">
                    <td className="px-3 py-2">Q{quarter.quarter}</td>
                    <td className="px-3 py-2">
                      {quarter.homeGoals}.{quarter.homeBehinds}
                    </td>
                    <td className="px-3 py-2">
                      {quarter.awayGoals}.{quarter.awayBehinds}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-slate-400" colSpan={3}>
                    No quarter scoring data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </section>
  )
}
