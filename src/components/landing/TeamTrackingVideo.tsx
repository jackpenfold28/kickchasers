import { useEffect, useRef, useState, type ReactNode } from 'react'
import { shouldPlayDemo } from './video-playback'

/** Loop only in view, while respecting manual pause, tab visibility and reduced motion. */
export function TeamTrackingVideo({ children }: { children: ReactNode }) {
  const [failed, setFailed] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const media = video.current
    if (!media || failed) return
    const preference = window.matchMedia('(prefers-reduced-motion: no-preference)')
    let visible = false
    let userPaused = false
    let automaticPause = false
    let disposed = false
    const update = () => {
      const shouldPlay = shouldPlayDemo(visible, document.hidden, preference.matches, userPaused)
      if (shouldPlay) {
        void media.play().then(() => { if (disposed || !visible || document.hidden || !preference.matches) media.pause() }).catch(() => { /* Native controls remain available. */ })
      } else if (!media.paused) {
        automaticPause = true
        media.pause()
      }
    }
    const onPause = () => {
      if (!automaticPause && visible && !document.hidden && preference.matches) userPaused = true
      automaticPause = false
    }
    const onPlay = () => {
      userPaused = false
      if (!visible || document.hidden) { automaticPause = true; media.pause() }
    }
    // No observer means a safe manually playable fallback, with geometry checks.
    const checkVisibility = () => {
      const bounds = media.getBoundingClientRect()
      visible = bounds.bottom > 0 && bounds.top < window.innerHeight
      update()
    }
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2
      update()
    }, { threshold: [0, .2] }) : undefined
    media.muted = true
    media.addEventListener('pause', onPause)
    media.addEventListener('play', onPlay)
    observer?.observe(media)
    if (!observer) {
      window.addEventListener('scroll', checkVisibility, { passive: true })
      window.addEventListener('resize', checkVisibility)
      checkVisibility()
    }
    preference.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
      preference.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
      media.removeEventListener('pause', onPause)
      media.removeEventListener('play', onPlay)
      media.pause()
    }
  }, [failed])
  if (failed) return <>{children}</>
  return <video ref={video} className="lp-team-video" src="/landing/video/team-tracking.mp4"
    poster="/landing/originals/team-tracking.png" width={1920} height={1336}
    controls muted playsInline loop preload="metadata" aria-label="KickChasers team tracking demonstration"
    onError={() => setFailed(true)}>{children}</video>
}
