import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'
import {
  AuthDivider,
  AuthShell,
  authFieldClassName,
  authInlineButtonClassName,
  authLinkClassName,
  authMessageClassName,
  authPrimaryButtonClassName,
} from '@/components/auth/AuthShell'

type OAuthProvider = Extract<Provider, 'google' | 'facebook' | 'apple'>

const PROVIDERS: Array<{ provider: OAuthProvider; label: string }> = [
  { provider: 'google', label: 'Continue with Google' },
  { provider: 'apple', label: 'Continue with Apple' },
]

const providerButtonClassName = {
  google:
    'flex min-h-[52px] w-full items-center rounded-2xl border border-[#dadce0] bg-white px-4 text-[15px] font-medium text-[#111827] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/35 disabled:cursor-not-allowed disabled:opacity-65',
  apple:
    'flex min-h-[52px] w-full items-center rounded-2xl border border-black/90 bg-black px-4 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.22)] transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]/35 disabled:cursor-not-allowed disabled:opacity-65',
} as const

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-current">
      <path d="M15.87 12.93c.02 2.3 2.02 3.07 2.04 3.08-.02.05-.32 1.11-1.06 2.21-.64.95-1.3 1.9-2.35 1.92-1.03.02-1.36-.61-2.54-.61-1.17 0-1.54.6-2.51.63-1 .04-1.77-1-2.42-1.94-1.33-1.92-2.34-5.42-.98-7.78.67-1.17 1.88-1.91 3.19-1.93.99-.02 1.93.67 2.54.67.61 0 1.76-.83 2.97-.71.51.02 1.95.21 2.87 1.56-.07.04-1.72 1-1.71 2.9ZM14.81 4.79c.54-.65.91-1.55.81-2.45-.78.03-1.72.52-2.28 1.18-.5.58-.94 1.5-.82 2.38.87.07 1.75-.44 2.29-1.11Z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [qp] = useSearchParams()
  const redirectTo = qp.get('redirect') || '/dashboard'

  const [showEmail, setShowEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onProvider(provider: OAuthProvider) {
    setErr(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authCallbackUrl },
    })
    setBusy(false)
    if (error) setErr(error.message)
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthShell
      title="Log In"
      eyebrow="KickChasers Access"
      description="Return to your match data, live tracking workflow, and performance insights with the same premium KickChasers experience."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className={authLinkClassName} to="/sign-up">
            Create account
          </Link>
          <Link className={authLinkClassName} to="/forgot">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form onSubmit={onSignIn} className="space-y-5">
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.provider}
              type="button"
              onClick={() => onProvider(p.provider)}
              disabled={busy}
              className={providerButtonClassName[p.provider]}
            >
              <span className="grid w-full grid-cols-[20px_1fr_20px] items-center gap-3">
                {p.provider === 'google' ? (
                  <img
                    src="/assets/icons/google-color-svgrepo-com.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                ) : (
                  <AppleIcon />
                )}
                <span className="text-center text-[15px] font-medium text-inherit">{p.label}</span>
                <span aria-hidden="true" className="h-5 w-5" />
              </span>
            </button>
          ))}
        </div>

        <AuthDivider label="Or" />

        {!showEmail ? (
          <button
            type="button"
            className={authPrimaryButtonClassName}
            onClick={() => setShowEmail(true)}
            disabled={busy}
          >
            Sign in with email
          </button>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                className={authFieldClassName}
                type="email"
                placeholder="player@kickchasers.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Password</span>
              <div className="relative">
                <input
                  className={`${authFieldClassName} pr-24`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${authInlineButtonClassName}`}
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button className={authPrimaryButtonClassName} disabled={busy}>
              {busy ? 'Signing in…' : 'Log In'}
            </button>
          </div>
        )}

        {err ? <div className={authMessageClassName.error}>{err}</div> : null}
      </form>
    </AuthShell>
  )
}
