import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Plus, Users2, X } from 'lucide-react'
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
    <Link to={`/teams/${squad.id}`} className="team-row-card block">
      <div className="flex items-center gap-4">
        <div className="team-row-logo">
            {squad.logoUrl ? (
            <img src={squad.logoUrl} alt={squad.name || 'Team'} className="h-full w-full object-cover" />
            ) : (
            <span className="text-lg font-semibold text-slate-300">{(squad.name || 'T').slice(0, 1).toUpperCase()}</span>
            )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[17px] font-bold text-white">{squad.name || 'Unnamed team'}</h3>
            {squad.isOfficial && <Check className="h-4 w-4 shrink-0 text-[#39FF88]" aria-label="Official team" />}
          </div>
          <p className="mt-1 text-sm text-slate-400">{leagueLabel}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="team-meta-pill">{role}</span>
            <span className="team-meta-pill">{squad.memberCount} members</span>
          </div>
        </div>

        <div className="team-forward">
          <ArrowRight className="h-4 w-4" />
        </div>
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
    <div className="teams-invite-card">
      <div className="flex items-start gap-4">
        <div className="team-row-logo h-12 w-12">
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
        <button className="teams-action-chip teams-action-chip--accent" disabled={working} onClick={() => onRespond(invite, true)}>
          <Check className="h-4 w-4" />
          Accept
        </button>
        <button className="teams-action-chip !text-red-300" disabled={working} onClick={() => onRespond(invite, false)}>
          <X className="h-4 w-4" />
          Decline
        </button>
        <Link to={`/teams/${invite.squadId}`} className="teams-action-chip">
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
    <section className="teams-stage grid gap-6">
      <section className="teams-header-shell">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="teams-kicker">Teams</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              One Teams surface for access, invites, following, and squad operations.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-[15px]">
              The web Teams area follows the mobile product structure: broader team access in Teams, owner/admin-focused My Squads, and club-based Following routed through official teams.
            </p>
          </div>

          <Link to="/teams/new" className="teams-action-chip teams-action-chip--accent inline-flex w-full justify-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            New Squad
          </Link>
        </div>
      </section>

      {tab === 'teams' && invites.length > 0 && (
        <PortalCard
          title="Pending Invites"
          subtitle="Accept or decline team invites without leaving the Teams surface"
          className="teams-section-card"
        >
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

      <div className="teams-segmented">
        {([
          { key: 'teams', label: 'Teams' },
          { key: 'my-squads', label: 'My Squads' },
          { key: 'following', label: 'Following' },
          ...(isPlatformAdmin ? [{ key: 'leagues', label: 'Leagues' }] : []),
        ] as Array<{ key: TabKey; label: string }>).map((item) => (
          <button
            key={item.key}
            className={`teams-segment ${tab === item.key ? 'is-active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <PortalCard className="teams-section-card">
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      {tab === 'leagues' ? (
        <PortalCard title="Leagues" subtitle="Platform admin league tools stay available while Teams remains the product entrypoint" className="teams-section-card">
          <p className="max-w-2xl text-sm text-slate-400">
            League and official directory management remain admin-only. Use the admin console for approvals, league maintenance, and official team governance.
          </p>
          <Link to="/admin" className="teams-action-chip mt-4 inline-flex items-center gap-2">
            Open Admin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </PortalCard>
      ) : (
        <div className="grid gap-4">
          {activeList.length ? (
            activeList.map((squad) => <TeamCard key={squad.id} squad={squad} userId={userId} />)
          ) : (
            <PortalCard className="teams-section-card">
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
