import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, ImageOff, MessageCircle, RefreshCw, Users2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

import type { useDashboardCommunityActivity } from '@/hooks/useDashboardCommunityActivity'
import { profilePostTitle, type ProfilePost } from '@/lib/canonical/profile-posts'
import { listPostComments, type PostComment } from '@/lib/post-comments'
import { getPostLike, setPostLike } from '@/lib/post-likes'
import { hasTeamArtwork, TeamFeedArtwork, TeamFeedNavigation } from './TeamFeedArtwork'

const control = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] disabled:cursor-not-allowed disabled:opacity-30'

function RecapArtwork({ post, expanded = false, page = 0 }: { post: ProfilePost; expanded?: boolean; page?: number }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [post.imageUrl])
  const author = post.authorName?.trim() || 'KickChaser'
  if (hasTeamArtwork(post)) return <TeamFeedArtwork post={post} page={page} />

  if (!post.imageUrl || failed) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-xl bg-[#0A1220] p-5 text-center text-sm text-slate-400">
        {failed || !post.body ? <ImageOff className="mb-3 h-6 w-6" aria-hidden="true" /> : <MessageCircle className="mb-3 h-6 w-6" aria-hidden="true" />}
        <p className={`${expanded ? 'whitespace-pre-wrap' : 'line-clamp-6'} break-words`}>{post.body || 'Activity image unavailable.'}</p>
      </div>
    )
  }

  return (
    <img
      src={post.imageUrl}
      alt={`${profilePostTitle(post)} shared by ${author}`}
      loading={expanded ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={expanded
        ? 'mx-auto block max-h-[72dvh] w-full rounded-xl object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] lg:max-h-[82dvh]'
        : 'h-full w-full rounded-xl object-contain'}
    />
  )
}

function ExpandedPost({ post, viewerId, onClose, initialPage }: { post: ProfilePost; viewerId: string; onClose: () => void; initialPage: number }) {
  const [page, setPage] = useState(initialPage)
  const dialog = useRef<HTMLDialogElement>(null)
  const likeRequest = useRef<AbortController | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentState, setCommentState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [like, setLike] = useState({ liked: false, count: post.likeCount })
  const [likeState, setLikeState] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [likeError, setLikeError] = useState<string | null>(null)
  const [likeAttempt, setLikeAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCommentState('loading')
    void listPostComments(post.id, viewerId, controller.signal).then((rows) => {
      if (!controller.signal.aborted) {
        setComments(rows)
        setCommentState('ready')
      }
    }).catch(() => { if (!controller.signal.aborted) setCommentState('error') })
    return () => controller.abort()
  }, [post.id, viewerId, attempt])

  useEffect(() => {
    const controller = new AbortController()
    likeRequest.current = controller
    setLikeState('loading')
    setLikeError(null)
    void getPostLike(post.id, viewerId, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setLike(value); setLikeState('ready') }
    }).catch(() => {
      if (!controller.signal.aborted) { setLikeState('error'); setLikeError('Likes could not be loaded.') }
    })
    return () => controller.abort()
  }, [post.id, viewerId, likeAttempt])

  useEffect(() => {
    const node = dialog.current
    const previousOverflow = document.body.style.overflow
    node?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      node?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  async function toggleLike() {
    if (likeState !== 'ready') return
    const signal = likeRequest.current?.signal
    if (!signal || signal.aborted) return
    setLikeState('saving')
    setLikeError(null)
    try {
      await setPostLike(post.id, viewerId, !like.liked)
      const current = await getPostLike(post.id, viewerId, signal)
      if (!signal.aborted) { setLike(current); setLikeState('ready') }
    } catch {
      if (!signal.aborted) {
        setLikeState('error')
        setLikeError('Your like could not be updated. Please try again.')
      }
    }
  }

  function close() {
    dialog.current?.close()
    onClose()
  }

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby="community-post-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
      className="m-auto max-h-[94dvh] w-[calc(100%-24px)] max-w-5xl overflow-y-auto border-0 bg-transparent p-0 pt-14 text-slate-100 outline-none backdrop:bg-black/85 lg:pt-0"
    >
      <h2 id="community-post-title" className="sr-only">{profilePostTitle(post)}</h2>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)] lg:gap-7">
        <div className={hasTeamArtwork(post) ? "team-feed-expanded relative mx-auto w-full min-w-0" : "min-w-0"}><RecapArtwork post={post} expanded page={page} />{hasTeamArtwork(post) ? <TeamFeedNavigation page={page} onChange={setPage} label="Expanded team recap" /> : null}</div>
        <section aria-labelledby="community-comments-title" className="min-w-0 rounded-2xl bg-[#0A1220] p-4 shadow-xl sm:p-5">
          <div className="flex items-center gap-3">
            <h3 id="community-comments-title" className="mr-auto flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Comments <span className="text-slate-400">({post.commentCount})</span>
            </h3>
            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={likeState !== 'ready'}
              aria-label={like.liked ? 'Unlike recap' : 'Like recap'}
              aria-pressed={like.liked}
              aria-busy={likeState === 'saving' || likeState === 'loading'}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] disabled:opacity-40 ${like.liked ? 'text-[#39FF14]' : 'text-slate-300'}`}
            >
              <Heart className={`h-4 w-4 ${like.liked ? 'fill-current' : ''}`} aria-hidden="true" /> {like.count}
            </button>
            <button type="button" autoFocus onClick={close} aria-label="Close expanded post" className={`${control} absolute right-0 top-0 bg-[#0A1220] lg:static`}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {likeError ? <div role="alert" className="mt-3 text-sm text-red-200"><p>{likeError}</p><button type="button" onClick={() => setLikeAttempt((value) => value + 1)} className="mt-1 min-h-11 rounded px-2 font-semibold text-[#9CE8BE] focus-visible:ring-2 focus-visible:ring-[#39FF14]">Retry likes</button></div> : null}
          <div className="mt-4" aria-live="polite" aria-busy={commentState === 'loading'}>
            {commentState === 'loading' ? <p className="text-sm text-slate-400">Loading comments…</p> : null}
            {commentState === 'error' ? (
              <div role="alert">
                <p className="text-sm text-red-200">Comments could not be loaded.</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#9CE8BE] focus-visible:ring-2 focus-visible:ring-[#39FF14]">Try again</button>
              </div>
            ) : null}
            {commentState === 'ready' && !comments.length ? <p className="text-sm text-slate-400">{post.commentCount ? 'No comments available to show.' : 'No comments yet.'}</p> : null}
            {commentState === 'ready' && comments.length ? (
              <ul className="space-y-5">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-b border-white/10 pb-4">
                    <p className="text-sm font-semibold text-slate-100">{comment.authorId ? <Link to={comment.authorId === viewerId ? '/profile' : `/users/${encodeURIComponent(comment.authorId)}`} className="rounded focus-visible:ring-2 focus-visible:ring-[#39FF14]">{comment.authorName}</Link> : comment.authorName}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{comment.body}</p>
                    <time dateTime={comment.createdAt} className="mt-2 block text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </dialog>, document.body
  )
}

function RecapPreview({ post, onOpen, canFollow, following, followError, onFollow }: { post: ProfilePost; onOpen: (trigger: HTMLButtonElement, page: number) => void; canFollow: boolean; following: boolean; followError?: string; onFollow: () => Promise<boolean> }) {
  const author = post.authorName?.trim() || 'KickChaser'
  const artworkButton = useRef<HTMLButtonElement>(null)
  const [page, setPage] = useState(0)
  return (
    <div className="feed-recap relative w-[78%] max-w-[300px] shrink-0 snap-start rounded-xl sm:w-[260px]">
    <button
      ref={artworkButton}
      type="button"
      onClick={(event) => onOpen(event.currentTarget, page)}
      aria-label={`Expand ${profilePostTitle(post)} by ${author}`}
      aria-haspopup="dialog"
      className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080E1A]"
    >
      <div className="aspect-[4/5]"><RecapArtwork post={post} page={page} /></div>
    </button>
    {hasTeamArtwork(post) ? <TeamFeedNavigation page={page} onChange={setPage} label={`${post.gameContext?.homeName ?? 'Home'} versus ${post.gameContext?.awayName ?? post.gameContext?.opponent ?? 'Away'}`} /> : null}
    {canFollow && (!hasTeamArtwork(post) || page === 0) ? <button type="button" onClick={() => void onFollow().then((success) => { if (success) artworkButton.current?.focus() })} disabled={following} aria-label={`Follow ${author}`} title={`Follow ${author}`} aria-busy={following} className="absolute right-2 top-2 inline-flex min-h-11 items-center justify-center rounded-full bg-[#0A1220] px-4 text-sm font-semibold text-[#39FF14] shadow-lg transition hover:bg-[#152132] hover:text-[#50FF2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60">{following ? 'Following…' : 'Follow'}</button> : null}
    {followError ? <p role="alert" className="absolute inset-x-2 bottom-2 rounded-lg bg-[#0A1220] p-3 text-xs leading-5 text-red-200">{followError}</p> : null}
    </div>
  )
}

export default function DashboardCommunityActivity({ viewerId, activity }: { viewerId: string; activity: ReturnType<typeof useDashboardCommunityActivity> }) {
  const track = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const motionFrame = useRef<number | null>(null)
  const [selected, setSelected] = useState<ProfilePost | null>(null)
  const [selectedPage, setSelectedPage] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    if (!selected) opener.current?.focus()
  }, [selected])

  function updateEdges() {
    const node = track.current
    if (!node) return
    const start = node.scrollLeft <= 5
    const end = node.scrollLeft + node.clientWidth >= node.scrollWidth - 5
    setEdges((current) => current.start === start && current.end === end ? current : { start, end })
    if (motionFrame.current != null) return
    motionFrame.current = requestAnimationFrame(() => {
      motionFrame.current = null
      const bounds = node.getBoundingClientRect()
      // Layout offsets stay stable while each preview's visual transform changes.
      for (const item of Array.from(node.children) as HTMLElement[]) {
        const left = bounds.left + item.offsetLeft - node.scrollLeft
        const visible = Math.max(0, Math.min(left + item.offsetWidth, bounds.right) - Math.max(left, bounds.left)) / item.offsetWidth
        item.style.setProperty('--feed-visibility', String(visible))
      }
    })
  }

  useEffect(() => {
    updateEdges()
    const observer = new ResizeObserver(updateEdges)
    if (track.current) observer.observe(track.current)
    return () => {
      observer.disconnect()
      if (motionFrame.current != null) cancelAnimationFrame(motionFrame.current)
      motionFrame.current = null
    }
  }, [activity.items])

  function move(direction: number) {
    const node = track.current
    if (!node) return
    node.scrollBy({ left: direction * (((node.firstElementChild as HTMLElement | null)?.offsetWidth ?? 260) + 16), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <section aria-labelledby="community-heading" className="min-w-0">
      <header className="mb-1 flex items-center justify-between gap-4">
        <h2 id="community-heading" className="text-base font-semibold text-slate-100">The Feed</h2>
        {activity.state === 'ready' && activity.items.length ? (
          <div className="flex gap-2">
            <button type="button" aria-label="Previous feed cards" aria-controls="community-carousel" disabled={edges.start} onClick={() => move(-1)} className={control}><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" aria-label="Next feed cards" aria-controls="community-carousel" disabled={edges.end} onClick={() => move(1)} className={control}><ChevronRight className="h-5 w-5" /></button>
          </div>
        ) : null}
      </header>
      {activity.state === 'loading' || activity.state === 'idle' ? (
        <div className="flex gap-4 overflow-hidden py-5" aria-label="Loading community activity" aria-busy="true">
          {[0, 1, 2].map((index) => <div key={index} className="aspect-[4/5] w-[260px] shrink-0 animate-pulse rounded-xl bg-white/[0.04] motion-reduce:animate-none" />)}
        </div>
      ) : null}
      {activity.state === 'error' ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
          <p className="font-semibold">Community activity could not be loaded.</p>
          <p className="mt-1 text-red-200/75">Your other Dashboard information is still available.</p>
          <button type="button" onClick={() => void activity.refresh()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#39FF14]"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button>
        </div>
      ) : null}
      {activity.state === 'ready' && !activity.items.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/12 p-6 text-center">
          <Users2 className="mx-auto h-7 w-7 text-[#39FF88]" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">No recent community activity yet.</p>
          <p className="mt-1 text-sm text-slate-400">Posts from the KickChasers community will appear here.</p>
          <Link to="/profile" className="mt-4 inline-flex rounded-lg text-sm font-semibold text-[#9CE8BE] focus-visible:ring-2 focus-visible:ring-[#39FF14]">Open your profile</Link>
        </div>
      ) : null}
      {activity.state === 'ready' && activity.items.length ? (
        <div ref={track} id="community-carousel" role="region" aria-roledescription="carousel" aria-label="Feed cards" onScroll={updateEdges} className="feed-carousel relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-1 py-5">
          {activity.items.map((post) => <RecapPreview key={post.id} post={post} canFollow={post.authorId !== viewerId && !activity.followedAuthorIds.has(post.authorId)} following={activity.followingAuthorIds.has(post.authorId)} followError={activity.followErrors[post.authorId]} onFollow={() => activity.followAuthor(post.authorId)} onOpen={(trigger, page) => { opener.current = trigger; setSelectedPage(page); setSelected(post) }} />)}
        </div>
      ) : null}
      <p role="status" className="sr-only">{activity.followNotice}</p>
      {activity.state === 'ready' && activity.hasMore ? <div className="mt-1 flex flex-col items-start gap-2"><button type="button" onClick={() => void activity.loadMore()} disabled={activity.loadingMore} aria-busy={activity.loadingMore} className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] disabled:opacity-50">{activity.loadingMore ? 'Loading posts…' : 'Load more posts'}</button>{activity.moreError ? <p role="alert" className="text-sm text-red-200">{activity.moreError}</p> : null}</div> : null}
      {selected ? <ExpandedPost post={selected} initialPage={selectedPage} viewerId={viewerId} onClose={() => setSelected(null)} /> : null}
    </section>
  )
}
