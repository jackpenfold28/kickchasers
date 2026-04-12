import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MatchScoreCard from '@/components/dashboard/MatchScoreCard'
import { getGameSummary, type GameSummary } from '@/lib/portal-games'
import { formatRoundLabel } from '@/lib/round-label'

function formatDateLabel(value: string | null) {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBD'
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatStatus(value: string | null) {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'live') return 'Live'
  if (['final', 'finished', 'complete', 'completed'].includes(normalized ?? '')) return 'Final'
  return 'Scheduled'
}

export default function PublicGamePage() {
  const { gameId } = useParams()
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!gameId) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const next = await getGameSummary(gameId)
        if (!cancelled) setSummary(next)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [gameId])

  if (loading) {
    return <main className="min-h-screen bg-[#070F1E] px-4 py-10 text-slate-100">Loading game…</main>
  }

  if (!summary) {
    return (
      <main className="min-h-screen bg-[#070F1E] px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">KickChasers</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">Game not found</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            This shared game could not be loaded.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-slate-950"
            >
              Go to KickChasers
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const homeName = summary.homeTeamName || summary.squadName || 'Home'
  const awayName = summary.awayTeamName || summary.opponent || 'Away'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.16),transparent_24%),linear-gradient(180deg,#040811_0%,#09111C_48%,#060B14_100%)] px-4 py-8 text-slate-100">
      <div className="mx-auto grid max-w-5xl gap-6">
        <div className="rounded-[32px] border border-white/10 bg-[#0A1220]/88 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">Shared Match</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
            {homeName} {summary.scoreHomeGoals * 6 + summary.scoreHomeBehinds} - {summary.scoreAwayGoals * 6 + summary.scoreAwayBehinds} {awayName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {summary.gradeLabel || 'KickChasers'} • {formatRoundLabel(summary.round, 'Match Day')} • {formatDateLabel(summary.date)} • {summary.venue || 'Venue TBC'}
          </p>
        </div>

        <MatchScoreCard
          variant="hero"
          status={formatStatus(summary.status)}
          dateLabel={formatDateLabel(summary.date)}
          roundLabel={formatRoundLabel(summary.round, 'Match Day')}
          venueLabel={summary.venue || 'Venue TBC'}
          competitionLabel={summary.gradeLabel || 'KickChasers'}
          homeTint={summary.homePrimaryColorHex}
          awayTint={summary.awayPrimaryColorHex}
          homeTeam={{ name: homeName, logoUrl: summary.squadLogoUrl }}
          awayTeam={{ name: awayName, logoUrl: summary.opponentLogoUrl }}
          homeScore={summary.scoreHomeGoals * 6 + summary.scoreHomeBehinds}
          awayScore={summary.scoreAwayGoals * 6 + summary.scoreAwayBehinds}
          homeBreakdown={`${summary.scoreHomeGoals}.${summary.scoreHomeBehinds}`}
          awayBreakdown={`${summary.scoreAwayGoals}.${summary.scoreAwayBehinds}`}
        />

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-6 text-slate-300 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          Open this match inside KickChasers to view full team and player summary detail.
          <div className="mt-5">
            <Link
              to={`/games/${summary.id}`}
              className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-slate-950"
            >
              Open in KickChasers
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
