import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'
import {
  AuthShell,
  authFieldClassName,
  authLinkClassName,
  authMessageClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/AuthShell'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setInfo(null)
    if (!email.trim() || !password.trim()) {
      setErr('Please enter an email and password.')
      return
    }
    if (password !== confirmPassword) {
      setErr('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authCallbackUrl },
    })
    setBusy(false)

    if (error) {
      setErr(error.message)
      return
    }

    setInfo('If verification is required, confirm your email and continue.')
    navigate('/onboarding?new=1', { replace: true })
  }

  return (
    <AuthShell
      title="Create Account"
      eyebrow="KickChasers Access"
      description="Set up your KickChasers account and step straight into live tracking, player development, and competition-ready insights."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-500">Already set up?</span>
          <Link to="/sign-in" className={authLinkClassName}>
            Log in instead
          </Link>
        </div>
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Password</span>
          <input
            className={authFieldClassName}
            placeholder="Create a password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">Confirm password</span>
          <input
            className={authFieldClassName}
            placeholder="Confirm your password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {err ? <div className={authMessageClassName.error}>{err}</div> : null}
        {info ? <div className={authMessageClassName.info}>{info}</div> : null}

        <button className={authPrimaryButtonClassName} disabled={busy}>
          {busy ? 'Creating…' : 'Create Account'}
        </button>
      </form>
    </AuthShell>
  )
}
