import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  KeyRound,
  Mail,
  Shield,
  UserRoundX,
  UserRoundCog,
  AlertTriangle,
  LogOut,
} from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { supabase } from '@/lib/supabase'
import { authCallbackUrl } from '@/lib/siteUrl'
import { Input } from '@/components/ui/Input'

type SessionSummary = {
  userId: string
  email: string | null
}

export default function SettingsPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [session, setSession] = useState<SessionSummary | null>(null)
  const [blockedCount, setBlockedCount] = useState<number | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (cancelled) return

        setSession({ userId: user.id, email: user.email || null })

        const { count, error: blocksError } = await supabase
          .from('user_blocks')
          .select('blocked_user_id', { count: 'exact', head: true })
          .eq('blocker_user_id', user.id)

        if (blocksError) throw blocksError

        if (!cancelled) {
          setBlockedCount(count ?? 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load settings.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const deleteBlocked = useMemo(() => deleteText.trim() === 'DELETE', [deleteText])

  async function sendPasswordReset() {
    setError(null)
    setMessage(null)

    if (!session?.email) {
      setError('No email found for this account.')
      return
    }

    setWorking(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(session.email, {
      redirectTo: authCallbackUrl,
    })
    setWorking(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage('Password reset email sent. Check your inbox.')
  }

  async function signOut() {
    setWorking(true)
    await supabase.auth.signOut()
    setWorking(false)
    navigate('/sign-in', { replace: true })
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!deleteBlocked) {
      setError('Type DELETE to confirm account deletion.')
      return
    }

    setWorking(true)

    const { data, error: deleteError } = await supabase.functions.invoke('delete-account', {
      body: {},
    })

    if (deleteError || !data?.ok) {
      setWorking(false)
      setError(deleteError?.message || 'Account deletion failed. Try again.')
      return
    }

    await supabase.auth.signOut()
    setWorking(false)
    navigate('/sign-in', { replace: true })
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading settings…</main>
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <PortalCard title="Account" subtitle="Email and session actions">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-300">
            <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
            <p className="mt-1 text-white">{session?.email || 'Unknown'}</p>
          </div>

          <div className="grid gap-2">
            <Link to="/settings/update-email" className="btn btn-secondary inline-flex items-center gap-2 justify-start">
              <Mail className="h-4 w-4" />
              Update Email
            </Link>
            <button className="btn btn-secondary inline-flex items-center gap-2 justify-start" onClick={signOut} disabled={working}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </PortalCard>

      <PortalCard title="Security" subtitle="Password and account protections">
        <div className="space-y-3">
          <button className="btn btn-secondary inline-flex w-full items-center justify-start gap-2" onClick={sendPasswordReset} disabled={working}>
            <KeyRound className="h-4 w-4" />
            Send Password Reset Email
          </button>
          <p className="text-xs text-slate-400">A secure reset link is sent to your current account email.</p>
        </div>
      </PortalCard>

      <PortalCard title="Roles" subtitle="Request player, coach, and tracker permissions">
        <div className="space-y-3">
          <Link to="/settings/roles" className="btn btn-secondary inline-flex w-full items-center justify-start gap-2">
            <Shield className="h-4 w-4" />
            Manage Role Requests
          </Link>
        </div>
      </PortalCard>

      <PortalCard title="Blocked Users" subtitle="Manage who is blocked from interacting with you">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <p>
              Blocked users: <span className="font-semibold text-white">{blockedCount ?? '-'}</span>
            </p>
          </div>
          <Link to="/settings/blocked-users" className="btn btn-secondary inline-flex w-full items-center justify-start gap-2">
            <UserRoundX className="h-4 w-4" />
            Open Blocked Users
          </Link>
        </div>
      </PortalCard>

      <PortalCard title="Profile" subtitle="Edit handle, avatar, and onboarding fields" className="xl:col-span-2">
        <Link to="/profile" className="btn btn-secondary inline-flex items-center gap-2">
          <UserRoundCog className="h-4 w-4" />
          Open Profile
        </Link>
      </PortalCard>

      <PortalCard title="Danger Zone" subtitle="Destructive account actions" className="xl:col-span-2">
        <button
          className="btn inline-flex items-center gap-2 border-red-500/60 text-red-300 hover:bg-red-900/20"
          onClick={() => setDeleteModalOpen(true)}
          disabled={working}
        >
          <AlertTriangle className="h-4 w-4" />
          Delete Account
        </button>
      </PortalCard>

      {(error || message) && (
        <PortalCard className="xl:col-span-2">
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
        </PortalCard>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <form onSubmit={deleteAccount} className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#0F172A] p-5">
            <h2 className="text-lg font-semibold text-white">Delete Account</h2>
            <p className="mt-2 text-sm text-slate-300">
              This action permanently removes your KickChasers account. Type <span className="font-semibold text-white">DELETE</span> to confirm.
            </p>

            <Input
              className="mt-4"
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              placeholder="Type DELETE"
            />

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={() => setDeleteModalOpen(false)} disabled={working}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn w-full border-red-500/60 bg-red-600/25 text-red-200 disabled:opacity-60 sm:w-auto"
                disabled={!deleteBlocked || working}
              >
                {working ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
