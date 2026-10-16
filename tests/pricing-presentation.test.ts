import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import { previewPlans, previewCategories, liveSquadPass } from '../src/components/landing/pricing-preview-2027.ts'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { StaticRouter } = require('react-router-dom/server')
const source = readFileSync(new URL('../src/components/landing/PricingSection.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/components/landing/landing.css', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText
function render(detailed = false, location = '/') {
 const exports: any = {}
 const scopedRequire = (id: string) => id === './pricing-preview-2027' ? { previewPlans, previewCategories, liveSquadPass } : require(id)
 new Function('require', 'exports', compiled)(scopedRequire, exports)
 return renderToStaticMarkup(React.createElement(StaticRouter, { location }, React.createElement(exports.PricingSection, { detailed }))) as string
}
const landing = render()
const full = render(true, '/pricing?plan=member#compare')
const yearly = render(true, '/pricing?plan=member&billing=yearly#compare')
const features = previewCategories.flatMap(category => category.features)
const byId = (id: string) => { const row = features.find(feature => feature.id === id); assert.ok(row, id); return row }

test('2027 preview restores original yearly prices and savings alongside unchanged monthly prices', () => {
 assert.deepEqual(previewPlans.map(plan => [plan.name, plan.price]), [['Free','$0'],['Member','$5'],['Player/Tracker Pro','$15'],['Club','$99.95']])
 assert.equal((landing.match(/<article\b/g) || []).length, 4)
 for (const plan of previewPlans) {
  assert.ok(landing.includes(`id="plan-${plan.id}">${plan.name}</h3>`))
  assert.ok(landing.includes(`<strong>${plan.price}</strong>`))
  assert.ok(plan.highlights.length >= 5 && plan.highlights.length <= 6)
 }
 assert.equal((landing.match(/\/month<\/span>/g) || []).length, 4)
 assert.deepEqual(previewPlans.map(plan => plan.yearlyPrice), ['$0','$39.95','$84.95','$999.95'])
 assert.match(landing, /role="group" aria-label="Billing period"/)
 assert.match(landing, /aria-pressed="true">Monthly/)
 assert.match(yearly, /aria-pressed="true">Yearly/)
 for (const plan of previewPlans) {
  assert.ok(yearly.includes(`<strong>${plan.yearlyPrice}</strong>`))
  assert.ok(yearly.includes(`${plan.name}: ${plan.yearlyPrice} AUD per year`))
  if (plan.annualSaving) {
   assert.ok(yearly.includes(`Save ${plan.annualSaving}%`))
   assert.equal(plan.annualSaving, Math.round((1-Number(plan.yearlyPrice.slice(1))/(Number(plan.price.slice(1))*12))*100))
  }
 }
 assert.equal((yearly.match(/\/year<\/span>/g)||[]).length,4)
 assert.match(yearly, /Billed annually/)
 assert.match(yearly, /\/pricing\?plan=member&amp;billing=yearly#compare/)
 assert.match(yearly, /Separate from the monthly plan/)
 assert.match(landing, /Prices in AUD/)
 assert.match(css, /\.lp-pricing-preview \.lp-billing:has\(button:focus-visible\)::before \{ transition:none;/)
})

test('preview actions retain signup and navigate to details without purchase or plan activation', () => {
 assert.match(landing, /href="\/sign-up"/)
 assert.match(landing, /does not select or purchase a proposed plan/)
 assert.match(landing, /does not activate subscriptions or change your current access/)
 for (const plan of previewPlans) assert.ok(landing.includes(`href="/pricing?plan=${plan.id}#compare"`))
 assert.match(landing, /href="\/pricing#compare"/)
 assert.doesNotMatch(landing, />Select |Buy now|Subscribe now|checkout|href="\/new"/i)
 assert.doesNotMatch(source, /supabase|stripe|fetch\(|entitlement|pricing-plans/)
 const routes = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')
 assert.match(routes, /path: 'pricing', element: <Pricing \/>/)
})

test('comparison covers six complete categories and card feature references resolve consistently', () => {
 assert.equal(previewCategories.length, 6)
 assert.equal(features.length, 57)
 assert.equal(new Set(features.map(row => row.id)).size, features.length)
 for (const category of previewCategories) {
  assert.ok(full.includes(category.title.replaceAll('&','&amp;')))
  for (const row of category.features) {
   assert.equal(row.values.length, 4)
   for (const value of row.values) assert.ok(typeof value === 'boolean' || typeof value === 'string')
  }
 }
 previewPlans.forEach((plan,i) => plan.highlights.forEach(item => {
  if (!item.feature) return
  const value = byId(item.feature).values[i]
  assert.notEqual(value, false, item.text)
  assert.notEqual(value, 'Under review', item.text)
  if (item.planned) assert.equal(value, 'Coming 2027')
 }))
 assert.ok(full.indexOf('id="compare"') > full.indexOf('id="plan-club"'))
 assert.equal((full.match(/<details class="lp-feature-category"/g)||[]).length,6)
 assert.equal((full.match(/<caption class="sr-only"/g)||[]).length,6)
 assert.match(full, /<th scope="row">/)
})

test('numeric tracking, squad, custom-stat and Live Squad Pass limits match proposed decisions', () => {
 assert.deepEqual(byId('team').values,['5 players per game','5 players per game','24 players per game','Full team tracking'])
 assert.deepEqual(byId('custom').values,[false,false,'Up to 5','Up to 5'])
 assert.deepEqual(byId('squad-count').values,['Under review','Under review','Unlimited','Unlimited personal squads'])
 assert.deepEqual(byId('members').values,['Up to 5*','Up to 5*','Maximum 25','Official squad rules apply'])
 assert.deepEqual(byId('tracked-limit').values,['5','5','24','Full team'])
 assert.equal(liveSquadPass.price,'$25')
 assert.equal(liveSquadPass.cadence,'per squad, per season')
 assert.match(full, /including guests/)
 assert.match(full, /Requires Player\/Tracker Pro/)
 assert.match(full, /separate pass is needed for each squad/)
 assert.match(full, /Not available to purchase in this preview/)
 assert.match(landing, /Separate from the monthly plan/)
 assert.match(full, /active Live Squad Pass/)
})

test('planned coaching and performance tools are labelled and undecided access remains under review', () => {
 for (const id of ['voice','ai','off-season']) assert.deepEqual(byId(id).values,[false,false,'Coming 2027','Coming 2027'])
 for (const id of ['corner','committee','planner','drills','simulation']) assert.deepEqual(byId(id).values,[false,false,false,'Coming 2027'])
 for (const id of ['evolution','evolution-analytics','premium-evolution']) assert.deepEqual(byId(id).values,Array(4).fill('Under review'))
 assert.match(landing, /Coaches Corner<span class="lp-feature-planned">Planned for 2027/)
 assert.match(full, /Free and Member personal squad limits require final product confirmation/)
 assert.match(full, /appropriate official roles/)
 assert.match(full, /Free for everyone/)
 assert.match(full, /Following players, clubs and leagues, and match and player notifications/)
 assert.ok(previewPlans.every(plan => plan.highlights.every(item => !/notification|following players|following clubs/i.test(item.text))))
})

test('mobile comparison has a labelled native selector and retains complete accessible feature content', () => {
 assert.match(full, /Compare a plan<select/)
 assert.match(full, /<option value="1" selected="">Member/)
 assert.match(full, /class="is-mobile-selected">Member<\/th>/)
 assert.match(css, /@media\(max-width:900px\)/)
 assert.match(css, /\.lp-feature-category tr > :not\(:first-child\):not\(.is-mobile-selected\) \{ display:none;/)
 assert.match(css, /\.lp-mobile-plan-selector select[^}]*min-height:48px/)
 assert.match(css, /\.lp-mobile-plan-selector select:focus-visible/)
 assert.match(css, /\.lp-feature-category summary:focus-visible svg \{ transition:none;/)
 assert.match(css, /@media\(prefers-reduced-motion:reduce\) \{\s*\.lp-feature-category summary svg \{ transition:none;/)
 assert.doesNotMatch(source, /setTimeout|animate\(|IntersectionObserver/)
})
