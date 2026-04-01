import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import DataTable from '@/components/portal/DataTable'
import { listOfficialSquads, type OfficialSquadAdminRow } from '@/lib/portal-admin'
import { setSquadArchived } from '@/lib/platform-admin'
import { supabase } from '@/lib/supabase'
import { AdminActionButton, EmptyState, SectionHeading } from './admin-ui'

export default function AdminOfficialSquadsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busySquadId, setBusySquadId] = useState<string | null>(null)
  const [squads, setSquads] = useState<OfficialSquadAdminRow[]>([])

  async function loadPage() {
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setSquads(await listOfficialSquads())
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load official squads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [])

  async function handleArchive(squad: OfficialSquadAdminRow) {
    setBusySquadId(squad.id)
    try {
      await setSquadArchived(squad.id, !Boolean(squad.archivedAt))
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update squad.')
    } finally {
      setBusySquadId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading official squads…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Official Squads"
          title="Official squad management"
          description="Archive and restore official squads, then jump into the existing team management pages for roster and official-squad admin workflows."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <PortalCard title="Official squads" subtitle="Archive state is surfaced directly from the current backend-admin plumbing.">
        {squads.length ? (
          <DataTable
            rows={squads}
            getRowKey={(squad) => squad.id}
            columns={[
              {
                key: 'squad',
                label: 'Squad',
                render: (squad) => (
                  <div>
                    <p className="font-semibold text-white">{squad.name || 'Official squad'}</p>
                    <p className="text-xs text-slate-400">{squad.clubName || 'Club'} • {squad.leagueShortName || squad.leagueName || 'League'}</p>
                  </div>
                ),
              },
              {
                key: 'state',
                label: 'State',
                render: (squad) => <span>{squad.stateCode || '—'}</span>,
              },
              {
                key: 'archive',
                label: 'Archive state',
                render: (squad) => (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${squad.archivedAt ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]'}`}>
                    {squad.archivedAt ? 'Archived' : 'Active'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (squad) => (
                  <div className="flex flex-wrap gap-2">
                    <AdminActionButton onClick={() => void handleArchive(squad)} disabled={busySquadId === squad.id} tone={squad.archivedAt ? 'primary' : 'ghost'}>
                      {squad.archivedAt ? 'Unarchive' : 'Archive'}
                    </AdminActionButton>
                    <Link to={`/teams/${squad.id}`} className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                      Open team
                    </Link>
                  </div>
                ),
              },
            ]}
            mobileCardRender={(squad) => (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white">{squad.name || 'Official squad'}</p>
                  <p className="text-sm text-slate-400">{squad.clubName || 'Club'} • {squad.leagueShortName || squad.leagueName || 'League'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminActionButton onClick={() => void handleArchive(squad)} disabled={busySquadId === squad.id} tone={squad.archivedAt ? 'primary' : 'ghost'}>
                    {squad.archivedAt ? 'Unarchive' : 'Archive'}
                  </AdminActionButton>
                  <Link to={`/teams/${squad.id}`} className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/[0.06]">
                    Open team
                  </Link>
                </div>
              </div>
            )}
          />
        ) : (
          <EmptyState label="No official squads found." />
        )}
      </PortalCard>
    </section>
  )
}
