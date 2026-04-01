import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AuthShell, authLinkClassName, authMessageClassName, authPrimaryButtonClassName } from '@/components/auth/AuthShell'

export default function CheckEmail() {
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isNewAccount = query.get('new') === '1'

  async function refreshSession() {
    setBusy(true)
    setError(null)
    const { data, error: refreshError } = await supabase.auth.refreshSession()
    setBusy(false)

    if (refreshError) {
      setError(refreshError.message)
      return
    }

    if (data.session?.user?.email_confirmed_at) {
      navigate('/', { replace: true })
      return
    }

    setError('Your email is still unverified. Check your inbox, then try again.')
  }

  return (
    <AuthShell
      title="Verify Your Email"
      eyebrow="KickChasers Access"
      description={
        isNewAccount
          ? 'Your account has been created. Go to your email, open the KickChasers verification message, and authenticate your account before returning here.'
          : 'We’ve sent you a verification email. Confirm it, then refresh your session to continue into KickChasers.'
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/sign-in" className={authLinkClassName}>
            Use a different account
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {isNewAccount ? (
          <div className={authMessageClassName.info}>
            Account created. Check your inbox, verify the email, then return and refresh your session.
          </div>
        ) : null}
        <button className={authPrimaryButtonClassName} onClick={() => void refreshSession()} disabled={busy}>
          {busy ? 'Checking…' : "I've Verified My Email"}
        </button>
        {error ? <div className={authMessageClassName.error}>{error}</div> : null}
      </div>
    </AuthShell>
  )
}
