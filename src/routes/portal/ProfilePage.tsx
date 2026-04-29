import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  Dumbbell,
  Edit,
  Flashlight,
  MoreVertical,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  ACCENT,
  STAR_COLOR,
  STAT_GROUPS,
  benchmarkBand,
  computeScopeStats,
  formatRoundShortLabel,
  gameRatingScore,
  includeByTrialFilter,
  loadProfileDataset,
  parseSeasonYear,
  setProfileFollowing,
  type ProfileDataset,
  type ProfileGame,
  type ProfileIdentity,
  type StatScope,
  type TotalsWithDerived,
} from '@/lib/portal-profile'
import { supabase } from '@/lib/supabase'

type PerformanceTab = 'allStats' | 'allGames' | 'awards' | 'posts'
type MatchSort = 'round' | 'opponent' | 'disposals' | 'goals' | 'af' | 'rating'

const QUICK_STATS: { key: keyof TotalsWithDerived; label: string }[] = [
  { key: 'disposals', label: 'Disposals' },
  { key: 'kicks', label: 'Kicks' },
  { key: 'handballs', label: 'Handballs' },
  { key: 'marks', label: 'Marks' },
  { key: 'tackles', label: 'Tackles' },
  { key: 'fantasy', label: 'AF Points' },
]

const bandColors: Record<string, string> = {
  Elite: '#39FF88',
  'Above Av': '#60A5FA',
  Average: '#F6C945',
  Rookie: '#94A3B8',
}

function formatHandle(handle: string | null | undefined) {
  const trimmed = handle?.trim()
  if (!trimmed) return null
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

function initialsFrom(name?: string | null, handle?: string | null) {
  const source = name?.trim() || handle?.trim() || 'KC'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function opponentInitials(name?: string | null) {
  return initialsFrom(name || 'Opponent')
}

function formatAverage(value: number | null | undefined, key?: keyof TotalsWithDerived, available = true) {
  if (!available || value == null || !Number.isFinite(value)) return '—'
  if (key === 'disposalEfficiency') return `${(value * 100).toFixed(1)}%`
  return value.toFixed(1)
}

function formatStatValue(game: ProfileGame, key: keyof TotalsWithDerived) {
  if (game.isTrackedOnly) return 'T'
  const available = game.statAvailability?.[key]
  if (available === false) return '—'
  const value = game.totals?.[key]
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return key === 'fantasy' || key === 'goals' || key === 'disposals' ? String(Math.round(Number(value))) : String(value)
}

function scopeLabel(scope: StatScope) {
  if (scope === 'last3') return 'Last 3'
  if (scope === 'season') return 'Season'
  return 'Career'
}

function refScope(scope: StatScope): StatScope {
  if (scope === 'last3') return 'season'
  if (scope === 'season') return 'last3'
  return 'season'
}

function IconAsset({ src, className }: { src: string; className?: string }) {
  return <img src={src} alt="" className={className ?? 'h-7 w-7'} />
}

function LoadingState() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center app-bg">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#39FF88]" />
        <p>Loading profile...</p>
      </div>
    </main>
  )
}

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="rounded-2xl bg-[#101A2A] px-4 py-8 text-center text-sm font-semibold text-slate-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      {children}
    </div>
  )
}

function ScopeToggle({ value, onChange }: { value: StatScope; onChange: (scope: StatScope) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-[#0A1220] p-1">
      {(['last3', 'season', 'career'] as const).map((scope) => (
        <button
          key={scope}
          onClick={() => onChange(scope)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            value === scope ? 'bg-[#39FF88] text-[#07111F]' : 'text-slate-400 hover:text-white'
          }`}
        >
          {scopeLabel(scope)}
        </button>
      ))}
    </div>
  )
}

function ProfileHero({
  identity,
  mode,
  viewerId,
  onFollowChanged,
}: {
  identity: ProfileIdentity
  mode: 'self' | 'public'
  viewerId: string | null
  onFollowChanged: (next: boolean) => void
}) {
  const [pending, setPending] = useState(false)
  const canFollow = mode === 'public' && viewerId && viewerId !== identity.userId
  const displayName = identity.name?.trim() || 'Kickchaser'
  const handle = formatHandle(identity.handle)

  async function toggleFollow() {
    if (!viewerId || viewerId === identity.userId || pending) return
    const next = !identity.isFollowing
    setPending(true)
    try {
      await setProfileFollowing(identity.userId, viewerId, next)
      onFollowChanged(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="relative">
      <div className="relative h-[300px] overflow-hidden rounded-none bg-[#0B1422] sm:h-[380px] lg:h-[430px]">
        {identity.actionPhotoUrl ? (
          <img src={identity.actionPhotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#17243A_0%,#0B1422_48%,#050A12_100%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,23,0.72)_0%,rgba(4,8,23,0.22)_40%,#080E1A_100%)]" />
      </div>

      <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-0 sm:px-4">
        <div className="rounded-2xl bg-[#101A2A] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative h-28 w-28 shrink-0 rounded-full bg-[#07111F] p-1 shadow-[0_16px_32px_rgba(0,0,0,0.42)]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0B1422]">
                {identity.avatarUrl ? (
                  <img src={identity.avatarUrl} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{initialsFrom(identity.name, identity.handle)}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#0B1422]">
                {identity.clubLogoUrl ? (
                  <img src={identity.clubLogoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Shield className="h-5 w-5 text-slate-500" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-black italic uppercase leading-none tracking-normal text-white sm:text-4xl">
                    {displayName}
                  </h1>
                  {handle ? <p className="mt-2 text-sm font-semibold text-slate-400">{handle}</p> : null}
                </div>
                {mode === 'self' ? (
                  <div className="flex flex-wrap gap-2">
                    <Link to="/onboarding?mode=edit" className="btn btn-secondary inline-flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit profile
                    </Link>
                    <Link to="/settings" className="btn btn-secondary">
                      Settings
                    </Link>
                  </div>
                ) : canFollow ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFollow}
                      disabled={pending}
                      className={`min-h-[40px] rounded-md px-4 text-sm font-black transition ${
                        identity.isFollowing ? 'bg-white/10 text-white' : 'bg-[#39FF88] text-[#07111F]'
                      } ${pending ? 'opacity-60' : ''}`}
                    >
                      {identity.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-slate-400">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-400">
                {identity.clubName ? <span>{identity.clubName}</span> : null}
                {identity.leagueName ? <span>{identity.leagueName}</span> : null}
                {identity.state ? <span>{identity.state}</span> : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-400">
                <span>{identity.followersCount != null ? identity.followersCount.toLocaleString() : '—'} followers</span>
                <span className="h-4 w-px bg-white/10" />
                <span>{identity.followingCount != null ? identity.followingCount.toLocaleString() : '—'} following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SeasonChips({ years, selectedYear, onSelect }: { years: number[]; selectedYear: number | null; onSelect: (year: number) => void }) {
  return (
    <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-0 py-4 sm:px-4">
      <p className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Seasons</p>
      <div className="flex gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onSelect(year)}
            className={`rounded-xl px-3 py-2 text-sm font-black transition ${
              selectedYear === year ? 'bg-[#39FF88] text-[#07111F]' : 'bg-[#101A2A] text-slate-400 hover:text-white'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  )
}

function SeasonTotals({ games, seasonYear }: { games: ProfileGame[]; seasonYear: number | null }) {
  const totals = games.reduce(
    (acc, game) => {
      acc.disposals += game.totals?.disposals ?? 0
      acc.goals += game.totals?.goals ?? 0
      acc.behinds += game.totals?.behinds ?? 0
      acc.games += game.totals ? 1 : 0
      return acc
    },
    { disposals: 0, goals: 0, behinds: 0, games: 0 }
  )

  return (
    <section className="rounded-2xl bg-[#101A2A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black italic uppercase text-white">Season Totals</h2>
        <span className="text-sm font-black text-slate-500">{seasonYear ?? '—'}</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/10">
        <div className="flex flex-col items-center gap-2 px-2">
          <IconAsset src="/assets/icons/afl/hb.svg" className="h-7 w-7" />
          <p className="text-3xl font-black italic text-white">{totals.disposals}</p>
          <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">Disposals</p>
        </div>
        <div className="flex flex-col items-center gap-2 px-2">
          <IconAsset src="/assets/icons/afl/posts2.svg" className="h-7 w-7" />
          <p className="text-3xl font-black italic text-white">
            {totals.goals}.{totals.behinds}
          </p>
          <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">Goals</p>
        </div>
        <div className="flex flex-col items-center gap-2 px-2">
          <IconAsset src="/assets/icons/afl/MCG.svg" className="h-7 w-7" />
          <p className="text-3xl font-black italic text-white">{totals.games}</p>
          <p className="text-center text-xs font-black uppercase tracking-wide text-slate-500">Games</p>
        </div>
      </div>
    </section>
  )
}

function Highlights({
  baseGames,
  includeTrials,
  setIncludeTrials,
  onOpenGame,
}: {
  baseGames: ProfileGame[]
  includeTrials: boolean
  setIncludeTrials: (value: boolean) => void
  onOpenGame: (game: ProfileGame) => void
}) {
  const configs = [
    { key: 'disposals', title: 'Most Disposals', icon: <Dumbbell className="h-5 w-5" color={ACCENT} />, getValue: (game: ProfileGame) => game.totals?.disposals ?? 0, decimals: 0 },
    { key: 'goals', title: 'Most Goals', icon: <IconAsset src="/assets/icons/afl/posts2.svg" className="h-6 w-6" />, getValue: (game: ProfileGame) => game.totals?.goals ?? 0, decimals: 0 },
    { key: 'rating', title: 'Best Game Rating', icon: <Star className="h-5 w-5" color={STAR_COLOR} fill={STAR_COLOR} />, getValue: gameRatingScore, decimals: 1 },
    { key: 'fantasy', title: 'Highest Fantasy', icon: <Zap className="h-5 w-5" color={ACCENT} />, getValue: (game: ProfileGame) => game.totals?.fantasy ?? 0, decimals: 0 },
    { key: 'tackles', title: 'Most Tackles', icon: <Shield className="h-5 w-5 text-white" />, getValue: (game: ProfileGame) => game.totals?.tackles ?? 0, decimals: 0 },
  ]

  const cards = configs.map((config) => {
    const entries = baseGames.map((game) => ({ game, value: config.getValue(game) })).filter((entry) => Number.isFinite(entry.value))
    if (!entries.length) return { ...config, value: '—', multiplier: null, meta: 'No games yet.', game: null as ProfileGame | null }
    const max = Math.max(...entries.map((entry) => entry.value))
    const tied = entries.filter((entry) => entry.value === max).sort((a, b) => b.game.activityTimestamp - a.game.activityTimestamp)
    const primary = tied[0]
    return {
      ...config,
      value: primary.value.toFixed(config.decimals).replace(/\.0$/, ''),
      multiplier: tied.length > 1 ? `x${tied.length}` : null,
      meta: `${primary.game.opponent ?? 'Opponent TBC'} • ${formatRoundShortLabel(primary.game.round ?? primary.game.computedRound)}`,
      game: primary.game,
    }
  })

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Highlights</h2>
        <button
          onClick={() => setIncludeTrials(!includeTrials)}
          className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-black ${
            includeTrials ? 'border-[#39FF88] text-white' : 'border-white/10 text-slate-400'
          }`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${includeTrials ? 'bg-[#39FF88]/15' : 'bg-white/5'}`}>
            {includeTrials ? <Check className="h-3.5 w-3.5" color={ACCENT} /> : null}
          </span>
          Incl. Trials
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <button
            key={card.key}
            onClick={() => card.game && onOpenGame(card.game)}
            disabled={!card.game}
            className="rounded-2xl bg-[#101A2A] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-[#142033] disabled:cursor-default"
          >
            <div className="flex min-h-10 items-center justify-center gap-2 text-sm font-black text-white">
              {card.icon}
              <span>{card.title}</span>
            </div>
            <div className="mt-3 flex items-baseline justify-center gap-2">
              <p className="text-3xl font-black text-white">{card.value}</p>
              {card.multiplier ? <span className="text-sm font-black text-slate-500">{card.multiplier}</span> : null}
            </div>
            <p className="mt-2 truncate text-xs font-bold text-slate-500">{card.meta}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function Quick6({ summaries }: { summaries: Record<StatScope, ReturnType<typeof computeScopeStats>> }) {
  const [scope, setScope] = useState<StatScope>('season')
  const active = summaries[scope]
  const reference = summaries[refScope(scope)]

  return (
    <section className="rounded-2xl bg-[#101A2A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">Quick 6</h2>
        <ScopeToggle value={scope} onChange={setScope} />
      </div>
      <div className="grid grid-cols-2 divide-x-0 divide-y divide-white/10 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-y-0">
        {QUICK_STATS.map((stat) => {
          const value = active.averages[stat.key]
          const ref = reference.averages[stat.key]
          const display = formatAverage(value, stat.key, active.available)
          const canCompare = active.available && reference.available && value != null && ref != null
          const delta = canCompare ? value - ref : null
          return (
            <div key={stat.key} className="px-3 py-4 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{stat.label}</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                {delta != null && Math.abs(delta) > 0 ? (
                  delta > 0 ? (
                    <TrendingUp className="h-4 w-4" color={ACCENT} />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-300" />
                  )
                ) : null}
                <p className="text-2xl font-black text-white">{display}</p>
                {delta != null && Math.abs(delta) > 0 ? (
                  <span className={`text-xs font-black ${delta > 0 ? 'text-[#39FF88]' : 'text-red-300'}`}>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {scopeLabel(refScope(scope))}: {formatAverage(ref, stat.key, reference.available)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AllStats({
  summaries,
  seasonYear,
}: {
  summaries: Record<StatScope, ReturnType<typeof computeScopeStats>>
  seasonYear: number | null
}) {
  const [scope, setScope] = useState<StatScope>('season')
  const active = summaries[scope]
  const reference = summaries[refScope(scope)]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">Averages by {scopeLabel(scope).toLowerCase()} scope</p>
        <ScopeToggle value={scope} onChange={setScope} />
      </div>
      {STAT_GROUPS.map((group) => (
        <section key={group.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{group.label}</h3>
            <p className="text-xs font-bold text-slate-600">vs {scopeLabel(refScope(scope))}</p>
          </div>
          <div className="overflow-hidden rounded-xl bg-[#101A2A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            {group.stats.map((stat, index) => {
              const value = active.averages[stat.key]
              const ref = reference.averages[stat.key]
              const canCompare = active.available && reference.available && value != null && ref != null
              const delta = canCompare ? value - ref : null
              const band = benchmarkBand(stat.key, value)
              return (
                <div key={stat.key} className={`flex items-center justify-between gap-4 px-4 py-3 ${index % 2 ? 'bg-white/[0.025]' : ''}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      title={band ? `${band} benchmark ${seasonYear ?? ''}` : 'Benchmark unavailable'}
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ color: band ? bandColors[band] : '#64748B', backgroundColor: band ? bandColors[band] : '#64748B' }}
                    />
                    <p className="truncate text-sm font-bold text-slate-300">{stat.label}</p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    {delta != null && Math.abs(delta) > 0 ? (
                      delta > 0 ? (
                        <TrendingUp className="h-4 w-4" color={ACCENT} />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-300" />
                      )
                    ) : null}
                    <span className="min-w-14 text-base font-black tabular-nums text-white">{formatAverage(value, stat.key, active.available)}</span>
                    {delta != null && Math.abs(delta) > 0 ? (
                      <span className={`min-w-10 text-xs font-black ${delta > 0 ? 'text-[#39FF88]' : 'text-red-300'}`}>
                        {delta > 0 ? '+' : '-'}
                        {Math.abs(delta).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function AllGames({
  games,
  mode,
  onOpenGame,
}: {
  games: ProfileGame[]
  mode: 'self' | 'public'
  onOpenGame: (game: ProfileGame) => void
}) {
  const [sort, setSort] = useState<MatchSort>('round')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const sortedGames = useMemo(() => {
    const getValue = (game: ProfileGame) => {
      if (sort === 'round') return Number(game.round ?? game.computedRound ?? 0)
      if (sort === 'opponent') return (game.opponent ?? '').toLowerCase()
      if (sort === 'disposals') return game.totals?.disposals ?? 0
      if (sort === 'goals') return game.totals?.goals ?? 0
      if (sort === 'af') return game.totals?.fantasy ?? 0
      return gameRatingScore(game)
    }
    return [...games].sort((a, b) => {
      const av = getValue(a)
      const bv = getValue(b)
      const direction = dir === 'asc' ? 1 : -1
      if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * direction
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * direction
    })
  }, [dir, games, sort])

  function toggle(next: MatchSort) {
    if (sort === next) setDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(next)
      setDir('asc')
    }
  }

  const header = (key: MatchSort, label: string | JSX.Element, className = '') => (
    <button onClick={() => toggle(key)} className={`text-center text-xs font-black uppercase tracking-wide text-slate-500 ${className}`}>
      {label}
    </button>
  )

  return (
    <div className="overflow-hidden rounded-2xl bg-[#101A2A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="grid grid-cols-[44px_minmax(150px,1fr)_48px_48px_56px_64px] items-center gap-0 border-b-2 border-[#080E1A] bg-[#0A1220] px-2 py-3">
        {header('round', 'R')}
        {header('opponent', 'Opponent')}
        {header('disposals', 'D')}
        {header('goals', 'G')}
        {header('af', 'AF')}
        {header('rating', <Star className="mx-auto h-4 w-4" color={STAR_COLOR} fill={STAR_COLOR} />)}
      </div>
      {sortedGames.length ? (
        sortedGames.map((game) => {
          const rating = game.isTrackedOnly ? 'T' : game.totals ? gameRatingScore(game).toFixed(1).replace(/\.0$/, '') : '—'
          return (
            <button
              key={`${game.id}:${game.manualId ?? 'tracked'}`}
              onClick={() => onOpenGame(game)}
              className="grid w-full grid-cols-[44px_minmax(150px,1fr)_48px_48px_56px_64px] items-center border-b border-[#080E1A] px-2 py-3 text-left transition hover:bg-white/[0.035]"
            >
              <span className="text-center text-sm font-black tabular-nums text-white">{formatRoundShortLabel(game.round ?? game.computedRound)}</span>
              <span className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0A1220] text-xs font-black text-white">
                  {game.opponentLogoUrl ? <img src={game.opponentLogoUrl} alt="" className="h-full w-full object-cover" /> : opponentInitials(game.opponent)}
                  {game.source === 'manual' ? (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#39FF88]">
                      <Edit className="h-2.5 w-2.5 text-[#07111F]" />
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{game.opponent ?? 'Opponent TBC'}</span>
                  {game.source === 'manual' ? <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Manual</span> : null}
                </span>
              </span>
              <span className="text-center text-sm font-black tabular-nums text-white">{formatStatValue(game, 'disposals')}</span>
              <span className="text-center text-sm font-black tabular-nums text-white">{formatStatValue(game, 'goals')}</span>
              <span className="text-center text-sm font-black tabular-nums text-white">{formatStatValue(game, 'fantasy')}</span>
              <span className="flex items-center justify-center gap-1 text-sm font-black tabular-nums text-white">
                {rating}
                {game.source === 'manual' && mode === 'self' ? <MoreVertical className="h-4 w-4 text-slate-500" /> : null}
              </span>
            </button>
          )
        })
      ) : (
        <EmptyPanel>No matches yet.</EmptyPanel>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const mode: 'self' | 'public' = params.id ? 'public' : 'self'
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [dataset, setDataset] = useState<ProfileDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statsUnavailable, setStatsUnavailable] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [includeTrials, setIncludeTrials] = useState(false)
  const [activeTab, setActiveTab] = useState<PerformanceTab>('allStats')

  const viewedUserId = params.id ?? viewerId

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setViewerId(data.session?.user?.id ?? null)
    })()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setViewerId(session?.user?.id ?? null)
    })
    return () => {
      active = false
      subscription?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!viewedUserId) {
      if (!viewerId && mode === 'self') setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setMatchesLoading(true)
    setError(null)
    setStatsUnavailable(false)
    loadProfileDataset(viewedUserId, mode, viewerId)
      .then((next) => {
        if (!active) return
        setDataset(next)
        const currentYear = new Date().getFullYear()
        setSelectedYear(next.distinctYears.includes(currentYear) ? currentYear : next.distinctYears[0] ?? null)
      })
      .catch((err) => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Unable to load profile right now.'
        if (mode === 'public' && /permission|row-level|rls|401|403/i.test(message)) setStatsUnavailable(true)
        setError(message)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
        setMatchesLoading(false)
      })
    return () => {
      active = false
    }
  }, [mode, viewedUserId, viewerId])

  const filteredCareer = useMemo(
    () =>
      (dataset?.matches ?? [])
        .filter((game) => game.logged && includeByTrialFilter(game.round ?? game.computedRound, includeTrials))
        .sort((a, b) => b.activityTimestamp - a.activityTimestamp),
    [dataset?.matches, includeTrials]
  )
  const seasonGames = useMemo(
    () => filteredCareer.filter((game) => parseSeasonYear(game.activityDate ?? game.date) === selectedYear),
    [filteredCareer, selectedYear]
  )
  const scopedGames = useMemo(
    () => ({
      season: seasonGames,
      last3: seasonGames.slice(0, 3),
      career: filteredCareer,
    }),
    [filteredCareer, seasonGames]
  )
  const summaries = useMemo(
    () => ({
      season: computeScopeStats(scopedGames.season),
      last3: computeScopeStats(scopedGames.last3, 3),
      career: computeScopeStats(scopedGames.career),
    }),
    [scopedGames]
  )
  const highlightBase = seasonGames.length ? seasonGames : filteredCareer

  const onOpenGame = useCallback(
    (game: ProfileGame) => {
      if (game.source === 'manual' && game.manualId) {
        navigate(`/games/manual/${game.manualId}`)
        return
      }
      navigate(`/games/${game.id}${game.isTrackedOnly ? '' : `?profileUserId=${encodeURIComponent(dataset?.identity.userId ?? '')}`}`)
    },
    [dataset?.identity.userId, navigate]
  )

  if (loading) return <LoadingState />
  if (mode === 'self' && !viewerId) return <EmptyPanel>Sign in to view your profile.</EmptyPanel>
  if (error || !dataset) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {mode === 'public' ? 'Profile unavailable.' : error ?? 'Profile unavailable.'}
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Back
        </button>
      </section>
    )
  }

  return (
    <div className="-m-6 space-y-5 pb-6 sm:-m-8">
      <ProfileHero
        identity={dataset.identity}
        mode={mode}
        viewerId={viewerId}
        onFollowChanged={(next) =>
          setDataset((current) =>
            current
              ? {
                  ...current,
                  identity: {
                    ...current.identity,
                    isFollowing: next,
                    followersCount:
                      current.identity.followersCount == null
                        ? current.identity.followersCount
                        : current.identity.followersCount + (next ? 1 : -1),
                  },
                }
              : current
          )
        }
      />

      <main className="mx-auto max-w-6xl space-y-5 px-4 sm:px-8">
        {dataset.distinctYears.length ? (
          <SeasonChips years={dataset.distinctYears} selectedYear={selectedYear} onSelect={setSelectedYear} />
        ) : null}

        {statsUnavailable ? (
          <EmptyPanel>Stats unavailable.</EmptyPanel>
        ) : (
          <>
            <SeasonTotals games={seasonGames} seasonYear={selectedYear} />
            <Highlights baseGames={highlightBase} includeTrials={includeTrials} setIncludeTrials={setIncludeTrials} onOpenGame={onOpenGame} />
            <Quick6 summaries={summaries} />

            <section className="space-y-4">
              <div>
                <h2 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Performance</h2>
                <div className="flex gap-5 overflow-x-auto border-b border-white/10">
                  {([
                    ['allStats', 'All Stats'],
                    ['allGames', 'All Games'],
                    ['awards', 'Awards'],
                    ['posts', 'Posts'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`relative pb-3 text-sm font-black transition ${
                        activeTab === key ? 'text-[#39FF88]' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {label}
                      {activeTab === key ? <span className="absolute bottom-[-1px] left-0 h-0.5 w-full rounded-full bg-[#39FF88]" /> : null}
                    </button>
                  ))}
                </div>
              </div>

              {matchesLoading ? (
                <EmptyPanel>Loading matches...</EmptyPanel>
              ) : activeTab === 'allStats' ? (
                <AllStats summaries={summaries} seasonYear={selectedYear} />
              ) : activeTab === 'allGames' ? (
                <AllGames games={seasonGames} mode={mode} onOpenGame={onOpenGame} />
              ) : activeTab === 'awards' ? (
                <div className="rounded-2xl bg-[#101A2A] p-8 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No awards yet...</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#101A2A] p-8 text-center">
                  <Flashlight className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No posts yet.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
