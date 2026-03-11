import { supabase } from '@/lib/supabase'

export type ProfileCompletionRow = {
  user_id: string
  handle: string | null
  home_state_code: string | null
  home_league_id: string | null
  home_club_id: string | null
  primary_role: string | null
  game_day_roles: string[] | null
}

export function isProfileComplete(profile: ProfileCompletionRow | null): boolean {
  if (!profile) return false
  const hasRole =
    !!profile.primary_role ||
    (Array.isArray(profile.game_day_roles) && profile.game_day_roles.length > 0)
  return Boolean(
    profile.handle &&
    profile.home_state_code &&
    profile.home_league_id &&
    profile.home_club_id &&
    hasRole
  )
}

export async function getProfileCompletion(userId: string): Promise<ProfileCompletionRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,handle,home_state_code,home_league_id,home_club_id,primary_role,game_day_roles')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Failed to fetch profile completion row:', error)
    return null
  }

  return (data as ProfileCompletionRow | null) ?? null
}
