import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export default function UpdateEmailPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const sessionEmail = data.session?.user?.email || ''
      if (!cancelled) {
        setInitialEmail(sessionEmail)
        setEmail(sessionEmail)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const next = email.trim()
    if (!next) {
      setError('Email address cannot be blank.')
      return
    }
    if (!EMAIL_REGEX.test(next)) {
      setError('Enter a valid email address.')
      return
    }
    if (next.toLowerCase() === initialEmail.toLowerCase()) {
      setError('That is already your current email.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase.auth.updateUser(
      { email: next },
      {
        emailRedirectTo: authCallbackUrl,
      }
    )

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setInitialEmail(next)
    setMessage('Check your inbox to confirm the email change.')
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading email settings…</main>
  }

  return (
    <PortalCard title="Update Email" subtitle="Your old email remains active until the new one is verified">
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Email Address</span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="coach@club.com" />
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}

        <div className="flex gap-2">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Sending…' : 'Send Confirmation'}
          </button>
          <Link className="btn btn-secondary" to="/settings">
            Back to Settings
          </Link>
        </div>
      </form>
    </PortalCard>
  )
}
