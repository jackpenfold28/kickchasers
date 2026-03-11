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
