import { useCallback, useEffect, useMemo, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import {
  cancelRoleRequest,
  createRoleRequest,
  getOfficialSquadIdForClub,
  listMyRoleRequests,
  type RoleRequestRow,
} from '@/lib/account-management'
import { supabase } from '@/lib/supabase'
import type { RequestableRole } from '@/lib/profile-utils'

type RoleStatus = 'active' | 'pending' | 'approved' | 'declined' | 'cancelled' | 'none'

type RoleOption = {
  key: RequestableRole
  label: string
  description: string
}

const ROLE_OPTIONS: RoleOption[] = [
  { key: 'player', label: 'Player', description: 'Appear on official roster and player stats.' },
  { key: 'coach', label: 'Coach', description: 'Manage squads and operational workflows.' },
  { key: 'tracker', label: 'Tracker', description: 'Track and submit match events.' },
]

function getRoleStatus(requests: RoleRequestRow[], role: RequestableRole, isActive: boolean): RoleStatus {
  if (isActive) return 'active'
  const latest = requests
    .filter((request) => request.requested_role === role)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

  if (!latest) return 'none'
  return latest.status
}

function toLabel(status: RoleStatus): string {
  if (status === 'active') return 'Active'
  if (status === 'pending') return 'Pending approval'
  if (status === 'approved') return 'Approved'
  if (status === 'declined') return 'Declined'
  if (status === 'cancelled') return 'Cancelled'
  return 'Not requested'
}

export default function RolesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [officialSquadId, setOfficialSquadId] = useState<string | null>(null)
  const [requests, setRequests] = useState<RoleRequestRow[]>([])
  const [activeRoles, setActiveRoles] = useState<Record<RequestableRole, boolean>>({
    player: false,
    coach: false,
    tracker: false,
  })
  const [toggles, setToggles] = useState<Record<RequestableRole, boolean>>({
    player: false,
    coach: false,
    tracker: false,
  })

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadRoleState = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        setUserId(null)
        setOfficialSquadId(null)
        setRequests([])
        setActiveRoles({ player: false, coach: false, tracker: false })
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('home_club_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') throw profileError

      const clubId = (profile as { home_club_id?: string | null } | null)?.home_club_id ?? null
      const squadId = await getOfficialSquadIdForClub(clubId)
      setOfficialSquadId(squadId)

      if (!squadId) {
        setRequests([])
        setActiveRoles({ player: false, coach: false, tracker: false })
        setLoading(false)
        return
      }

      const [memberRes, clubRoleRes, roleRequests] = await Promise.all([
        supabase
          .from('squad_members')
          .select('role,status')
          .eq('squad_id', squadId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        clubId
          ? supabase.from('club_roles').select('role').eq('club_id', clubId).eq('user_id', user.id).in('role', ['coach', 'tracker'])
          : Promise.resolve({ data: [], error: null }),
        listMyRoleRequests(squadId, user.id),
      ])

      if (memberRes.error && memberRes.error.code !== 'PGRST116') throw memberRes.error
      if (clubRoleRes.error && (clubRoleRes.error as { code?: string }).code !== 'PGRST116') throw clubRoleRes.error

      const member = memberRes.data as { role?: string | null; status?: string | null } | null
      const roleRows = (clubRoleRes.data ?? []) as Array<{ role?: string | null }>

      const playerActive = member?.status === 'accepted' && member?.role === 'player'
      const coachActive = roleRows.some((row) => row.role === 'coach')
      const trackerActive = roleRows.some((row) => row.role === 'tracker')

      const nextActive = {
        player: Boolean(playerActive),
        coach: Boolean(coachActive),
        tracker: Boolean(trackerActive),
      }

      setActiveRoles(nextActive)
      setRequests(roleRequests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load role requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRoleState()
  }, [loadRoleState])

  const roleStatuses = useMemo(
    () => ({
      player: getRoleStatus(requests, 'player', activeRoles.player),
      coach: getRoleStatus(requests, 'coach', activeRoles.coach),
      tracker: getRoleStatus(requests, 'tracker', activeRoles.tracker),
    }),
    [activeRoles.coach, activeRoles.player, activeRoles.tracker, requests]
  )

  useEffect(() => {
    setToggles({
      player: roleStatuses.player === 'active' || roleStatuses.player === 'pending',
      coach: roleStatuses.coach === 'active' || roleStatuses.coach === 'pending',
      tracker: roleStatuses.tracker === 'active' || roleStatuses.tracker === 'pending',
    })
  }, [roleStatuses.coach, roleStatuses.player, roleStatuses.tracker])

  async function save() {
    setError(null)
    setMessage(null)

    const id = userId
    const squadId = officialSquadId

    if (!id) {
      setError('Sign in again to manage role requests.')
      return
    }

    if (!squadId) {
      setError('No official squad found for your selected club.')
      return
    }

    setSaving(true)

    try {
      const requestsByRole = new Map<RequestableRole, RoleRequestRow[]>()
      requests.forEach((request) => {
        const current = requestsByRole.get(request.requested_role) ?? []
        current.push(request)
        requestsByRole.set(request.requested_role, current)
      })

      const actions: Array<Promise<unknown>> = []

      ;(['player', 'coach', 'tracker'] as RequestableRole[]).forEach((role) => {
        const status = roleStatuses[role]
        const toggleOn = toggles[role]
        const pendingRequest = (requestsByRole.get(role) ?? []).find((request) => request.status === 'pending')

        if (toggleOn && status !== 'active' && status !== 'pending') {
          actions.push(createRoleRequest(squadId, id, role))
        }
        if (!toggleOn && status === 'pending' && pendingRequest) {
          actions.push(cancelRoleRequest(pendingRequest.id, id))
        }
      })

      if (!actions.length) {
        setMessage('No changes to save.')
        setSaving(false)
        return
      }

      const results = await Promise.allSettled(actions)
      const failed = results.some((result) => result.status === 'rejected')
      if (failed) {
        setError('Some role updates failed. Please retry.')
      } else {
        setMessage('Role requests updated.')
      }

      await loadRoleState()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update role requests.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalCard title="Role Requests" subtitle="Request player, coach, and tracker permissions">
      {loading ? (
        <p className="text-sm text-slate-400">Loading role requests…</p>
      ) : !officialSquadId ? (
        <p className="text-sm text-slate-300">
          Select an official club in onboarding/profile before requesting player, coach, or tracker roles.
        </p>
      ) : (
        <div className="space-y-4">
          {ROLE_OPTIONS.map((role) => {
            const status = roleStatuses[role.key]
            const latestDeclined = requests
              .filter((request) => request.requested_role === role.key && request.status === 'declined')
              .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]

            return (
              <div key={role.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{role.label}</h3>
                    <p className="mt-1 text-xs text-slate-400">{role.description}</p>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={toggles[role.key]}
                      onChange={(event) =>
                        setToggles((prev) => ({
                          ...prev,
                          [role.key]: event.target.checked,
                        }))
                      }
                      disabled={saving || status === 'active'}
                    />
                    <span>{toLabel(status)}</span>
                  </label>
                </div>

                {latestDeclined?.decision_reason && (
                  <p className="mt-2 text-xs text-red-300">Reason: {latestDeclined.decision_reason}</p>
                )}
              </div>
            )
          })}

          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}

          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Update Role Requests'}
          </button>
        </div>
      )}
    </PortalCard>
  )
}
