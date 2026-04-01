import DataTable from '@/components/portal/DataTable'
import type { LeaderboardRow } from '@/lib/portal-stats'

type LeaderboardTableProps = {
  rows: LeaderboardRow[]
  statLabel: string
}

export default function LeaderboardTable({ rows, statLabel }: LeaderboardTableProps) {
  return (
    <DataTable
      rows={rows}
      getRowKey={(row) => row.userId}
      emptyLabel="No leaderboard data for current filters."
      mobileCardRender={(row) => (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{row.playerName}</p>
              <p className="text-xs text-slate-500">{row.handle || '-'}</p>
            </div>
            <span className="rounded-full border border-[#39FF88]/30 bg-[#39FF88]/10 px-2.5 py-1 text-xs font-semibold text-[#A6FFCE]">
              #{row.rank}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Club</p>
              <p className="mt-1 text-slate-200">{row.clubName || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">League</p>
              <p className="mt-1 text-slate-200">{row.leagueName || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Games</p>
              <p className="mt-1 text-slate-200">{row.games}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{statLabel}</p>
              <p className="mt-1 font-semibold text-[#A6FFCE]">{row.statValue}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Disposals: {row.secondaryDisposals}</p>
        </div>
      )}
      columns={[
        { key: 'rank', label: '#', render: (row) => <span className="font-semibold text-white">{row.rank}</span> },
        {
          key: 'player',
          label: 'Player',
          render: (row) => (
            <div>
              <p className="font-medium text-white">{row.playerName}</p>
              <p className="text-xs text-slate-500">{row.handle || '-'}</p>
            </div>
          ),
        },
        { key: 'club', label: 'Club', render: (row) => row.clubName || '-' },
        { key: 'league', label: 'League', render: (row) => row.leagueName || '-' },
        { key: 'games', label: 'Games', render: (row) => row.games },
        { key: 'value', label: statLabel, render: (row) => <span className="font-semibold text-[#A6FFCE]">{row.statValue}</span> },
        { key: 'd', label: 'Disposals', render: (row) => row.secondaryDisposals },
      ]}
    />
  )
}
