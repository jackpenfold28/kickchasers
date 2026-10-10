import { useEffect, useState, type KeyboardEvent } from 'react'
import { PublicSiteShell } from '@/components/landing/PublicSiteShell'
import { LandingMedia } from '@/components/landing/LandingMedia'
import { productLoop, tabs } from '@/components/landing/how-it-works-content'
import './how-it-works.css'

export default function HowItWorks() {
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0]
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab.id)
  useEffect(() => {
    document.title = 'How KickChasers Works | KickChasers'
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = index
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else if (event.key in moves) next = (index + moves[event.key] + tabs.length) % tabs.length
    else return
    event.preventDefault()
    setActiveTabId(tabs[next].id)
    document.getElementById(`tab-${tabs[next].id}`)?.focus()
  }

  return <div className="hiw-page">
    <PublicSiteShell activeNavId="how-it-works" useLandingAnchors>
      <section className="hiw-wrap hiw-intro">
        <p className="hiw-eyebrow">Product Walkthrough</p>
        <h1>How KickChasers Works</h1>
        <p className="hiw-lead">KickChasers connects live match tracking, player development, team management, and performance analysis into one AFL platform.</p>
        <p className="hiw-intro-detail">The product loop starts on match day, then keeps compounding as that data becomes summaries, player history, rankings, and shareable outputs across the wider football community.</p>
        <div className="hiw-engine" aria-label="Product Engine">
          <p className="hiw-engine-caption">How one tracked game becomes the rest of the platform</p>
          <ol>{productLoop.map((step, index) => <li key={step}>
            <span className="hiw-step-number">{String(index + 1).padStart(2, '0')}</span><span>{step}</span>
          </li>)}</ol>
        </div>
      </section>
      <section className="hiw-wrap hiw-explorer" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading">Explore the platform by workflow</h2>
        <p className="hiw-explorer-description">Each section below explains a real part of the product, from onboarding and squad structure through to live tracking, summaries, leaderboards, and club management.</p>
        <div className="hiw-layout">
          <aside className="hiw-index">
            <div role="tablist" aria-label="How KickChasers works sections">
              {tabs.map((tab, index) => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab"
                aria-selected={tab.id === activeTabId} aria-controls={`panel-${tab.id}`} tabIndex={tab.id === activeTabId ? 0 : -1}
                onClick={() => setActiveTabId(tab.id)} onKeyDown={event => navigateTabs(event, index)}>
                <span className="hiw-index-number">{String(index + 1).padStart(2, '0')}</span>
                <span><span className="hiw-index-label">{tab.label}</span><span className="hiw-index-blurb">{tab.navBlurb}</span></span>
              </button>)}
            </div>
          </aside>
          <article key={activeTab.id} id={`panel-${activeTab.id}`} role="tabpanel" aria-labelledby={`tab-${activeTab.id}`} tabIndex={0}
            className={`hiw-workflow ${activeTab.image ? 'has-media' : 'content-only'}`}>
            <div className="hiw-workflow-intro">
              <p className="hiw-workflow-label">{String(activeIndex + 1).padStart(2, '0')} / {activeTab.label}</p>
              <h3>{activeTab.title}</h3>
              <p className="hiw-summary">{activeTab.summary}</p>
            </div>
            {activeTab.image && <figure className={`hiw-proof ${activeTab.image === '10-your-complete-player-profile' ? 'hiw-profile-proof' : ''}`}>
              <LandingMedia asset={activeTab.image} alt={activeTab.alt ?? activeTab.label} sizes={activeTab.image === '10-your-complete-player-profile' ? '(max-width: 600px) 248vw, (max-width: 900px) 92vw, (max-width: 1279px) 65vw, 42vw' : '(max-width: 900px) 92vw, (max-width: 1279px) 65vw, 42vw'} />
              {activeTab.caption && <figcaption>{activeTab.caption}</figcaption>}
            </figure>}
            <div className="hiw-support">
              <ul>{activeTab.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>
              <p className="hiw-takeaway">{activeTab.concept}</p>
            </div>
          </article>
        </div>
      </section>
    </PublicSiteShell>
  </div>
}
