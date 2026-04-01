import clsx from 'clsx'
import {
  ArrowLeft,
  BarChart3,
  Download,
  Gauge,
  Share2,
  Star,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type {
  PlayerSummaryRow,
  SummaryColumnDef,
  SummaryInsightTile,
  SummaryScope,
  SummarySortKey,
  SummaryStats,
  TeamComparisonGroup,
  TeamSide,
} from '@/lib/portal-game-summary'
import { formatScopeLabel, formatPlayerName, resolveStatValue } from '@/lib/portal-game-summary'

type TeamIdentity = {
  name: string
  logoUrl: string | null
  accent: string
  score: number
  goals: number
  behinds: number
}

type MatchHeroProps = {
  home: TeamIdentity
  away: TeamIdentity
  statusLabel: string
  centerLabel?: string
  roundLabel: string
  venueLabel: string
  dateLabel: string
  homeQuarterScores?: string[]
  awayQuarterScores?: string[]
}

type ActionBarProps = {
  onShare: () => void
  onDownload: () => void
  isDownloading?: boolean
}

type StickyHeaderProps = MatchHeroProps & {
  visible: boolean
  onShare: () => void
  onDownload: () => void
  isDownloading?: boolean
}

type SummaryControlsProps = {
  activeTab: 'players' | 'team'
  onChangeTab: (next: 'players' | 'team') => void
  selectedScope: SummaryScope
  onSelectScope: (scope: SummaryScope) => void
  availableScopes: SummaryScope[]
  advanced: boolean
  onToggleAdvanced: () => void
}

type PlayersTableProps = {
  gameId: string
  rows: PlayerSummaryRow[]
  columns: SummaryColumnDef[]
  sortKey: SummarySortKey
  sortDirection: 'asc' | 'desc'
  onSort: (key: SummarySortKey) => void
  advancedOnlyKeys?: Array<SummaryColumnDef['key']>
  homeTint: string
  awayTint: string
}

type TeamBarsProps = {
  groups: TeamComparisonGroup[]
  homeName: string
  awayName: string
  homeStats: SummaryStats
  awayStats: SummaryStats
  homeTint: string
  awayTint: string
}

const ACTIVE_ACCENT = '#00ff87'
const ACTIVE_TEXT = '#07111f'

const addOpacity = (hex: string | null | undefined, alpha: number) => {
  const color = (hex || '#00ff87').replace('#', '')
  const full = color.length === 3 ? color.split('').map((char) => `${char}${char}`).join('') : color.padEnd(6, '0')
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getReadableTextColor = (hexColor: string) => {
  const value = (hexColor || '#000000').replace('#', '')
  const fullHex = value.length === 3 ? value.split('').map((char) => `${char}${char}`).join('') : value.padEnd(6, '0')
  const r = Number.parseInt(fullHex.slice(0, 2), 16)
  const g = Number.parseInt(fullHex.slice(2, 4), 16)
  const b = Number.parseInt(fullHex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#061120' : '#ffffff'
}

const initials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0].charAt(0)}${parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''}`.toUpperCase()
}

const TileIcon = ({ tile }: { tile: SummaryInsightTile }) => {
  if (tile.key === 'best') return <Star className="h-4 w-4" />
  if (tile.key === 'gap') return <BarChart3 className="h-4 w-4" />
  return <Gauge className="h-4 w-4" />
}

function TeamLogo({ name, logoUrl, accent, size = 'h-16 w-16' }: { name: string; logoUrl: string | null; accent: string; size?: string }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden rounded-[1.45rem] bg-[#08111f] shadow-[0_12px_32px_rgba(2,8,20,0.42)] ring-1 ring-white/8',
        size
      )}
      style={{ boxShadow: `0 12px 32px ${addOpacity(accent, 0.24)}` }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-black tracking-[0.24em] text-white/86">{initials(name)}</span>
      )}
    </div>
  )
}

export function MatchHero({
  home,
  away,
  statusLabel,
  centerLabel = 'VS',
  roundLabel,
  venueLabel,
  dateLabel,
  homeQuarterScores = [],
  awayQuarterScores = [],
}: MatchHeroProps) {
  const HeroSide = ({
    side,
    team,
  }: {
    side: TeamSide
    team: TeamIdentity
  }) => {
    const isHome = side === 'home'

    return (
      <div className="w-full space-y-3">
        <div className={clsx('min-w-0', isHome ? 'text-left' : 'text-right')}>
          <p className="text-[0.46rem] font-bold uppercase tracking-[0.32em] text-white/48 sm:text-[0.58rem] sm:tracking-[0.4em]">{isHome ? 'Home' : 'Away'}</p>
          <h2 className="mt-1.5 truncate text-[0.92rem] font-black uppercase italic tracking-[0.03em] text-white sm:mt-2 sm:text-[1.35rem] sm:tracking-[0.08em] lg:text-[2.15rem]">{team.name}</h2>
        </div>

        <div className={clsx('grid w-full items-center', isHome ? 'grid-cols-[auto_auto_minmax(0,1fr)] gap-0.5 lg:gap-1' : 'grid-cols-[minmax(0,1fr)_auto_auto] gap-4 lg:gap-5')}>
          {isHome ? (
            <>
              <TeamLogo name={team.name} logoUrl={team.logoUrl} accent={team.accent} size="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24" />
              <div className="flex items-center justify-start">
                <span className="score-glow text-[2.7rem] font-black italic leading-none text-white sm:text-[3.7rem] lg:text-[5.4rem]">{team.score}</span>
              </div>
              <div />
            </>
          ) : (
            <>
              <div />
              <div className="flex items-center justify-start">
                <span className="score-glow text-[2.7rem] font-black italic leading-none text-white sm:text-[3.7rem] lg:text-[5.4rem]">{team.score}</span>
              </div>
              <TeamLogo name={team.name} logoUrl={team.logoUrl} accent={team.accent} size="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24" />
            </>
          )}
        </div>

        <div className={clsx(isHome ? 'text-left' : 'text-right')}>
          <div className={clsx('mb-1', !isHome && 'ml-auto')}>
            <p className="text-[0.5rem] font-bold uppercase tracking-[0.22em] text-white/40 sm:text-[0.6rem] sm:tracking-[0.28em]">G.B</p>
            <span className="text-[0.82rem] font-bold tracking-[0.12em] text-white/68 sm:text-sm sm:tracking-[0.18em] lg:text-base">{team.goals}.{team.behinds}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-[2.3rem] bg-[#07111f] shadow-[0_30px_90px_rgba(2,8,20,0.58)] ring-1 ring-white/6">
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: `linear-gradient(130deg, ${addOpacity(home.accent, 0.42)}, rgba(7,17,31,0.18) 58%, rgba(7,17,31,0.06))` }} />
        <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: `linear-gradient(230deg, ${addOpacity(away.accent, 0.4)}, rgba(7,17,31,0.18) 58%, rgba(7,17,31,0.06))` }} />
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute bottom-0 left-1/2 h-40 w-[46%] -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(116px,148px)_minmax(0,1fr)] gap-3 px-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_minmax(0,1fr)] sm:gap-5 sm:px-5 sm:py-6 lg:grid-cols-[1fr_minmax(260px,320px)_1fr] lg:items-center lg:gap-7 lg:px-9 lg:py-9">
        <HeroSide side="home" team={home} />

        <div className="flex flex-col items-center text-center">
          <p className="text-[0.46rem] font-black uppercase tracking-[0.26em] text-white/42 sm:text-[0.58rem] sm:tracking-[0.46em]">Match Summary</p>
          <div className="mt-2 flex flex-col items-center sm:mt-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#39FF88] sm:text-[0.72rem] sm:tracking-[0.34em]">{statusLabel}</p>
            <div className="my-1.5 text-[1.15rem] font-black uppercase italic tracking-[-0.04em] text-white/88 sm:my-2 sm:text-[2rem] lg:text-[2.5rem]">{centerLabel}</div>
            <div className="flex flex-col items-center space-y-0.5 text-white/78 sm:space-y-1">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/90 sm:text-[0.82rem] sm:tracking-[0.26em]">{roundLabel}</p>
              <p className="text-[0.72rem] font-medium sm:text-sm">{venueLabel}</p>
              <p className="text-[0.68rem] font-medium text-white/62 sm:text-sm">{dateLabel}</p>
            </div>
          </div>
          {(homeQuarterScores.length || awayQuarterScores.length) && (
            <div className="mt-3 flex w-full justify-center sm:mt-4">
              <div className="w-full max-w-[180px] sm:max-w-[290px]">
                <div className="grid grid-cols-[16px_repeat(4,minmax(0,1fr))] justify-items-center gap-x-1 gap-y-1 text-center text-[0.45rem] uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-[24px_repeat(4,minmax(0,1fr))] sm:gap-x-2 sm:text-[0.56rem] sm:tracking-[0.22em]">
                  <span />
                  <span>Q1</span>
                  <span>Q2</span>
                  <span>Q3</span>
                  <span>Q4</span>
                </div>
                <div className="mt-1.5 grid grid-cols-[16px_repeat(4,minmax(0,1fr))] justify-items-center gap-x-1 gap-y-1 text-center text-[0.62rem] font-bold text-white/78 sm:mt-2 sm:grid-cols-[24px_repeat(4,minmax(0,1fr))] sm:gap-x-2 sm:text-[0.72rem]">
                  <span className="text-white/42">H</span>
                  {Array.from({ length: 4 }, (_, index) => (
                    <span key={`home-${index}`}>{homeQuarterScores[index] ?? '–'}</span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-[16px_repeat(4,minmax(0,1fr))] justify-items-center gap-x-1 gap-y-1 text-center text-[0.62rem] font-bold text-white/78 sm:grid-cols-[24px_repeat(4,minmax(0,1fr))] sm:gap-x-2 sm:text-[0.72rem]">
                  <span className="text-white/42">A</span>
                  {Array.from({ length: 4 }, (_, index) => (
                    <span key={`away-${index}`}>{awayQuarterScores[index] ?? '–'}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <HeroSide side="away" team={away} />
      </div>
    </section>
  )
}

export function SummaryActionBar({ onShare, onDownload, isDownloading }: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.45rem] bg-[#0a1424]/78 px-1 py-1 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Link to="/games" className="btn btn-ghost gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06]">
          <ArrowLeft className="h-4 w-4" />
          Games
        </Link>
        <span className="hidden text-white/12 md:inline">|</span>
        <span className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">Summary Actions</span>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-1.5">
        <button type="button" className="btn btn-ghost w-full gap-2 rounded-[1rem] px-3.5 py-2 text-sm text-slate-200 hover:bg-white/[0.06] sm:w-auto" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button type="button" className="btn w-full gap-2 rounded-[1rem] bg-[#39FF88] px-4 py-2 text-sm font-semibold text-[#061120] shadow-[0_10px_24px_rgba(57,255,136,0.16)] hover:bg-[#39FF88] sm:w-auto" onClick={onDownload} disabled={isDownloading}>
          <Download className="h-4 w-4" />
          {isDownloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
    </div>
  )
}

export function SummaryInsightTiles({
  tiles,
  homeTint,
  awayTint,
}: {
  tiles: SummaryInsightTile[]
  homeTint: string
  awayTint: string
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {tiles.map((tile) => {
        const accent = tile.teamSide === 'home' ? homeTint : tile.teamSide === 'away' ? awayTint : '#7dd3fc'
        return (
          <article
            key={tile.key}
            className="rounded-[1.35rem] px-4 py-3.5 shadow-[0_14px_30px_rgba(2,8,20,0.24)] ring-1 ring-white/5"
            style={{ background: `linear-gradient(180deg, ${addOpacity(accent, 0.18)}, rgba(7,16,29,0.96) 56%, rgba(7,16,29,0.92))` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-white/52">{tile.title}</p>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: addOpacity(accent, 0.24), color: tile.key === 'best' ? '#facc15' : '#f8fafc' }}
              >
                <TileIcon tile={tile} />
              </div>
            </div>
            <div className="mt-3.5 flex items-end justify-between gap-4">
              <p className="text-[2rem] font-black italic leading-none tracking-[-0.03em] text-white">{tile.value}</p>
              <p className="max-w-[58%] text-right text-[0.82rem] font-semibold leading-tight text-white/68">{tile.subtitle}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function SummaryControls({
  activeTab,
  onChangeTab,
  selectedScope,
  onSelectScope,
  availableScopes,
  advanced,
  onToggleAdvanced,
}: SummaryControlsProps) {
  const segments = [
    { key: 'players' as const, label: 'Players', icon: <Users className="h-4 w-4" /> },
    { key: 'team' as const, label: 'Team', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  return (
    <section className="space-y-2.5 rounded-[1.45rem] bg-[#0a1424]/78 px-3 py-3 backdrop-blur-sm">
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,318px)_1fr] lg:items-center">
        <div className="grid grid-cols-2 gap-1 rounded-[1rem] bg-white/[0.045] p-1">
          {segments.map((segment) => {
            const active = activeTab === segment.key
            return (
              <button
                key={segment.key}
                type="button"
                className={clsx(
                  'flex items-center justify-center gap-2 rounded-[0.8rem] px-4 py-2.5 text-sm font-black transition',
                  active ? 'shadow-[0_10px_22px_rgba(0,255,135,0.18)]' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                )}
                style={active ? { backgroundColor: ACTIVE_ACCENT, color: ACTIVE_TEXT } : undefined}
                onClick={() => onChangeTab(segment.key)}
              >
                {segment.icon}
                {segment.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {availableScopes.map((scope) => {
            const active = selectedScope === scope
            return (
              <button
                key={String(scope)}
                type="button"
                className="rounded-[0.8rem] px-3 py-1.5 text-[0.82rem] font-black transition"
                style={
                  active
                    ? { backgroundColor: ACTIVE_ACCENT, color: ACTIVE_TEXT }
                    : { backgroundColor: 'rgba(255,255,255,0.045)', color: '#cbd5e1' }
                }
                onClick={() => onSelectScope(scope)}
              >
                {formatScopeLabel(scope)}
              </button>
            )
          })}
          <button
            type="button"
            className="rounded-[0.8rem] px-3 py-1.5 text-[0.82rem] font-black transition"
            style={
              advanced
                ? { backgroundColor: ACTIVE_ACCENT, color: ACTIVE_TEXT }
                : { backgroundColor: 'rgba(255,255,255,0.045)', color: '#cbd5e1' }
            }
            onClick={onToggleAdvanced}
          >
            A
          </button>
        </div>
      </div>
    </section>
  )
}

export function SummaryPlayersTable({
  gameId,
  rows,
  columns,
  sortKey,
  sortDirection,
  onSort,
  advancedOnlyKeys = [],
  homeTint,
  awayTint,
}: PlayersTableProps) {
  const navigate = useNavigate()
  const highlightSet = new Set(advancedOnlyKeys)

  const openPlayerSummary = (row: PlayerSummaryRow) => {
    const query = row.profileUserId ? `?profileUserId=${encodeURIComponent(row.profileUserId)}` : ''
    navigate(`/player/${gameId}/${row.playerId}${query}`)
  }

  return (
    <section className="overflow-hidden rounded-[1.8rem] bg-[#0b1526] shadow-[0_22px_50px_rgba(2,8,20,0.28)] ring-1 ring-white/5">
      <div className="px-5 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-slate-500">Players</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] border-collapse text-sm md:min-w-[860px]">
          <thead className="bg-white/[0.025]">
            <tr className="text-left text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
              <th className="sticky left-0 z-20 min-w-[180px] bg-[#0d1728] px-4 py-3 md:min-w-[240px]">
                <button type="button" className="font-semibold text-left" onClick={() => onSort('name')}>
                  Player{sortKey === 'name' ? sortDirection === 'asc' ? ' ▲' : ' ▼' : ''}
                </button>
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx('px-3 py-3 text-center', highlightSet.has(column.key) && 'bg-[#f59e0b]/[0.07]')}
                >
                  <button type="button" className="font-semibold" onClick={() => onSort(column.key as SummarySortKey)}>
                    {column.label}
                    {sortKey === column.key ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const tint = row.teamSide === 'home' ? homeTint : awayTint
                const badgeTextColor = getReadableTextColor(tint)
                return (
                  <tr
                    key={row.playerId}
                    className="cursor-pointer border-t border-white/[0.04] text-slate-200 transition hover:bg-white/[0.025]"
                    onClick={() => openPlayerSummary(row)}
                  >
                    <td className="sticky left-0 z-10 bg-[#0d1728] px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.82rem] font-black leading-none',
                            row.linkedUser && 'ring-2 ring-[#2DFF7A]'
                          )}
                          style={{ backgroundColor: tint, color: badgeTextColor }}
                        >
                          {row.jumperNumber ?? '–'}
                        </div>
                        <p className="min-w-0 truncate font-semibold leading-none text-white">{formatPlayerName(row.name)}</p>
                      </div>
                    </td>
                    {columns.map((column) => {
                      const value =
                        column.key === 'GB'
                          ? `${row.stats.G ?? 0}.${row.stats.B ?? 0}`
                          : column.key === 'D'
                          ? row.stats.D ?? (row.stats.K ?? 0) + (row.stats.HB ?? 0)
                          : row.stats[column.key as keyof SummaryStats] ?? 0
                      return (
                        <td
                          key={column.key}
                          className={clsx(
                            'px-3 py-2.5 text-center font-semibold tabular-nums',
                            highlightSet.has(column.key) && 'bg-[#f59e0b]/[0.04]'
                          )}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400">
                  No player rows available for this scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function TeamComparisonBars({
  groups,
  homeName,
  awayName,
  homeStats,
  awayStats,
  homeTint,
  awayTint,
}: TeamBarsProps) {
  return (
    <section className="rounded-[1.8rem] bg-[#0b1526] px-5 py-5 shadow-[0_22px_50px_rgba(2,8,20,0.28)] ring-1 ring-white/5">
      <div className="mb-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-slate-500">Team</p>
      </div>
      <div className="space-y-6">
        {groups.map((group) => {
          const visibleRows = group.rows
            .map((row) => ({
              ...row,
              home: resolveStatValue(row.key, homeStats),
              away: resolveStatValue(row.key, awayStats),
            }))
            .filter((row) => row.home.present || row.away.present)

          if (!visibleRows.length) return null

          return (
            <div key={group.title} className="space-y-3">
              <h4 className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-slate-400">{group.title}</h4>
              <div className="space-y-4">
                {visibleRows.map((row) => {
                  const total = Math.max(1, row.home.numeric + row.away.numeric)
                  const homeWidth = `${(row.home.numeric / total) * 50}%`
                  const awayWidth = `${(row.away.numeric / total) * 50}%`
                  const leader =
                    row.home.numeric === row.away.numeric ? 'Even' : row.home.numeric > row.away.numeric ? `${homeName} lead` : `${awayName} lead`
                  return (
                    <article key={row.key} className="rounded-[1.15rem] bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.04]">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="min-w-[72px] text-sm font-black italic text-white" style={{ color: addOpacity(homeTint, 0.95) }}>
                          {row.home.display}
                        </span>
                        <span className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">{row.label}</span>
                        <span className="min-w-[72px] text-right text-sm font-black italic text-white" style={{ color: addOpacity(awayTint, 0.95) }}>
                          {row.away.display}
                        </span>
                      </div>
                      <div className="relative h-12 overflow-hidden rounded-full border border-white/8 bg-white/[0.04]">
                        <div className="absolute inset-y-0 left-1/2 w-px bg-white/12" />
                        <div className="absolute inset-y-1 right-1/2 rounded-l-full" style={{ width: homeWidth, backgroundColor: addOpacity(homeTint, 0.95) }} />
                        <div className="absolute inset-y-1 left-1/2 rounded-r-full" style={{ width: awayWidth, backgroundColor: addOpacity(awayTint, 0.95) }} />
                      </div>
                      <p className="mt-2 text-center text-xs font-medium text-slate-400">{leader}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function StickyMatchHeader({
  visible,
  home,
  away,
  statusLabel,
  roundLabel,
  onShare,
  onDownload,
  isDownloading,
}: StickyHeaderProps) {
  return (
    <div
      className={clsx(
        'pointer-events-none fixed left-0 right-0 top-[72px] z-40 hidden px-4 transition duration-200 lg:block',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-[1.25rem] bg-[#08111f]/84 px-4 py-3 shadow-[0_18px_40px_rgba(2,8,20,0.42)] ring-1 ring-white/6 backdrop-blur-md pointer-events-auto">
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo name={home.name} logoUrl={home.logoUrl} accent={home.accent} size="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-[0.14em] text-white">{home.name}</p>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">{statusLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white">
          <span className="text-sm font-semibold text-white/64">{home.goals}.{home.behinds}</span>
          <span className="text-2xl font-black">{home.score}</span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">vs</span>
          <span className="text-2xl font-black">{away.score}</span>
          <span className="text-sm font-semibold text-white/64">{away.goals}.{away.behinds}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-black uppercase tracking-[0.14em] text-white">{away.name}</p>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">{roundLabel}</p>
          </div>
          <TeamLogo name={away.name} logoUrl={away.logoUrl} accent={away.accent} size="h-10 w-10" />
          <button type="button" className="btn btn-secondary gap-2 px-3 py-2 text-sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button type="button" className="btn gap-2 bg-[#39FF88] px-3 py-2 text-sm font-semibold text-[#061120] hover:bg-[#39FF88]" onClick={onDownload} disabled={isDownloading}>
            <Download className="h-4 w-4" />
            {isDownloading ? 'Preparing…' : 'PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
