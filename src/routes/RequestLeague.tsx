import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { createDirectoryRequest } from '@/lib/admin-requests'

export default function RequestLeague() {
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const stateCode = query.get('stateCode')?.trim().toUpperCase() || ''
  const stateName = query.get('stateName')?.trim() || ''
  const returnTo = query.get('returnTo') || '/onboarding'

  const [userId, setUserId] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState('')
  const [shortName, setShortName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setUserId(data.session?.user?.id ?? null)
    })()
  }, [])

  const canSubmit = useMemo(() => Boolean(userId && stateCode && leagueName.trim() && !saving), [leagueName, saving, stateCode, userId])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!userId) {
      setError('Please sign in again to submit a request.')
      return
    }
    if (!stateCode) {
      setError('Select a state first.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await createDirectoryRequest(userId, 'add_league', {
        state_code: stateCode,
        state_name: stateName || null,
        league_name: leagueName.trim(),
        short_name: shortName.trim() || null,
        notes: notes.trim() || null,
        source: 'web_onboarding',
      })
      setMessage('League request sent. Return to onboarding and choose another official club for now if needed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#040817] px-4 py-5 text-[#F8FAFC] sm:px-6">
      <div className="mx-auto max-w-[640px]">
        <div className="relative flex items-center justify-center pb-6">
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-[#111B33] text-slate-100 transition hover:bg-[#162342]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f88b7]">Directory request</p>
          <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-white">Request league</h1>
          <p className="mx-auto mt-3 max-w-[540px] text-[15px] leading-6 text-slate-400">
            We’ll review and add official league data for this state. You can return to onboarding afterward.
          </p>
        </section>

        <section className="mt-8 rounded-[34px] border border-[#39FF88]/10 bg-[#111B33] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-7">
          <div className="rounded-[24px] bg-[#0D1526] px-4 py-3 text-left text-sm text-slate-300">
            State: {stateName ? `${stateName} (${stateCode})` : stateCode || 'Not selected'}
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block space-y-2.5 text-left">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">League name</span>
              <Input value={leagueName} onChange={(event) => setLeagueName(event.target.value)} placeholder="League name" className="min-h-[58px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 text-[15px]" />
            </label>

            <label className="block space-y-2.5 text-left">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Short name</span>
              <Input value={shortName} onChange={(event) => setShortName(event.target.value)} placeholder="Optional short name" className="min-h-[58px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 text-[15px]" />
            </label>

            <label className="block space-y-2.5 text-left">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</span>
              <textarea
                className="input min-h-[130px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 py-4 text-[15px]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything else we should know?"
              />
            </label>

            {error ? <div className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="rounded-[22px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="rounded-full bg-[#39FF88] px-5 py-3 text-sm font-semibold text-[#081120] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSubmit}>
                {saving ? 'Submitting…' : 'Submit request'}
              </button>
              <Link className="inline-flex items-center rounded-full bg-[#0D1526] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-[#14203a]" to={returnTo}>
                Back to onboarding
              </Link>
              {message ? (
                <button type="button" className="inline-flex items-center gap-2 rounded-full bg-transparent px-1 py-3 text-sm font-semibold text-[#39FF88]" onClick={() => navigate(returnTo, { replace: true })}>
                  Return now
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
