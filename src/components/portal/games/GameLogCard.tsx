import { Link } from 'react-router-dom'
import { formatRoundLabel } from '@/lib/round-label'
import { ACCENT_SOFT_FALLBACK, normalizeHexColor } from '@/lib/squad-colors'
import type { GameLogRow } from '@/lib/portal-games'

function formatStatus(status: string | null) {
  const lower = (status || '').toLowerCase()
  if (lower === 'complete' || lower === 'completed' || lower === 'final' || lower === 'finished') return 'FINAL'
  if (lower === 'in_progress' || lower === 'live') return 'LIVE'
  if (lower === 'scheduled') return 'SCHEDULED'
  return (status || 'UNKNOWN').toUpperCase()
}

function statusClasses(status: string) {
  if (status === 'FINAL') return 'bg-[#DC2626] text-white'
  return 'bg-[#39FF88] text-[#07101D]'
}

function totalScore(goals: number | null, behinds: number | null) {
  if (goals == null || behinds == null) return null
  return goals * 6 + behinds
}

function scoreLine(goals: number | null, behinds: number | null) {
  if (goals == null || behinds == null) return null
  return `${goals}.${behinds}`
}

function monogram(label: string) {
  const cleaned = label.trim()
  if (!cleaned) return 'KC'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function formatTeamName(value: string | null | undefined) {
  if (!value) return ''
  return value.replace(/\bfootball club\b/gi, 'FC').trim()
}

function resolveCardTint(color: string | null | undefined) {
  return normalizeHexColor(color) ?? ACCENT_SOFT_FALLBACK
}

function withAlpha(color: string | null | undefined, alpha: number) {
  if (!color) return `rgba(9,16,28,${alpha})`

  const hexMatch = color.trim().match(/^#([0-9a-f]{6})$/i)
  if (hexMatch) {
    const value = hexMatch[1]
    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const rgbMatch = color.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i)
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
  }

  return color
}

function TeamLogo({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/18 bg-white/[0.08] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white/[0.08]">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover object-center" />
        ) : (
          <span className="text-[13px] font-black tracking-[0.08em] text-slate-100">{monogram(label)}</span>
        )}
      </div>
    </div>
  )
}

export function matchesStatusFilter(status: string | null, filter: 'all' | 'scheduled' | 'in_progress' | 'complete') {
  if (filter === 'all') return true
  const normalized = formatStatus(status)
  if (filter === 'scheduled') return normalized === 'SCHEDULED'
  if (filter === 'in_progress') return normalized === 'LIVE'
  return normalized === 'FINAL'
}

export default function GameLogCard({ row }: { row: GameLogRow }) {
  const status = formatStatus(row.status)
  const homeName = formatTeamName(row.squadName) || 'Home'
  const awayName = formatTeamName(row.opponent) || 'Away'
  const homeTotal = totalScore(row.scoreHomeGoals, row.scoreHomeBehinds)
  const awayTotal = totalScore(row.scoreAwayGoals, row.scoreAwayBehinds)
  const homeBreakdown = scoreLine(row.scoreHomeGoals, row.scoreHomeBehinds)
  const awayBreakdown = scoreLine(row.scoreAwayGoals, row.scoreAwayBehinds)
  const hasScore = homeTotal != null && awayTotal != null
  const href = row.isManual && row.manualId ? `/games/manual/${row.manualId}` : `/games/${row.id}`
  const roundLabel = formatRoundLabel(row.round ?? null)
  const homeTint = resolveCardTint(row.homePrimaryColorHex)
  const awayTint = resolveCardTint(row.awayPrimaryColorHex)

  const cardBackground = [
    `linear-gradient(135deg, ${withAlpha(homeTint, 0.34)} 0%, rgba(0,0,0,0.22) 52%, ${withAlpha(awayTint, 0.22)} 100%)`,
    'linear-gradient(180deg, rgba(8,12,18,0.08) 0%, rgba(8,12,18,0.24) 44%, rgba(8,12,18,0.46) 100%)',
  ].join(', ')
  const scorePrimary = hasScore ? `${homeTotal} - ${awayTotal}` : row.isManual ? 'MAG' : 'TBD'
  const scoreSecondary = hasScore ? `${homeBreakdown} | ${awayBreakdown}` : roundLabel || 'Score pending'

  return (
    <Link
      className="group relative block overflow-hidden rounded-[22px] border border-white/10 pt-5 shadow-[0_14px_30px_rgba(2,6,18,0.22),inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-white/14 hover:-translate-y-[1px]"
      to={href}
      style={{ backgroundImage: cardBackground }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,14,0.06)_0%,rgba(4,8,14,0.2)_42%,rgba(4,8,14,0.36)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,rgba(57,255,136,0)_0%,rgba(57,255,136,0.6)_35%,rgba(57,255,136,0.6)_65%,rgba(57,255,136,0)_100%)]" />
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <span className={`inline-flex min-h-7 items-center rounded-b-[10px] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_6px_16px_rgba(0,0,0,0.2)] ${statusClasses(status)}`}>
          {status}
        </span>
      </div>

      <div className="relative px-3.5 pb-3.5 pt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(108px,1.18fr)_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[1fr_minmax(128px,1.2fr)_1fr]">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <TeamLogo src={row.squadLogoUrl} label={homeName} />
            <div className="min-w-0">
              <p className="line-clamp-2 break-words text-[12px] font-bold leading-tight text-white sm:text-[13px]">{homeName}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-center gap-1 text-center">
            <p className="whitespace-nowrap text-[1.72rem] font-black italic leading-none tracking-[-0.06em] text-white sm:text-[1.92rem] lg:text-[2.02rem]">
              {scorePrimary}
            </p>
            <p className="text-[11px] font-black italic text-white/84 sm:text-[12px]">{scoreSecondary}</p>
            {roundLabel ? <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{roundLabel}</p> : null}
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <TeamLogo src={row.opponentLogoUrl} label={awayName} />
            <div className="min-w-0">
              <p className="line-clamp-2 break-words text-[12px] font-bold leading-tight text-white sm:text-[13px]">{awayName}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
