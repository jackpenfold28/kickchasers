import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BellDot,
  ChevronRight,
  Clock3,
  MapPin,
  Radio,
  ShieldCheck,
  Star,
  Trophy,
  Users2,
} from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { loadDashboardData, type DashboardActionItem, type DashboardData } from '@/lib/portal-dashboard'
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
  if (accent === 'green') return 'border-[#39FF88]/30 bg-[#39FF88]/10 text-[#B8FFD5]'
  if (accent === 'amber') return 'border-amber-400/30 bg-amber-300/10 text-amber-100'
  if (accent === 'red') return 'border-red-400/30 bg-red-300/10 text-red-100'
  return 'border-sky-400/30 bg-sky-300/10 text-sky-100'
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

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const next = await loadDashboardData(user.id)
        if (!cancelled) setData(next)
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
  }, [navigate])

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

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_360px]">
        <PortalCard className="overflow-hidden border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.16),transparent_34%),linear-gradient(145deg,#13213B_0%,#0F182C_48%,#0A1221_100%)] p-0">
          <div className="flex h-full flex-col justify-between gap-8 p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EA0C2]">Match Focus</p>
                <h2 className="mt-3 text-3xl font-semibold text-white lg:text-[2.2rem]">
                  {data.matchFocus ? `${data.matchFocus.squadName || 'My Squad'} vs ${data.matchFocus.opponent || 'Opponent TBC'}` : 'Your next game will land here'}
                </h2>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
                  formatStatus(data.matchFocus?.status ?? null) === 'Live'
                    ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                    : formatStatus(data.matchFocus?.status ?? null) === 'Final'
                      ? 'border-white/10 bg-white/[0.08] text-slate-100'
                      : 'border-[#39FF88]/30 bg-[#39FF88]/10 text-[#B8FFD5]'
                }`}
              >
                {formatStatus(data.matchFocus?.status ?? null) === 'Live' && <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" />}
                {formatStatus(data.matchFocus?.status ?? null)}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="flex items-center gap-4">
                <LogoBadge src={data.matchFocus?.squadLogoUrl ?? null} label={data.matchFocus?.squadName || 'My Squad'} className="h-16 w-16 rounded-[1.35rem]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">My Squad</p>
                  <p className="mt-1 text-xl font-semibold text-white">{data.matchFocus?.squadName || data.profile.squadName || 'KickChasers'}</p>
                  <p className="text-sm text-slate-400">{data.profile.clubName || 'Club to be confirmed'}</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-[#08111F]/80 px-6 py-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Scoreline</p>
                <div className="mt-3 flex items-end justify-center gap-4">
                  <div>
                    <div className="text-4xl font-black italic leading-none text-white lg:text-5xl">{matchFocusScore?.homeTotal ?? '-'}</div>
                    <div className="mt-1 text-xs text-slate-400">{matchFocusScore?.home ?? 'TBC'}</div>
                  </div>
                  <span className="pb-1 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">vs</span>
                  <div>
                    <div className="text-4xl font-black italic leading-none text-white lg:text-5xl">{matchFocusScore?.awayTotal ?? '-'}</div>
                    <div className="mt-1 text-xs text-slate-400">{matchFocusScore?.away ?? 'TBC'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-start gap-4 lg:justify-end">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Opponent</p>
                  <p className="mt-1 text-xl font-semibold text-white">{data.matchFocus?.opponent || 'Opponent TBC'}</p>
                  <p className="text-sm text-slate-400">{data.matchFocus?.venue || 'Venue TBC'}</p>
                </div>
                <LogoBadge src={data.matchFocus?.opponentLogoUrl ?? null} label={data.matchFocus?.opponent || 'Opponent'} className="h-16 w-16 rounded-[1.35rem]" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Date & Time
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">{formatDateTime(data.matchFocus?.date ?? null)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Venue
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">{data.matchFocus?.venue || 'Venue TBC'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Squad
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">{data.matchFocus?.squadName || data.profile.squadName || 'Squad to be assigned'}</p>
                </div>
              </div>

              <Link to={matchFocusHref} className="btn inline-flex items-center gap-2 self-start rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#07101D] hover:bg-white/90">
                Open Match
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </PortalCard>

        <PortalCard
          title="Action Inbox"
          subtitle="Pending decisions, invites, and request work"
          className="bg-[linear-gradient(180deg,rgba(16,26,42,0.96)_0%,rgba(9,16,28,0.98)_100%)]"
        >
          <div className="space-y-3">
            {data.actionInbox.length ? (
              data.actionInbox.map((action) => (
                <div key={action.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${actionAccentClass(action.accent)}`}>
                        {actionTypeLabel(action)}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-white">
                        {action.actorName || action.actorHandle || 'KickChasers'}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {action.squadName || (action.payload?.squad_name as string | undefined) || 'Team context pending'}
                      </p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{formatRelative(action.createdAt)}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs text-[#B8FFD5]">
                      <BellDot className="h-3.5 w-3.5" />
                      Needs attention
                    </span>
                    <Link
                      to={action.squadId ? `/squads/${action.squadId}` : '/notifications'}
                      className="btn btn-secondary rounded-xl px-3 py-1.5 text-xs"
                    >
                      {action.actionLabel}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
                No pending action items right now. Squad invites, track requests, and admin decisions will surface here first.
              </div>
            )}
          </div>

          <Link to="/notifications" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">
            Open full inbox
            <ChevronRight className="h-4 w-4" />
          </Link>
        </PortalCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)_minmax(280px,0.9fr)]">
        <PortalCard title="Recent Games" subtitle="Tracked and manual game review, ready to open">
          <div className="space-y-3">
            {data.recentGames.length ? (
              data.recentGames.map((game) => (
                <Link
                  key={`${game.id}:${game.manualId || 'tracked'}`}
                  to={game.isManual && game.manualId ? `/games/manual/${game.manualId}` : `/games/${game.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#39FF88]/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <LogoBadge src={game.squadLogoUrl} label={game.squadName || 'My Squad'} className="h-12 w-12 rounded-xl" />
                      <div>
                        <p className="text-sm font-semibold text-white">{game.squadName || 'My Squad'} vs {game.opponent || 'Opponent'}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatShortDate(game.date)} • {game.venue || 'Venue TBC'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                        {formatStatus(game.status)}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {scoreText(game.scoreHomeGoals, game.scoreHomeBehinds) && scoreText(game.scoreAwayGoals, game.scoreAwayBehinds)
                          ? `${scoreText(game.scoreHomeGoals, game.scoreHomeBehinds)} - ${scoreText(game.scoreAwayGoals, game.scoreAwayBehinds)}`
                          : game.isManual
                            ? 'Manual Summary'
                            : 'Summary Ready'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-400">
                Recent tracked and manual games will appear here when match summaries are available.
              </div>
            )}
          </div>

          <Link to="/games" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">
            View full game log
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
