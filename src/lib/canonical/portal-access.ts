export type PortalAccess = 'loading' | 'sign-in' | 'dashboard' | 'ready'

export function resolvePortalAccess({ checking, userId, adminRoute, isAdmin }: {
  checking: boolean
  userId: string | null
  adminRoute: boolean
  isAdmin: boolean
}): PortalAccess {
  // An unresolved identity is not an anonymous user.
  if (checking && (!userId || adminRoute)) return 'loading'
  if (!userId) return 'sign-in'
  if (adminRoute && !isAdmin) return 'dashboard'
  return 'ready'
}
