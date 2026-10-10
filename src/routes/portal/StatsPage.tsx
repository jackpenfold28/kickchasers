import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  getLeaderboardPlayers,
  isLeaderboardStatValueAllowed,
  listClubOptions,
  listClubTints,
  listLeagueOptions,
  listStateOptions,
  type LeaderboardPlayer,
  type LeaderboardRangeMode,
  type LeaderboardStatKey,
} from '@/lib/portal-stats'
import {
  ALL_LEADERBOARD_STAT_KEYS,
  EMPTY_LEADERBOARD_FILTERS,
  LEADERBOARD_AGE_RANGES,
  LEADERBOARD_STAT_LABELS,
  filterLeaderboardPlayers,
  getLeaderboardFilterAvailability,
  rankLeaderboardItems,
  reconcileLeaderboardFilters,
  selectLeaderboardLeague,
  selectLeaderboardState,
  type CanonicalLeaderboardFilters,
} from '@/lib/canonical/leaderboard-filters'

const FEATURED_CARDS: Array<{ key: LeaderboardStatKey; title: string; subtitle: string }> = [
  { key: 'disposals', title: 'Top Disposals', subtitle: 'This Week' },
  { key: 'fantasy_points', title: 'Top Fantasy', subtitle: 'This Week' },
  { key: 'goals', title: 'Top Goals', subtitle: 'This Week' },
]

type ActiveTab = 'featured' | 'all'

type FilterState = CanonicalLeaderboardFilters

type RankedRow = {
  player: LeaderboardPlayer
  total: number
}

function initialsFromName(value: string | null | undefined) {
  if (!value) return '?'
  const parts = value.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase() || '?'
}

function addOpacity(hex: string | null | undefined, opacity: number) {
  if (!hex) return `rgba(57,255,136,${opacity})`
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return `rgba(57,255,136,${opacity})`
  const r = Number.parseInt(cleaned.slice(0, 2), 16)
  const g = Number.parseInt(cleaned.slice(2, 4), 16)
  const b = Number.parseInt(cleaned.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function buildRankedRows(
  players: LeaderboardPlayer[],
  statKey: LeaderboardStatKey,
  options: { applyStatCaps?: boolean } = {},
) {
  return rankLeaderboardItems(players, (player) => player.stats[statKey])
    .filter(({ value }) => !options.applyStatCaps || isLeaderboardStatValueAllowed(statKey, value))
    .map(({ item: player, value: total }) => ({ player, total }))
}

function formatFilterSummary(filters: FilterState, states: Array<{ code: string; name: string | null }>, leagues: Array<{ id: string; name: string | null }>, clubs: Array<{ id: string; name: string | null }>) {
  const parts: string[] = []
  if (filters.stateCode) {
    const state = states.find((item) => item.code === filters.stateCode)
    parts.push(state?.name || filters.stateCode)
  }
  if (filters.leagueId) {
    const league = leagues.find((item) => item.id === filters.leagueId)
    parts.push(league?.name || 'League')
  }
  if (filters.clubId) {
    const club = clubs.find((item) => item.id === filters.clubId)
    parts.push(club?.name || 'Club')
  }
  if (filters.ageRange && filters.ageRange !== 'Any') {
    parts.push(filters.ageRange)
  }
  return parts.length ? parts.join(' · ') : 'Any'
}

function SegmentedSwitch({
  value,
  onChange,
}: {
  value: ActiveTab
  onChange: (value: ActiveTab) => void
}) {
  return (
    <div className="inline-flex w-full max-w-[360px] rounded-[18px] border border-white/8 bg-[#0A1220] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {([
        { key: 'featured', label: 'Featured' },
        { key: 'all', label: 'All Leaders' },
      ] as const).map((item) => {
        const active = item.key === value
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={clsx(
              'min-h-[42px] flex-1 rounded-[14px] px-4 text-sm font-black uppercase tracking-[0.16em] transition',
              active
                ? 'bg-[#39FF88] text-[#07111F] shadow-[0_10px_24px_rgba(57,255,136,0.24)]'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function FilterChipRow({
  label,
  items,
}: {
  label: string
  items: Array<{ key: string; label: string; active: boolean; onClick: () => void }>
}) {
  if (!items.length) return null

  return (
    <div className="grid gap-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">{label}</p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={clsx(
              'whitespace-nowrap rounded-[12px] px-3 py-2 text-xs font-bold tracking-[0.08em] transition',
              item.active
                ? 'bg-[#39FF88] text-[#07111F]'
                : 'bg-[#0D1526] text-slate-400 hover:bg-[#111C31] hover:text-white'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function LeaderboardListRow({
  row,
  index,
  compact = false,
  highlightLeader = false,
}: {
  row: RankedRow
  index: number
  compact?: boolean
  highlightLeader?: boolean
}) {
  const isLeader = highlightLeader && index === 0
  const clubLabel = row.player.clubName || 'Profile verified'
  const leagueLabel = row.player.leagueName || ' '

  return (
    <div
      className={clsx(
        'grid items-center gap-3 border-b border-white/[0.03] px-4',
        isLeader
          ? 'grid-cols-[40px_56px_minmax(0,1fr)_76px] sm:grid-cols-[46px_76px_minmax(0,1fr)_112px]'
          : 'grid-cols-[34px_40px_minmax(0,1fr)_56px] sm:grid-cols-[42px_46px_minmax(0,1fr)_72px]',
        compact ? 'py-3' : 'py-3.5',
        isLeader && 'bg-[linear-gradient(90deg,rgba(242,213,140,0.08),transparent_42%)]'
      )}
    >
      <div
          className={clsx(
            'text-center text-[24px] font-black italic leading-none tracking-[-0.06em] text-white sm:text-[30px]',
            compact && 'text-[22px] sm:text-[26px]',
            isLeader && 'text-[#F2D58C]'
          )}
      >
        {index + 1}
      </div>

      <div
        className={clsx(
          'flex h-11 w-11 items-center justify-center overflow-hidden rounded-[12px] bg-[#0D1526]',
          isLeader && 'h-[56px] w-[56px] rounded-[18px] sm:h-[72px] sm:w-[72px] sm:rounded-[20px]'
        )}
      >
        {row.player.avatarUrl ? (
          <img src={row.player.avatarUrl} alt={row.player.playerName} className="h-full w-full object-cover" />
        ) : (
          <span className={clsx('text-xs font-black text-white', isLeader && 'text-sm')}>
            {initialsFromName(row.player.playerName)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p
          className={clsx(
            'truncate text-sm font-black uppercase italic tracking-[0.03em] text-white',
            compact && 'text-[13px]',
            isLeader &&
              'bg-[linear-gradient(180deg,#FFF6D2_0%,#F2D58C_42%,#C79A32_100%)] bg-clip-text text-[16px] text-transparent sm:text-[20px]'
          )}
        >
          {row.player.playerName}
        </p>
        <div className="mt-1 grid gap-0.5">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {clubLabel}
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
            {leagueLabel}
          </p>
        </div>
      </div>

      <div className={clsx('text-right', isLeader && 'pr-5')}>
        <p
          className={clsx(
            'text-[24px] font-black italic leading-none tracking-[-0.06em] text-white sm:text-[32px]',
            compact && 'text-[22px] sm:text-[26px]',
            isLeader &&
              'bg-[linear-gradient(180deg,#FFF6D2_0%,#F2D58C_42%,#C79A32_100%)] bg-clip-text pr-1 text-[30px] text-transparent sm:text-[40px]'
          )}
        >
          {row.total}
        </p>
      </div>
    </div>
  )
}

function FeaturedCard({
  title,
  subtitle,
  rows,
  tint,
}: {
  title: string
  subtitle: string
  rows: RankedRow[]
  tint: string | null
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[30px] bg-[#0D1625] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${addOpacity(tint, 0.4)} 0%, ${addOpacity(tint, 0.18)} 38%, rgba(6,11,19,0.96) 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,14,0.2),rgba(3,7,14,0.72))]" />
      <div className="relative">
        <header className="px-5 pb-3 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{subtitle}</p>
          <h2 className="mt-2 text-xl font-black italic tracking-[-0.04em] text-white">{title}</h2>
        </header>

        {rows.length ? (
          <div>
            {rows.map((row, index) => (
              <LeaderboardListRow
                key={`${row.player.userId}-${index}`}
                row={row}
                index={index}
                compact
                highlightLeader
              />
            ))}
          </div>
        ) : (
          <div className="px-5 pb-5 text-sm text-slate-300">No leaders yet for this category.</div>
        )}
      </div>
    </section>
  )
}

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('featured')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedStat, setSelectedStat] = useState<LeaderboardStatKey>('disposals')
  const [rangeMode, setRangeMode] = useState<LeaderboardRangeMode>('week')

  const [states, setStates] = useState<Array<{ code: string; name: string | null }>>([])
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string | null; stateCode: string | null }>>([])
  const [clubs, setClubs] = useState<Array<{ id: string; name: string | null; leagueId: string | null }>>([])

  const [filters, setFilters] = useState<FilterState>(EMPTY_LEADERBOARD_FILTERS)

  const [featuredPlayers, setFeaturedPlayers] = useState<LeaderboardPlayer[]>([])
  const [allPlayers, setAllPlayers] = useState<LeaderboardPlayer[]>([])
  const [featuredTints, setFeaturedTints] = useState<Map<string, string | null>>(new Map())

  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingAll, setLoadingAll] = useState(true)
  const [featuredError, setFeaturedError] = useState<string | null>(null)
  const [allError, setAllError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const stateRows = await listStateOptions()
        if (!cancelled) setStates(stateRows)
      } catch {
        if (!cancelled) setStates([])
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
        if (cancelled) return
        setLeagues(rows)
        if (filters.leagueId && !rows.some((row) => row.id === filters.leagueId)) {
          setFilters((prev) => ({ ...prev, leagueId: null, clubId: null }))
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
        if (cancelled) return
        setClubs(rows)
        if (filters.clubId && !rows.some((row) => row.id === filters.clubId)) {
          setFilters((prev) => ({ ...prev, clubId: null }))
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
      setLoadingFeatured(true)
      try {
        const players = await getLeaderboardPlayers(filters, 'week', 'player_game')
        if (!cancelled) {
          setFeaturedPlayers(players)
          setFeaturedError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setFeaturedPlayers([])
          setFeaturedError(error instanceof Error ? error.message : 'Unable to load featured leaders.')
        }
      } finally {
        if (!cancelled) setLoadingFeatured(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoadingAll(true)
      try {
        const players = await getLeaderboardPlayers(EMPTY_LEADERBOARD_FILTERS, rangeMode)
        if (!cancelled) {
          setAllPlayers(players)
          setAllError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setAllPlayers([])
          setAllError(error instanceof Error ? error.message : 'Unable to load leaderboard.')
        }
      } finally {
        if (!cancelled) setLoadingAll(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [rangeMode])

  const featuredRowsByKey = useMemo(() => {
    return Object.fromEntries(
      FEATURED_CARDS.map((card) => [
        card.key,
        buildRankedRows(featuredPlayers, card.key, { applyStatCaps: true }).slice(0, 5),
      ])
    ) as Record<LeaderboardStatKey, RankedRow[]>
  }, [featuredPlayers])

  const featuredClubIds = useMemo(() => {
    return Array.from(
      new Set(
        FEATURED_CARDS.map((card) => featuredRowsByKey[card.key]?.[0]?.player.homeClubId ?? null).filter(
          (value): value is string => Boolean(value)
        )
      )
    )
  }, [featuredRowsByKey])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!featuredClubIds.length) {
        if (!cancelled) setFeaturedTints(new Map())
        return
      }

      try {
        const tintMap = await listClubTints(featuredClubIds)
        if (!cancelled) setFeaturedTints(tintMap)
      } catch {
        if (!cancelled) setFeaturedTints(new Map())
      }
    })()

    return () => {
      cancelled = true
    }
  }, [featuredClubIds])

  const baseRows = useMemo(() => buildRankedRows(allPlayers, selectedStat), [allPlayers, selectedStat])

  const filterAvailability = useMemo(
    () => getLeaderboardFilterAvailability(baseRows.map(({ player }) => player), filters),
    [baseRows, filters],
  )
  const availableStateCodes = filterAvailability.stateCodes
  const availableLeagueIds = filterAvailability.leagueIds
  const availableClubIds = filterAvailability.clubIds
  const availableAgeRanges = filterAvailability.ageRanges

  useEffect(() => {
    if (loadingAll) return
    setFilters((current) => reconcileLeaderboardFilters(current, filterAvailability))
  }, [filterAvailability, loadingAll])

  const allRows = useMemo(
    () => buildRankedRows(filterLeaderboardPlayers(allPlayers, filters), selectedStat),
    [allPlayers, filters, selectedStat],
  )

  const stateItems = useMemo(
    () => [
      { key: 'any', label: 'Any', active: !filters.stateCode, onClick: () => setFilters((prev) => selectLeaderboardState(prev, null)) },
      ...states.filter((state) => availableStateCodes.includes(state.code.toUpperCase())).map((state) => ({
        key: state.code,
        label: state.name || state.code,
        active: filters.stateCode === state.code.toUpperCase(),
        onClick: () => setFilters((prev) => selectLeaderboardState(prev, state.code)),
      })),
    ],
    [availableStateCodes, filters.stateCode, states]
  )

  const leagueItems = useMemo(
    () => [
      { key: 'any', label: 'Any', active: !filters.leagueId, onClick: () => setFilters((prev) => selectLeaderboardLeague(prev, null)) },
      ...leagues.filter((league) => availableLeagueIds.has(league.id)).map((league) => ({
        key: league.id,
        label: league.name || 'League',
        active: filters.leagueId === league.id,
        onClick: () => setFilters((prev) => selectLeaderboardLeague(prev, league.id)),
      })),
    ],
    [availableLeagueIds, filters.leagueId, leagues]
  )

  const clubItems = useMemo(
    () => [
      { key: 'any', label: 'Any', active: !filters.clubId, onClick: () => setFilters((prev) => ({ ...prev, clubId: null })) },
      ...clubs.filter((club) => availableClubIds.has(club.id)).map((club) => ({
        key: club.id,
        label: club.name || 'Club',
        active: filters.clubId === club.id,
        onClick: () => setFilters((prev) => ({ ...prev, clubId: club.id })),
      })),
    ],
    [availableClubIds, clubs, filters.clubId]
  )

  const ageItems = useMemo(
    () =>
      LEADERBOARD_AGE_RANGES.filter((age) => availableAgeRanges.includes(age)).map((age) => ({
        key: age,
        label: age,
        active: filters.ageRange === age,
        onClick: () => setFilters((prev) => ({ ...prev, ageRange: age })),
      })),
    [availableAgeRanges, filters.ageRange]
  )

  const filterSummary = useMemo(() => formatFilterSummary(filters, states, leagues, clubs), [clubs, filters, leagues, states])

  const isFeaturedEmpty = !loadingFeatured && !featuredError && FEATURED_CARDS.every((card) => !featuredRowsByKey[card.key]?.length)

  if (loadingFilters) {
    return <main className="min-h-screen p-6 app-bg">Loading leaderboards…</main>
  }

  return (
    <section className="grid gap-4 lg:gap-5">
      <header className="rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01)),#091321] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)] sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9CE8BE]">Stats</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-black italic tracking-[-0.05em] text-white sm:text-[32px]">Leaderboards</h1>
            <p className="mt-1 text-sm text-slate-400">
              Featured weekly leaders and the full public rankings, aligned closer to the mobile leaderboard flow.
            </p>
          </div>
          <SegmentedSwitch value={activeTab} onChange={setActiveTab} />
        </div>
      </header>

      <section className="rounded-[26px] bg-[#0D1625] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)] sm:px-5">
        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setFiltersExpanded((value) => !value)}
            className="inline-flex items-center gap-2 text-sm font-bold text-white"
          >
            <span>Filters</span>
            <span className="text-base text-slate-500">{filtersExpanded ? '▴' : '▾'}</span>
          </button>

          <p className="min-w-0 flex-1 truncate text-xs uppercase tracking-[0.18em] text-slate-500">{filterSummary}</p>

          <button
            type="button"
            onClick={() => setFilters({ stateCode: null, leagueId: null, clubId: null, ageRange: 'Any' })}
            className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300 hover:text-white"
          >
            Clear
          </button>
        </div>

        {filtersExpanded ? (
          <div className="mt-4 grid gap-4">
            <FilterChipRow label="State" items={stateItems} />
            <FilterChipRow label="League" items={leagueItems} />
            <FilterChipRow label="Club" items={clubItems} />
            <FilterChipRow label="Age" items={ageItems} />
          </div>
        ) : null}
      </section>

      {activeTab === 'featured' ? (
        <>
          {featuredError ? (
            <div className="rounded-[24px] bg-red-500/10 px-5 py-4 text-sm text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)]">{featuredError}</div>
          ) : loadingFeatured ? (
            <div className="rounded-[26px] bg-[#0D1625] px-5 py-8 text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)]">Loading weekly leaders…</div>
          ) : isFeaturedEmpty ? (
            <div className="rounded-[26px] bg-[#0D1625] px-5 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)]">
              <p className="text-base font-bold text-white">No leaders yet</p>
              <p className="mt-2 text-sm text-slate-400">Track games this week to unlock featured leader cards.</p>
            </div>
          ) : (
            <div className="grid gap-4 2xl:grid-cols-2">
              {FEATURED_CARDS.map((card) => {
                const topClubId = featuredRowsByKey[card.key]?.[0]?.player.homeClubId ?? null
                return (
                  <FeaturedCard
                    key={card.key}
                    title={card.title}
                    subtitle={card.subtitle}
                    rows={featuredRowsByKey[card.key] ?? []}
                    tint={topClubId ? featuredTints.get(topClubId) ?? '#39FF88' : '#39FF88'}
                  />
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {ALL_LEADERBOARD_STAT_KEYS.map((stat) => {
                const active = stat === selectedStat
                return (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => setSelectedStat(stat)}
                    className={clsx(
                      'min-h-[34px] whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-bold transition',
                      active
                        ? 'border-transparent bg-[#39FF88] text-[#07111F]'
                        : 'border-white/5 bg-[#0D1526] text-slate-400 hover:bg-[#111C31] hover:text-white'
                    )}
                  >
                    {LEADERBOARD_STAT_LABELS[stat]}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              {([
                { key: 'week', label: 'This week' },
                { key: 'season', label: 'Season' },
              ] as const).map((option) => {
                const active = option.key === rangeMode
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRangeMode(option.key)}
                    className={clsx(
                      'rounded-[12px] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition',
                      active
                        ? 'bg-[#39FF88] text-[#07111F]'
                        : 'bg-[#0D1526] text-slate-400 hover:bg-[#111C31] hover:text-white'
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {allError ? (
            <div className="rounded-[24px] bg-red-500/10 px-5 py-4 text-sm text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)]">{allError}</div>
          ) : (
            <section className="overflow-hidden rounded-[26px] bg-[#0D1625] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_36px_rgba(2,8,20,0.34)]">
              {loadingAll ? (
              <div className="px-5 py-8 text-sm text-slate-400">Loading leaders…</div>
              ) : allRows.length ? (
                allRows.map((row, index) => <LeaderboardListRow key={`${row.player.userId}-${index}`} row={row} index={index} />)
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-base font-bold text-white">No leaders found</p>
                  <p className="mt-2 text-sm text-slate-400">Try adjusting filters or changing the stat.</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  )
}
