import { useEffect, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { ProfilePost } from '@/lib/canonical/profile-posts'
import { formatTeamFeedRound, type TeamLeaders } from '@/lib/canonical/team-feed-leaders'
import { loadTeamFeedLeaders } from '@/lib/team-feed-leaders'

export const TEAM_FEED_PAGES = ['Final score', 'Top ratings', 'Top disposals', 'Top scorers'] as const
export const hasTeamArtwork = (post: ProfilePost) => Boolean(post.gameId && !post.manualGameId && post.type !== 'player_stat_card' && post.type !== 'team_selection' && post.gameContext && !post.imageUrl)

function TeamLogo({ src, name, initialOnly = false }: { src?: string | null; name: string; initialOnly?: boolean }) {
  const [failed, setFailed] = useState(false)
  return <span className="team-feed-logo">{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : name.split(/\s+/).slice(0, initialOnly ? 1 : 2).map((word) => word[0]).join('')}</span>
}

export function TeamFeedArtwork({ post, page }: { post: ProfilePost; page: number }) {
  const [leaders, setLeaders] = useState<TeamLeaders | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    if (!page || leaders || !post.gameId) return
    const controller = new AbortController()
    setState('loading')
    void loadTeamFeedLeaders(post.gameId, controller.signal).then((data) => {
      if (!controller.signal.aborted) { setLeaders(data); setState('ready') }
    }).catch(() => { if (!controller.signal.aborted) setState('error') })
    return () => controller.abort()
  }, [post.gameId, page, leaders])
  const context = post.gameContext!
  const home = context.homeName ?? 'Home'
  const away = context.awayName ?? context.opponent ?? 'Away'
  // The native card uses the first word for compact club labels.
  const homeLabel = home.trim().split(/\s+/)[0]
  const awayLabel = away.trim().split(/\s+/)[0]
  const color = (value?: string | null) => /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : '#173676'
  const rows = leaders ? page === 1 ? leaders.ratings : page === 2 ? leaders.disposals : leaders.scorers : []
  const dominantSide = rows.filter((row) => row.side === 'away').length > rows.filter((row) => row.side === 'home').length ? 'away' : rows.filter((row) => row.side === 'away').length === rows.filter((row) => row.side === 'home').length ? rows[0]?.side ?? 'home' : 'home'
  const firstColor = page ? color(dominantSide === 'home' ? context.homeColor : context.awayColor) : color(context.homeColor)
  const lastColor = page ? firstColor : color(context.awayColor)
  const description = page === 0 ? `${home} ${context.homeGoals * 6 + context.homeBehinds}, ${away} ${context.awayGoals * 6 + context.awayBehinds}. ${context.homeGoals}.${context.homeBehinds} versus ${context.awayGoals}.${context.awayBehinds}.` : state === 'loading' ? 'Loading rankings.' : state === 'error' ? 'Rankings could not be loaded.' : rows.length ? rows.map((row, index) => `${index + 1}. ${row.name}: ${page === 1 ? row.rating.toFixed(1) : page === 2 ? row.disposals : `${row.goals} goals, ${row.behinds} behinds`}`).join('. ') : 'No rankings yet.'
  return <div className={`team-feed-artwork ${page === 0 ? 'team-feed-cover' : ''}`} role="img" aria-label={`${TEAM_FEED_PAGES[page]}: ${description}`} style={{ '--team-home': firstColor, '--team-away': lastColor, background: page ? `linear-gradient(135deg,${firstColor} 0%,#090e19 45%,#090e19 65%,${lastColor} 100%)` : undefined } as CSSProperties}>
    {page === 0 ? <>
      <div className="team-feed-cover-content">
        <h4 className="team-feed-round">{formatTeamFeedRound(context.round) || 'Final score'}</h4>
        <div className="team-feed-clubs">
          <div className="team-feed-team"><TeamLogo src={context.homeLogoUrl} name={home} /><span>{home}</span></div>
          <span className="team-feed-versus">VS</span>
          <div className="team-feed-team"><TeamLogo src={context.awayLogoUrl} name={away} /><span>{away}</span></div>
        </div>
        <div className="team-feed-score">
          <div><strong data-wide={context.homeGoals * 6 + context.homeBehinds >= 100}>{context.homeGoals * 6 + context.homeBehinds}</strong><span>{context.homeGoals}.{context.homeBehinds}</span></div>
          <span className="team-feed-score-dash" aria-hidden="true">–</span>
          <div><strong data-wide={context.awayGoals * 6 + context.awayBehinds >= 100}>{context.awayGoals * 6 + context.awayBehinds}</strong><span>{context.awayGoals}.{context.awayBehinds}</span></div>
        </div>
        <div className="team-feed-match">{context.leagueName ? <strong>{context.leagueName}</strong> : null}{context.venue ? <p>{context.venue}</p> : null}{context.date ? <p>{new Date(context.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p> : null}</div>
      </div>
    </> : <div className="team-feed-ranking">
      <header><h4>{TEAM_FEED_PAGES[page]}</h4><p className="flex items-center gap-1">{page === 1 ? <Star className="h-3 w-3 fill-[#F6C344] text-[#F6C344]" aria-hidden="true" /> : null}{page === 1 ? 'Impact 7' : page === 2 ? 'Top 5 KickChasers' : 'Sausage rolls'}</p></header>
      {state === 'loading' ? <p className="team-feed-message" role="status">Loading rankings…</p> : state === 'error' ? <p className="team-feed-message">Rankings could not be loaded. Select a category to retry.</p> : !rows.length ? <p className="team-feed-message">{page === 1 ? 'No ratings yet.' : page === 2 ? 'No disposals yet.' : 'No scores yet.'}</p> : <ol>{rows.map((row, index) => <li key={row.key}>
        <span className="team-feed-rank">{index + 1}</span><TeamLogo src={row.avatarUrl} name={row.name} initialOnly />
        <div className="team-feed-player"><strong>{row.name}</strong><p>{row.number != null ? `${row.number} · ` : ''}{row.side === 'away' ? awayLabel : homeLabel}</p></div>
        <div className="team-feed-value"><strong>{page === 1 ? row.rating.toFixed(1) : page === 2 ? row.disposals : `${row.goals}.${row.behinds}`}</strong><span>{page === 1 ? 'Rating' : page === 2 ? 'Disposals' : 'G.B'}</span></div>
      </li>)}</ol>}
    </div>}
  </div>
}

export function TeamFeedNavigation({ page, onChange, label }: { page: number; onChange: (page: number) => void; label: string }) {
  return <div className="team-feed-navigation flex min-h-11 items-center justify-between gap-1" role="group" aria-label={`${label} slides`}>
    <button type="button" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label={`Previous ${label} slide`} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#39FF14] disabled:opacity-25"><ChevronLeft className="h-4 w-4" /></button>
    <div className="flex">{TEAM_FEED_PAGES.map((title, index) => <button key={title} type="button" onClick={() => onChange(index)} aria-label={`${label}: ${title}`} aria-pressed={page === index} className="flex h-11 w-8 items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-[#39FF14]"><span className={`h-2 w-2 rounded-full ${index === page ? 'bg-white' : 'bg-slate-500'}`} /></button>)}</div>
    <button type="button" disabled={page === 3} onClick={() => onChange(page + 1)} aria-label={`Next ${label} slide`} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#39FF14] disabled:opacity-25"><ChevronRight className="h-4 w-4" /></button>
  </div>
}
