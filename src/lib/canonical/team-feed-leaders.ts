import { computeFantasyPoints, type PlayerEventRow } from './player-event-aggregate.ts'
import { computeGameRatingImpact7 } from './stats-eval.ts'
import { currentSeason, type BenchmarkContext } from './benchmarks.ts'
import { resolveBenchmarkGroup } from './position-benchmark.ts'

export type TeamLeader = {
  key: string; name: string; number: number | null; avatarUrl: string | null
  side: 'home' | 'away'; disposals: number; goals: number; behinds: number; rating: number
}
export type TeamLeaders = { ratings: TeamLeader[]; disposals: TeamLeader[]; scorers: TeamLeader[] }
export type TeamLeaderEvent = PlayerEventRow & { profile_user_id: string | null; player_display_name: string | null }
export type TeamLeaderIdentity = { name?: string | null; avatarUrl?: string | null; position?: string | null }

export function formatTeamFeedRound(round: string | number | null | undefined): string | null {
  if (round == null || String(round).trim() === '') return null
  const value = String(round).trim()
  const finals: Record<string, string> = { '101': 'Elimination Final', EF: 'Elimination Final', '102': 'Qualifying Final', QF: 'Qualifying Final', '103': 'Semi Final', SF: 'Semi Final', '104': 'Preliminary Final', PF: 'Preliminary Final', '105': 'Grand Final', GF: 'Grand Final', '106': 'Trial', TRIAL: 'Trial' }
  return finals[value.toUpperCase()] ?? (/^\d+$/.test(value) ? `Round ${Number(value)}` : value)
}

/** Same four-page feed contract and top-five ordering as the companion app. */
export function buildTeamLeaders(events: TeamLeaderEvent[], includeOppTeam: boolean, identities: Map<string, TeamLeaderIdentity>, positions: Map<string, string | null>, context?: BenchmarkContext): TeamLeaders {
  const grouped = new Map<string, { events: TeamLeaderEvent[]; identity: TeamLeaderIdentity; number: number | null; side: 'home' | 'away' }>()
  for (const event of events) {
    const side = event.team_side === 'away' ? 'away' : 'home'
    if (!includeOppTeam && event.team_side !== 'home') continue
    const guest = event.player_display_name?.trim()
    const number = event.player_number ?? null
    if (!event.profile_user_id && !guest && number == null) continue
    const key = `${side}:${event.profile_user_id ? `user:${event.profile_user_id}` : guest ? `guest:${guest.toLowerCase()}` : `number:${number}`}`
    if (!grouped.has(key)) grouped.set(key, { events: [], identity: event.profile_user_id ? identities.get(event.profile_user_id) ?? {} : {}, number, side })
    grouped.get(key)!.events.push(event)
  }
  const rows: TeamLeader[] = Array.from(grouped, ([key, player]) => {
    // The native feed's StatsLeaderboard adapter counts MC/MUC as marks and
    // every recorded K/HB variant. Keep this separate from summary deduplication.
    const totals = { kicks: 0, handballs: 0, marks: 0, tackles: 0, hitouts: 0, goals: 0, behinds: 0, freesFor: 0, freesAgainst: 0 }
    const codes: Record<string, keyof typeof totals> = { K: 'kicks', K_EF: 'kicks', K_IF: 'kicks', KICK: 'kicks', HB: 'handballs', HB_EF: 'handballs', HB_IF: 'handballs', HANDBALL: 'handballs', M: 'marks', MC: 'marks', MUC: 'marks', MARK: 'marks', T: 'tackles', TACKLE: 'tackles', HO: 'hitouts', G: 'goals', GOAL: 'goals', B: 'behinds', BEHIND: 'behinds', FF: 'freesFor', FA: 'freesAgainst' }
    for (const event of player.events) {
      const stat = codes[(event.stat_key ?? '').toUpperCase()]
      if (stat) totals[stat]++
    }
    const disposals = totals.kicks + totals.handballs
    const name = player.identity.name?.trim() || player.events.find((event) => event.player_display_name?.trim())?.player_display_name?.trim() || `#${player.number}`
    const rating = computeGameRatingImpact7({ hitouts: totals.hitouts, disposals, tackles: totals.tackles, goals: totals.goals, behinds: totals.behinds, marks: totals.marks, fantasy_points: computeFantasyPoints(totals), frees_for: totals.freesFor, frees_against: totals.freesAgainst }, currentSeason, resolveBenchmarkGroup(positions.get(`${player.side}:${player.number}`) ?? player.identity.position), context, key)
    return { key, name, number: player.number, avatarUrl: player.identity.avatarUrl ?? null, side: player.side, disposals, goals: totals.goals, behinds: totals.behinds, rating: Number.isFinite(rating) ? rating : 0 }
  })
  return {
    ratings: rows.filter((row) => row.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 5),
    disposals: rows.filter((row) => row.disposals > 0).sort((a, b) => b.disposals - a.disposals).slice(0, 5),
    scorers: rows.filter((row) => row.goals > 0 || row.behinds > 0).sort((a, b) => b.goals - a.goals || b.behinds - a.behinds || a.name.localeCompare(b.name)).slice(0, 5),
  }
}
