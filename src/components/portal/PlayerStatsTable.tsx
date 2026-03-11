import { useMemo, useState } from 'react'
import DataTable from '@/components/portal/DataTable'
import type { PlayerSummaryStat } from '@/lib/portal-games'

type SortKey = 'name' | 'disposals' | 'kicks' | 'handballs' | 'marks' | 'tackles' | 'goals'

type PlayerStatsTableProps = {
  rows: PlayerSummaryStat[]
}

export default function PlayerStatsTable({ rows }: PlayerStatsTableProps) {
  const [sort, setSort] = useState<SortKey>('disposals')

  const sorted = useMemo(() => {
    const next = [...rows]
    next.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      return Number((b as any)[sort] ?? 0) - Number((a as any)[sort] ?? 0)
    })
    return next
  }, [rows, sort])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">Sort</span>
        {(['disposals', 'goals', 'kicks', 'handballs', 'marks', 'tackles', 'name'] as SortKey[]).map((key) => (
          <button
            key={key}
            className={`btn px-3 py-1 text-xs ${sort === key ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
            onClick={() => setSort(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <DataTable
        rows={sorted}
        getRowKey={(row) => row.playerId}
        emptyLabel="No player stats available for this game."
        columns={[
          {
            key: 'player',
            label: 'Player',
            render: (row) => (
              <div>
                <p className="font-medium text-white">{row.name}</p>
                <p className="text-xs text-slate-500">
                  {row.teamSide.toUpperCase()} {row.number != null ? `• #${row.number}` : ''}
                </p>
              </div>
            ),
          },
          { key: 'disp', label: 'D', render: (row) => row.disposals },
          { key: 'k', label: 'K', render: (row) => row.kicks },
          { key: 'hb', label: 'HB', render: (row) => row.handballs },
          { key: 'm', label: 'M', render: (row) => row.marks },
          { key: 't', label: 'T', render: (row) => row.tackles },
          { key: 'g', label: 'G', render: (row) => row.goals },
          { key: 'b', label: 'B', render: (row) => row.behinds },
        ]}
      />
    </div>
  )
}
