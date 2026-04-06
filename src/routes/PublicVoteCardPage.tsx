import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { normalizeHexColor, resolveSquadPrimaryColor } from '@/lib/squad-colors'

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
  avatarUrl?: string | null
  positionLabel?: string | null
  ratingValue?: number | null
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
  avatarUrl?: string | null
  positionLabel?: string | null
  ratingValue?: number | null
}

type VoteCardRecommendation = {
  slotIndex?: number | null
  pointsValue?: number | null
  subjectKey: string
  subjectName: string
  jerseyNumber?: number | null
  ratingValue?: number | null
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
    primaryColorHex?: string | null
    secondaryColorHex?: string | null
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
    opponentLogoUrl?: string | null
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
  recommendations?: VoteCardRecommendation[] | null
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

function toRgb(hex: string) {
  const normalized = normalizeHexColor(hex) ?? '#1A4DFF'
  const value = normalized.slice(1)
  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16),
  }
}

function toRgba(hex: string, alpha: number) {
  const { red, green, blue } = toRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function mixHex(baseHex: string, targetHex: string, weight: number) {
  const base = toRgb(baseHex)
  const target = toRgb(targetHex)
  const ratio = Math.min(1, Math.max(0, weight))
  const blend = (from: number, to: number) => Math.round(from + (to - from) * ratio)
  return `#${[blend(base.red, target.red), blend(base.green, target.green), blend(base.blue, target.blue)]
    .map((value) => value.toString(16).padStart(2, '0').toUpperCase())
    .join('')}`
}

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')
}

function findFirstIncompleteSlot(selections: SelectedEntry[]) {
  return selections.find((selection) => !selection.candidate)?.slotIndex ?? selections[0]?.slotIndex ?? null
}

function areAllSelectionsFilled(selections: SelectedEntry[]) {
  return selections.every((selection) => Boolean(selection.candidate))
}

function getCandidateMeta(candidate: VoteCardCandidate, sourceType: MatchupSourceType) {
  if (sourceType === 'tracked_game') {
    if (typeof candidate.ratingValue === 'number') return `Rating ${candidate.ratingValue.toFixed(1)}`
    return candidate.isGuest ? 'Guest player' : 'Tracked squad player'
  }

  const meta: string[] = []
  if (candidate.jerseyNumber != null) meta.push(`#${candidate.jerseyNumber}`)
  if (candidate.positionLabel) meta.push(candidate.positionLabel)
  if (!meta.length) meta.push(candidate.isGuest ? 'Guest player' : 'Squad player')
  return meta.join(' • ')
}

function getRecommendationMeta(recommendation: VoteCardRecommendation) {
  if (typeof recommendation.ratingValue === 'number') return `Rating ${recommendation.ratingValue.toFixed(1)}`
  if (recommendation.jerseyNumber != null) return `#${recommendation.jerseyNumber}`
  return 'Recommended'
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

function LogoMark({
  src,
  label,
  className,
}: {
  src: string | null | undefined
  label: string
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.03))] text-sm font-semibold uppercase text-white shadow-[0_16px_30px_rgba(0,0,0,0.32)]',
        className
      )}
    >
      {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : <span>{getInitials(label).slice(0, 2)}</span>}
    </div>
  )
}

function VoteRow({
  selection,
  sourceType,
  isEditable,
  isBestAndFairest,
  onOpen,
  onClear,
  error,
}: {
  selection: SelectedEntry
  sourceType: MatchupSourceType
  isEditable: boolean
  isBestAndFairest: boolean
  onOpen: () => void
  onClear: () => void
  error?: string
}) {
  const candidate = selection.candidate
  const railClassName = isBestAndFairest
    ? 'bg-gradient-to-b from-[#FFF3B0] via-[#D4AF37] to-[#9C6A00] bg-clip-text text-transparent'
    : 'text-white'

  return (
    <button
      type="button"
      onClick={isEditable ? onOpen : undefined}
      className={clsx(
        'group grid w-full grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/10 px-4 py-4 text-left transition sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:px-5',
        isEditable ? 'hover:bg-white/[0.05]' : 'cursor-default',
        error && 'bg-[rgba(122,28,28,0.18)]'
      )}
    >
      <div className="flex justify-center">
        <div className={clsx('text-center text-[2.1rem] font-black italic leading-none tracking-[-0.05em] sm:text-[2.5rem]', railClassName)}>
          {selection.pointsValue}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.08] text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {candidate?.avatarUrl ? (
            <img src={candidate.avatarUrl} alt={candidate.subjectName} className="h-full w-full object-cover" />
          ) : candidate ? (
            getInitials(candidate.subjectName).slice(0, 2)
          ) : (
            <UserRound className="h-5 w-5 text-slate-500" />
          )}
        </div>

        <div className="min-w-0">
          {candidate?.isGuest ? (
            <span className="inline-flex rounded-full border border-white/12 bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
              Guest
            </span>
          ) : null}
          <p
            className={clsx(
              'truncate text-lg font-black uppercase italic tracking-[-0.03em] text-white',
              !candidate && 'text-slate-300'
            )}
          >
            {candidate ? candidate.subjectName : 'Select player'}
          </p>
          <p className={clsx('mt-1 truncate text-sm text-slate-400', error && 'text-red-200')}>
            {candidate ? getCandidateMeta(candidate, sourceType) : 'Tap to assign this vote slot.'}
          </p>
          {error ? <p className="mt-1 text-xs text-red-200">{error}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditable && candidate ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              onClear()
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition group-hover:bg-white/[0.08] group-hover:text-white"
            aria-label={`Clear ${candidate.subjectName} from ${selection.pointsValue} vote slot`}
          >
            <X className="h-4 w-4" />
          </span>
        ) : null}
        {isEditable ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition group-hover:border-white/20 group-hover:bg-white/[0.08] group-hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </button>
  )
}

function SelectionDialog({
  open,
  context,
  selections,
  activeSlotIndex,
  onClose,
  onActivateSlot,
  onSelectCandidate,
  onClearSlot,
  onConfirm,
}: {
  open: boolean
  context: PublicVoteCardContext
  selections: SelectedEntry[]
  activeSlotIndex: number | null
  onClose: () => void
  onActivateSlot: (slotIndex: number) => void
  onSelectCandidate: (candidate: VoteCardCandidate) => void
  onClearSlot: () => void
  onConfirm: () => void
}) {
  const [search, setSearch] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)

  const activeSlot = useMemo(
    () => selections.find((selection) => selection.slotIndex === activeSlotIndex) ?? null,
    [activeSlotIndex, selections]
  )

  useEffect(() => {
    if (!open) return
    setSearch('')
    setDialogError(null)
  }, [open, activeSlotIndex])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  const filteredCandidates = useMemo(() => {
    const query = normalizeSearch(deferredSearch)
    return context.candidatePool.filter((candidate) => {
      if (!query) return true
      const haystack = `${candidate.subjectName} ${candidate.jerseyNumber ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [context.candidatePool, deferredSearch])

  const selectedLookup = useMemo(() => {
    const lookup = new Map<string, number>()
    for (const selection of selections) {
      if (!selection.candidate) continue
      const key = getSelectionKey(selection.candidate, context.matchup.sourceType) ?? selection.candidate.subjectKey
      lookup.set(key, selection.slotIndex)
    }
    return lookup
  }, [context.matchup.sourceType, selections])

  if (!open || !activeSlot) return null

  const selectedCount = selections.filter((selection) => selection.candidate).length
  const allFilled = areAllSelectionsFilled(selections)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#020713]/84 p-3 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,25,42,0.98),rgba(7,13,24,0.98))] shadow-[0_36px_90px_rgba(0,0,0,0.56)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Assign Votes</p>
            <h2 className="mt-1 text-xl font-black uppercase italic tracking-[-0.03em] text-white">
              {activeSlot.pointsValue} vote{activeSlot.pointsValue === 1 ? '' : 's'} active
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Tap a player to assign the active vote value, then confirm the full order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close vote selection dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 border-b border-white/10 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:px-6">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Active</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-black italic text-white">{activeSlot.pointsValue}</p>
                <p className="text-sm text-slate-400">
                  Slot {activeSlot.slotIndex} {activeSlot.candidate ? `• ${activeSlot.candidate.subjectName}` : '• Awaiting player'}
                </p>
              </div>
              {activeSlot.candidate ? (
                <button type="button" onClick={onClearSlot} className={secondaryButtonClassName}>
                  Clear slot
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selected</p>
            <p className="mt-2 text-2xl font-black italic text-white">
              {selectedCount}/{selections.length}
            </p>
            <p className="text-sm text-slate-400">
              {allFilled ? 'Full vote order ready to confirm.' : 'Keep filling the order. Players can only be used once.'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-b border-white/10 px-5 py-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:px-6">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Order</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selections.map((selection) => (
                <button
                  key={selection.slotIndex}
                  type="button"
                  onClick={() => onActivateSlot(selection.slotIndex)}
                  className={clsx(
                    'inline-flex min-w-[84px] items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-sm transition',
                    selection.slotIndex === activeSlot.slotIndex
                      ? 'border-white/25 bg-white/[0.12] text-white'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                  )}
                >
                  <span className="font-black italic">{selection.pointsValue}</span>
                  <span className="truncate text-xs uppercase tracking-[0.16em]">{selection.candidate ? 'Set' : 'Open'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Hint</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {context.matchup.sourceType === 'tracked_game'
                ? 'Tracked players can show ratings when available. Choosing a used player will move that player into the active vote slot.'
                : 'Search by name or jumper number. Choosing a used player will move that player into the active vote slot.'}
            </p>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by player name or jumper number"
              className={`${fieldClassName} pl-11`}
            />
          </label>
        </div>

        <div className="overflow-y-auto px-3 py-3 sm:px-4">
          <div className="space-y-2">
            {filteredCandidates.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                No players match that search.
              </div>
            ) : (
              filteredCandidates.map((candidate) => {
                const key = getSelectionKey(candidate, context.matchup.sourceType) ?? candidate.subjectKey
                const usedBySlot = selectedLookup.get(key)
                const isActiveSelection = activeSlot.candidate?.subjectKey === candidate.subjectKey
                const isUsedElsewhere = usedBySlot != null && usedBySlot !== activeSlot.slotIndex
                return (
                  <button
                    key={candidate.subjectKey}
                    type="button"
                    onClick={() => {
                      setDialogError(null)
                      onSelectCandidate(candidate)
                    }}
                    className={clsx(
                      'flex w-full items-center justify-between gap-4 rounded-[24px] border px-4 py-3 text-left transition',
                      isActiveSelection
                        ? 'border-[#2C6BFF] bg-[#0D2249] shadow-[0_14px_34px_rgba(18,67,183,0.22)]'
                        : 'border-white/8 bg-white/[0.035] hover:border-white/14 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-white/10 bg-[#0A1425] text-sm font-semibold text-white">
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} alt={candidate.subjectName} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(candidate.subjectName).slice(0, 2)
                        )}
                      </div>
                      <div className="min-w-0">
                        {candidate.isGuest ? (
                          <span className="inline-flex rounded-full border border-white/12 bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-100">
                            Guest
                          </span>
                        ) : null}
                        <p className="truncate text-base font-black uppercase italic tracking-[-0.03em] text-white">{candidate.subjectName}</p>
                        <p className="truncate text-sm text-slate-400">{getCandidateMeta(candidate, context.matchup.sourceType)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {isActiveSelection ? (
                        <span className="inline-flex rounded-full border border-[#2C6BFF]/50 bg-[#1A4DFF]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                          Active
                        </span>
                      ) : isUsedElsewhere ? (
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                          Move from {usedBySlot}
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

        <div className="border-t border-white/10 px-5 py-4 sm:px-6">
          {dialogError ? (
            <div className="mb-3 rounded-2xl border border-[#7F1D1D] bg-[rgba(69,10,10,0.32)] px-4 py-3 text-sm text-red-100">
              {dialogError}
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={onClose} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!allFilled) {
                  setDialogError('Complete the full vote order before confirming.')
                  return
                }
                onConfirm()
              }}
              className={primaryButtonClassName}
            >
              Confirm order
            </button>
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
  const [committedSelections, setCommittedSelections] = useState<SelectedEntry[]>([])
  const [draftSelections, setDraftSelections] = useState<SelectedEntry[]>([])
  const [slotErrors, setSlotErrors] = useState<Record<number, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#1A4DFF')

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
      const initialSelections = buildInitialSelections(nextContext)
      setContext(nextContext)
      setEnteredByName(nextContext.card.assignedVoterName || nextContext.card.enteredByName || '')
      setCommittedSelections(initialSelections)
      setDraftSelections(initialSelections)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!context) return
    let cancelled = false

    async function resolvePrimary() {
      const resolved = await resolveSquadPrimaryColor({
        primaryColorHex: context.squad.primaryColorHex,
        logoUrl: context.squad.logoUrl,
        fallbackColor: '#1A4DFF',
      })
      if (!cancelled) setPrimaryColor(normalizeHexColor(resolved) ?? '#1A4DFF')
    }

    void resolvePrimary()

    return () => {
      cancelled = true
    }
  }, [context])

  const secondaryColor = useMemo(
    () => normalizeHexColor(context?.squad.secondaryColorHex) ?? mixHex(primaryColor, '#07111F', 0.72),
    [context?.squad.secondaryColorHex, primaryColor]
  )

  const isBestAndFairest = context?.awardType.category === 'best_and_fairest'
  const cardTitleGradient = isBestAndFairest
    ? 'linear-gradient(135deg, #FFF3B0 0%, #D4AF37 48%, #9C6A00 100%)'
    : `linear-gradient(135deg, ${toRgba(primaryColor, 0.98)} 0%, ${toRgba(mixHex(primaryColor, '#FFFFFF', 0.22), 0.95)} 100%)`

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!context || !token) return

    const validation = validateSelections(context, committedSelections)
    setSlotErrors(validation.slotErrors)
    setFormError(validation.formError)
    setSubmitError(null)

    if (validation.formError || Object.keys(validation.slotErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const payload = buildSubmitEntries(context, committedSelections)
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

  function openSelectionDialog(slotIndex?: number) {
    const snapshot = committedSelections.map((selection) => ({ ...selection }))
    setDraftSelections(snapshot)
    setActiveSlotIndex(slotIndex ?? findFirstIncompleteSlot(snapshot))
    setSelectionDialogOpen(true)
  }

  function closeSelectionDialog() {
    setSelectionDialogOpen(false)
    setActiveSlotIndex(null)
    setDraftSelections(committedSelections.map((selection) => ({ ...selection })))
  }

  function handleDraftSelection(candidate: VoteCardCandidate) {
    setDraftSelections((current) => {
      if (activeSlotIndex == null) return current

      const identifier = getSelectionKey(candidate, context?.matchup.sourceType ?? 'manual') ?? candidate.subjectKey
      const nextSelections = current.map((selection) => ({ ...selection }))
      const activeIndex = nextSelections.findIndex((selection) => selection.slotIndex === activeSlotIndex)
      if (activeIndex === -1) return current

      const usedIndex = nextSelections.findIndex((selection, index) => {
        if (index === activeIndex || !selection.candidate) return false
        const selectionKey = getSelectionKey(selection.candidate, context?.matchup.sourceType ?? 'manual') ?? selection.candidate.subjectKey
        return selectionKey === identifier
      })

      if (usedIndex >= 0) nextSelections[usedIndex] = { ...nextSelections[usedIndex], candidate: null }
      nextSelections[activeIndex] = { ...nextSelections[activeIndex], candidate }

      const nextIncomplete = nextSelections.find(
        (selection) => selection.slotIndex > activeSlotIndex && !selection.candidate
      )
      const fallbackIncomplete = nextSelections.find((selection) => !selection.candidate)
      const nextActive = nextIncomplete?.slotIndex ?? fallbackIncomplete?.slotIndex ?? activeSlotIndex
      setActiveSlotIndex(nextActive)

      return nextSelections
    })
  }

  function clearDraftSelection() {
    if (activeSlotIndex == null) return
    setDraftSelections((current) =>
      current.map((selection) => (selection.slotIndex === activeSlotIndex ? { ...selection, candidate: null } : selection))
    )
  }

  function clearCommittedSelection(slotIndex: number) {
    setCommittedSelections((current) =>
      current.map((selection) => (selection.slotIndex === slotIndex ? { ...selection, candidate: null } : selection))
    )
    setSlotErrors((current) => {
      const next = { ...current }
      delete next[slotIndex]
      return next
    })
    setFormError(null)
    setSubmitError(null)
  }

  function confirmDraftSelections() {
    if (!context) return
    const validation = validateSelections(context, draftSelections)
    setCommittedSelections(draftSelections.map((selection) => ({ ...selection })))
    setSlotErrors(validation.slotErrors)
    setFormError(validation.formError)
    setSubmitError(null)
    setSelectionDialogOpen(false)
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

  const submitDisabled = loading || submitting || context.accessState !== 'valid'
  const allCommittedFilled = areAllSelectionsFilled(committedSelections)
  const recommendations = context.recommendations?.filter(Boolean) ?? []

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#02091A] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(960px 520px at 12% 0%, ${toRgba(primaryColor, 0.26)}, transparent 58%),
            radial-gradient(780px 420px at 100% 12%, ${toRgba(secondaryColor, 0.2)}, transparent 54%),
            linear-gradient(180deg, #02091A 0%, #030A1A 44%, #040B1C 100%)
          `,
        }}
      />

      <form onSubmit={handleSubmit} className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">KickChasers Public Vote Card</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.4rem]">{context.awardType.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {context.voteGroup.description || 'Complete the card in one clean flow, then submit once when the final order is locked in.'}
              </p>
            </div>
          </div>
        </section>

        <section className={`${surfaceClassName} flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Vote order</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Vote order</h2>
            <p className="mt-1 text-sm text-slate-400">Pick the full order in one flow. Players can only be used once.</p>
          </div>
          <button type="button" onClick={() => openSelectionDialog()} className={primaryButtonClassName}>
            <PencilLine className="mr-2 h-4 w-4" />
            {allCommittedFilled ? 'Edit order' : 'Assign votes'}
          </button>
        </section>

        <section
          className="overflow-hidden rounded-[24px] border shadow-[0_34px_90px_rgba(0,0,0,0.44)]"
          style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: `
              radial-gradient(circle at 16% 10%, ${toRgba(mixHex(primaryColor, '#FFFFFF', 0.12), 0.38)}, transparent 32%),
              radial-gradient(circle at 84% 18%, ${toRgba(mixHex(secondaryColor, '#FFFFFF', 0.2), 0.24)}, transparent 32%),
              linear-gradient(145deg, ${mixHex(primaryColor, '#050A14', 0.42)} 0%, ${mixHex(secondaryColor, '#07111F', 0.2)} 42%, #050B16 100%)
            `,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,12,0.18),rgba(2,6,12,0.78)_48%,rgba(1,4,10,0.94)_100%)]" />
            <div className="relative px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.12] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {context.voteGroup.name}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.12] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {context.matchup.roundLabel}
                    </span>
                  </div>

                  <h2
                    className="mt-4 text-[2rem] font-black uppercase italic leading-none tracking-[-0.05em] sm:text-[2.7rem]"
                    style={{
                      backgroundImage: cardTitleGradient,
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {context.awardType.name}
                  </h2>

                  <p className="mt-3 text-sm font-medium text-slate-100 sm:text-base">
                    {context.squad.name} v {context.matchup.opponentName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {context.matchup.sourceType === 'tracked_game' ? 'Tracked game card' : 'Manual vote card'} • Card #{context.card.cardIndex}
                  </p>
                </div>

                <div className="flex shrink-0 items-center pl-2">
                  <LogoMark src={context.matchup.opponentLogoUrl} label={context.matchup.opponentName} className="translate-x-3" />
                  <LogoMark src={context.squad.logoUrl} label={context.squad.name} className="-ml-3 border-white/20" />
                </div>
              </div>
            </div>

            {context.matchup.sourceType === 'tracked_game' && recommendations.length > 0 ? (
              <div className="relative px-5 pb-3 sm:px-6">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-slate-200" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">Recommended votes</p>
                      <p className="text-sm text-slate-400">Based off player game rating</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendations.map((recommendation) => (
                      <div key={`${recommendation.subjectKey}-${recommendation.pointsValue ?? recommendation.slotIndex ?? 'rec'}`} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-100">
                        <span className="font-semibold">{recommendation.pointsValue ?? recommendation.slotIndex ?? '•'}</span> {recommendation.subjectName}
                        <span className="text-slate-400"> • {getRecommendationMeta(recommendation)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative border-t border-white/10">
              {committedSelections.map((selection) => (
                <VoteRow
                  key={selection.slotIndex}
                  selection={selection}
                  sourceType={context.matchup.sourceType}
                  isEditable
                  isBestAndFairest={Boolean(isBestAndFairest)}
                  onOpen={() => openSelectionDialog(selection.slotIndex)}
                  onClear={() => clearCommittedSelection(selection.slotIndex)}
                  error={slotErrors[selection.slotIndex]}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={`${surfaceClassName} px-5 py-5 sm:px-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Voter details</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Voter details</h2>
          <p className="mt-1 text-sm text-slate-400">This name is saved with the submitted card.</p>
          <div className="mt-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Entered by</span>
              <input
                value={enteredByName}
                onChange={(event) => setEnteredByName(event.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-[16px] border border-white/10 bg-[#081121] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/20 focus:bg-[#0A1528]"
                autoComplete="name"
              />
            </label>
            {context.card.assignedVoterEmail ? (
              <p className="mt-3 text-xs text-slate-500">Assigned voter: {context.card.assignedVoterEmail}</p>
            ) : null}
          </div>
        </section>

        {(formError || submitError) ? (
          <div className="rounded-2xl border border-[#7F1D1D] bg-[rgba(69,10,10,0.32)] px-4 py-3 text-sm text-red-100">
            {submitError || formError}
          </div>
        ) : null}

        <section className={`${surfaceClassName} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
          <div>
            <p className="text-sm font-semibold text-white">
              {allCommittedFilled ? 'Ready to submit?' : 'Complete the order to submit'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {allCommittedFilled
                ? 'Review the final order carefully. This secure card can only be submitted once.'
                : 'Use Assign votes to finish the full vote order before submitting.'}
            </p>
          </div>
          <button type="submit" disabled={submitDisabled} className={primaryButtonClassName}>
            {submitting ? 'Submitting votes…' : 'Submit vote card'}
          </button>
        </section>
      </form>

      <SelectionDialog
        open={selectionDialogOpen}
        context={context}
        selections={draftSelections}
        activeSlotIndex={activeSlotIndex}
        onClose={closeSelectionDialog}
        onActivateSlot={setActiveSlotIndex}
        onSelectCandidate={handleDraftSelection}
        onClearSlot={clearDraftSelection}
        onConfirm={confirmDraftSelections}
      />
    </main>
  )
}
