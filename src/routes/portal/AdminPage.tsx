import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Users, Wrench } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import GameLogCard from '@/components/portal/games/GameLogCard'
import { listPlatformGames, type GameLogRow } from '@/lib/portal-games'
import {
  fetchAdminOverviewStats,
  listDirectoryRequests,
  listOfficialSquads,
  listPlatformActivity,
  listPlatformLeagues,
  listRecentAdminUsers,
  listSquadAdminRequests,
  type DirectoryRequest,
  type LeagueAdminRow,
  type OfficialSquadAdminRow,
  type PlatformActivityItem,
  type RecentAdminUser,
  type SquadAdminRequest,
} from '@/lib/portal-admin'
import { supabase } from '@/lib/supabase'
import { EmptyState, formatDateTime, formatRelative, SectionHeading, StatusPill } from './admin/admin-ui'

type AdminDashboardData = {
  stats: Awaited<ReturnType<typeof fetchAdminOverviewStats>> | null
  squadRequests: SquadAdminRequest[]
  directoryRequests: DirectoryRequest[]
  officialSquads: OfficialSquadAdminRow[]
  leagues: LeagueAdminRow[]
  recentGames: GameLogRow[]
  recentUsers: RecentAdminUser[]
  activity: PlatformActivityItem[]
}

function requestTitle(request: DirectoryRequest) {
  return String(
    request.payload.club_name ??
      request.payload.league_name ??
      request.payload.grade_name ??
      request.payload.squad_name ??
      'Directory request'
  )
}

function requestKindLabel(kind: string) {
  return kind.replace(/_/g, ' ')
}

function userInitial(value: string | null) {
  return (value || 'U').slice(0, 1).toUpperCase()
}

function userContext(user: RecentAdminUser) {
  const parts = [user.stateCode, user.clubName, user.leagueShortName || user.leagueName].filter(Boolean)
  return parts.join(' • ') || 'Profile context pending'
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminDashboardData>({
    stats: null,
    squadRequests: [],
    directoryRequests: [],
    officialSquads: [],
    leagues: [],
    recentGames: [],
    recentUsers: [],
    activity: [],
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const [stats, squadRequests, directoryRequests, officialSquads, leagues, recentGames, recentUsers, activity] =
          await Promise.all([
            fetchAdminOverviewStats(),
            listSquadAdminRequests(['pending']),
            listDirectoryRequests(['pending']),
            listOfficialSquads(4),
            listPlatformLeagues(4),
            listPlatformGames(3),
            listRecentAdminUsers(6),
            listPlatformActivity(8),
          ])

        if (!cancelled) {
          setData({
            stats,
            squadRequests,
            directoryRequests,
            officialSquads,
            leagues,
            recentGames,
            recentUsers,
            activity,
          })
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load platform dashboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading platform admin…</main>
  }

  if (error && !data.stats) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error}</p>
      </PortalCard>
    )
  }

  const pendingRequests = data.squadRequests.length + data.directoryRequests.length

  return (
    <section className="grid gap-6">
      <PortalCard className="overflow-hidden border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.12),transparent_28%),linear-gradient(135deg,#0B1324,#0E172A_58%,#111E33)] p-6 sm:p-7">
        <SectionHeading
          eyebrow="Platform Admin"
          title="Platform dashboard for approvals, official data, tracked games, new accounts, and recent platform movement."
          description="This stays grounded in the current KickChasers admin model. It previews what needs attention now, then hands off to dedicated admin pages for deeper management."
          actions={
            <>
              <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]">
                <Users className="h-4 w-4 text-[#39FF88]" />
                Users
              </Link>
              <Link to="/admin/manual-feed-post" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.08]">
                <Wrench className="h-4 w-4 text-[#39FF88]" />
                Manual feed tool
              </Link>
            </>
          }
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      {data.stats ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ['New users (30d)', data.stats.newUsers30d],
            ['Onboarding completed', data.stats.onboardingCompleted],
            ['Games tracked', data.stats.gamesTracked],
            ['Official squads', data.stats.officialSquadsCount],
            ['Pending requests', pendingRequests],
            ['Leagues', data.stats.leaguesCount],
          ].map(([label, value]) => (
            <PortalCard key={label} className="bg-[#0F192C]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
              <p className="mt-4 text-3xl font-semibold text-white">{new Intl.NumberFormat('en-AU').format(Number(value))}</p>
            </PortalCard>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PortalCard className="bg-[#0F192C]">
          <SectionHeading
            title="Approval inbox"
            description="Preview of current pending requests. Open the full inbox for the complete queue."
            actions={<Link to="/admin/requests" className="inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">View all requests <ArrowRight className="h-4 w-4" /></Link>}
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Official squad admin requests</p>
              {data.squadRequests.slice(0, 3).length ? data.squadRequests.slice(0, 3).map((request) => (
                <Link key={request.id} to={`/admin/requests/squad-admin/${request.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={request.status} />
                    <span className="text-xs text-slate-500">{formatRelative(request.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{request.squad?.name || 'Official squad request'}</p>
                  <p className="mt-1 text-sm text-slate-400">{request.requester?.handle || request.requester?.name || 'Requester'}</p>
                </Link>
              )) : <EmptyState label="No pending official admin requests." />}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Directory requests</p>
              {data.directoryRequests.slice(0, 4).length ? data.directoryRequests.slice(0, 4).map((request) => (
                <Link key={request.id} to={`/admin/requests/directory/${request.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={request.status} />
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {requestKindLabel(request.requestKind)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{requestTitle(request)}</p>
                  <p className="mt-1 text-sm text-slate-400">{request.requester?.handle || request.requester?.name || 'Requester'}</p>
                </Link>
              )) : <EmptyState label="No pending directory requests." />}
            </div>
          </div>
        </PortalCard>

        <PortalCard className="bg-[#0F192C]">
          <SectionHeading
            title="Official data operations"
            description="Preview of official squads and leagues. Use the full pages for broader management."
            actions={
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/official-squads" className="text-sm font-medium text-[#9CE8BE]">View all official squads</Link>
                <Link to="/admin/leagues" className="text-sm font-medium text-[#9CE8BE]">View all leagues</Link>
              </div>
            }
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Official squads</p>
              {data.officialSquads.length ? data.officialSquads.map((squad) => (
                <Link key={squad.id} to={`/teams/${squad.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${squad.archivedAt ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]'}`}>
                      {squad.archivedAt ? 'Archived' : 'Active'}
                    </span>
                    <span className="text-xs text-slate-500">{formatDateTime(squad.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{squad.name || 'Official squad'}</p>
                  <p className="mt-1 text-sm text-slate-400">{squad.clubName || 'Club'} • {squad.leagueShortName || squad.leagueName || 'League'}</p>
                </Link>
              )) : <EmptyState label="No official squads found." />}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">Leagues</p>
              {data.leagues.length ? data.leagues.map((league) => (
                <Link key={league.id} to={`/leagues/${league.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${league.isActive ? 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}>
                      {league.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-slate-500">{league.stateCode || '—'}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{league.name || 'League'}</p>
                  <p className="mt-1 text-sm text-slate-400">{league.clubCount} clubs • {league.officialSquadCount} official squads</p>
                </Link>
              )) : <EmptyState label="No leagues found." />}
            </div>
          </div>
        </PortalCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PortalCard className="bg-[#0F192C]">
          <SectionHeading
            title="Recent tracked games"
            description="Latest tracked and manual games across the platform."
            actions={<Link to="/admin/games" className="inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">View all tracked games <ArrowRight className="h-4 w-4" /></Link>}
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.recentGames.length ? data.recentGames.map((row) => (
              <GameLogCard key={`${row.id}:${row.manualId || 'tracked'}`} row={row} />
            )) : <EmptyState label="No tracked games found." />}
          </div>
        </PortalCard>

        <PortalCard className="bg-[#0F192C]">
          <SectionHeading
            title="New users"
            description="Recent accounts with onboarding state and profile context."
            actions={<Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-medium text-[#9CE8BE]">View all users <ArrowRight className="h-4 w-4" /></Link>}
          />
          <div className="mt-6 grid gap-3">
            {data.recentUsers.length ? data.recentUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#152238] text-sm font-semibold text-white">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name || 'User'} className="h-full w-full rounded-full object-cover" /> : userInitial(user.name || user.handle)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name || 'Unnamed user'}</p>
                  <p className="truncate text-sm text-slate-400">{user.handle ? `@${user.handle.replace(/^@+/, '')}` : 'Handle pending'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{userContext(user)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${user.onboardingCompletedAt ? 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}>
                    {user.onboardingCompletedAt ? 'Onboarded' : 'Incomplete'}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(user.createdAt)}</p>
                </div>
              </div>
            )) : <EmptyState label="No recent users found." />}
          </div>
        </PortalCard>
      </div>

      <PortalCard className="bg-[#0F192C]">
        <SectionHeading
          title="Recent platform activity"
          description="Grounded platform-owner activity only: request creation, hidden posts, and official squad archiving."
          actions={<div className="inline-flex items-center gap-2 text-sm font-medium text-slate-400"><Sparkles className="h-4 w-4 text-[#39FF88]" /> Live from current admin-accessible data</div>}
        />
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {data.activity.length ? data.activity.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9CE8BE]">{item.type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm text-slate-400">{item.context}</p>
            </div>
          )) : <EmptyState label="No recent platform activity found." />}
        </div>
      </PortalCard>
    </section>
  )
}
