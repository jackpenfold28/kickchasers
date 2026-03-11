import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { authCallbackUrl } from '@/lib/siteUrl'

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
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="flex justify-center items-center gap-6">
        <div className="flex justify-center items-center">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers logo"
            className="w-[26rem] h-auto drop-shadow-lg"
          />
        </div>
        <div className="w-full max-w-md">
          <div className="p-6 space-y-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
            <h1 className="h1">Create account</h1>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {err && <div className="text-sm text-red-400">{err}</div>}
              {info && <div className="text-sm text-emerald-400">{info}</div>}
              <button className="btn btn-primary w-full" disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </button>
            </form>
            <div className="text-sm">
              <Link to="/sign-in" className="underline">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
