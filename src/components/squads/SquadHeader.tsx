import { ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SquadDetail } from '@/lib/squads'

type SquadHeaderProps = {
  squad: SquadDetail
  memberCount: number
  viewerRole: string | null
  canManage: boolean
  canLeave: boolean
  leaving: boolean
  onLeave: () => void
}

export default function SquadHeader({
  squad,
  memberCount,
  viewerRole,
  canManage,
  canLeave,
  leaving,
  onLeave,
}: SquadHeaderProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101A2A] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#0D1525]">
            {squad.logoUrl ? (
              <img src={squad.logoUrl} alt={squad.name || 'Squad'} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-slate-400">{(squad.name || 'S').slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">{squad.name || 'Squad'}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {squad.leagueName || 'League TBD'}
              {squad.isOfficial ? ' • Official' : ' • Custom'}
              {viewerRole ? ` • ${viewerRole}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                <Users className="h-3.5 w-3.5" />
                {memberCount} members
              </span>
              {canManage && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#39FF88]/45 bg-[#39FF88]/15 px-2.5 py-1 text-[#A6FFCE]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Manager access
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/squads" className="btn btn-secondary w-full sm:w-auto">
            Back to Squads
          </Link>
          {canLeave && (
            <button
              type="button"
              onClick={onLeave}
              disabled={leaving}
              className="btn w-full border-red-500/60 text-red-300 hover:bg-red-950/40 disabled:opacity-60 sm:w-auto"
            >
              {leaving ? 'Leaving…' : 'Leave Squad'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
