import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

const LOGO_BUCKET = 'team-logos'

type ProfileRow = {
  user_id: string
  name: string | null
  team_logo_path: string | null
}

export default function Profile(){
  const nav = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPath, setLogoPath] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        nav('/login', { replace: true })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id,name,team_logo_path')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        const row = profile as ProfileRow
        setName(row.name || '')
        setLogoPath(row.team_logo_path || '')
        if (row.team_logo_path) {
          const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(row.team_logo_path)
          setLogoUrl(data?.publicUrl || '')
        }
      }

      setLoading(false)
    })()
  }, [nav])

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0] || null
    setLogoFile(f)
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setLogoUrl(String(reader.result || ''))
      reader.readAsDataURL(f)
    }
  }

  async function save(){
    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      setSaving(false)
      nav('/login', { replace: true })
      return
    }

    let nextLogoPath = logoPath || null

    if (logoFile) {
      const ext = logoFile.name.split('.').pop() || 'png'
      const path = `${user.id}/portal/team_logo_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type })

      if (uploadErr) {
        setSaving(false)
        alert(uploadErr.message)
        return
      }

      nextLogoPath = path
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: name.trim() || null,
        team_logo_path: nextLogoPath,
      })

    setSaving(false)
    if (error) {
      alert(error.message)
      return
    }

    if (nextLogoPath) {
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(nextLogoPath)
      setLogoUrl(data?.publicUrl || '')
      setLogoPath(nextLogoPath)
    }

    alert('Profile saved')
  }

  if (loading) return <main className="min-h-screen p-6 app-bg">Loading profile…</main>

  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="h1">Profile & Account</h1>
          <button className="btn" onClick={()=>nav('/hub')}>Back</button>
        </header>

        <section className="card p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-white/70">Display Name</label>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-white/70">Team Logo</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-white/10 overflow-hidden ring-1 ring-white/20 flex items-center justify-center">
                {logoUrl ? <img src={logoUrl} alt="Team logo" className="h-full w-full object-cover" /> : <span className="text-xs text-white/70">No logo</span>}
              </div>
              <button className="btn" onClick={()=>fileInputRef.current?.click()} type="button">Upload Logo</button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pickLogo} />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </section>
      </div>
    </main>
  )
}
