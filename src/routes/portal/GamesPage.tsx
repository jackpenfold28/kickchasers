import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import DataTable from '@/components/portal/DataTable'
import { listUserGames, type GameLogRow } from '@/lib/portal-games'
import { supabase } from '@/lib/supabase'

function statusLabel(status: string | null) {
  const lower = (status || '').toLowerCase()
  if (lower === 'complete') return 'Final'
  if (lower === 'in_progress') return 'Live'
  if (lower === 'scheduled') return 'Scheduled'
  return status || 'Unknown'
}

export default function GamesPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<GameLogRow[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'complete'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const list = await listUserGames(user.id)
        if (!cancelled) setRows(list)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load games.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'all' && (row.status || '').toLowerCase() !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        (row.opponent || '').toLowerCase().includes(q) ||
        (row.squadName || '').toLowerCase().includes(q) ||
        (row.venue || '').toLowerCase().includes(q)
      )
    })
  }, [query, rows, statusFilter])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading game log…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <h2 className="text-2xl font-semibold text-white">Game Log</h2>
        <p className="mt-1 text-sm text-slate-400">
          Review tracked and manual games, then open full match summaries.
        </p>
      </PortalCard>

      <PortalCard title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search squad, opponent, venue" />
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">Live</option>
            <option value="complete">Final</option>
          </select>
          <div className="flex items-center text-xs text-slate-400">{filtered.length} games</div>
        </div>
      </PortalCard>

      {error && (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      <PortalCard title="Games" subtitle="Recent games first">
        <DataTable
          rows={filtered}
          getRowKey={(row) => `${row.id}:${row.manualId || 'tracked'}`}
          emptyLabel="No games found for the current filters."
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (row) => (row.date ? new Date(row.date).toLocaleDateString() : '-'),
            },
            {
              key: 'matchup',
              label: 'Matchup',
              render: (row) => (
                <div>
                  <p className="font-medium text-white">{row.squadName || 'My Squad'} vs {row.opponent || 'Opponent'}</p>
                  <p className="text-xs text-slate-500">{row.venue || 'Venue TBC'}</p>
                </div>
              ),
            },
            {
              key: 'score',
              label: 'Score',
              render: (row) =>
                row.scoreHomeGoals != null
                  ? `${row.scoreHomeGoals}.${row.scoreHomeBehinds} - ${row.scoreAwayGoals}.${row.scoreAwayBehinds}`
                  : '-',
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">{statusLabel(row.status)}</span>
              ),
            },
            {
              key: 'action',
              label: 'Action',
              render: (row) => (
                <Link
                  className="btn btn-secondary px-3 py-1.5 text-xs"
                  to={row.isManual && row.manualId ? `/games/manual/${row.manualId}` : `/games/${row.id}`}
                >
                  View Summary
                </Link>
              ),
            },
          ]}
        />
      </PortalCard>
    </section>
  )
}
