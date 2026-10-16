import { useLayoutEffect, useRef } from 'react'

export function stageProgress(scroll: number, start: number, end: number) {
  const progress = Math.max(0, Math.min(1, (scroll - start) / Math.max(1, end - start)))
  return { progress, state: Math.min(2, Math.floor(progress * 3)) }
}

/** Visible by default; a failed observer or animation never hides the product. */
export function enhanceLandingStory(root: HTMLElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const desktop = window.matchMedia('(min-width:1101px) and (min-height:800px)')
  const stages = [...root.querySelectorAll<HTMLElement>('[data-product-stage]')]
  let frame = 0
  let observer: IntersectionObserver | undefined
  let bounds: { element: HTMLElement; start: number; end: number; lastState: number; lastProgress: number }[] = []
  const entrances = new Set<HTMLElement>()
  const showEntrances = () => entrances.forEach(element => { delete element.dataset.storyEnter })
  const prepare = (element: HTMLElement, direction: string) => {
    // Never reset content already on screen (restored scroll or direct anchors).
    if (reduced.matches || element.getBoundingClientRect().top < window.innerHeight) return
    element.dataset.storyDirection = direction
    element.dataset.storyEnter = 'pending'
    entrances.add(element)
    observer?.observe(element)
  }
  try {
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting && entry.intersectionRatio >= .12) {
          observer?.unobserve(entry.target)
          const element = entry.target as HTMLElement
          element.dataset.storyEnter = 'visible'
        }
      }, { threshold:.12, rootMargin:'0px 0px -6% 0px' })
      root.querySelectorAll<HTMLElement>('.lp-product-chapter, .lp-final').forEach(chapter => {
        const copy = chapter.querySelector<HTMLElement>('.lp-product-copy, .lp-section-heading') || chapter.firstElementChild as HTMLElement | null
        if (copy) prepare(copy, 'up')
        const pair = chapter.querySelector('.lp-device-pair')
        if (pair) {
          pair.querySelectorAll<HTMLElement>('.lp-device-tablet, .lp-device-phone').forEach((device,index) => {
            prepare(device, desktop.matches ? (index ? 'right' : 'left') : 'up')
          })
        } else {
          const media = chapter.querySelector<HTMLElement>('.lp-screen-gallery, .lp-social-story, .lp-ipad-demo')
          // Sticky galleries already have scroll-controlled states; don't replay an entrance on top.
          if (media && chapter.id === 'custom-stat-pad') {
            media.querySelectorAll<HTMLElement>(':scope > figure').forEach((phone,index) => {
              prepare(phone, desktop.matches ? (index ? 'right' : 'left') : 'up')
            })
          } else if (media && !media.closest('[data-product-stage]')) prepare(media, 'up')
        }
      })
    }
  } catch { observer?.disconnect(); observer = undefined; showEntrances() }

  const update = () => {
    frame = 0
    for (const stage of bounds) {
      const { progress, state } = stageProgress(window.scrollY, stage.start, stage.end)
      if (state !== stage.lastState) {
        stage.element.dataset.storyState = String(state)
        stage.element.querySelectorAll('[data-story-step]').forEach((step,index) => {
          if (index === state) step.setAttribute('aria-current','step')
          else step.removeAttribute('aria-current')
        })
        stage.lastState = state
      }
      if (progress !== stage.lastProgress) {
        const line = stage.element.querySelector<HTMLElement>('.lp-story-progress-line > span')
        if (line) line.style.transform = `scaleX(${progress})`
        stage.lastProgress = progress
      }
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  const measure = () => {
    bounds = stages.filter(stage => stage.classList.contains('is-sticky')).map(element => {
      const start = element.getBoundingClientRect().top + window.scrollY - 100
      const height = element.querySelector<HTMLElement>('.lp-sticky-stage')?.offsetHeight || 0
      return { element, start, end:start+Math.max(1,element.offsetHeight-height), lastState:-1, lastProgress:-1 }
    })
    schedule()
  }
  const configure = () => {
    if (reduced.matches) showEntrances()
    stages.forEach(stage => {
      stage.classList.toggle('is-sticky', desktop.matches && !reduced.matches)
      if (!desktop.matches || reduced.matches) {
        delete stage.dataset.storyState
        stage.querySelectorAll('[aria-current="step"]').forEach(step => step.removeAttribute('aria-current'))
      }
    })
    window.removeEventListener('scroll',schedule)
    if (desktop.matches && !reduced.matches) window.addEventListener('scroll',schedule,{passive:true})
    measure()
  }
  const keyboard = () => { root.setAttribute('data-story-keyboard',''); showEntrances() }
  const pointer = () => { root.removeAttribute('data-story-keyboard') }
  const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined
  resize?.observe(root)
  window.addEventListener('resize',measure)
  window.addEventListener('keydown',keyboard)
  window.addEventListener('wheel',pointer,{passive:true})
  window.addEventListener('touchstart',pointer,{passive:true})
  reduced.addEventListener('change',configure)
  desktop.addEventListener('change',configure)
  configure()
  return () => {
    observer?.disconnect(); resize?.disconnect(); showEntrances(); cancelAnimationFrame(frame)
    window.removeEventListener('scroll',schedule)
    window.removeEventListener('resize',measure)
    window.removeEventListener('keydown',keyboard)
    window.removeEventListener('wheel',pointer)
    window.removeEventListener('touchstart',pointer)
    reduced.removeEventListener('change',configure)
    desktop.removeEventListener('change',configure)
    stages.forEach(stage => { stage.classList.remove('is-sticky'); delete stage.dataset.storyState })
    entrances.forEach(element => { delete element.dataset.storyDirection })
    root.removeAttribute('data-story-keyboard')
  }
}

export function useLandingStory() {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => root.current ? enhanceLandingStory(root.current) : undefined, [])
  return root
}
