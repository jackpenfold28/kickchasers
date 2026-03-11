import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
    })()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    if (!hasSession) {
      setErr('Recovery session is missing. Request a new reset link.')
      return
    }
    if (!password.trim()) {
      setErr('Enter a new password.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }

    setMsg('Password updated. Redirecting…')
    setTimeout(() => navigate('/', { replace: true }), 700)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
        <h1 className="h1">Reset password</h1>
        {!hasSession && (
          <div className="rounded-md border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            This reset link is invalid or expired.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            placeholder="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {err && <div className="text-sm text-red-400">{err}</div>}
          {msg && <div className="text-sm text-emerald-400">{msg}</div>}
          <button className="btn btn-primary w-full" disabled={loading || !hasSession}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
        <div className="flex justify-between text-sm">
          <Link to="/forgot" className="underline">
            Request new reset link
          </Link>
          <Link to="/sign-in" className="underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
