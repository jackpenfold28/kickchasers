import { ImageResponse } from '@vercel/og'
import { getGamePreviewData, parseRequestUrl, type GamePreviewData } from './_lib/game-share.js'

export const config = {
  runtime: 'edge',
}

function FallbackOgCard({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top left, rgba(28,80,150,0.3), transparent 32%), linear-gradient(135deg, #07101B 0%, #0A1424 55%, #08101A 100%)',
        color: '#F8FAFC',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: '#7DD3FC',
          fontWeight: 700,
        }}
      >
        KickChasers
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 20,
          fontSize: 62,
          fontWeight: 900,
          letterSpacing: '-0.05em',
        }}
      >
        Game Preview
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 14,
          fontSize: 24,
          color: '#CBD5E1',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'KC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function teamTint(primary: string | null, fallback: string) {
  return primary ?? fallback
}

function ScoreBlock({
  team,
  score,
  align,
}: {
  team: GamePreviewData['homeTeam']
  score: GamePreviewData['homeScore']
  align: 'flex-start' | 'flex-end'
}) {
  return (
    <div
      style={{
        width: 390,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexDirection: align === 'flex-end' ? 'row-reverse' : 'row',
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '2px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              width={92}
              height={92}
              style={{ borderRadius: 999, objectFit: 'cover', display: 'flex' }}
            />
          ) : (
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 999,
                background: '#0C1628',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}
            >
              {monogram(team.name)}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: align,
            justifyContent: 'center',
            gap: 8,
            maxWidth: 250,
          }}
        >
          <div
            style={{
              color: '#F8FAFC',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textAlign: align === 'flex-end' ? 'right' : 'left',
            }}
          >
            {team.name}
          </div>
          <div
            style={{
              color: '#94A3B8',
              fontSize: 18,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {score.display}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          color: '#FFFFFF',
          fontSize: 140,
          fontWeight: 900,
          fontStyle: 'italic',
          lineHeight: 0.88,
          letterSpacing: '-0.08em',
        }}
      >
        {score.points}
      </div>
    </div>
  )
}

function OgCard({ preview }: { preview: GamePreviewData }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background:
          `radial-gradient(circle at 16% 18%, ${teamTint(preview.homeTeam.tint, '#21486B')}88 0%, transparent 32%),` +
          `radial-gradient(circle at 84% 18%, ${teamTint(preview.awayTeam.tint, '#1D4F4F')}88 0%, transparent 32%),` +
          'linear-gradient(135deg, #07101B 0%, #0A1424 55%, #08101A 100%)',
        color: '#fff',
        overflow: 'hidden',
        padding: '42px 48px',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 32,
          margin: 22,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '22px 22px auto 22px',
          height: 4,
          borderTopLeftRadius: 999,
          borderTopRightRadius: 999,
          background:
            preview.status === 'Live'
              ? 'linear-gradient(90deg, rgba(57,255,136,0) 0%, rgba(57,255,136,0.7) 50%, rgba(57,255,136,0) 100%)'
              : 'linear-gradient(90deg, rgba(125,211,252,0) 0%, rgba(125,211,252,0.42) 50%, rgba(125,211,252,0) 100%)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 26,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                color: '#7DD3FC',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              KickChasers
            </div>
            <div
              style={{
                display: 'flex',
                color: '#CBD5E1',
                fontSize: 26,
                fontWeight: 600,
                maxWidth: 600,
              }}
            >
              {[preview.competitionLabel, preview.roundLabel, preview.venueLabel].filter(Boolean).join(' • ')}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 160,
              padding: '12px 18px',
              borderRadius: 999,
              border:
                preview.status === 'Live'
                  ? '2px solid rgba(57,255,136,0.24)'
                  : '2px solid rgba(255,255,255,0.12)',
              background:
                preview.status === 'Live' ? 'rgba(57,255,136,0.16)' : 'rgba(255,255,255,0.06)',
              color: preview.status === 'Live' ? '#39FF88' : '#F8FAFC',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {preview.status}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            width: '100%',
          }}
        >
          <ScoreBlock team={preview.homeTeam} score={preview.homeScore} align="flex-start" />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#64748B',
                fontSize: 24,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              versus
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                width: 170,
                height: 170,
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                boxShadow: '0 18px 44px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
                color: '#E2E8F0',
                fontSize: 42,
                fontWeight: 800,
                textAlign: 'center',
                gap: 8,
              }}
            >
              <span style={{ display: 'flex' }}>
                {preview.homeScore.goals}.{preview.homeScore.behinds}
              </span>
              <span style={{ color: '#64748B', margin: '0 8px' }}>:</span>
              <span style={{ display: 'flex' }}>
                {preview.awayScore.goals}.{preview.awayScore.behinds}
              </span>
            </div>
          </div>

          <ScoreBlock team={preview.awayTeam} score={preview.awayScore} align="flex-end" />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 12,
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                color: '#94A3B8',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {preview.dateLabel}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              color: '#475569',
              fontSize: 18,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            kickchasers.com
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function handler(request: Request) {
  try {
    const url = parseRequestUrl(request)
    if (!url) {
      throw new TypeError(`Invalid request URL: ${request.url}`)
    }
    const gameId = url.searchParams.get('gameId')?.trim()

    if (!gameId) {
      return new ImageResponse(<FallbackOgCard label="Missing game" />, {
        width: 1200,
        height: 630,
        status: 400,
        headers: {
          'cache-control': 'public, max-age=60, s-maxage=60',
        },
      })
    }

    const preview = await getGamePreviewData(gameId, request)
    if (!preview) {
      return new ImageResponse(<FallbackOgCard label="Game not found" />, {
        width: 1200,
        height: 630,
        status: 404,
        headers: {
          'cache-control': 'public, max-age=60, s-maxage=60',
        },
      })
    }

    return new ImageResponse(<OgCard preview={preview} />, {
      width: 1200,
      height: 630,
      headers: {
        'cache-control':
          preview.status === 'Live'
            ? 'public, max-age=60, s-maxage=60, stale-while-revalidate=600'
            : 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('game-og handler failed', error)

    return new ImageResponse(<FallbackOgCard label="Preview unavailable" />, {
      width: 1200,
      height: 630,
      status: 500,
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=60',
      },
    })
  }
}
