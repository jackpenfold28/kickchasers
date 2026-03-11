import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const LOGO_BUCKET = 'team-logos'

type ProfileRow = {
  user_id: string
  name: string | null
  team_logo_path: string | null
}

type SquadMemberRow = {
  squad_id: string
  role: string
  status: string
}

type SquadRow = {
  id: string
  name: string | null
  is_official: boolean | null
}

function toPublicLogoUrl(path?: string | null){
  if(!path) return ''
  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

export default function Hub(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [memberRows, setMemberRows] = useState<SquadMemberRow[]>([])
  const [ownedSquads, setOwnedSquads] = useState<SquadRow[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        nav('/sign-in', { replace: true })
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id,name,team_logo_path')
        .eq('user_id', user.id)
        .maybeSingle()

      if (prof) {
        setProfile(prof as ProfileRow)
        setLogoUrl(toPublicLogoUrl(prof.team_logo_path))
      }

      const { data: members } = await supabase
        .from('squad_members')
        .select('squad_id,role,status')
        .eq('user_id', user.id)

      setMemberRows((members || []) as SquadMemberRow[])

      const { data: squads } = await supabase
        .from('squads')
        .select('id,name,is_official')
        .eq('owner_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      setOwnedSquads((squads || []) as SquadRow[])
      setLoading(false)
    })()
  }, [nav])

  const acceptedMemberships = useMemo(
    () => memberRows.filter(m => m.status === 'accepted').length,
    [memberRows]
  )

  async function logout(){
    await supabase.auth.signOut()
    nav('/sign-in', { replace: true })
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading dashboard…</main>
  }

  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="card p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/10 overflow-hidden flex items-center justify-center ring-1 ring-white/20">
              {logoUrl ? <img src={logoUrl} alt="Team logo" className="h-full w-full object-cover" /> : <span className="text-xs text-white/70">No logo</span>}
            </div>
            <div>
              <h1 className="h1">Dashboard</h1>
              <p className="text-white/75">{profile?.name ? `Welcome, ${profile.name}` : 'Welcome to KickChasers Portal'}</p>
            </div>
          </div>
          <button className="btn" onClick={logout}>Log out</button>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-white/70">Owned Squads</div>
            <div className="text-3xl font-semibold mt-1">{ownedSquads.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-white/70">Accepted Memberships</div>
            <div className="text-3xl font-semibold mt-1">{acceptedMemberships}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-white/70">Portal Scope</div>
            <div className="text-sm mt-2 text-white/80">Profile, squads, and settings only.</div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn btn-primary" to="/profile">Manage Profile</Link>
            <Link className="btn" to="/squad">Manage Squads</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
