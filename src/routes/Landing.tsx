import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicSiteShell, type PublicNavItem } from '@/components/landing/PublicSiteShell'
import { LandingMedia } from '@/components/landing/LandingMedia'
import { HeroVideoStage } from '@/components/landing/HeroVideoStage'
import { TeamTrackingVideo } from '@/components/landing/TeamTrackingVideo'
import { PricingSection } from '@/components/landing/PricingSection'
import { MappingStory } from '@/components/landing/MappingStory'
import '@/components/landing/landing.css'

const authLink = (path: string) => `/sign-in?redirect=${encodeURIComponent(path)}`
const navigation: PublicNavItem[] = [
  {label: 'The product', href: '#features', id: 'features', type: 'hash'},
  {label: 'How it works', href: '/how-it-works', id: 'how-it-works', type: 'route'},
  {label: 'Game cards', href: '#game-cards', id: 'game-cards', type: 'hash'},
  {label: 'Pricing', href: '#pricing', id: 'pricing', type: 'hash'},
]
function StartLink() { return <Link to={authLink('/dashboard')} className="lp-button">Get started <span aria-hidden="true">↗</span></Link> }

export default function Landing() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => {
      let id: string
      try { id = decodeURIComponent(hash.slice(1)) } catch { return }
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash])
  return <PublicSiteShell variant="editorial" navItems={navigation}>
    <div className="lp-page" id="landing-content" tabIndex={-1}>
      <HeroVideoStage>
        <section className="lp-hero" aria-labelledby="hero-heading">
          <p className="lp-kicker">Built for Australian football</p>
          <h1 id="hero-heading">Track the game.<br/><span>Know your impact.</span></h1>
          <p className="lp-intro">Track a player or team live, map the action, and turn the match into a performance card.</p>
          <div className="lp-actions"><StartLink/><a className="lp-text-link" href="#features">Explore the product <span aria-hidden="true">↓</span></a></div>
        </section>
        <nav className="lp-proof" aria-label="Product chapters">
          {[['Track','#features'],['Map','#mapping'],['Review','#match-summary'],['Create','#game-cards']].map(([title,href])=><a href={href} key={title}>{title}<span aria-hidden="true">↓</span></a>)}
        </nav>
      </HeroVideoStage>

      <section id="features" className="lp-section lp-wrap" aria-labelledby="single-heading">
        <div className="lp-section-heading"><h2 id="single-heading">Every touch.<br/><span>Every part of the ground.</span></h2><div className="lp-section-description"><p>Track your own game live. Record each action, map where it happened and follow your influence quarter by quarter.</p><ul className="lp-benefits"><li>Live totals & quarter controls</li><li>Field mapping & Influence Timeline</li></ul></div></div>
        <figure><LandingMedia asset="single-player" className="lp-product-frame lp-single-proof" alt="Single player live tracker: Tom Smith’s totals, stat pad, quarter controls, field map and Influence Timeline"/><figcaption className="lp-caption"><span>Live stats. Mapped actions. Your influence.</span><span>Tap to view the complete screen ↗</span></figcaption></figure>
        <details className="lp-extra"><summary>Track from your phone, too <span aria-hidden="true">+</span></summary><div className="lp-extra-content"><LandingMedia asset="02-track-every-afl-stat-live" alt="Mobile player tracker with live totals and quarter controls" sizes="300px"/><p>Your live totals and quarter controls, in a smaller format.</p></div></details>
      </section>

      <section className="lp-band" id="team-tracking" aria-labelledby="team-heading"><div className="lp-section lp-wrap">
        <div className="lp-section-heading"><h2 id="team-heading">One screen.<br/><span>Your whole team.</span></h2><div className="lp-section-description"><p className="lp-team-lead">Seamless player tracking. Every action in sequence.</p><p>Switch players and record the next stat, with your roster, live score and quarter controls in view.</p></div></div>
        <ul className="lp-team-features" aria-label="Team tracking features">
          <li><strong>Instant player switching</strong><span>From one player to the next in a tap.</span></li>
          <li><strong>Team & player stats</strong><span>Individual output. The team picture.</span></li>
          <li><strong>Advanced modifiers</strong><span>Add context to each action.</span></li>
          <li><strong>Your custom stat pad</strong><span>The stats that matter to your club.</span></li>
        </ul>
        <figure className="lp-team-demo"><TeamTrackingVideo><LandingMedia asset="team-tracking" alt="Team tracker with full roster, selected player and stat pad"/></TeamTrackingVideo><figcaption className="lp-caption"><span>Follow the play. Capture every action.</span><span>Use fullscreen for the complete view.</span></figcaption></figure>
        <div className="lp-team-context"><figure><LandingMedia asset="coaches-box" alt="Coach tracking local football with KickChasers from the coaches box" sizes="(max-width:760px) 92vw, 600px"/><figcaption className="lp-caption">From the boundary to the coaches box.</figcaption></figure><details className="lp-extra"><summary>Two trackers. One game. <span aria-hidden="true">+</span></summary><div className="lp-extra-content"><LandingMedia asset="04-two-trackers-one-game" alt="Linked tablet and phone tracking the same match" sizes="400px"/><p>Two devices can contribute to the same match. The creator controls the timer and quarters; linking requires a network connection.</p></div></details></div>
      </div></section>

      <section id="mapping" className="lp-section lp-wrap" aria-labelledby="mapping-heading">
        <div className="lp-section-heading"><h2 id="mapping-heading">Know where the game<br/><span>is being won.</span></h2><p className="lp-section-description">From where the action happens to how the match is turning. One clear view of the game.</p></div>
        <MappingStory/>
      </section>

      <section id="match-summary" className="lp-band" aria-labelledby="summary-heading"><div className="lp-section lp-wrap">
        <div className="lp-section-heading"><h2 id="summary-heading">The final siren.<br/><span>The full picture.</span></h2><p className="lp-section-description">Review the score, player totals and quarter breakdowns. Put your performance in context with ratings and benchmarks.</p></div>
        <figure className="lp-summary-proof"><LandingMedia asset="09-professional-match-summaries" className="lp-product-frame" alt="Match Summary showing final score, quarter tabs, player statistics and match results"/><figcaption className="lp-caption"><span>The result. The numbers behind it.</span><span>Tap to explore the complete summary ↗</span></figcaption></figure>
        <details className="lp-extra"><summary>See performance ratings & benchmarks <span aria-hidden="true">+</span></summary><div className="lp-extra-content"><LandingMedia asset="07-see-whos-dominating" alt="Player performance rating and benchmarks" sizes="300px"/><p>See your match output alongside performance ratings and benchmarks.</p></div></details>
      </div></section>

      <section id="portal" className="lp-section lp-wrap lp-support" aria-labelledby="portal-heading">
        <div className="lp-section-heading"><h2 id="portal-heading">Beyond game day.</h2><div className="lp-section-description"><p>Follow local footy, review your history and keep your squad connected.</p><Link className="lp-text-link" to={authLink('/hub')}>Explore the portal <span aria-hidden="true">↗</span></Link></div></div>
        <div className="lp-support-grid">
          <article><h3>Players</h3><p>Your game history, season stats, leaderboards and Player Card Album.</p></article>
          <article><h3>Coaches</h3><p>Team output, match summaries, team selection and Best & Fairest voting.</p></article>
          <article><h3>Clubs</h3><p>Squads, player groups, community posts and notifications.</p></article>
          <article><h3>Families & supporters</h3><p>Match Day scores, local footy and shared player performances.</p></article>
        </div>
        <details className="lp-extra"><summary>A closer look at the season tools <span aria-hidden="true">+</span></summary><div className="lp-support-details"><LandingMedia asset="10-your-complete-player-profile" alt="Player profile with season totals and game history" sizes="500px"/><LandingMedia asset="team-selection" alt="Team selection and lineup poster" sizes="280px"/></div></details>
      </section>

      <section id="game-cards" className="lp-card-band" aria-labelledby="cards-heading"><div className="lp-section lp-wrap">
        <div className="lp-section-heading"><h2 id="cards-heading">Your performance.<br/><span>Your card.</span></h2><p className="lp-section-description">Your photo. Your club. Your match stats. Create a card worth keeping and sharing.</p></div>
        <div className="lp-card-layout"><figure className="lp-finished-card"><LandingMedia asset="premium-card" alt="Finished Tom Smith performance card with 9.2 rating, 23 disposals, 2 goals and 103 AF points" sizes="(max-width:760px) 90vw, 520px"/><figcaption className="lp-caption">Your match. Your club. Your name.</figcaption></figure><figure className="lp-creator"><LandingMedia asset="card-creator" alt="Player Card Creator showing a second card example and the save and sharing controls" sizes="(max-width:760px) 230px, 280px"/><figcaption className="lp-caption">Create it. Keep it. Share it.</figcaption></figure></div>
      </div></section>

      <PricingSection/>

      <section id="get-started" className="lp-final lp-wrap" aria-labelledby="final-heading"><div><h2 id="final-heading">Ready for<br/><span>game day?</span></h2><p>Create your KickChasers account.</p><StartLink/><Link to="/how-it-works" className="lp-final-help">Explore how KickChasers works ↗</Link></div><LandingMedia asset="player-cutout" alt="Northside Hawks footballer running with the ball" zoom={false} className="lp-final-player" sizes="(max-width:760px) 38vw, 380px"/></section>
    </div>
  </PublicSiteShell>
}
