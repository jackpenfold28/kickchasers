import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

function requestKindLabel(value: string) {
  return value.replace(/_/g, ' ')
}

export default function AdminRequestsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingUserId, setActingUserId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [squadRequests, setSquadRequests] = useState<SquadAdminRequest[]>([])
  const [directoryRequests, setDirectoryRequests] = useState<DirectoryRequest[]>([])

  async function loadPage() {
    setLoading(true)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setActingUserId(data.user.id)
      const [squads, directory] = await Promise.all([
        listSquadAdminRequests(ALL_STATUSES),
        listDirectoryRequests(ALL_STATUSES),
      ])
      setSquadRequests(squads)
      setDirectoryRequests(directory)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [navigate])

  const sortedSquadRequests = useMemo(
    () => [...squadRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [squadRequests]
  )
  const sortedDirectoryRequests = useMemo(
    () => [...directoryRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [directoryRequests]
  )

  async function handleSquadAction(request: SquadAdminRequest, status: RequestStatus) {
    if (!actingUserId) return
    setBusyKey(`squad-${request.id}-${status}`)
    try {
      if (status === 'approved') {
        await approveSquadAdminRequest(request.id, request.requesterUserId, request.squad?.clubId ?? null, actingUserId)
      } else if (status === 'revoked') {
        await revokeSquadAdminRequest(request.id, request.requesterUserId, request.squad?.clubId ?? null, actingUserId)
      } else {
        await updateSquadAdminRequestStatus(request.id, status, actingUserId)
      }
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update request.')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDirectoryAction(request: DirectoryRequest, status: RequestStatus) {
    if (!actingUserId) return
    setBusyKey(`directory-${request.id}-${status}`)
    try {
      if (status === 'approved') {
        await approveDirectoryRequest(request, actingUserId)
      } else {
        await updateDirectoryRequestStatus(request.id, status, actingUserId)
      }
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update request.')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading requests…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Requests"
          title="Requests inbox"
          description="Full review surface for official squad admin requests and official directory requests."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <PortalCard title="Official squad admin requests" subtitle="Full list">
          <div className="grid gap-3">
            {sortedSquadRequests.length ? sortedSquadRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={request.status} />
                      <span className="text-xs text-slate-500">{formatDateTime(request.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{request.squad?.name || 'Official squad request'}</p>
                    <p className="mt-1 text-sm text-slate-400">{request.requester?.handle || request.requester?.name || 'Requester'}</p>
                  </div>
                  <Link to={`/admin/requests/squad-admin/${request.id}`} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                    Open
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.status === 'pending' ? (
                    <>
                      <AdminActionButton onClick={() => void handleSquadAction(request, 'approved')} disabled={busyKey === `squad-${request.id}-approved`} tone="primary">Approve</AdminActionButton>
                      <AdminActionButton onClick={() => void handleSquadAction(request, 'declined')} disabled={busyKey === `squad-${request.id}-declined`} tone="danger">Decline</AdminActionButton>
                    </>
                  ) : null}
                  {request.status === 'approved' ? (
                    <AdminActionButton onClick={() => void handleSquadAction(request, 'revoked')} disabled={busyKey === `squad-${request.id}-revoked`} tone="ghost">Revoke</AdminActionButton>
                  ) : null}
                </div>
              </div>
            )) : <EmptyState label="No squad admin requests found." />}
          </div>
        </PortalCard>

        <PortalCard title="Directory requests" subtitle="Full list">
          <div className="grid gap-3">
            {sortedDirectoryRequests.length ? sortedDirectoryRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={request.status} />
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                        {requestKindLabel(request.requestKind)}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateTime(request.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {String(request.payload.club_name ?? request.payload.league_name ?? request.payload.grade_name ?? request.payload.squad_name ?? 'Directory request')}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{request.requester?.handle || request.requester?.name || 'Requester'}</p>
                  </div>
                  <Link to={`/admin/requests/directory/${request.id}`} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                    Open
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.status === 'pending' ? (
                    <>
                      <AdminActionButton onClick={() => void handleDirectoryAction(request, 'approved')} disabled={busyKey === `directory-${request.id}-approved`} tone="primary">Approve</AdminActionButton>
                      <AdminActionButton onClick={() => void handleDirectoryAction(request, 'declined')} disabled={busyKey === `directory-${request.id}-declined`} tone="danger">Decline</AdminActionButton>
                    </>
                  ) : null}
                </div>
              </div>
            )) : <EmptyState label="No directory requests found." />}
          </div>
        </PortalCard>
      </div>
    </section>
  )
}
