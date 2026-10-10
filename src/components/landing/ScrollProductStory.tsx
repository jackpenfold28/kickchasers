import { useEffect, useRef, useState } from 'react'
import { LandingMedia, type LandingAsset } from './LandingMedia'

export const productSteps: { title: string; description: string; asset: LandingAsset; alt: string }[] = [
  { title: 'Track', description: 'Choose your player. Tap the stat. Keep up with the game, one action at a time.', asset: 'team-tracking', alt: 'Full team roster, selected player and live stat pad' },
  { title: 'Map', description: 'Select the stats that matter, then tap where the action happened on the oval.', asset: 'team-mapping', alt: 'Team field mapping with selectable stats and mapped event locations' },
  { title: 'Analyse', description: 'Follow the Score Worm and live momentum indicator as the match unfolds.', asset: 'team-mapping', alt: 'Team tracker including Score Worm and live momentum analysis' },
  { title: 'Review', description: 'Bring the score, player totals and quarter breakdowns together in your match summary.', asset: '09-professional-match-summaries', alt: 'Match Summary with player totals, quarter filters and live match scores' },
  { title: 'Create', description: 'Turn a tracked performance into a game card. Save it to your Album or Post & Save.', asset: 'premium-card', alt: 'Tom Smith premium game card with rating and recorded performance totals' },
]

export function ScrollProductStory() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [enhanced, setEnhanced] = useState(false)
  const [showAll, setShowAll] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)')
    let observer: IntersectionObserver | undefined
    const configure = () => {
      observer?.disconnect()
      const enabled = !showAll && preference.matches && typeof IntersectionObserver !== 'undefined'
      setEnhanced(enabled)
      if (!enabled) return
      observer = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0]
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.step))
      }, { rootMargin: '-20% 0px -35% 0px', threshold: [0, .25, .5, .75] })
      root.current?.querySelectorAll('[data-step]').forEach(step => observer?.observe(step))
    }
    configure()
    preference.addEventListener('change', configure)
    return () => { observer?.disconnect(); preference.removeEventListener('change', configure) }
  }, [showAll])
  return <><button type="button" className="lp-story-toggle" aria-pressed={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? 'Use scroll walkthrough' : 'Show all screens together'}</button><div ref={root} className={`lp-scroll-story ${enhanced ? 'is-enhanced' : ''}`}>
    {enhanced && <div className="lp-sticky-proof" aria-hidden="true">
      <div className="lp-media-label"><span>The match-day workflow</span><span>0{active + 1} / 05</span></div>
      <LandingMedia asset={productSteps[active].asset} alt="" zoom={false} sizes="60vw" className="lp-story-screen" />
      <p>{productSteps[active].title.toUpperCase()} <span> / KICKCHASERS</span></p>
    </div>}
    <div className="lp-story-steps">{productSteps.map((step,index) => <article key={step.title} data-step={index} className={active === index ? 'is-active' : ''}>
      <p className="lp-kicker">0{index + 1} / Match day</p><h3>{step.title}.</h3><p>{step.description}</p>
      <div className="lp-static-proof"><LandingMedia asset={step.asset} alt={step.alt} sizes="90vw" /></div>
    </article>)}</div>
  </div></>
}
