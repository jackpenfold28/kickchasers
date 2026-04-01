import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Link2,
  Lock,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import RosterTable from '@/components/squads/RosterTable'
import SquadBrandingPanel from '@/components/squads/SquadBrandingPanel'
import SquadInvitesPanel from '@/components/squads/SquadInvitesPanel'
import SquadRequestsPanel from '@/components/squads/SquadRequestsPanel'
import { supabase } from '@/lib/supabase'
import {
  addGuestPlayer,
  decideGuestMergeRequest,
  decideJoinRequest,
  deleteSquad,
  followClub,
  getClubFollowState,
  getJoinRequestStatus,
  getSquadDetail,
  getSquadMembership,
  inviteByHandle,
  isClubAdmin,
  leaveSquad,
  linkGuestMemberToUser,
  listClubRoles,
  listFollowConnections,
  listGuestMergeRequests,
  listLeagueGrades,
  listMyGuestMergeRequests,
  listPendingInvitesForSquad,
  listPendingJoinRequests,
  listSquadMembers,
  removeMember,
  requestGuestMerge,
  requestToJoinSquad,
  searchProfileByHandle,
  unfollowClub,
  updateMemberNumber,
  updateMemberPosition,
  updateSquadBranding,
  updateSquadGrade,
  type ClubRole,
  type FollowConnection,
  type GuestMergeRequest,
  type JoinRequest,
  type PendingInvite,
  type SquadDetail,
  type SquadMember,
} from '@/lib/squads'

type DetailTab = 'activity' | 'team' | 'manage'

function displayMemberName(member: SquadMember) {
  if (member.profileName) return member.profileName
  if (member.handle) return member.handle.startsWith('@') ? member.handle : `@${member.handle}`
  return member.guestName || 'Unknown player'
}

function formatRole(role: string | null) {
  if (!role) return null
  return role.replaceAll('_', ' ')
}

function capabilityRows(state: {
  canInvite: boolean
  canApprove: boolean
  canManageMembers: boolean
  canManageGuests: boolean
  canEditBranding: boolean
  canChangeLeague: boolean
  canDelete: boolean
  canUseTeamSelection: boolean
}) {
  return [
    { label: 'Invite people', value: state.canInvite },
    { label: 'Approve requests', value: state.canApprove },
    { label: 'Manage members', value: state.canManageMembers },
    { label: 'Manage guest users', value: state.canManageGuests },
    { label: 'Edit branding', value: state.canEditBranding },
    { label: 'Change league / grade', value: state.canChangeLeague },
    { label: 'Delete team', value: state.canDelete },
    { label: 'Access team selection', value: state.canUseTeamSelection },
  ]
}

export default function SquadDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState<DetailTab>(initialTab === 'manage' || initialTab === 'team' ? initialTab : 'activity')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [actingRequestId, setActingRequestId] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [workingAction, setWorkingAction] = useState<string | null>(null)
  const [changingGrade, setChangingGrade] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [clubRoles, setClubRoles] = useState<ClubRole[]>([])
  const [followState, setFollowState] = useState(false)
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null)
  const [myGuestMergeRequests, setMyGuestMergeRequests] = useState<Array<{ id: string; guestSquadMemberId: string; status: string; requestedAt: string }>>([])

  const [squad, setSquad] = useState<SquadDetail | null>(null)
  const [membershipRole, setMembershipRole] = useState<string | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [connections, setConnections] = useState<FollowConnection[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [guestMergeRequests, setGuestMergeRequests] = useState<GuestMergeRequest[]>([])
  const [gradeOptions, setGradeOptions] = useState<Array<{ id: string; name: string | null; code: string | null }>>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestJersey, setGuestJersey] = useState('')
  const [selectedGuestMemberId, setSelectedGuestMemberId] = useState('')
  const [linkHandle, setLinkHandle] = useState('')
  const [foundProfile, setFoundProfile] = useState<{ userId: string; name: string | null; handle: string | null; avatarUrl: string | null } | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  const acceptedMembers = useMemo(() => members.filter((member) => member.status === 'accepted'), [members])
  const guestMembers = useMemo(
    () => acceptedMembers.filter((member) => !member.userId && Boolean(member.guestName)),
    [acceptedMembers]
  )
  const directMemberId = useMemo(
    () => acceptedMembers.find((member) => member.userId && member.userId === userId)?.id ?? null,
    [acceptedMembers, userId]
  )
  const memberCount = acceptedMembers.length
  const isOwner = Boolean(userId && squad?.ownerId && squad.ownerId === userId)
  const isAcceptedMember = membershipStatus?.toLowerCase() === 'accepted'
  const isCustomAdmin = membershipRole === 'owner' || membershipRole === 'admin'
  const isClubTracker = clubRoles.includes('tracker')
  const isClubCoach = clubRoles.includes('coach')
  const isClubSupporter = clubRoles.includes('supporter') || clubRoles.includes('member') || clubRoles.includes('club_member')
  const isOfficialAdmin = squad?.isOfficial ? isOwner || isPlatformAdmin || clubRoles.includes('admin') : false
  const canManageTeamAdminStuff = squad?.isOfficial ? isOfficialAdmin : isOwner || isCustomAdmin || isPlatformAdmin
  const canManageGuests = canManageTeamAdminStuff
  const canInvite = canManageTeamAdminStuff
  const canApprove = canManageTeamAdminStuff
  const canEditBranding = canManageTeamAdminStuff
  const canChangeLeague = squad?.isOfficial ? isPlatformAdmin : canManageTeamAdminStuff
  const canDelete = squad?.isOfficial ? isPlatformAdmin : canManageTeamAdminStuff
  const canSeeOverview = Boolean(
    isOwner ||
      isAcceptedMember ||
      (squad?.isOfficial && (followState || isClubTracker || isClubCoach || isOfficialAdmin || isClubSupporter))
  )
  const canSeeRoster = canSeeOverview
  const canUseTeamSelection = Boolean(canSeeOverview && (isOwner || directMemberId))
  const viewerState = useMemo(() => {
    if (isOwner) return 'owner'
    if (isOfficialAdmin) return 'official-admin'
    if (isCustomAdmin) return 'admin'
    if (isClubTracker) return 'tracker'
    if (isAcceptedMember) return 'member'
    if (followState || isClubSupporter || isClubCoach) return 'follower'
    return 'locked'
  }, [followState, isAcceptedMember, isClubCoach, isClubSupporter, isClubTracker, isCustomAdmin, isOfficialAdmin, isOwner])

  const guestClaimCandidates = useMemo(() => {
    if (!userId) return [] as SquadMember[]
    const ownHandle = connections.find((connection) => connection.userId === userId)?.handle?.toLowerCase() ?? null
    return guestMembers.filter((member) => {
      const guestName = member.guestName?.toLowerCase() ?? ''
      const alreadyRequested = myGuestMergeRequests.some(
        (row) => row.status === 'pending' && row.guestSquadMemberId === member.id
      )
      if (alreadyRequested) return false
      if (ownHandle && guestName.includes(ownHandle.replace(/^@/, ''))) return true
      return true
    })
  }, [connections, guestMembers, myGuestMergeRequests, userId])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }, [setSearchParams, tab])

  async function loadDetail(silent = false) {
    if (!id) return
    if (!silent) setLoading(true)
    setRefreshing(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        navigate('/sign-in', { replace: true })
        return
      }

      setUserId(user.id)

      const [{ data: platformAdmin }, detail, membership, roster, followConnections] = await Promise.all([
        supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', user.id).maybeSingle(),
        getSquadDetail(id),
        getSquadMembership(id, user.id),
        listSquadMembers(id),
        listFollowConnections(user.id),
      ])

      if (!detail) {
        setSquad(null)
        return
      }

      const [followsClub, clubRoleRows, joinStatus, inviteRows, joinRows, guestRows, myMergeRows, grades] = await Promise.all([
        getClubFollowState(detail.clubId ?? null, user.id),
        detail.clubId ? listClubRoles(detail.clubId, user.id) : Promise.resolve([] as ClubRole[]),
        getJoinRequestStatus(id, user.id),
        listPendingInvitesForSquad(id),
        listPendingJoinRequests(id),
        listGuestMergeRequests(id),
        listMyGuestMergeRequests(id, user.id),
        detail.leagueId ? listLeagueGrades(detail.leagueId) : Promise.resolve([]),
      ])

      let nextRole = membership.role?.toLowerCase() ?? null
      if (detail.isOfficial && detail.clubId) {
        try {
          const clubAdmin = await isClubAdmin(detail.clubId, user.id)
          if (clubAdmin) nextRole = 'club_admin'
        } catch {
          // keep current role if helper RPC is unavailable
        }
      }

      setSquad(detail)
      setMembershipRole(nextRole)
      setMembershipStatus(membership.status ?? null)
      setMembers(roster)
      setConnections(followConnections)
      setPendingInvites(inviteRows)
      setJoinRequests(joinRows)
      setGuestMergeRequests(guestRows)
      setIsPlatformAdmin(Boolean(platformAdmin?.profile_user_id))
      setClubRoles(clubRoleRows)
      setFollowState(followsClub)
      setJoinRequestStatus(joinStatus)
      setMyGuestMergeRequests(myMergeRows)
      setGradeOptions(grades)
      setSelectedGradeId(detail.gradeId ?? '')
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load team detail.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onUpdateNumber(memberId: string, jersey: number | null) {
    setSavingMemberId(memberId)
    try {
      await updateMemberNumber(memberId, jersey)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onUpdatePosition(memberId: string, position: string | null) {
    setSavingMemberId(memberId)
    try {
      await updateMemberPosition(memberId, position)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onRemoveMember(memberId: string) {
    if (!userId) return
    setSavingMemberId(memberId)
    try {
      await removeMember(memberId, userId)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onInvite(handle: string) {
    if (!userId || !id) return
    setSendingInvite(true)
    try {
      await inviteByHandle(userId, id, handle)
      await loadDetail(true)
    } finally {
      setSendingInvite(false)
    }
  }

  async function onJoinDecision(requestId: string, requestedRole: string | null, decision: 'approve' | 'decline') {
    setActingRequestId(requestId)
    try {
      await decideJoinRequest(requestId, decision, requestedRole)
      await loadDetail(true)
    } finally {
      setActingRequestId(null)
    }
  }

  async function onGuestMergeDecision(requestId: string, decision: 'approve' | 'decline') {
    setActingRequestId(requestId)
    try {
      await decideGuestMergeRequest(requestId, decision)
      await loadDetail(true)
    } finally {
      setActingRequestId(null)
    }
  }

  async function onSaveBranding(payload: {
    logoUrl?: string | null
    primaryColorHex?: string | null
    secondaryColorHex?: string | null
    tertiaryColorHex?: string | null
  }) {
    if (!id) return
    setSavingBranding(true)
    try {
      await updateSquadBranding(id, payload)
      await loadDetail(true)
    } finally {
      setSavingBranding(false)
    }
  }

  async function onLeave() {
    if (!id) return
    const confirmed = window.confirm('Leave this team? This removes you from the roster.')
    if (!confirmed) return

    setLeaving(true)
    try {
      await leaveSquad(id)
      navigate('/teams', { replace: true })
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'Unable to leave team.')
    } finally {
      setLeaving(false)
    }
  }

  async function onToggleFollow() {
    if (!userId || !squad?.clubId) return
    try {
      setWorkingAction('follow')
      if (followState) {
        await unfollowClub(squad.clubId, userId)
      } else {
        await followClub(squad.clubId, userId)
      }
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onRequestJoin() {
    if (!id || !userId) return
    try {
      setWorkingAction('join')
      await requestToJoinSquad(id, userId)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onRequestGuestClaim(member: SquadMember) {
    if (!id || !userId || !member.id || !member.guestName) return
    try {
      setWorkingAction(`claim-${member.id}`)
      await requestGuestMerge(id, member.id, member.guestName, userId)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onSearchHandle() {
    try {
      setLinkError(null)
      setWorkingAction('search-link')
      const profile = await searchProfileByHandle(linkHandle)
      setFoundProfile(profile)
      if (!profile) setLinkError('No profile matched that handle.')
    } finally {
      setWorkingAction(null)
    }
  }

  async function onDirectLinkGuest() {
    if (!selectedGuestMemberId || !foundProfile?.userId) return
    try {
      setLinkError(null)
      setWorkingAction('direct-link')
      await linkGuestMemberToUser(selectedGuestMemberId, foundProfile.userId)
      setSelectedGuestMemberId('')
      setFoundProfile(null)
      setLinkHandle('')
      await loadDetail(true)
    } catch (linkingError) {
      setLinkError(linkingError instanceof Error ? linkingError.message : 'Unable to link guest user.')
    } finally {
      setWorkingAction(null)
    }
  }

  async function onAddGuestPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !guestName.trim()) return

    try {
      setWorkingAction('add-guest')
      await addGuestPlayer(id, {
        name: guestName.trim(),
        email: guestEmail.trim() || null,
        jerseyNumber: guestJersey.trim() ? Number(guestJersey) : null,
      })
      setGuestName('')
      setGuestEmail('')
      setGuestJersey('')
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onChangeGrade() {
    if (!id || !selectedGradeId) return
    try {
      setChangingGrade(true)
      await updateSquadGrade(id, {
        gradeId: selectedGradeId,
        leagueId: squad?.leagueId ?? null,
        stateCode: squad?.stateCode ?? null,
      })
      await loadDetail(true)
    } finally {
      setChangingGrade(false)
    }
  }

  async function onDeleteTeam() {
    if (!id) return
    const confirmed = window.confirm(
      squad?.isOfficial
        ? 'Delete is restricted for official teams. Continue only if you are sure this official team should be removed.'
        : 'Delete this custom team? This cannot be undone.'
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      await deleteSquad(id)
      navigate('/teams', { replace: true })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete team.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading team workspace…</main>
  }

  if (!squad) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Team unavailable.'}</p>
      </PortalCard>
    )
  }

  const capabilityMatrix = capabilityRows({
    canInvite,
    canApprove,
    canManageMembers: canManageTeamAdminStuff,
    canManageGuests,
    canEditBranding,
    canChangeLeague,
    canDelete,
    canUseTeamSelection,
  })

  return (
    <section className="grid gap-6">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0E1828]">
        <div className="h-28 bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.28),transparent_45%),linear-gradient(135deg,#16243A_0%,#0C1423_100%)]" />
        <div className="-mt-10 px-6 pb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-[#0B1320]">
                {squad.logoUrl ? (
                  <img src={squad.logoUrl} alt={squad.name || 'Team'} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-slate-400">{(squad.name || 'T').slice(0, 1).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0 pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CE8BE]">Teams</p>
                  {squad.isOfficial && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#39FF88]/45 bg-[#39FF88]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A6FFCE]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Official
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-3xl font-semibold text-white">{squad.name || 'Team'}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {squad.gradeName || squad.leagueShortName || squad.leagueName || 'League TBC'}
                  {viewerState ? ` • ${viewerState.replaceAll('-', ' ')}` : ''}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">{memberCount} members</span>
                  {membershipStatus && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">{membershipStatus}</span>}
                  {clubRoles.length > 0 && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                      {clubRoles.map((role) => role.replaceAll('_', ' ')).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/teams" className="btn btn-secondary">
                Back to Teams
              </Link>
              {squad.isOfficial && squad.clubId && (
                <button className="btn btn-secondary" disabled={workingAction === 'follow'} onClick={onToggleFollow}>
                  {workingAction === 'follow' ? 'Updating…' : followState ? 'Unfollow club' : 'Follow club'}
                </button>
              )}
              {!canSeeOverview && !isAcceptedMember && (
                <button className="btn btn-primary" disabled={workingAction === 'join' || joinRequestStatus === 'pending'} onClick={onRequestJoin}>
                  {joinRequestStatus === 'pending' ? 'Join requested' : workingAction === 'join' ? 'Requesting…' : 'Request to join'}
                </button>
              )}
              {canUseTeamSelection && (
                <Link to={`/teams/${squad.id}/team-selection`} className="btn btn-secondary">
                  Team Selection
                </Link>
              )}
              {Boolean(userId && !isOwner && isAcceptedMember) && (
                <button type="button" onClick={onLeave} disabled={leaving} className="btn border-red-500/60 text-red-300">
                  {leaving ? 'Leaving…' : 'Leave team'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {([
          { key: 'activity', label: 'Activity' },
          { key: 'team', label: 'Team' },
          ...(canManageTeamAdminStuff ? [{ key: 'manage', label: 'Manage' }] : []),
        ] as Array<{ key: DetailTab; label: string }>).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`btn ${tab === item.key ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
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

      {tab === 'activity' && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <PortalCard title="Access State" subtitle="The detail surface changes with membership, follow state, and official role">
            {viewerState === 'locked' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 text-amber-200" />
                    <div>
                      <p className="font-semibold text-white">Locked outsider view</p>
                      <p className="mt-1 text-sm text-slate-300">
                        You can see the team identity, but full member and management tools stay hidden until you are rostered or, for official teams, following the club.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isAcceptedMember && (
                    <button className="btn btn-primary" disabled={workingAction === 'join' || joinRequestStatus === 'pending'} onClick={onRequestJoin}>
                      {joinRequestStatus === 'pending' ? 'Join requested' : 'Request to join'}
                    </button>
                  )}
                  {squad.isOfficial && squad.clubId && (
                    <button className="btn btn-secondary" disabled={workingAction === 'follow'} onClick={onToggleFollow}>
                      {followState ? 'Unfollow club' : 'Follow club'}
                    </button>
                  )}
                </div>
              </div>
            ) : viewerState === 'follower' ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                  <p className="font-semibold text-white">Follower / supporter access</p>
                  <p className="mt-1 text-sm text-slate-300">
                    You can follow official club activity and read the team surface, but member-only management tools stay hidden.
                  </p>
                </div>
                {squad.isOfficial && (
                  <p className="text-sm text-slate-400">
                    Following is club-level. This team appears here because you follow the club, not because you followed an arbitrary squad.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current access</p>
                  <p className="mt-2 text-lg font-semibold text-white">{viewerState.replaceAll('-', ' ')}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Members see roster and activity. Trackers and admins get expanded operational tools. Owners retain full control.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending work</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{joinRequests.length + guestMergeRequests.length + pendingInvites.length}</p>
                  <p className="mt-2 text-sm text-slate-400">Invites, join requests, and guest-link decisions are all connected to the team workspace.</p>
                </div>
              </div>
            )}
          </PortalCard>

          <PortalCard title="Guest Claim Requests" subtitle="Self-service claim stays distinct from admin direct linking">
            {guestClaimCandidates.length ? (
              <div className="space-y-3">
                {guestClaimCandidates.slice(0, 5).map((member) => (
                  <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{member.guestName}</p>
                        <p className="mt-1 text-sm text-slate-400">Rostered as a guest player. Request an admin-reviewed link if this is you.</p>
                      </div>
                      <button
                        className="btn btn-secondary"
                        disabled={workingAction === `claim-${member.id}`}
                        onClick={() => onRequestGuestClaim(member)}
                      >
                        {workingAction === `claim-${member.id}` ? 'Requesting…' : 'Request claim'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No guest claim candidates are visible for your current access state.</p>
            )}
          </PortalCard>
        </div>
      )}

      {tab === 'team' && (
        <div className="grid gap-6">
          {canSeeRoster ? (
            <RosterTable
              members={members}
              canManage={Boolean(canManageTeamAdminStuff)}
              savingMemberId={savingMemberId}
              onUpdateNumber={onUpdateNumber}
              onUpdatePosition={onUpdatePosition}
              onRemove={onRemoveMember}
            />
          ) : (
            <PortalCard title="Team" subtitle="Member tools unlock after follow or accepted access">
              <p className="text-sm text-slate-400">Roster details are hidden until your access level allows the full team surface.</p>
            </PortalCard>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <PortalCard title="Overview" subtitle="Identity, league context, and access routes">
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">League</dt>
                  <dd className="text-right text-white">{squad.leagueName || 'League TBC'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Grade</dt>
                  <dd className="text-right text-white">{squad.gradeName || 'Grade TBC'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Team type</dt>
                  <dd className="text-right text-white">{squad.isOfficial ? 'Official club team' : 'Custom squad'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Created</dt>
                  <dd className="text-right text-white">{squad.createdAt ? new Date(squad.createdAt).toLocaleDateString() : 'Unknown'}</dd>
                </div>
              </dl>
            </PortalCard>

            <PortalCard title="Team Selection" subtitle="Dedicated lineup surface with narrower access than general overview">
              <p className="text-sm text-slate-400">
                Team Selection is treated as its own surface. It is available to direct roster members and owners, not every viewer who can see the team shell.
              </p>
              {canUseTeamSelection ? (
                <Link to={`/teams/${squad.id}/team-selection`} className="btn btn-secondary mt-4 inline-flex items-center gap-2">
                  Open Team Selection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-4 text-sm text-slate-500">You do not currently have lineup access for this team.</p>
              )}
            </PortalCard>
          </div>
        </div>
      )}

      {tab === 'manage' && canManageTeamAdminStuff && (
        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <PortalCard title="Management Entry Points" subtitle="Admin and owner tools stay grouped, not flattened into one generic form">
              <div className="grid gap-3 md:grid-cols-2">
                <Link to={`/teams/${squad.id}/team-selection`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#39FF88]/35">
                  <Sparkles className="h-5 w-5 text-[#9CE8BE]" />
                  <p className="mt-3 font-semibold text-white">Team Selection</p>
                  <p className="mt-1 text-sm text-slate-400">Dedicated lineup surface with controlled access.</p>
                </Link>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <ShieldCheck className="h-5 w-5 text-[#9CE8BE]" />
                  <p className="mt-3 font-semibold text-white">Branding & Colours</p>
                  <p className="mt-1 text-sm text-slate-400">Logo, colours, and branding metadata are managed below in the branding surface.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Users className="h-5 w-5 text-[#9CE8BE]" />
                  <p className="mt-3 font-semibold text-white">Guest Users</p>
                  <p className="mt-1 text-sm text-slate-400">Guest claim approvals and direct reconciliation are kept distinct.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <UserPlus className="h-5 w-5 text-[#9CE8BE]" />
                  <p className="mt-3 font-semibold text-white">People & Requests</p>
                  <p className="mt-1 text-sm text-slate-400">Roster, invites, join requests, and role-sensitive operations live in this manage surface.</p>
                </div>
              </div>
            </PortalCard>

            <PortalCard title="Permissions Matrix" subtitle="Official and custom roles are surfaced explicitly">
              <div className="grid gap-3">
                {capabilityMatrix.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="text-sm text-slate-300">{row.label}</span>
                    <span className={`text-sm font-semibold ${row.value ? 'text-[#A6FFCE]' : 'text-slate-500'}`}>{row.value ? 'Allowed' : 'Restricted'}</span>
                  </div>
                ))}
              </div>
            </PortalCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <PortalCard title="Add Guest Player" subtitle="Game-day roster support stays connected to team membership">
              <form className="grid gap-3" onSubmit={onAddGuestPlayer}>
                <input className="input" value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Guest player name" />
                <input className="input" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Optional email" />
                <input className="input" value={guestJersey} onChange={(event) => setGuestJersey(event.target.value)} placeholder="Optional jersey number" />
                <button className="btn btn-primary" disabled={workingAction === 'add-guest' || !guestName.trim()} type="submit">
                  {workingAction === 'add-guest' ? 'Adding…' : 'Add Guest Player'}
                </button>
              </form>
            </PortalCard>

            <PortalCard title="Direct Guest Linking" subtitle="Admin reconciliation is separate from member guest-claim requests">
              <div className="grid gap-3">
                <select className="input" value={selectedGuestMemberId} onChange={(event) => setSelectedGuestMemberId(event.target.value)}>
                  <option value="">Select a guest player</option>
                  {guestMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.guestName} {member.jerseyNumber ? `#${member.jerseyNumber}` : ''}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input className="input flex-1" value={linkHandle} onChange={(event) => setLinkHandle(event.target.value)} placeholder="@playerhandle" />
                  <button className="btn btn-secondary inline-flex items-center gap-2" disabled={workingAction === 'search-link' || !linkHandle.trim()} onClick={onSearchHandle}>
                    <Link2 className="h-4 w-4" />
                    Search
                  </button>
                </div>
                {foundProfile && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-semibold text-white">{foundProfile.name || foundProfile.handle || 'Profile found'}</p>
                    <p className="mt-1 text-sm text-slate-400">{foundProfile.handle || 'No handle'}</p>
                  </div>
                )}
                {linkError && <p className="text-sm text-red-300">{linkError}</p>}
                <button
                  className="btn btn-primary"
                  disabled={workingAction === 'direct-link' || !selectedGuestMemberId || !foundProfile?.userId}
                  onClick={onDirectLinkGuest}
                >
                  {workingAction === 'direct-link' ? 'Linking…' : 'Link Guest to User'}
                </button>
              </div>
            </PortalCard>
          </div>

          <SquadRequestsPanel
            canManage={Boolean(canManageTeamAdminStuff)}
            joinRequests={joinRequests}
            guestMergeRequests={guestMergeRequests}
            actingRequestId={actingRequestId}
            onJoinDecision={onJoinDecision}
            onGuestMergeDecision={onGuestMergeDecision}
          />

          <SquadInvitesPanel
            canManage={Boolean(canInvite)}
            connections={connections}
            pendingInvites={pendingInvites}
            sending={sendingInvite}
            onInvite={onInvite}
          />

          <SquadBrandingPanel
            ownerId={userId || squad.ownerId || ''}
            squadId={squad.id}
            canManage={Boolean(canEditBranding)}
            logoUrl={squad.logoUrl}
            primaryColorHex={squad.primaryColorHex}
            secondaryColorHex={squad.secondaryColorHex}
            tertiaryColorHex={squad.tertiaryColorHex}
            saving={savingBranding}
            onSave={onSaveBranding}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <PortalCard title="League / Grade" subtitle="Official teams stay more restricted than custom squads">
              {canChangeLeague ? (
                <div className="grid gap-3">
                  <select className="input" value={selectedGradeId} onChange={(event) => setSelectedGradeId(event.target.value)}>
                    <option value="">Select grade</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name || grade.code || grade.id}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" disabled={changingGrade || !selectedGradeId} onClick={onChangeGrade}>
                    {changingGrade ? 'Saving…' : 'Update Grade'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">League and grade changes are restricted for your current role and team type.</p>
              )}
            </PortalCard>

            <PortalCard title="Delete Team" subtitle="Official teams are more restricted than custom squads">
              <p className="text-sm text-slate-400">
                {squad.isOfficial
                  ? 'Official teams should only be deleted by platform admin paths.'
                  : 'Custom teams can be deleted by owner/admin paths when no longer needed.'}
              </p>
              <button className="btn mt-4 border-red-500/60 text-red-300" disabled={!canDelete || deleting} onClick={onDeleteTeam}>
                {deleting ? 'Deleting…' : 'Delete Team'}
              </button>
            </PortalCard>
          </div>
        </div>
      )}
    </section>
  )
}
