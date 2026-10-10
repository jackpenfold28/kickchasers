export type OfficialLeaderboardEvent = {
  id?: string | null
  game_id?: string | null
  profile_user_id?: string | null
  stat_key?: string | null
  team_side?: string | null
  player_number?: number | null
}

export function isPlayerPerformanceGame(trackerMode: string | null | undefined): boolean {
  return trackerMode !== 'team_stats_game'
}

export function dedupeOfficialLeaderboardEvents<T extends OfficialLeaderboardEvent>(events: T[]): T[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    if (!event.id) return true
    if (seen.has(event.id)) return false
    seen.add(event.id)
    return true
  })
}
