import { useMemo, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import type { FollowConnection, PendingInvite } from '@/lib/squads'

type SquadInvitesPanelProps = {
  canManage: boolean
  connections: FollowConnection[]
  pendingInvites: PendingInvite[]
  sending: boolean
  onInvite: (handle: string) => Promise<void>
}

export default function SquadInvitesPanel({
  canManage,
  connections,
  pendingInvites,
  sending,
  onInvite,
}: SquadInvitesPanelProps) {
  const [query, setQuery] = useState('')

  const filteredConnections = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return connections.slice(0, 8)
    return connections
      .filter((connection) => {
        const nameMatch = connection.name.toLowerCase().includes(q)
        const handleMatch = connection.handle?.toLowerCase().includes(q)
        return Boolean(nameMatch || handleMatch)
      })
      .slice(0, 8)
  }, [connections, query])

  return (
    <PortalCard title="Invites" subtitle="Invite members by existing follow connections">
      {!canManage ? (
        <p className="text-sm text-slate-400">Only owners/admins can send squad invites.</p>
      ) : (
        <>
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or @handle"
          />

          <div className="mt-3 space-y-2">
            {filteredConnections.map((connection) => (
              <div
                key={connection.userId}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-white">{connection.name}</p>
                  {connection.handle && <p className="text-xs text-slate-400">{connection.handle}</p>}
                </div>
                <button
                  className="btn btn-secondary px-3 py-1.5 text-xs"
                  disabled={sending || !connection.handle}
                  onClick={() => connection.handle && onInvite(connection.handle)}
                >
                  Invite
                </button>
              </div>
            ))}
            {!filteredConnections.length && <p className="text-sm text-slate-400">No matching connections found.</p>}
          </div>
        </>
      )}

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Pending Invites</h3>
        <div className="space-y-2">
          {pendingInvites.length ? (
            pendingInvites.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                <p className="font-medium text-white">
                  {invite.profileName || invite.profileHandle || invite.guestName || invite.guestEmail || 'Pending invite'}
                </p>
                <p className="text-xs text-slate-400">
                  {invite.role || 'member'} • {new Date(invite.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No pending invites.</p>
          )}
        </div>
      </div>
    </PortalCard>
  )
}
