import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { getProfileCompletion, isProfileComplete } from '@/lib/auth'
import {
  ONBOARDING_ROLE_OPTIONS,
  type OnboardingRole,
  type RequestableRole,
  roleArrayFromProfile,
  validateHandle,
} from '@/lib/profile-utils'
import { createRoleRequest, getOfficialSquadIdForClub } from '@/lib/account-management'

type StateRow = {
  code: string
  name: string | null
}

type LeagueRow = {
  id: string
  name: string | null
  state_code: string | null
}

type ClubRow = {
  id: string
  name: string | null
  league_id: string | null
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
}

function roleLabel(role: OnboardingRole): string {
  return ONBOARDING_ROLE_OPTIONS.find((option) => option.key === role)?.label ?? role
}

function toggleRole(list: OnboardingRole[], role: OnboardingRole): OnboardingRole[] {
  return list.includes(role) ? list.filter((item) => item !== role) : [...list, role]
}

function resolveAvatarUrl(avatarUrl: string | null, avatarPath: string | null): string | null {
  if (avatarUrl) return avatarUrl
  if (!avatarPath) return null
  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath)
  return data?.publicUrl || null
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const editMode = query.get('edit') === '1' || query.get('mode') === 'edit'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileAlreadyComplete, setProfileAlreadyComplete] = useState(false)

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [selectedStateCode, setSelectedStateCode] = useState('')
  const [selectedLeagueId, setSelectedLeagueId] = useState('')
  const [selectedClubId, setSelectedClubId] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<OnboardingRole[]>([])
  const [lockedAdminRole, setLockedAdminRole] = useState(false)

  const [states, setStates] = useState<StateRow[]>([])
  const [leagues, setLeagues] = useState<LeagueRow[]>([])
  const [clubs, setClubs] = useState<ClubRow[]>([])
  const [leagueFilter, setLeagueFilter] = useState('')
  const [clubFilter, setClubFilter] = useState('')

  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filteredLeagues = useMemo(() => {
    const input = leagueFilter.trim().toLowerCase()
    return leagues.filter((league) => {
      if (!input) return true
      return (league.name || '').toLowerCase().includes(input)
    })
  }, [leagueFilter, leagues])

  const filteredClubs = useMemo(() => {
    const input = clubFilter.trim().toLowerCase()
    return clubs.filter((club) => {
      if (!input) return true
      return (club.name || '').toLowerCase().includes(input)
    })
  }, [clubFilter, clubs])

  useEffect(() => {
    let cancelled = false

    async function loadLeaguesForState(stateCode: string): Promise<LeagueRow[]> {
      if (!stateCode) return []
      const { data, error: leaguesError } = await supabase
        .from('leagues')
        .select('id,name,state_code')
        .eq('state_code', stateCode)
        .order('name', { ascending: true })

      if (leaguesError) throw leaguesError
      return (data ?? []) as LeagueRow[]
    }

    async function loadClubsForLeague(leagueId: string): Promise<ClubRow[]> {
      if (!leagueId) return []
      const { data, error: clubsError } = await supabase
        .from('clubs')
        .select('id,name,league_id')
        .eq('league_id', leagueId)
        .order('name', { ascending: true })

      if (clubsError) throw clubsError
      return (data ?? []) as ClubRow[]
    }

    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session
        if (!session) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (cancelled) return
        setUserId(session.user.id)

        const [stateRes, profileRes, completion] = await Promise.all([
          supabase.from('states').select('code,name').order('name', { ascending: true }),
          supabase
            .from('profiles')
            .select(
              'name,handle,primary_role,game_day_roles,home_state_code,home_league_id,home_club_id,avatar_url,avatar_path'
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
          setName(profile.name || '')
          setHandle(profile.handle || '')
          setAvatarPath(profile.avatar_path || null)
          setAvatarUrl(resolveAvatarUrl(profile.avatar_url, profile.avatar_path))

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

              if (profile.home_club_id) {
                setSelectedClubId(profile.home_club_id)
              }
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
  }, [editMode, navigate])

  async function onStateChange(nextStateCode: string) {
    setSelectedStateCode(nextStateCode)
    setSelectedLeagueId('')
    setSelectedClubId('')
    setLeagueFilter('')
    setClubFilter('')
    setLeagues([])
    setClubs([])

    if (!nextStateCode) return

    const { data, error: leaguesError } = await supabase
      .from('leagues')
      .select('id,name,state_code')
      .eq('state_code', nextStateCode)
      .order('name', { ascending: true })

    if (leaguesError) {
      setError(leaguesError.message)
      return
    }

    setLeagues((data ?? []) as LeagueRow[])
  }

  async function onLeagueChange(nextLeagueId: string) {
    setSelectedLeagueId(nextLeagueId)
    setSelectedClubId('')
    setClubFilter('')
    setClubs([])

    if (!nextLeagueId) return

    const { data, error: clubsError } = await supabase
      .from('clubs')
      .select('id,name,league_id')
      .eq('league_id', nextLeagueId)
      .order('name', { ascending: true })

    if (clubsError) {
      setError(clubsError.message)
      return
    }

    setClubs((data ?? []) as ClubRow[])
  }

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null
    setAvatarFile(nextFile)

    if (!nextFile) return

    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result || ''))
    reader.readAsDataURL(nextFile)
  }

  async function save() {
    setError(null)
    setMessage(null)

    const userIdValue = userId
    if (!userIdValue) {
      navigate('/sign-in', { replace: true })
      return
    }

    if (!selectedStateCode || !selectedLeagueId || !selectedClubId || selectedRoles.length === 0) {
      setError('State, league, club, and at least one role are required.')
      return
    }

    const handleValidation = validateHandle(handle)
    if (!handleValidation.sanitized || handleValidation.error) {
      setError(handleValidation.error || 'Invalid handle.')
      return
    }

    if (!name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)

    try {
      const { data: handleRows, error: handleError } = await supabase
        .from('profiles_directory')
        .select('user_id')
        .ilike('handle', handleValidation.sanitized)
        .limit(1)

      if (handleError && handleError.code !== 'PGRST116') {
        throw handleError
      }

      const takenByAnother = (handleRows ?? []).some((row) => row.user_id !== userIdValue)
      if (takenByAnother) {
        setError('That handle is already taken. Choose another handle.')
        setSaving(false)
        return
      }

      let nextAvatarPath = avatarPath
      let nextAvatarUrl = avatarUrl

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `profiles/${userIdValue}/avatar_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path)
        nextAvatarPath = path
        nextAvatarUrl = data.publicUrl || null
      }

      const baseRoles = selectedRoles.filter((role) => role !== 'member')
      const rolesToPersist = lockedAdminRole
        ? Array.from(new Set([...baseRoles, 'admin']))
        : baseRoles
      const primaryRole =
        baseRoles[0] ?? (selectedRoles.includes('member') ? 'supporter' : lockedAdminRole ? 'admin' : null)

      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userIdValue,
        name: name.trim(),
        handle: handleValidation.sanitized,
        avatar_path: nextAvatarPath,
        avatar_url: nextAvatarUrl,
        home_state_code: selectedStateCode,
        home_league_id: selectedLeagueId,
        home_club_id: selectedClubId,
        primary_role: primaryRole,
        game_day_roles: rolesToPersist.length ? rolesToPersist : null,
        state: selectedStateCode,
        game_day_role: primaryRole,
      })

      if (profileError) throw profileError

      const { error: followError } = await supabase
        .from('club_follows')
        .insert({ club_id: selectedClubId, user_id: userIdValue })

      if (followError && followError.code !== '23505') throw followError

      const officialSquadId = await getOfficialSquadIdForClub(selectedClubId)
      const requestableRoles = selectedRoles.filter(
        (role): role is RequestableRole => role === 'player' || role === 'coach' || role === 'tracker'
      )

      if (officialSquadId) {
        const { data: memberRow, error: memberLookupError } = await supabase
          .from('squad_members')
          .select('id')
          .eq('squad_id', officialSquadId)
          .eq('user_id', userIdValue)
          .maybeSingle()

        if (memberLookupError && memberLookupError.code !== 'PGRST116') throw memberLookupError

        if (!memberRow) {
          const { error: memberInsertError } = await supabase.from('squad_members').insert({
            squad_id: officialSquadId,
            user_id: userIdValue,
            invited_by: userIdValue,
            role: 'member',
            status: 'accepted',
          })
          if (memberInsertError && memberInsertError.code !== '23505') throw memberInsertError
        }

        await Promise.allSettled(requestableRoles.map((role) => createRoleRequest(officialSquadId, userIdValue, role)))
      } else if (requestableRoles.length) {
        setMessage('Profile saved. Role requests were skipped because no official squad was found for this club yet.')
      }

      const effectiveEditMode = editMode || profileAlreadyComplete
      setMessage(effectiveEditMode ? 'Profile updated.' : 'Onboarding complete. Welcome to KickChasers.')
      navigate(effectiveEditMode ? '/profile' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save onboarding profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading onboarding…</main>
  }

  return (
    <main className="min-h-screen app-bg px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1200px] gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <PortalCard
            title={editMode || profileAlreadyComplete ? 'Edit Profile Setup' : 'Complete Your Profile'}
            subtitle="Required to access the portal"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Name</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="First and last name" />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Handle</span>
                <Input
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="coach_jay"
                  autoCapitalize="off"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>State</span>
                <select className="input" value={selectedStateCode} onChange={(event) => void onStateChange(event.target.value)}>
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name || state.code}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2 text-sm text-slate-300">
                <span>League</span>
                <Input
                  value={leagueFilter}
                  onChange={(event) => setLeagueFilter(event.target.value)}
                  placeholder="Search leagues"
                />
                <select className="input" value={selectedLeagueId} onChange={(event) => void onLeagueChange(event.target.value)}>
                  <option value="">Select league</option>
                  {filteredLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name || league.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-sm text-slate-300 md:col-span-2">
                <span>Club</span>
                <Input
                  value={clubFilter}
                  onChange={(event) => setClubFilter(event.target.value)}
                  placeholder="Search clubs"
                />
                <select className="input" value={selectedClubId} onChange={(event) => setSelectedClubId(event.target.value)}>
                  <option value="">Select club</option>
                  {filteredClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name || club.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </PortalCard>

          <PortalCard title="Roles" subtitle="Select all roles that apply">
            <div className="flex flex-wrap gap-2">
              {ONBOARDING_ROLE_OPTIONS.map((option) => {
                const selected = selectedRoles.includes(option.key)
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedRoles((prev) => toggleRole(prev, option.key))}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? 'border-[#39FF88]/80 bg-[#39FF88]/15 text-[#A6FFCE]'
                        : 'border-white/15 bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {roleLabel(option.key)}
                  </button>
                )
              })}
            </div>
            {lockedAdminRole && (
              <p className="mt-3 text-xs text-slate-400">
                Your existing admin role is preserved automatically.
              </p>
            )}
          </PortalCard>
        </div>

        <div className="space-y-6">
          <PortalCard title="Avatar" subtitle="Profile image used across the portal">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#0E1A2D]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No avatar</span>
                  )}
                </div>
                <label className="btn inline-flex cursor-pointer items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload avatar
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                </label>
              </div>
              <p className="text-xs text-slate-400">Avatar upload is optional for completion.</p>
            </div>
          </PortalCard>

          <PortalCard title="Save" subtitle="Required fields must be completed before portal access">
            {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
            {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editMode || profileAlreadyComplete ? 'Save Changes' : 'Save & Continue'}
              </button>
              {(editMode || profileAlreadyComplete) && (
                <Link to="/profile" className="btn btn-secondary">
                  Cancel
                </Link>
              )}
            </div>
          </PortalCard>
        </div>
      </div>
    </main>
  )
}
