import { useMemo, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import type { SquadMember } from '@/lib/squads'

type RosterTableProps = {
  members: SquadMember[]
  canManage: boolean
  savingMemberId: string | null
  onUpdateNumber: (memberId: string, jersey: number | null) => Promise<void>
  onUpdatePosition: (memberId: string, position: string | null) => Promise<void>
  onRemove: (memberId: string) => Promise<void>
}

function labelForMember(member: SquadMember) {
  if (member.profileName) return member.profileName
  if (member.handle) return member.handle.startsWith('@') ? member.handle : `@${member.handle}`
  return member.guestName || 'Unknown member'
}

export default function RosterTable({
  members,
  canManage,
  savingMemberId,
  onUpdateNumber,
  onUpdatePosition,
  onRemove,
}: RosterTableProps) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) => {
      const name = labelForMember(member).toLowerCase()
      const role = member.role.toLowerCase()
      return name.includes(q) || role.includes(q)
    })
  }, [filter, members])

  return (
    <PortalCard title="Roster" subtitle="Desktop roster management with quick inline edits">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search roster"
          className="input w-full sm:max-w-xs"
        />
        <p className="text-xs text-slate-400">{filtered.length} members</p>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((member) => {
          const isBusy = savingMemberId === member.id
          return (
            <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{labelForMember(member)}</div>
                  {member.guestEmail && <div className="text-xs text-slate-400">{member.guestEmail}</div>}
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  {member.role}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Jersey</p>
                  {canManage ? (
                    <input
                      className="input"
                      type="number"
                      defaultValue={member.jerseyNumber ?? ''}
                      onBlur={async (event) => {
                        const raw = event.target.value.trim()
                        const next = raw ? Number(raw) : null
                        if (next === member.jerseyNumber) return
                        await onUpdateNumber(member.id, Number.isFinite(next as number) ? next : null)
                      }}
                      disabled={isBusy}
                    />
                  ) : (
                    <p className="text-slate-200">{member.jerseyNumber ?? '-'}</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="text-slate-200">{member.status}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">Position</p>
                {canManage ? (
                  <input
                    className="input"
                    defaultValue={member.position ?? ''}
                    onBlur={async (event) => {
                      const next = event.target.value.trim() || null
                      if (next === member.position) return
                      await onUpdatePosition(member.id, next)
                    }}
                    disabled={isBusy}
                    placeholder="MID"
                  />
                ) : (
                  <p className="text-slate-200">{member.position || '-'}</p>
                )}
              </div>
              {canManage ? (
                <button className="btn mt-4 w-full border-red-500/50 text-red-300" onClick={() => onRemove(member.id)} disabled={isBusy}>
                  Remove
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-2 py-3">#</th>
              <th className="px-2 py-3">Player</th>
              <th className="px-2 py-3">Position</th>
              <th className="px-2 py-3">Role</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const isBusy = savingMemberId === member.id
              return (
                <tr key={member.id} className="border-b border-white/5 text-slate-200">
                  <td className="px-2 py-3">
                    {canManage ? (
                      <input
                        className="input w-16"
                        type="number"
                        defaultValue={member.jerseyNumber ?? ''}
                        onBlur={async (event) => {
                          const raw = event.target.value.trim()
                          const next = raw ? Number(raw) : null
                          if (next === member.jerseyNumber) return
                          await onUpdateNumber(member.id, Number.isFinite(next as number) ? next : null)
                        }}
                        disabled={isBusy}
                      />
                    ) : (
                      <span>{member.jerseyNumber ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-medium text-white">{labelForMember(member)}</div>
                    {member.guestEmail && <div className="text-xs text-slate-400">{member.guestEmail}</div>}
                  </td>
                  <td className="px-2 py-3">
                    {canManage ? (
                      <input
                        className="input w-28"
                        defaultValue={member.position ?? ''}
                        onBlur={async (event) => {
                          const next = event.target.value.trim() || null
                          if (next === member.position) return
                          await onUpdatePosition(member.id, next)
                        }}
                        disabled={isBusy}
                        placeholder="MID"
                      />
                    ) : (
                      member.position || '-'
                    )}
                  </td>
                  <td className="px-2 py-3">{member.role}</td>
                  <td className="px-2 py-3">{member.status}</td>
                  <td className="px-2 py-3">
                    {canManage ? (
                      <button
                        className="btn border-red-500/50 px-2 py-1 text-xs text-red-300"
                        onClick={() => onRemove(member.id)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </PortalCard>
  )
}
