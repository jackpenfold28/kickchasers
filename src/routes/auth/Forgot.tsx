import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { authCallbackUrl } from '@/lib/siteUrl'

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
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
        <h1 className="h1">Forgot password</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {err && <div className="text-sm text-red-400">{err}</div>}
        {msg && <div className="text-sm text-emerald-400">{msg}</div>}
        <div className="text-sm">
          <Link to="/sign-in" className="underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
