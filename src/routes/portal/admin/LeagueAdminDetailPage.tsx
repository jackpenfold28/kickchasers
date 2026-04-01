import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { fetchLeagueAdminDetail, type LeagueAdminDetail, updateLeagueActiveState } from '@/lib/portal-admin'
import { supabase } from '@/lib/supabase'
import { AdminActionButton, EmptyState, SectionHeading } from './admin-ui'

export default function LeagueAdminDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const leagueId = params.id ?? null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [league, setLeague] = useState<LeagueAdminDetail | null>(null)

  async function loadPage() {
    if (!leagueId) return
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setLeague(await fetchLeagueAdminDetail(leagueId))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load league detail.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [leagueId])

  async function handleToggle() {
    if (!league) return
    setBusy(true)
    try {
      await updateLeagueActiveState(league.id, !league.isActive)
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update league.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading league detail…</main>
  }

  if (!league) {
    return (
      <PortalCard>
        <p className="text-sm text-slate-300">League not found.</p>
      </PortalCard>
    )
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="League Detail"
          title={league.name || 'League'}
          description="The web detail view mirrors the current real league-admin surface with active/inactive control and official squad context."
          actions={
            <>
              <AdminActionButton onClick={() => void handleToggle()} disabled={busy} tone={league.isActive ? 'ghost' : 'primary'}>
                {league.isActive ? 'Set inactive' : 'Set active'}
              </AdminActionButton>
              <Link to="/admin/leagues" className="text-sm font-medium text-[#9CE8BE]">Back to leagues</Link>
            </>
          }
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Short name</p>
            <p className="mt-3 text-xl font-semibold text-white">{league.shortName || '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Clubs</p>
            <p className="mt-3 text-xl font-semibold text-white">{league.clubCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Official squads</p>
            <p className="mt-3 text-xl font-semibold text-white">{league.officialSquadCount}</p>
          </div>
        </div>
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <PortalCard title="Official squads in this league" subtitle="Linked to the existing team detail management pages.">
        <div className="grid gap-3">
          {league.squads.length ? league.squads.map((squad) => (
            <div key={squad.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{squad.name || 'Official squad'}</p>
                <p className="mt-1 text-sm text-slate-400">{squad.clubName || 'Club'} • {squad.stateCode || 'State pending'}</p>
              </div>
              <Link to={`/teams/${squad.id}`} className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                Open team
              </Link>
            </div>
          )) : <EmptyState label="No official squads are linked to this league yet." />}
        </div>
      </PortalCard>
    </section>
  )
}
