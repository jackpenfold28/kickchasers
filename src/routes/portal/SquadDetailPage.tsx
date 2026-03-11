import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import SquadHeader from '@/components/squads/SquadHeader'
import RosterTable from '@/components/squads/RosterTable'
import SquadInvitesPanel from '@/components/squads/SquadInvitesPanel'
import SquadRequestsPanel from '@/components/squads/SquadRequestsPanel'
import SquadBrandingPanel from '@/components/squads/SquadBrandingPanel'
import { supabase } from '@/lib/supabase'
import {
  decideGuestMergeRequest,
  decideJoinRequest,
  getSquadDetail,
  getSquadMembership,
  inviteByHandle,
  isClubAdmin,
  leaveSquad,
  listFollowConnections,
  listGuestMergeRequests,
  listPendingInvitesForSquad,
  listPendingJoinRequests,
  listSquadMembers,
  removeMember,
  updateMemberNumber,
  updateMemberPosition,
  updateSquadBranding,
  type FollowConnection,
  type GuestMergeRequest,
  type JoinRequest,
  type PendingInvite,
  type SquadDetail,
  type SquadMember,
} from '@/lib/squads'

type DetailTab = 'overview' | 'roster' | 'requests' | 'invites' | 'branding'

export default function SquadDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [actingRequestId, setActingRequestId] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)

  const [squad, setSquad] = useState<SquadDetail | null>(null)
  const [membershipRole, setMembershipRole] = useState<string | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [connections, setConnections] = useState<FollowConnection[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [guestMergeRequests, setGuestMergeRequests] = useState<GuestMergeRequest[]>([])

  const [tab, setTab] = useState<DetailTab>('overview')
  const [error, setError] = useState<string | null>(null)

  const memberCount = useMemo(() => members.filter((member) => member.status === 'accepted').length, [members])

  const isOwner = Boolean(userId && squad?.ownerId && squad.ownerId === userId)
  const isSquadAdmin = membershipRole === 'owner' || membershipRole === 'admin'
  const canManageCustom = isOwner || isSquadAdmin || isPlatformAdmin
  const canManageOfficial = Boolean(squad?.isOfficial && (isOwner || isPlatformAdmin || membershipRole === 'club_admin'))
  const canManage = squad?.isOfficial ? canManageOfficial : canManageCustom
  const canLeave = Boolean(userId && !isOwner && membershipRole)

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

      const [{ data: platformAdmin }] = await Promise.all([
        supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', user.id).maybeSingle(),
      ])

      const detail = await getSquadDetail(id)
      if (!detail) {
        setError('Squad not found.')
        setSquad(null)
        return
      }

      const [membership, roster, inviteRows, joinRows, guestRows, followConnections] = await Promise.all([
        getSquadMembership(id, user.id),
        listSquadMembers(id),
        listPendingInvitesForSquad(id),
        listPendingJoinRequests(id),
        listGuestMergeRequests(id),
        listFollowConnections(user.id),
      ])

      let nextRole = membership.role?.toLowerCase() ?? null
      if (detail.isOfficial && detail.clubId) {
        try {
          const clubAdmin = await isClubAdmin(detail.clubId, user.id)
          if (clubAdmin) nextRole = 'club_admin'
        } catch {
          // keep default role on f_is_club_admin failure
        }
      }

      setSquad(detail)
      setMembers(roster)
      setPendingInvites(inviteRows)
      setJoinRequests(joinRows)
      setGuestMergeRequests(guestRows)
      setConnections(followConnections)
      setMembershipRole(nextRole)
      setIsPlatformAdmin(Boolean(platformAdmin?.profile_user_id))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load squad detail.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

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
    const confirmed = window.confirm('Leave squad? This will remove you from this squad roster.')
    if (!confirmed) return

    setLeaving(true)
    try {
      await leaveSquad(id)
      navigate('/squads', { replace: true })
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'Unable to leave squad.')
    } finally {
      setLeaving(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading squad workspace…</main>
  }

  if (!squad) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Squad unavailable.'}</p>
      </PortalCard>
    )
  }

  return (
    <section className="grid gap-6">
      <SquadHeader
        squad={squad}
        memberCount={memberCount}
        viewerRole={membershipRole}
        canManage={Boolean(canManage)}
        canLeave={canLeave}
        leaving={leaving}
        onLeave={onLeave}
      />

      <div className="flex flex-wrap gap-2">
        {(['overview', 'roster', 'requests', 'invites', 'branding'] as DetailTab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn ${tab === key ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-4">
          <PortalCard title="Overview" subtitle="Squad identity and management summary" className="lg:col-span-2">
            <p className="text-sm text-slate-300">{squad.name}</p>
            <p className="mt-1 text-sm text-slate-400">{squad.leagueName || 'League TBD'}</p>
            <p className="mt-3 text-xs text-slate-500">Role-aware actions and data wiring are active for roster, invites, requests, and branding.</p>
          </PortalCard>
          <PortalCard title="Members">
            <p className="text-3xl font-semibold text-white">{memberCount}</p>
          </PortalCard>
          <PortalCard title="Pending Work">
            <p className="text-sm text-slate-300">{joinRequests.length + guestMergeRequests.length + pendingInvites.length}</p>
            <p className="text-xs text-slate-500">join + merge + invite items</p>
          </PortalCard>
        </div>
      )}

      {tab === 'roster' && (
        <RosterTable
          members={members}
          canManage={Boolean(canManage)}
          savingMemberId={savingMemberId}
          onUpdateNumber={onUpdateNumber}
          onUpdatePosition={onUpdatePosition}
          onRemove={onRemoveMember}
        />
      )}

      {tab === 'requests' && (
        <SquadRequestsPanel
          canManage={Boolean(canManage)}
          joinRequests={joinRequests}
          guestMergeRequests={guestMergeRequests}
          actingRequestId={actingRequestId}
          onJoinDecision={onJoinDecision}
          onGuestMergeDecision={onGuestMergeDecision}
        />
      )}

      {tab === 'invites' && (
        <SquadInvitesPanel
          canManage={Boolean(canManage)}
          connections={connections}
          pendingInvites={pendingInvites}
          sending={sendingInvite}
          onInvite={onInvite}
        />
      )}

      {tab === 'branding' && userId && (
        <SquadBrandingPanel
          ownerId={userId}
          squadId={squad.id}
          canManage={Boolean(canManage)}
          logoUrl={squad.logoUrl}
          primaryColorHex={squad.primaryColorHex}
          secondaryColorHex={squad.secondaryColorHex}
          tertiaryColorHex={squad.tertiaryColorHex}
          saving={savingBranding}
          onSave={onSaveBranding}
        />
      )}

      {(error || refreshing) && (
        <PortalCard>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {refreshing && <p className="text-sm text-slate-400">Refreshing squad data…</p>}
        </PortalCard>
      )}
    </section>
  )
}
