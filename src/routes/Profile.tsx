import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { setClubColours } from '@/lib/theme'

const LOGO_BUCKET = 'team-logos'

export default function Profile(){
  const nav = useNavigate()

  // ── Personal
  const [name, setName] = useState('')
  const [role, setRole] = useState('Coach')
  const [state, setState] = useState('VIC')

  // ── Team
  const [teamName, setTeamName] = useState('')
  const [league, setLeague] = useState('')
  const [teamEditing, setTeamEditing] = useState(false)

  // ── Colours
  const [primary, setPrimary] = useState<string>(localStorage.getItem('club_primary') || '#003C77')
  const [secondary, setSecondary] = useState<string>(localStorage.getItem('club_secondary') || '#ffffff')
  const [primaryHex, setPrimaryHex] = useState<string>('')
  const [secondaryHex, setSecondaryHex] = useState<string>('')

  // ── Logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── UX
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string>('')
  const [confirmText, setConfirmText] = useState('')

  // Helpers
  const initials = (s:string)=> s?.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()).join('') || 'T'
  const normaliseHex = (v:string)=>{
    let x = (v || '').trim()
    if (!x) return ''
    if (x[0] !== '#') x = `#${x}`
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(x)) return x.toUpperCase()
    return ''
  }

  // Keep theme in sync with chosen colours
  useEffect(()=>{ setClubColours(primary,secondary) },[primary,secondary])

  // Initialise hex inputs when colours change
  useEffect(()=>{ setPrimaryHex(primary); setSecondaryHex(secondary) },[primary,secondary])

  // ── Load profile + team + logo
  useEffect(()=>{ (async()=>{
    async function resolveLatestLogo(userId: string) {
      const bucket = supabase.storage.from(LOGO_BUCKET)
      const list = async (prefix: string) => {
        const { data } = await bucket.list(prefix, { limit: 25, sortBy: { column: 'created_at', order: 'desc' } })
        return data || []
      }
      let entries = await list(userId)
      const fileEntry = entries.find(e => !!e.metadata)
      if (fileEntry) {
        const path = `${userId}/${fileEntry.name}`
        const { data } = bucket.getPublicUrl(path)
        if (data?.publicUrl) {
          setLogoPath(path)
          setLogoUrl(data.publicUrl)
          return
        }
      } else {
        const folder = entries[0]
        if (folder?.name) {
          entries = await list(`${userId}/${folder.name}`)
          const innerFile = entries.find(e => !!e.metadata)
          if (innerFile) {
            const path = `${userId}/${folder.name}/${innerFile.name}`
            const { data } = bucket.getPublicUrl(path)
            if (data?.publicUrl) {
              setLogoPath(path)
              setLogoUrl(data.publicUrl)
              return
            }
          }
        }
      }
    }

    const { data:{ user } } = await supabase.auth.getUser()
    if(!user){ nav('/'); return }

    // profile
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('user_id', user.id).maybeSingle()
    if(profile){
      setName(profile.name||'');
      setRole(profile.game_day_role||'Coach');
      setState(profile.state||'VIC');
      if (profile.team_logo_path) {
        setLogoPath(profile.team_logo_path);
        const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(profile.team_logo_path);
        if (data?.publicUrl) setLogoUrl(data.publicUrl);
      } else if (profile.team_logo_url) {
        // Backwards compatibility if any rows still have a full URL
        setLogoUrl(profile.team_logo_url);
      }
    }

    // team
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if(team){
      setTeamName(team.name || '')
      setLeague(team.league || '')
      if (team.colors?.primary) setPrimary(team.colors.primary)
      if (team.colors?.secondary) setSecondary(team.colors.secondary)

      // Logo: accept either a full URL or a storage path, but only if we don't already have one from profile
      if (!logoUrl) {
        if (team.logo_url) {
          const raw = String(team.logo_url)
          const isHttp = /^https?:\/\//i.test(raw)
          if (isHttp) {
            setLogoUrl(raw)
          } else {
            // If only a path is stored, build a public URL from Storage
            try {
              const { data: { user } } = await supabase.auth.getUser()
              const uid = user?.id ?? ''
              const basePath = raw.startsWith(uid + '/') || raw === uid ? raw : `${uid}/${raw}`
              const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(basePath)
              if (data?.publicUrl) {
                setLogoPath(basePath)
                setLogoUrl(data.publicUrl)
              } else {
                await resolveLatestLogo(user.id)
              }
            } catch (e) { /* noop */ }
          }
        } else {
          await resolveLatestLogo(user.id)
        }
      }

      setTeamEditing(!(team.name && team.league))
    } else {
      // Fallback: show most recent file in user's folder (public URL)
      try{
        await resolveLatestLogo(user.id)
      }catch{ /* noop */ }
      setTeamEditing(true)
    }

    setLoading(false)
  })() },[nav])

  async function save(){
    setError(''); setSuccess(''); setSaving(true)
    try{
      const { data:{ user } } = await supabase.auth.getUser(); if(!user) throw new Error('Not signed in')

      // Upload logo (optional)
      let logoUrlToSave = logoUrl || ''
      let logoPathToSave = logoPath || ''
      if(logoFile){
        const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml']
        if(!allowed.includes(logoFile.type)) throw new Error('Please upload PNG, JPG, SVG or WebP (max 2MB).')
        if(logoFile.size > 2*1024*1024) throw new Error('Logo is too large (max 2MB).')

        const path = `${user.id}/team_${Date.now()}.${logoFile.name.split('.').pop()}`
        const { error: upErr } = await supabase.storage.from(LOGO_BUCKET)
          .upload(path, logoFile, { upsert:true, cacheControl:'3600', contentType:logoFile.type })
        if(upErr) throw upErr
        const { data: pub, error: pubErr } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
        if(pubErr) throw pubErr
        logoPathToSave = path;
        logoUrlToSave = pub.publicUrl;
        setLogoPath(logoPathToSave);
        setLogoUrl(logoUrlToSave);
      }

      // Upsert profile (persist team logo path)
      await supabase.from('profiles').upsert({
        user_id: user.id,
        name,
        game_day_role: role,
        state,
        team_logo_path: logoPathToSave || null
      })

      // Upsert team
      const { data: existing } = await supabase
        .from('teams').select('id')
        .eq('owner_user_id', user.id)
        .order('created_at',{ ascending:true }).limit(1)

      const payload:any = { name:teamName, league, state, colors:{primary,secondary}, ...(logoUrlToSave?{logo_url:logoUrlToSave}:{}) }
      if(existing && existing.length){
        await supabase.from('teams').update(payload).eq('id', existing[0].id)
      }else{
        await supabase.from('teams').insert({ owner_user_id:user.id, ...payload })
      }

      localStorage.setItem('club_primary', primary)
      localStorage.setItem('club_secondary', secondary)
      setClubColours(primary, secondary)
      setTeamEditing(false)
      setSuccess('Profile updated.')
    }catch(e:any){
      setError(e?.message || 'Something went wrong saving your profile.')
    }finally{
      setSaving(false)
    }
  }

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0] || null
    setLogoFile(f)
    if(f){ const r = new FileReader(); r.onload = ()=> setLogoUrl(r.result as string); r.readAsDataURL(f) }
  }

  if(loading) return <div className="p-6">Loading…</div>

  // Danger zone helpers
  async function deleteAllUserAssets(uid: string) {
    try {
      const bucket = supabase.storage.from(LOGO_BUCKET)
      // list direct files in user root
      const root = await bucket.list(uid, { limit: 100 })
      const files = (root.data || []).filter(e => !!e.metadata).map(e => `${uid}/${e.name}`)
      const folders = (root.data || []).filter(e => !e.metadata).map(e => e.name)

      if (files.length) {
        await bucket.remove(files)
      }

      // recurse one level into any folders within the user's directory
      for (const folder of folders) {
        const inner = await bucket.list(`${uid}/${folder}`, { limit: 100 })
        const innerFiles = (inner.data || []).filter(e => !!e.metadata).map(e => `${uid}/${folder}/${e.name}`)
        if (innerFiles.length) {
          await bucket.remove(innerFiles)
        }
      }
    } catch {
      // ignore storage errors so data wipe can continue
    }
  }

  async function wipeAccount() {
    setDeleteErr('')
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteErr('Please type DELETE to confirm.')
      return
    }
    try {
      setDeleting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDeleteErr('You are not signed in.')
        setDeleting(false)
        return
      }

      // 1) Delete Storage assets (best-effort)
      await deleteAllUserAssets(user.id)

      // 2) Delete teams owned by this user (CASCADE will remove games, events, game_players)
      await supabase.from('teams').delete().eq('owner_user_id', user.id)

      // 3) Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id)

      // 4) (Optional) Try to delete the auth user via Edge Function if you add one
      try {
        // If you create a Supabase Edge Function called 'delete-user' that deletes the auth user with service role,
        // this will invoke it using the current access token:
        await supabase.functions.invoke('delete-user', { body: {}, headers: {} })
      } catch {
        // ignore if not configured
      }

      // 5) Sign out and take to register
      await supabase.auth.signOut()
      nav('/register', { replace: true })
    } catch (e: any) {
      setDeleteErr(e?.message || 'Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers"
            className="h-14 w-auto drop-shadow-lg select-none"
            draggable={false}
          />
          <div>
            <h1 className="h1 leading-tight">Your Profile</h1>
            <p className="text-muted-foreground mt-1">Update your details, team identity, and club colours. Changes apply across the app.</p>
          </div>
        </div>
        <button className="btn" onClick={()=>nav('/hub')}>Back to Hub</button>
      </div>

      {/* Alerts */}
      {!!error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>
      )}
      {!!success && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – personal */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-lg">Personal</h2>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Name</label>
              <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Game day role</label>
              <select value={role} onChange={e=>setRole(e.target.value)} className="input appearance-none">
                <option>Coach</option><option>Assistant</option><option>Runner</option><option>Analyst</option><option>Volunteer</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">State</label>
              <select value={state} onChange={e=>setState(e.target.value)} className="input appearance-none">
                <option>VIC</option><option>NSW</option><option>QLD</option><option>SA</option><option>WA</option><option>TAS</option><option>NT</option><option>ACT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right – team */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">Team identity</h2>
              <button type="button" className="btn text-sm" onClick={()=>setTeamEditing(v=>!v)}>{teamEditing?'Done':'Edit'}</button>
            </div>

            {/* Logo + actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {logoUrl ? (
                  <img src={logoUrl} alt="Team logo" loading="lazy" className="h-28 w-28 rounded-xl object-cover ring-1 ring-white/10"/>
                ) : (
                  <div className="h-28 w-28 rounded-xl grid place-items-center bg-muted text-2xl font-semibold ring-1 ring-white/10">{initials(teamName)}</div>
                )}
                {!teamEditing && (
                  <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/20 text-xs text-white/70">Locked — Edit to change</span>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo}/>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">PNG / JPG / SVG / WebP • Max 2MB • Square works best. We’ll show a preview.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-primary" onClick={()=>fileInputRef.current?.click()} disabled={!teamEditing}>Upload Logo</button>
                  {logoUrl && <button className="btn" onClick={()=>{ setLogoFile(null); setLogoUrl(''); setLogoPath('') }} disabled={!teamEditing}>Remove</button>}
                </div>
              </div>
            </div>

            {/* Team name / league */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Team name</label>
                <Input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="e.g. Imperials Football Club" disabled={!teamEditing} className={!teamEditing ? 'opacity-70 pointer-events-none' : ''}/>
              </div>
              <div className="grid gap-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">League</label>
                <Input value={league} onChange={e=>setLeague(e.target.value)} placeholder="e.g. Community League" disabled={!teamEditing} className={!teamEditing ? 'opacity-70 pointer-events-none' : ''}/>
              </div>
            </div>

            {/* Colours */}
            <div className="mt-6">
              <h3 className="font-medium">Club colours</h3>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                {/* Primary */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md ring-1 ring-white/10" style={{background:primary}} />
                  <div className="flex-1 grid grid-cols-[auto,1fr,8rem] items-center gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Primary</label>
                    <Input type="color" value={primary} onChange={e=>setPrimary(e.target.value)} disabled={!teamEditing} className={!teamEditing ? 'opacity-70 pointer-events-none' : ''}/>
                    <Input value={primaryHex} onChange={e=>{const x=normaliseHex(e.target.value); setPrimaryHex(e.target.value); if(x) setPrimary(x)}} placeholder="#003C77" disabled={!teamEditing}/>
                  </div>
                </div>
                {/* Secondary */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md ring-1 ring-white/10" style={{background:secondary}} />
                  <div className="flex-1 grid grid-cols-[auto,1fr,8rem] items-center gap-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Secondary</label>
                    <Input type="color" value={secondary} onChange={e=>setSecondary(e.target.value)} disabled={!teamEditing} className={!teamEditing ? 'opacity-70 pointer-events-none' : ''}/>
                    <Input value={secondaryHex} onChange={e=>{const x=normaliseHex(e.target.value); setSecondaryHex(e.target.value); if(x) setSecondary(x)}} placeholder="#FFFFFF" disabled={!teamEditing}/>
                  </div>
                </div>
              </div>

              {/* Brand preview */}
              <div className="mt-4 rounded-lg ring-1 ring-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3" style={{background:primary, color:'#fff'}}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md" style={{background:secondary}}/>
                    <div className="font-semibold tracking-wide uppercase text-sm">{teamName || 'Your club'}</div>
                  </div>
                  <div className="text-xs opacity-80">Preview</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2">
              <button className="btn btn-primary disabled:opacity-50" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn" onClick={()=>nav('/hub')}>Cancel</button>
              <button className="btn" onClick={()=>{ setPrimary('#003C77'); setSecondary('#FFFFFF') }} disabled={!teamEditing}>Reset colours</button>
            </div>
            {/* Danger zone */}
            <div className="mt-8 p-5 rounded-lg border border-red-500/30 bg-red-500/10 space-y-3">
              <h3 className="font-semibold text-red-200">Delete account</h3>
              <p className="text-sm text-red-200/80">
                This will permanently delete your profile, teams, games, and stats. This cannot be undone.
                Type <span className="font-mono">DELETE</span> to confirm.
              </p>
              {deleteErr && <div className="text-sm text-red-300">{deleteErr}</div>}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                  className="input w-full sm:w-56"
                  placeholder="Type DELETE to confirm"
                  value={confirmText}
                  onChange={e=>setConfirmText(e.target.value)}
                />
                <button
                  type="button"
                  className="btn !bg-red-600 hover:!bg-red-700 disabled:opacity-50"
                  onClick={wipeAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
              <p className="text-xs text-red-200/70">
                Note: Removing the authentication user requires a server-side admin action. If configured, we attempt an Edge Function
                call; otherwise you will be signed out and can re-register with the same email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
