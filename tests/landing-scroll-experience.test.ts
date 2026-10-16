import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/components/landing/useScrollExperience.ts', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/components/landing/landing.css', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText

function setup({ supported = true, reduced = false } = {}) {
 const attributes = new Set<string>()
 const listeners = new Map<string, (event?: any) => void>()
 const mediaListeners = new Map<string, () => void>()
 const preference = { matches: reduced, addEventListener: (name: string, cb: () => void) => mediaListeners.set(name, cb), removeEventListener: (name: string) => mediaListeners.delete(name) }
 const element = { hasAttribute: (name: string) => attributes.has(name), setAttribute: (name: string) => attributes.add(name), removeAttribute: (name: string) => attributes.delete(name) }
 let cleanup: undefined | (() => void)
 const exports: any = {}
 const require = () => ({ useRef: () => ({ current: element }), useEffect: (effect: () => (() => void) | undefined) => { cleanup = effect() } })
 const window = { matchMedia: () => preference, addEventListener: (name: string, cb: () => void) => listeners.set(name, cb), removeEventListener: (name: string) => listeners.delete(name) }
 new Function('require', 'exports', 'window', 'CSS', compiled)(require, exports, window, { supports: () => supported })
 exports.useScrollExperience()
 return { attributes, listeners, mediaListeners, preference, cleanup: () => cleanup?.() }
}

test('scroll treatment starts visible, follows pointer gestures, and immediately yields to keyboard input', () => {
 const motion = setup()
 assert.equal(motion.attributes.size, 0)
 motion.listeners.get('wheel')?.()
 assert.ok(motion.attributes.has('data-scroll-motion'))
 for (const key of ['Tab','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ','Enter','Escape']) {
  motion.listeners.get('touchstart')?.()
  motion.listeners.get('keydown')?.({ key })
  assert.equal(motion.attributes.size, 0, key)
 }
 motion.listeners.get('wheel')?.()
 motion.cleanup()
 assert.equal(motion.attributes.size, 0)
 assert.equal(motion.listeners.size, 0)
 assert.equal(motion.mediaListeners.size, 0)
})

test('reduced motion and unsupported browsers keep all content static and visible', () => {
 const reduced = setup({ reduced: true })
 reduced.listeners.get('wheel')?.()
 assert.equal(reduced.attributes.size, 0)
 const motion = setup()
 motion.listeners.get('wheel')?.()
 motion.preference.matches = true
 motion.mediaListeners.get('change')?.()
 assert.equal(motion.attributes.size, 0)
 motion.listeners.get('touchstart')?.()
 assert.equal(motion.attributes.size, 0)
 const fallback = setup({ supported: false })
 assert.equal(fallback.attributes.size, 0)
 assert.equal(fallback.listeners.size, 0)
})

test('native scroll animation has a stable reading range and excludes focused content and open previews', () => {
 const treatment = css.slice(css.indexOf('/* Reversible, gesture-driven chapters.'),css.indexOf('/* Prepared before paint:'))
 assert.match(treatment, /@supports \(animation-timeline:view\(\)\)/)
 assert.match(treatment, /prefers-reduced-motion:no-preference/)
 assert.match(treatment, /entry 40%,exit 60% \{ opacity:1; transform:none;/)
 assert.match(treatment, /animation-range:entry 0% exit 100%/)
 assert.match(treatment, /:focus-within,:target,:has\(dialog\[open\]\)/)
 assert.doesNotMatch(treatment, /\.lp-hero|\.lp-feature-category td|\.lp-mobile-plan-selector/)
 assert.doesNotMatch(source, /addEventListener\('scroll'|preventDefault|requestAnimationFrame|setTimeout/)
})
