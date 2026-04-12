import { buildGamePageHtml, getGamePreviewData, parseRequestUrl } from './_lib/game-share.js'

export default async function handler(request: Request) {
  try {
    const url = parseRequestUrl(request)
    if (!url) {
      throw new TypeError(`Invalid request URL: ${request.url}`)
    }
    const gameId = url.searchParams.get('gameId')?.trim()

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
