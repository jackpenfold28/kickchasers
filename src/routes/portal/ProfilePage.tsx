import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Save } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { roleArrayFromProfile, validateHandle } from '@/lib/profile-utils'

type ProfileRow = {
  user_id: string
  name: string | null
  handle: string | null
  avatar_url: string | null
  avatar_path: string | null
  home_state_code: string | null
  home_league_id: string | null
  home_club_id: string | null
  primary_role: string | null
  game_day_roles: string[] | null
}

function resolveAvatarUrl(avatarUrl: string | null, avatarPath: string | null): string | null {
  if (avatarUrl) return avatarUrl
  if (!avatarPath) return null
  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath)
  return data?.publicUrl || null
}

function formatHandle(handle: string | null): string {
  if (!handle) return 'No handle'
  return handle.startsWith('@') ? handle : `@${handle}`
}

export default function ProfilePage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [homeState, setHomeState] = useState<string | null>(null)
  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [clubName, setClubName] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        setUserId(user.id)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(
            'user_id,name,handle,avatar_url,avatar_path,home_state_code,home_league_id,home_club_id,primary_role,game_day_roles'
          )
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') throw profileError

        const profile = (profileData as ProfileRow | null) ?? null

        setName(profile?.name || '')
        setHandle(profile?.handle || '')
        setAvatarPath(profile?.avatar_path || null)
        setAvatarUrl(resolveAvatarUrl(profile?.avatar_url || null, profile?.avatar_path || null))
        setHomeState(profile?.home_state_code || null)
        setRoles(roleArrayFromProfile(profile?.primary_role || null, profile?.game_day_roles || null))

        const [leagueRes, clubRes] = await Promise.all([
          profile?.home_league_id
            ? supabase.from('leagues').select('name').eq('id', profile.home_league_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          profile?.home_club_id
            ? supabase.from('clubs').select('name').eq('id', profile.home_club_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ])

        if (leagueRes.error && leagueRes.error.code !== 'PGRST116') throw leagueRes.error
        if (clubRes.error && clubRes.error.code !== 'PGRST116') throw clubRes.error

        if (!cancelled) {
          setLeagueName((leagueRes.data as { name?: string | null } | null)?.name ?? null)
          setClubName((clubRes.data as { name?: string | null } | null)?.name ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const roleLabels = useMemo(() => {
    if (!roles.length) return ['No roles yet']
    return roles.map((role) => role.charAt(0).toUpperCase() + role.slice(1))
  }, [roles])

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setAvatarFile(file)
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    setError(null)
    setMessage(null)

    if (!userId) {
      navigate('/sign-in', { replace: true })
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

      if (handleError && handleError.code !== 'PGRST116') throw handleError

      const takenByAnother = (handleRows ?? []).some((row) => row.user_id !== userId)
      if (takenByAnother) {
        setError('That handle is already taken.')
        setSaving(false)
        return
      }

      let nextAvatarPath = avatarPath
      let nextAvatarUrl = avatarUrl

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `profiles/${userId}/avatar_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('profile-avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path)
        nextAvatarPath = path
        nextAvatarUrl = data.publicUrl || null
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          handle: handleValidation.sanitized,
          avatar_path: nextAvatarPath,
          avatar_url: nextAvatarUrl,
        })
        .eq('user_id', userId)

      if (updateError) throw updateError

      setAvatarPath(nextAvatarPath)
      setAvatarUrl(nextAvatarUrl)
      setAvatarFile(null)
      setMessage('Profile updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading profile…</main>
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <PortalCard>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#0E1A2D]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-slate-400">{name.slice(0, 1).toUpperCase() || 'U'}</span>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white">{name || 'Unnamed User'}</h2>
              <p className="text-sm text-slate-300">{formatHandle(handle)}</p>
              <p className="mt-2 text-xs text-slate-400">
                {clubName || 'No club selected'} {leagueName ? `• ${leagueName}` : ''} {homeState ? `• ${homeState}` : ''}
              </p>
            </div>
          </div>

          <Link to="/onboarding?mode=edit" className="btn btn-secondary">
            Edit Club / League / Roles
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {roleLabels.map((role) => (
            <span key={role} className="rounded-full border border-[#39FF88]/40 bg-[#39FF88]/15 px-3 py-1 text-xs font-medium text-[#A6FFCE]">
              {role}
            </span>
          ))}
        </div>
      </PortalCard>

      <PortalCard title="Profile Summary" subtitle="Season stats and game history wiring comes in the next phase">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Games</p>
            <p className="mt-1 text-2xl font-semibold text-white">-</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Goals</p>
            <p className="mt-1 text-2xl font-semibold text-white">-</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Disposals</p>
            <p className="mt-1 text-2xl font-semibold text-white">-</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Tackles</p>
            <p className="mt-1 text-2xl font-semibold text-white">-</p>
          </div>
        </div>
      </PortalCard>

      <PortalCard title="Edit Profile" subtitle="Update your identity fields used across the portal" className="lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Handle</span>
            <Input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="coach_jay" />
          </label>

          <div className="space-y-2 text-sm text-slate-300 md:col-span-2">
            <span>Avatar</span>
            <label className="btn inline-flex cursor-pointer items-center gap-2">
              <Camera className="h-4 w-4" />
              Choose image
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </label>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}

        <button className="btn btn-primary mt-4 inline-flex items-center gap-2" onClick={saveProfile} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </PortalCard>
    </section>
  )
}
