import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BellDot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Radio,
  ShieldCheck,
  Star,
  Trophy,
  Users2,
} from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import MatchScoreCard from '@/components/dashboard/MatchScoreCard'
import Quick6SummaryCard from '@/components/dashboard/Quick6SummaryCard'
import { loadDashboardData, type DashboardActionItem, type DashboardData } from '@/lib/portal-dashboard'
import type { Quick6Scope } from '@/lib/portal-quick6'
import { formatRoundLabel } from '@/lib/round-label'
import { supabase } from '@/lib/supabase'

function formatHandle(handle: string | null) {
  if (!handle) return null
  return handle.startsWith('@') ? handle : `@${handle}`
}

function formatStatus(status: string | null) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'in_progress') return 'Live'
  if (normalized === 'complete' || normalized === 'final') return 'Final'
  if (normalized === 'scheduled') return 'Scheduled'
  return status || 'Unknown'
}

function formatDateTime(value: string | null) {
  if (!value) return 'Time TBC'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time TBC'
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatShortDate(value: string | null) {
  if (!value) return 'Date TBC'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBC'
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(date)
}

function formatHeaderStat(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toFixed(digits)
}

function formatRelative(value: string | null) {
  if (!value) return 'Just now'
  const delta = Date.now() - new Date(value).getTime()
  if (Number.isNaN(delta)) return 'Just now'
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function scoreText(goals: number | null, behinds: number | null) {
  if (goals == null || behinds == null) return null
  return `${goals}.${behinds}`
}

function totalScore(goals: number | null, behinds: number | null) {
  if (goals == null || behinds == null) return null
  return goals * 6 + behinds
}

function recentGameResult(
  homeGoals: number | null,
  homeBehinds: number | null,
  awayGoals: number | null,
  awayBehinds: number | null
) {
  const home = totalScore(homeGoals, homeBehinds)
  const away = totalScore(awayGoals, awayBehinds)
  if (home == null || away == null) return null
  if (home > away) return { label: 'Win', className: 'text-[#B8FFD5]' }
  if (home < away) return { label: 'Loss', className: 'text-red-200' }
  return { label: 'Draw', className: 'text-sky-200' }
}

function actionTypeLabel(action: DashboardActionItem) {
  const normalized = action.type.toLowerCase()
  if (normalized === 'squad_invite') return 'Squad Invite'
  if (normalized === 'squad_join_request_created') return 'Join Request'
  if (normalized === 'guest_merge_request_created') return 'Guest Merge'
  if (normalized.includes('track_request')) return 'Track Request'
  if (normalized.includes('directory_request')) return 'Directory Request'
  if (normalized.includes('admin_request')) return 'Admin Request'
  if (normalized.includes('role')) return 'Role Decision'
  return action.type.replaceAll('_', ' ')
}

function actionAccentClass(accent: DashboardActionItem['accent']) {
  if (accent === 'green') return 'text-[#B8FFD5]'
  if (accent === 'amber') return 'text-amber-200'
  if (accent === 'red') return 'text-red-200'
  return 'text-sky-200'
}

function actionHref(action: DashboardActionItem) {
  return action.squadId ? `/squads/${action.squadId}` : '/notifications'
}

function actionTitle(action: DashboardActionItem) {
  const actor = action.actorName || formatHandle(action.actorHandle) || 'KickChasers'
  const normalized = action.type.toLowerCase()
  if (normalized === 'squad_invite') return `${actor} invited you to join`
  if (normalized === 'squad_join_request_created') return `${actor} requested to join`
  if (normalized === 'guest_merge_request_created') return `${actor} sent a guest merge`
  if (normalized.includes('track_request')) return `${actor} requested tracking access`
  if (normalized.includes('directory_request')) return `${actor} submitted a directory request`
  if (normalized.includes('admin_request')) return `${actor} requested admin approval`
  if (normalized.includes('role_decision')) return `${actor} updated a role request`
  if (normalized.includes('role_request')) return `${actor} requested a role review`
  return actor
}

function actionContext(action: DashboardActionItem) {
  const squad = action.squadName || (action.payload?.squad_name as string | undefined) || 'Team context pending'
  const requestedRole = (action.payload?.requested_role as string | undefined)?.replaceAll('_', ' ')
  const guestName = (action.payload?.guest_name as string | undefined) ?? null

  if (guestName) return `${guestName} • ${squad}`
  if (requestedRole) return `${requestedRole} • ${squad}`
  return squad
}

function actionStatusMeta(action: DashboardActionItem) {
  if (!action.readAt) {
    return {
      label: 'Needs attention',
      icon: BellDot,
      className: 'text-[#B8FFD5]',
    }
  }

  const normalized = action.type.toLowerCase()
  let label = 'Completed'
  if (normalized === 'squad_invite') label = 'Reviewed'
  else if (normalized === 'squad_join_request_created') label = 'Resolved'
  else if (normalized === 'guest_merge_request_created') label = 'Resolved'
  else if (normalized.includes('role_decision')) label = 'Updated'
  else if (normalized.includes('role_request')) label = 'Reviewed'

  return {
    label,
    icon: CheckCircle2,
    className: 'text-[#8FF0B0]',
  }
}

function LogoBadge({ src, label, className = 'h-12 w-12 rounded-2xl' }: { src: string | null; label: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden border border-white/10 bg-[#0C1627] ${className}`}>
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-slate-400">{label.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [quick6Scope, setQuick6Scope] = useState<Quick6Scope>('season')
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const next = await loadDashboardData(user.id, selectedSeasonYear)
        if (!cancelled) {
          setData(next)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, selectedSeasonYear])

  const matchFocusScore = useMemo(() => {
    if (!data?.matchFocus) return null
    return {
      home: scoreText(data.matchFocus.scoreHomeGoals, data.matchFocus.scoreHomeBehinds),
      away: scoreText(data.matchFocus.scoreAwayGoals, data.matchFocus.scoreAwayBehinds),
      homeTotal: totalScore(data.matchFocus.scoreHomeGoals, data.matchFocus.scoreHomeBehinds),
      awayTotal: totalScore(data.matchFocus.scoreAwayGoals, data.matchFocus.scoreAwayBehinds),
    }
  }, [data])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading dashboard…</main>
  }

  if (error || !data) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Dashboard unavailable.'}</p>
      </PortalCard>
    )
  }

  const matchFocusHref =
    data.matchFocus?.isManual && data.matchFocus.manualId
      ? `/games/manual/${data.matchFocus.manualId}`
      : data.matchFocus
        ? `/games/${data.matchFocus.id}`
        : '/games'

  const matchFocusRound = formatRoundLabel(data.matchFocus?.round ?? null)
  const matchFocusCompetition = data.matchFocusLeague.name || data.profile.leagueName || 'Match Day'
  const inboxPreview = [...data.actionInbox]
    .sort((a, b) => {
      if (Boolean(a.readAt) !== Boolean(b.readAt)) return a.readAt ? 1 : -1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
    .slice(0, 3)
  const recentMatchCards = data.recentGames
    .filter((game) => {
      if (!data.matchFocus) return true
      return `${game.id}:${game.manualId ?? 'tracked'}` !== `${data.matchFocus.id}:${data.matchFocus.manualId ?? 'tracked'}`
    })
    .slice(0, 2)
  const activeSeasonIndex = data.availableSeasonYears.findIndex((year) => year === data.selectedSeasonYear)
  const canGoToNewerSeason = activeSeasonIndex > 0
  const canGoToOlderSeason = activeSeasonIndex >= 0 && activeSeasonIndex < data.availableSeasonYears.length - 1
  const headerStats = [
    {
      key: 'disposals',
      label: 'Disposals',
      value: formatHeaderStat(data.profile.seasonTotals.disposals, 0),
      iconSrc: '/assets/icons/afl/hb.svg',
      iconAlt: 'Handball icon',
    },
    {
      key: 'goals',
      label: 'Goals',
      value: formatHeaderStat(data.profile.seasonTotals.goals, 0),
      iconSrc: '/assets/icons/afl/posts2.svg',
      iconAlt: 'Goals icon',
    },
    {
      key: 'games',
      label: 'Games',
      value: formatHeaderStat(data.profile.seasonGames, 0),
      iconSrc: '/assets/icons/afl/MCG.svg',
      iconAlt: 'Games icon',
    },
  ]

  return (
    <section className="grid gap-6">
      <div className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center gap-4 lg:flex-1">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#101A2D] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {data.profile.avatarUrl ? (
                <img src={data.profile.avatarUrl} alt={data.profile.name || 'User'} className="h-full w-full object-cover object-center" />
              ) : (
                <span className="text-sm font-semibold text-slate-300">
                  {(data.profile.name || 'U').slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">Welcome Back</p>
              <p className="pr-2 text-[1.45rem] font-black italic leading-[1.02] tracking-[-0.04em] text-white sm:text-[1.7rem]">
                {(data.profile.name || 'KickChasers Player').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-[720px] lg:flex-[1.1]">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(150px,0.9fr)_repeat(3,minmax(0,1fr))]">
              {headerStats.map((stat) => (
                <div
                  key={stat.key}
                  className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-[20px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.032)_0%,rgba(255,255,255,0.016)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <span
                    aria-label={stat.iconAlt}
                    role="img"
                    className="row-span-2 h-7 w-7 shrink-0 self-center bg-[#39FF88]"
                    style={{
                      WebkitMaskImage: `url(${stat.iconSrc})`,
                      maskImage: `url(${stat.iconSrc})`,
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                    }}
                  />
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                  <p className="text-center text-[1.55rem] font-black italic leading-none tracking-[-0.04em] text-white">
                    {stat.value}
                  </p>
                </div>
              ))}

              <div className="grid grid-cols-[28px_1fr_28px] items-center rounded-[20px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.028)_0%,rgba(255,255,255,0.014)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <button
                  type="button"
                  onClick={() => {
                    if (!canGoToNewerSeason) return
                    setSelectedSeasonYear(data.availableSeasonYears[activeSeasonIndex - 1] ?? null)
                  }}
                  disabled={!canGoToNewerSeason}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label="Select newer season"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0 px-2 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-600">Season</p>
                  <p className="mt-0.5 text-[1.3rem] font-black italic leading-none tracking-[0.08em] text-white">{data.selectedSeasonYear ?? '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!canGoToOlderSeason) return
                    setSelectedSeasonYear(data.availableSeasonYears[activeSeasonIndex + 1] ?? null)
                  }}
                  disabled={!canGoToOlderSeason}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label="Select older season"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-white/10" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_360px]">
        <div className="grid gap-4">

          <Quick6SummaryCard summary={data.quick6} scope={quick6Scope} onScopeChange={setQuick6Scope} />

          <div>
            <MatchScoreCard
              variant="hero"
              status={formatStatus(data.matchFocus?.status ?? null)}
              dateLabel={formatDateTime(data.matchFocus?.date ?? null)}
              roundLabel={matchFocusRound}
              venueLabel={data.matchFocus?.venue || 'Venue TBC'}
              competitionLabel={matchFocusCompetition}
              competitionLogoUrl={data.matchFocusLeague.logoUrl}
              homeTint={data.matchFocusTints.home}
              awayTint={data.matchFocusTints.away}
              title={data.matchFocus ? `${data.matchFocus.squadName || 'My Squad'} vs ${data.matchFocus.opponent || 'Opponent TBC'}` : 'Your next game will land here'}
              homeTeam={{
                name: data.matchFocus?.squadName || data.profile.squadName || 'KickChasers',
                logoUrl: data.matchFocus?.squadLogoUrl ?? null,
                label: 'Home',
              }}
              awayTeam={{
                name: data.matchFocus?.opponent || 'Opponent TBC',
                logoUrl: data.matchFocus?.opponentLogoUrl ?? null,
                label: 'Away',
              }}
              homeScore={matchFocusScore?.homeTotal ?? null}
              awayScore={matchFocusScore?.awayTotal ?? null}
              homeBreakdown={matchFocusScore?.home ?? null}
              awayBreakdown={matchFocusScore?.away ?? null}
              actionSlot={
                <Link
                  to={matchFocusHref}
                  className="btn inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#07101D] hover:bg-white/90"
                >
                  Open Match
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          </div>
        </div>

        <PortalCard
          title="Action Inbox"
          subtitle="Pending decisions, invites, and request work"
          className="bg-[linear-gradient(180deg,rgba(16,26,42,0.96)_0%,rgba(9,16,28,0.98)_100%)]"
        >
          <div className="space-y-3">
            {inboxPreview.length ? (
              inboxPreview.map((action) => {
                const status = actionStatusMeta(action)
                const StatusIcon = status.icon

                return (
                  <div key={action.id} className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${actionAccentClass(action.accent)}`}>
                        {actionTypeLabel(action)}
                      </span>
                      <span className="shrink-0 pt-0.5 text-[11px] uppercase tracking-[0.18em] text-slate-500">{formatRelative(action.createdAt)}</span>
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      <LogoBadge
                        src={action.actorAvatarUrl || action.squadLogoUrl}
                        label={action.actorName || action.actorHandle || action.squadName || 'KC'}
                        className="h-11 w-11 shrink-0 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{actionTitle(action)}</p>
                        <p className="mt-1 text-sm text-slate-400">{actionContext(action)}</p>
                        {action.actorHandle ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{formatHandle(action.actorHandle)}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                      <span className={`inline-flex min-w-0 items-center gap-2 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                        {status.label}
                      </span>
                      <Link to={actionHref(action)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9CE8BE]">
                        {action.actionLabel}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
                No pending action items right now. Squad invites, track requests, and admin decisions will surface here first.
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-[#9CE8BE] hover:bg-white/[0.05]"
          >
            Open full inbox
            <ChevronRight className="h-4 w-4" />
          </Link>
        </PortalCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)_minmax(280px,0.9fr)]">
        <PortalCard
          title="Recent Games"
          subtitle="Compact match history snapshot"
          className="p-4"
        >
          <div className="space-y-2.5">
            {data.recentGames.length ? (
              data.recentGames.slice(0, 4).map((game) => {
                const result = recentGameResult(
                  game.scoreHomeGoals,
                  game.scoreHomeBehinds,
                  game.scoreAwayGoals,
                  game.scoreAwayBehinds
                )
                const homeScore = totalScore(game.scoreHomeGoals, game.scoreHomeBehinds)
                const awayScore = totalScore(game.scoreAwayGoals, game.scoreAwayBehinds)

                return (
                  <Link
                    key={`${game.id}:${game.manualId || 'tracked'}`}
                    to={game.isManual && game.manualId ? `/games/manual/${game.manualId}` : `/games/${game.id}`}
                    className="block rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.025)_100%)] px-3.5 py-3 transition hover:border-[#39FF88]/25 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {formatShortDate(game.date)}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                            {formatRoundLabel(game.round ?? null) || (game.isManual ? 'Manual Summary' : 'Tracked Game')}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <LogoBadge src={game.squadLogoUrl} label={game.squadName || 'My Squad'} className="h-8 w-8 shrink-0 rounded-full" />
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{game.squadName || 'My Squad'}</p>
                            <p className="text-lg font-black italic leading-none tracking-[-0.04em] text-white">{homeScore ?? '-'}</p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <LogoBadge src={game.opponentLogoUrl} label={game.opponent || 'Opponent'} className="h-8 w-8 shrink-0 rounded-full" />
                            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{game.opponent || 'Opponent'}</p>
                            <p className="text-lg font-black italic leading-none tracking-[-0.04em] text-white">{awayScore ?? '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          {formatStatus(game.status)}
                        </span>
                        {result ? <p className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${result.className}`}>{result.label}</p> : null}
                        <p className="mt-2 max-w-[118px] text-xs text-slate-500">{game.venue || 'Venue TBC'}</p>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-slate-400">
                Recent tracked and manual games will appear here when match summaries are available.
              </div>
            )}
          </div>

          <Link
            to="/games"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-[#9CE8BE] hover:bg-white/[0.05]"
          >
            View all games
            <ChevronRight className="h-4 w-4" />
          </Link>
        </PortalCard>

        <PortalCard title="My Squads" subtitle="Owner and admin squads are prioritised first">
          <div className="space-y-3">
            {data.squads.length ? (
              data.squads.map((squad) => (
                <Link
                  key={squad.id}
                  to={`/squads/${squad.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#39FF88]/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    <LogoBadge src={squad.logoUrl} label={squad.name || 'Squad'} className="h-12 w-12 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{squad.name || 'Unnamed squad'}</p>
                        {squad.isOfficial && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#39FF88]/30 bg-[#39FF88]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8FFD5]">
                            <ShieldCheck className="h-3 w-3" />
                            Official
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{squad.competitionLabel} • {squad.memberCount} members</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                          {squad.role || 'member'}
                        </span>
                        {squad.attentionCount > 0 ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                            {squad.attentionCount} pending
                          </span>
                        ) : (
                          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Manage</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
                Managed squads will appear here with direct links into the squad workspace.
              </div>
            )}
          </div>

          <Link to="/squads?tab=my" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">
            Open squad workspace
            <ChevronRight className="h-4 w-4" />
          </Link>
        </PortalCard>

        <PortalCard title="Profile Snapshot" subtitle="Identity first, then recent form">
          <div className="flex items-center gap-4">
            <LogoBadge src={data.profile.avatarUrl} label={data.profile.name || 'User'} className="h-16 w-16 rounded-full" />
            <div>
              <p className="text-lg font-semibold text-white">{data.profile.name || 'KickChasers Player'}</p>
              <p className="text-sm text-slate-400">{formatHandle(data.profile.handle) || 'Handle pending'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[data.profile.clubName, data.profile.squadName, data.profile.position ? `${data.profile.position}${data.profile.playerNumber ? ` • #${data.profile.playerNumber}` : ''}` : data.profile.playerNumber ? `#${data.profile.playerNumber}` : null]
                  .filter(Boolean)
                  .join(' • ') || 'Profile identity will expand as squad data lands'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Season Games</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.profile.seasonGames}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Roles</p>
              <p className="mt-2 text-sm font-semibold text-white">{data.profile.roles.length ? data.profile.roles.join(', ') : 'Pending'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Recent Disposals</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.profile.formAverages ? data.profile.formAverages.disposals : '-'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Goals / Tackles</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {data.profile.formAverages ? `${data.profile.formAverages.goals} G • ${data.profile.formAverages.tackles} T` : 'Latest 3 pending'}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {data.profile.recentGames.length ? (
              data.profile.recentGames.map((game) => (
                <div key={`profile:${game.id}:${game.manualId || 'tracked'}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{game.opponent || 'Opponent'}</p>
                    <p className="text-xs text-slate-500">{formatShortDate(game.date)} • {formatStatus(game.status)}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-300">{game.venue || 'Venue TBC'}</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-slate-400">
                Profile form context will populate from recent games and manual entries.
              </div>
            )}
          </div>
        </PortalCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <PortalCard title="Live Around Me" subtitle="Followed squads and tracked games happening right now">
          {data.liveAroundMe.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.liveAroundMe.map((game) => (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="block overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,27,51,0.98)_0%,rgba(9,16,30,0.98)_100%)] p-4 transition hover:border-[#39FF88]/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200">
                      <Radio className="h-3.5 w-3.5" />
                      Live
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{game.linkedSquadName || 'Followed'}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex justify-center">
                        <LogoBadge src={game.homeLogoUrl} label={game.homeName || 'Home'} className="h-12 w-12 rounded-full" />
                      </div>
                      <p className="text-sm font-semibold text-white">{game.homeName}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black italic leading-none text-white">{game.homeGoals * 6 + game.homeBehinds}</div>
                      <div className="mt-1 text-xs text-slate-400">{game.homeGoals}.{game.homeBehinds} - {game.awayGoals}.{game.awayBehinds}</div>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex justify-center">
                        <LogoBadge src={game.awayLogoUrl} label={game.awayName || 'Away'} className="h-12 w-12 rounded-full" />
                      </div>
                      <p className="text-sm font-semibold text-white">{game.awayName}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDateTime(game.date)}</span>
                    <span>{game.venue || 'Venue TBC'}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
              Live followed league and squad games will surface here as soon as there is live match-day activity around your network.
            </div>
          )}
        </PortalCard>

        <PortalCard title="Leaderboard Snapshot" subtitle="Compact leaderboard teaser grounded in the live stats product">
          {data.leaderboard.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-[#39FF88]/20 bg-[#39FF88]/8 px-3 py-2 text-xs uppercase tracking-[0.22em] text-[#B8FFD5]">
                <span className="inline-flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5" />
                  Disposals Leaders
                </span>
                <span>{new Date().getFullYear()} season</span>
              </div>

              {data.leaderboard.map((row, index) => (
                <div key={row.userId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0 ? 'bg-[#39FF88] text-[#07101D]' : 'border border-white/10 bg-[#0C1627] text-slate-200'
                    }`}>
                      {row.rank}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{row.playerName}</p>
                      <p className="text-xs text-slate-500">
                        {row.clubName || row.squadName || 'KickChasers'} • {row.games} games
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{row.statValue}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Disposals</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
              Leaderboard leaders will appear here once season event totals are available for the current filters.
            </div>
          )}

          <Link to="/stats" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">
            Open full leaderboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </PortalCard>
      </div>

      <PortalCard title="Recent Activity" subtitle="Lower-priority movement across games and requests">
        <div className="grid gap-3 lg:grid-cols-2">
          {data.recentActivity.length ? (
            data.recentActivity.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
                    item.kind === 'game' ? 'bg-[#39FF88]/12 text-[#B8FFD5]' : 'bg-white/8 text-slate-300'
                  }`}>
                    {item.kind === 'game' ? <Star className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-slate-500">{formatRelative(item.createdAt)}</span>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
              Recent game summaries and request activity will populate here as the portal history builds out.
            </div>
          )}
        </div>
      </PortalCard>
    </section>
  )
}
