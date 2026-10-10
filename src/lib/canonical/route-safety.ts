export const DEFAULT_AUTH_RETURN_PATH = '/dashboard'

function decodeReturnValue(value: string) {
  let decoded = value
  for (let index = 0; index < 2; index += 1) {
    const next = decodeURIComponent(decoded)
    if (next === decoded) break
    decoded = next
  }
  return decoded
}

function isSafeInternalPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  if (value.includes('\\') || /[\u0000-\u001F\u007F]/.test(value)) return false

  const base = new URL('https://kickchasers.invalid')
  const parsed = new URL(value, base)
  return parsed.origin === base.origin && parsed.pathname.startsWith('/')
}

export function getSafeReturnPath(value: unknown, fallback = DEFAULT_AUTH_RETURN_PATH) {
  const safeFallback = typeof fallback === 'string' && isSafeInternalPath(fallback)
    ? fallback
    : DEFAULT_AUTH_RETURN_PATH
  if (typeof value !== 'string' || !value.trim()) return safeFallback

  try {
    const decoded = decodeReturnValue(value.trim())
    return isSafeInternalPath(decoded) ? decoded : safeFallback
  } catch {
    return safeFallback
  }
}

export function buildSignInPath(returnPath: unknown) {
  return `/sign-in?redirect=${encodeURIComponent(getSafeReturnPath(returnPath))}`
}

export function buildOnboardingPath(returnPath: unknown) {
  return `/onboarding?returnTo=${encodeURIComponent(getSafeReturnPath(returnPath))}`
}

export type ProtectedReadFailure = 'permission' | 'network' | 'query'

export function classifyProtectedReadFailure(error: unknown): ProtectedReadFailure {
  const candidate = error as { code?: unknown; status?: unknown; message?: unknown } | null
  const code = String(candidate?.code ?? '').toUpperCase()
  const status = Number(candidate?.status)
  const message = String(candidate?.message ?? '').toLowerCase()
  if (status === 401 || status === 403 || code === '42501' || code === 'PGRST301' || message.includes('permission denied')) {
    return 'permission'
  }
  if (error instanceof TypeError || message.includes('failed to fetch') || message.includes('network')) return 'network'
  return 'query'
}
