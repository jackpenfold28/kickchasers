import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'
import { openingScrollProgress, reverseVideoTime } from '../src/components/landing/hero-video-progress.ts'

const source = await readFile(new URL('../src/components/landing/HeroVideoStage.tsx', import.meta.url),'utf8')

test('the opening starts at the final frame and finishes at the first frame', () => {
 const duration=5.06
 assert.equal(openingScrollProgress(0,80,2000,900,80),0)
 assert.equal(openingScrollProgress(1180,80,2000,900,80),1)
 assert.equal(reverseVideoTime(0,duration),5.01)
 assert.equal(reverseVideoTime(1,duration),0)
})

test('scrolling down rewinds, scrolling up retraces the same frames', () => {
 const times=[0,295,590,885,1180].map(y=>reverseVideoTime(openingScrollProgress(y,80,2000,900,80),5.06))
 assert.ok(times.every((time,index)=>index===0||time<times[index-1]))
 assert.equal(times[2],2.505)
 assert.equal(reverseVideoTime(openingScrollProgress(590,80,2000,900,80),5.06),times[2])
})

test('overscroll, short containers and unavailable duration are safe', () => {
 assert.equal(openingScrollProgress(-100,80,2000,900,80),0)
 assert.equal(openingScrollProgress(5000,80,2000,900,80),1)
 assert.equal(openingScrollProgress(10,80,200,900,80),1)
 for(const duration of [NaN,Infinity,0,-1]) assert.equal(reverseVideoTime(.5,duration),0)
 assert.equal(reverseVideoTime(-3,5),4.95)
 assert.equal(reverseVideoTime(3,5),0)
})

test('the video is muted, inline, paused and uses serial rather than queued seeks', () => {
 assert.match(source,/muted playsInline preload="auto"/)
 assert.match(source,/media.pause\(\)/)
 assert.match(source,/media.seeking/)
 assert.match(source,/media.currentTime = desiredTime/)
 assert.match(source,/media.addEventListener\('seeked', onSeeked\)/)
 assert.doesNotMatch(source,/autoPlay|playbackRate|\.play\(|preventDefault/)
})

test('scroll handling is passive, bounded to scheduled frames and cleaned up', () => {
 assert.match(source,/if \(!frame\) frame = requestAnimationFrame/)
 assert.match(source,/addEventListener\('scroll', schedule, \{ passive: true \}\)/)
 assert.match(source,/cancelAnimationFrame\(frame\)/)
 assert.match(source,/resize\?\.disconnect\(\)/)
 assert.match(source,/removeEventListener\('scroll', schedule\)/)
 assert.match(source,/removeEventListener\('seeked', onSeeked\)/)
})

test('reduced motion, narrow screens and failed media retain a poster without a video download', () => {
 assert.match(source,/prefers-reduced-motion: no-preference/)
 assert.match(source,/min-width: 1000px/)
 assert.match(source,/enabled && <video/)
 assert.match(source,/eligible && !still && !failed/)
 assert.match(source,/onError=\{\(\) => setFailed\(true\)\}/)
 assert.match(source,/aria-pressed=\{still\}/)
 assert.match(source,/<img src=\{POSTER\}/)
})

test('supplied video and extracted poster are real nonempty local assets', async () => {
 for(const path of ['kickchasers-marketing.mp4','hero-poster.webp']) assert.ok((await stat(new URL(`../public/landing/video/${path}`,import.meta.url))).size>0)
 const landing=await readFile(new URL('../src/routes/Landing.tsx',import.meta.url),'utf8')
 const range=landing.slice(landing.indexOf('<HeroVideoStage>'),landing.indexOf('</HeroVideoStage>'))
 assert.match(range,/hero-heading/)
 assert.doesNotMatch(range,/id="features"/)
 assert.ok(landing.indexOf('id="features"') > landing.indexOf('</HeroVideoStage>'), 'player proof has its own full-width chapter after the opening film')
 assert.doesNotMatch(range,/id="team-tracking"/)
})
