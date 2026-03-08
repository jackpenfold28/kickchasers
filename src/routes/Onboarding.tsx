import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

export default function Onboarding(){
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) {
        setNeedsVerify(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id,name')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (profile?.name) {
        nav('/hub', { replace: true })
      }
    })()
  }, [nav])

  async function save(){
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if(!user){
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, name: name.trim() || null })

    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }

    nav('/hub', { replace: true })
  }

  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="h1">Welcome</h1>
        <div className="card p-4 space-y-3">
          <p className="text-white/80">Set up your portal profile.</p>
          <label className="text-sm text-white/80">Display Name</label>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
          <button className="btn btn-primary" onClick={save} disabled={saving || needsVerify}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
        {needsVerify && (
          <div className="rounded-md border border-amber-400/40 bg-amber-500/10 p-3 text-amber-200 text-sm">
            Verify your email, then sign in again to continue.
          </div>
        )}
      </div>
    </main>
  )
}
