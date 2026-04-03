import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import TeamPageIcon from '@/components/icons/TeamPageIcon'
import { resolveLogoPublicUrl } from '@/lib/logo-storage'
import { resolveSquadPrimaryColor } from '@/lib/squad-colors'
import {
  getSquadDetail,
  listLeaguesByState,
  listSquadMembers,
  listStates,
  type LeagueOption,
  type SquadDetail,
  type SquadMember,
  type StateOption,
} from '@/lib/squads'
import { supabase } from '@/lib/supabase'

type LineupSectionKey = 'def' | 'mid' | 'fwd' | 'int'

type LineupState = Record<LineupSectionKey, Array<string | null>>

type RoundSelection = {
  kind: 'round' | 'final' | 'trial'
  label: string
  value?: number
}

type ClubOption = {
  id: string
  name: string
  logoUrl: string | null
}

type RosterPlayer = {
  id: string
  name: string
  handle: string | null
  jerseyNumber: number | null
}

type RosterSlot = {
  section: LineupSectionKey
  index: number
}

type SponsorLogoState = {
  enabled: boolean
  slots: Array<string | null>
}

type PosterPlayer = {
  id: string
  name: string
  jerseyNumber: number | null
}

const sectionsConfig = [
  { key: 'def', title: 'Defenders', size: 6 },
  { key: 'mid', title: 'Midfielders', size: 6 },
  { key: 'fwd', title: 'Forwards', size: 6 },
  { key: 'int', title: 'Interchange', size: 5 },
] as const

const POSITION_LABELS: Record<LineupSectionKey, string[]> = {
  def: ['BP', 'FB', 'BP', 'LHB', 'CHB', 'RHB'],
  mid: ['W', 'C', 'W', 'RUCK', 'FOL', 'FOL'],
  fwd: ['RHF', 'CHF', 'LHF', 'FP', 'FF', 'FP'],
  int: ['INT', 'INT', 'INT', 'INT', 'INT'],
}

const FINAL_OPTIONS = [
  'ELIMINATION FINAL',
  'QUALIFYING FINAL',
  'SEMI FINAL',
  'PRELIMINARY FINAL',
  'GRAND FINAL',
] as const

const ROUND_OPTIONS: RoundSelection[] = Array.from({ length: 30 }, (_value, index) => ({
  kind: 'round',
  label: `ROUND ${index + 1}`,
  value: index + 1,
}))

const TRIAL_OPTION: RoundSelection = {
  kind: 'trial',
  label: 'TRIAL',
  value: 106,
}

const EMPTY_SPONSOR_SLOTS = Array.from({ length: 4 }, () => null as string | null)
const POSTER_WIDTH = 1080
const POSTER_HEIGHT = 1350

function createInitialLineup(): LineupState {
  return {
    def: Array(6).fill(null),
    mid: Array(6).fill(null),
    fwd: Array(6).fill(null),
    int: Array(5).fill(null),
  }
}

function memberLabel(member: SquadMember) {
  return member.profileName || member.guestName || member.handle || 'Squad member'
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) {
    return { first: parts[0] ?? '', last: '' }
  }
  return {
    first: parts[0],
    last: parts.slice(1).join(' '),
  }
}

function sponsorStorageKey(squadId: string) {
  return `kc:web-team-selection:sponsors:${squadId}`
}

function normalizeSponsorSlots(input: unknown) {
  if (!Array.isArray(input)) return [...EMPTY_SPONSOR_SLOTS]
  return Array.from({ length: 4 }, (_value, index) => {
    const value = input[index]
    return typeof value === 'string' && value.trim() ? value : null
  })
}

function loadSponsorLogoState(squadId: string): SponsorLogoState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(sponsorStorageKey(squadId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { enabled?: unknown; slots?: unknown } | null
    if (!parsed || typeof parsed !== 'object') return null
    return {
      enabled: Boolean(parsed.enabled),
      slots: normalizeSponsorSlots(parsed.slots),
    }
  } catch {
    return null
  }
}

function saveSponsorLogoState(squadId: string, state: SponsorLogoState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    sponsorStorageKey(squadId),
    JSON.stringify({
      enabled: Boolean(state.enabled),
      slots: normalizeSponsorSlots(state.slots),
    })
  )
}

function formatStateLabel(state: StateOption | null) {
  return state?.name?.trim() || state?.code || 'Select state'
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatPosterDate(date: Date | null) {
  if (!date) return ''
  return date.toLocaleString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read image file.'))
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  })
}

async function pickImageAsDataUrl(accept = 'image/*') {
  if (typeof document === 'undefined') return null
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.style.display = 'none'
  document.body.appendChild(input)

  const result = await new Promise<string | null>((resolve) => {
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        resolve(await readFileAsDataUrl(file))
      } catch {
        resolve(null)
      }
    }
    input.click()
  })

  input.remove()
  return result
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function shiftHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const shift = (value: number) => {
    const next = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount)
    return Math.max(0, Math.min(255, Math.round(next)))
  }
  return `#${[shift(r), shift(g), shift(b)].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function accentTextColor(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 145 ? '#09111C' : '#FFFFFF'
}

function takePlayers(source: PosterPlayer[], count: number, label: string) {
  return Array.from({ length: count }, (_value, index) => {
    return (
      source.shift() ?? {
        id: `${label}-${index}`,
        name: 'Select player',
        jerseyNumber: null,
      }
    )
  })
}

function buildPosterRows(lineup: LineupState, rosterMap: Map<string, RosterPlayer>) {
  const resolvePlayers = (ids: Array<string | null>) =>
    ids
      .map((id) => (id ? rosterMap.get(id) ?? null : null))
      .filter((player): player is RosterPlayer => Boolean(player))
      .map((player) => ({
        id: player.id,
        name: player.name,
        jerseyNumber: player.jerseyNumber,
      }))

  const def = resolvePlayers(lineup.def)
  const mid = resolvePlayers(lineup.mid)
  const fwd = resolvePlayers(lineup.fwd)
  const intPlayers = resolvePlayers(lineup.int)

  return {
    main: [
      { label: 'FB', players: takePlayers([...def], 3, 'fb') },
      { label: 'HB', players: takePlayers(def.slice(3), 3, 'hb') },
      { label: 'C', players: takePlayers([...mid], 3, 'c') },
      { label: 'HF', players: takePlayers([...fwd], 3, 'hf') },
      { label: 'FF', players: takePlayers(fwd.slice(3), 3, 'ff') },
      { label: 'FOL', players: takePlayers(mid.slice(3), 3, 'fol') },
    ],
    interchangeTop: takePlayers([...intPlayers], 3, 'int-top'),
    interchangeBottom: takePlayers(intPlayers.slice(3), 2, 'int-bottom'),
  }
}

function PickerModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = 'max-w-3xl',
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center">
      <div className={`w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0B1322] shadow-[0_30px_80px_rgba(0,0,0,0.5)] ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-[0.18em] text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-slate-300 transition hover:bg-white/12 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <TeamPageIcon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

function TeamSelectionPoster({
  width,
  height,
  squadName,
  squadLogoUrl,
  opponentName,
  opponentLogoUrl,
  roundLabel,
  gradeLabel,
  venueLabel,
  matchDate,
  sponsorEnabled,
  sponsorLogos,
  accentColor,
  lineup,
  rosterMap,
}: {
  width: number
  height: number
  squadName: string
  squadLogoUrl: string | null
  opponentName: string
  opponentLogoUrl: string | null
  roundLabel: string | null
  gradeLabel: string | null
  venueLabel: string | null
  matchDate: Date | null
  sponsorEnabled: boolean
  sponsorLogos: Array<string | null>
  accentColor: string
  lineup: LineupState
  rosterMap: Map<string, RosterPlayer>
}) {
  const rows = useMemo(() => buildPosterRows(lineup, rosterMap), [lineup, rosterMap])
  const accentSoft = shiftHex(accentColor, -0.18)
  const accentHighlight = shiftHex(accentColor, 0.18)
  const pillColor = shiftHex(accentColor, -0.02)
  const panelTint = shiftHex(accentColor, -0.44)
  const matchLine = formatPosterDate(matchDate)
  const validSponsors = sponsorLogos.filter((entry): entry is string => Boolean(entry))

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.06)',
        background: `linear-gradient(145deg, ${shiftHex(accentColor, -0.78)} 0%, #07111F 38%, ${accentSoft} 100%)`,
        color: '#FFFFFF',
        padding: '26px 28px 16px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.09), transparent 35%), radial-gradient(circle at 80% 82%, rgba(255,255,255,0.08), transparent 28%)',
        }}
      />
      {squadLogoUrl ? (
        <img
          src={squadLogoUrl}
          alt=""
          style={{
            position: 'absolute',
            right: -70,
            bottom: -90,
            width: 620,
            height: 620,
            objectFit: 'contain',
            opacity: 0.07,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      ) : null}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          {roundLabel ? (
            <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, letterSpacing: '0.12em' }}>{roundLabel}</div>
          ) : null}
          {gradeLabel ? (
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 16, fontWeight: 900, letterSpacing: '0.2em' }}>{gradeLabel}</div>
          ) : null}
          {matchLine || venueLabel ? (
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>
              {[matchLine, venueLabel].filter(Boolean).join(' · ')}
            </div>
          ) : null}

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
            <div style={{ paddingLeft: 12 }}>
              <div style={{ fontSize: 56, lineHeight: 0.92, fontWeight: 950, letterSpacing: '0.04em' }}>TEAM</div>
              <div style={{ fontSize: 56, lineHeight: 0.92, fontWeight: 950, letterSpacing: '0.04em' }}>SELECTION</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PosterLogo logoUrl={squadLogoUrl} label={squadName} />
              <div style={{ fontSize: 42, fontWeight: 900 }}>X</div>
              <PosterLogo logoUrl={opponentLogoUrl} label={opponentName} />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
            {rows.main.map((row, index) => (
              <div key={row.label} style={{ display: 'grid', gap: index === rows.main.length - 1 ? 10 : 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', gap: 18 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.72)' }}>{row.label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    {row.players.map((player) => (
                      <PosterPill key={player.id} player={player} pillColor={pillColor} />
                    ))}
                  </div>
                </div>
                {index === rows.main.length - 1 ? (
                  <div
                    style={{
                      marginLeft: 72,
                      height: 1,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0))',
                    }}
                  />
                ) : null}
              </div>
            ))}

            <div style={{ display: 'grid', gap: 10, marginTop: -2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.72)' }}>INT</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                  {rows.interchangeTop.map((player) => (
                    <PosterPill key={player.id} player={player} pillColor={pillColor} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', alignItems: 'center', gap: 18 }}>
                <div />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                  {Array.from({ length: 3 }, (_value, index) => {
                    const player = rows.interchangeBottom[index] ?? null
                    if (!player) return <div key={`int-spacer-${index}`} />
                    return <PosterPill key={player.id} player={player} pillColor={pillColor} />
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {sponsorEnabled && validSponsors.length ? (
          <div
            style={{
              marginTop: 8,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 900, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.72)' }}>SPONSORS</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, validSponsors.length)}, minmax(0, 1fr))`, gap: 14 }}>
              {validSponsors.map((logo, index) => (
                <div
                  key={`${logo}-${index}`}
                  style={{
                    height: 162,
                    borderRadius: 16,
                    background: `linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03)), ${panelTint}`,
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px 16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

function TeamSelectionPosterSurface({
  posterProps,
}: {
  posterProps: React.ComponentProps<typeof TeamSelectionPoster>
}) {
  return (
    <div
      style={{
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
      }}
    >
      <TeamSelectionPoster {...posterProps} />
    </div>
  )
}

function PosterLogo({ logoUrl, label }: { logoUrl: string | null; label: string }) {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 18px 30px rgba(0,0,0,0.3)',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.16em' }}>{label.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}

function PosterPill({
  player,
  pillColor,
}: {
  player: PosterPlayer
  pillColor: string
}) {
  const { first, last } = splitName(player.name)
  const primaryText = last ? last.toUpperCase() : (first || player.name).toUpperCase()
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 70,
        display: 'grid',
        gridTemplateColumns: '44px 1fr',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: '0 12px 22px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          background: '#F3F5F7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 900,
          color: '#101521',
        }}
      >
        {player.jerseyNumber != null ? player.jerseyNumber : '—'}
      </div>
      <div
        style={{
          position: 'relative',
          background: pillColor,
          clipPath: 'polygon(0 0, 100% 0, 84% 100%, 0 100%)',
          padding: '9px 22px 9px 12px',
          display: 'grid',
          gap: 3,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, fontStyle: 'italic', color: 'rgba(255,255,255,0.94)', lineHeight: 1 }}>{first}</div>
        <div style={{ fontSize: 18, fontWeight: 900, fontStyle: 'italic', letterSpacing: '0.02em', color: '#FFFFFF', lineHeight: 1.02, textTransform: 'uppercase' }}>{primaryText}</div>
      </div>
    </div>
  )
}

function TeamSelectionSlot({
  label,
  player,
  onSelect,
  onClear,
}: {
  label: string
  player: RosterPlayer | null
  onSelect: () => void
  onClear?: () => void
}) {
  const empty = !player
  const { first, last } = splitName(player?.name ?? '')
  const primaryText = last ? last.toUpperCase() : (first || player?.name || '').toUpperCase()

  return (
    <div className="grid gap-2">
      <div className="pl-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
        className={`group relative flex min-h-[94px] items-center justify-center overflow-hidden rounded-[22px] border px-4 py-4 text-center transition duration-200 ${
          empty
            ? 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] hover:border-[#39FF88]/28 hover:shadow-[0_16px_34px_rgba(2,8,20,0.3)]'
            : 'border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] shadow-[0_18px_36px_rgba(2,8,20,0.3)] hover:border-[#39FF88]/30 hover:shadow-[0_22px_42px_rgba(2,8,20,0.36)]'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            empty
              ? 'bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.08),transparent_34%)] opacity-70'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]'
          }`}
        />
        {empty ? (
          <div className="relative z-[1] grid place-items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#39FF88]/18 bg-[#39FF88]/10 text-[#39FF88] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <TeamPageIcon name="add" className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-200">Add player</span>
          </div>
        ) : (
          <>
            {player?.jerseyNumber != null ? (
              <span className="absolute left-3 top-3 inline-flex min-h-[24px] items-center rounded-full border border-white/8 bg-black/25 px-2.5 text-[11px] font-black text-slate-300">
                #{player.jerseyNumber}
              </span>
            ) : null}
            {onClear ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onClear()
                }}
                className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-black/25 text-slate-300 transition hover:bg-black/40 hover:text-white"
                aria-label={`Clear ${label}`}
              >
                <TeamPageIcon name="close" className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <div className="relative z-[1] grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{first}</span>
              <span className="text-sm font-black uppercase tracking-[0.05em] text-white">{primaryText}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TeamSelectionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SquadDetail | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [states, setStates] = useState<StateOption[]>([])
  const [leagueOptions, setLeagueOptions] = useState<LeagueOption[]>([])
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [loadingLeagues, setLoadingLeagues] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(false)

  const [roundSelection, setRoundSelection] = useState<RoundSelection | null>(null)
  const [matchDate, setMatchDate] = useState(() => new Date())
  const [gradeText, setGradeText] = useState('')
  const [venueText, setVenueText] = useState('')
  const [selectedState, setSelectedState] = useState<StateOption | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<LeagueOption | null>(null)
  const [opponentMode, setOpponentMode] = useState<'club' | 'text'>('text')
  const [opponentText, setOpponentText] = useState('')
  const [manualOpponentLogoUrl, setManualOpponentLogoUrl] = useState<string | null>(null)
  const [opponentClub, setOpponentClub] = useState<ClubOption | null>(null)
  const [sponsorEnabled, setSponsorEnabled] = useState(false)
  const [sponsorSlots, setSponsorSlots] = useState<Array<string | null>>([...EMPTY_SPONSOR_SLOTS])
  const [accentColor, setAccentColor] = useState('#39FF88')
  const [lineup, setLineup] = useState<LineupState>(createInitialLineup)
  const [rosterSlot, setRosterSlot] = useState<RosterSlot | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerSelectedOrder, setPickerSelectedOrder] = useState<string[]>([])
  const [roundPickerOpen, setRoundPickerOpen] = useState(false)
  const [statePickerOpen, setStatePickerOpen] = useState(false)
  const [leaguePickerOpen, setLeaguePickerOpen] = useState(false)
  const [clubPickerOpen, setClubPickerOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [previewViewport, setPreviewViewport] = useState({ width: 420, height: 525 })
  const previewHostRef = useRef<HTMLDivElement | null>(null)
  const exportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        const [teamDetail, roster, allStates] = await Promise.all([
          id ? getSquadDetail(id) : Promise.resolve(null),
          id ? listSquadMembers(id) : Promise.resolve([] as SquadMember[]),
          listStates().catch(() => [] as StateOption[]),
        ])

        if (cancelled) return

        setUserId(user.id)
        setDetail(teamDetail)
        setMembers(roster)
        setStates(allStates)
        setGradeText(teamDetail?.gradeName ?? '')
        setSelectedState(
          teamDetail?.stateCode
            ? {
                code: teamDetail.stateCode,
                name: allStates.find((entry) => entry.code === teamDetail.stateCode)?.name ?? teamDetail.stateCode,
              }
            : null
        )
        setOpponentMode(teamDetail?.leagueId ? 'club' : 'text')

        if (teamDetail?.id) {
          const savedSponsors = loadSponsorLogoState(teamDetail.id)
          if (savedSponsors) {
            setSponsorEnabled(savedSponsors.enabled)
            setSponsorSlots(savedSponsors.slots)
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load team selection.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  useEffect(() => {
    let active = true
    if (!detail) return
    void resolveSquadPrimaryColor({
      primaryColorHex: detail.primaryColorHex,
      logoUrl: detail.logoUrl,
      fallbackColor: '#39FF88',
    }).then((resolved) => {
      if (active) setAccentColor(resolved)
    })
    return () => {
      active = false
    }
  }, [detail])

  useEffect(() => {
    if (!selectedState?.code) {
      setLeagueOptions([])
      setSelectedLeague(null)
      return
    }
    let cancelled = false
    setLoadingLeagues(true)
    void listLeaguesByState(selectedState.code)
      .then((data) => {
        if (cancelled) return
        setLeagueOptions(data)
        setSelectedLeague((current) => {
          if (current && data.some((league) => league.id === current.id)) return current
          if (detail?.leagueId) return data.find((league) => league.id === detail.leagueId) ?? null
          return null
        })
      })
      .catch(() => {
        if (!cancelled) setLeagueOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingLeagues(false)
      })
    return () => {
      cancelled = true
    }
  }, [detail?.leagueId, selectedState?.code])

  useEffect(() => {
    const selectedLeagueId = selectedLeague?.id ?? detail?.leagueId ?? null
    if (!selectedLeagueId) {
      setClubs([])
      return
    }
    let cancelled = false
    setLoadingClubs(true)

    ;(async () => {
      try {
        const { data: clubRows, error: clubError } = await supabase
          .from('clubs')
          .select('id,name,logo_path')
          .eq('league_id', selectedLeagueId)
          .order('name', { ascending: true })
        if (clubError) throw clubError

        const clubIds = ((clubRows ?? []) as Array<{ id: string }>).map((row) => row.id)
        let officialLogoMap = new Map<string, string | null>()
        if (clubIds.length) {
          const { data: squadRows, error: squadError } = await supabase
            .from('squads')
            .select('club_id,logo_url,is_official')
            .in('club_id', clubIds)
            .eq('is_official', true)
            .is('archived_at', null)
          if (squadError) throw squadError

          ;(squadRows ?? []).forEach((row) => {
            const clubId = (row as { club_id?: string | null }).club_id ?? null
            if (!clubId || officialLogoMap.has(clubId)) return
            officialLogoMap.set(clubId, resolveLogoPublicUrl((row as { logo_url?: string | null }).logo_url ?? null))
          })
        }

        if (cancelled) return
        setClubs(
          ((clubRows ?? []) as Array<{ id: string; name?: string | null; logo_path?: string | null }>).map((row) => ({
            id: row.id,
            name: row.name ?? 'Club',
            logoUrl: officialLogoMap.get(row.id) ?? resolveLogoPublicUrl(row.logo_path ?? null),
          }))
        )
      } catch {
        if (!cancelled) setClubs([])
      } finally {
        if (!cancelled) setLoadingClubs(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [detail?.leagueId, selectedLeague?.id])

  useEffect(() => {
    if (opponentMode === 'club' && !clubs.length && !loadingClubs) {
      setOpponentMode('text')
    }
  }, [clubs.length, loadingClubs, opponentMode])

  useEffect(() => {
    if (!detail?.id) return
    saveSponsorLogoState(detail.id, { enabled: sponsorEnabled, slots: sponsorSlots })
  }, [detail?.id, sponsorEnabled, sponsorSlots])

  useEffect(() => {
    const element = previewHostRef.current
    if (!element) return

    const updateViewport = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setPreviewViewport({ width: rect.width, height: rect.height })
      }
    }

    updateViewport()
    const frameId = window.requestAnimationFrame(updateViewport)
    window.addEventListener('resize', updateViewport)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect
        if (rect && rect.width > 0 && rect.height > 0) {
          setPreviewViewport({ width: rect.width, height: rect.height })
        }
      })
      observer.observe(element)
    }

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', updateViewport)
      observer?.disconnect()
    }
  }, [])

  const acceptedMembers = useMemo(() => members.filter((member) => member.status === 'accepted'), [members])
  const selectableMembers = useMemo(
    () =>
      acceptedMembers.filter((member) => {
        if (!member.userId && member.guestName) return true
        return (member.role ?? '').toLowerCase() === 'player'
      }),
    [acceptedMembers]
  )
  const isMemberOrOwner = useMemo(() => {
    if (!userId || !detail) return false
    if (detail.ownerId === userId) return true
    return acceptedMembers.some((member) => member.userId === userId)
  }, [acceptedMembers, detail, userId])

  const rosterPlayers = useMemo<RosterPlayer[]>(
    () =>
      selectableMembers.map((member) => ({
        id: member.id,
        name: memberLabel(member),
        handle: member.handle ? (member.handle.startsWith('@') ? member.handle : `@${member.handle}`) : null,
        jerseyNumber: member.jerseyNumber,
      })),
    [selectableMembers]
  )

  const rosterMap = useMemo(() => {
    const map = new Map<string, RosterPlayer>()
    rosterPlayers.forEach((player) => map.set(player.id, player))
    return map
  }, [rosterPlayers])

  const slotOrder = useMemo(
    () =>
      sectionsConfig.flatMap((section) =>
        Array.from({ length: section.size }, (_value, index) => ({
          section: section.key as LineupSectionKey,
          index,
        }))
      ),
    []
  )

  const assignedCount = useMemo(
    () =>
      [...lineup.def, ...lineup.mid, ...lineup.fwd, ...lineup.int].filter((value): value is string => Boolean(value)).length,
    [lineup]
  )

  const selectedOrderIds = useMemo(
    () =>
      slotOrder
        .map((slot) => lineup[slot.section][slot.index])
        .filter((entry): entry is string => Boolean(entry)),
    [lineup, slotOrder]
  )

  const isReplaceMode = Boolean(rosterSlot && assignedCount > 0)
  const slotLabels = POSITION_LABELS
  const selectionOrderLabels = useMemo(
    () => (['def', 'mid', 'fwd', 'int'] as LineupSectionKey[]).flatMap((section) => POSITION_LABELS[section]),
    []
  )

  useEffect(() => {
    if (!rosterSlot) return
    setPickerSearch('')
    setPickerSelectedOrder(
      isReplaceMode
        ? [lineup[rosterSlot.section][rosterSlot.index] ?? ''].filter(Boolean)
        : selectedOrderIds
    )
  }, [isReplaceMode, lineup, rosterSlot, selectedOrderIds])

  const filteredPlayers = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase()
    if (!query) return rosterPlayers
    return rosterPlayers.filter((player) => {
      const name = player.name.toLowerCase()
      const handle = (player.handle ?? '').toLowerCase()
      const number = player.jerseyNumber != null ? String(player.jerseyNumber) : ''
      return name.includes(query) || handle.includes(query) || number === query
    })
  }, [pickerSearch, rosterPlayers])

  const lockedIds = useMemo(() => {
    if (!rosterSlot || !isReplaceMode) return new Set<string>()
    return new Set(
      selectedOrderIds.filter((entry) => entry !== lineup[rosterSlot.section][rosterSlot.index])
    )
  }, [isReplaceMode, lineup, rosterSlot, selectedOrderIds])
  const opponentName =
    opponentMode === 'club'
      ? opponentClub?.name ?? (clubs.length ? 'Select opponent' : 'Opponent')
      : opponentText.trim() || 'Opponent'
  const opponentLogoUrl =
    opponentMode === 'club' ? opponentClub?.logoUrl ?? null : manualOpponentLogoUrl ?? null

  const posterProps = useMemo(
    () => ({
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      squadName: detail?.name ?? 'Squad',
      squadLogoUrl: detail?.logoUrl ?? null,
      opponentName,
      opponentLogoUrl,
      roundLabel: roundSelection?.label ?? null,
      gradeLabel: gradeText.trim() || null,
      venueLabel: venueText.trim() || null,
      matchDate,
      sponsorEnabled,
      sponsorLogos: sponsorSlots,
      accentColor,
      lineup,
      rosterMap,
    }),
    [
      accentColor,
      detail?.logoUrl,
      detail?.name,
      gradeText,
      lineup,
      matchDate,
      opponentLogoUrl,
      opponentName,
      roundSelection?.label,
      rosterMap,
      sponsorEnabled,
      sponsorSlots,
      venueText,
    ]
  )
  const visiblePreviewScale = Math.min(
    previewViewport.width / POSTER_WIDTH,
    previewViewport.height / POSTER_HEIGHT
  )

  async function handlePickOpponentLogo() {
    const dataUrl = await pickImageAsDataUrl()
    if (dataUrl) setManualOpponentLogoUrl(dataUrl)
  }

  async function handlePickSponsorLogo(index: number) {
    const dataUrl = await pickImageAsDataUrl()
    if (!dataUrl) return
    setSponsorSlots((current) => {
      const next = [...current]
      next[index] = dataUrl
      return next
    })
  }

  function handleApplySelection() {
    if (!rosterSlot) return
    if (!pickerSelectedOrder.length) return

    if (isReplaceMode) {
      const nextPlayerId = pickerSelectedOrder[0]
      if (!nextPlayerId) return
      setLineup((current) => {
        const next = { ...current, [rosterSlot.section]: [...current[rosterSlot.section]] }
        next[rosterSlot.section][rosterSlot.index] = nextPlayerId
        return next
      })
      setRosterSlot(null)
      return
    }

    setLineup(() => {
      const next = createInitialLineup()
      pickerSelectedOrder.forEach((playerId, index) => {
        const slot = slotOrder[index]
        if (!slot) return
        next[slot.section][slot.index] = playerId
      })
      return next
    })
    setRosterSlot(null)
  }

  async function handleExportImage() {
    if (!exportRef.current) {
      setExportError('Poster surface is still rendering. Try again in a moment.')
      return
    }
    if (!roundSelection) {
      setExportError('Select a round, final, or trial before exporting.')
      return
    }

    setExportError(null)
    setExporting(true)
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        scale: 1,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `${(detail?.name ?? 'team-selection').replace(/\s+/g, '-').toLowerCase()}-${roundSelection.label
        .replace(/\s+/g, '-')
        .toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (captureError) {
      setExportError(captureError instanceof Error ? captureError.message : 'Unable to export image right now.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading team selection…</main>
  }

  if (error || !detail) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Team selection unavailable.'}</p>
      </PortalCard>
    )
  }

  if (!isMemberOrOwner) {
    return (
      <PortalCard title="Team Selection" subtitle="Owner and accepted direct squad members only" className="teams-section-card">
        <div className="grid gap-3">
          <p className="text-sm text-slate-300">
            This lineup editor is restricted to the squad owner and accepted direct squad members. Followers and club-role-only access do not unlock team selection.
          </p>
          <div>
            <Link to={`/teams/${detail.id}`} className="teams-action-chip inline-flex">
              Back to Team
            </Link>
          </div>
        </div>
      </PortalCard>
    )
  }

  return (
    <>
      <section className="teams-stage team-selection-workspace grid gap-5 xl:gap-6">
        <section className="teams-header-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <Link to={`/teams/${detail.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
                <TeamPageIcon name="arrow-back" className="h-4 w-4" />
                Back to Team
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="teams-kicker">Team Selection</p>
                <span className="inline-flex items-center rounded-full border border-[#39FF88]/18 bg-[#39FF88]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#A8FFD0]">
                  Live Preview
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <h2 className="teams-title-display text-3xl font-black text-white sm:text-[2.6rem]">{detail.name || 'Team'}</h2>
                <span className="pb-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#39FF88] shadow-[0_0_12px_rgba(57,255,136,0.5)]" />
              Poster sync
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(320px,0.8fr)] 2xl:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.84fr)] 2xl:gap-6">
          <div className="grid gap-4 xl:gap-5">
            <PortalCard title="Match Details" subtitle="Round, venue, opponent, sponsors" className="teams-section-card team-selection-editor-card !rounded-[32px] !p-5 sm:!p-6">
              <div className="grid gap-5">
                <div className="grid gap-4 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_30px_rgba(2,8,20,0.2)]">
                  <div className="grid gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Round</label>
                    <button
                      type="button"
                      onClick={() => setRoundPickerOpen(true)}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-left transition hover:border-[#39FF88]/35"
                    >
                      <span className="text-sm font-semibold text-white">{roundSelection?.label ?? 'Select round, final, or trial'}</span>
                      <TeamPageIcon name="chevron-down" className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Date</span>
                      <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-slate-200">
                          <TeamPageIcon name="calendar-outline" className="h-4 w-4" />
                        </span>
                        <input
                          type="date"
                          value={matchDate.toISOString().slice(0, 10)}
                          onChange={(event) => {
                            const [year, month, day] = event.target.value.split('-').map(Number)
                            if (!year || !month || !day) return
                            setMatchDate((current) => {
                              const next = new Date(current)
                              next.setFullYear(year, month - 1, day)
                              return next
                            })
                          }}
                          className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                        />
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Time</span>
                      <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-slate-200">
                          <TeamPageIcon name="time-outline" className="h-4 w-4" />
                        </span>
                        <input
                          type="time"
                          value={`${String(matchDate.getHours()).padStart(2, '0')}:${String(matchDate.getMinutes()).padStart(2, '0')}`}
                          onChange={(event) => {
                            const [hours, minutes] = event.target.value.split(':').map(Number)
                            if (Number.isNaN(hours) || Number.isNaN(minutes)) return
                            setMatchDate((current) => {
                              const next = new Date(current)
                              next.setHours(hours, minutes, 0, 0)
                              return next
                            })
                          }}
                          className="w-full bg-transparent text-sm font-semibold text-white outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Grade</span>
                      <input
                        value={gradeText}
                        onChange={(event) => setGradeText(event.target.value)}
                        placeholder="A Grade / U18 / Div 1"
                        className="rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Venue</span>
                      <input
                        value={venueText}
                        onChange={(event) => setVenueText(event.target.value)}
                        placeholder="Marvel Stadium"
                        className="rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_30px_rgba(2,8,20,0.2)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Opponent</div>
                      <div className="mt-1 text-sm font-semibold text-white">{opponentMode === 'club' ? 'Club mode' : 'Manual mode'}</div>
                    </div>
                    <div className="inline-flex rounded-full border border-white/10 bg-[#111C2F] p-1">
                      <button
                        type="button"
                        disabled={!clubs.length && !selectedLeague && !detail.leagueId}
                        onClick={() => setOpponentMode('club')}
                        className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                          opponentMode === 'club'
                            ? 'bg-[#39FF88] text-[#09111C]'
                            : 'text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
                        }`}
                      >
                        Club
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpponentMode('text')}
                        className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                          opponentMode === 'text' ? 'bg-[#39FF88] text-[#09111C]' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Text
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => setStatePickerOpen(true)}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-left"
                    >
                      <span className="text-sm font-semibold text-white">{formatStateLabel(selectedState)}</span>
                      <TeamPageIcon name="chevron-down" className="h-4 w-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      disabled={!selectedState?.code}
                      onClick={() => setLeaguePickerOpen(true)}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-left disabled:opacity-50"
                    >
                      <span className="text-sm font-semibold text-white">
                        {selectedLeague?.shortName ?? selectedLeague?.name ?? (selectedState?.code ? 'Select league' : 'Select state first')}
                      </span>
                      <TeamPageIcon name="chevron-down" className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  {opponentMode === 'club' ? (
                    <button
                      type="button"
                      onClick={() => setClubPickerOpen(true)}
                      disabled={loadingClubs || !clubs.length}
                      className="flex items-center justify-between rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-left disabled:opacity-50"
                    >
                      <span className="text-sm font-semibold text-white">
                        {opponentClub?.name ??
                          (loadingClubs ? 'Loading clubs…' : clubs.length ? 'Select opponent club' : 'Select a league to browse opponents')}
                      </span>
                      <TeamPageIcon name="chevron-down" className="h-4 w-4 text-slate-400" />
                    </button>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_176px]">
                      <input
                        value={opponentText}
                        onChange={(event) => setOpponentText(event.target.value)}
                        placeholder="Opponent name"
                        className="rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3.5 text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={() => void handlePickOpponentLogo()}
                        className="relative flex min-h-[110px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[#111C2F] p-4"
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.08),transparent_36%)]" />
                        {manualOpponentLogoUrl ? (
                          <img src={manualOpponentLogoUrl} alt="Opponent logo" className="relative z-[1] h-full w-full object-contain" />
                        ) : (
                          <div className="relative z-[1] grid place-items-center gap-2 text-slate-400">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6">
                              <TeamPageIcon name="add" className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-semibold">Add logo</span>
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_30px_rgba(2,8,20,0.2)]">
                  <button
                    type="button"
                    onClick={() => setSponsorEnabled((current) => !current)}
                    className={`flex items-center justify-between gap-4 rounded-[18px] border px-4 py-4 text-left transition ${
                      sponsorEnabled ? 'border-[#39FF88]/35 bg-[#39FF88]/8' : 'border-white/10 bg-[#111C2F]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.18em] text-white">Sponsors</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">4 logo slots on poster</div>
                    </div>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${sponsorEnabled ? 'bg-[#39FF88]/18 text-[#39FF88]' : 'bg-white/6 text-slate-500'}`}>
                      {sponsorEnabled ? <TeamPageIcon name="checkmark" className="h-4 w-4" /> : null}
                    </span>
                  </button>

                  {sponsorEnabled ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: 4 }, (_value, index) => {
                        const logo = sponsorSlots[index] ?? null
                        return (
                          <div
                            key={`sponsor-slot-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => void handlePickSponsorLogo(index)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                void handlePickSponsorLogo(index)
                              }
                            }}
                            className="relative flex min-h-[112px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-[#111C2F] p-4"
                          >
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.08),transparent_36%)]" />
                            {logo ? (
                              <>
                                <img src={logo} alt={`Sponsor ${index + 1}`} className="relative z-[1] h-full w-full object-contain" />
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSponsorSlots((current) => {
                                      const next = [...current]
                                      next[index] = null
                                      return next
                                    })
                                  }}
                                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white"
                                  aria-label={`Remove sponsor ${index + 1}`}
                                >
                                  <TeamPageIcon name="close" className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="relative z-[1] grid place-items-center gap-2 text-slate-400">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/6">
                                  <TeamPageIcon name="add" className="h-4 w-4" />
                                </span>
                                <span className="text-sm font-semibold">Logo</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </PortalCard>

            <PortalCard title="Lineup Builder" subtitle="DEF 6 · MID 6 · FWD 6 · INT 5" className="teams-section-card team-selection-editor-card !rounded-[32px] !p-5 sm:!p-6">
              <div className="grid gap-4 xl:gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <span className="text-[#39FF88]">{assignedCount}</span>
                    slots filled
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Select any slot to open the player picker</span>
                    <button
                      type="button"
                      onClick={() => setLineup(createInitialLineup())}
                      className="teams-action-chip"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 xl:gap-5">
                  {sectionsConfig.map((section) => (
                    <div key={section.key} className="grid gap-3 rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.07),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_34px_rgba(2,8,20,0.22)]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black uppercase tracking-[0.22em] text-slate-300">{section.title}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{lineup[section.key].filter(Boolean).length}/{section.size}</div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {lineup[section.key].map((playerId, index) => {
                          const player = playerId ? rosterMap.get(playerId) ?? null : null
                          return (
                            <TeamSelectionSlot
                              key={`${section.key}-${index}`}
                              label={slotLabels[section.key][index]}
                              player={player}
                              onSelect={() => setRosterSlot({ section: section.key, index })}
                              onClear={player ? () => setLineup((current) => {
                                const next = { ...current, [section.key]: [...current[section.key]] }
                                next[section.key][index] = null
                                return next
                              }) : undefined}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PortalCard>
          </div>

          <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <div className="team-selection-preview-shell relative overflow-hidden rounded-[36px] p-3.5 xl:p-4">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_30%)]" />
              <div className="relative grid gap-4 rounded-[30px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_40px_rgba(2,8,20,0.3)]">
                <div className="grid gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9CE8BE]">Output Workspace</div>
                      <h3 className="mt-1.5 text-[1.85rem] font-black uppercase tracking-[-0.04em] text-white">Preview</h3>
                      <p className="mt-1.5 max-w-[30ch] text-sm leading-6 text-slate-400">Live poster preview with export-ready proportions.</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                      {assignedCount}/23 selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleExportImage()}
                    disabled={exporting}
                    className="inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[20px] bg-[#39FF88] px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#09111C] shadow-[0_18px_34px_rgba(57,255,136,0.24)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <TeamPageIcon name="share" className="h-4.5 w-4.5" />
                      {exporting ? 'Exporting Poster…' : 'Export Poster PNG'}
                    </button>
                </div>

                <div
                  ref={previewHostRef}
                  className="relative aspect-[1080/1350] w-full overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,#132135,#0A111D)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_26px_54px_rgba(1,7,18,0.42)]"
                >
                  <div
                    style={{
                      width: POSTER_WIDTH,
                      height: POSTER_HEIGHT,
                      transformOrigin: 'top left',
                      transform: `scale(${visiblePreviewScale})`,
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      marginLeft: `${-(POSTER_WIDTH * visiblePreviewScale) / 2}px`,
                      marginTop: `${-(POSTER_HEIGHT * visiblePreviewScale) / 2}px`,
                    }}
                  >
                    <TeamSelectionPosterSurface posterProps={posterProps} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm leading-6 text-slate-400">
                  <span>PNG export uses this same poster layout and proportions.</span>
                  <span>{!roundSelection ? 'Select a round before exporting.' : 'Ready to export.'}</span>
                </div>

                {exportError ? <p className="text-sm text-amber-300">{exportError}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed -left-[5000px] top-0 opacity-0">
        <div ref={exportRef}>
          <TeamSelectionPosterSurface posterProps={posterProps} />
        </div>
      </div>

      <PickerModal
        open={Boolean(rosterSlot)}
        onClose={() => setRosterSlot(null)}
        title="Select Players"
        subtitle={
          isReplaceMode
            ? `Select player for ${rosterSlot ? slotLabels[rosterSlot.section][rosterSlot.index] : 'slot'}.`
            : 'Pick your lineup in order from BP onwards.'
        }
        maxWidth="max-w-5xl"
      >
        <div className="grid gap-5">
          <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-[#111C2F] px-4 py-3">
            <TeamPageIcon name="person-search" className="h-4 w-4 text-slate-400" />
            <input
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search name, handle, or exact number"
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPlayers.length ? (
              filteredPlayers.map((player) => {
                const selectedIndex = pickerSelectedOrder.indexOf(player.id)
                const isSelected = selectedIndex >= 0
                const isLocked = lockedIds.has(player.id) && !isSelected
                const positionLabel = isSelected
                  ? (isReplaceMode
                      ? slotLabels[rosterSlot!.section][rosterSlot!.index]
                      : selectionOrderLabels[Math.min(selectedIndex, selectionOrderLabels.length - 1)])
                  : null
                return (
                  <button
                    key={player.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return
                      setPickerSelectedOrder((current) => {
                        const existingIndex = current.indexOf(player.id)
                        if (existingIndex >= 0) return current.filter((entry) => entry !== player.id)
                        if (isReplaceMode) return [player.id]
                        if (current.length >= selectionOrderLabels.length) return current
                        return [...current, player.id]
                      })
                    }}
                    className={`grid min-h-[110px] gap-2 rounded-[18px] border px-4 py-4 text-center transition ${
                      isSelected
                        ? 'border-[#39FF88]/45 bg-[#39FF88] text-[#09111C]'
                        : isLocked
                        ? 'cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500 opacity-50'
                        : 'border-white/10 bg-[#111C2F] text-white hover:border-[#39FF88]/35'
                    }`}
                  >
                    <div className="text-xs font-black uppercase tracking-[0.18em]">
                      {player.jerseyNumber != null ? `#${player.jerseyNumber}` : '—'}
                    </div>
                    <div className="text-sm font-black uppercase tracking-[0.04em]">{player.name}</div>
                    <div className="text-xs font-semibold">{player.handle || 'No handle'}</div>
                    {isLocked ? (
                      <span className="inline-flex items-center justify-center gap-1 text-xs font-black uppercase tracking-[0.18em]">
                        Used
                      </span>
                    ) : positionLabel ? (
                      <span className="inline-flex items-center justify-center gap-1 text-xs font-black uppercase tracking-[0.18em]">
                        <TeamPageIcon name="checkmark-circle" className="h-4 w-4" />
                        {positionLabel}
                      </span>
                    ) : null}
                  </button>
                )
              })
            ) : (
              <div className="col-span-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                No players found. Search by name, handle, or exact jersey number.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="text-sm text-slate-400">
              {isReplaceMode
                ? 'Already-used players are locked while replacing a filled slot.'
                : `${pickerSelectedOrder.length} selected. Initial bulk fill runs in slot order from BP onward.`}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRosterSlot(null)} className="teams-action-chip">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplySelection}
                disabled={!pickerSelectedOrder.length}
                className="inline-flex items-center gap-2 rounded-full bg-[#39FF88] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#09111C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isReplaceMode ? 'Assign Player' : 'Apply Selection'}
              </button>
            </div>
          </div>
        </div>
      </PickerModal>

      <PickerModal open={roundPickerOpen} onClose={() => setRoundPickerOpen(false)} title="Choose Round" subtitle="Rounds, finals, and trial match options mirror mobile.">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Rounds</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROUND_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setRoundSelection(option)
                    setRoundPickerOpen(false)
                  }}
                  className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-left ${
                    roundSelection?.label === option.label ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  {roundSelection?.label === option.label ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Finals</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FINAL_OPTIONS.map((label, index) => {
                const option = { kind: 'final' as const, label, value: 101 + index }
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setRoundSelection(option)
                      setRoundPickerOpen(false)
                    }}
                    className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-left ${
                      roundSelection?.label === label ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
                    }`}
                  >
                    <span className="text-sm font-semibold">{label}</span>
                    {roundSelection?.label === label ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRoundSelection(TRIAL_OPTION)
              setRoundPickerOpen(false)
            }}
            className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-left ${
              roundSelection?.label === TRIAL_OPTION.label ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
            }`}
          >
            <span className="text-sm font-semibold">{TRIAL_OPTION.label}</span>
            {roundSelection?.label === TRIAL_OPTION.label ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
          </button>
        </div>
      </PickerModal>

      <PickerModal open={statePickerOpen} onClose={() => setStatePickerOpen(false)} title="Choose State">
        <div className="grid gap-2">
          {states.map((state) => {
            const active = selectedState?.code === state.code
            return (
              <button
                key={state.code}
                type="button"
                onClick={() => {
                  setSelectedState(state)
                  setSelectedLeague(null)
                  setOpponentClub(null)
                  setStatePickerOpen(false)
                }}
                className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-left ${
                  active ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
                }`}
              >
                <span className="text-sm font-semibold">{state.name || state.code}</span>
                {active ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
              </button>
            )
          })}
        </div>
      </PickerModal>

      <PickerModal open={leaguePickerOpen} onClose={() => setLeaguePickerOpen(false)} title="Choose League">
        <div className="grid gap-2">
          {loadingLeagues ? (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">Loading leagues…</div>
          ) : leagueOptions.length ? (
            leagueOptions.map((league) => {
              const active = selectedLeague?.id === league.id
              return (
                <button
                  key={league.id}
                  type="button"
                  onClick={() => {
                    setSelectedLeague(league)
                    setOpponentClub(null)
                    setLeaguePickerOpen(false)
                  }}
                  className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-left ${
                    active ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">{league.shortName ?? league.name ?? 'League'}</span>
                  {active ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
                </button>
              )
            })
          ) : (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">No leagues available for this state.</div>
          )}
        </div>
      </PickerModal>

      <PickerModal open={clubPickerOpen} onClose={() => setClubPickerOpen(false)} title="Choose Opponent Club">
        <div className="grid gap-2">
          {loadingClubs ? (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">Loading clubs…</div>
          ) : clubs.length ? (
            clubs.map((club) => {
              const active = opponentClub?.id === club.id
              return (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => {
                    setOpponentClub(club)
                    setOpponentMode('club')
                    setClubPickerOpen(false)
                  }}
                  className={`flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left ${
                    active ? 'border-[#39FF88]/45 bg-[#39FF88]/10 text-white' : 'border-white/10 bg-[#111C2F] text-slate-200'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/8">
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-black uppercase">{club.name.slice(0, 2)}</span>
                      )}
                    </span>
                    <span className="truncate text-sm font-semibold">{club.name}</span>
                  </span>
                  {active ? <TeamPageIcon name="checkmark-circle" className="h-4 w-4 text-[#39FF88]" /> : null}
                </button>
              )
            })
          ) : (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">No clubs available for the selected league.</div>
          )}
        </div>
      </PickerModal>
    </>
  )
}
