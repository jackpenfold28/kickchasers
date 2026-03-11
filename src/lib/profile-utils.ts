export const ONBOARDING_ROLE_OPTIONS = [
  { key: 'player', label: 'Player' },
  { key: 'coach', label: 'Coach' },
  { key: 'tracker', label: 'Tracker' },
  { key: 'member', label: 'Club Member' },
] as const

export type OnboardingRole = (typeof ONBOARDING_ROLE_OPTIONS)[number]['key']
export type RequestableRole = Extract<OnboardingRole, 'player' | 'coach' | 'tracker'>

export function normalizeHandle(value: string): string {
  const stripped = value.replace(/^@+/, '').trim().toLowerCase()
  return stripped.replace(/[^a-z0-9_]/g, '')
}

export function validateHandle(value: string): { sanitized: string | null; error: string | null } {
  const sanitized = normalizeHandle(value)

  if (!sanitized) {
    return { sanitized: null, error: 'Handle is required.' }
  }
  if (sanitized.length < 3) {
    return { sanitized: null, error: 'Handle must be at least 3 characters.' }
  }
  if (sanitized.length > 20) {
    return { sanitized: null, error: 'Handle must be at most 20 characters.' }
  }

  return { sanitized, error: null }
}

export function roleArrayFromProfile(primaryRole: string | null, gameDayRoles: string[] | null): OnboardingRole[] {
  const set = new Set<OnboardingRole>()

  const list = [primaryRole, ...(Array.isArray(gameDayRoles) ? gameDayRoles : [])]
  for (const role of list) {
    if (role === 'supporter') {
      set.add('member')
    } else if (role === 'player' || role === 'coach' || role === 'tracker' || role === 'member') {
      set.add(role)
    }
  }

  return Array.from(set)
}
