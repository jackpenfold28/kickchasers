import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pricing, comparisonRows, type BillingPeriod, type PricingPlanId } from './pricing-plans'

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [selectedTier, setSelectedTier] = useState<PricingPlanId>('player')

  return <section id="pricing" className="lp-section lp-wrap lp-pricing" aria-labelledby="pricing-heading">
    <div className="lp-section-heading">
      <h2 id="pricing-heading">Choose your<br/><span>performance tier.</span></h2>
      <div className="lp-section-description">
        <p className="lp-launch-note">All features are currently free for all users for a limited time.</p>
        <p>Explore the full KickChasers platform during launch. These plans show the long-term structure for players, families and clubs once billing begins.</p>
      </div>
    </div>
    <div className="lp-pricing-toolbar">
      <p>Yearly plans offer discounted pricing for long-term use.</p>
      <div className="lp-billing" role="group" aria-label="Billing period">
        {(['monthly', 'yearly'] as const).map(period => <button key={period} type="button" aria-pressed={billingPeriod === period} onClick={() => setBillingPeriod(period)}>{period === 'monthly' ? 'Monthly' : 'Yearly'}</button>)}
      </div>
    </div>
    <div className="lp-plans">
      {pricing.map(tier => {
        const selected = selectedTier === tier.id
        const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice
        const saving = Math.round((1 - Number(tier.yearlyPrice.slice(1)) / (Number(tier.monthlyPrice.slice(1)) * 12)) * 100)
        return <article key={tier.id} className={`lp-plan${selected ? ' is-selected' : ''}`} aria-labelledby={`plan-${tier.id}`}>
          <div className="lp-plan-title"><h3 id={`plan-${tier.id}`}>{tier.name}</h3>{tier.highlight && <span>Recommended</span>}</div>
          <p className="lp-plan-strapline">{tier.strapline}</p>
          <div className="lp-plan-price" aria-live="polite" aria-atomic="true"><strong>{price}</strong><span>/{billingPeriod === 'monthly' ? 'month' : 'year'}</span></div>
          <p className="lp-plan-billing">{tier.id === 'free' ? 'Free plan' : billingPeriod === 'yearly' ? <>Billed annually <span>Save {saving}%</span></> : 'Billed monthly'}</p>
          <p className="lp-plan-description">{tier.description}</p>
          <ul>{tier.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
          <button type="button" className="lp-plan-select" aria-pressed={selected} aria-label={`${selected ? 'Selected' : 'Select'} ${tier.name} plan`} onClick={() => setSelectedTier(tier.id)}>{selected ? 'Selected' : 'Select'} {tier.name}</button>
        </article>
      })}
    </div>
    <details className="lp-extra lp-plan-comparison">
      <summary>Compare plan inclusions <span aria-hidden="true">+</span></summary>
      <div className="lp-comparison-scroll" role="region" aria-label="Plan comparison table" tabIndex={0}>
        <table><caption>How access expands across the four plans</caption><thead><tr><th scope="col">Inclusions</th>{pricing.map(tier => <th key={tier.id} scope="col">{tier.name}</th>)}</tr></thead><tbody>{comparisonRows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody></table>
      </div>
    </details>
    <div className="lp-pricing-action"><p>All features are free during launch.</p><Link to="/sign-up" className="lp-button">Create your account <span aria-hidden="true">↗</span></Link></div>
  </section>
}
