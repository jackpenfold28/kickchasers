import PortalCard from '@/components/cards/PortalCard'

export default function DashboardPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <PortalCard title="Pending Actions" subtitle="Join requests, invites, and role requests">
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">No pending actions yet.</li>
          <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Placeholder action item</li>
        </ul>
      </PortalCard>

      <PortalCard title="Recent Games" subtitle="Latest game summaries at a glance">
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">No games available yet.</li>
          <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Placeholder game row</li>
        </ul>
      </PortalCard>

      <PortalCard title="My Squads" subtitle="Quick access to your squads">
        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Squad placeholder</div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Squad placeholder</div>
        </div>
      </PortalCard>

      <PortalCard title="Leaderboard Snapshot" subtitle="Top performers overview">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Squad</th>
                <th className="px-3 py-2">Stat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10">
                <td className="px-3 py-2">1</td>
                <td className="px-3 py-2">Placeholder</td>
                <td className="px-3 py-2">KickChasers</td>
                <td className="px-3 py-2 text-[#39FF88]">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PortalCard>
    </section>
  )
}
