export const DIRECTORY_RPC_KINDS = new Set(['add_league', 'add_club'])

export function usesAtomicDirectoryDecision(requestKind: string): boolean {
  return DIRECTORY_RPC_KINDS.has(requestKind)
}

export function buildDirectoryDecisionArgs(
  requestId: string,
  decision: 'approved' | 'declined',
  adminNotes?: string | null
) {
  return {
    _request_id: requestId,
    _decision: decision,
    _admin_notes: adminNotes ?? null,
  }
}

export function isPlatformAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/leagues/')
}

export function canEnterPlatformAdminRoute(authenticated: boolean, isPlatformAdmin: boolean): boolean {
  return authenticated && isPlatformAdmin
}
