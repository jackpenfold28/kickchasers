import { ArrowLeft, ExternalLink, ImageOff, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  albumCardDestination,
  formatPlayerCardRating,
  formatPlayerCardTemplate,
  type PlayerCardAlbumCard,
} from '@/lib/canonical/player-card-album'
import { getPlayerCardAlbumCard } from '@/lib/player-card-album'
import { supabase } from '@/lib/supabase'

type PageState = 'loading' | 'ready' | 'unavailable' | 'error'
const createdDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

export default function PlayerCardAlbumPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [card, setCard] = useState<PlayerCardAlbumCard | null>(null)
  const [state, setState] = useState<PageState>('loading')
  const [assetFailed, setAssetFailed] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let active = true
    setState('loading')
    setAssetFailed(false)
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const ownerProfileId = data.session?.user?.id ?? null
        if (!ownerProfileId || !id) {
          if (active) setState('unavailable')
          return
        }
        const next = await getPlayerCardAlbumCard({ cardId: id, ownerProfileId, viewerUserId: ownerProfileId })
        if (!active) return
        setCard(next)
        setState(next ? 'ready' : 'unavailable')
      } catch {
        if (active) setState('error')
      }
    })()
    return () => { active = false }
  }, [id])

  const destination = useMemo(() => card ? albumCardDestination(card) : null, [card])

  async function shareCard() {
    if (!card?.imageUrl || !navigator.share || sharing) return
    setSharing(true)
    try {
      await navigator.share({ title: `${formatPlayerCardTemplate(card.templateId)} Player Card`, url: card.imageUrl })
    } catch {
      // Browser share cancellation is not an Album failure.
    } finally {
      setSharing(false)
    }
  }

  if (state === 'loading') {
    return <div aria-live="polite" className="mx-auto aspect-[4/5] max-h-[75vh] w-full max-w-xl animate-pulse rounded-[28px] bg-[#151D29]" />
  }

  if (state === 'unavailable' || state === 'error' || !card) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl bg-[#101A2A] p-8 text-center">
        <ImageOff className="mx-auto h-10 w-10 text-slate-600" />
        <h1 className="mt-4 text-xl font-black text-white">{state === 'error' ? 'Album request failed' : 'Card unavailable'}</h1>
        <p className="mt-2 text-sm text-slate-400">{state === 'error' ? 'Please return to your Album and try again.' : 'This card may have been removed, is not ready, or does not belong to this account.'}</p>
        <Link to="/profile?tab=album" className="btn btn-secondary mt-5 inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back to Album</Link>
      </section>
    )
  }

  const created = new Date(card.createdAt)
  return (
    <section className="-m-6 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_50%_10%,rgba(57,255,136,0.09),transparent_32%),#05080D] px-4 py-6 sm:-m-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center justify-between gap-4">
          <Link to="/profile?tab=album" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm font-black text-white hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88]"><ArrowLeft className="h-4 w-4" /> Album</Link>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#39FF88]">My Card Collection</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Revision {card.assetRevision}</p>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="flex min-h-[58vh] items-center justify-center rounded-[28px] border border-white/[0.07] bg-black/30 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.42)] sm:p-6">
            {card.imageUrl && !assetFailed ? (
              <img src={card.imageUrl} onError={() => setAssetFailed(true)} alt={`${formatPlayerCardTemplate(card.templateId)} Player Card`} className="max-h-[76vh] w-auto max-w-full rounded-2xl object-contain" />
            ) : (
              <div className="flex aspect-[4/5] w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-[#101720] text-center">
                <ImageOff className="h-12 w-12 text-slate-600" />
                <p className="mt-3 text-sm font-black text-slate-400">Stored card image unavailable</p>
                <p className="mt-1 text-xs text-slate-600">The Album record is intact; no replacement image was generated.</p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl bg-[#101A2A] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Player Card</p>
            <h1 className="mt-2 text-2xl font-black text-white">{formatPlayerCardTemplate(card.templateId)}</h1>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#080E1A] p-3"><p className="text-xl font-black text-white">{formatPlayerCardRating(card.rating)}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Rating</p></div>
              <div className="rounded-xl bg-[#080E1A] p-3"><p className="truncate text-sm font-black capitalize text-white">{card.postState.replaceAll('-', ' ')}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-500">Feed history</p></div>
            </div>
            <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
              <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">Source</dt><dd className="text-right font-black capitalize text-slate-300">{card.sourceKind.replaceAll('-', ' ')}</dd></div>
              <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">Saved</dt><dd className="text-right font-black text-slate-300">{Number.isNaN(created.getTime()) ? 'Unavailable' : createdDate.format(created)}</dd></div>
              {card.playerNumber != null ? <div className="flex justify-between gap-3"><dt className="font-bold text-slate-500">Player</dt><dd className="font-black text-slate-300">#{card.playerNumber}</dd></div> : null}
            </dl>

            <div className="mt-6 space-y-2">
              {destination ? <Link to={destination.href} className="btn btn-primary flex w-full items-center justify-center gap-2">{destination.label}<ExternalLink className="h-4 w-4" /></Link> : null}
              {card.imageUrl ? <a href={card.imageUrl} target="_blank" rel="noreferrer" className="btn btn-secondary flex w-full items-center justify-center gap-2">Open original image<ExternalLink className="h-4 w-4" /></a> : null}
              {card.imageUrl && typeof navigator.share === 'function' ? <button onClick={() => void shareCard()} disabled={sharing} className="btn btn-secondary flex w-full items-center justify-center gap-2 disabled:opacity-60"><Share2 className="h-4 w-4" />{sharing ? 'Opening share...' : 'Share card'}</button> : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
