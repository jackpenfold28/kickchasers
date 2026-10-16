import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = readFileSync(new URL('../src/components/landing/useLandingStory.ts',import.meta.url),'utf8')
const landing = readFileSync(new URL('../src/routes/Landing.tsx',import.meta.url),'utf8')
const stage = readFileSync(new URL('../src/components/landing/ProductStoryStage.tsx',import.meta.url),'utf8')
const css = readFileSync(new URL('../src/components/landing/landing.css',import.meta.url),'utf8')
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText

function fixture({ reduced = false, desktop = true, observerFails = false, missingObserver = false, withStages = false, visible = false, devicePair = false, opposed = false } = {}) {
 const handlers = new Map<string,Function>()
 const preferences = [reduced,desktop].map(matches=>({matches,callback:()=>{},addEventListener(_name:string,fn:()=>void){this.callback=fn},removeEventListener(){this.callback=()=>{}}}))
 let callback: Function | undefined
 let observed: any[] = []
 let disconnected = false
 let frames: (()=>void)[] = []
 const attributes = new Map<string,string>()
 const unit = () => ({dataset:{} as Record<string,string>,getBoundingClientRect:()=>({top:visible?200:1200}),closest:()=>null,querySelectorAll:()=>[tablet,phone]})
 const copy=unit(), media=unit(), tablet=unit(), phone=unit()
 const pair={querySelectorAll:()=>[tablet,phone]}
 const chapter = {id:opposed?'custom-stat-pad':'features',querySelector:(selector:string)=>selector.includes('copy')?copy:selector==='.lp-device-pair'?(devicePair?pair:null):media}
 const stages = withStages ? ['mapping','cards','phones'].map(kind=>{
  const classes = new Set<string>()
  const steps = [0,1,2].map(()=>({setAttribute:()=>{},removeAttribute:()=>{}}))
  return {kind,dataset:{} as Record<string,string>,offsetHeight:1300,
   classList:{toggle:(name:string,on:boolean)=>on?classes.add(name):classes.delete(name),contains:(name:string)=>classes.has(name),remove:(name:string)=>classes.delete(name)},
   getBoundingClientRect:()=>({top:500}),querySelector:(selector:string)=>selector==='.lp-sticky-stage'?{offsetHeight:760}:{style:{}},querySelectorAll:()=>steps}
 }) : []
 const root = {querySelectorAll:(selector:string)=>selector==='[data-product-stage]'?stages:[chapter],setAttribute:(key:string,value:string)=>attributes.set(key,value),removeAttribute:(key:string)=>attributes.delete(key)}
 const window = {scrollY:0,innerHeight:960,matchMedia:(query:string)=>query.includes('reduced-motion')?preferences[0]:preferences[1],addEventListener:(name:string,fn:Function)=>handlers.set(name,fn),removeEventListener:(name:string)=>handlers.delete(name)}
 const Observer = missingObserver ? undefined : class {
  constructor(cb:Function) { if(observerFails) throw Error('unavailable'); callback=cb }
  observe(element:any) { observed.push(element) }
  unobserve(element:any) { observed=observed.filter(item=>item!==element) }
  disconnect() { disconnected=true }
 }
 const exports:any = {}
 new Function('require','exports','window','IntersectionObserver','ResizeObserver','requestAnimationFrame','cancelAnimationFrame',compiled)(()=>({}),exports,window,Observer,undefined,(fn:()=>void)=>{frames.push(fn);return frames.length},()=>{})
 const cleanup = exports.enhanceLandingStory(root)
 const units={copy,media,tablet,phone}
 return {units,handlers,preferences,attributes,stages,flush:()=>{const pending=frames;frames=[];pending.forEach(fn=>fn())},observed:()=>observed,enter:(ratio=1,name:keyof typeof units='copy')=>callback?.([{target:units[name],isIntersecting:ratio>0,intersectionRatio:ratio}]),cleanup,disconnected:()=>disconnected,exports}
}

test('observer failure and reduced motion leave original content visible',()=>{
 for(const options of [{missingObserver:true},{observerFails:true},{reduced:true}]) {
  const story=fixture(options)
  assert.ok(Object.values(story.units).every(unit=>!unit.dataset.storyEnter))
  story.cleanup()
 }
 assert.match(source,/useLayoutEffect/)
 assert.doesNotMatch(source,/element.animate/)
})
test('offscreen content is prepared before entrance; already visible content never resets',()=>{
 const story=fixture()
 assert.equal(story.units.copy.dataset.storyEnter,'pending')
 story.enter(.01)
 assert.equal(story.units.copy.dataset.storyEnter,'pending')
 story.enter(.2)
 assert.equal(story.units.copy.dataset.storyEnter,'visible')
 assert.equal(story.units.media.dataset.storyEnter,'pending')
 story.enter(.2,'media')
 assert.equal(story.units.media.dataset.storyEnter,'visible')
 const restored=fixture({visible:true})
 assert.equal(restored.observed().length,0)
 assert.ok(Object.values(restored.units).every(unit=>!unit.dataset.storyEnter))
 story.cleanup();restored.cleanup()
 assert.ok(Object.values(story.units).every(unit=>!unit.dataset.storyEnter))
})
test('each tracker device has an independent scroll entrance with phone in front',()=>{
 const story=fixture({devicePair:true})
 assert.equal(story.observed().length,3)
 assert.equal(story.units.tablet.dataset.storyDirection,'left')
 assert.equal(story.units.phone.dataset.storyDirection,'right')
 story.enter(.2,'tablet')
 assert.equal(story.units.tablet.dataset.storyEnter,'visible')
 assert.equal(story.units.phone.dataset.storyEnter,'pending')
 story.enter(.2,'phone')
 assert.equal(story.units.phone.dataset.storyEnter,'visible')
 const mobile=fixture({devicePair:true,desktop:false})
 assert.equal(mobile.units.phone.dataset.storyDirection,'up')
 story.cleanup();mobile.cleanup()
})
test('keyboard and live reduced-motion changes immediately expose pending content',()=>{
 const story=fixture()
 story.handlers.get('keydown')?.()
 assert.ok(!story.units.media.dataset.storyEnter)
 assert.ok(story.attributes.has('data-story-keyboard'))
 story.handlers.get('wheel')?.()
 assert.ok(!story.attributes.has('data-story-keyboard'))
 const reduced=fixture()
 reduced.preferences[0].matches=true
 reduced.preferences[0].callback()
 assert.ok(!reduced.units.media.dataset.storyEnter)
 story.cleanup();reduced.cleanup()
 assert.equal(story.handlers.size,0)
})
test('shared sticky stages clamp fast and reverse scroll to three valid states',()=>{
 const {stageProgress}=fixture().exports
 for(const [y,p,state] of [[-100,0,0],[100,0,0],[300,1/3,1],[500,2/3,2],[700,1,2],[99999,1,2],[300,1/3,1],[100,0,0]]) {
  const actual=stageProgress(y,100,700)
  assert.equal(actual.progress,p)
  assert.equal(actual.state,state)
 }
 assert.equal((landing.match(/<ProductStoryStage kind=/g)||[]).length,2)
 assert.match(landing,/<ProductStoryStage kind="mapping">/)
 assert.match(landing,/<ProductStoryStage kind="cards">/)
 assert.equal((stage.match(/data-product-stage=/g)||[]).length,1)
 assert.match(css,/\.lp-story-track\.is-sticky::after \{ content:""; display:block; height:60vh;/)
 assert.match(css,/@media\(max-width:1100px\),\(max-height:799px\),\(prefers-reduced-motion:reduce\)/)
 assert.match(css,/\.lp-sticky-stage \{ position:static; min-height:0;/)
 assert.match(source,/desktop.matches && !reduced.matches/)
 assert.match(css,/:has\(dialog\[open\]\)/)
 assert.doesNotMatch(source,/preventDefault|scrollTo\(|scrollIntoView|wheel.*schedule/)
 const update=source.slice(source.indexOf('const update ='),source.indexOf('const schedule ='))
 assert.doesNotMatch(update,/getBoundingClientRect|offsetHeight/)
})
test('existing product copy, screenshots, destinations, hero and video gates remain',()=>{
 assert.match(landing,/See the play/)
 assert.match(landing,/Your performance/)
 for(const asset of ['capture-map-ipad','capture-map-phone','capture-card','capture-generated','capture-album'])assert.ok(landing.includes(asset))
 assert.match(landing,/authLink\('\/dashboard'\)/)
 assert.match(landing,/authLink\('\/hub'\)/)
 assert.match(landing,/<HeroVideoStage>/)
 assert.match(landing,/<PricingSection\/>/)
 assert.doesNotMatch(landing,/useScrollExperience|lp-scroll-experience/)
 const video=readFileSync(new URL('../src/components/landing/TeamTrackingVideo.tsx',import.meta.url),'utf8')
 assert.match(video,/shouldPlayDemo\(visible, document.hidden, preference.matches, userPaused\)/)
 assert.match(video,/media.pause\(\)/)
})


test('Mapping and Cards both release to a static layout on narrow screens and preference changes',()=>{
 const story=fixture({withStages:true})
 story.flush()
 assert.equal(story.stages.length,3)
 assert.ok(story.stages.every(stage=>stage.classList.contains('is-sticky')))
 story.preferences[0].matches=true
 story.preferences[0].callback()
 story.flush()
 assert.ok(story.stages.every(stage=>!stage.classList.contains('is-sticky')))
 assert.equal(story.handlers.has('scroll'),false)
 const mobile=fixture({withStages:true,desktop:false})
 assert.ok(mobile.stages.every(stage=>!stage.classList.contains('is-sticky')))
 assert.equal(mobile.handlers.has('scroll'),false)
 story.cleanup();mobile.cleanup()
})


test('product stage renders all original children on the server before enhancement',()=>{
 const require=createRequire(import.meta.url)
 const React=require('react')
 const {renderToStaticMarkup}=require('react-dom/server')
 const output=ts.transpileModule(stage,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText
 const exports:any={}
 new Function('require','exports',output)(require,exports)
 for(const kind of ['mapping','cards']) {
  const html=renderToStaticMarkup(React.createElement(exports.ProductStoryStage,{kind},React.createElement('p',null,`Original ${kind} media`)))
  assert.ok(html.includes(`<p>Original ${kind} media</p>`))
  assert.doesNotMatch(html,/style="[^"]*(?:opacity|display)| hidden=/)
  assert.doesNotMatch(html,/class="lp-story-track is-sticky/)
 }
})


test('three-phone feature galleries reuse the approved story and avoid tall letterboxed image slots',()=>{
 assert.equal((landing.match(/<ScreenGallery story heading=/g)||[]).length,3)
 const screens=readFileSync(new URL('../src/components/landing/ProductScreens.tsx',import.meta.url),'utf8')
 assert.match(screens,/<ProductStoryStage kind="phones"/)
 assert.match(css,/width:100%; height:auto; aspect-ratio:1284\/2603/)
 assert.doesNotMatch(css,/height:calc\(100vh - 400px\)/)
 assert.match(css,/prefers-reduced-motion:reduce\) \{\s*\.lp-landing-story \[data-story-enter\]/)
})


test('three-phone chapters keep heading and readable progress inside the sticky stage',()=>{
 const screens=readFileSync(new URL('../src/components/landing/ProductScreens.tsx',import.meta.url),'utf8')
 assert.ok(screens.includes('>{heading}{gallery}</ProductStoryStage>'))
 for(const id of ['summary-heading','portal-heading','voting-heading']) {
  assert.ok(landing.includes('<ScreenGallery story heading={<div className="lp-section-heading"><h2 id="'+id+'"'))
 }
 assert.match(css,/\.lp-story-progress li \{[^}]*font-size:16px/)
 assert.match(css,/\.lp-story-progress-line \{[^}]*height:4px/)
 assert.match(css,/calc\(\(100svh - 390px\)\*\.493\)/)
})


test('custom stat-pad phones slide independently from opposite sides',()=>{
 const story=fixture({opposed:true})
 assert.equal(story.observed().length,3)
 assert.equal(story.units.tablet.dataset.storyDirection,'left')
 assert.equal(story.units.phone.dataset.storyDirection,'right')
 story.enter(.2,'tablet')
 assert.equal(story.units.tablet.dataset.storyEnter,'visible')
 assert.equal(story.units.phone.dataset.storyEnter,'pending')
 const mobile=fixture({opposed:true,desktop:false})
 assert.equal(mobile.units.phone.dataset.storyDirection,'up')
 story.cleanup();mobile.cleanup()
})
