import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import {
  createSquad,
  listLeagueGrades,
  listLeaguesByState,
  listStates,
  type GradeOption,
  type LeagueOption,
  type StateOption,
  uploadSquadLogo,
} from '@/lib/squads'

export default function SquadCreatePage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [states, setStates] = useState<StateOption[]>([])
  const [leagues, setLeagues] = useState<LeagueOption[]>([])
  const [grades, setGrades] = useState<GradeOption[]>([])

  const [name, setName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [leagueId, setLeagueId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [isOfficial, setIsOfficial] = useState(false)
  const [clubName, setClubName] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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

        const stateRows = await listStates()
        if (cancelled) return

        setUserId(user.id)
        setStates(stateRows)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load create squad form.')
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
    let cancelled = false

    ;(async () => {
      if (!stateCode) {
        setLeagues([])
        setLeagueId('')
        setGrades([])
        setGradeId('')
        return
      }

      try {
        const rows = await listLeaguesByState(stateCode)
        if (!cancelled) setLeagues(rows)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load leagues.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stateCode])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!leagueId || isOfficial) {
        setGrades([])
        setGradeId('')
        return
      }
      try {
        const rows = await listLeagueGrades(leagueId)
        if (!cancelled) setGrades(rows)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load grades.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOfficial, leagueId])

  const filteredLeagues = useMemo(() => {
    const query = leagueFilter.trim().toLowerCase()
    if (!query) return leagues
    return leagues.filter((league) => (league.name || '').toLowerCase().includes(query))
  }, [leagueFilter, leagues])

  const filteredGrades = useMemo(() => {
    const query = gradeFilter.trim().toLowerCase()
    if (!query) return grades
    return grades.filter((grade) => (grade.name || '').toLowerCase().includes(query))
  }, [gradeFilter, grades])

  function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setLogoFile(file)
    if (!file) {
      setLogoPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => setLogoPreview(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function submit() {
    setError(null)
    if (!userId) {
      navigate('/sign-in', { replace: true })
      return
    }

    if (!name.trim()) {
      setError('Squad name is required.')
      return
    }

    if (!stateCode || !leagueId) {
      setError('State and league are required.')
      return
    }

    if (!isOfficial && !gradeId) {
      setError('Grade is required for custom squads.')
      return
    }

    setSaving(true)
    try {
      let logoPath: string | null = null
      if (logoFile) {
        logoPath = await uploadSquadLogo(userId, logoFile)
      }

      const squadId = await createSquad({
        ownerId: userId,
        name,
        stateCode,
        leagueId,
        gradeId: isOfficial ? null : gradeId,
        isOfficial,
        clubName: isOfficial ? clubName || name : null,
        logoUrl: logoPath,
      })

      navigate(`/squads/${squadId}`, { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create squad.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading create squad form…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">Create Squad</h2>
            <p className="mt-1 text-sm text-slate-400">Set up your squad roster workspace for portal management.</p>
          </div>
          <Link to="/squads" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </PortalCard>

      <PortalCard title="Squad Setup" subtitle="Use the same create-squad model as mobile with desktop form UX">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span>Squad Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Brighton Tigers Seniors" />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>State</span>
            <select className="input" value={stateCode} onChange={(event) => setStateCode(event.target.value)}>
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name || state.code}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Squad Type</span>
            <select className="input" value={isOfficial ? 'official' : 'custom'} onChange={(event) => setIsOfficial(event.target.value === 'official')}>
              <option value="custom">Custom Squad</option>
              <option value="official">Official Squad</option>
            </select>
          </label>

          <div className="space-y-2 text-sm text-slate-300">
            <span>League Search</span>
            <Input value={leagueFilter} onChange={(event) => setLeagueFilter(event.target.value)} placeholder="Filter leagues" />
            <select className="input" value={leagueId} onChange={(event) => setLeagueId(event.target.value)}>
              <option value="">Select league</option>
              {filteredLeagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          {isOfficial ? (
            <label className="space-y-2 text-sm text-slate-300">
              <span>Club Name</span>
              <Input
                value={clubName}
                onChange={(event) => setClubName(event.target.value)}
                placeholder="Club name (defaults to squad name)"
              />
            </label>
          ) : (
            <div className="space-y-2 text-sm text-slate-300">
              <span>Grade Search</span>
              <Input value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} placeholder="Filter grades" />
              <select className="input" value={gradeId} onChange={(event) => setGradeId(event.target.value)}>
                <option value="">Select grade</option>
                {filteredGrades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name || grade.code || grade.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span>Logo</span>
            {logoPreview && (
              <div className="h-28 w-28 overflow-hidden rounded-xl border border-white/15">
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="btn btn-secondary inline-flex cursor-pointer">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
            </label>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button className="btn btn-primary mt-5" disabled={saving} onClick={submit}>
          {saving ? 'Creating…' : 'Create Squad'}
        </button>
      </PortalCard>
    </section>
  )
}
