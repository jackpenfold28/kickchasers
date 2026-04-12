import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type TeamIdentity = {
  name: string
  logoUrl: string | null
  tint: string | null
}

export type GamePreviewData = {
  id: string
  canonicalUrl: string
  ogImageUrl: string
  title: string
  description: string
  siteName: string
  status: string
  competitionLabel: string | null
  roundLabel: string
  dateLabel: string
  venueLabel: string
  homeTeam: TeamIdentity
  awayTeam: TeamIdentity
  homeScore: {
    goals: number
    behinds: number
    points: number
    display: string
  }
  awayScore: {
    goals: number
    behinds: number
    points: number
    display: string
  }
  scorePrimary: string
  scoreSecondary: string
}

type SupabaseLike = SupabaseClient<any, any, any>

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return null
}

function requireEnv(...keys: string[]) {
  const value = readEnv(...keys)
  if (!value) {
    throw new Error(`Missing environment variable. Expected one of: ${keys.join(', ')}`)
  }
  return value
}

function createServerSupabaseClient() {
  const supabaseUrl = requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
  const supabaseKey =
    readEnv(
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_SECRET_KEY',
      'SUPABASE_SERVER_KEY'
    ) ?? requireEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

type RequestLike = {
  url: string
  headers?: Headers | Record<string, string | string[] | undefined>
}

function readHeader(request: RequestLike | undefined, key: string) {
  if (!request?.headers) return null

  const headers = request.headers
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(key)
  }

  const record = headers as Record<string, string | string[] | undefined>
  const direct = record[key] ?? record[key.toLowerCase()] ?? record[key.toUpperCase()]
  if (Array.isArray(direct)) return direct[0] ?? null
  return direct ?? null
}

function resolveSiteUrl(request?: RequestLike) {
  const explicit = readEnv('PUBLIC_SITE_URL', 'VITE_PUBLIC_SITE_URL')
  if (explicit) return explicit.replace(/\/+$/, '')

  if (!request) return 'https://kickchasers.com'

  const parsed = parseRequestUrl(request)
  if (parsed) {
    return parsed.origin.replace(/\/+$/, '')
  }

  const forwardedProto = readHeader(request, 'x-forwarded-proto')
  const host = readHeader(request, 'x-forwarded-host') ?? readHeader(request, 'host')
  if (host) {
    return `${forwardedProto ?? 'https'}://${host}`.replace(/\/+$/, '')
  }

  return 'https://kickchasers.com'
}

export function parseRequestUrl(request: RequestLike) {
  try {
    return new URL(request.url, 'https://kickchasers.com')
  } catch {
    return null
  }
}

function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null
  let value = input.trim()
  if (!value) return null
  if (value.startsWith('#')) value = value.slice(1)
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null
  return `#${value.toUpperCase()}`
}

function toPublicLogo(supabase: SupabaseLike, urlOrPath: string | null | undefined) {
  const sanitized = typeof urlOrPath === 'string' && urlOrPath.trim().length > 0 ? urlOrPath.trim() : null
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

function parseTeamSide(value: string | null | undefined): 'home' | 'away' {
  return value === 'away' ? 'away' : 'home'
}

function formatRoundLabel(round: number | null | undefined) {
  return round ? `Round ${round}` : 'Match Day'
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBD'
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatStatus(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return 'Scheduled'
  if (normalized === 'live') return 'Live'
  if (['final', 'finished', 'complete', 'completed'].includes(normalized)) return 'Final'
  if (normalized === 'scheduled') return 'Scheduled'
  return value?.trim() || 'Scheduled'
}

function buildScore(goals: number, behinds: number) {
  const safeGoals = Number.isFinite(goals) ? goals : 0
  const safeBehinds = Number.isFinite(behinds) ? behinds : 0
  const points = safeGoals * 6 + safeBehinds
  return {
    goals: safeGoals,
    behinds: safeBehinds,
    points,
    display: `${safeGoals}.${safeBehinds} (${points})`,
  }
}

function formatTeamName(value: string | null | undefined) {
  if (!value) return ''
  return value.replace(/\bfootball club\b/gi, 'FC').trim()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildGamePageHtml({
  preview,
  notFound = false,
}: {
  preview: GamePreviewData | null
  notFound?: boolean
}) {
  const canonicalUrl = preview?.canonicalUrl ?? 'https://kickchasers.com/game'
  const title = preview?.title ?? 'Game Not Found | KickChasers'
  const description =
    preview?.description ?? 'KickChasers could not load this game preview. Open KickChasers to browse live and final match summaries.'
  const ogImageUrl = preview?.ogImageUrl ?? 'https://kickchasers.com/kickchasers_logo.png'
  const robots = notFound ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'

  const body = preview
    ? `
      <div class="shell">
        <div class="hero">
          <p class="eyebrow">${escapeHtml(preview.siteName)} match share</p>
          <h1>${escapeHtml(preview.title)}</h1>
          <p class="lede">${escapeHtml(preview.description)}</p>
          <div class="chips">
            <span>${escapeHtml(preview.status)}</span>
            <span>${escapeHtml(preview.roundLabel)}</span>
            <span>${escapeHtml(preview.dateLabel)}</span>
            <span>${escapeHtml(preview.venueLabel)}</span>
          </div>
          <div class="score-card">
            <div class="status-rail"></div>
            <div class="score-grid">
              <div class="team-side">
                <div class="logo-shell">
                  ${preview.homeTeam.logoUrl ? `<img class="logo" src="${escapeHtml(preview.homeTeam.logoUrl)}" alt="${escapeHtml(preview.homeTeam.name)}" />` : `<span class="mono">${escapeHtml(preview.homeTeam.name.slice(0, 2).toUpperCase())}</span>`}
                </div>
                <p class="team-name">${escapeHtml(preview.homeTeam.name)}</p>
              </div>
              <div class="score-stack">
                <p class="score-primary">${escapeHtml(preview.scorePrimary)}</p>
                <p class="score-secondary">${escapeHtml(preview.scoreSecondary)}</p>
                <p class="score-round">${escapeHtml(preview.roundLabel)}</p>
              </div>
              <div class="team-side">
                <div class="logo-shell">
                  ${preview.awayTeam.logoUrl ? `<img class="logo" src="${escapeHtml(preview.awayTeam.logoUrl)}" alt="${escapeHtml(preview.awayTeam.name)}" />` : `<span class="mono">${escapeHtml(preview.awayTeam.name.slice(0, 2).toUpperCase())}</span>`}
                </div>
                <p class="team-name">${escapeHtml(preview.awayTeam.name)}</p>
              </div>
            </div>
          </div>
          <div class="card">
            <img src="${escapeHtml(preview.ogImageUrl)}" alt="${escapeHtml(preview.title)}" />
          </div>
          <div class="actions">
            <a href="/games/${encodeURIComponent(preview.id)}">Open in KickChasers</a>
          </div>
        </div>
      </div>
    `
    : `
      <div class="shell">
        <div class="hero">
          <p class="eyebrow">KickChasers</p>
          <h1>Game preview unavailable</h1>
          <p class="lede">This shared game URL could not be resolved. The link may be invalid or the match may no longer be public.</p>
          <div class="actions">
            <a href="/">Go to KickChasers</a>
          </div>
        </div>
      </div>
    `

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="KickChasers" />
    <meta property="og:locale" content="en_AU" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <meta name="theme-color" content="#09111C" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #060c16;
        --panel: rgba(10, 18, 32, 0.84);
        --border: rgba(255, 255, 255, 0.12);
        --text: #f8fafc;
        --muted: #b7c3d7;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(28, 80, 150, 0.26), transparent 34%),
          radial-gradient(circle at top right, rgba(18, 98, 83, 0.22), transparent 32%),
          linear-gradient(180deg, #040811 0%, #09111c 52%, #050912 100%);
        color: var(--text);
        min-height: 100vh;
      }
      .shell {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
      }
      .hero {
        width: min(960px, 100%);
        padding: 28px;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--panel);
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(14px);
      }
      .eyebrow {
        margin: 0 0 10px;
        color: #7dd3fc;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.75rem);
        line-height: 0.95;
      }
      .lede {
        max-width: 56rem;
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.55;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 22px 0 0;
      }
      .chips span {
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #dbeafe;
      }
      .card {
        margin-top: 24px;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
      }
      .score-card {
        position: relative;
        margin-top: 24px;
        overflow: hidden;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.1);
        background:
          linear-gradient(135deg, rgba(33,72,107,0.32) 0%, rgba(0,0,0,0.22) 52%, rgba(29,79,79,0.24) 100%),
          linear-gradient(180deg, rgba(8,12,18,0.08) 0%, rgba(8,12,18,0.24) 44%, rgba(8,12,18,0.46) 100%);
        padding: 26px 20px 20px;
      }
      .status-rail {
        position: absolute;
        inset: 0 0 auto 0;
        height: 2px;
        background: linear-gradient(90deg, rgba(57,255,136,0) 0%, rgba(57,255,136,0.6) 35%, rgba(57,255,136,0.6) 65%, rgba(57,255,136,0) 100%);
      }
      .score-grid {
        display: grid;
        grid-template-columns: 1fr minmax(150px, 1.2fr) 1fr;
        align-items: center;
        gap: 12px;
      }
      .team-side {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
      }
      .logo-shell {
        display: flex;
        width: 56px;
        height: 56px;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.08);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
      }
      .logo {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      .mono {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.08em;
        color: #f8fafc;
      }
      .team-name {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.25;
        color: #fff;
      }
      .score-stack {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
      }
      .score-primary {
        margin: 0;
        white-space: nowrap;
        font-size: clamp(2rem, 5vw, 2.8rem);
        font-style: italic;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.06em;
        color: #fff;
      }
      .score-secondary {
        margin: 0;
        font-size: 12px;
        font-style: italic;
        font-weight: 800;
        color: rgba(255,255,255,0.84);
      }
      .score-round {
        margin: 0;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .card img {
        display: block;
        width: 100%;
        height: auto;
      }
      .actions {
        margin-top: 22px;
      }
      .actions a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
        color: #09111c;
        text-decoration: none;
        font-weight: 700;
      }
    </style>
  </head>
  <body>${body}</body>
</html>`
}

export async function getGamePreviewData(gameId: string, request?: RequestLike): Promise<GamePreviewData | null> {
  const supabase = createServerSupabaseClient()
  const { data: game, error } = await supabase
    .from('games')
    .select(
      'id,opponent,date,venue,status,round,grade_id,track_both_teams,opponent_logo_path,game_squads(team_side,squads(name,logo_url,primary_color_hex))'
    )
    .eq('id', gameId)
    .maybeSingle()

  if (error) throw error
  if (!game) return null

  const gradeId = (game as { grade_id?: string | null }).grade_id ?? null

  const [eventsRes, gradeRes] = await Promise.all([
    supabase.from('v_counted_events').select('stat_key,team_side').eq('game_id', gameId),
    gradeId
      ? supabase
          .from('league_grades')
          .select('name,code,grade_catalog(label)')
          .eq('id', gradeId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as const),
  ])

  if (eventsRes.error) throw eventsRes.error
  if (gradeRes.error) throw gradeRes.error

  let homeGoals = 0
  let homeBehinds = 0
  let awayGoals = 0
  let awayBehinds = 0

  for (const row of eventsRes.data ?? []) {
    const statKey = String(row.stat_key ?? '').toUpperCase()
    const side = parseTeamSide(row.team_side)
    if (statKey !== 'G' && statKey !== 'GOAL' && statKey !== 'B' && statKey !== 'BEHIND') continue

    if (side === 'home' && (statKey === 'G' || statKey === 'GOAL')) homeGoals += 1
    if (side === 'home' && (statKey === 'B' || statKey === 'BEHIND')) homeBehinds += 1
    if (side === 'away' && (statKey === 'G' || statKey === 'GOAL')) awayGoals += 1
    if (side === 'away' && (statKey === 'B' || statKey === 'BEHIND')) awayBehinds += 1
  }

  const squads = Array.isArray((game as { game_squads?: unknown[] }).game_squads) ? ((game as { game_squads?: unknown[] }).game_squads as Array<any>) : []
  const homeSquad = squads.find((row) => row.team_side === 'home') ?? squads[0] ?? null
  const awaySquad = squads.find((row) => row.team_side === 'away') ?? null
  const gradeRow = gradeRes.data as { name?: string | null; code?: string | null; grade_catalog?: { label?: string | null } | null } | null
  const competitionLabel = gradeRow?.grade_catalog?.label ?? gradeRow?.name ?? gradeRow?.code ?? null
  const homeTeamName = formatTeamName(homeSquad?.squads?.name) || 'Home'
  const awayTeamName = formatTeamName(awaySquad?.squads?.name ?? game.opponent) || 'Away'
  const homeScore = buildScore(homeGoals, homeBehinds)
  const awayScore = buildScore(awayGoals, awayBehinds)
  const scorePrimary = `${homeScore.points} - ${awayScore.points}`
  const scoreSecondary = `${homeScore.goals}.${homeScore.behinds} | ${awayScore.goals}.${awayScore.behinds}`
  const roundLabel = formatRoundLabel(game.round ?? null)
  const dateLabel = formatDateLabel(game.date ?? null)
  const venueLabel = game.venue?.trim() || 'Venue TBC'
  const status = formatStatus(game.status ?? null)
  const siteUrl = resolveSiteUrl(request)
  const canonicalUrl = `${siteUrl}/game/${encodeURIComponent(gameId)}`
  const title = `${homeTeamName} ${homeScore.points} - ${awayScore.points} ${awayTeamName} | KickChasers`
  const description = [
    competitionLabel,
    roundLabel,
    `${homeTeamName} ${homeScore.display} vs ${awayTeamName} ${awayScore.display}`,
    status === 'Scheduled' ? dateLabel : null,
    venueLabel !== 'Venue TBC' ? venueLabel : null,
  ]
    .filter(Boolean)
    .join(' • ')

  return {
    id: gameId,
    canonicalUrl,
    ogImageUrl: `${canonicalUrl}/og-image.png`,
    title,
    description,
    siteName: 'KickChasers',
    status,
    competitionLabel,
    roundLabel,
    dateLabel,
    venueLabel,
    homeTeam: {
      name: homeTeamName,
      logoUrl: toPublicLogo(supabase, homeSquad?.squads?.logo_url ?? null),
      tint: normalizeHexColor(homeSquad?.squads?.primary_color_hex ?? null),
    },
    awayTeam: {
      name: awayTeamName,
      logoUrl: toPublicLogo(supabase, awaySquad?.squads?.logo_url ?? game.opponent_logo_path ?? null),
      tint: normalizeHexColor(awaySquad?.squads?.primary_color_hex ?? null),
    },
    homeScore,
    awayScore,
    scorePrimary,
    scoreSecondary,
  }
}
