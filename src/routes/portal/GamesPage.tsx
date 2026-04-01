import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { listUserGames, type GameLogRow } from '@/lib/portal-games'
import { supabase } from '@/lib/supabase'
import GameLogCard, { matchesStatusFilter } from '@/components/portal/games/GameLogCard'

function parseSeasonYear(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  const year = parsed.getFullYear()
  return Number.isNaN(year) ? null : year
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
    return rows
      .filter((row) => {
        if (!matchesStatusFilter(row.status, statusFilter)) {
          return false
        }
        if (!q) return true
        return (
          (row.opponent || '').toLowerCase().includes(q) ||
          (row.squadName || '').toLowerCase().includes(q) ||
          (row.venue || '').toLowerCase().includes(q)
        )
      })
      .sort((left, right) => {
        const leftTime = left.date ? new Date(left.date).getTime() : 0
        const rightTime = right.date ? new Date(right.date).getTime() : 0
        return rightTime - leftTime
      })
  }, [query, rows, statusFilter])

  const seasonSections = useMemo(() => {
    const groups = new Map<string, { title: string; rows: GameLogRow[]; sortKey: number }>()

    for (const row of filtered) {
      const season = parseSeasonYear(row.date)
      const key = season ? String(season) : 'unknown'
      const existing = groups.get(key)
      if (existing) {
        existing.rows.push(row)
        continue
      }
      groups.set(key, {
        title: season ? `${season} Season` : 'Unknown Season',
        rows: [row],
        sortKey: season ?? -1,
      })
    }

    return Array.from(groups.values()).sort((left, right) => right.sortKey - left.sortKey)
  }, [filtered])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading game log…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard className="overflow-hidden bg-[linear-gradient(180deg,rgba(16,26,42,0.96)_0%,rgba(9,16,28,0.98)_100%)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Game Log</p>
            <h2 className="mt-2 text-[1.8rem] font-black italic leading-none tracking-[-0.05em] text-white sm:text-[2rem]">
              Season Match Cards
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review tracked and manual games with compact match-day card parity and season grouping.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] xl:min-w-[640px] xl:max-w-[760px] xl:flex-1">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-white/20 focus-within:bg-white/[0.06]">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search squad, opponent, venue"
              />
            </label>

            <select
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none transition hover:bg-white/[0.06] focus:border-white/20 focus:bg-white/[0.06]"
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
        </div>
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <div className="grid gap-6">
        {seasonSections.length ? (
          seasonSections.map((section) => (
            <section key={section.title} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Season</p>
                  <h3 className="mt-1 text-xl font-black italic tracking-[-0.04em] text-white">{section.title}</h3>
                </div>
                <p className="text-sm text-slate-500">
                  {section.rows.length} game{section.rows.length === 1 ? '' : 's'}
                </p>
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
            <p className="text-sm text-slate-400">No games found for the current filters.</p>
          </PortalCard>
        )}
      </div>
    </section>
  )
}
