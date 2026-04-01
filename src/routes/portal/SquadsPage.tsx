import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Plus, ShieldCheck, Users2, X } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { supabase } from '@/lib/supabase'
import {
  listFollowedClubs,
  listMySquads,
  listPendingInvitesForUser,
  respondInvite,
  type SquadSummary,
  type TeamInvite,
} from '@/lib/squads'

type TabKey = 'teams' | 'my-squads' | 'following' | 'leagues'

function roleLabel(squad: SquadSummary, userId: string | null) {
  const role = squad.role?.toLowerCase() ?? null
  if (squad.ownerId && userId && squad.ownerId === userId) return 'Owner'
  if (role === 'owner') return 'Owner'
  if (role === 'admin') return 'Admin'
  if (role === 'member') return 'Member'
  if (squad.status === 'following') return 'Following'
  return squad.isOfficial ? 'Official access' : 'Team access'
}

function TeamCard({ squad, userId }: { squad: SquadSummary; userId: string | null }) {
  const leagueLabel = squad.gradeName || squad.leagueShortName || squad.leagueName || 'League TBC'
  const role = roleLabel(squad, userId)

  return (
    <Link
      to={`/teams/${squad.id}`}
      className="group block rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 transition hover:border-[#39FF88]/40 hover:bg-[linear-gradient(180deg,rgba(57,255,136,0.10),rgba(255,255,255,0.05))]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[#0D1525]">
            {squad.logoUrl ? (
              <img src={squad.logoUrl} alt={squad.name || 'Team'} className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-semibold text-slate-400">{(squad.name || 'T').slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-white">{squad.name || 'Unnamed team'}</h3>
              {squad.isOfficial && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#39FF88]/45 bg-[#39FF88]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A6FFCE]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Official
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">{leagueLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">{role}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">{squad.memberCount} members</span>
            </div>
          </div>
        </div>

        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-[#39FF88]" />
      </div>
    </Link>
  )
}

function InviteCard({
  invite,
  working,
  onRespond,
}: {
  invite: TeamInvite
  working: boolean
  onRespond: (invite: TeamInvite, accept: boolean) => Promise<void>
}) {
  return (
    <div className="rounded-[24px] border border-[#39FF88]/20 bg-[#0D1828] p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#101B2B]">
          {invite.squadLogoUrl ? (
            <img src={invite.squadLogoUrl} alt={invite.squadName || 'Team invite'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-slate-400">{(invite.squadName || 'T').slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CE8BE]">Pending Invite</p>
          <h3 className="mt-1 truncate text-base font-semibold text-white">{invite.squadName || 'Team invite'}</h3>
          <p className="mt-1 text-sm text-slate-400">{new Date(invite.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-primary inline-flex items-center gap-2" disabled={working} onClick={() => onRespond(invite, true)}>
          <Check className="h-4 w-4" />
          Accept
        </button>
        <button className="btn inline-flex items-center gap-2 border-red-500/60 text-red-300" disabled={working} onClick={() => onRespond(invite, false)}>
          <X className="h-4 w-4" />
          Decline
        </button>
        <Link to={`/teams/${invite.squadId}`} className="btn btn-secondary">
          View team
        </Link>
      </div>
    </div>
  )
}

export default function SquadsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromQuery = searchParams.get('tab')
  const initialTab: TabKey =
    tabFromQuery === 'teams' || tabFromQuery === 'my-squads' || tabFromQuery === 'following' || tabFromQuery === 'leagues'
      ? (tabFromQuery as TabKey)
      : 'teams'

  const [loading, setLoading] = useState(true)
  const [workingInviteId, setWorkingInviteId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [allTeams, setAllTeams] = useState<SquadSummary[]>([])
  const [following, setFollowing] = useState<SquadSummary[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }, [setSearchParams, tab])

  async function loadPage(uid?: string | null) {
    const nextUserId = uid ?? userId
    if (!nextUserId) return

    const [{ data: platformAdmin }, teams, followed, pendingInvites] = await Promise.all([
      supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', nextUserId).maybeSingle(),
      listMySquads(nextUserId),
      listFollowedClubs(nextUserId),
      listPendingInvitesForUser(nextUserId),
    ])

    setAllTeams(teams)
    setFollowing(followed)
    setInvites(pendingInvites)
    setIsPlatformAdmin(Boolean(platformAdmin?.profile_user_id))
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (cancelled) return
        setUserId(user.id)
        await loadPage(user.id)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load teams.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const mySquads = useMemo(() => {
    if (!userId) return [] as SquadSummary[]
    return allTeams.filter((team) => {
      const role = team.role?.toLowerCase() ?? null
      return team.ownerId === userId || role === 'owner' || role === 'admin'
    })
  }, [allTeams, userId])

  const activeList = useMemo(() => {
    if (tab === 'teams') return allTeams
    if (tab === 'following') return following
    if (tab === 'leagues') return [] as SquadSummary[]
    return mySquads
  }, [allTeams, following, mySquads, tab])

  async function onRespond(invite: TeamInvite, accept: boolean) {
    if (!userId) return
    try {
      setWorkingInviteId(invite.memberId)
      setError(null)
      await respondInvite(userId, invite.memberId, accept)
      await loadPage(userId)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update invite.')
    } finally {
      setWorkingInviteId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading teams…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9CE8BE]">Teams</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Run team access, invites, following, and squad management from one portal workspace.</h2>
            <p className="mt-3 text-sm text-slate-400">
              The web Teams area follows the mobile product structure: broader team access in Teams, owner/admin-focused My Squads, and club-based Following routed through official teams.
            </p>
          </div>

          <Link to="/teams/new" className="btn btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            New Squad
          </Link>
        </div>
      </PortalCard>

      {tab === 'teams' && invites.length > 0 && (
        <PortalCard title="Pending Invites" subtitle="Accept or decline team invites without leaving the Teams surface">
          <div className="grid gap-4 xl:grid-cols-2">
            {invites.map((invite) => (
              <InviteCard
                key={invite.memberId}
                invite={invite}
                working={workingInviteId === invite.memberId}
                onRespond={onRespond}
              />
            ))}
          </div>
        </PortalCard>
      )}

      <div className="flex flex-wrap gap-2">
        {([
          { key: 'teams', label: 'Teams' },
          { key: 'my-squads', label: 'My Squads' },
          { key: 'following', label: 'Following' },
          ...(isPlatformAdmin ? [{ key: 'leagues', label: 'Leagues' }] : []),
        ] as Array<{ key: TabKey; label: string }>).map((item) => (
          <button
            key={item.key}
            className={`btn ${tab === item.key ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      {tab === 'leagues' ? (
        <PortalCard title="Leagues" subtitle="Platform admin league tools stay available while Teams remains the product entrypoint">
          <p className="max-w-2xl text-sm text-slate-400">
            League and official directory management remain admin-only. Use the admin console for approvals, league maintenance, and official team governance.
          </p>
          <Link to="/admin" className="btn btn-secondary mt-4 inline-flex items-center gap-2">
            Open Admin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </PortalCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activeList.length ? (
            activeList.map((squad) => <TeamCard key={squad.id} squad={squad} userId={userId} />)
          ) : (
            <PortalCard className="xl:col-span-2">
              <div className="flex items-center gap-3 text-slate-400">
                <Users2 className="h-5 w-5" />
                <p>
                  {tab === 'teams'
                    ? 'No teams yet. Accepted memberships and official access will appear here, with invites surfaced above.'
                    : tab === 'my-squads'
                      ? 'No owner/admin squads yet. Create a squad to start managing roster and requests.'
                      : 'No followed clubs yet. Club-level following will surface official teams here.'}
                </p>
              </div>
            </PortalCard>
          )}
        </div>
      )}
    </section>
  )
}
