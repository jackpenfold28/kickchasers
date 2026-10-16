import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { tabs, productLoop } from '../src/components/landing/how-it-works-content.ts'
import { guides, guideGroups } from '../src/components/landing/how-it-works-guides.ts'
const root = new URL('../', import.meta.url)
const source = readFileSync(new URL('src/routes/HowItWorks.tsx',root),'utf8')
const css = readFileSync(new URL('src/routes/how-it-works.css',root),'utf8')
const assets = JSON.parse(readFileSync(new URL('src/components/landing/landing-assets.json',root),'utf8'))
const screens = guides.flatMap(guide=>guide.chapters.flatMap(chapter=>chapter.screens))

test('all nine original workflows retain every title, summary, bullet and takeaway',()=>{
 assert.equal(tabs.length,9)
 assert.equal(guides.length,16)
 assert.equal(new Set(guides.map(guide=>guide.id)).size,guides.length)
 for(const original of tabs) {
  const guide=guides.find(guide=>guide.id===original.id)
  assert.ok(guide,original.id)
  for(const key of ['label','navBlurb','title','summary','concept'] as const) assert.equal(guide[key],original[key])
  assert.deepEqual(guide.bullets,original.bullets)
 }
 assert.deepEqual(productLoop,['Track Game','Game Summary','Player Profiles','Leaderboards','Feed & Sharing'])
 assert.deepEqual(guideGroups,['Getting started','Match day','Your season','Club tools'])
})
test('new walkthroughs cover the supplied feature workflows without replacing original information',()=>{
 for(const id of ['team-selections','single-player-tracking','custom-stat-pad','mapping-analysis','game-cards','best-fairest-voting','tallies-awards']) {
  const guide=guides.find(guide=>guide.id===id)
  assert.ok(guide?.summary)
  assert.equal(guide.bullets.length,4)
  assert.ok(guide.chapters.length)
 }
 assert.equal(guides.find(guide=>guide.id==='portal-club-management')?.chapters.length,0)
 assert.match(source,/squad screenshots elsewhere in this guide show the mobile app/)
 assert.match(source,/\/sign-in\?redirect=%2Fhub/)
})
test('all 43 product screenshots are available, with original files and responsive variants intact',async()=>{
 const supplied=Object.keys(assets).filter(key=>key.startsWith('capture-')).sort()
 const used=[...new Set(screens.filter(screen=>screen.asset.startsWith('capture-')).map(screen=>screen.asset))].sort()
 assert.equal(supplied.length,43)
 assert.deepEqual(used,supplied)
 for(const screen of screens) {
  const asset=assets[screen.asset]
  assert.ok(asset,screen.asset)
  assert.ok(screen.alt && screen.label)
  for(const path of [asset.original,...asset.variants.map((v:any)=>v.src)]) assert.ok((await stat(new URL('public'+path,root))).size>0)
 }
 for(const chapter of guides.flatMap(guide=>guide.chapters)) if(chapter.layout==='pair') {
  assert.equal(chapter.screens.length,2)
  assert.match(chapter.screens[0].asset,/-ipad$/)
  assert.match(chapter.screens[1].asset,/-phone$/)
 }
})

const require=createRequire(import.meta.url)
const React=require('react')
const {renderToStaticMarkup}=require('react-dom/server')
const {StaticRouter}=require('react-router-dom/server')
function moduleFrom(path:string,dependencies:Record<string,any>={}) {
 const code=ts.transpileModule(readFileSync(new URL(path,root),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const exports:any={}
 new Function('require','exports',code)((id:string)=>id.endsWith('.css')?{}:dependencies[id]??require(id),exports)
 return exports
}
const media=moduleFrom('src/components/landing/LandingMedia.tsx',{'./landing-assets.json':{default:assets}})
const stage=moduleFrom('src/components/landing/ProductStoryStage.tsx')
const product=moduleFrom('src/components/landing/ProductScreens.tsx',{'./LandingMedia':media,'./ProductStoryStage':stage})
function renderGuide(id:string) {
 const route=moduleFrom('src/routes/HowItWorks.tsx',{
  react:{...React,useState:(initial:any)=>React.useState(typeof initial==='string'?id:initial)},
  '@/components/landing/PublicSiteShell':{PublicSiteShell:({children}:any)=>React.createElement('main',null,children)},
  '@/components/landing/ProductScreens':product,
  '@/components/landing/how-it-works-content':{productLoop},
  '@/components/landing/how-it-works-guides':{guides,guideGroups},
 })
 return renderToStaticMarkup(React.createElement(StaticRouter,{location:'/how-it-works'},React.createElement(route.default))) as string
}
const escaped=(value:string)=>renderToStaticMarkup(React.createElement('span',null,value)).slice(6,-7)
test('every selected guide renders complete readable content and same-page screenshot previews',()=>{
 for(const guide of guides) {
  const html=renderGuide(guide.id)
  assert.equal((html.match(/role="tabpanel"/g)||[]).length,1)
  assert.ok(html.includes(`id="panel-${guide.id}"`))
  for(const text of [guide.summary,guide.concept,...guide.bullets]) assert.ok(html.includes(escaped(text)),`${guide.id}: ${text}`)
  for(const chapter of guide.chapters) {
   assert.ok(html.includes(escaped(chapter.title)))
   for(const screen of chapter.screens) {
    assert.ok(html.includes(`aria-label="${escaped('Enlarge image: '+screen.alt)}"`))
    assert.ok(html.includes('aria-haspopup="dialog"'))
   }
  }
  assert.doesNotMatch(html,/target="_blank"|Screenshot placeholder|Visual slot/)
 }
})
test('keyboard tabs, grouped mobile selection and public destinations remain accessible',()=>{
 assert.match(source,/guides.find\(tab => tab.id === activeTabId\)/)
 assert.match(source,/role="tablist"/)
 assert.match(source,/aria-orientation="vertical"/)
 for(const attribute of ['aria-selected=','aria-controls=','aria-labelledby=']) assert.ok(source.includes(attribute))
 for(const key of ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End']) assert.ok(source.includes(key))
 assert.match(source,/setPointerMotion\(false\)/)
 assert.match(source,/setPointerMotion\(event.detail > 0\)/)
 assert.match(source,/<optgroup/)
 assert.match(source,/<select value=\{activeTabId\}/)
 assert.match(source,/<PublicSiteShell variant="editorial" activeNavId="how-it-works" useLandingAnchors>/)
 assert.match(source,/id="landing-content"/)
 assert.doesNotMatch(source,/fetch\(|supabase|\/new/)
})
test('responsive layouts, restrained pointer-only motion and reduced-motion fallback are scoped',()=>{
 assert.match(css,/@media\(max-width:900px\)/)
 assert.match(css,/\.hiw-index \{ display:none;/)
 assert.match(css,/\.hiw-mobile-picker \{ display:grid;/)
 assert.match(css,/\.hiw-layout \{ grid-template-columns:minmax\(0,1fr\);/)
 assert.match(css,/data-pointer-motion=true/)
 assert.match(css,/hiw-enter 220ms/)
 assert.match(css,/prefers-reduced-motion:reduce/)
 assert.match(css,/focus-visible/)
 assert.doesNotMatch(css,/blur\(|transition:all|scroll-snap|lp-story-track/)
})
