import { useEffect, useState } from 'react'
import { Heart, ImageOff, LockKeyhole, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  profilePostContext,
  profilePostAuthorDestination,
  profilePostDestination,
  profilePostStats,
  profilePostTitle,
  type ProfilePost,
} from '@/lib/canonical/profile-posts'

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function ActivityAvatar({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#0A1220] text-xs font-black text-slate-300">
      {src && !failed ? (
        <img src={src} alt={`${name} avatar`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function ActivityMedia({ src, alt, compact }: { src: string; alt: string; compact: boolean }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  if (failed) {
    return (
      <div className="flex min-h-28 items-center justify-center gap-2 bg-[#080E1A] px-4 py-8 text-sm font-semibold text-slate-500">
        <ImageOff className="h-5 w-5" aria-hidden="true" /> Stored activity image unavailable.
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`${compact ? 'max-h-[420px]' : 'max-h-[620px]'} w-full bg-[#080E1A] object-contain`} />
}

export function PostActivityCard({
  post,
  authorId,
  authorName,
  authorAvatarUrl = null,
  viewerId = null,
  variant = 'default',
}: {
  post: ProfilePost
  authorId: string
  authorName: string
  authorAvatarUrl?: string | null
  viewerId?: string | null
  variant?: 'default' | 'compact'
}) {
  const destination = profilePostDestination(post, authorId)
  const context = profilePostContext(post.payload)
  const stats = profilePostStats(post.payload)
  const created = new Date(post.createdAt)
  const compact = variant === 'compact'
  const authorHref = viewerId ? profilePostAuthorDestination(authorId, viewerId) : `/users/${encodeURIComponent(authorId)}`

  return (
    <article className="overflow-hidden rounded-2xl bg-[#101A2A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className={`flex items-start justify-between gap-4 ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
        {viewerId ? <div className="flex min-w-0 items-center gap-3">
          <Link to={authorHref} aria-label={`View ${authorName}'s profile`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101A2A]">
            <ActivityAvatar src={authorAvatarUrl} name={authorName} />
          </Link>
          <div className="min-w-0">
          <Link to={authorHref} className="block truncate text-sm font-black text-white hover:text-[#39FF88] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88]">{authorName}</Link>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {profilePostTitle(post)} · <time dateTime={post.createdAt}>{Number.isNaN(created.getTime()) ? 'Date unavailable' : dateTime.format(created)}</time>
          </p>
          </div>
        </div> : (
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{authorName}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {profilePostTitle(post)} · <time dateTime={post.createdAt}>{Number.isNaN(created.getTime()) ? 'Date unavailable' : dateTime.format(created)}</time>
            </p>
          </div>
        )}
        {post.visibility === 'followers' ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
            <LockKeyhole className="h-3 w-3" /> Followers
          </span>
        ) : null}
      </div>

      {post.imageUrl ? compact
        ? <ActivityMedia src={post.imageUrl} alt={`${profilePostTitle(post)} shared by ${authorName}`} compact />
        : <img src={post.imageUrl} alt="" className="max-h-[620px] w-full bg-[#080E1A] object-contain" />
      : null}

      <div className={`space-y-3 ${compact ? 'p-4' : 'p-4 sm:p-5'}`}>
        {context.length ? <p className="text-xs font-black uppercase tracking-[0.12em] text-[#39FF88]">{context.join(' · ')}</p> : null}
        {post.gameContext ? (
          <div className="rounded-xl bg-[#080E1A] px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-sm font-black text-white">
              <span className="truncate">{post.gameContext.homeName ?? 'Home'}</span>
              <span className="shrink-0 tabular-nums">{post.gameContext.homeGoals}.{post.gameContext.homeBehinds} – {post.gameContext.awayGoals}.{post.gameContext.awayBehinds}</span>
              <span className="truncate text-right">{post.gameContext.awayName ?? post.gameContext.opponent ?? 'Away'}</span>
            </div>
            {[post.gameContext.round, post.gameContext.venue].filter(Boolean).length ? <p className="mt-1 text-center text-xs font-semibold text-slate-500">{[post.gameContext.round, post.gameContext.venue].filter(Boolean).join(' · ')}</p> : null}
          </div>
        ) : null}
        {stats.length ? (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-4'}`}>
            {stats.map((stat) => <div key={stat.label} className="rounded-lg bg-[#080E1A] p-2 text-center"><p className="text-base font-black text-white">{stat.value}</p><p className="text-[10px] font-bold uppercase text-slate-500">{stat.label}</p></div>)}
          </div>
        ) : null}
        {post.body ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{post.body}</p> : null}
        {!post.body && !post.imageUrl ? <p className="text-sm text-slate-400">Activity details are unavailable.</p> : null}
        <div className="flex items-center gap-4 border-t border-white/[0.07] pt-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> {post.likeCount}</span>
          <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {post.commentCount}</span>
          {destination ? <Link to={destination.href} className="ml-auto rounded text-[#39FF88] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88]">{destination.label}</Link> : null}
        </div>
      </div>
    </article>
  )
}
