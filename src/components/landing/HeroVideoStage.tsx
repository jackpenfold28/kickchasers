import { useEffect, useRef, useState, type ReactNode } from 'react'
import { openingScrollProgress, reverseVideoTime } from './hero-video-progress'

const VIDEO = '/landing/video/kickchasers-marketing.mp4'
const POSTER = '/landing/video/hero-poster.webp'

/** The opening film rewinds with natural scroll before the dedicated product chapters. */
export function HeroVideoStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [eligible, setEligible] = useState(false)
  const [still, setStill] = useState(false)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const enabled = eligible && !still && !failed

  useEffect(() => {
    const preference = window.matchMedia('(min-width: 1000px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)')
    const update = () => setEligible(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const media = video.current
    const container = stage.current
    setReady(false)
    if (!enabled || !media || !container) return
    let frame = 0
    let desiredTime = 0
    let disposed = false
    // Serialise seeks. A fast scroll replaces the target instead of queueing frames.
    const seek = () => {
      if (disposed || media.readyState < 1 || !Number.isFinite(media.duration) || media.seeking) return
      if (Math.abs(media.currentTime - desiredTime) > 1 / 48) {
        try { media.currentTime = desiredTime } catch { setFailed(true) }
      } else if (media.readyState >= 2) setReady(true)
    }
    const measure = () => {
      frame = 0
      const bounds = container.getBoundingClientRect()
      const header = container.closest('main')?.querySelector('header')?.getBoundingClientRect().height || 0
      const progress = openingScrollProgress(window.scrollY, bounds.top + window.scrollY, bounds.height + window.innerHeight * .5, window.innerHeight, header)
      desiredTime = reverseVideoTime(progress, media.duration)
      seek()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    const onSeeked = () => { if (!disposed) { setReady(true); seek() } }
    media.pause()
    media.muted = true
    media.addEventListener('loadedmetadata', schedule)
    media.addEventListener('loadeddata', schedule)
    media.addEventListener('seeked', onSeeked)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined
    resize?.observe(container)
    schedule()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      media.removeEventListener('loadedmetadata', schedule)
      media.removeEventListener('loadeddata', schedule)
      media.removeEventListener('seeked', onSeeked)
      media.pause()
    }
  }, [enabled])

  return <div ref={stage} className={`lp-video-stage lp-wrap ${enabled ? 'has-scroll-video' : ''}`}>
    <div className="lp-video-stage-content">{children}</div>
    <figure className="lp-hero-film">
      <div className="lp-hero-film-frame" role="img" aria-label="Northside Hawks player under stadium lights. Scrolling down pulls the scene back toward sunset.">
        <img src={POSTER} width={1080} height={1920} alt="" fetchPriority="high" decoding="async" />
        {enabled && <video ref={video} src={VIDEO} poster={POSTER} width={1080} height={1920}
          muted playsInline preload="auto" aria-hidden="true" tabIndex={-1}
          className={ready ? 'is-ready' : ''} onError={() => setFailed(true)} />}
      </div>
      <figcaption className="lp-hero-film-caption"><span>{enabled ? 'Scroll to see your game differently ↓' : 'Your player. Your game.'}</span><span>KICKCHASERS</span></figcaption>
      {eligible && !failed && <button className="lp-film-toggle" type="button" aria-pressed={still} onClick={() => setStill(value => !value)}>{still ? 'Enable scroll video' : 'Use still image'}</button>}
    </figure>
  </div>
}
