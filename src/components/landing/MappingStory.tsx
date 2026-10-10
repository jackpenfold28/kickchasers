import { useEffect, useRef, useState } from 'react'
import { LandingMedia } from './LandingMedia'

/** A single screen, with a short map-to-momentum focus. Static by default. */
export function MappingStory() {
  const root = useRef<HTMLDivElement>(null)
  const [enhanced, setEnhanced] = useState(false)
  const [active, setActive] = useState(0)
  useEffect(() => {
    const preference = window.matchMedia('(min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)')
    let frame = 0
    const measure = () => {
      frame = 0
      const second = root.current?.querySelector('[data-mapping-step="1"]')
      setActive(preference.matches && second && second.getBoundingClientRect().top < window.innerHeight * .62 ? 1 : 0)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    const configure = () => {
      setEnhanced(preference.matches)
      window.removeEventListener('scroll', schedule)
      if (preference.matches) window.addEventListener('scroll', schedule, { passive: true })
      schedule()
    }
    configure()
    preference.addEventListener('change', configure)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      preference.removeEventListener('change', configure)
    }
  }, [])
  return <div ref={root} className={`lp-mapping-story ${enhanced ? 'is-enhanced' : ''} ${enhanced && active === 1 ? 'is-analysis' : ''}`}>
    <figure className="lp-mapping-proof"><LandingMedia asset="team-mapping" className="lp-product-frame lp-mapping-screen" alt="Team Mapping: event locations on the oval, both teams’ stat pads, Score Worm and momentum indicators" sizes="(max-width:999px) 95vw, 900px"/><figcaption className="lp-caption"><span>{enhanced && active === 1 ? 'Score Worm & momentum' : 'Choose your stats. Map the action.'}</span><span>View the full screen ↗</span></figcaption></figure>
    <div className="lp-mapping-steps">
      <article data-mapping-step="0" className={active === 0 ? 'is-active' : ''}><h3>Put every action on the map.</h3><p>Choose the stats you want to map, then tap where each action happened on the oval.</p></article>
      <article data-mapping-step="1" className={active === 1 ? 'is-active' : ''}><h3>See the match turning.</h3><p>Follow the Score Worm and momentum indicators to see scoring trends and the areas each team is winning.</p></article>
    </div>
  </div>
}
