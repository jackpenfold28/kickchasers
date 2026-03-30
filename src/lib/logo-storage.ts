import { supabase } from '@/lib/supabase'

export function resolveLogoPublicUrl(pathOrUrl?: string | null): string | null {
  const sanitized = typeof pathOrUrl === 'string' && pathOrUrl.trim().length > 0 ? pathOrUrl.trim() : null
  if (!sanitized) return null

  const OPPONENT_BUCKET = 'opponents'
  const TEAM_LOGO_BUCKET = 'team-logos'

  const dedupeOpponentPublicUrl = (input: string) => {
    const duplicatePattern = /(\/storage\/v1\/object\/public\/opponents\/)opponents\//i
    if (duplicatePattern.test(input)) {
      return input.replace(duplicatePattern, '$1')
    }
    return input
  }

  const dedupeOpponentPath = (input: string) => input.replace(/^(opponents\/)opponents\//i, '$1')

  const buildPublicUrl = (bucket: string, objectKey: string | null | undefined) => {
    if (!objectKey) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectKey)
    return data?.publicUrl ?? null
  }

  if (/^https?:\/\//i.test(sanitized)) {
    return dedupeOpponentPublicUrl(sanitized)
  }

  const cleaned = dedupeOpponentPath(sanitized.replace(/^\/+/, ''))
  const explicitBucketMatch = cleaned.match(/^([^:]+)::(.+)$/)

  if (explicitBucketMatch) {
    const bucket = explicitBucketMatch[1] ?? TEAM_LOGO_BUCKET
    const objectKey = dedupeOpponentPath(explicitBucketMatch[2] ?? '')
    return buildPublicUrl(bucket, objectKey) ?? sanitized
  }

  const opponentSegment = 'opponents/'
  const isOpponentPath =
    cleaned.startsWith(opponentSegment) || cleaned.includes(`/${opponentSegment}`) || cleaned === 'opponents'

  if (isOpponentPath) {
    const normalizedKey = dedupeOpponentPath(cleaned).replace(/^opponents\//i, '')
    const opponentBucketUrl = buildPublicUrl(OPPONENT_BUCKET, normalizedKey)
    const teamLogoUrl = buildPublicUrl(TEAM_LOGO_BUCKET, cleaned)
    return teamLogoUrl ?? opponentBucketUrl ?? sanitized
  }

  const segments = cleaned.split('/')
  let bucket: string | null = null
  let objectKey: string | null = null

  if (segments.length > 1) {
    bucket = segments.shift() ?? TEAM_LOGO_BUCKET
    objectKey = segments.join('/')
  }

  const resolvedBucket = bucket ?? TEAM_LOGO_BUCKET
  const resolvedPath = objectKey ?? cleaned
  return buildPublicUrl(resolvedBucket, resolvedPath) ?? sanitized
}
