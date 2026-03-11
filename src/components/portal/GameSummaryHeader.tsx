import { Link } from 'react-router-dom'

type GameSummaryHeaderProps = {
  title: string
  dateLabel: string
  venue: string | null
  round: number | null
  status: string | null
  homeLogoUrl: string | null
  awayLogoUrl: string | null
  homeGoals: number
  homeBehinds: number
  awayGoals: number
  awayBehinds: number
  backHref: string
}

export default function GameSummaryHeader({
  title,
  dateLabel,
  venue,
  round,
  status,
  homeLogoUrl,
  awayLogoUrl,
  homeGoals,
  homeBehinds,
  awayGoals,
  awayBehinds,
  backHref,
}: GameSummaryHeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101A2A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {dateLabel}
            {venue ? ` • ${venue}` : ''}
            {round != null ? ` • Round ${round}` : ''}
            {status ? ` • ${status}` : ''}
          </p>
        </div>

        <Link to={backHref} className="btn btn-secondary">
          Back to Games
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/15 bg-[#0D1525]">
            {homeLogoUrl ? <img src={homeLogoUrl} alt="Home" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="text-2xl font-semibold text-white">{homeGoals}.{homeBehinds}</div>
        </div>

        <div className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">VS</div>

        <div className="flex items-center justify-end gap-3">
          <div className="text-2xl font-semibold text-white">{awayGoals}.{awayBehinds}</div>
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/15 bg-[#0D1525]">
            {awayLogoUrl ? <img src={awayLogoUrl} alt="Away" className="h-full w-full object-cover" /> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
