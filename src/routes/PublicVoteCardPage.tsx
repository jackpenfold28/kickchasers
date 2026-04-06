import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AlertCircle, CheckCircle2, ChevronRight, LoaderCircle, Search, ShieldCheck, Trophy, Users2, X } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { supabase } from '@/lib/supabase'

type AccessState = 'valid' | 'submitted' | 'invalid'
type MatchupSourceType = 'tracked_game' | 'manual'

type VoteCardCandidate = {
  gamePlayerId: string | null
  squadMemberId: string | null
  profileUserId: string | null
  subjectKey: string
  subjectName: string
  jerseyNumber: number | null
  isGuest: boolean
}

type VoteCardEntry = {
  id?: string
  slotIndex: number
  pointsValue: number
  subjectKey: string
  subjectName: string
  jerseyNumber: number | null
  gamePlayerId: string | null
  squadMemberId: string | null
  profileUserId: string | null
  isGuest: boolean
}

type PublicVoteCardContext = {
  accessState: AccessState
  message: string | null
  card: {
    id: string | null
    cardIndex: number
    status: 'pending' | 'submitted' | 'void' | null
    assignedVoterName: string | null
    assignedVoterEmail: string | null
    enteredByName: string | null
    submittedVia: 'app' | 'external_link' | 'manual_admin' | null
    submittedAt: string | null
    lockedAt: string | null
  }
  squad: {
    id: string | null
    name: string
    logoUrl: string | null
  }
  voteGroup: {
    id: string | null
    name: string
    description: string | null
  }
  matchup: {
    id: string | null
    sourceType: MatchupSourceType
    roundLabel: string
    opponentName: string
    matchupDate: string | null
    gameId: string | null
    gameSquadId: string | null
    gameTeamSide: 'home' | 'away' | null
  }
  awardType: {
    id: string | null
    name: string
    category: 'best_and_fairest' | 'incentive' | 'custom'
    colorKey: string | null
    pointValues: number[]
    maxCardsPerMatchup: number
  }
  candidatePool: VoteCardCandidate[]
  entries: VoteCardEntry[]
}

type SelectedEntry = {
  slotIndex: number
  pointsValue: number
  candidate: VoteCardCandidate | null
}

const surfaceClassName =
  'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(6,14,28,0.96))] shadow-[0_26px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl'

const primaryButtonClassName =
  'inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#1A4DFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(26,77,255,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'

const secondaryButtonClassName =
  'inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60'

const fieldClassName =
  'w-full rounded-2xl border border-white/10 bg-[#081121] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/20 focus:bg-[#0A1528]'

function formatMatchDate(value: string | null) {
  if (!value) return 'Date to be confirmed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatSubmittedAt(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function formatCandidateLabel(candidate: VoteCardCandidate) {
  const number = candidate.jerseyNumber != null ? `#${candidate.jerseyNumber}` : 'No. TBC'
  return `${candidate.subjectName} • ${number}`
}

function getSelectionKey(candidate: VoteCardCandidate | VoteCardEntry, sourceType: MatchupSourceType) {
  return sourceType === 'tracked_game' ? candidate.gamePlayerId : candidate.squadMemberId
}

function buildInitialSelections(context: PublicVoteCardContext): SelectedEntry[] {
  const entryBySlot = new Map(context.entries.map((entry) => [entry.slotIndex, entry]))
  const candidateKeys = new Map(
    context.candidatePool.map((candidate) => [getSelectionKey(candidate, context.matchup.sourceType) ?? candidate.subjectKey, candidate])
  )

  return context.awardType.pointValues.map((pointsValue, index) => {
    const slotIndex = index + 1
    const existing = entryBySlot.get(slotIndex)
    const selectionKey = existing ? getSelectionKey(existing, context.matchup.sourceType) ?? existing.subjectKey : null
    return {
      slotIndex,
      pointsValue,
      candidate: selectionKey ? candidateKeys.get(selectionKey) ?? null : null,
    }
  })
}

function validateSelections(context: PublicVoteCardContext, selections: SelectedEntry[]) {
  const errors: Record<number, string> = {}
  const seenSelectionKeys = new Set<string>()
  const expectedCount = context.awardType.pointValues.length

  if (selections.length !== expectedCount) {
    return {
      formError: 'This card is not ready to submit yet. Please reload the page and try again.',
      slotErrors: errors,
    }
  }

  for (const selection of selections) {
    if (!selection.candidate) {
      errors[selection.slotIndex] = 'Select a player for this slot.'
      continue
    }

    const identifier = getSelectionKey(selection.candidate, context.matchup.sourceType)
    if (!identifier) {
      errors[selection.slotIndex] =
        context.matchup.sourceType === 'tracked_game'
          ? 'This selection is missing a tracked player reference.'
          : 'This selection is missing a squad member reference.'
      continue
    }

    if (seenSelectionKeys.has(identifier)) {
      errors[selection.slotIndex] = 'Each player can only be selected once.'
      continue
    }

    seenSelectionKeys.add(identifier)
  }

  return {
    formError: Object.keys(errors).length > 0 ? 'Complete every vote slot before submitting.' : null,
    slotErrors: errors,
  }
}

function buildSubmitEntries(context: PublicVoteCardContext, selections: SelectedEntry[]) {
  return selections.map((selection) => ({
    slotIndex: selection.slotIndex,
    gamePlayerId: context.matchup.sourceType === 'tracked_game' ? selection.candidate?.gamePlayerId ?? null : null,
    squadMemberId: context.matchup.sourceType === 'manual' ? selection.candidate?.squadMemberId ?? null : null,
  }))
}

function StatePanel({
  icon,
  title,
  message,
  detail,
  action,
}: {
  icon: React.ReactNode
  title: string
  message: string
  detail?: string | null
  action?: React.ReactNode
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

function SlotPickerModal({
  open,
  context,
  activeSlot,
  selections,
  onClose,
  onSelect,
  onClear,
}: {
  open: boolean
  context: PublicVoteCardContext
  activeSlot: SelectedEntry | null
  selections: SelectedEntry[]
  onClose: () => void
  onSelect: (candidate: VoteCardCandidate) => void
  onClear: () => void
}) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  const selectedKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const selection of selections) {
      if (!selection.candidate || selection.slotIndex === activeSlot?.slotIndex) continue
      const identifier = getSelectionKey(selection.candidate, context.matchup.sourceType)
      if (identifier) keys.add(identifier)
    }
    return keys
  }, [activeSlot?.slotIndex, context.matchup.sourceType, selections])

  const filteredCandidates = useMemo(() => {
    const query = normalizeSearch(deferredSearch)
    return context.candidatePool.filter((candidate) => {
      if (!query) return true
      const haystack = `${candidate.subjectName} ${candidate.jerseyNumber ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [context.candidatePool, deferredSearch])

  if (!open || !activeSlot) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#020713]/82 p-3 backdrop-blur-sm sm:items-center sm:p-5">
      <div className={`${surfaceClassName} flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Choose Player</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{activeSlot.pointsValue} vote{activeSlot.pointsValue === 1 ? '' : 's'}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Search by player name or jersey number. Players already used on this card are locked.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/8 px-4 py-4 sm:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search players"
              className={`${fieldClassName} pl-11`}
            />
          </label>
        </div>

        <div className="overflow-y-auto px-3 py-3 sm:px-4">
          <div className="space-y-2">
            {activeSlot.candidate ? (
              <button type="button" onClick={onClear} className={`${secondaryButtonClassName} w-full justify-center`}>
                Clear current selection
              </button>
            ) : null}

            {filteredCandidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                No players match that search.
              </div>
            ) : (
              filteredCandidates.map((candidate) => {
                const identifier = getSelectionKey(candidate, context.matchup.sourceType)
                const disabled = identifier ? selectedKeys.has(identifier) : true
                const selected = activeSlot.candidate?.subjectKey === candidate.subjectKey
                return (
                  <button
                    key={candidate.subjectKey}
                    type="button"
                    onClick={() => onSelect(candidate)}
                    disabled={disabled && !selected}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                      selected
                        ? 'border-[#2C6BFF] bg-[#0D2249] shadow-[0_14px_34px_rgba(18,67,183,0.22)]'
                        : 'border-white/8 bg-white/[0.035] hover:border-white/14 hover:bg-white/[0.06]',
                      disabled && !selected && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0A1425] text-sm font-semibold text-white">
                          {candidate.jerseyNumber ?? '—'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{candidate.subjectName}</p>
                          <p className="truncate text-xs text-slate-400">
                            {candidate.isGuest ? 'Guest player' : 'Eligible player'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      {selected ? (
                        <span className="inline-flex rounded-full border border-[#2C6BFF]/50 bg-[#1A4DFF]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                          Selected
                        </span>
                      ) : disabled ? (
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Used
                        </span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicVoteCardPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [context, setContext] = useState<PublicVoteCardContext | null>(null)
  const [enteredByName, setEnteredByName] = useState('')
  const [selections, setSelections] = useState<SelectedEntry[]>([])
  const [slotErrors, setSlotErrors] = useState<Record<number, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)

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
      setSubmitError(null)
      setFormError(null)
      setSlotErrors({})
      setShowThankYou(false)

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

      const nextContext = data as PublicVoteCardContext
      setContext(nextContext)
      setEnteredByName(nextContext.card.assignedVoterName || nextContext.card.enteredByName || '')
      setSelections(buildInitialSelections(nextContext))
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  const activeSlot = useMemo(
    () => selections.find((selection) => selection.slotIndex === activeSlotIndex) ?? null,
    [activeSlotIndex, selections]
  )

  const submitDisabled = loading || submitting || !context || context.accessState !== 'valid'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!context || !token) return

    const validation = validateSelections(context, selections)
    setSlotErrors(validation.slotErrors)
    setFormError(validation.formError)
    setSubmitError(null)

    if (validation.formError || Object.keys(validation.slotErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const payload = buildSubmitEntries(context, selections)
    const { error } = await supabase.rpc('rpc_submit_public_squad_vote_card', {
      _token: token,
      _entries: payload,
      _entered_by_name: enteredByName.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      setSubmitError('Your votes were not submitted. Please review your selections and try again.')
      return
    }

    setShowThankYou(true)
  }

  function handleSelection(candidate: VoteCardCandidate) {
    if (!activeSlot) return
    setSelections((current) =>
      current.map((selection) =>
        selection.slotIndex === activeSlot.slotIndex
          ? {
              ...selection,
              candidate,
            }
          : selection
      )
    )
    setSlotErrors((current) => {
      const next = { ...current }
      delete next[activeSlot.slotIndex]
      return next
    })
    setFormError(null)
    setSubmitError(null)
    setActiveSlotIndex(null)
  }

  function clearSelection() {
    if (!activeSlot) return
    setSelections((current) =>
      current.map((selection) =>
        selection.slotIndex === activeSlot.slotIndex
          ? {
              ...selection,
              candidate: null,
            }
          : selection
      )
    )
    setActiveSlotIndex(null)
  }

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

  if (!context) {
    return null
  }

  const submittedAt = formatSubmittedAt(context.card.submittedAt)

  if (context.accessState === 'invalid') {
    return (
      <main className="min-h-screen bg-[#02091A] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <StatePanel
            icon={<ShieldCheck className="h-7 w-7 text-slate-200" />}
            title="Link unavailable"
            message="This vote card link is invalid or is no longer available."
            detail={context.message || 'If you expected this card to be active, please request a new link from the organiser.'}
          />
        </div>
      </main>
    )
  }

  if (context.accessState === 'submitted' || showThankYou) {
    return (
      <main className="min-h-screen bg-[#02091A] px-4 py-10 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_480px_at_20%_0%,rgba(26,77,255,0.18),transparent_60%),radial-gradient(720px_360px_at_90%_12%,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,#02091A_0%,#040B1C_100%)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <StatePanel
            icon={<CheckCircle2 className="h-7 w-7 text-[#8CCBFF]" />}
            title={showThankYou ? 'Votes submitted' : 'Vote card completed'}
            message={
              showThankYou
                ? 'Thank you. Your votes have been recorded successfully.'
                : 'This vote card has already been submitted and can no longer be changed.'
            }
            detail={showThankYou ? null : context.message || (submittedAt ? `Submitted ${submittedAt}.` : 'No further action is required.')}
            action={
              <Link to="/" className={secondaryButtonClassName}>
                Return to KickChasers
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#02091A] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(960px_520px_at_12%_0%,rgba(26,77,255,0.18),transparent_58%),radial-gradient(800px_460px_at_100%_10%,rgba(255,255,255,0.05),transparent_54%),linear-gradient(180deg,#02091A_0%,#030A1A_44%,#040B1C_100%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className={`${surfaceClassName} overflow-hidden`}>
          <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[1.15fr_.85fr]">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-[#0B1425]">
                  {context.squad.logoUrl ? (
                    <img src={context.squad.logoUrl} alt={context.squad.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-white">{context.squad.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">KickChasers Vote Card</p>
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">{context.squad.name}</h1>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  {context.voteGroup.name}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {context.awardType.name}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Card {context.card.cardIndex}
                </span>
              </div>

              <p className="mt-5 max-w-[56ch] text-sm leading-6 text-slate-300">
                Select one player for each vote slot below, then submit once when you are happy with the full card.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[24px] border border-white/8 bg-[#081121] p-4">
                <div className="flex items-start gap-3">
                  <Trophy className="mt-0.5 h-5 w-5 text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">{context.matchup.roundLabel}</p>
                    <p className="mt-1 text-sm text-slate-400">vs {context.matchup.opponentName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{formatMatchDate(context.matchup.matchupDate)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-[#081121] p-4">
                <div className="flex items-start gap-3">
                  <Users2 className="mt-0.5 h-5 w-5 text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {context.matchup.sourceType === 'tracked_game' ? 'Tracked game player pool' : 'Manual squad player pool'}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {context.candidatePool.length} eligible player{context.candidatePool.length === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Duplicates are blocked before submission.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <PortalCard
            title="Card Details"
            subtitle={context.voteGroup.description || 'Submit this card once. You will see a confirmation screen immediately after a successful submission.'}
            className="rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,16,31,0.94))]"
          >
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Vote Group</p>
                <p className="mt-2 text-sm font-semibold text-white">{context.voteGroup.name}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Award Type</p>
                <p className="mt-2 text-sm font-semibold text-white">{context.awardType.name}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Matchup</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {context.matchup.roundLabel} vs {context.matchup.opponentName}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Card Type</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {context.matchup.sourceType === 'tracked_game' ? 'Tracked game selections' : 'Manual squad selections'}
                </p>
              </div>
            </div>
          </PortalCard>

          <PortalCard
            title="Submitted By"
            subtitle="Optional. This helps confirm who entered the votes."
            className="rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,16,31,0.94))]"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Name</span>
              <input
                value={enteredByName}
                onChange={(event) => setEnteredByName(event.target.value)}
                placeholder="Enter your name"
                className={fieldClassName}
                autoComplete="name"
              />
            </label>
            {context.card.assignedVoterEmail ? (
              <p className="mt-3 text-xs text-slate-500">Assigned voter: {context.card.assignedVoterEmail}</p>
            ) : null}
          </PortalCard>
        </section>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PortalCard
            title="Votes"
            subtitle="Select one eligible player for each point slot. Search is available on every slot."
            className="rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(7,16,31,0.94))]"
          >
            <div className="space-y-3">
              {selections.map((selection) => (
                <div
                  key={selection.slotIndex}
                  className={clsx(
                    'rounded-[24px] border p-4 transition sm:p-5',
                    slotErrors[selection.slotIndex]
                      ? 'border-[#7F1D1D] bg-[rgba(69,10,10,0.38)]'
                      : 'border-white/8 bg-white/[0.03]'
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-[#091423] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          Slot {selection.slotIndex}
                        </span>
                        <span className="rounded-full border border-[#2C6BFF]/40 bg-[#1A4DFF]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                          {selection.pointsValue} vote{selection.pointsValue === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mt-3">
                        {selection.candidate ? (
                          <>
                            <p className="text-base font-semibold text-white">{selection.candidate.subjectName}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {selection.candidate.jerseyNumber != null ? `#${selection.candidate.jerseyNumber}` : 'No jersey number'}
                              {selection.candidate.isGuest ? ' • Guest player' : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-semibold text-white">No player selected</p>
                            <p className="mt-1 text-sm text-slate-400">Choose the player who should receive this vote value.</p>
                          </>
                        )}
                      </div>
                      {slotErrors[selection.slotIndex] ? (
                        <p className="mt-3 text-sm text-red-200">{slotErrors[selection.slotIndex]}</p>
                      ) : null}
                    </div>

                    <div className="flex gap-2 sm:flex-col sm:items-end">
                      <button type="button" onClick={() => setActiveSlotIndex(selection.slotIndex)} className={primaryButtonClassName}>
                        {selection.candidate ? 'Change player' : 'Select player'}
                      </button>
                      {selection.candidate ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelections((current) =>
                              current.map((item) => (item.slotIndex === selection.slotIndex ? { ...item, candidate: null } : item))
                            )
                          }
                          className={secondaryButtonClassName}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PortalCard>

          {(formError || submitError) ? (
            <div className="rounded-2xl border border-[#7F1D1D] bg-[rgba(69,10,10,0.32)] px-4 py-3 text-sm text-red-100">
              {submitError || formError}
            </div>
          ) : null}

          <div className={`${surfaceClassName} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
            <div>
              <p className="text-sm font-semibold text-white">Ready to submit?</p>
              <p className="mt-1 text-sm text-slate-400">Review every slot carefully. This secure card can only be submitted once.</p>
            </div>
            <button type="submit" disabled={submitDisabled} className={primaryButtonClassName}>
              {submitting ? 'Submitting votes…' : 'Submit vote card'}
            </button>
          </div>
        </form>
      </div>

      <SlotPickerModal
        open={activeSlotIndex != null}
        context={context}
        activeSlot={activeSlot}
        selections={selections}
        onClose={() => setActiveSlotIndex(null)}
        onSelect={handleSelection}
        onClear={clearSelection}
      />
    </main>
  )
}
