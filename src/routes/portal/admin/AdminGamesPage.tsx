import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import GameLogCard, { matchesStatusFilter } from '@/components/portal/games/GameLogCard'
import { listPlatformGames, type GameLogRow } from '@/lib/portal-games'
import { supabase } from '@/lib/supabase'
import { EmptyState, SectionHeading } from './admin-ui'

function parseSeasonYear(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  const year = parsed.getFullYear()
  return Number.isNaN(year) ? null : year
}

export default function AdminGamesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<GameLogRow[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'complete'>('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!data.user) {
          navigate('/sign-in', { replace: true })
          return
        }
        const next = await listPlatformGames(60)
        if (!cancelled) {
          setRows(next)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load tracked games.')
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
    return rows
      .filter((row) => matchesStatusFilter(row.status, statusFilter))
      .filter((row) => {
        if (!q) return true
        return (
          (row.opponent || '').toLowerCase().includes(q) ||
          (row.squadName || '').toLowerCase().includes(q) ||
          (row.venue || '').toLowerCase().includes(q)
        )
      })
  }, [query, rows, statusFilter])

  const sections = useMemo(() => {
    const groups = new Map<string, { title: string; sortKey: number; rows: GameLogRow[] }>()
    for (const row of filtered) {
      const season = parseSeasonYear(row.date)
      const key = season ? String(season) : 'unknown'
      const existing = groups.get(key)
      if (existing) {
        existing.rows.push(row)
      } else {
        groups.set(key, {
          title: season ? `${season} Season` : 'Unknown Season',
          sortKey: season ?? -1,
          rows: [row],
        })
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey)
  }, [filtered])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading tracked games…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Games"
          title="Tracked games"
          description="Platform-wide tracked and manual games, using the same KickChasers match-card presentation rather than admin tables."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search squad, opponent, venue"
            />
          </label>
          <select
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'scheduled' | 'in_progress' | 'complete')}
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">Live</option>
            <option value="complete">Final</option>
          </select>
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
            {filtered.length} game{filtered.length === 1 ? '' : 's'}
          </div>
        </div>
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <div className="grid gap-6">
        {sections.length ? (
          sections.map((section) => (
            <section key={section.title} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Season</p>
                  <h3 className="mt-1 text-xl font-black italic tracking-[-0.04em] text-white">{section.title}</h3>
                </div>
                <p className="text-sm text-slate-500">{section.rows.length} game{section.rows.length === 1 ? '' : 's'}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {section.rows.map((row) => (
                  <GameLogCard key={`${row.id}:${row.manualId || 'tracked'}`} row={row} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <PortalCard className="border-dashed bg-white/[0.03]">
            <EmptyState label="No tracked games found for the current filters." />
          </PortalCard>
        )}
      </div>
    </section>
  )
}
