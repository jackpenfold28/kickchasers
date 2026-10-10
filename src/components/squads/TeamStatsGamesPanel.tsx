import { RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import MatchScoreCard from '@/components/dashboard/MatchScoreCard'
import { buildTeamStatsGameRoute } from '@/lib/canonical/team-stats-games'
import { useTeamStatsGames } from '@/hooks/useTeamStatsGames'

function formatDate(value: string | null) {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBD'
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TeamStatsGamesPanel({ squadId, viewerUserId }: { squadId: string; viewerUserId: string }) {
  const state = useTeamStatsGames(squadId, viewerUserId)

  if (state.status === 'loading') {
    return <PortalCard className="teams-section-card"><p className="text-sm text-slate-300">Loading Team Stats Games…</p></PortalCard>
  }

  if (state.status === 'error') {
    return (
      <PortalCard className="teams-section-card">
        <p className="text-sm font-semibold text-red-300">Team Stats Games could not be loaded.</p>
        <p className="mt-1 text-sm text-slate-400">{state.error}</p>
        <button type="button" className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15" onClick={() => void state.refresh()}>Try again</button>
      </PortalCard>
    )
  }

  if (state.snapshot.access === 'unauthorized') {
    return (
      <PortalCard className="teams-section-card">
        <p className="text-sm font-semibold text-white">Coaches access required</p>
        <p className="mt-1 text-sm text-slate-400">Only the roles authorised for this team can view its Team Stats Games.</p>
      </PortalCard>
    )
  }

  const { games, squadName, squadLogoUrl, primaryColorHex } = state.snapshot
  return (
    <section className="space-y-4" aria-labelledby="team-stats-games-heading">
      <PortalCard className="teams-section-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="teams-kicker">Coaches</p>
            <h3 id="team-stats-games-heading" className="mt-1 text-xl font-black text-white">Team Stats Games</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Live and completed playerless team tracking sessions for this squad.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/12" onClick={() => void state.refresh()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </PortalCard>

      {games.length === 0 ? (
        <PortalCard className="teams-section-card">
          <p className="text-sm font-semibold text-white">No Team Stats Games yet</p>
          <p className="mt-1 text-sm text-slate-400">When a Team Stats Game is created in the supported mobile workflow, it will appear here.</p>
        </PortalCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {games.map((game) => {
            const homePoints = game.homeGoals == null || game.homeBehinds == null ? null : game.homeGoals * 6 + game.homeBehinds
            const awayPoints = game.awayGoals == null || game.awayBehinds == null ? null : game.awayGoals * 6 + game.awayBehinds
            const squadIsHome = game.squadSide === 'home'
            const opponentName = game.opponent || 'Opponent TBD'
            return (
              <Link key={game.id} to={buildTeamStatsGameRoute(game.id)} className="group rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88]" aria-label={`Open ${game.status} Team Stats Game against ${opponentName}`}>
                <article className="h-full rounded-[28px] border border-white/10 bg-[#0b1423] p-3 transition group-hover:-translate-y-0.5 group-hover:border-[#39FF88]/35">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      <span className={game.status === 'Live' ? 'text-[#39FF88]' : 'text-slate-300'}>{game.status}</span>
                      {game.status === 'Live' && game.activeQuarter ? <span>Q{game.activeQuarter}</span> : null}
                    </div>
                    <span className="text-xs text-slate-400">{game.round ? `Round ${game.round} • ` : ''}{formatDate(game.date)}</span>
                  </div>
                  <MatchScoreCard
                    variant="compact"
                    surface="tinted"
                    status={game.status}
                    dateLabel={formatDate(game.date)}
                    homeTint={squadIsHome ? primaryColorHex : null}
                    awayTint={squadIsHome ? null : primaryColorHex}
                    homeTeam={{ name: squadIsHome ? squadName || 'Team' : opponentName, logoUrl: squadIsHome ? squadLogoUrl : game.opponentLogoUrl }}
                    awayTeam={{ name: squadIsHome ? opponentName : squadName || 'Team', logoUrl: squadIsHome ? game.opponentLogoUrl : squadLogoUrl }}
                    homeScore={homePoints}
                    awayScore={awayPoints}
                    homeBreakdown={game.homeGoals == null ? null : `${game.homeGoals}.${game.homeBehinds}`}
                    awayBreakdown={game.awayGoals == null ? null : `${game.awayGoals}.${game.awayBehinds}`}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3 px-1 text-xs text-slate-500">
                    <span>{game.venue || 'Venue TBD'}</span><span>View team summary →</span>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
