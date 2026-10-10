import assert from 'node:assert/strict'
import { readFile, stat, readdir } from 'node:fs/promises'
import test from 'node:test'
import { buildOnboardingPath, buildSignInPath, getSafeReturnPath } from '../src/lib/canonical/route-safety.ts'
import { shouldPlayDemo } from '../src/components/landing/video-playback.ts'
const root = new URL('../', import.meta.url)
const source = (path: string) => readFile(new URL(path, root), 'utf8')
const landing = await source('src/routes/Landing.tsx')
const pricingSection = await source('src/components/landing/PricingSection.tsx')
const mapping = await source('src/components/landing/MappingStory.tsx')
const video = await source('src/components/landing/TeamTrackingVideo.tsx')
const css = await source('src/components/landing/landing.css')
const shell = await source('src/components/landing/PublicSiteShell.tsx')
const media = await source('src/components/landing/LandingMedia.tsx')
const assets = JSON.parse(await source('src/components/landing/landing-assets.json'))

test('both primary CTAs retain the supported sign-in destination, never /new', () => {
 assert.match(landing, /to=\{authLink\('\/dashboard'\)\}/)
 assert.equal((landing.match(/<StartLink\s*\/>/g)||[]).length, 2)
 assert.doesNotMatch(landing+shell, /(?:to|href|authLink)[^\n]*['"]\/new['"?]/)
 assert.equal(buildSignInPath('/dashboard'), '/sign-in?redirect=%2Fdashboard')
 assert.equal(getSafeReturnPath('/dashboard'), '/dashboard')
 assert.equal(buildOnboardingPath('/dashboard'), '/onboarding?returnTo=%2Fdashboard')
})

test('old screenshots and all responsive assets remain intact even when omitted from live flow', async () => {
 const originals = (await readdir(new URL('public/mockups/landing/',root))).filter(f=>f.endsWith('.png'))
 assert.equal(originals.length, 9)
 for(const file of originals) assert.equal(assets[file.slice(0,-4)].original, `/mockups/landing/${file}`)
 for(const asset of Object.values(assets) as any[]) {
  assert.ok(asset.width>0 && asset.height>0)
  for(const path of [asset.original,...asset.variants.map((v:any)=>v.src)]) assert.ok((await stat(new URL(`public${path}`,root))).size>0,path)
  for(const variant of asset.variants) assert.ok(variant.width <= asset.width)
 }
})

test('every visible media reference has a manifest entry and every video resolves', async () => {
 for(const text of [landing,mapping]) for(const match of text.matchAll(/asset="([\w-]+)"/g)) assert.ok(assets[match[1]],match[1])
 for(const path of ['/landing/video/team-tracking.mp4','/landing/video/kickchasers-marketing.mp4','/landing/video/hero-poster.webp']) assert.ok((await stat(new URL(`public${path}`,root))).size>0)
})

test('chapter anchors resolve and cards are the last product chapter before final CTA', () => {
 const ids = [...landing.matchAll(/id="([\w-]+)"/g)].map(m=>m[1])
 for(const hash of [...landing.matchAll(/(?:href[:=]\s*['"]|['"])(#[\w-]+)['"]/g)].map(m=>m[1].slice(1))) assert.ok([...ids,'pricing'].includes(hash),hash)
 const chapters=['features','team-tracking','mapping','match-summary','portal','game-cards','get-started']
 const actual=[...landing.matchAll(/<section[^>]*id="([\w-]+)"/g)].map(m=>m[1])
 assert.deepEqual(actual,chapters)
 assert.ok(landing.indexOf('<PricingSection/>') > landing.indexOf('id="game-cards"'))
 assert.ok(landing.indexOf('<PricingSection/>') < landing.indexOf('id="get-started"'))
 assert.match(pricingSection, /id="pricing"/)
 assert.doesNotMatch(landing,/ScrollProductStory|id="product-story"|lp-audience|lp-collection|asset="premium-promo"|asset="mapping-promo"/)
 assert.doesNotMatch(landing,/<details[^>]*\sopen(?:[ >])/)
 for(const route of ['/how-it-works','/sign-in','/sign-up']) assert.ok((landing+shell).includes(route))
})

test('mapping is one progressively enhanced proof with a static, reduced-motion fallback', () => {
 assert.equal((mapping.match(/asset="team-mapping"/g)||[]).length,1)
 assert.equal((mapping.match(/<article data-mapping-step="/g)||[]).length,2)
 assert.match(mapping,/useState\(false\)/)
 assert.match(mapping,/prefers-reduced-motion: no-preference/)
 assert.match(mapping,/addEventListener\('scroll', schedule, \{ passive: true \}\)/)
 assert.match(mapping,/cancelAnimationFrame\(frame\)/)
 assert.match(mapping,/removeEventListener\('scroll', schedule\)/)
 assert.match(mapping,/preference.removeEventListener/)
 assert.match(css,/\.lp-mapping-story\.is-enhanced \.lp-mapping-proof \{ position:static;/)
 assert.doesNotMatch(mapping,/preventDefault|wheel|touchmove|scrollTo/)
 assert.doesNotMatch(css,/60vh; display:flex|100vw|overflow-x:scroll/)
})

test('demo autoplay gates every visibility, preference, tab and manual-pause combination', () => {
 for(const inView of [false,true]) for(const hidden of [false,true]) for(const motion of [false,true]) for(const paused of [false,true]) {
  assert.equal(shouldPlayDemo(inView,hidden,motion,paused), inView && !hidden && motion && !paused)
 }
 assert.match(video,/shouldPlayDemo\(visible, document.hidden, preference.matches, userPaused\)/)
 assert.match(video,/visibilitychange/)
 assert.match(video,/observer\?\.disconnect/)
 assert.match(video,/media.pause\(\)/)
 assert.match(video,/controls muted playsInline loop preload="metadata"/)
 assert.doesNotMatch(video,/autoPlay|media.autoplay/)
})

test('media preserves originals, responsive variants and full-size access through CSS crops', () => {
 assert.match(media,/width=\{media.width\} height=\{media.height\}/)
 assert.match(media,/srcSet=/)
 assert.match(media,/loading=\{priority \? 'eager' : 'lazy'\}/)
 assert.match(media,/failed \? media.original/)
 assert.match(media,/target="_blank" rel="noreferrer"/)
 assert.match(css,/\.lp-single-proof img[^}]*object-position:/)
 assert.match(css,/\.lp-summary-proof img[^}]*object-position:/)
})

test('landing retains semantic navigation, focus, direct anchors and motion overrides', () => {
 assert.equal((landing.match(/<h1[ >]/g)||[]).length,1)
 assert.match(shell,/Skip to product/)
 assert.match(shell,/Mobile landing sections/)
 assert.match(css,/focus-visible/)
 assert.match(css,/@media\(max-width:767px\)/)
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
 assert.match(landing,/useLocation\(\)/)
 assert.match(landing,/document.getElementById\(id\)\?\.scrollIntoView/)
 assert.match(landing,/cancelAnimationFrame\(frame\)/)
})

test('metadata stays football-specific without new claims or store destinations', async () => {
 assert.match(await source('index.html'),/name="description" content="Australian football performance tracking/)
 assert.doesNotMatch(landing,/apps\.apple|play\.google|AI.generated|most selected|\$99/)
})
