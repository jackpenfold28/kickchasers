import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'
import {
  AuthShell,
  authFieldClassName,
  authLinkClassName,
  authMessageClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/AuthShell'

export default function Forgot() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackUrl,
    })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    setMsg("If that email exists, you'll receive reset instructions.")
  }

  return (
    <AuthShell
      title="Forgot Password"
      eyebrow="Account Recovery"
      description="Request a secure reset link and return to your account without leaving the KickChasers experience."
      footer={
        <Link to="/sign-in" className={authLinkClassName}>
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Email</span>
          <input
            className={authFieldClassName}
            type="email"
            placeholder="player@kickchasers.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <button className={authPrimaryButtonClassName} disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      {err ? <div className={`${authMessageClassName.error} mt-4`}>{err}</div> : null}
      {msg ? <div className={`${authMessageClassName.info} mt-4`}>{msg}</div> : null}
    </AuthShell>
  )
}
