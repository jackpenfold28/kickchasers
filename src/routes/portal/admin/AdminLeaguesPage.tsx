import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import DataTable from '@/components/portal/DataTable'
import { listPlatformLeagues, type LeagueAdminRow, updateLeagueActiveState } from '@/lib/portal-admin'
import { supabase } from '@/lib/supabase'
import { AdminActionButton, EmptyState, SectionHeading } from './admin-ui'

export default function AdminLeaguesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyLeagueId, setBusyLeagueId] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<LeagueAdminRow[]>([])

  async function loadPage() {
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setLeagues(await listPlatformLeagues())
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load leagues.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [])

  async function handleToggle(league: LeagueAdminRow) {
    setBusyLeagueId(league.id)
    try {
      await updateLeagueActiveState(league.id, !league.isActive)
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update league.')
    } finally {
      setBusyLeagueId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading leagues…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Leagues"
          title="League management"
          description="Platform-admin league operations stay grounded here: active and inactive state, club counts, official squad counts, and links into the league detail surface."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <PortalCard title="All leagues" subtitle="No speculative analytics. This is the current operational list.">
        {leagues.length ? (
          <DataTable
            rows={leagues}
            getRowKey={(league) => league.id}
            columns={[
              {
                key: 'league',
                label: 'League',
                render: (league) => (
                  <div>
                    <p className="font-semibold text-white">{league.name || 'League'}</p>
                    <p className="text-xs text-slate-400">{league.shortName || league.stateCode || 'State pending'}</p>
                  </div>
                ),
              },
              {
                key: 'clubs',
                label: 'Clubs',
                render: (league) => <span>{league.clubCount}</span>,
              },
              {
                key: 'officialSquads',
                label: 'Official squads',
                render: (league) => <span>{league.officialSquadCount}</span>,
              },
              {
                key: 'status',
                label: 'State',
                render: (league) => (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${league.isActive ? 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}>
                    {league.isActive ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (league) => (
                  <div className="flex flex-wrap gap-2">
                    <AdminActionButton onClick={() => void handleToggle(league)} disabled={busyLeagueId === league.id} tone={league.isActive ? 'ghost' : 'primary'}>
                      {league.isActive ? 'Set inactive' : 'Set active'}
                    </AdminActionButton>
                    <Link to={`/leagues/${league.id}`} className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                      Open
                    </Link>
                  </div>
                ),
              },
            ]}
            mobileCardRender={(league) => (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white">{league.name || 'League'}</p>
                  <p className="text-sm text-slate-400">{league.shortName || league.stateCode || 'State pending'}</p>
                </div>
                <p className="text-sm text-slate-400">{league.clubCount} clubs • {league.officialSquadCount} official squads</p>
                <div className="flex flex-wrap gap-2">
                  <AdminActionButton onClick={() => void handleToggle(league)} disabled={busyLeagueId === league.id} tone={league.isActive ? 'ghost' : 'primary'}>
                    {league.isActive ? 'Set inactive' : 'Set active'}
                  </AdminActionButton>
                  <Link to={`/leagues/${league.id}`} className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                    Open
                  </Link>
                </div>
              </div>
            )}
          />
        ) : (
          <EmptyState label="No leagues found." />
        )}
      </PortalCard>
    </section>
  )
}
