import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'
import { supabase } from '@/lib/supabase'
import { getProfileCompletion, isProfileComplete } from '@/lib/auth'
import { setClubColours } from '@/lib/theme'
import { buildOnboardingPath, buildSignInPath, getSafeReturnPath } from '@/lib/canonical/route-safety'

const PUBLIC_ROUTES = new Set([
  '/',
  '/how-it-works',
  '/terms',
  '/privacy',
  '/community-guidelines',
  '/support',
  '/sign-in',
  '/login',
  '/sign-up',
  '/signup',
  '/register',
  '/check-email',
  '/forgot',
  '/reset-password',
  '/landing',
])

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname)
}

function isAuthEntryRoute(pathname: string) {
  return pathname === '/sign-in' || pathname === '/login' || pathname === '/sign-up' || pathname === '/signup' || pathname === '/register'
}

function isOnboardingAllowedRoute(pathname: string) {
  return pathname === '/onboarding' || pathname === '/request-league' || pathname === '/request-club'
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const hasResolvedInitialGate = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const html = document.documentElement
    if (saved === 'light') {
      html.classList.remove('dark')
      html.classList.add('light')
    } else {
      html.classList.add('dark')
      html.classList.remove('light')
    }
    setClubColours(
      localStorage.getItem('club_primary') || '#003C77',
      localStorage.getItem('club_secondary') || '#ffffff'
    )
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const pathname = location.pathname
      const publicRoute = isPublicRoute(pathname)
      const onCheckEmailRoute = pathname === '/check-email'
      const onOnboardingRoute = pathname === '/onboarding'
      const onboardingAllowedRoute = isOnboardingAllowedRoute(pathname)
      const isEditOnboarding = onOnboardingRoute && new URLSearchParams(location.search).get('mode') === 'edit'

      const { data: sessionData } = await supabase.auth.getSession()
      if (cancelled) return
      const session = sessionData.session

      if (!session) {
        if (!publicRoute) {
          navigate(buildSignInPath(`${pathname}${location.search || ''}`), { replace: true })
        }
        if (!cancelled) {
          hasResolvedInitialGate.current = true
          setChecking(false)
        }
        return
      }

      const verified = Boolean(session.user.email_confirmed_at)
      if (!verified) {
        if (!onCheckEmailRoute && pathname !== '/reset-password') {
          navigate('/check-email', { replace: true })
        }
        if (!cancelled) {
          hasResolvedInitialGate.current = true
          setChecking(false)
        }
        return
      }

      const profile = await getProfileCompletion(session.user.id)
      if (cancelled) return
      const complete = isProfileComplete(profile)

      const shouldLeavePublicEntry =
        isAuthEntryRoute(pathname) || onCheckEmailRoute || pathname === '/' || pathname === '/landing'

      if (shouldLeavePublicEntry) {
        const requested = isAuthEntryRoute(pathname)
          ? getSafeReturnPath(new URLSearchParams(location.search).get('redirect'))
          : '/dashboard'
        navigate(complete ? requested : buildOnboardingPath(requested), { replace: true })
        if (!cancelled) {
          hasResolvedInitialGate.current = true
          setChecking(false)
        }
        return
      }

      if (!complete && !onboardingAllowedRoute && !publicRoute && pathname !== '/reset-password') {
        const returnPath = `${pathname}${location.search || ''}`
        navigate(pathname.startsWith('/game/') ? buildOnboardingPath(returnPath) : '/onboarding', { replace: true })
        if (!cancelled) {
          hasResolvedInitialGate.current = true
          setChecking(false)
        }
        return
      }

      if (complete && onOnboardingRoute && !isEditOnboarding) {
        navigate('/dashboard', { replace: true })
        if (!cancelled) {
          hasResolvedInitialGate.current = true
          setChecking(false)
        }
        return
      }

      if (!cancelled) {
        hasResolvedInitialGate.current = true
        setChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!hasResolvedInitialGate.current) return
    setChecking(false)
  }, [location.pathname, location.search])

  if (checking) {
    return <main className="min-h-screen p-6 app-bg">{location.pathname === '/dashboard' ? <div className="mx-auto max-w-[1440px]"><DashboardSkeleton /></div> : 'Checking session…'}</main>
  }

  return <Outlet />
}
