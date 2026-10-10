import { ImageOff, Layers3, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  formatPlayerCardRating,
  formatPlayerCardTemplate,
  type PlayerCardAlbumCard,
} from '@/lib/canonical/player-card-album'
import { usePlayerCardAlbum } from '@/hooks/usePlayerCardAlbum'

const summaryItems = [
  ['Total', 'totalCards'],
  ['Highest', 'highestRating'],
  ['Average', 'averageRating'],
  ['Gold', 'goldCards'],
  ['Posted', 'postedCards'],
] as const

function AlbumAsset({ card }: { card: PlayerCardAlbumCard }) {
  const [failed, setFailed] = useState(false)
  if (!card.imageUrl || failed) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#151D29,#090E16)] px-4 text-center">
        <ImageOff className="h-8 w-8 text-slate-600" />
        <span className="text-xs font-bold text-slate-500">Card image unavailable</span>
      </div>
    )
  }
  return (
    <img
      src={card.imageUrl}
      alt={`${formatPlayerCardTemplate(card.templateId)} Player Card`}
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full bg-[#0B111A] object-contain"
      loading="lazy"
    />
  )
}

export function PlayerCardAlbum({ album }: { album: ReturnType<typeof usePlayerCardAlbum> }) {
  if (album.state === 'idle' || album.state === 'loading') {
    return (
      <div aria-live="polite" className="space-y-4">
        <p className="sr-only">Loading Player Card Album</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#151D29]" />)}
        </div>
      </div>
    )
  }

  if (album.state === 'error') {
    return (
      <div aria-live="polite" className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center">
        <p className="text-base font-black text-white">Your Album couldn’t load</p>
        <p className="mt-2 text-sm text-red-200">{album.error ?? 'Please try again.'}</p>
        <button onClick={() => void album.refresh()} className="btn btn-secondary mt-4">Try again</button>
      </div>
    )
  }

  if (!album.cards.length) {
    return (
      <div className="rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,136,0.12),transparent_48%),#101A2A] px-6 py-14 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <Layers3 className="mx-auto h-11 w-11 text-[#39FF88]" />
        <p className="mt-4 text-lg font-black text-white">Your collection starts here</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Player Cards saved from the mobile app will appear here. Card creation is not part of the web Album.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {album.summary ? (
        <div className="grid grid-cols-5 overflow-hidden rounded-2xl bg-[#101A2A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          {summaryItems.map(([label, key], index) => {
            const value = album.summary?.[key]
            const display = key === 'highestRating' || key === 'averageRating'
              ? formatPlayerCardRating(value as number | null)
              : String(value)
            return (
              <div key={key} className={`px-1 py-3 text-center sm:px-3 ${index ? 'border-l border-white/[0.07]' : ''}`}>
                <p className="text-sm font-black tabular-nums text-white sm:text-base">{display}</p>
                <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-[9px]">{label}</p>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {album.cards.map((card) => (
          <Link
            key={card.id}
            to={`/player-card/album/${encodeURIComponent(card.id)}`}
            aria-label={`Open ${formatPlayerCardTemplate(card.templateId)} Player Card`}
            className="group relative min-w-0 overflow-hidden rounded-2xl bg-[#101A2A] outline-none transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.36)] focus-visible:ring-2 focus-visible:ring-[#39FF88] motion-reduce:transform-none"
          >
            <div className="relative overflow-hidden">
              <AlbumAsset card={card} />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.10)_50%,transparent_65%)] opacity-0 transition-opacity group-hover:opacity-100" />
              {card.postState !== 'never-posted' ? (
                <span className="absolute right-2 top-2 rounded-lg bg-[#07101D]/90 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[#39FF88]">Posted</span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2.5">
              <span className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{formatPlayerCardTemplate(card.templateId)}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-black tabular-nums text-white"><Sparkles className="h-3 w-3 text-[#F6C945]" />{formatPlayerCardRating(card.rating)}</span>
            </div>
          </Link>
        ))}
      </div>

      {album.hasMore ? (
        <button onClick={() => void album.loadMore()} disabled={album.loadingMore} className="btn btn-secondary w-full disabled:cursor-wait disabled:opacity-60">
          {album.loadingMore ? 'Loading more cards...' : 'Load more cards'}
        </button>
      ) : null}
    </div>
  )
}

