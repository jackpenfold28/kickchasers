import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { supabase } from '@/lib/supabase'
import { getSquadDetail, listSquadMembers, type SquadDetail, type SquadMember } from '@/lib/squads'

function memberLabel(member: SquadMember) {
  return member.profileName || member.handle || member.guestName || 'Player'
}

export default function TeamSelectionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SquadDetail | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const [teamDetail, roster] = await Promise.all([id ? getSquadDetail(id) : Promise.resolve(null), id ? listSquadMembers(id) : Promise.resolve([])])

        if (cancelled) return
        setUserId(user.id)
        setDetail(teamDetail)
        setMembers(roster)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load team selection.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  const acceptedMembers = useMemo(() => members.filter((member) => member.status === 'accepted'), [members])
  const canUseSelection = useMemo(() => {
    if (!userId || !detail) return false
    if (detail.ownerId === userId) return true
    return acceptedMembers.some((member) => member.userId === userId)
  }, [acceptedMembers, detail, userId])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading team selection…</main>
  }

  if (error || !detail) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Team selection unavailable.'}</p>
      </PortalCard>
    )
  }

  if (!canUseSelection) {
    return (
      <PortalCard title="Team Selection" subtitle="Dedicated lineup access stays narrower than general team access">
        <p className="text-sm text-slate-400">Only direct roster members and owners can access team selection for this team.</p>
        <Link to={`/teams/${detail.id}`} className="btn btn-secondary mt-4 inline-flex">
          Back to Team
        </Link>
      </PortalCard>
    )
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CE8BE]">Team Selection</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{detail.name || 'Team'} lineup workspace</h2>
            <p className="mt-2 text-sm text-slate-400">
              First-pass web parity exposes the dedicated selection surface and roster access rules. Full poster-builder polish can layer on top later.
            </p>
          </div>
          <Link to={`/teams/${detail.id}`} className="btn btn-secondary">
            Back to Team
          </Link>
        </div>
      </PortalCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <PortalCard title="Available Roster" subtitle="Accepted members only">
          <div className="grid gap-3 md:grid-cols-2">
            {acceptedMembers.map((member) => (
              <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-semibold text-white">{memberLabel(member)}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {member.position || 'Position TBC'}
                  {member.jerseyNumber != null ? ` • #${member.jerseyNumber}` : ''}
                </p>
              </div>
            ))}
          </div>
        </PortalCard>

        <PortalCard title="Selection Notes" subtitle="Parity-focused access and structure">
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Team Selection remains a dedicated team surface, not a toggle inside overview.</li>
            <li>Access is limited to owners and direct roster members.</li>
            <li>The current web pass exposes the route and roster context without reproducing the full mobile poster-builder yet.</li>
          </ul>
        </PortalCard>
      </div>
    </section>
  )
}
