import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

type RevealDirection = 'up' | 'left' | 'right'
type VisualMotionDirection = 'up' | 'left' | 'right'

type RevealProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  direction?: RevealDirection
  mobileDirection?: RevealDirection
  delay?: number
  duration?: number
  distance?: number
  threshold?: number
  scale?: number
  baseOpacity?: number
}

type HeroStaggerItemProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: RevealDirection
  distance?: number
}

type VisualMotionProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  distance?: number
  direction?: VisualMotionDirection
  drift?: number
  parallax?: number
  mobileParallax?: number
  scale?: number
  scrollScale?: number
  mobileScrollScale?: number
  baseOpacity?: number
  settleStart?: number
  settleEnd?: number
  mobileSettleStart?: number
  mobileSettleEnd?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function getViewportWidth() {
  return typeof window === 'undefined' ? 1440 : window.innerWidth || 1440
}

function getViewportHeight() {
  return typeof window === 'undefined' ? 900 : window.innerHeight || 900
}

function getAxis(direction: RevealDirection | VisualMotionDirection, distance: number) {
  return {
    x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
    y: direction === 'up' ? distance : 0,
  }
}

function createRafUpdater(callback: () => void) {
  let frame = 0

  const requestUpdate = () => {
    if (frame) return
    frame = window.requestAnimationFrame(() => {
      frame = 0
      callback()
    })
  }

  const cancel = () => {
    if (frame) {
      window.cancelAnimationFrame(frame)
      frame = 0
    }
  }

  return { requestUpdate, cancel }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduced
}

export function Reveal({
  as: Component = 'div',
  children,
  className,
  direction = 'up',
  mobileDirection,
  delay = 0,
  duration = 680,
  distance = 24,
  threshold = 0.2,
  scale = 0.992,
  baseOpacity = 0.68,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (reducedMotion) {
      node.style.setProperty('--kc-reveal-current-opacity', '1')
      node.style.setProperty('--kc-reveal-current-x', '0px')
      node.style.setProperty('--kc-reveal-current-y', '0px')
      node.style.setProperty('--kc-reveal-current-scale', '1')
      return
    }

    const revealWindow = threshold >= 0.3 ? 0.56 : 0.68

    const updateNode = () => {
      const rect = node.getBoundingClientRect()
      const viewportHeight = getViewportHeight()
      const viewportWidth = getViewportWidth()
      const activeDirection = viewportWidth < 768 && mobileDirection ? mobileDirection : direction
      const axis = getAxis(activeDirection, distance)
      const start = viewportHeight * 0.94
      const end = viewportHeight * (1 - revealWindow)
      const rawProgress = (start - rect.top) / Math.max(start - end + rect.height * 0.12, 1)
      const delayedProgress = clamp(rawProgress - delay / 900, 0, 1)
      const opacity = baseOpacity + delayedProgress * (1 - baseOpacity)
      const currentX = axis.x * (1 - delayedProgress)
      const currentY = axis.y * (1 - delayedProgress)
      const currentScale = scale + (1 - scale) * delayedProgress

      node.style.setProperty('--kc-reveal-current-opacity', opacity.toFixed(3))
      node.style.setProperty('--kc-reveal-current-x', `${currentX.toFixed(2)}px`)
      node.style.setProperty('--kc-reveal-current-y', `${currentY.toFixed(2)}px`)
      node.style.setProperty('--kc-reveal-current-scale', currentScale.toFixed(4))
    }

    const { requestUpdate, cancel } = createRafUpdater(updateNode)

    updateNode()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      cancel()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [baseOpacity, delay, direction, distance, mobileDirection, reducedMotion, scale, threshold])

  const initialDirection = typeof window !== 'undefined' && window.innerWidth < 768 && mobileDirection ? mobileDirection : direction
  const initialAxis = getAxis(initialDirection, distance)

  const style = {
    '--kc-reveal-duration': `${duration}ms`,
    '--kc-reveal-current-opacity': reducedMotion ? '1' : `${baseOpacity}`,
    '--kc-reveal-current-x': reducedMotion ? '0px' : `${initialAxis.x}px`,
    '--kc-reveal-current-y': reducedMotion ? '0px' : `${initialAxis.y}px`,
    '--kc-reveal-current-scale': reducedMotion ? '1' : `${scale}`,
  } as CSSProperties

  return (
    <Component ref={ref} style={style} className={['kc-reveal', className ?? ''].join(' ').trim()}>
      {children}
    </Component>
  )
}

export function HeroStaggerItem({
  as: Component = 'div',
  children,
  className,
  delay = 0,
  duration = 700,
  direction = 'up',
  distance = 20,
}: HeroStaggerItemProps) {
  const style = {
    '--kc-reveal-delay': `${delay}ms`,
    '--kc-reveal-duration': `${duration}ms`,
    '--kc-hero-distance': `${distance}px`,
  } as CSSProperties

  return (
    <Component style={style} className={['kc-hero-reveal', `kc-hero-reveal--${direction}`, className ?? ''].join(' ').trim()}>
      {children}
    </Component>
  )
}

export function VisualMotion({
  as: Component = 'div',
  children,
  className,
  delay = 0,
  duration = 760,
  distance = 12,
  direction = 'up',
  drift = 0,
  parallax = 10,
  mobileParallax = 4,
  scale = 0.985,
  scrollScale = 0.03,
  mobileScrollScale = 0.015,
  baseOpacity = 0.9,
  settleStart = 1.04,
  settleEnd = 0.28,
  mobileSettleStart = 0.98,
  mobileSettleEnd = 0.42,
}: VisualMotionProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const initialAxis = getAxis(direction, distance)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (reducedMotion) {
      node.style.setProperty('--kc-visual-current-opacity', '1')
      node.style.setProperty('--kc-visual-current-x', '0px')
      node.style.setProperty('--kc-visual-current-y', '0px')
      node.style.setProperty('--kc-visual-current-scale', '1')
      return
    }

    const axis = getAxis(direction, distance)

    const updateVisual = () => {
      const rect = node.getBoundingClientRect()
      const viewportHeight = getViewportHeight()
      const viewportWidth = getViewportWidth()
      const isMobile = viewportWidth < 768
      const currentSettleStart = viewportHeight * (isMobile ? mobileSettleStart : settleStart)
      const currentSettleEnd = viewportHeight * (isMobile ? mobileSettleEnd : settleEnd)
      const settleRaw = (currentSettleStart - rect.top) / Math.max(currentSettleStart - currentSettleEnd + rect.height * 0.18, 1)
      const settle = clamp(settleRaw - delay / 1100, 0, 1)
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = viewportHeight * 0.5
      const progress = (viewportCenter - elementCenter) / viewportHeight
      const intensity = isMobile ? mobileParallax : parallax
      const shiftY = clamp(progress * intensity, -intensity, intensity)
      const shiftX =
        direction === 'up' ? 0 : clamp(progress * intensity * 0.28, -intensity * 0.28, intensity * 0.28)
      const scaleIntensity = isMobile ? mobileScrollScale : scrollScale
      const settleScale = scale + (1 - scale) * settle
      const scrollAdjustment = clamp(Math.abs(progress) * scaleIntensity, 0, scaleIntensity)
      const nextScale = settleScale - scrollAdjustment
      const currentX = axis.x * (1 - settle) + shiftX
      const currentY = axis.y * (1 - settle) + shiftY
      const opacity = baseOpacity + settle * (1 - baseOpacity)

      node.style.setProperty('--kc-visual-current-opacity', opacity.toFixed(3))
      node.style.setProperty('--kc-visual-current-x', `${currentX.toFixed(2)}px`)
      node.style.setProperty('--kc-visual-current-y', `${currentY.toFixed(2)}px`)
      node.style.setProperty('--kc-visual-current-scale', nextScale.toFixed(4))
    }

    const { requestUpdate, cancel } = createRafUpdater(updateVisual)

    updateVisual()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      cancel()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [
    baseOpacity,
    delay,
    direction,
    distance,
    mobileParallax,
    mobileScrollScale,
    mobileSettleEnd,
    mobileSettleStart,
    parallax,
    reducedMotion,
    scale,
    scrollScale,
    settleEnd,
    settleStart,
  ])

  const style = {
    '--kc-motion-duration': `${duration}ms`,
    '--kc-visual-drift': `${drift}px`,
    '--kc-visual-current-opacity': reducedMotion ? '1' : `${baseOpacity}`,
    '--kc-visual-current-x': reducedMotion ? '0px' : `${initialAxis.x}px`,
    '--kc-visual-current-y': reducedMotion ? '0px' : `${initialAxis.y}px`,
    '--kc-visual-current-scale': reducedMotion ? '1' : `${scale}`,
  } as CSSProperties

  return (
    <Component ref={ref} style={style} className={['kc-visual', className ?? ''].join(' ').trim()}>
      <div className={drift > 0 ? 'kc-visual__inner kc-visual__inner--drift' : 'kc-visual__inner'}>{children}</div>
    </Component>
  )
}
