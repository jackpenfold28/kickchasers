import { useEffect, useMemo, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import LeaderboardTable from '@/components/portal/LeaderboardTable'
import {
  getLeaderboard,
  listClubOptions,
  listLeagueOptions,
  listSeasonYears,
  listStateOptions,
  STAT_OPTIONS,
  type LeaderboardFilters,
  type LeaderboardRow,
} from '@/lib/portal-stats'

const AGE_OPTIONS = ['Any', 'U10', 'U12', 'U14', 'U16', 'U18', '18+', '30+'] as const

function statLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export default function StatsPage() {
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingRows, setLoadingRows] = useState(true)
  const [rows, setRows] = useState<LeaderboardRow[]>([])

  const [seasonYears, setSeasonYears] = useState<number[]>([])
  const [states, setStates] = useState<Array<{ code: string; name: string | null }>>([])
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string | null; stateCode: string | null }>>([])
  const [clubs, setClubs] = useState<Array<{ id: string; name: string | null; leagueId: string | null }>>([])

  const [filters, setFilters] = useState<LeaderboardFilters>({
    seasonYear: new Date().getFullYear(),
    stateCode: null,
    leagueId: null,
    clubId: null,
    ageRange: 'Any',
    statKey: 'disposals',
  })

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [years, stateRows] = await Promise.all([listSeasonYears(), listStateOptions()])
        if (cancelled) return

        setSeasonYears(years)
        setStates(stateRows)
        setFilters((prev) => ({ ...prev, seasonYear: years[0] ?? prev.seasonYear }))
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load stat filters.')
      } finally {
        if (!cancelled) setLoadingFilters(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const rows = await listLeagueOptions(filters.stateCode)
        if (!cancelled) {
          setLeagues(rows)
          if (filters.leagueId && !rows.some((row) => row.id === filters.leagueId)) {
            setFilters((prev) => ({ ...prev, leagueId: null, clubId: null }))
          }
        }
      } catch {
        if (!cancelled) setLeagues([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters.stateCode, filters.leagueId])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const rows = await listClubOptions(filters.leagueId)
        if (!cancelled) {
          setClubs(rows)
          if (filters.clubId && !rows.some((row) => row.id === filters.clubId)) {
            setFilters((prev) => ({ ...prev, clubId: null }))
          }
        }
      } catch {
        if (!cancelled) setClubs([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters.leagueId, filters.clubId])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoadingRows(true)
      try {
        const data = await getLeaderboard(filters)
        if (!cancelled) {
          setRows(data)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard.')
          setRows([])
        }
      } finally {
        if (!cancelled) setLoadingRows(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters])

  const topPerformer = useMemo(() => rows[0] ?? null, [rows])

  if (loadingFilters) {
    return <main className="min-h-screen p-6 app-bg">Loading stats filters…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <h2 className="text-2xl font-semibold text-white">Leaderboards</h2>
        <p className="mt-1 text-sm text-slate-400">Filter by season, location, age group, and stat category.</p>
      </PortalCard>

      <PortalCard title="Filters">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select className="input" value={filters.seasonYear} onChange={(event) => setFilters((prev) => ({ ...prev, seasonYear: Number(event.target.value) }))}>
            {seasonYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select className="input" value={filters.stateCode || ''} onChange={(event) => setFilters((prev) => ({ ...prev, stateCode: event.target.value || null, leagueId: null, clubId: null }))}>
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name || state.code}
              </option>
            ))}
          </select>

          <select className="input" value={filters.leagueId || ''} onChange={(event) => setFilters((prev) => ({ ...prev, leagueId: event.target.value || null, clubId: null }))}>
            <option value="">All Leagues</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name || league.id}
              </option>
            ))}
          </select>

          <select className="input" value={filters.clubId || ''} onChange={(event) => setFilters((prev) => ({ ...prev, clubId: event.target.value || null }))}>
            <option value="">All Clubs</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name || club.id}
              </option>
            ))}
          </select>

          <select className="input" value={filters.ageRange} onChange={(event) => setFilters((prev) => ({ ...prev, ageRange: event.target.value as any }))}>
            {AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>

          <select className="input" value={filters.statKey} onChange={(event) => setFilters((prev) => ({ ...prev, statKey: event.target.value as any }))}>
            {STAT_OPTIONS.map((stat) => (
              <option key={stat} value={stat}>
                {statLabel(stat)}
              </option>
            ))}
          </select>
        </div>
      </PortalCard>

      {topPerformer && (
        <PortalCard title="Top Performer" subtitle={`#1 by ${statLabel(filters.statKey)}`}>
          <p className="text-xl font-semibold text-white">{topPerformer.playerName}</p>
          <p className="mt-1 text-sm text-slate-400">
            {topPerformer.clubName || 'No club'} • {topPerformer.leagueName || 'No league'}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[#A6FFCE]">{topPerformer.statValue}</p>
        </PortalCard>
      )}

      {error && (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      <PortalCard title="Leaderboard" subtitle="Desktop table view with rank, identity, and stat output">
        {loadingRows ? (
          <p className="text-sm text-slate-400">Loading leaderboard…</p>
        ) : (
          <LeaderboardTable rows={rows} statLabel={statLabel(filters.statKey)} />
        )}
      </PortalCard>
    </section>
  )
}
