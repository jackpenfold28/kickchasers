import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase sets the session from the magic link; just move on.
    supabase.auth.getSession().finally(() => {
      navigate('/onboarding?new=1', { replace: true })
    })
  }, [navigate])

  return <div className="p-6">Finishing sign-in…</div>
}