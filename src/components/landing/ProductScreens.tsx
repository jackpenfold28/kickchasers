import type { ReactNode } from 'react'
import { ProductStoryStage } from './ProductStoryStage'
import { LandingMedia, type LandingAsset } from './LandingMedia'

/** Supplied device frames stay intact; the phone always occupies the front layer. */
export function DevicePair({ tablet, phone, tabletAlt, phoneAlt }: {
  tablet: LandingAsset; phone: LandingAsset; tabletAlt: string; phoneAlt: string
}) {
  return <figure className="lp-device-pair">
    <div className="lp-device-stage">
      <LandingMedia asset={tablet} alt={tabletAlt} className="lp-device-tablet" sizes="(max-width:760px) 82vw, (max-width:1100px) 78vw, 850px" />
      <LandingMedia asset={phone} alt={phoneAlt} className="lp-device-phone" sizes="(max-width:760px) 29vw, 240px" />
    </div>
    <figcaption className="lp-caption">On iPad. On iPhone. Open either screen for a closer look.</figcaption>
  </figure>
}

export type ProductScreen = { asset: LandingAsset; alt: string; label: string; sizes?: string }
export function ScreenGallery({ screens, compact = false, story = false, heading }: { screens: ProductScreen[]; compact?: boolean; story?: boolean; heading?: ReactNode }) {
  const gallery = <div className={`lp-screen-gallery${compact ? ' is-compact' : ''}`}>
    {screens.map(screen => <figure key={screen.asset}>
      <LandingMedia asset={screen.asset} alt={screen.alt} sizes={screen.sizes || "(max-width:760px) 44vw, 300px"} />
      <figcaption>{screen.label}</figcaption>
    </figure>)}
  </div>
  return story ? <ProductStoryStage kind="phones" labels={screens.map(screen => screen.label)}>{heading}{gallery}</ProductStoryStage> : gallery
}
