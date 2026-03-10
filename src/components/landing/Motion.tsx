import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

type RevealDirection = 'up' | 'left' | 'right'

type RevealProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  direction?: RevealDirection
  delay?: number
  duration?: number
  distance?: number
  threshold?: number
}

type HeroStaggerItemProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
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
  delay = 0,
  duration = 680,
  distance = 24,
  threshold = 0.2,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin: '0px 0px -8% 0px',
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [reducedMotion, threshold])

  const style = {
    '--kc-reveal-delay': `${delay}ms`,
    '--kc-reveal-duration': `${duration}ms`,
    '--kc-reveal-distance': `${distance}px`,
  } as CSSProperties

  return (
    <Component
      ref={ref}
      style={style}
      className={[
        'kc-reveal',
        `kc-reveal--${direction}`,
        isVisible ? 'kc-reveal--in' : '',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
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
}: HeroStaggerItemProps) {
  const style = {
    '--kc-reveal-delay': `${delay}ms`,
    '--kc-reveal-duration': `${duration}ms`,
  } as CSSProperties

  return (
    <Component style={style} className={['kc-hero-reveal', className ?? ''].join(' ').trim()}>
      {children}
    </Component>
  )
}
