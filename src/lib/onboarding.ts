import { supabase } from '@/lib/supabase'
import { createRoleRequest } from '@/lib/account-management'

export const ONBOARDING_STEPS = [
  'welcome',
  'personal',
  'profile-photo',
  'action-card',
  'club',
  'role',
] as const

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]
export type OnboardingRole = 'player' | 'coach' | 'tracker' | 'member'
export type RequestableRole = Exclude<OnboardingRole, 'member'>
export type ProfileRole = OnboardingRole | 'admin'
export type OnboardingPosition = 'DEF' | 'MID' | 'FWD'

export const ONBOARDING_ROLE_OPTIONS: Array<{
  key: OnboardingRole
  label: string
  helper: string
}> = [
  {
    key: 'player',
    label: 'Player',
    helper: 'Request player access. Official squad role stays member until approved.',
  },
  {
    key: 'coach',
    label: 'Coach',
    helper: 'Request coach access for your official club.',
  },
  {
    key: 'tracker',
    label: 'Tracker',
    helper: 'Request official tracker access for match-day tracking.',
  },
  {
    key: 'member',
    label: 'Club Member',
    helper: 'Follow the club as a supporter-style member profile.',
  },
] as const

export const POSITION_OPTIONS: OnboardingPosition[] = ['DEF', 'MID', 'FWD']

export type ProfileCompletionRow = {
  user_id: string
  onboarding_completed_at: string | null
}

export type FinishOnboardingInput = {
  userId: string
  firstName: string
  lastName: string
  handle: string
  dob: string
  selectedStateCode: string
  selectedLeagueId: string
  selectedClubId: string
  selectedRoles: OnboardingRole[]
  lockedAdminRole: boolean
  avatarUrl: string | null
  avatarPath: string | null
  actionPhotoUrl: string | null
  actionPhotoPath: string | null
  playerPosition: OnboardingPosition | null
  playerNumber: number | null
}

export function normalizeHandle(value: string): string {
  return value.replace(/^@+/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

export function validateHandle(value: string): { sanitized: string | null; error: string | null } {
  const sanitized = normalizeHandle(value)
  if (!sanitized) return { sanitized: null, error: 'Handle is required.' }
  if (sanitized.length < 3) return { sanitized: null, error: 'Handle must be at least 3 characters.' }
  if (sanitized.length > 20) return { sanitized: null, error: 'Handle must be at most 20 characters.' }
  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    return { sanitized: null, error: 'Use letters, numbers, or underscores only.' }
  }
  return { sanitized, error: null }
}

export function roleArrayFromProfile(primaryRole: string | null, gameDayRoles: string[] | null): OnboardingRole[] {
  const set = new Set<OnboardingRole>()
  const list = [primaryRole, ...(Array.isArray(gameDayRoles) ? gameDayRoles : [])]

  for (const role of list) {
    if (role === 'supporter' || role === 'member') {
      set.add('member')
    } else if (role === 'player' || role === 'coach' || role === 'tracker') {
      set.add(role)
    }
  }

  return Array.from(set)
}

export function resolveAvatarUrl(avatarUrl: string | null, avatarPath: string | null): string | null {
  if (avatarUrl) return avatarUrl
  if (!avatarPath) return null
  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath)
  return data?.publicUrl || null
}

export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const parts: string[] = []
  if (digits.length >= 2) parts.push(digits.slice(0, 2))
  else if (digits.length) parts.push(digits)
  if (digits.length >= 4) parts.push(digits.slice(2, 4))
  else if (digits.length > 2) parts.push(digits.slice(2))
  if (digits.length > 4) parts.push(digits.slice(4))
  return parts.join('/')
}

export function parseDobInput(input: string): Date | null {
  const parts = input.split('/').map((part) => part.trim())
  if (parts.length !== 3 || parts.some((part) => !part)) return null

  const [dayStr, monthStr, yearStr] = parts
  const day = Number(dayStr)
  const month = Number(monthStr)
  const year = Number(yearStr)
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null

  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function formatDobForDisplay(date: Date | null): string {
  if (!date) return ''
  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export function formatDobForStorage(date: Date | null): string | null {
  if (!date) return null
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function validateDob(date: Date | null): string | null {
  if (!date) return 'Date of birth is required.'
  const now = new Date()
  if (date.getTime() >= now.getTime()) return 'Date of birth must be in the past.'
  const ageYears = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  if (ageYears < 5) return 'Age must be at least 5 years old.'
  return null
}

export async function ensureProfileExists(userId: string): Promise<void> {
  if (!userId) throw new Error('Missing user id.')

  const { data, error } = await supabase.from('profiles').select('user_id').eq('user_id', userId).maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (data?.user_id) return

  const { error: ensureError } = await supabase.rpc('rpc_ensure_profile_exists')
  if (ensureError) throw ensureError
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) throw error
}

export async function getProfileCompletion(userId: string): Promise<ProfileCompletionRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.warn('Failed to fetch onboarding completion row:', error)
    return null
  }

  return (data as ProfileCompletionRow | null) ?? null
}

export function isProfileComplete(profile: ProfileCompletionRow | null): boolean {
  return Boolean(profile?.onboarding_completed_at)
}

export async function uploadOnboardingImage(
  userId: string,
  file: File,
  variant: 'avatar' | 'action'
): Promise<{ path: string; url: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${variant === 'avatar' ? 'profiles' : 'action-photos'}/${userId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('profile-avatars').upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) throw error
  if (!data?.path) throw new Error('Upload failed. Please try again.')

  const { data: publicUrlData } = supabase.storage.from('profile-avatars').getPublicUrl(data.path)
  return { path: data.path, url: publicUrlData?.publicUrl ?? null }
}

async function fetchOfficialSquadId(clubId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('squads')
    .select('id')
    .eq('club_id', clubId)
    .eq('is_official', true)
    .is('archived_at', null)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return (data as { id?: string | null } | null)?.id ?? null
}

async function fetchPreviousProfileState(userId: string): Promise<{ prevHomeClubId: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('home_club_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return { prevHomeClubId: (data as { home_club_id?: string | null } | null)?.home_club_id ?? null }
}

export async function finishOnboarding(input: FinishOnboardingInput): Promise<void> {
  const {
    userId,
    firstName,
    lastName,
    handle,
    dob,
    selectedStateCode,
    selectedLeagueId,
    selectedClubId,
    selectedRoles,
    lockedAdminRole,
    avatarUrl,
    avatarPath,
    actionPhotoUrl,
    actionPhotoPath,
    playerPosition,
    playerNumber,
  } = input

  const requestableRoles = selectedRoles.filter(
    (role): role is RequestableRole => role === 'player' || role === 'coach' || role === 'tracker'
  )
  const rolesForProfileBase = selectedRoles.filter((role) => role !== 'member')
  const rolesToPersist: ProfileRole[] = lockedAdminRole
    ? Array.from(new Set([...rolesForProfileBase, 'admin'])) as ProfileRole[]
    : rolesForProfileBase
  const primaryRole =
    rolesForProfileBase[0] ?? (selectedRoles.includes('member') ? 'supporter' : lockedAdminRole ? 'admin' : null)

  await ensureProfileExists(userId)
  const { prevHomeClubId } = await fetchPreviousProfileState(userId)

  const officialSquadId = await fetchOfficialSquadId(selectedClubId)
  if (!officialSquadId) {
    throw new Error('No official squad found for this club yet. Please request the club or choose another official club.')
  }

  const updatePayload: Record<string, unknown> = {
    name: `${firstName.trim()} ${lastName.trim()}`.trim(),
    handle,
    dob,
    avatar_url: avatarUrl,
    avatar_path: avatarPath,
    action_photo_url: actionPhotoUrl,
    action_photo_path: actionPhotoPath,
    home_state_code: selectedStateCode,
    home_league_id: selectedLeagueId,
    home_club_id: selectedClubId,
    state: selectedStateCode,
    primary_role: primaryRole,
    game_day_roles: rolesToPersist.length ? rolesToPersist : null,
    game_day_role: primaryRole ?? null,
    player_position: selectedRoles.includes('player') ? playerPosition : null,
    player_number: selectedRoles.includes('player') ? playerNumber : null,
  }

  const { error: profileError } = await supabase.from('profiles').update(updatePayload).eq('user_id', userId)
  if (profileError) throw profileError

  const { error: followError } = await supabase.from('club_follows').insert({ club_id: selectedClubId, user_id: userId })
  if (followError && followError.code !== '23505') throw followError

  const { data: existingMember, error: memberLookupError } = await supabase
    .from('squad_members')
    .select('id')
    .eq('squad_id', officialSquadId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memberLookupError && memberLookupError.code !== 'PGRST116') throw memberLookupError

  if (!existingMember) {
    const { error: memberInsertError } = await supabase.from('squad_members').insert({
      squad_id: officialSquadId,
      user_id: userId,
      invited_by: userId,
      role: 'member',
      status: 'accepted',
    })
    if (memberInsertError && memberInsertError.code !== '23505') throw memberInsertError
  }

  if (requestableRoles.length) {
    const results = await Promise.allSettled(
      requestableRoles.map(async (role) => createRoleRequest(officialSquadId, userId, role))
    )
    const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined
    if (rejected) throw rejected.reason
  }

  if (prevHomeClubId && prevHomeClubId !== selectedClubId) {
    const previousOfficialSquadId = await fetchOfficialSquadId(prevHomeClubId)
    if (previousOfficialSquadId) {
      const { data: oldMembership, error: oldMembershipError } = await supabase
        .from('squad_members')
        .select('id')
        .eq('squad_id', previousOfficialSquadId)
        .eq('user_id', userId)
        .maybeSingle()

      if (oldMembershipError && oldMembershipError.code !== 'PGRST116') throw oldMembershipError

      if (oldMembership?.id) {
        const { error: leaveError } = await supabase.rpc('f_leave_squad', { _squad_id: previousOfficialSquadId })
        if (leaveError) throw leaveError
      }
    }
  }

  await markOnboardingCompleted(userId)
}
