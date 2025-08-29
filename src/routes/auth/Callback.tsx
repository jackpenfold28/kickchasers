import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try {
        // Exchange the code in the URL for a session (supabase-js v2)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) {
          console.error('exchangeCodeForSession error:', error)
          navigate('/login', { replace: true })
          return
        }

        // On success, route to onboarding
        navigate('/onboarding?new=1', { replace: true })
      } catch (err) {
        console.error('Unexpected error in callback:', err)
        navigate('/login', { replace: true })
      }
    })()
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="rounded-md bg-gray-800 px-6 py-4 shadow-lg">
        <p className="text-lg font-semibold">Signing you in…</p>
        <p className="mt-2 text-sm text-gray-400">Please wait a moment.</p>
      </div>
    </div>
  )
}