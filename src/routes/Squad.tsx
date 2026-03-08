import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type Squad = {
  id: string
  name: string | null
  is_official?: boolean | null
}

type MemberRow = {
  squad_id: string
  role: string
  status: string
}

export default function Squad(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [owned, setOwned] = useState<Squad[]>([])
  const [memberRows, setMemberRows] = useState<MemberRow[]>([])

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        nav('/login', { replace: true })
        return
      }

      const { data: myOwned } = await supabase
        .from('squads')
        .select('id,name,is_official')
        .eq('owner_id', user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      const { data: myMemberships } = await supabase
        .from('squad_members')
        .select('squad_id,role,status')
        .eq('user_id', user.id)

      setOwned((myOwned || []) as Squad[])
      setMemberRows((myMemberships || []) as MemberRow[])
      setLoading(false)
    })()
  }, [nav])

  const accepted = useMemo(
    () => memberRows.filter(m => m.status === 'accepted'),
    [memberRows]
  )

  const pending = useMemo(
    () => memberRows.filter(m => m.status === 'pending'),
    [memberRows]
  )

  if (loading) return <main className="min-h-screen p-6 app-bg">Loading squads…</main>

  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="h1">Squads</h1>
          <button className="btn" onClick={()=>nav('/hub')}>Back</button>
        </header>

        <section className="card p-5">
          <h2 className="text-lg font-semibold">Owned Squads</h2>
          <div className="mt-3 space-y-2">
            {owned.length === 0 && <div className="text-white/70 text-sm">No owned squads found.</div>}
            {owned.map(s => (
              <div key={s.id} className="rounded-md border border-white/10 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name || 'Untitled Squad'}</div>
                  <div className="text-xs text-white/60">{s.is_official ? 'Official' : 'Community'}</div>
                </div>
                <div className="text-xs text-white/50">{s.id.slice(0, 8)}…</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold">Membership Overview</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 p-3">
              <div className="text-xs uppercase tracking-wide text-white/70">Accepted</div>
              <div className="text-2xl font-semibold mt-1">{accepted.length}</div>
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <div className="text-xs uppercase tracking-wide text-white/70">Pending</div>
              <div className="text-2xl font-semibold mt-1">{pending.length}</div>
            </div>
          </div>
          <p className="text-xs text-white/60 mt-3">
            Squad creation/edit tooling is intentionally deferred until the portal model is fully aligned with live mobile backend flows.
          </p>
        </section>
      </div>
    </main>
  )
}
