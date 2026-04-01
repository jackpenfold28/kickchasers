import PortalCard from '@/components/cards/PortalCard'
import type { GuestMergeRequest, JoinRequest } from '@/lib/squads'

type SquadRequestsPanelProps = {
  canManage: boolean
  joinRequests: JoinRequest[]
  guestMergeRequests: GuestMergeRequest[]
  actingRequestId: string | null
  onJoinDecision: (requestId: string, requestedRole: string | null, decision: 'approve' | 'decline') => Promise<void>
  onGuestMergeDecision: (requestId: string, decision: 'approve' | 'decline') => Promise<void>
}

export default function SquadRequestsPanel({
  canManage,
  joinRequests,
  guestMergeRequests,
  actingRequestId,
  onJoinDecision,
  onGuestMergeDecision,
}: SquadRequestsPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <PortalCard title="Join Requests" subtitle="Approve or decline pending squad join requests" className="teams-section-card">
        <div className="space-y-2">
          {joinRequests.length ? (
            joinRequests.map((request) => (
              <div key={request.id} className="teams-operational-card">
                <p className="text-sm font-medium text-white">{request.requesterName || request.requesterHandle || 'User'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Requested role: {request.requestedRole || 'member'} • {new Date(request.createdAt).toLocaleString()}
                </p>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="teams-action-chip"
                      disabled={actingRequestId === request.id}
                      onClick={() => onJoinDecision(request.id, request.requestedRole, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="teams-action-chip !text-red-300"
                      disabled={actingRequestId === request.id}
                      onClick={() => onJoinDecision(request.id, request.requestedRole, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No pending join requests.</p>
          )}
        </div>
      </PortalCard>

      <PortalCard title="Guest Merge Requests" subtitle="Review guest-to-account merge requests" className="teams-section-card">
        <div className="space-y-2">
          {guestMergeRequests.length ? (
            guestMergeRequests.map((request) => (
              <div key={request.id} className="teams-guest-card">
                <p className="text-sm font-medium text-white">{request.guestName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Requested by {request.requesterName || request.requesterHandle || 'User'} •{' '}
                  {new Date(request.requestedAt).toLocaleString()}
                </p>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="teams-action-chip"
                      disabled={actingRequestId === request.id}
                      onClick={() => onGuestMergeDecision(request.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="teams-action-chip !text-red-300"
                      disabled={actingRequestId === request.id}
                      onClick={() => onGuestMergeDecision(request.id, 'decline')}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No pending guest merge requests.</p>
          )}
        </div>
      </PortalCard>
    </div>
  )
}
