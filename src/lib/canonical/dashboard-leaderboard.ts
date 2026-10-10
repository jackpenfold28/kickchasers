import type { LeaderboardRow } from '../portal-stats'

export function selectDashboardLeaders(rows: LeaderboardRow[], members?: ReadonlySet<string>) {
  // Filter the complete ranking before limiting; club leaders may be outside the global top five.
  return rows.filter((row) => !members || members.has(row.userId)).slice(0, 5).map((row, index) => ({ ...row, rank: index + 1 }))
}

export function leaderboardGradient(primary?: string | null, secondary?: string | null) {
  const safe = (value: string | null | undefined, fallback: string) => /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback
  return `linear-gradient(110deg,${safe(primary, '#26364C')} 0%,#0A1220 52%,${safe(secondary, '#26364C')} 100%)`
}
