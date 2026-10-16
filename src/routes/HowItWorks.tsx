import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { PublicSiteShell } from '@/components/landing/PublicSiteShell'
import { DevicePair, ScreenGallery } from '@/components/landing/ProductScreens'
import { productLoop } from '@/components/landing/how-it-works-content'
import { guideGroups, guides } from '@/components/landing/how-it-works-guides'
import '@/components/landing/landing.css'
import './how-it-works.css'

export default function HowItWorks() {
  const [activeTabId, setActiveTabId] = useState(guides[0].id)
  const [pointerMotion, setPointerMotion] = useState(false)
  const activeTab = guides.find(tab => tab.id === activeTabId) ?? guides[0]
  const activeIndex = guides.indexOf(activeTab)
  const panel = useRef<HTMLElement>(null)
  const initialSelection = useRef(true)
  useEffect(() => {
    document.title = 'How KickChasers Works | KickChasers'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])
  useEffect(() => {
    if (initialSelection.current) { initialSelection.current = false; return }
    if (panel.current && panel.current.getBoundingClientRect().top < 100) panel.current.scrollIntoView({ block:'start', behavior:'auto' })
  }, [activeTabId])

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = index
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = guides.length - 1
    else if (event.key in moves) next = (index + moves[event.key] + guides.length) % guides.length
    else return
    event.preventDefault()
    setPointerMotion(false)
    setActiveTabId(guides[next].id)
    document.getElementById(`tab-${guides[next].id}`)?.focus()
  }

  return <div className="hiw-page">
    <PublicSiteShell variant="editorial" activeNavId="how-it-works" useLandingAnchors>
      <div id="landing-content" className="hiw-content" tabIndex={-1}>
        <section className="hiw-wrap hiw-intro" aria-labelledby="how-heading">
          <div><p className="hiw-eyebrow">Product walkthrough</p><h1 id="how-heading">How KickChasers<br/><span>works.</span></h1><a href="#workflow-heading" className="lp-text-link">Find your workflow <span aria-hidden="true">↓</span></a></div>
          <div className="hiw-intro-copy"><p className="hiw-lead">KickChasers connects live match tracking, player development, team management, and performance analysis into one AFL platform.</p><p className="hiw-intro-detail">The product loop starts on match day, then keeps compounding as that data becomes summaries, player history, rankings, and shareable outputs across the wider football community.</p><p className="hiw-guide-count">{guides.length} walkthroughs · iPhone & iPad</p></div>
          <div className="hiw-engine" aria-label="Product Engine"><p className="hiw-engine-caption">How one tracked game becomes the rest of the platform</p><ol>{productLoop.map((step,index) => <li key={step}><span className="hiw-step-number">{String(index+1).padStart(2,'0')}</span><span>{step}</span></li>)}</ol></div>
        </section>
        <section className="hiw-wrap hiw-explorer" aria-labelledby="workflow-heading">
          <div className="hiw-explorer-heading"><h2 id="workflow-heading">Explore the platform<br/><span>by workflow.</span></h2><p className="hiw-explorer-description">Each section below explains a real part of the product, from onboarding and squad structure through to live tracking, summaries, leaderboards, and club management.</p></div>
          <label className="hiw-mobile-picker">Choose a walkthrough<select value={activeTabId} onChange={event => { setPointerMotion(false); setActiveTabId(event.target.value) }}>{guideGroups.map(group => <optgroup key={group} label={group}>{guides.filter(guide => guide.group === group).map(guide => <option key={guide.id} value={guide.id}>{guide.label}</option>)}</optgroup>)}</select></label>
          <div className="hiw-layout">
            <aside className="hiw-index">
              <div role="tablist" aria-label="How KickChasers works sections" aria-orientation="vertical">
                {guideGroups.map(group => <div className="hiw-index-group" key={group}><p>{group}</p>{guides.filter(guide => guide.group === group).map(tab => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={tab.id === activeTabId} aria-controls={`panel-${tab.id}`} tabIndex={tab.id === activeTabId ? 0 : -1} onClick={event => { setPointerMotion(event.detail > 0); setActiveTabId(tab.id) }} onKeyDown={event => navigateTabs(event,guides.indexOf(tab))}><span className="hiw-index-number">{String(guides.indexOf(tab)+1).padStart(2,'0')}</span><span><span className="hiw-index-label">{tab.label}</span><span className="hiw-index-blurb">{tab.navBlurb}</span></span></button>)}</div>)}
              </div>
            </aside>
            <article ref={panel} key={activeTab.id} id={`panel-${activeTab.id}`} role="tabpanel" aria-labelledby={`tab-${activeTab.id}`} tabIndex={0} className="hiw-workflow" data-pointer-motion={pointerMotion}>
              <header className="hiw-workflow-intro"><p className="hiw-workflow-label">{String(activeIndex+1).padStart(2,'0')} / {activeTab.label}</p><h3>{activeTab.title}</h3><p className="hiw-summary">{activeTab.summary}</p></header>
              <div className="hiw-support"><div><h4>What you can do</h4><ul>{activeTab.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></div><p className="hiw-takeaway">{activeTab.concept}</p></div>
              {activeTab.chapters.map((chapter,index) => <section className="hiw-chapter" data-layout={chapter.layout || 'gallery'} data-count={chapter.screens.length} key={chapter.title} aria-labelledby={`${activeTab.id}-chapter-${index}`}><div className="hiw-chapter-heading"><h4 id={`${activeTab.id}-chapter-${index}`}>{chapter.title}</h4><p>{chapter.description}</p></div><div className="hiw-visual">{chapter.layout === 'pair' ? <DevicePair tablet={chapter.screens[0].asset} phone={chapter.screens[1].asset} tabletAlt={chapter.screens[0].alt} phoneAlt={chapter.screens[1].alt}/> : <ScreenGallery screens={chapter.screens}/>}</div></section>)}
              {activeTab.id === 'portal-club-management' && <div className="hiw-portal-note"><p>The squad screenshots elsewhere in this guide show the mobile app. Open the web portal to work with your club on a larger screen.</p><Link className="lp-text-link" to="/sign-in?redirect=%2Fhub">Open the web portal <span aria-hidden="true">↗</span></Link></div>}
              <footer className="hiw-next"><span>Keep exploring</span><button type="button" onClick={event => { setPointerMotion(event.detail > 0); setActiveTabId(guides[(activeIndex+1)%guides.length].id) }}>{guides[(activeIndex+1)%guides.length].label}<span aria-hidden="true">→</span></button></footer>
            </article>
          </div>
        </section>
      </div>
    </PublicSiteShell>
  </div>
}
