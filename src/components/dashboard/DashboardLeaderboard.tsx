import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Trophy } from 'lucide-react'
import type { LeaderboardRow } from '@/lib/portal-stats'
import type { DashboardSquadCard } from '@/lib/portal-dashboard'
import { selectDashboardLeaders, leaderboardGradient } from '@/lib/canonical/dashboard-leaderboard'
import { supabase } from '@/lib/supabase'

type Branding = { primary: string | null; secondary: string | null; name: string | null }
type SquadBranding = { name: string | null; primary_color_hex: string | null; secondary_color_hex: string | null; is_official: boolean; club_id: string | null }
type Membership = { user_id: string | null; squads: SquadBranding | null }

function PlayerPhoto({ row }: { row: LeaderboardRow }) {
  const [failed, setFailed] = useState(false)
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0A1220] text-sm font-bold text-white">
    {row.avatarUrl && !failed ? <img src={row.avatarUrl} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : row.playerName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}
  </span>
}

export default function DashboardLeaderboard({ rows, squads, viewerId, seasonYear }: { rows: LeaderboardRow[]; squads: DashboardSquadCard[]; viewerId: string | null; seasonYear: number | null }) {
  const [scope, setScope] = useState<'club' | 'all'>('club')
  const [members, setMembers] = useState<Set<string>>(new Set())
  const [branding, setBranding] = useState<Map<string, Branding>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const id = useId()
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    void (async () => {
      const ids = squads.filter((squad) => squad.status === 'accepted' || squad.ownerId === viewerId).map((squad) => squad.id)
      const roster = ids.length ? await supabase.from('squad_members').select('user_id').in('squad_id', ids).eq('status', 'accepted').abortSignal(controller.signal) : { data: [], error: null }
      if (roster.error) throw roster.error
      const nextMembers = new Set<string>((roster.data ?? []).map((member) => member.user_id).filter((value): value is string => Boolean(value)))
      const leaders = [...selectDashboardLeaders(rows), ...selectDashboardLeaders(rows, nextMembers)]
      const userIds = [...new Set(leaders.map((row) => row.userId))]
      const clubIds = [...new Set(leaders.map((row) => row.homeClubId).filter((value): value is string => Boolean(value)))]
      const [colors, clubSquads, clubs] = await Promise.all([
        userIds.length ? supabase.from('squad_members').select('user_id,squads(name,club_id,primary_color_hex,secondary_color_hex,is_official)').in('user_id', userIds).eq('status', 'accepted').abortSignal(controller.signal) : { data: [], error: null },
        clubIds.length ? supabase.from('squads').select('name,club_id,primary_color_hex,secondary_color_hex,is_official').in('club_id', clubIds).abortSignal(controller.signal) : { data: [], error: null },
        clubIds.length ? supabase.from('clubs').select('id,primary_color').in('id', clubIds).abortSignal(controller.signal) : { data: [], error: null },
      ])
      if (colors.error || clubSquads.error || clubs.error) throw colors.error || clubSquads.error || clubs.error
      const nextBranding = new Map<string, Branding>()
      for (const leader of leaders) {
        const candidates = (colors.data as unknown as Membership[] ?? []).filter((member) => member.user_id === leader.userId && member.squads)
        const linkedSquads = (clubSquads.data as SquadBranding[] ?? []).filter((squad) => squad.club_id === leader.homeClubId)
        const palette = linkedSquads.find((squad) => squad.is_official && squad.primary_color_hex) ?? linkedSquads.find((squad) => squad.primary_color_hex) ?? candidates.find((member) => member.squads?.club_id === leader.homeClubId)?.squads ?? candidates.find((member) => member.squads?.is_official)?.squads ?? candidates[0]?.squads
        const club = clubs.data?.find((club) => club.id === leader.homeClubId)
        nextBranding.set(leader.userId, { primary: palette?.primary_color_hex ?? club?.primary_color ?? null, secondary: palette?.secondary_color_hex ?? null, name: palette?.name ?? null })
      }
      if (!controller.signal.aborted) { setMembers(nextMembers); setBranding(nextBranding) }
    })().catch(() => { if (!controller.signal.aborted) setError('Could not load squad rankings. Please try again.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [rows, squads, viewerId, attempt])
  const leaders = selectDashboardLeaders(rows, scope === 'club' ? members : undefined)
  return <>
    <div role="tablist" aria-label="Leaderboard scope" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[#080E1A] p-1">
      {(['club', 'all'] as const).map((value) => <button key={value} id={`${id}-${value}`} type="button" role="tab" aria-selected={scope === value} aria-controls={`${id}-panel`} tabIndex={scope === value ? 0 : -1} onClick={() => setScope(value)} onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'club' : event.key === 'End' ? 'all' : scope === 'club' ? 'all' : 'club'; setScope(next); document.getElementById(`${id}-${next}`)?.focus() }
      }} className={`min-h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] ${scope === value ? 'bg-white/10 text-[#39FF14]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>{value === 'club' ? 'Club' : 'All'}</button>)}
    </div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${scope}`} aria-busy={loading}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2 font-medium"><Trophy className="h-3.5 w-3.5 text-[#39FF14]" aria-hidden="true" />Disposals leaders</span><span>{seasonYear ?? new Date().getFullYear()} season</span></div>
      {loading ? <div role="status" className="space-y-2"><span className="sr-only">Loading squad rankings…</span>{[0, 1, 2].map((item) => <div key={item} className="h-[76px] animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none" />)}</div> : error && scope === 'club' ? <div role="alert" className="py-4 text-sm text-slate-300"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-2 min-h-11 rounded-lg px-3 font-semibold text-[#39FF14] focus-visible:ring-2 focus-visible:ring-[#39FF14]">Retry</button></div> : leaders.length ? <ol className="space-y-2">
        {leaders.map((row) => { const brand = branding.get(row.userId); return <li key={row.userId} className="relative isolate overflow-hidden rounded-xl" style={{ background: leaderboardGradient(brand?.primary, brand?.secondary) }}>
          <div className="absolute inset-0 -z-10 bg-[#080E1A]/[0.65]" aria-hidden="true" />
          <div className="flex min-h-[76px] items-center gap-2.5 px-3 py-3">
            <span className={`w-3 shrink-0 text-center text-xs font-bold tabular-nums ${row.rank === 1 ? 'text-[#39FF14]' : 'text-slate-200'}`}>{row.rank}</span>
            <PlayerPhoto row={row} />
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-5 text-white [overflow-wrap:anywhere]">{row.playerName}</p><p className="mt-0.5 text-xs leading-4 text-slate-200 [overflow-wrap:anywhere]">{row.clubName || brand?.name || row.squadName || 'KickChasers'} · {row.games} games</p></div>
            <div className="shrink-0 text-right"><p className="text-[28px] font-black italic leading-none tracking-[-0.03em] text-white tabular-nums">{row.statValue}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-200">Disposals</p></div>
          </div>
        </li> })}
      </ol> : <p className="py-6 text-sm leading-6 text-slate-300">{scope === 'club' ? squads.length ? 'No season disposals recorded by players in your squads yet.' : 'Join a squad to see your club leaders.' : 'Season leaders will appear once player disposals are recorded.'}</p>}
    </div>
    <Link to="/stats" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-[#9CE8BE] focus-visible:ring-2 focus-visible:ring-[#39FF14] sm:w-auto sm:justify-start">Open full leaderboard<ChevronRight className="h-4 w-4" /></Link>
  </>
}
