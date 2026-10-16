import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PublicSiteShell, type PublicNavItem } from '@/components/landing/PublicSiteShell'
import { LandingMedia } from '@/components/landing/LandingMedia'
import { TeamTrackingDemo } from '@/components/landing/TeamTrackingDemo'
import { HeroVideoStage } from '@/components/landing/HeroVideoStage'
import { DevicePair, ScreenGallery } from '@/components/landing/ProductScreens'
import { useLandingStory } from '@/components/landing/useLandingStory'
import { ProductStoryStage } from '@/components/landing/ProductStoryStage'
import { PricingSection } from '@/components/landing/PricingSection'
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
  const scrollRoot = useLandingStory()
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
    <div ref={scrollRoot} className="lp-page lp-landing-story" id="landing-content" tabIndex={-1}>
      <HeroVideoStage>
        <section className="lp-hero" aria-labelledby="hero-heading">
          <p className="lp-kicker">Built for Australian football</p>
          <h1 id="hero-heading">Track the game.<br/><span>Know your impact.</span></h1>
          <p className="lp-intro">Track a player or team live, map the action, and turn the match into a performance card.</p>
          <div className="lp-actions"><StartLink/><a className="lp-text-link" href="#features">Explore the product <span aria-hidden="true">↓</span></a></div>
        <TeamTrackingDemo/>
        </section>

      </HeroVideoStage>

      <section id="features" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="single-heading">
        <div className="lp-product-split">
          <div className="lp-product-copy">
            <h2 id="single-heading">Every touch.<br/><span>Your impact.</span></h2>
            <p>Follow one player from the first bounce to the final siren. Record the action, map where it happened and see the game take shape.</p>
            <ul className="lp-product-points"><li><strong>Record in the moment.</strong> Kicks, marks, tackles and more, with a stat pad built for footy.</li><li><strong>Keep the whole game in view.</strong> Live totals, quarter controls and an Influence Timeline.</li></ul>
            <a className="lp-text-link" href="#team-tracking">Tracking a whole team? <span aria-hidden="true">↓</span></a>
          </div>
          <DevicePair tablet="capture-player-ipad" phone="capture-player-phone" tabletAlt="iPad single-player tracker with Tom Smith’s live totals, stat pad, field map and Influence Timeline" phoneAlt="iPhone single-player tracker with live disposals, goals, quarter controls and stat pad" />
        </div>
      </section>

      <section id="team-tracking" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="team-heading">
        <div className="lp-product-split is-reversed">
          <div className="lp-product-copy">
            <h2 id="team-heading">One team.<br/><span>Every player.</span></h2>
            <p>Move between players without losing the play. Your roster, live score and stat pad stay together, wherever you’re tracking.</p>
            <ul className="lp-product-points"><li><strong>A tap to switch players.</strong> Individual contributions. A complete team picture.</li><li><strong>Your club. Your stat pad.</strong> Set up the actions and custom stats you want to record.</li></ul>
          </div>
          <DevicePair tablet="capture-team-ipad" phone="capture-team-phone" tabletAlt="iPad team tracker showing the roster, selected player, live score and both teams’ stat pads" phoneAlt="iPhone team tracker with player switching, action modifiers and custom stat pad" />
        </div>
      </section>

      <section id="custom-stat-pad" className="lp-section lp-wrap lp-product-chapter lp-custom-pad" aria-labelledby="custom-pad-heading">
        <div className="lp-section-heading"><h2 id="custom-pad-heading">Your game.<br/><span>Your stat pad.</span></h2><p className="lp-section-description">Make the stat pad your own. Arrange the actions, set up modifiers and choose the custom stats you want to track.</p></div>
        <ScreenGallery screens={[
          {asset:'capture-custom-pad',alt:'Edit your stat pad with modifier controls and a configurable action grid',label:'Arrange your stat pad'},
          {asset:'capture-custom-stats',alt:'Custom stat editor showing available actions and their colours',label:'Choose your custom stats'},
        ]}/>
      </section>

      <section id="mapping" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="mapping-heading">
        <ProductStoryStage kind="mapping">
        <div className="lp-section-heading"><h2 id="mapping-heading">See the play.<br/><span>Read the ground.</span></h2></div>
        <div className="lp-mapping-showcase">
          <DevicePair tablet="capture-map-ipad" phone="capture-map-phone" tabletAlt="iPad team field mapping with both stat pads, action locations, Score Worm and momentum indicators" phoneAlt="iPhone field mapping with the oval, action filters and stat controls" />
          <div className="lp-product-copy"><p>Go beyond the totals. Map actions on the oval and follow the Score Worm and momentum indicators as the match unfolds.</p><ul className="lp-product-points"><li><strong>Where it happened.</strong> Filter actions and quarters to find the passages that matter.</li><li><strong>How the game is turning.</strong> See scoring trends alongside the flow of the match.</li></ul></div>
        </div>
        </ProductStoryStage>
      </section>

      <section id="match-summary" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="summary-heading">

        <ScreenGallery story heading={<div className="lp-section-heading"><h2 id="summary-heading">The final siren.<br/><span>The full picture.</span></h2><p className="lp-section-description">Follow live scores on Match Day. Review the result, player totals and your own performance when the game is done.</p></div>} screens={[
          {asset:'capture-summary',alt:'Match summary with final score, quarter breakdowns and player stat table',label:'The match, in detail'},
          {asset:'capture-matchday',alt:'Match Day screen listing live and final games with team scores',label:'Stay with the live game'},
          {asset:'capture-performance',alt:'Tom Smith’s match performance with rating, mapped stats and key action totals',label:'Your performance, in context'},
        ]}/>
      </section>

      <section id="portal" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="portal-heading">

        <ScreenGallery story heading={<div className="lp-section-heading"><h2 id="portal-heading">One game is a start.<br/><span>Build your season.</span></h2><div className="lp-section-description"><p>Your profile brings the story together. Return to your game history, compare your stats and see where you stand.</p><Link className="lp-text-link" to={authLink('/hub')}>Explore the portal <span aria-hidden="true">↗</span></Link></div></div>} screens={[
          {asset:'capture-profile',alt:'Player profile with personal banner, awards, season totals and recent games',label:'A profile that’s yours'},
          {asset:'capture-weekly',alt:'Weekly leaderboard with leading disposal, fantasy and goal performances',label:'Lead the week'},
          {asset:'capture-leaders',alt:'Player leaderboard with club identities, profile photos and disposal totals',label:'See where you stand'},
        ]}/>
      </section>

      <section id="squads" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="squads-heading">
        <div className="lp-section-heading"><h2 id="squads-heading">Your club.<br/><span>Connected.</span></h2><p className="lp-section-description">Bring your people and your football together. Manage the squad, organise game-day roles and set your team for the next match.</p></div>
        <ScreenGallery screens={[
          {asset:'capture-squad',alt:'Northside Hawks official squad with club banner, members and upcoming match',label:'Your squad’s home',sizes:'(max-width:760px) 65vw, 320px'},
          {asset:'capture-selection-design',alt:'Team selection poster with navy and gold club designs',label:'Your team. Your colours.',sizes:'(max-width:760px) 92vw, 900px'},
        ]}/>

      </section>

      <section id="voting" className="lp-section lp-wrap lp-product-chapter" aria-labelledby="voting-heading">

        <ScreenGallery story heading={<div className="lp-section-heading"><h2 id="voting-heading">Recognise the game.<br/><span>Reward the season.</span></h2><p className="lp-section-description">Best & Fairest voting, from individual cards to the season tally. Keep all your club’s teams, voting groups and results together in one place.</p></div>} screens={[
          {asset:'capture-vote',alt:'Best and Fairest voting card with eligible players and vote entry fields',label:'Every vote has a place'},
          {asset:'capture-voting-teams',alt:'Club voting groups for AFL, Reserves and Under 18 teams in one place',label:'All your teams’ votes, in one place'},
          {asset:'capture-tally',alt:'Best and Fairest season tally with ranked players and vote totals',label:'The season adds up'},
        ]}/>

      </section>

      <section id="social" className="lp-section lp-wrap lp-product-chapter lp-social" aria-labelledby="social-heading">
        <div className="lp-section-heading"><h2 id="social-heading">After the siren.<br/><span>Share the story.</span></h2><p className="lp-section-description">Create club-coloured match results and player rankings to share with your football community. Celebrate the final score and the players who made it happen.</p></div>
        <div className="lp-social-story">
          <figure className="lp-social-result"><LandingMedia asset="capture-social-post" alt="Shared team result with generated top scorers, disposals and rating graphics" sizes="(max-width:760px) 92vw, 1120px"/><figcaption><strong>After the siren.</strong> Share the result and the players who made it happen.</figcaption></figure>
        </div>
      </section>

      <section id="game-cards" className="lp-section lp-wrap lp-product-chapter lp-new-cards" aria-labelledby="cards-heading">
        <ProductStoryStage kind="cards">
        <div className="lp-section-heading"><h2 id="cards-heading">Your performance.<br/><span>Worth sharing.</span></h2><p className="lp-section-description">Turn a match into a player card. Keep it in your album or share it with the people who follow your footy.</p></div>
        <ScreenGallery screens={[
          {asset:'capture-card',alt:'Tom Smith’s navy and gold custom performance card with match stats and rating',label:'Your colours. Your card.'},
          {asset:'capture-generated',alt:'Generated player performance card ready to save or share',label:'Ready to share'},
          {asset:'capture-album',alt:'Player Card Album with a collection of saved performance cards',label:'Keep your season together'},
        ]}/>

        </ProductStoryStage>
      </section>

      <PricingSection/>

      <section id="get-started" className="lp-final lp-wrap" aria-labelledby="final-heading"><div><h2 id="final-heading">Ready for<br/><span>game day?</span></h2><p>Create your KickChasers account.</p><StartLink/><Link to="/how-it-works" className="lp-final-help">Explore how KickChasers works ↗</Link></div><LandingMedia asset="player-cutout" alt="Northside Hawks footballer running with the ball" zoom={false} className="lp-final-player" sizes="(max-width:760px) 38vw, 380px"/></section>
    </div>
  </PublicSiteShell>
}
