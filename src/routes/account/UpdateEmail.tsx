import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

export default function UpdateEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    setMsg('Email update requested. Check your inbox to confirm the new address.')
  }

  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="h1">Update email</h1>
        <div className="card p-4 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="New email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {err && <div className="text-sm text-red-400">{err}</div>}
            {msg && <div className="text-sm text-emerald-400">{msg}</div>}
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating…' : 'Update email'}
            </button>
          </form>
          <div className="text-sm">
            <Link to="/profile" className="underline">
              Back to profile
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
