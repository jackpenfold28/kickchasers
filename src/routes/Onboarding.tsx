import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Instagram,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Share2,
  Star,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { resolveLogoPublicUrl } from '@/lib/logo-storage'
import { supabase } from '@/lib/supabase'
import {
  ONBOARDING_ROLE_OPTIONS,
  ONBOARDING_STEPS,
  POSITION_OPTIONS,
  finishOnboarding,
  formatDateInput,
  formatDobForDisplay,
  formatDobForStorage,
  getProfileCompletion,
  isProfileComplete,
  parseDobInput,
  resolveAvatarUrl,
  roleArrayFromProfile,
  uploadOnboardingImage,
  validateDob,
  validateHandle,
  type OnboardingPosition,
  type OnboardingRole,
  type OnboardingStepKey,
} from '@/lib/onboarding'

type StateRow = {
  code: string
  name: string | null
}

type LeagueRow = {
  id: string
  name: string | null
  short_name: string | null
  state_code: string | null
  logo_path: string | null
  logoUrl: string | null
}

type ClubRow = {
  id: string
  name: string | null
  league_id: string | null
  logo_path: string | null
  logoUrl: string | null
}

type OfficialSquadLogoRow = {
  club_id: string | null
  logo_url: string | null
}

type ProfileRow = {
  name: string | null
  handle: string | null
  primary_role: string | null
  game_day_roles: string[] | null
  home_state_code: string | null
  home_league_id: string | null
  home_club_id: string | null
  avatar_url: string | null
  avatar_path: string | null
  action_photo_url: string | null
  action_photo_path: string | null
  player_position: string | null
  player_number: number | null
  dob: string | null
  onboarding_completed_at: string | null
}

const STEP_META: Array<{ key: OnboardingStepKey; title: string; subtitle: string }> = [
  { key: 'welcome', title: 'Welcome', subtitle: 'KickChasers setup starts here.' },
  { key: 'personal', title: 'Personal Details', subtitle: 'Name, handle, and date of birth.' },
  { key: 'profile-photo', title: 'Profile Photo', subtitle: 'Optional avatar for your profile.' },
  { key: 'action-card', title: 'Action Card', subtitle: 'Optional action photo for your profile.' },
  { key: 'club', title: 'Club', subtitle: 'Pick the official state, league, and club.' },
  { key: 'role', title: 'Role', subtitle: 'Choose your game-day roles and player details.' },
] as const

const STEP_ICON_SRC: Partial<Record<OnboardingStepKey, string>> = {
  welcome: '/assets/icons/afl/postsc.svg',
  personal: '/assets/icons/afl/player.svg',
}

const ROLE_ICON_SRC: Record<OnboardingRole, string> = {
  player: '/assets/icons/afl/jumper1.svg',
  coach: '/assets/icons/afl/tactic.svg',
  tracker: '/assets/icons/afl/scoreboard.svg',
  member: '/assets/icons/afl/MCG.svg',
}

const ACCENT_ICON_FILTER =
  'drop-shadow(0 0 18px rgba(57,255,136,0.26)) brightness(0) saturate(100%) invert(89%) sepia(43%) saturate(3707%) hue-rotate(74deg) brightness(104%) contrast(102%)'

const ONBOARDING_CARD_CLASS =
  'relative overflow-hidden rounded-[34px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(11,20,38,0.95)_20%,rgba(5,13,28,0.98))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_20px_56px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8 lg:p-9 xl:px-10 xl:py-10'

const ONBOARDING_PANEL_CLASS =
  'rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(13,21,38,0.88)_26%,rgba(9,16,30,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

const ONBOARDING_SUBTLE_PANEL_CLASS =
  'rounded-[22px] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'

function splitName(name: string | null) {
  const normalized = (name || '').trim()
  if (!normalized) return { firstName: '', lastName: '' }
  const parts = normalized.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

function toggleRole(list: OnboardingRole[], role: OnboardingRole): OnboardingRole[] {
  return list.includes(role) ? list.filter((item) => item !== role) : [...list, role]
}

function parseStoredDob(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getPersonalStepError(args: {
  firstName: string
  lastName: string
  handleInput: string
  checkingHandle: boolean
  handleAvailable: boolean | null
  dob: Date | null
}) {
  const handleValidation = validateHandle(args.handleInput)
  const dobValidation = validateDob(args.dob)
  if (!args.firstName.trim()) return 'First name is required.'
  if (!args.lastName.trim()) return 'Last name is required.'
  if (handleValidation.error) return handleValidation.error
  if (args.checkingHandle) return 'Checking handle availability.'
  if (args.handleAvailable === false) return 'Handle already taken.'
  if (args.handleAvailable !== true) return 'Choose an available handle.'
  if (dobValidation) return dobValidation
  return null
}

function getPhotoStepError(args: {
  uploading: boolean
  url: string | null
  path: string | null
  label: 'Profile' | 'Action'
}) {
  if (args.uploading) return `${args.label} photo upload is still in progress.`
  if ((args.url || args.path) && !args.path) return `${args.label} photo upload did not finish.`
  return null
}

function getClubStepError(args: {
  selectedStateCode: string
  selectedLeagueId: string
  selectedClubId: string
}) {
  if (!args.selectedStateCode || !args.selectedLeagueId || !args.selectedClubId) {
    return 'State, league, and club are required.'
  }
  return null
}

function getRoleStepError(args: {
  selectedRoles: OnboardingRole[]
  playerPosition: OnboardingPosition | null
  playerNumber: string
}) {
  if (!args.selectedRoles.length) return 'Select at least one role to continue.'
  if (!args.selectedRoles.includes('player')) return null
  if (!args.playerPosition) return 'Position is required for players.'
  if (!args.playerNumber) return 'Jersey number is required for players.'
  const parsed = Number(args.playerNumber)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
    return 'Jersey number must be an integer between 0 and 999.'
  }
  return null
}

type SelectorFieldProps = {
  label: string
  value: string | null
  placeholder: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
}

function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {ONBOARDING_STEPS.map((step, index) => (
        <span
          key={step}
          className={`block h-2.5 rounded-full transition-all duration-300 ${
            index === activeIndex ? 'w-7 bg-[#39FF88]' : 'w-2.5 bg-white/18'
          }`}
        />
      ))}
    </div>
  )
}

function SurfaceField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string | null
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2.5 text-left">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </label>
  )
}

function AccentIconBadge({
  src,
  alt = '',
  iconClassName,
  frameClassName,
}: {
  src: string
  alt?: string
  iconClassName?: string
  frameClassName?: string
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-[28px] border border-[#39FF88]/12 bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.18),rgba(57,255,136,0)_52%),linear-gradient(180deg,#121c31_0%,#0b1324_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${frameClassName || ''}`}
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[27px] border border-white/6" />
      <img src={src} alt={alt} className={`relative ${iconClassName || ''}`} style={{ filter: ACCENT_ICON_FILTER }} />
    </div>
  )
}

function ActionCardPreview({
  actionPhotoUrl,
  uploadingActionPhoto,
  playerName,
}: {
  actionPhotoUrl: string | null
  uploadingActionPhoto: boolean
  playerName: string
}) {
  return (
    <div className="mx-auto w-full max-w-[540px]">
      <div className="overflow-hidden rounded-[30px] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-t-[30px] bg-[#0A1222]"
          style={{
            backgroundImage: actionPhotoUrl ? `url(${actionPhotoUrl})` : 'linear-gradient(180deg,#15233C 0%, #0A1222 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,19,0.06)_0%,rgba(3,8,19,0.3)_36%,rgba(3,8,19,0.78)_74%,rgba(3,8,19,0.94)_100%)]" />

          <div className="absolute right-0 top-0 h-[132px] w-[132px] overflow-hidden">
            <div className="absolute inset-0 origin-top-right bg-[linear-gradient(135deg,#2CFF7A_0%,#39FF88_42%,#11834A_100%)] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
            <div className="absolute right-4 top-3 flex flex-col items-end text-[#06111B]">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]">RATING</span>
              </div>
              <span className="mt-1 text-[28px] font-black italic leading-none">8.4</span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16">
            <div className="grid grid-cols-3 gap-2 text-white">
              {[
                ['24', 'Disposals'],
                ['3', 'Goals'],
                ['9', 'Marks'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <p className="text-[42px] font-black italic leading-none tracking-[-0.04em] sm:text-[46px]">{value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-white/92">Fresh season. Fresh card.</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{playerName}</p>
                  <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
                    Round 7 • Rivals FC • 12 Mar 2026
                  </p>
                </div>
                <img
                  src="/assets/onboarding/eastern-vipers-logo.jpeg"
                  alt="Eastern Vipers"
                  className="h-12 w-12 shrink-0 rounded-[14px] object-cover shadow-[0_10px_22px_rgba(0,0,0,0.32)]"
                />
              </div>
            </div>
          </div>

          {!actionPhotoUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#07111E]/86 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
                <Plus className="h-9 w-9 text-[#39FF88]" />
              </div>
            </div>
          ) : null}

          {uploadingActionPhoto ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <Loader2 className="h-7 w-7 animate-spin text-[#39FF88]" />
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-b-[30px] bg-[linear-gradient(180deg,#0D1526_0%,#09111F_100%)] px-5 py-4 text-slate-200">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2 text-sm">
              <img src="/assets/icons/afl/filltopfootball.svg" alt="" className="h-4 w-4" style={{ filter: ACCENT_ICON_FILTER }} />
              42
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              8
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4" />
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm">
            <Instagram className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  )
}

function SelectorField({ label, value, placeholder, onPress, disabled, loading }: SelectorFieldProps) {
  return (
    <SurfaceField label={label}>
      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        className={`flex min-h-[60px] w-full items-center justify-between rounded-[22px] bg-[#0D1526] px-4 text-left transition ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-[#111B33]'
        } border border-white/6`}
      >
        <span className={`truncate text-[15px] ${value ? 'text-slate-50' : 'text-slate-500'}`}>{value || placeholder}</span>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#39FF88]" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
    </SurfaceField>
  )
}

function SheetModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 pb-4 pt-10 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 flex max-h-[78vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[30px] border border-[#39FF88]/14 bg-[#111B33] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-3 pb-3">{children}</div>
      </div>
    </div>
  )
}

function OptionRow({
  title,
  subtitle,
  meta,
  logoUrl,
  selected,
  onPress,
}: {
  title: string
  subtitle?: string | null
  meta?: string | null
  logoUrl?: string | null
  selected?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`mb-2 flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left transition ${
        selected ? 'bg-[#39FF88]/14 text-white ring-1 ring-[#39FF88]/35' : 'bg-[#0D1526] text-slate-200 hover:bg-[#101c31]'
      }`}
    >
      {logoUrl ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
          <img src={logoUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle ? <p className="truncate text-xs text-slate-400">{subtitle}</p> : null}
        {meta ? <p className="truncate text-[11px] uppercase tracking-[0.16em] text-slate-500">{meta}</p> : null}
      </div>
      {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#39FF88]" /> : null}
    </button>
  )
}

function shapeLeagueRows(rows: Array<{ id: string; name: string | null; short_name: string | null; state_code: string | null; logo_path: string | null }>): LeagueRow[] {
  return rows.map((row) => ({
    ...row,
    logoUrl: resolveLogoPublicUrl(row.logo_path),
  }))
}

function shapeClubRows(
  rows: Array<{ id: string; name: string | null; league_id: string | null; logo_path: string | null }>,
  officialSquadLogos: OfficialSquadLogoRow[]
): ClubRow[] {
  const squadLogoByClubId = new Map<string, string | null>()

  for (const row of officialSquadLogos) {
    if (!row.club_id || squadLogoByClubId.has(row.club_id)) continue
    squadLogoByClubId.set(row.club_id, resolveLogoPublicUrl(row.logo_url))
  }

  return rows.map((row) => ({
    ...row,
    logoUrl: squadLogoByClubId.get(row.id) ?? resolveLogoPublicUrl(row.logo_path),
  }))
}

async function loadOfficialSquadLogoRows(clubIds: string[]): Promise<OfficialSquadLogoRow[]> {
  if (!clubIds.length) return []
  const { data, error } = await supabase
    .from('squads')
    .select('club_id,logo_url')
    .in('club_id', clubIds)
    .eq('is_official', true)
    .is('archived_at', null)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []) as OfficialSquadLogoRow[]
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const editMode = query.get('edit') === '1' || query.get('mode') === 'edit'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(editMode ? 1 : 0)
  const [profileAlreadyComplete, setProfileAlreadyComplete] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [handleInput, setHandleInput] = useState('')
  const [handleError, setHandleError] = useState<string | null>(null)
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [checkingHandle, setCheckingHandle] = useState(false)
  const [dobInput, setDobInput] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [dobError, setDobError] = useState<string | null>(null)

  const [selectedStateCode, setSelectedStateCode] = useState('')
  const [selectedLeagueId, setSelectedLeagueId] = useState('')
  const [selectedClubId, setSelectedClubId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<OnboardingRole[]>([])
  const [lockedAdminRole, setLockedAdminRole] = useState(false)
  const [playerPosition, setPlayerPosition] = useState<OnboardingPosition | null>(null)
  const [playerNumber, setPlayerNumber] = useState('')
  const [playerNumberError, setPlayerNumberError] = useState<string | null>(null)

  const [states, setStates] = useState<StateRow[]>([])
  const [leagues, setLeagues] = useState<LeagueRow[]>([])
  const [clubs, setClubs] = useState<ClubRow[]>([])
  const [activeSheet, setActiveSheet] = useState<'state' | 'league' | 'club' | 'position' | null>(null)
  const [leagueFilter, setLeagueFilter] = useState('')
  const [clubFilter, setClubFilter] = useState('')
  const [loadingLeagues, setLoadingLeagues] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(false)

  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [actionPhotoPath, setActionPhotoPath] = useState<string | null>(null)
  const [actionPhotoUrl, setActionPhotoUrl] = useState<string | null>(null)
  const [uploadingActionPhoto, setUploadingActionPhoto] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentStep = ONBOARDING_STEPS[stepIndex]
  const selectedStateName = states.find((state) => state.code === selectedStateCode)?.name || selectedStateCode
  const selectedLeagueName = leagues.find((league) => league.id === selectedLeagueId)?.name || ''

  const filteredLeagues = useMemo(() => {
    const input = leagueFilter.trim().toLowerCase()
    return leagues.filter((league) => (!input ? true : (league.name || '').toLowerCase().includes(input)))
  }, [leagueFilter, leagues])

  const filteredClubs = useMemo(() => {
    const input = clubFilter.trim().toLowerCase()
    return clubs.filter((club) => (!input ? true : (club.name || '').toLowerCase().includes(input)))
  }, [clubFilter, clubs])

  useEffect(() => {
    let cancelled = false

    async function loadLeaguesForState(stateCode: string): Promise<LeagueRow[]> {
      if (!stateCode) return []
      setLoadingLeagues(true)
      try {
        const { data, error: leaguesError } = await supabase
          .from('leagues')
          .select('id,name,short_name,state_code,logo_path')
          .eq('state_code', stateCode)
          .neq('is_active', false)
          .order('name', { ascending: true })
        if (leaguesError) throw leaguesError
        return shapeLeagueRows((data ?? []) as Array<{ id: string; name: string | null; short_name: string | null; state_code: string | null; logo_path: string | null }>)
      } finally {
        setLoadingLeagues(false)
      }
    }

    async function loadClubsForLeague(leagueId: string): Promise<ClubRow[]> {
      if (!leagueId) return []
      setLoadingClubs(true)
      try {
        const { data, error: clubsError } = await supabase
          .from('clubs')
          .select('id,name,league_id,logo_path')
          .eq('league_id', leagueId)
          .order('name', { ascending: true })
        if (clubsError) throw clubsError
        const clubRows = (data ?? []) as Array<{ id: string; name: string | null; league_id: string | null; logo_path: string | null }>
        const officialSquadLogos = await loadOfficialSquadLogoRows(clubRows.map((club) => club.id))
        return shapeClubRows(clubRows, officialSquadLogos)
      } finally {
        setLoadingClubs(false)
      }
    }

    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session
        if (!session) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (!session.user.email_confirmed_at) {
          navigate('/check-email', { replace: true })
          return
        }

        if (cancelled) return
        setUserId(session.user.id)

        const [stateRes, profileRes, completion] = await Promise.all([
          supabase.from('states').select('code,name').order('name', { ascending: true }),
          supabase
            .from('profiles')
            .select(
              'name,handle,primary_role,game_day_roles,home_state_code,home_league_id,home_club_id,avatar_url,avatar_path,action_photo_url,action_photo_path,player_position,player_number,dob,onboarding_completed_at'
            )
            .eq('user_id', session.user.id)
            .maybeSingle(),
          getProfileCompletion(session.user.id),
        ])

        if (stateRes.error) throw stateRes.error
        if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error

        if (!cancelled) {
          setStates((stateRes.data ?? []) as StateRow[])
        }

        const complete = isProfileComplete(completion)
        setProfileAlreadyComplete(complete)

        const profile = (profileRes.data as ProfileRow | null) ?? null
        if (profile && !cancelled) {
          const split = splitName(profile.name)
          setFirstName(split.firstName)
          setLastName(split.lastName)
          setHandleInput(profile.handle || '')
          setAvatarPath(profile.avatar_path || null)
          setAvatarUrl(resolveAvatarUrl(profile.avatar_url, profile.avatar_path))
          setActionPhotoPath(profile.action_photo_path || null)
          setActionPhotoUrl(resolveAvatarUrl(profile.action_photo_url, profile.action_photo_path))
          setPlayerPosition((profile.player_position as OnboardingPosition | null) ?? null)
          setPlayerNumber(profile.player_number != null ? String(profile.player_number) : '')
          const parsedDob = parseStoredDob(profile.dob)
          setDob(parsedDob)
          setDobInput(formatDobForDisplay(parsedDob))

          const roles = roleArrayFromProfile(profile.primary_role, profile.game_day_roles)
          setSelectedRoles(roles)
          setLockedAdminRole(
            profile.primary_role === 'admin' ||
              (Array.isArray(profile.game_day_roles) && profile.game_day_roles.includes('admin'))
          )

          if (profile.home_state_code) {
            setSelectedStateCode(profile.home_state_code)
            const loadedLeagues = await loadLeaguesForState(profile.home_state_code)
            if (!cancelled) setLeagues(loadedLeagues)

            if (profile.home_league_id) {
              setSelectedLeagueId(profile.home_league_id)
              const loadedClubs = await loadClubsForLeague(profile.home_league_id)
              if (!cancelled) setClubs(loadedClubs)
              if (profile.home_club_id) setSelectedClubId(profile.home_club_id)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load onboarding data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      const validation = validateHandle(handleInput)
      setHandleError(validation.error)
      setHandleAvailable(null)

      if (validation.error || !validation.sanitized || !userId) {
        setCheckingHandle(false)
        return
      }

      setCheckingHandle(true)
      try {
        const { data, error: handleQueryError } = await supabase
          .from('profiles_directory')
          .select('user_id')
          .ilike('handle', validation.sanitized)
          .neq('user_id', userId)
          .maybeSingle()

        if (!active) return
        if (handleQueryError && handleQueryError.code !== 'PGRST116') {
          setHandleError(handleQueryError.message || 'Unable to check handle right now.')
          setHandleAvailable(null)
          return
        }

        if (data) {
          setHandleAvailable(false)
          setHandleError('Handle already taken.')
        } else {
          setHandleAvailable(true)
        }
      } catch (err) {
        if (!active) return
        setHandleError(err instanceof Error ? err.message : 'Unable to check handle right now.')
        setHandleAvailable(null)
      } finally {
        if (active) setCheckingHandle(false)
      }
    }, 350)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [handleInput, userId])

  async function onStateChange(nextStateCode: string) {
    setSelectedStateCode(nextStateCode)
    setSelectedLeagueId('')
    setSelectedClubId('')
    setLeagueFilter('')
    setClubFilter('')
    setLeagues([])
    setClubs([])
    setError(null)

    if (!nextStateCode) return

    try {
      const leagues = await (async () => {
        setLoadingLeagues(true)
        try {
          const { data, error: leaguesError } = await supabase
            .from('leagues')
            .select('id,name,short_name,state_code,logo_path')
            .eq('state_code', nextStateCode)
            .neq('is_active', false)
            .order('name', { ascending: true })
          if (leaguesError) throw leaguesError
          return shapeLeagueRows((data ?? []) as Array<{ id: string; name: string | null; short_name: string | null; state_code: string | null; logo_path: string | null }>)
        } finally {
          setLoadingLeagues(false)
        }
      })()
      setLeagues(leagues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leagues.')
    }
  }

  async function onLeagueChange(nextLeagueId: string) {
    setSelectedLeagueId(nextLeagueId)
    setSelectedClubId('')
    setClubFilter('')
    setClubs([])
    setError(null)

    if (!nextLeagueId) return

    try {
      const clubs = await (async () => {
        setLoadingClubs(true)
        try {
          const { data, error: clubsError } = await supabase
            .from('clubs')
            .select('id,name,league_id,logo_path')
            .eq('league_id', nextLeagueId)
            .order('name', { ascending: true })
          if (clubsError) throw clubsError
          const clubRows = (data ?? []) as Array<{ id: string; name: string | null; league_id: string | null; logo_path: string | null }>
          const officialSquadLogos = await loadOfficialSquadLogoRows(clubRows.map((club) => club.id))
          return shapeClubRows(clubRows, officialSquadLogos)
        } finally {
          setLoadingClubs(false)
        }
      })()
      setClubs(clubs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load clubs.')
    }
  }

  async function onImageSelected(file: File, variant: 'avatar' | 'action') {
    const existingPath = variant === 'avatar' ? avatarPath : actionPhotoPath
    const existingUrl = variant === 'avatar' ? avatarUrl : actionPhotoUrl
    const previewUrl = URL.createObjectURL(file)
    setError(null)
    setMessage(null)

    if (variant === 'avatar') {
      setUploadingAvatar(true)
      setAvatarUrl(previewUrl)
      setAvatarPath(null)
    } else {
      setUploadingActionPhoto(true)
      setActionPhotoUrl(previewUrl)
      setActionPhotoPath(null)
    }

    try {
      if (!userId) throw new Error('Please sign in again.')
      const upload = await uploadOnboardingImage(userId, file, variant)
      if (variant === 'avatar') {
        setAvatarPath(upload.path)
        setAvatarUrl(upload.url)
      } else {
        setActionPhotoPath(upload.path)
        setActionPhotoUrl(upload.url)
      }
    } catch (err) {
      if (variant === 'avatar') {
        setAvatarPath(existingPath)
        setAvatarUrl(existingUrl)
      } else {
        setActionPhotoPath(existingPath)
        setActionPhotoUrl(existingUrl)
      }
      setError(err instanceof Error ? err.message : 'Unable to upload image right now.')
    } finally {
      if (variant === 'avatar') setUploadingAvatar(false)
      else setUploadingActionPhoto(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const personalStepError = getPersonalStepError({
    firstName,
    lastName,
    handleInput,
    checkingHandle,
    handleAvailable,
    dob,
  })

  const profilePhotoStepError = getPhotoStepError({
    uploading: uploadingAvatar,
    url: avatarUrl,
    path: avatarPath,
    label: 'Profile',
  })

  const actionPhotoStepError = getPhotoStepError({
    uploading: uploadingActionPhoto,
    url: actionPhotoUrl,
    path: actionPhotoPath,
    label: 'Action',
  })

  const clubStepError = getClubStepError({
    selectedStateCode,
    selectedLeagueId,
    selectedClubId,
  })

  const roleStepError = getRoleStepError({
    selectedRoles,
    playerPosition,
    playerNumber,
  })

  const stepValidity = useMemo(() => {
    return {
      welcome: true,
      personal: !personalStepError,
      'profile-photo': !profilePhotoStepError,
      'action-card': !actionPhotoStepError,
      club: !clubStepError,
      role: !roleStepError,
    } satisfies Record<OnboardingStepKey, boolean>
  }, [
    actionPhotoStepError,
    clubStepError,
    personalStepError,
    profilePhotoStepError,
    roleStepError,
  ])

  async function goNext() {
    setError(null)
    setMessage(null)

    if (currentStep === 'welcome') {
      setStepIndex(1)
      return
    }

    const validationError =
      currentStep === 'personal'
        ? personalStepError
        : currentStep === 'profile-photo'
          ? profilePhotoStepError
          : currentStep === 'action-card'
            ? actionPhotoStepError
            : currentStep === 'club'
              ? clubStepError
              : roleStepError

    if (validationError) {
      setError(validationError)
      return
    }

    if (currentStep === 'role') {
      await submit()
      return
    }

    setStepIndex((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1))
  }

  function goBack() {
    setError(null)
    setMessage(null)
    if (stepIndex === 0) {
      navigate(editMode || profileAlreadyComplete ? '/profile' : '/dashboard', { replace: true })
      return
    }
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  async function submit() {
    setError(null)
    setMessage(null)
    if (!userId) {
      navigate('/sign-in', { replace: true })
      return
    }

    const handleValidation = validateHandle(handleInput)
    const personalError = personalStepError
    const profilePhotoError = profilePhotoStepError
    const actionPhotoError = actionPhotoStepError
    const clubError = clubStepError
    const roleError = roleStepError
    if (personalError || profilePhotoError || actionPhotoError || clubError || roleError || !handleValidation.sanitized) {
      setError(personalError || profilePhotoError || actionPhotoError || clubError || roleError || 'Fix the highlighted fields.')
      setHandleError(validateHandle(handleInput).error)
      setDobError(validateDob(dob))
      if (selectedRoles.includes('player')) {
        if (!playerNumber) setPlayerNumberError('Enter a jersey number (0-999).')
        else if (roleError) setPlayerNumberError('Enter a valid number (0-999).')
      }
      return
    }

    try {
      setSaving(true)
      const { data: handleRow, error: handleQueryError } = await supabase
        .from('profiles_directory')
        .select('user_id')
        .ilike('handle', handleValidation.sanitized)
        .neq('user_id', userId)
        .maybeSingle()

      if (handleQueryError && handleQueryError.code !== 'PGRST116') throw handleQueryError
      if (handleRow) {
        setError('That handle is already taken. Choose another handle.')
        return
      }

      await finishOnboarding({
        userId,
        firstName,
        lastName,
        handle: handleValidation.sanitized,
        dob: formatDobForStorage(dob) || '',
        selectedStateCode,
        selectedLeagueId,
        selectedClubId,
        selectedRoles,
        lockedAdminRole,
        avatarUrl,
        avatarPath,
        actionPhotoUrl,
        actionPhotoPath,
        playerPosition,
        playerNumber: selectedRoles.includes('player') ? Number(playerNumber) : null,
      })

      setMessage(editMode || profileAlreadyComplete ? 'Profile updated.' : 'Onboarding complete.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finish onboarding.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading onboarding…</main>
  }

  const requestLeagueLink = `/request-league?stateCode=${encodeURIComponent(selectedStateCode)}&stateName=${encodeURIComponent(selectedStateName || '')}&returnTo=${encodeURIComponent('/onboarding')}`
  const requestClubLink = `/request-club?stateCode=${encodeURIComponent(selectedStateCode)}&stateName=${encodeURIComponent(selectedStateName || '')}&leagueId=${encodeURIComponent(selectedLeagueId)}&leagueName=${encodeURIComponent(selectedLeagueName || '')}&returnTo=${encodeURIComponent('/onboarding')}`
  const stepMeta = STEP_META[stepIndex]
  const stepIcon = STEP_ICON_SRC[currentStep]
  const positionSubtitle = playerPosition ? `${playerPosition} selected` : 'Player position'
  const actionPreviewName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || 'Your Name'

  return (
    <main className="min-h-screen bg-[#040817] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-6 lg:px-10 xl:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1120px] flex-col justify-between gap-5">
        <div>
          <div className="relative flex items-center justify-center pb-6">
            <button
              type="button"
              onClick={goBack}
              className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-[#111B33] text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition hover:bg-[#162342]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="pt-1">
              <ProgressDots activeIndex={stepIndex} />
            </div>
          </div>

          <section className="mx-auto max-w-[780px] text-center">
            {stepIcon ? (
              <div className="mb-4 flex justify-center">
                {currentStep === 'welcome' ? (
                  <div className="relative inline-flex items-center justify-center px-6 py-4">
                    <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle,rgba(57,255,20,0.12)_0%,rgba(12,56,150,0.08)_48%,rgba(2,9,26,0)_76%)] blur-2xl" />
                    <img src="/kickchasers_logo.png" alt="KickChasers" className="relative h-20 w-auto sm:h-24" />
                  </div>
                ) : (
                  <AccentIconBadge src={stepIcon} iconClassName="h-16 w-16" frameClassName="h-24 w-24" />
                )}
              </div>
            ) : null}
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f88b7]">
              {editMode || profileAlreadyComplete ? 'Edit profile' : 'Club profile setup'}
            </p>
            <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-white sm:text-[38px]">
              {currentStep === 'welcome' ? 'Welcome to your club profile' : stepMeta.title}
            </h1>
            <p className="mx-auto mt-3 max-w-[680px] text-[15px] leading-6 text-slate-400 sm:text-base">
              {currentStep === 'welcome'
                ? 'We’ll guide you through a short setup so your stats, club identity, and role permissions are ready from the start.'
                : currentStep === 'profile-photo'
                  ? 'Choose a clean avatar for your club profile. This step is optional.'
                  : currentStep === 'action-card'
                    ? 'Add an action image for your KickChasers card preview. This step is optional.'
                    : currentStep === 'club'
                      ? 'Choose the official club you play for or support.'
                      : currentStep === 'role'
                        ? 'Pick the roles that fit you. Elevated roles are requested, not instantly granted.'
                        : 'Add the basics for your profile and player cards.'}
            </p>
          </section>

          <section className="mx-auto mt-8 w-full max-w-[1020px]">
            <div className={ONBOARDING_CARD_CLASS}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[34px] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(255,255,255,0.075),rgba(255,255,255,0))]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[34px] border border-white/[0.045]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_0%,rgba(255,255,255,0.03),transparent_58%)]" />
              <div className="relative">
              {currentStep === 'welcome' ? (
                <div className="space-y-8 text-center">
                  <div className="mx-auto max-w-[760px]">
                    <div className="mx-auto h-px w-full max-w-[520px] bg-gradient-to-r from-transparent via-white/14 to-transparent" />
                    <p className="mx-auto mt-6 max-w-[640px] text-sm leading-7 text-slate-300">
                      Welcome to KickChasers, where club identity, player development, and competition-ready insight
                      come together in one performance platform.
                    </p>
                    <p className="mx-auto mt-4 max-w-[560px] text-sm leading-7 text-slate-400">
                      This short setup gets your profile aligned with the product from the first screen.
                    </p>
                  </div>
                </div>
              ) : null}

              {currentStep === 'personal' ? (
                <div className="grid gap-6 xl:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
                  <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.018),rgba(10,18,32,0.52)_22%,rgba(8,14,27,0.78))] p-6 text-left">
                    <div className="max-w-[28ch] space-y-5">
                      <div>
                        <p className="text-base font-semibold text-white">Profile setup</p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          This information powers your player profile and match data across KickChasers.
                        </p>
                      </div>
                      <div className="space-y-4 text-sm leading-7 text-slate-400">
                        <p>Your name is used in match summaries, leaderboards, and stat cards.</p>
                        <p>Your date of birth is used for benchmarking and performance comparisons against your age group.</p>
                        <p>Your handle is how teammates find you, tag you, and invite you into squads.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SurfaceField label="First name">
                        <Input
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="Tom"
                          className="min-h-[60px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 text-[15px]"
                        />
                      </SurfaceField>
                      <SurfaceField label="Last name">
                        <Input
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="Smith"
                          className="min-h-[60px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 text-[15px]"
                        />
                      </SurfaceField>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)]">
                      <SurfaceField
                        label="Handle"
                        hint={
                          checkingHandle
                            ? 'Checking handle availability…'
                            : handleAvailable === true && !handleError
                              ? 'Handle available'
                              : 'Lowercase, no leading @, letters, numbers, and underscores only.'
                        }
                        error={handleError}
                      >
                        <div className="flex min-h-[60px] items-center gap-3 rounded-[22px] border border-white/5 bg-[#0D1526] px-4">
                          <span className="text-base font-semibold text-[#B8FFD5]">@</span>
                          <Input
                            value={handleInput}
                            onChange={(event) => setHandleInput(event.target.value)}
                            placeholder="yourhandle"
                            autoCapitalize="off"
                            className="min-h-0 border-0 bg-transparent px-0 py-0 text-[15px] focus:ring-0"
                          />
                          {checkingHandle ? <Loader2 className="h-4 w-4 animate-spin text-[#39FF88]" /> : null}
                        </div>
                      </SurfaceField>

                      <SurfaceField label="Date of birth" error={dobError} hint="Must be in the past and at least 5 years old.">
                        <Input
                          value={dobInput}
                          onChange={(event) => {
                            const formatted = formatDateInput(event.target.value)
                            setDobInput(formatted)
                            const parsed = parseDobInput(formatted)
                            setDob(parsed)
                            setDobError(validateDob(parsed))
                          }}
                          placeholder="DD/MM/YYYY"
                          inputMode="numeric"
                          className="min-h-[60px] rounded-[22px] border-white/5 bg-[#0D1526] px-4 text-[15px]"
                        />
                      </SurfaceField>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 'profile-photo' ? (
                <div className={`flex flex-col items-center gap-5 py-5 ${ONBOARDING_PANEL_CLASS}`}>
                  <label className="group relative flex h-44 w-44 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#0D1526_0%,#0A1322_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(0,0,0,0.24)] transition hover:bg-[#101c31]">
                    {avatarUrl ? <img src={avatarUrl} alt="Profile preview" className="h-full w-full object-cover" /> : null}
                    {!avatarUrl ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/6">
                          <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">Add profile photo</span>
                      </div>
                    ) : null}
                    {uploadingAvatar ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <Loader2 className="h-6 w-6 animate-spin text-[#39FF88]" />
                      </div>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void onImageSelected(file, 'avatar')
                        event.currentTarget.value = ''
                      }}
                    />
                  </label>
                  <p className="max-w-[360px] text-center text-sm leading-6 text-slate-400">
                    Clean, simple avatar tile like the app. Optional unless an upload was started and not completed.
                  </p>
                </div>
              ) : null}

              {currentStep === 'action-card' ? (
                <div className="grid gap-5 py-1 xl:grid-cols-[minmax(220px,0.62fr)_minmax(0,1.38fr)] xl:items-center">
                  <div className="px-2 py-2 text-left">
                    <div className="max-w-[28ch] space-y-4">
                      <div>
                        <p className="text-base font-semibold text-white">Real feed-card preview</p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          This preview shows how your KickChasers post card will look once your action image is added.
                        </p>
                      </div>
                      <div className="space-y-4 text-sm leading-7 text-slate-400">
                        <p>Your photo becomes the background, your stats sit across the card, and the finished post is ready for the feed.</p>
                        <p>Tap the card to upload an action image.</p>
                      </div>
                    </div>
                  </div>

                  <label className="group block cursor-pointer">
                    <ActionCardPreview
                      actionPhotoUrl={actionPhotoUrl}
                      uploadingActionPhoto={uploadingActionPhoto}
                      playerName={actionPreviewName}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void onImageSelected(file, 'action')
                        event.currentTarget.value = ''
                      }}
                    />
                  </label>
                </div>
              ) : null}

              {currentStep === 'club' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <SelectorField
                      label="State"
                      value={selectedStateName || null}
                      placeholder="Select your state"
                      onPress={() => setActiveSheet('state')}
                    />
                    <SelectorField
                      label="League"
                      value={selectedLeagueName || null}
                      placeholder="Select your league"
                      onPress={() => setActiveSheet('league')}
                      disabled={!selectedStateCode}
                      loading={loadingLeagues}
                    />
                  </div>
                  <SelectorField
                    label="Club"
                    value={clubs.find((club) => club.id === selectedClubId)?.name || null}
                    placeholder="Select your club"
                    onPress={() => setActiveSheet('club')}
                    disabled={!selectedLeagueId}
                    loading={loadingClubs}
                  />

                  <div className={`px-5 py-4 text-left text-sm leading-7 text-slate-400 ${ONBOARDING_SUBTLE_PANEL_CLASS}`}>
                    If your league or club is missing, send a request below. Onboarding still cannot finish without an
                    official squad-backed club.
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link className="inline-flex min-h-[48px] items-center rounded-full bg-[#0D1526] px-4 text-sm font-medium text-white transition hover:bg-[#12203a]" to={requestLeagueLink}>
                      Can’t find your league?
                    </Link>
                    <Link className="inline-flex min-h-[48px] items-center rounded-full bg-[#0D1526] px-4 text-sm font-medium text-white transition hover:bg-[#12203a]" to={requestClubLink}>
                      Can’t find your club?
                    </Link>
                  </div>
                </div>
              ) : null}

              {currentStep === 'role' ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {ONBOARDING_ROLE_OPTIONS.map((option) => {
                      const selected = selectedRoles.includes(option.key)
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSelectedRoles((prev) => toggleRole(prev, option.key))}
                          className={`rounded-[26px] p-4 text-left transition ${
                            selected
                              ? 'border border-[#39FF88]/35 bg-[linear-gradient(180deg,rgba(57,255,136,0.12)_0%,rgba(17,27,51,0.92)_100%)] text-slate-100 shadow-[0_18px_36px_rgba(57,255,136,0.08)]'
                              : 'border border-transparent bg-[#0D1526] text-slate-100 hover:bg-[#12203a]'
                          }`}
                        >
                          <div className="relative flex min-h-[60px] items-start justify-center">
                            <AccentIconBadge
                              src={ROLE_ICON_SRC[option.key]}
                              iconClassName="h-8 w-8"
                              frameClassName={`h-14 w-14 shrink-0 rounded-[20px] ${selected ? 'bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.24),rgba(57,255,136,0)_56%),linear-gradient(180deg,#12253a_0%,#0d1628_100%)]' : ''}`}
                            />
                            {selected ? <CheckCircle2 className="absolute right-0 top-0 h-5 w-5 shrink-0 text-[#39FF88]" /> : null}
                          </div>
                          <p className="mt-4 text-base font-semibold">{option.label}</p>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-slate-300' : 'text-slate-400'}`}>{option.helper}</p>
                        </button>
                      )
                    })}
                  </div>

                  {lockedAdminRole ? <p className="text-xs text-slate-500">Existing admin access is preserved automatically and is not selectable here.</p> : null}

                  {selectedRoles.includes('player') ? (
                    <div className={`space-y-4 p-4 ${ONBOARDING_PANEL_CLASS}`}>
                      <SelectorField
                        label="Position"
                        value={playerPosition}
                        placeholder="Select position"
                        onPress={() => setActiveSheet('position')}
                      />
                      <SurfaceField label="Jersey number" error={playerNumberError} hint="Enter an integer from 0 to 999.">
                        <Input
                          type="number"
                          min={0}
                          max={999}
                          value={playerNumber}
                          onChange={(event) => {
                            setPlayerNumber(event.target.value)
                            setPlayerNumberError(null)
                          }}
                          placeholder="12"
                          className="min-h-[58px] rounded-[22px] border-white/5 bg-[#111B33] px-4 text-[15px]"
                        />
                      </SurfaceField>
                    </div>
                  ) : null}
                </div>
              ) : null}
              </div>
            </div>

            {error ? <div className="mt-4 rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
            {message ? <div className="mt-4 rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}
          </section>
        </div>

        <div className="sticky bottom-0 z-20 -mx-1 mt-1 bg-[linear-gradient(180deg,rgba(4,8,23,0)_0%,rgba(4,8,23,0.86)_22%,rgba(4,8,23,0.98)_100%)] px-1 pb-1 pt-4">
          <div className="mx-auto flex w-full max-w-[1020px] flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="min-h-[52px] flex-1 rounded-full bg-[#0D1526] px-5 py-3.5 text-sm font-semibold text-slate-100 transition hover:bg-[#14203a]"
            onClick={goBack}
          >
            Back
          </button>
          <button
            type="button"
            className="min-h-[52px] flex-1 rounded-full bg-[#39FF88] px-5 py-3.5 text-sm font-semibold text-[#081120] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || (currentStep !== 'welcome' && !stepValidity[currentStep])}
            onClick={() => void goNext()}
          >
            {saving ? 'Saving…' : currentStep === 'role' ? 'Finish' : 'Next'}
          </button>
        </div>
        </div>
      </div>

      <SheetModal
        open={activeSheet === 'state'}
        title="Select state"
        onClose={() => setActiveSheet(null)}
      >
        {states.map((state) => (
          <OptionRow
            key={state.code}
            title={state.name || state.code}
            meta={state.code}
            selected={state.code === selectedStateCode}
            onPress={() => {
              void onStateChange(state.code)
              setActiveSheet(null)
            }}
          />
        ))}
      </SheetModal>

      <SheetModal
        open={activeSheet === 'league'}
        title="Select league"
        subtitle={selectedStateName ? `State: ${selectedStateName}` : undefined}
        onClose={() => setActiveSheet(null)}
      >
        <div className="px-2 pb-3">
          <div className="flex min-h-[52px] items-center gap-2 rounded-[20px] bg-[#0D1526] px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              value={leagueFilter}
              onChange={(event) => setLeagueFilter(event.target.value)}
              placeholder="Search leagues"
              className="min-h-0 border-0 bg-transparent px-0 py-0 text-sm focus:ring-0"
            />
          </div>
        </div>
        {!loadingLeagues && selectedStateCode && filteredLeagues.length === 0 ? (
          <div className="px-3 pb-2">
            <div className="rounded-[22px] bg-[#0D1526] p-4 text-left">
              <p className="text-sm font-semibold text-white">No leagues yet for this state</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Request the official league and we’ll send it for review.</p>
              <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#39FF88]" to={requestLeagueLink} onClick={() => setActiveSheet(null)}>
                Request league
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
        {filteredLeagues.map((league) => (
          <OptionRow
            key={league.id}
            title={league.name || league.id}
            subtitle={league.short_name}
            meta={league.state_code}
            logoUrl={league.logoUrl}
            selected={league.id === selectedLeagueId}
            onPress={() => {
              void onLeagueChange(league.id)
              setActiveSheet(null)
            }}
          />
        ))}
      </SheetModal>

      <SheetModal
        open={activeSheet === 'club'}
        title="Select club"
        subtitle={selectedLeagueName ? `League: ${selectedLeagueName}` : undefined}
        onClose={() => setActiveSheet(null)}
      >
        <div className="px-2 pb-3">
          <div className="flex min-h-[52px] items-center gap-2 rounded-[20px] bg-[#0D1526] px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              value={clubFilter}
              onChange={(event) => setClubFilter(event.target.value)}
              placeholder="Search clubs"
              className="min-h-0 border-0 bg-transparent px-0 py-0 text-sm focus:ring-0"
            />
          </div>
        </div>
        {!loadingClubs && selectedLeagueId && filteredClubs.length === 0 ? (
          <div className="px-3 pb-2">
            <div className="rounded-[22px] bg-[#0D1526] p-4 text-left">
              <p className="text-sm font-semibold text-white">No clubs yet for this league</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Request the missing club and we’ll send it for admin review.</p>
              <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#39FF88]" to={requestClubLink} onClick={() => setActiveSheet(null)}>
                Request club
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
        {filteredClubs.map((club) => (
          <OptionRow
            key={club.id}
            title={club.name || club.id}
            logoUrl={club.logoUrl}
            selected={club.id === selectedClubId}
            onPress={() => {
              setSelectedClubId(club.id)
              setActiveSheet(null)
            }}
          />
        ))}
      </SheetModal>

      <SheetModal
        open={activeSheet === 'position'}
        title="Select position"
        subtitle={positionSubtitle}
        onClose={() => setActiveSheet(null)}
      >
        {POSITION_OPTIONS.map((position) => (
          <OptionRow
            key={position}
            title={position}
            selected={position === playerPosition}
            onPress={() => {
              setPlayerPosition(position)
              setActiveSheet(null)
            }}
          />
        ))}
      </SheetModal>
    </main>
  )
}
