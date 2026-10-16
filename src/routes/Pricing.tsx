import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PublicSiteShell, type PublicNavItem } from '@/components/landing/PublicSiteShell'
import { useScrollExperience } from '@/components/landing/useScrollExperience'
import { PricingSection } from '@/components/landing/PricingSection'
import '@/components/landing/landing.css'

const navigation: PublicNavItem[] = [
 { label:'The product', href:'#features', id:'features', type:'hash' },
 { label:'How it works', href:'/how-it-works', id:'how-it-works', type:'route' },
 { label:'Game cards', href:'#game-cards', id:'game-cards', type:'hash' },
 { label:'Pricing', href:'/pricing', id:'pricing', type:'route' },
]
export default function Pricing() {
 const { hash } = useLocation()
 const scrollRoot = useScrollExperience()
 useEffect(() => {
  if (hash !== '#compare') return
  const frame = requestAnimationFrame(() => document.getElementById('compare')?.scrollIntoView({block:'start'}))
  return () => cancelAnimationFrame(frame)
 }, [hash])
 return <PublicSiteShell variant="editorial" navItems={navigation} activeNavId="pricing" useLandingAnchors><div ref={scrollRoot} id="landing-content" className="lp-page lp-pricing-page lp-scroll-experience" tabIndex={-1}><PricingSection detailed/></div></PublicSiteShell>
}
