import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { onboardingUrl } from '@/lib/siteUrl'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showVerify, setShowVerify] = useState(false)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: onboardingUrl }
    })

    if (error) {
      setError(error.message)
      return
    }

    // Do not navigate; show a verification dialog instead.
    setInfo('Check your email and confirm to complete setup.')
    setShowVerify(true)
    setPassword('')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="flex justify-center items-center gap-6">
        {/* Brand logo (left) */}
        <div className="flex justify-center items-center">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers logo"
            className="w-[26rem] h-auto drop-shadow-lg"
          />
        </div>
        {/* Register card (right) */}
        <div className="w-full max-w-md">
          <div className="p-6 space-y-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
            <h1 className="h1">Create account</h1>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {info && <div className="text-emerald-400 text-sm">{info}</div>}
              <button className="btn btn-primary w-full">Sign up</button>
            </form>
            <div className="text-sm">
              <Link to="/" className="underline">Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-md rounded-lg border border-white/10 bg-white/10 backdrop-blur-md p-6 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_2px_rgba(16,185,129,0.7)]" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Verify your email</h2>
                <p className="mt-1 text-sm text-white/80">
                  We’ve sent a confirmation link to <span className="font-medium">{email}</span>.
                  Click the link to verify your account, then you’ll be taken to onboarding.
                </p>
                <p className="mt-3 text-xs text-white/60">
                  Didn’t receive it? Check your spam folder or try again.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowVerify(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSubmit(new Event('submit') as unknown as React.FormEvent)}
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}