import { useEffect, useState } from 'react'
import PortalCard from '@/components/cards/PortalCard'
import { listBlockedUsers, unblockUser, type BlockedUserListItem } from '@/lib/account-management'
import { supabase } from '@/lib/supabase'

function formatHandle(handle: string | null): string {
  if (!handle) return ''
  return handle.startsWith('@') ? handle : `@${handle}`
}

export default function BlockedUsersPage() {
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<BlockedUserListItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user
        if (!user) {
          if (!cancelled) {
            setRows([])
            setLoading(false)
          }
          return
        }

        if (!cancelled) setUserId(user.id)

        const blockedUsers = await listBlockedUsers(user.id)
        if (!cancelled) setRows(blockedUsers)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load blocked users.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function onUnblock(blockedUserId: string) {
    if (!userId) return

    setWorkingId(blockedUserId)
    setError(null)

    try {
      await unblockUser(userId, blockedUserId)
      setRows((current) => current.filter((row) => row.blockedUserId !== blockedUserId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unblock user.')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <PortalCard title="Blocked Users" subtitle="Review and unblock users">
      {loading ? (
        <p className="text-sm text-slate-400">Loading blocked users…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-300">No blocked users.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Handle</th>
                <th className="px-3 py-2">Blocked At</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.blockedUserId} className="border-t border-white/10">
                  <td className="px-3 py-2">{row.name || 'Unknown user'}</td>
                  <td className="px-3 py-2">{formatHandle(row.handle) || '—'}</td>
                  <td className="px-3 py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <button
                      className="btn btn-secondary px-3 py-1"
                      disabled={workingId === row.blockedUserId}
                      onClick={() => void onUnblock(row.blockedUserId)}
                    >
                      {workingId === row.blockedUserId ? 'Unblocking…' : 'Unblock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </PortalCard>
  )
}
