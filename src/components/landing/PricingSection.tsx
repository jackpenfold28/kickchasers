import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, Check, X } from 'lucide-react'
import { previewPlans, previewCategories, liveSquadPass, type PreviewValue } from './pricing-preview-2027'

function Inclusion({ value }: { value: PreviewValue }) {
  if (value === true) return <span className="lp-included"><Check size={16} strokeWidth={3.5} aria-hidden="true"/><span>Included</span></span>
  if (value === false || value === 'Not included*') return <span className="lp-not-included"><X size={16} strokeWidth={3.5} aria-hidden="true"/><span>{value === false ? 'Not included' : value}</span></span>
  return <span className={value === 'Coming 2027' ? 'lp-coming' : value === 'Under review' ? 'lp-under-review' : ''}>{value}</span>
}

export function PricingSection({ detailed = false }: { detailed?: boolean }) {
  const [params] = useSearchParams()
  const [selected, setSelected] = useState(() => Math.max(0, previewPlans.findIndex(plan => plan.id === (params.get('plan') || 'tracker-pro'))))
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(() => params.get('billing') === 'yearly' ? 'yearly' : 'monthly')
  const Heading = detailed ? 'h1' : 'h2'
  return <section id="pricing" className="lp-section lp-wrap lp-pricing lp-pricing-preview" aria-labelledby="pricing-heading">
    <div className="lp-pricing-intro">
      <div><p className="lp-pricing-label">2027 pricing · Product design preview</p><Heading id="pricing-heading">Your game.<br/><span>Your level.</span></Heading></div>
      <div className="lp-pricing-launch">
        <p className="lp-launch-note">Proposed plans. Open for review.</p>
        <p>Prices in AUD. This preview does not activate subscriptions or change your current access.</p>
        <Link to="/sign-up" className="lp-button lp-pricing-cta">Create your account <ArrowUpRight size={20} aria-hidden="true"/></Link>
        <p className="lp-preview-context">All features are currently free during launch. Creating an account does not select or purchase a proposed plan.</p>
      </div>
    </div>
    <div className="lp-pricing-toolbar"><div><p className="lp-pricing-reference">Choose your level.</p><p>Same toolkit. A choice of billing periods.</p></div><div className="lp-billing" role="group" aria-label="Billing period" data-period={billingPeriod}>{(['monthly','yearly'] as const).map(period => <button type="button" key={period} aria-pressed={billingPeriod === period} onClick={() => setBillingPeriod(period)}>{period === 'monthly' ? 'Monthly' : 'Yearly'}</button>)}</div></div>
    <p className="sr-only" role="status">{billingPeriod === 'yearly' ? 'Yearly prices, billed annually.' : 'Monthly prices, billed monthly.'} Proposed plans only.</p>
    <div className="lp-plans">
      {previewPlans.map(plan => <article key={plan.id} className={`lp-plan${plan.featured ? ' is-recommended' : ''}${plan.id === 'club' ? ' is-club' : ''}`} aria-labelledby={`plan-${plan.id}`}>
        <div className="lp-plan-identity"><div className="lp-plan-title"><h3 id={`plan-${plan.id}`}>{plan.name}</h3>{plan.featured && <span>Recommended</span>}</div><p className="lp-plan-audience">{plan.audience}</p></div>
        <p className="lp-plan-purpose">{plan.positioning}</p>
        <div className="lp-plan-value"><p className="lp-plan-price"><span className="sr-only">{plan.name}: {billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price} AUD per {billingPeriod === 'yearly' ? 'year' : 'month'}</span><span className="lp-price-stack" aria-hidden="true" data-period={billingPeriod}><span className="lp-price-frame is-monthly"><strong>{plan.price}</strong><span>/month</span></span><span className="lp-price-frame is-yearly"><strong>{plan.yearlyPrice}</strong><span>/year</span></span></span></p><p className="lp-plan-billing">{plan.id === 'free' ? 'Free plan' : billingPeriod === 'yearly' ? <>Billed annually <span>Save {plan.annualSaving}%</span></> : 'Billed monthly'}</p></div>
        <div className="lp-plan-inclusions"><ul className="lp-plan-highlights" aria-label={`${plan.name} proposed key inclusions`}>{plan.highlights.map(item => <li key={item.text}>{item.text}{item.planned && <span className="lp-feature-planned">Planned for 2027</span>}</li>)}</ul>
          {plan.id === 'tracker-pro' && <p className="lp-card-addon">Optional Live Squad Pass <strong>{liveSquadPass.price} / squad / season</strong><span>Separate from the monthly plan.</span></p>}
          <Link to={`/pricing?plan=${plan.id}${billingPeriod === 'yearly' ? '&billing=yearly' : ''}#compare`} className={`lp-plan-select${plan.featured ? ' is-recommended' : ''}`} onClick={() => setSelected(previewPlans.indexOf(plan))}>View {plan.name} details <ArrowUpRight size={18} aria-hidden="true"/></Link>
        </div>
      </article>)}
    </div>
    {!detailed ? <div className="lp-preview-comparison-link"><div><h3>Compare all features</h3><p>See every inclusion, squad limit and feature planned for 2027.</p></div><Link className="lp-text-link" to={billingPeriod === 'yearly' ? '/pricing?billing=yearly#compare' : '/pricing#compare'}>Explore the full comparison <ArrowUpRight size={18} aria-hidden="true"/></Link></div> : <>
      <section id="compare" className="lp-preview-comparison" aria-labelledby="compare-heading">
        <div className="lp-comparison-intro"><div><p className="lp-pricing-label">The complete proposed picture</p><h2 id="compare-heading">Compare all features</h2></div><p>Included means included in the proposed tier. <span className="lp-coming">Coming 2027</span> marks planned features; <span className="lp-under-review">Under review</span> marks undecided access.</p></div>
        <div className="lp-free-everyone"><strong>Free for everyone</strong><p>Following players, clubs and leagues, and match and player notifications are standard platform functions across all tiers.</p></div>
        <label className="lp-mobile-plan-selector">Compare a plan<select value={selected} onChange={event => setSelected(Number(event.target.value))}>{previewPlans.map((plan,index) => <option key={plan.id} value={index}>{plan.name} — {billingPeriod === 'yearly' ? plan.yearlyPrice : plan.price}/{billingPeriod === 'yearly' ? 'year' : 'month'} AUD</option>)}</select></label>
        {previewCategories.map((category,index) => <details className="lp-feature-category" key={category.id} open={index === 0}>
          <summary><span>{category.title}<small>{category.features.length} features</small></span><ChevronDown size={20} aria-hidden="true"/></summary>
          <table><caption className="sr-only">{category.title} — proposed 2027 plan comparison</caption><thead><tr><th scope="col">Feature</th>{previewPlans.map((plan,i) => <th key={plan.id} scope="col" className={i === selected ? 'is-mobile-selected' : ''}>{plan.name}</th>)}</tr></thead><tbody>{category.features.map(row => <tr key={row.id}><th scope="row">{row.label}{row.note && <small>{row.note}</small>}</th>{row.values.map((value,i) => <td key={i} className={i === selected ? 'is-mobile-selected' : ''}><Inclusion value={value}/></td>)}</tr>)}</tbody></table>
          {category.id === 'live' && <p className="lp-comparison-footnote">*Free users may access live statistics for personal squads they belong to when that squad has an active Live Squad Pass.</p>}
          {category.id === 'squads' && <p className="lp-comparison-footnote">*Free and Member personal squad limits require final product confirmation. The proposed “Up to 5” membership limit and guest access remain under review.</p>}
          {category.id === 'coaching' && <p className="lp-comparison-footnote">Coaches Corner and its tools are planned for 2027. Creation and administration require an active Club subscription and appropriate official roles. Viewing published training plans is free, subject to squad membership and visibility permissions.</p>}
        </details>)}
      </section>
      <aside className="lp-live-pass" aria-labelledby="live-pass-heading"><div><p className="lp-pricing-label">Optional add-on · Requires Player/Tracker Pro</p><h3 id="live-pass-heading">Live Squad Pass</h3><p className="lp-pass-price"><strong>{liveSquadPass.price}</strong> {liveSquadPass.cadence}</p></div><div><p>{liveSquadPass.description}</p><ul>{liveSquadPass.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul><p className="lp-pass-preview">Proposed add-on. Not available to purchase in this preview.</p></div></aside>
    </>}
  </section>
}
