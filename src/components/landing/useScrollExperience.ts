import { useEffect, useRef } from 'react'

/** Native scroll timelines follow the gesture; keyboard and unsupported browsers stay static. */
export function useScrollExperience() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = root.current
    if (!element || !CSS.supports('animation-timeline', 'view()')) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const enable = () => { if (!preference.matches && !element.hasAttribute('data-scroll-motion')) element.setAttribute('data-scroll-motion', '') }
    const disable = () => element.removeAttribute('data-scroll-motion')
    const keyboard = (event: KeyboardEvent) => {
      if (['Tab', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Enter', 'Escape'].includes(event.key)) disable()
    }
    // Opt in only after a scrolling gesture, so initial content and anchor destinations are visible.
    window.addEventListener('wheel', enable, { passive: true })
    window.addEventListener('touchstart', enable, { passive: true })
    window.addEventListener('keydown', keyboard)
    preference.addEventListener('change', disable)
    return () => {
      disable()
      window.removeEventListener('wheel', enable)
      window.removeEventListener('touchstart', enable)
      window.removeEventListener('keydown', keyboard)
      preference.removeEventListener('change', disable)
    }
  }, [])
  return root
}
