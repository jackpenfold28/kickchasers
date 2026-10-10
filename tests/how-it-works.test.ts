import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { tabs, productLoop } from '../src/components/landing/how-it-works-content.ts'
const root = new URL('../', import.meta.url)
const source = await readFile(new URL('src/routes/HowItWorks.tsx',root),'utf8')
const css = await readFile(new URL('src/routes/how-it-works.css',root),'utf8')
const assets = JSON.parse(await readFile(new URL('src/components/landing/landing-assets.json',root),'utf8'))
test('nine workflow identities and five engine stages remain',()=>{
 assert.deepEqual(tabs.map(t=>t.id),['profile-onboarding','squads-teams','live-tracking','game-summaries','player-development','leaderboards','feed-sharing','ratings-benchmarking','portal-club-management'])
 assert.deepEqual(productLoop,['Track Game','Game Summary','Player Profiles','Leaderboards','Feed & Sharing'])
 for(const tab of tabs) { assert.ok(tab.summary); assert.equal(tab.bullets.length,4); assert.ok(tab.concept) }
})
test('public development and ratings use representative proof without developer placeholders',()=>{
 assert.equal(tabs.find(t=>t.id==='player-development')?.image,'10-your-complete-player-profile')
 assert.equal(tabs.find(t=>t.id==='ratings-benchmarking')?.image,'07-see-whos-dominating')
 assert.doesNotMatch(source,/Screenshot placeholder|Visual slot|Drop a future/)
})
test('squads shows a real lineup; portal does not misrepresent mobile profile as desktop tooling',()=>{
 assert.equal(tabs.find(t=>t.id==='squads-teams')?.image,'team-selection')
 assert.equal(tabs.find(t=>t.id==='portal-club-management')?.image,undefined)
 assert.match(source,/activeTab.image && <figure/)
})
test('every selected asset and responsive variant resolves',async()=>{
 for(const tab of tabs) if(tab.image){ const asset=assets[tab.image]; assert.ok(asset,tab.image); assert.ok(tab.alt); for(const path of [asset.original,...asset.variants.map((v:any)=>v.src)]) assert.ok((await stat(new URL('public'+path,root))).size>0) }
})
test('single selected workflow, linked tab semantics and keyboard selection remain',()=>{
 assert.match(source,/tabs.find\(tab => tab.id === activeTabId\)/)
 assert.equal((source.match(/role="tabpanel"/g)||[]).length,1)
 assert.match(source,/aria-selected=/); assert.match(source,/aria-controls=/); assert.match(source,/aria-labelledby=/)
 assert.match(source,/onClick=\{\(\) => setActiveTabId\(tab.id\)\}/)
 for(const key of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End']) assert.ok(source.includes(key))
})
test('public navigation shell and destinations are retained',()=>{
 assert.match(source,/<PublicSiteShell activeNavId="how-it-works" useLandingAnchors>/)
 assert.doesNotMatch(source,/navigate\(|fetch\(|supabase|\/new/)
})
test('responsive stack, focus, reduced motion and one short switch transition are explicit',()=>{
 assert.match(css,/@media \(max-width:1279px\)/)
 assert.match(css,/\.hiw-workflow \{ grid-template-columns:minmax\(0,1fr\); \}/)
 assert.match(css,/prefers-reduced-motion:reduce/); assert.match(css,/focus-visible/)
 assert.match(css,/hiw-switch \.18s/); assert.doesNotMatch(css,/blur\(|box-shadow:.*green|border-white\/8/)
 assert.doesNotMatch(source,/ProductShot|<Reveal|tabs.map.*LandingMedia/)
})
