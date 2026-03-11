import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Users2 } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { supabase } from '@/lib/supabase'
import { listFollowedClubs, listMySquads, type SquadSummary } from '@/lib/squads'

type TabKey = 'my' | 'following'

function SquadCard({ squad }: { squad: SquadSummary }) {
  return (
    <Link
      to={`/squads/${squad.id}`}
      className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#39FF88]/40 hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-[#0D1525]">
            {squad.logoUrl ? (
              <img src={squad.logoUrl} alt={squad.name || 'Squad'} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-400">{(squad.name || 'S').slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{squad.name || 'Unnamed squad'}</h3>
            <p className="text-xs text-slate-400">
              {squad.leagueName || 'League TBD'} • {squad.isOfficial ? 'Official' : 'Custom'}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
          {squad.memberCount} members
        </span>
      </div>
    </Link>
  )
}

export default function SquadsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromQuery = searchParams.get('tab')
  const initialTab: TabKey = tabFromQuery === 'following' ? 'following' : 'my'

  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [mySquads, setMySquads] = useState<SquadSummary[]>([])
  const [following, setFollowing] = useState<SquadSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const tabValue: TabKey = tab === 'following' ? 'following' : 'my'
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tabValue)
      return next
    })
  }, [setSearchParams, tab])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const [my, followed] = await Promise.all([listMySquads(user.id), listFollowedClubs(user.id)])

        if (cancelled) return
        setMySquads(my)
        setFollowing(followed)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load squads.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const activeList = useMemo(() => (tab === 'my' ? mySquads : following), [tab, mySquads, following])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading squads…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Squad Management</h2>
            <p className="mt-1 text-sm text-slate-400">
              Manage rosters, requests, invites, and branding from one desktop workspace.
            </p>
          </div>

          <Link to="/squads/new" className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Squad
          </Link>
        </div>
      </PortalCard>

      <div className="flex flex-wrap gap-2">
        <button
          className={`btn ${tab === 'my' ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
          onClick={() => setTab('my')}
        >
          My Squads
        </button>
        <button
          className={`btn ${tab === 'following' ? 'bg-[#39FF88] text-[#061120] hover:bg-[#39FF88]' : 'btn-secondary'}`}
          onClick={() => setTab('following')}
        >
          Following
        </button>
      </div>

      {error && (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {activeList.length ? (
          activeList.map((squad) => <SquadCard key={squad.id} squad={squad} />)
        ) : (
          <PortalCard className="lg:col-span-2">
            <div className="flex items-center gap-3 text-slate-400">
              <Users2 className="h-5 w-5" />
              <p>{tab === 'my' ? 'No squads yet. Create your first squad to get started.' : 'No followed squads yet.'}</p>
            </div>
          </PortalCard>
        )}
      </div>
    </section>
  )
}
