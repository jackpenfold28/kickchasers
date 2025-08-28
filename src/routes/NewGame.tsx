import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'

export default function NewGame(){
  const nav=useNavigate()
  const [homeTeamId,setHomeTeamId]=useState(''); 
  const [homeTeamText,setHomeTeamText]=useState('')
  const [teams,setTeams]=useState<any[]>([])
  const [opponent,setOpponent]=useState('Stirling')
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,16))
  const [venue,setVenue]=useState('Home')
  const [quarterLength,setQuarterLength]=useState(20)
  const [trackBoth,setTrackBoth]=useState(true)

  const [oppLogoUploading, setOppLogoUploading] = useState(false)
  const [oppLogoPath, setOppLogoPath] = useState('')
  const [oppLogoUrl, setOppLogoUrl] = useState('')

  useEffect(()=>{
    (async()=>{
      const {data}=await supabase.from('teams').select('id,name').order('name');
      setTeams(data||[]);
      if(data?.[0]) { setHomeTeamId(data[0].id); setHomeTeamText(data[0].name); }
    })()
  },[])

  function syncTeamIdFromText(txt:string){
    setHomeTeamText(txt);
    const match = teams.find(t => t.name.toLowerCase() === txt.trim().toLowerCase());
    if(match) setHomeTeamId(match.id);
  }

  async function uploadOpponentLogo(file: File){
    if(!file) return;
    try{
      setOppLogoUploading(true)
      const { data:auth } = await supabase.auth.getUser()
      const uid = auth.user?.id || 'anon'
      const ext = file.name.split('.').pop() || 'png'
      const path = `${uid}/opponents/${Date.now()}.${ext}`
      const { error:upErr } = await supabase.storage.from('team-logos').upload(path, file, { upsert:true, contentType:file.type })
      if(upErr) throw upErr
      setOppLogoPath(path)
      const { data:pub } = supabase.storage.from('team-logos').getPublicUrl(path)
      setOppLogoUrl(pub.publicUrl)
    }catch(e:any){
      alert(e.message || 'Logo upload failed')
    }finally{
      setOppLogoUploading(false)
    }
  }

  async function create(){
    // Ensure homeTeamId is resolved from homeTeamText if empty
    let resolvedHomeTeamId = homeTeamId;
    if(!resolvedHomeTeamId){
      const match = teams.find(t => t.name.toLowerCase() === homeTeamText.trim().toLowerCase());
      if(match) {
        resolvedHomeTeamId = match.id;
        setHomeTeamId(match.id);
      } else {
        alert('Please select a valid Home Team from the list.');
        return;
      }
    }

    const { data:user }=await supabase.auth.getUser()
    const payload:any = {
      home_team_id:resolvedHomeTeamId,
      opponent,
      date:new Date(date).toISOString(),
      venue,
      quarter_length:quarterLength,
      created_by:user.user?.id,
      status:'live',
      away_team_name:trackBoth?opponent:null,
      track_both_teams: trackBoth,
    }
    if(oppLogoPath) payload.opponent_logo_path = oppLogoPath

    // Insert with graceful fallback if optional columns aren't present yet
    const tryInsert = async () => {
      // First attempt
      let res = await supabase.from('games').insert(payload).select('id').single()
      if(!res.error) return res

      const msg = res.error.message || ''
      let mutated = false
      if(/column\s+.*opponent_logo_path/i.test(msg)) { delete (payload as any).opponent_logo_path; mutated = true }
      if(/column\s+.*track_both_teams/i.test(msg)) { delete (payload as any).track_both_teams; mutated = true }

      if(mutated){
        // Retry once without the missing columns
        res = await supabase.from('games').insert(payload).select('id').single()
      }
      return res
    }

    const gameRes = await tryInsert()
    if(gameRes.error){ alert(gameRes.error.message); return }
    // Persist the choice for Setup to read defensively
    const newGameId = gameRes.data.id as string
    try {
      localStorage.setItem(`game:trackBoth:${newGameId}`, trackBoth ? '1' : '0')
    } catch {}

    // Also pass it via query string to avoid any race with DB schema
    const qs = trackBoth ? '1' : '0'
    nav(`/setup/${newGameId}?both=${qs}`)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <header className="mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers"
            className="h-10 md:h-12 w-auto drop-shadow-lg select-none"
            draggable={false}
          />
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">New Game</h1>
        </div>
        <p className="text-sm text-white/60 mt-1">Set your matchup details. You can tweak anything later.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.03] shadow-xl backdrop-blur-md p-5 md:p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Home team */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Home Team</label>
            {/* Searchable picker */}
            <input
              className="input w-full"
              list="teams-list"
              value={homeTeamText}
              onChange={(e)=>syncTeamIdFromText(e.target.value)}
              placeholder="Start typing…"
            />
            <datalist id="teams-list">
              {teams.map(t => <option key={t.id} value={t.name} />)}
            </datalist>
            <p className="text-[11px] text-white/50">Choose your club to match logos and colours.</p>
          </div>

          {/* Opponent */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Opponent</label>
            <Input value={opponent} onChange={e=>setOpponent(e.target.value)} placeholder="e.g. Stirling"/>
          </div>

          {/* Opponent logo (optional) */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Opponent Logo (optional)</label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full ring-1 ring-white/15 bg-white/5 overflow-hidden flex items-center justify-center">
                {oppLogoUrl ? (
                  <img src={oppLogoUrl} alt="opponent logo" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-[10px] text-white/40">No logo</span>
                )}
              </div>
              <label className="btn cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f) uploadOpponentLogo(f)}} />
                {oppLogoUploading ? 'Uploading…' : (oppLogoUrl ? 'Replace Logo' : 'Upload Logo')}
              </label>
            </div>
          </div>

          {/* Date & time */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Date &amp; Time</label>
            <Input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Venue</label>
            <Input value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Home / Away / Ground name"/>
          </div>

          {/* Quarter length */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/70">Quarter Length (mins)</label>
            <Input type="number" value={quarterLength} onChange={e=>setQuarterLength(parseInt(e.target.value||'20',10))} />
          </div>

          {/* Track both */}
          <div className="flex items-center gap-3 pt-1">
            <input id="track-both" type="checkbox" className="scale-110" checked={trackBoth} onChange={e=>setTrackBoth(e.target.checked)}/>
            <label htmlFor="track-both" className="text-[13px] text-white/80">Track both teams in‑game</label>
          </div>
          <p className="text-[11px] text-white/50">
            When off, only your squad is shown with a simple opponent score tracker.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-[11px] text-white/50">Tip: keeping both teams enabled makes live graphs &amp; summaries richer.</p>
          <div className="flex gap-3 justify-end">
            <button className="btn" onClick={()=>history.back()}>Cancel</button>
            <button className={`btn btn-primary ${oppLogoUploading ? 'opacity-70 cursor-not-allowed' : ''}`} onClick={create} disabled={oppLogoUploading}>Continue to Setup</button>
          </div>
        </div>
      </section>
    </div>
  )
}
