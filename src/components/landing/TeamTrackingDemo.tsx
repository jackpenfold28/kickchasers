import { useEffect, useRef, useState } from 'react'
import { Expand } from 'lucide-react'
import { LandingMedia } from './LandingMedia'
import { TeamTrackingVideo } from './TeamTrackingVideo'

const frame = <img className="lp-ipad-demo-frame" src="/landing/screenshots/Ipad/blank%20Ipad.png" width={4382} height={3105} alt="" aria-hidden="true" loading="lazy" decoding="async"/>
const fallback = <LandingMedia asset="team-tracking" alt="KickChasers team tracking with player roster, live scores and stat controls" zoom={false}/>

/** Native dialog matches image previews while keeping the iPad around both players. */
export function TeamTrackingDemo() {
  const [expanded, setExpanded] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const preview = useRef<HTMLElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [expanded])
  const open = () => {
    setStartTime(preview.current?.querySelector('video')?.currentTime || 0)
    setExpanded(true)
    dialog.current?.showModal()
  }
  const close = () => {
    const inline = preview.current?.querySelector('video')
    const enlarged = dialog.current?.querySelector('video')
    if (inline && enlarged) inline.currentTime = enlarged.currentTime
    setExpanded(false)
    trigger.current?.focus({ preventScroll:true })
  }
  return <>
    <figure ref={preview} id="team-demo" className="lp-ipad-demo lp-hero-demo" aria-label="Team tracking on iPad">
      <TeamTrackingVideo suspended={expanded}>{fallback}</TeamTrackingVideo>
      {frame}
      <button ref={trigger} type="button" className="lp-video-enlarge" aria-label="Enlarge team tracking video" aria-haspopup="dialog" onClick={open}><span><Expand size={18} aria-hidden="true"/>Enlarge</span></button>
    </figure>
    <dialog ref={dialog} className="lp-image-dialog lp-video-dialog" aria-label="Enlarged team tracking video" onClose={close} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <button type="button" className="lp-image-close" autoFocus aria-label="Close enlarged video" onClick={() => dialog.current?.close()}>×</button>
      {expanded && <figure className="lp-ipad-demo" aria-label="Team tracking on iPad"><TeamTrackingVideo startTime={startTime}>{fallback}</TeamTrackingVideo>{frame}</figure>}
    </dialog>
  </>
}
