import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import {
  ADVANCED_SUMMARY_COLUMNS,
  buildAvailableScopes,
  buildPlayerSummaryRows,
  computeScoreBySide,
  formatScopeLabel,
  type PlayerSummaryRow,
  type SummaryScope,
} from '@/lib/portal-game-summary'
import { getGameSummary, type GameSummary } from '@/lib/portal-games'
import { isFinalGameStatus, trackedSummaryPollInterval } from '@/lib/canonical/games-parity-contract'
import { formatRoundLabel } from '@/lib/round-label'

export default function PlayerGameSummaryPage() {
  const { gameId, playerId } = useParams<{ gameId: string; playerId: string }>()
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<SummaryScope>('total')
  const inFlight = useRef(false)

  const load = useCallback(async () => {
    if (!gameId || inFlight.current) return
    inFlight.current = true
    try {
      setSummary(await getGameSummary(gameId))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load player summary.')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const intervalMs = trackedSummaryPollInterval(summary?.status, document.visibilityState === 'visible')
    if (!intervalMs) return undefined
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, intervalMs)
    return () => window.clearInterval(interval)
  }, [load, summary?.status])
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && !isFinalGameStatus(summary?.status)) void load()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [load, summary?.status])

  const availableScopes = useMemo(() => buildAvailableScopes(summary?.events ?? []), [summary?.events])
  const player = summary?.players.find((candidate) => candidate.id === playerId) ?? null
  const effectiveScope = availableScopes.includes(scope) ? scope : 'total'
  const row: PlayerSummaryRow | null = summary && player
    ? buildPlayerSummaryRows(summary.events, summary.players, {
        teamSide: player.teamSide,
        scope: effectiveScope,
        benchmarkContext: {
          quarterLengthMinutes: summary.quarterLength,
          gradeId: summary.gradeId,
          gameDate: summary.date,
        },
      }).find((candidate) => candidate.playerId === player.id) ?? null
    : null

  if (loading) return <main className="min-h-screen p-6 app-bg">Loading player summary…</main>
  if (error) return <PortalCard><p className="text-sm text-red-300">{error}</p></PortalCard>
  if (!summary || !player || !row) {
    return <PortalCard><p className="text-sm text-red-300">Player summary not found or you do not have access.</p></PortalCard>
  }

  const score = computeScoreBySide(summary.events)
  const homeName = summary.homeTeamName || summary.squadName || 'Home'
  const awayName = summary.awayTeamName || summary.opponent || 'Away'

  return (
    <section className="grid gap-5 pb-10">
      <PortalCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to={`/games/${summary.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#39FF88]">← Match summary</Link>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-500">{player.teamSide} • #{player.number ?? '—'} • {player.position || 'Position not recorded'}</p>
            <h1 className="mt-2 text-3xl font-black italic text-white">{player.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{homeName} {score.home.points}–{score.away.points} {awayName} • {formatRoundLabel(summary.round, 'Round TBD')}</p>
          </div>
          <div className="rounded-2xl border border-[#39FF88]/20 bg-[#39FF88]/10 px-5 py-4 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-[#B8FFD5]">Impact 7</p>
            <p className="mt-1 text-3xl font-black text-white">{row.impact7.toFixed(1)}</p>
            <p className="text-xs text-slate-300">{row.impactBand}</p>
          </div>
        </div>
      </PortalCard>

      <div className="flex flex-wrap gap-2">
        {availableScopes.map((option) => (
          <button key={String(option)} type="button" onClick={() => setScope(option)} className={option === effectiveScope ? 'btn btn-primary' : 'btn btn-secondary'}>
            {formatScopeLabel(option)}
          </button>
        ))}
      </div>

      <PortalCard title={`${formatScopeLabel(effectiveScope)} player totals`} subtitle="Canonical tracked-event totals and mobile benchmark semantics">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ADVANCED_SUMMARY_COLUMNS.map((stat) => {
            const value = stat.key === 'GB' ? `${row.stats.G}.${row.stats.B}` : row.stats[stat.key]
            return <div key={stat.key} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-slate-400">{stat.label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>
          })}
        </div>
      </PortalCard>

      {Object.keys(row.customStats).length ? (
        <PortalCard title="Custom stats" subtitle="Counters captured with this player’s exact game-player identity">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(row.customStats).map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value}</p></div>)}
          </div>
        </PortalCard>
      ) : null}
    </section>
  )
}
