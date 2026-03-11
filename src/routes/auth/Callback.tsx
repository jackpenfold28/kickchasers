import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmailOtpType } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

function getParam(name: string) {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return search.get(name) ?? hash.get(name)
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [recoveryFlow, setRecoveryFlow] = useState(false)

  useEffect(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true })
      }
    })

    ;(async () => {
      try {
        const type = getParam('type')
        const tokenHash = getParam('token_hash')
        const code = getParam('code')
        const accessToken = getParam('access_token')
        const refreshToken = getParam('refresh_token')
        const isRecovery = type === 'recovery'
        setRecoveryFlow(isRecovery)

        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (setErr) throw setErr
        } else if (tokenHash && type) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })
          if (verifyErr) throw verifyErr
        } else if (code) {
          const { error: codeErr } = await supabase.auth.exchangeCodeForSession(window.location.href)
          if (codeErr) throw codeErr
        } else {
          throw new Error('No auth tokens found in callback URL.')
        }

        navigate(isRecovery ? '/reset-password' : '/', { replace: true })
      } catch (err) {
        console.error('Auth callback failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed.')
      }
    })()

    return () => authSub.subscription.unsubscribe()
  }, [navigate])

  return (
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6 space-y-3">
        <p className="text-lg font-semibold">
          {recoveryFlow ? 'Preparing password reset…' : 'Finishing your sign in…'}
        </p>
        {!error && <p className="text-sm text-white/70">Please wait a moment.</p>}
        {error && (
          <>
            <p className="text-sm text-red-400">{error}</p>
            <div className="text-sm">
              <Link to={recoveryFlow ? '/forgot' : '/sign-in'} className="underline">
                {recoveryFlow ? 'Request new reset link' : 'Back to sign in'}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
