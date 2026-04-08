import { type ReactNode, useEffect, useState } from 'react'
import { LoaderCircle, AlertCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import PublicVoteCard from '@/components/vote-card/PublicVoteCard'
import type { PublicVoteCardContext } from '@/components/vote-card/publicVoteCard.types'
import { supabase } from '@/lib/supabase'

const surfaceClassName =
  'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(6,14,28,0.96))] shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl'

const primaryButtonClassName =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#1A4DFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(26,77,255,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'

function StatePanel({
  icon,
  title,
  message,
  detail,
  action,
}: {
  icon: ReactNode
  title: string
  message: string
  detail?: string | null
  action?: ReactNode
}) {
  return (
    <div className={`${surfaceClassName} mx-auto max-w-xl p-8 text-center sm:p-10`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white">
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export default function PublicVoteCardPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [context, setContext] = useState<PublicVoteCardContext | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!token) {
        setContext(null)
        setLoadError('This vote card link is unavailable.')
        setLoading(false)
        return
      }

      setLoading(true)
      setLoadError(null)

      const { data, error } = await supabase.rpc('rpc_get_public_squad_vote_card_context', {
        _token: token,
      })

      if (cancelled) return

      if (error || !data) {
        setContext(null)
        setLoadError('We could not load this vote card right now. Please try again.')
        setLoading(false)
        return
      }

      setContext(data as PublicVoteCardContext)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#02091A] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <StatePanel
            icon={<LoaderCircle className="h-7 w-7 animate-spin" />}
            title="Loading vote card"
            message="We’re securely preparing your voting card now."
          />
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#02091A] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <StatePanel
            icon={<AlertCircle className="h-7 w-7 text-slate-200" />}
            title="Vote card unavailable"
            message="This vote card could not be loaded right now."
            detail="Please refresh the page or try opening the link again."
            action={
              <button type="button" onClick={() => window.location.reload()} className={primaryButtonClassName}>
                Retry
              </button>
            }
          />
        </div>
      </main>
    )
  }

  if (!context || !token) return null

  return (
    <PublicVoteCard
      context={context}
      mode="live"
      onSubmitLive={async ({ payload, enteredByName }) => {
        const { error } = await supabase.rpc('rpc_submit_public_squad_vote_card', {
          _token: token,
          _entries: payload,
          _entered_by_name: enteredByName.trim() || null,
        })

        return error ? 'Your votes were not submitted. Please review your selections and try again.' : null
      }}
    />
  )
}
