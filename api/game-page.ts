import { buildGamePageHtml, getGamePreviewData } from './_lib/game-share.js'

type RequestLike = {
  url?: string
  headers?: Headers | Record<string, string | string[] | undefined>
}

function readHeader(request: RequestLike, key: string) {
  if (!request.headers) return null
  const headers = request.headers
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(key)
  }
  const record = headers as Record<string, string | string[] | undefined>
  const value = record[key] ?? record[key.toLowerCase()] ?? record[key.toUpperCase()]
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function parsePageRequest(request: RequestLike) {
  const rawUrl = typeof request.url === 'string' ? request.url : ''
  const host = readHeader(request, 'x-forwarded-host') ?? readHeader(request, 'host') ?? 'kickchasers.com'
  const proto = readHeader(request, 'x-forwarded-proto') ?? 'https'
  const base = `${proto}://${host}`

  let parsed: URL
  try {
    parsed = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? new URL(rawUrl) : new URL(rawUrl || '/', base)
  } catch {
    parsed = new URL('/', base)
  }

  const queryGameId = parsed.searchParams.get('gameId')?.trim()
  const pathMatch = parsed.pathname.match(/^\/game\/([^/?#]+)/i)
  const pathGameId = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]).trim() : null

  return {
    url: parsed,
    gameId: queryGameId || pathGameId || null,
  }
}

export default async function handler(request: Request) {
  try {
    const { gameId } = parsePageRequest(request)

    if (!gameId) {
      return new Response(buildGamePageHtml({ preview: null, notFound: true }), {
        status: 400,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=60, s-maxage=60',
        },
      })
    }

    const preview = await getGamePreviewData(gameId, request)
    const live = preview?.status === 'Live'

    return new Response(buildGamePageHtml({ preview, notFound: !preview }), {
      status: preview ? 200 : 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': live
          ? 'public, max-age=60, s-maxage=60, stale-while-revalidate=600'
          : 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('game-page handler failed', error)

    return new Response(buildGamePageHtml({ preview: null, notFound: true }), {
      status: 500,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=60',
      },
    })
  }
}
