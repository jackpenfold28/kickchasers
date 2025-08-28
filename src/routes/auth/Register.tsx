import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const nav = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })

    if (error) {
      setError(error.message)
      return
    }

    // Always send to onboarding. If no session yet (email confirmation flow), append verify flag.
    if (data.session) {
      nav('/onboarding?new=1', { replace: true })
    } else {
      nav('/onboarding?new=1&verify=1', { replace: true })
    }
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
    </main>
  )
}