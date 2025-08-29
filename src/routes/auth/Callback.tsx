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
        }
      } finally {
        // Route to onboarding by default (works for sign-up and magic link)
        navigate('/onboarding?new=1', { replace: true })
      }
    })()
  }, [navigate])

  return <div className="p-6">Finishing sign-in…</div>
}