import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import {
  approveDirectoryRequest,
  approveSquadAdminRequest,
  listDirectoryRequests,
  listSquadAdminRequests,
  revokeSquadAdminRequest,
  type DirectoryRequest,
  type RequestStatus,
  type SquadAdminRequest,
  updateDirectoryRequestStatus,
  updateSquadAdminRequestStatus,
} from '@/lib/portal-admin'
import { supabase } from '@/lib/supabase'
import { AdminActionButton, EmptyState, formatDateTime, SectionHeading, StatusPill } from './admin-ui'

const ALL_STATUSES: RequestStatus[] = ['pending', 'approved', 'declined', 'revoked', 'archived', 'cancelled']

function payloadEntries(payload: Record<string, unknown> | null | undefined) {
  return Object.entries(payload ?? {})
}

function squadActions(status: RequestStatus) {
  if (status === 'pending') return ['approved', 'declined'] as const
  if (status === 'approved') return ['revoked', 'archived'] as const
  if (status === 'archived') return [] as const
  return ['archived'] as const
}

function directoryActions(status: RequestStatus) {
  if (status === 'pending') return ['approved', 'declined'] as const
  if (status === 'archived') return [] as const
  return ['archived'] as const
}

function actionLabel(status: RequestStatus) {
  if (status === 'approved') return 'Approve'
  if (status === 'declined') return 'Decline'
  if (status === 'revoked') return 'Revoke'
  if (status === 'archived') return 'Archive'
  return status
}

export default function AdminRequestDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ requestType: string; requestId: string }>()
  const requestType = params.requestType ?? null
  const requestId = params.requestId ?? null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingUserId, setActingUserId] = useState<string | null>(null)
  const [busyStatus, setBusyStatus] = useState<RequestStatus | null>(null)
  const [squadRequest, setSquadRequest] = useState<SquadAdminRequest | null>(null)
  const [directoryRequest, setDirectoryRequest] = useState<DirectoryRequest | null>(null)

  async function loadPage() {
    if (!requestId) return
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setActingUserId(user.id)

      if (requestType === 'squad-admin') {
        const request = (await listSquadAdminRequests(ALL_STATUSES)).find((entry) => entry.id === requestId) ?? null
        setSquadRequest(request)
        setDirectoryRequest(null)
      } else if (requestType === 'directory') {
        const request = (await listDirectoryRequests(ALL_STATUSES)).find((entry) => entry.id === requestId) ?? null
        setDirectoryRequest(request)
        setSquadRequest(null)
      } else {
        setSquadRequest(null)
        setDirectoryRequest(null)
      }

      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load request detail.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [requestId, requestType])

  async function handleSquadAction(status: RequestStatus) {
    if (!squadRequest || !actingUserId) return
    setBusyStatus(status)
    try {
      if (status === 'approved') {
        await approveSquadAdminRequest(
          squadRequest.id,
          squadRequest.requesterUserId,
          squadRequest.squad?.clubId ?? null,
          actingUserId
        )
      } else if (status === 'revoked') {
        await revokeSquadAdminRequest(
          squadRequest.id,
          squadRequest.requesterUserId,
          squadRequest.squad?.clubId ?? null,
          actingUserId
        )
      } else {
        await updateSquadAdminRequestStatus(squadRequest.id, status, actingUserId)
      }
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update request.')
    } finally {
      setBusyStatus(null)
    }
  }

  async function handleDirectoryAction(status: RequestStatus) {
    if (!directoryRequest || !actingUserId) return
    setBusyStatus(status)
    try {
      if (status === 'approved') {
        await approveDirectoryRequest(directoryRequest, actingUserId)
      } else {
        await updateDirectoryRequestStatus(directoryRequest.id, status, actingUserId)
      }
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update request.')
    } finally {
      setBusyStatus(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading request detail…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Request Detail"
          title={requestType === 'squad-admin' ? 'Official squad admin request' : 'Directory request'}
          description="Review the full request context and use the same existing approval workflows surfaced in the overview."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      {squadRequest ? (
        <>
          <PortalCard>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={squadRequest.status} />
              <span className="text-sm text-slate-400">{formatDateTime(squadRequest.createdAt)}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">{squadRequest.squad?.name || 'Official squad request'}</h2>
            <p className="mt-2 text-sm text-slate-400">{squadRequest.requester?.handle || squadRequest.requester?.name || 'Requester'}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {squadActions(squadRequest.status).map((status) => (
                <AdminActionButton key={status} onClick={() => void handleSquadAction(status)} disabled={busyStatus === status} tone={status === 'approved' ? 'primary' : status === 'declined' ? 'danger' : 'ghost'}>
                  {actionLabel(status)}
                </AdminActionButton>
              ))}
            </div>
          </PortalCard>

          <PortalCard title="Request context" subtitle="Real request data only.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Squad</p>
                <p className="mt-3 text-sm text-white">{squadRequest.squad?.name || 'Unknown squad'}</p>
                <p className="mt-2 text-sm text-slate-400">{squadRequest.squad?.clubName || 'Club'} • {squadRequest.squad?.leagueShortName || squadRequest.squad?.leagueName || 'League'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Requester</p>
                <p className="mt-3 text-sm text-white">{squadRequest.requester?.handle || squadRequest.requester?.name || 'Requester'}</p>
              </div>
            </div>
          </PortalCard>

          <PortalCard title="Vetting answers" subtitle="Captured from the existing official-squad admin request flow.">
            {payloadEntries(squadRequest.vettingAnswers).length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {payloadEntries(squadRequest.vettingAnswers).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{key.replace(/_/g, ' ')}</p>
                    <p className="mt-3 text-sm text-white">{String(value ?? '')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No vetting answers were provided." />
            )}
          </PortalCard>
        </>
      ) : null}

      {directoryRequest ? (
        <>
          <PortalCard>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={directoryRequest.status} />
              <span className="text-sm text-slate-400">{formatDateTime(directoryRequest.createdAt)}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">{String(directoryRequest.payload.club_name ?? directoryRequest.payload.league_name ?? directoryRequest.payload.grade_name ?? directoryRequest.payload.squad_name ?? 'Directory request')}</h2>
            <p className="mt-2 text-sm text-slate-400">{directoryRequest.requester?.handle || directoryRequest.requester?.name || 'Requester'}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {directoryActions(directoryRequest.status).map((status) => (
                <AdminActionButton key={status} onClick={() => void handleDirectoryAction(status)} disabled={busyStatus === status} tone={status === 'approved' ? 'primary' : status === 'declined' ? 'danger' : 'ghost'}>
                  {actionLabel(status)}
                </AdminActionButton>
              ))}
            </div>
          </PortalCard>

          <PortalCard title="Payload" subtitle="Captured from the current official directory request model.">
            {payloadEntries(directoryRequest.payload).length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {payloadEntries(directoryRequest.payload).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{key.replace(/_/g, ' ')}</p>
                    <p className="mt-3 text-sm text-white">{String(value ?? '')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No payload details were provided." />
            )}
          </PortalCard>
        </>
      ) : null}

      {!squadRequest && !directoryRequest && !loading ? (
        <PortalCard>
          <EmptyState label="Request not found." />
        </PortalCard>
      ) : null}
    </section>
  )
}
