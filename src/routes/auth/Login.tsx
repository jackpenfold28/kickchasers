import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'

type OAuthProvider = Extract<Provider, 'google' | 'facebook' | 'apple'>

const PROVIDERS: Array<{ provider: OAuthProvider; label: string }> = [
  { provider: 'google', label: 'Continue with Google' },
  { provider: 'facebook', label: 'Continue with Facebook' },
  { provider: 'apple', label: 'Continue with Apple' },
]

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
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="flex justify-center items-center gap-6">
        <div className="flex justify-center items-center">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers logo"
            className="w-[32rem] h-auto drop-shadow-lg"
          />
        </div>

        <form onSubmit={onSignIn} className="form-card w-full max-w-md space-y-4">
          <h1 className="h1">Sign in</h1>

          <div className="space-y-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.provider}
                type="button"
                onClick={() => onProvider(p.provider)}
                disabled={busy}
                className={`w-full rounded-2xl border px-5 py-3.5 text-base font-semibold transition disabled:opacity-65 ${
                  p.provider === 'google'
                    ? 'border-slate-200 bg-white text-[#0f172a] shadow-[0_6px_20px_rgba(255,255,255,0.15)]'
                    : p.provider === 'facebook'
                      ? 'border-[#2f86f3] bg-[#2b78e0] text-white shadow-[0_8px_22px_rgba(43,120,224,0.35)]'
                      : 'border-white/70 bg-black text-white shadow-[0_8px_22px_rgba(0,0,0,0.45)]'
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  {p.provider === 'google' ? (
                    <img
                      src="/assets/icons/google-color-svgrepo-com.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                  ) : p.provider === 'facebook' ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/80 text-xs font-bold leading-none">
                      f
                    </span>
                  ) : (
                    <span className="text-base font-bold leading-none">A</span>
                  )}
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-emerald-400/35" />
            <span className="text-sm tracking-wide text-white/60">OR</span>
            <div className="h-px flex-1 bg-emerald-400/35" />
          </div>

          {!showEmail ? (
            <button
              type="button"
              className="w-full rounded-[1.7rem] bg-[#3DF087] px-6 py-4 text-[1.1rem] font-semibold text-[#041225] transition hover:brightness-105"
              onClick={() => setShowEmail(true)}
              disabled={busy}
            >
              Sign in with email
            </button>
          ) : (
            <div className="space-y-3">
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <div className="relative">
                <input
                  className="input pr-24"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn px-2 py-1"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <button className="btn btn-primary w-full" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          )}

          {err && <div className="text-sm text-red-400">{err}</div>}

          <div className="flex justify-between text-sm">
            <Link className="underline" to="/sign-up">
              Create account
            </Link>
            <Link className="underline" to="/forgot">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
