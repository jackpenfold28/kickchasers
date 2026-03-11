import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getProfileCompletion, isProfileComplete } from '@/lib/auth'
import { setClubColours } from '@/lib/theme'

const UNAUTH_ROUTES = new Set([
  '/',
  '/terms',
  '/privacy',
  '/community-guidelines',
  '/support',
  '/sign-in',
  '/login',
  '/sign-up',
  '/signup',
  '/register',
  '/forgot',
  '/reset-password',
  '/landing',
])

function isUnauthRoute(pathname: string) {
  return UNAUTH_ROUTES.has(pathname)
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [needsEmailVerify, setNeedsEmailVerify] = useState(false)

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
      setChecking(true)
      const pathname = location.pathname
      const onUnauthRoute = isUnauthRoute(pathname)

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session) {
        setNeedsEmailVerify(false)
        if (!onUnauthRoute) {
          const redirect = `${pathname}${location.search || ''}`
          navigate(`/sign-in?redirect=${encodeURIComponent(redirect)}`, { replace: true })
        }
        if (!cancelled) setChecking(false)
        return
      }

      setNeedsEmailVerify(!session.user.email_confirmed_at)
      const profile = await getProfileCompletion(session.user.id)
      const complete = isProfileComplete(profile)

      if (onUnauthRoute && pathname !== '/reset-password') {
        navigate(complete ? '/dashboard' : '/onboarding?new=1', { replace: true })
        if (!cancelled) setChecking(false)
        return
      }

      if (!complete && pathname !== '/onboarding' && pathname !== '/reset-password') {
        navigate('/onboarding?new=1', { replace: true })
        if (!cancelled) setChecking(false)
        return
      }

      if (!cancelled) setChecking(false)
    })()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search, navigate])

  if (checking) {
    return <main className="min-h-screen p-6 app-bg">Checking session…</main>
  }

  return (
    <>
      {needsEmailVerify && !isUnauthRoute(location.pathname) && (
        <div className="sticky top-0 z-50 border-b border-amber-400/35 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          Verify your email to secure your account. Then refresh this page.
        </div>
      )}
      <Outlet />
    </>
  )
}
