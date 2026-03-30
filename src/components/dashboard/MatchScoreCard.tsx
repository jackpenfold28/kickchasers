import { CalendarDays, MapPin } from 'lucide-react'
import clsx from 'clsx'

type MatchScoreCardProps = {
  variant?: 'hero' | 'compact'
  surface?: 'flat' | 'tinted'
  status: 'Live' | 'Final' | 'Scheduled' | string
  dateLabel: string
  roundLabel?: string | null
  venueLabel?: string | null
  competitionLabel?: string | null
  competitionLogoUrl?: string | null
  homeTint?: string | null
  awayTint?: string | null
  title?: string | null
  homeTeam: {
    name: string
    logoUrl: string | null
    label?: string | null
  }
  awayTeam: {
    name: string
    logoUrl: string | null
    label?: string | null
  }
  homeScore: number | null
  awayScore: number | null
  homeBreakdown?: string | null
  awayBreakdown?: string | null
  actionSlot?: React.ReactNode
}

function statusClasses(status: string) {
  if (status === 'Live') return 'bg-[#39FF88] text-[#09111C] border-transparent shadow-[0_0_18px_rgba(57,255,136,0.25)]'
  if (status === 'Scheduled') return 'border-sky-400/35 bg-sky-400/12 text-sky-200'
  if (status === 'Final') return 'border-white/10 bg-white/[0.08] text-slate-100'
  return 'border-white/10 bg-white/[0.08] text-slate-100'
}

function leagueInitials(label: string | null | undefined) {
  const source = label?.trim() || ''
  if (!source) return '??'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function monogram(label: string) {
  const cleaned = label.trim()
  if (!cleaned) return 'KC'
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function withAlpha(hex: string | null | undefined, alpha: number) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null
  const value = hex.slice(1)
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function buildCardLayers({
  variant,
  surface,
  status,
  homeTint,
  awayTint,
}: {
  variant: 'hero' | 'compact'
  surface: 'flat' | 'tinted'
  status: string
  homeTint: string | null | undefined
  awayTint: string | null | undefined
}) {
  if (variant === 'compact' && surface === 'flat') {
    return {
      background:
        'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.98) 100%)',
      topEdge: null,
    }
  }

  const homeStrong = variant === 'hero' ? 0.56 : 0.46
  const homeSoft = variant === 'hero' ? 0.34 : 0.28
  const awaySoft = variant === 'hero' ? 0.32 : 0.26
  const awayStrong = variant === 'hero' ? 0.52 : 0.42
  const tintGradient = `linear-gradient(104deg, ${withAlpha(homeTint, homeStrong) ?? `rgba(41,72,107,${homeStrong})`} 0%, ${withAlpha(
    homeTint,
    homeSoft
  ) ?? `rgba(41,72,107,${homeSoft})`} 26%, rgba(4, 7, 12, 0.86) 46%, rgba(4, 7, 12, 0.9) 54%, ${withAlpha(
    awayTint,
    awaySoft
  ) ?? `rgba(33,67,61,${awaySoft})`} 74%, ${withAlpha(awayTint, awayStrong) ?? `rgba(33,67,61,${awayStrong})`} 100%)`

  return {
    background: [
      'linear-gradient(180deg, rgba(8,12,18,0.04) 0%, rgba(8,12,18,0.2) 42%, rgba(8,12,18,0.44) 100%)',
      tintGradient,
      'linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(11,18,33,0.99) 100%)',
    ].join(', '),
    topEdge:
      status === 'Live'
        ? 'linear-gradient(90deg, rgba(57,255,136,0) 0%, rgba(57,255,136,0.58) 50%, rgba(57,255,136,0) 100%)'
        : null,
  }
}

function LogoRing({
  src,
  label,
  size = 'md',
}: {
  src: string | null
  label: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const outer = size === 'lg' ? 'h-[88px] w-[88px]' : size === 'sm' ? 'h-[54px] w-[54px]' : 'h-[66px] w-[66px]'
  const inner = size === 'lg' ? 'h-[76px] w-[76px]' : size === 'sm' ? 'h-[46px] w-[46px]' : 'h-[56px] w-[56px]'

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full border border-white/15 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
        outer
      )}
    >
      <div className={clsx('flex items-center justify-center overflow-hidden rounded-full bg-[#0A1220]', inner)}>
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover object-center" />
        ) : (
          <span className="text-sm font-extrabold tracking-[0.12em] text-slate-300">{monogram(label)}</span>
        )}
      </div>
    </div>
  )
}

export default function MatchScoreCard({
  variant = 'compact',
  surface,
  status,
  dateLabel,
  roundLabel,
  venueLabel,
  competitionLabel,
  competitionLogoUrl,
  homeTint,
  awayTint,
  title,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeBreakdown,
  awayBreakdown,
  actionSlot,
}: MatchScoreCardProps) {
  const isHero = variant === 'hero'
  const isCompact = variant === 'compact'
  const hasScore = homeScore != null && awayScore != null
  const resolvedSurface = surface ?? (isHero ? 'tinted' : 'flat')
  const layers = buildCardLayers({ variant, surface: resolvedSurface, status, homeTint, awayTint })

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,27,47,0.98)_0%,rgba(11,18,33,0.98)_100%)]',
        isHero ? 'p-5 lg:p-6' : 'h-full min-h-[224px] p-3'
      )}
      style={{ background: layers.background }}
    >
      {layers.topEdge ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ background: layers.topEdge }}
        />
      ) : null}

      {isCompact ? (
        <div className="relative flex h-full flex-col justify-between">
          <div className="grid flex-1 grid-cols-[84px_minmax(0,1fr)_84px] items-center gap-2.5">
            <div className="flex flex-col items-center gap-2 text-center">
              <LogoRing src={homeTeam.logoUrl} label={homeTeam.name} size="sm" />
              <div>
                <p className="min-h-[2rem] text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-white">
                  {homeTeam.name}
                </p>
                {homeTeam.label ? <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-500">{homeTeam.label}</p> : null}
              </div>
            </div>

            <div className="min-w-[0] px-0.5 text-center">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div className="text-center">
                  <div className="text-[2.15rem] font-black italic leading-none tracking-[-0.04em] text-white">{homeScore ?? '-'}</div>
                </div>
                <div className="pb-1.5 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">vs</div>
                <div className="text-center">
                  <div className="text-[2.15rem] font-black italic leading-none tracking-[-0.04em] text-white">{awayScore ?? '-'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <LogoRing src={awayTeam.logoUrl} label={awayTeam.name} size="sm" />
              <div>
                <p className="min-h-[2rem] text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-white">
                  {awayTeam.name}
                </p>
                {awayTeam.label ? <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-500">{awayTeam.label}</p> : null}
              </div>
            </div>
          </div>

          <div className="mt-2 h-[2px]" />
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{dateLabel}</span>
            </div>
            <span
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em]',
                statusClasses(status)
              )}
            >
              {status === 'Live' && <span className="h-2 w-2 rounded-full bg-[#09111C]" />}
              {status}
            </span>
          </div>

          <div className="mt-3 mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Match Focus</p>
          </div>

          <div className="grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <LogoRing src={homeTeam.logoUrl} label={homeTeam.name} size="lg" />
              <div>
                <p className="text-base font-bold uppercase tracking-[0.12em] text-white lg:text-lg">{homeTeam.name}</p>
                {homeTeam.label ? <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{homeTeam.label}</p> : null}
              </div>
            </div>

            <div className="min-w-[180px] px-3 text-center">
              {hasScore ? (
                <div>
                  {roundLabel ? <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{roundLabel}</div> : null}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                    <div className="text-center">
                      <div className="text-[3.4rem] font-black italic leading-none tracking-[-0.04em] text-white lg:text-[4.2rem]">{homeScore}</div>
                      <div className="mt-1.5 text-[13px] font-bold text-slate-400">{homeBreakdown || '-'}</div>
                    </div>
                    <div className="pb-6 text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">vs</div>
                    <div className="text-center">
                      <div className="text-[3.4rem] font-black italic leading-none tracking-[-0.04em] text-white lg:text-[4.2rem]">{awayScore}</div>
                      <div className="mt-1.5 text-[13px] font-bold text-slate-400">{awayBreakdown || '-'}</div>
                    </div>
                  </div>
                  {competitionLabel ? <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{competitionLabel}</div> : null}
                </div>
              ) : (
                <>
                  <div className="text-[3.4rem] font-black italic leading-none tracking-[-0.04em] text-white lg:text-[4.2rem]">VS</div>
                  <div className="mt-1.5 text-[13px] font-bold text-slate-400">{competitionLabel || venueLabel || 'Score pending'}</div>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-2.5 text-center">
              <LogoRing src={awayTeam.logoUrl} label={awayTeam.name} size="lg" />
              <div>
                <p className="text-base font-bold uppercase tracking-[0.12em] text-white lg:text-lg">{awayTeam.name}</p>
                {awayTeam.label ? <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{awayTeam.label}</p> : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {competitionLogoUrl || competitionLabel ? (
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-[#101A2D] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  {competitionLogoUrl ? (
                    <img src={competitionLogoUrl} alt={competitionLabel || 'League'} className="h-full w-full object-cover object-center" />
                  ) : (
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-200">{leagueInitials(competitionLabel)}</span>
                  )}
                </span>
              ) : null}
              {venueLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {venueLabel}
                </span>
              ) : null}
            </div>

            {actionSlot}
          </div>
        </div>
      )}
    </div>
  )
}
