import { useState } from 'react'
import assets from './landing-assets.json'

export type LandingAsset = keyof typeof assets

/** Faithful, responsive product proof. Originals also provide a zoomable fallback. */
export function LandingMedia({ asset, alt, className = '', priority = false, sizes = '(max-width: 760px) 92vw, 88vw', zoom = true }: {
  asset: LandingAsset; alt: string; className?: string; priority?: boolean; sizes?: string; zoom?: boolean
}) {
  const media = assets[asset]
  const [failed, setFailed] = useState(false)
  const image = <img
    src={failed ? media.original : media.variants.find(v => v.width >= 1280)?.src || media.variants[0].src}
    srcSet={failed ? undefined : media.variants.map(v => `${v.src} ${v.width}w`).join(', ')}
    sizes={sizes} width={media.width} height={media.height} alt={alt}
    loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'}
    onError={() => { if (!failed) setFailed(true) }}
  />
  return zoom ? <a className={`lp-media ${className}`} href={media.original} target="_blank" rel="noreferrer" aria-label={`View full-size image: ${alt} (opens in a new tab)`}>{image}</a>
    : <div className={`lp-media ${className}`}>{image}</div>
}
