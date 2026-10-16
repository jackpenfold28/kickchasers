import { useEffect, useRef, useState } from 'react'
import assets from './landing-assets.json'

export type LandingAsset = keyof typeof assets

/** Responsive screenshots enlarge in the native modal top layer. */
export function LandingMedia({ asset, alt, className = '', priority = false, sizes = '(max-width: 760px) 92vw, 88vw', zoom = true }: {
  asset: LandingAsset; alt: string; className?: string; priority?: boolean; sizes?: string; zoom?: boolean
}) {
  const media = assets[asset]
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [expanded])
  const image = <img
    src={failed ? media.original : media.variants.find(v => v.width >= 1280)?.src || media.variants[0].src}
    srcSet={failed ? undefined : media.variants.map(v => `${v.src} ${v.width}w`).join(', ')}
    sizes={sizes} width={media.width} height={media.height} alt={alt}
    loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'}
    onError={() => { if (!failed) setFailed(true) }}
  />
  return zoom ? <>
    <button type="button" className={`lp-media lp-media-zoom ${className}`} aria-label={`Enlarge image: ${alt}`} aria-haspopup="dialog" onClick={() => { setExpanded(true); dialog.current?.showModal() }}>{image}</button>
    <dialog ref={dialog} className="lp-image-dialog" aria-label={alt} onClose={() => setExpanded(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <button type="button" className="lp-image-close" autoFocus aria-label="Close enlarged image" onClick={() => dialog.current?.close()}>×</button>
      {expanded && <img src={media.variants[media.variants.length - 1].src} alt={alt} onError={event => { event.currentTarget.onerror = null; if (event.currentTarget.src !== new URL(media.original, location.origin).href) event.currentTarget.src = media.original }} />}
    </dialog>
  </> : <div className={`lp-media ${className}`}>{image}</div>
}
