import PortalCard from '@/components/cards/PortalCard'
import type { TeamSummaryStat } from '@/lib/portal-games'

type TeamStatCardsProps = {
  stats: TeamSummaryStat[]
}

export default function TeamStatCards({ stats }: TeamStatCardsProps) {
  const home = stats.find((item) => item.teamSide === 'home')
  const away = stats.find((item) => item.teamSide === 'away')

  const rows = [
    { label: 'Disposals', home: home?.disposals ?? 0, away: away?.disposals ?? 0 },
    { label: 'Kicks', home: home?.kicks ?? 0, away: away?.kicks ?? 0 },
    { label: 'Handballs', home: home?.handballs ?? 0, away: away?.handballs ?? 0 },
    { label: 'Marks', home: home?.marks ?? 0, away: away?.marks ?? 0 },
    { label: 'Tackles', home: home?.tackles ?? 0, away: away?.tackles ?? 0 },
  ]

  return (
    <PortalCard title="Team Stats" subtitle="Home vs away totals">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">{row.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {row.home} <span className="text-slate-500">/</span> {row.away}
            </p>
          </div>
        ))}
      </div>
    </PortalCard>
  )
}
