import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

export default function Onboarding(){
  const nav=useNavigate()
  const [name,setName]=useState(''); const [role,setRole]=useState('Coach')
  const [team,setTeam]=useState('Imperials Football Club'); const [league,setLeague]=useState('Sunraysia FL')
  const [state,setState]=useState('VIC'); const [saving,setSaving]=useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendSending, setResendSending] = useState(false)
  const [resendNote, setResendNote] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(()=>{ (async()=>{
    // If register appended verify=1, show banner immediately
    const verifyFlag = searchParams.get('verify') === '1'

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setNeedsVerify(true)
      return
    }
    setNeedsVerify(!!verifyFlag && !session)

    const user = session.user

    // Owner-scoped checks
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (profile && team) nav('/hub')
  })() },[nav, searchParams])

  async function resendVerification(){
    setResendNote(null)
    const email = resendEmail.trim()
    if (!email) {
      setResendNote('Please enter your email address first.')
      return
    }
    setResendSending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setResendNote(error.message)
    } else {
      setResendNote('Verification email sent. Check your inbox.')
    }
    setResendSending(false)
  }

  async function refreshSession(){
    const { data: { session } } = await supabase.auth.getSession()
    setNeedsVerify(!session)
  }

  async function save(){
    setSaving(true)
    const { data:{user} } = await supabase.auth.getUser();
    if(!user){ setSaving(false); return }

    // 1) Upsert profile for this user
    const { error: pErr } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, name, game_day_role: role, state });
    if (pErr) { alert(pErr.message); setSaving(false); return }

    // 2) Check if this user already owns a team
    const { data: existingTeam, error: findErr } = await supabase
      .from('teams')
      .select('id')
      .eq('owner_user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (findErr) { alert(findErr.message); setSaving(false); return }

    if (existingTeam?.id) {
      // Update their team
      const { error: tUpdErr } = await supabase
        .from('teams')
        .update({ name: team, league, state })
        .eq('id', existingTeam.id);
      if (tUpdErr) { alert(tUpdErr.message); setSaving(false); return }
    } else {
      // Create a new team for this owner
      const { error: tInsErr } = await supabase
        .from('teams')
        .insert({ owner_user_id: user.id, name: team, league, state });
      if (tInsErr) { alert(tInsErr.message); setSaving(false); return }
    }

    setSaving(false)
    nav('/hub')
  }

  return <div className="max-w-xl mx-auto p-6 space-y-4">
    <div className="flex items-center gap-5">
      <img
        src="/kickchasers_logo.png"
        alt="Kickchasers"
        className="h-14 w-auto drop-shadow-lg select-none"
        draggable={false}
      />
      <h1 className="h1">Welcome — quick setup</h1>
    </div>
    <div className="grid gap-4 card p-4">
      <h2 className="text-base font-semibold opacity-90">Your details</h2>
      <label className="text-sm opacity-80">Your Name</label>
      <Input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Jack Penfold"/>

      <label className="text-sm mt-2 opacity-80">Game Day Role</label>
      <div className="relative">
        <select value={role} onChange={e=>setRole(e.target.value)}
                className="input appearance-none pr-10">
          <option>Coach</option>
          <option>Assistant</option>
          <option>Runner</option>
          <option>Analyst</option>
          <option>Volunteer</option>
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </div>

      <h2 className="text-base font-semibold opacity-90 mt-4">Team</h2>
      <label className="text-sm opacity-80">Team (Club)</label>
      <Input className="input" value={team} onChange={e=>setTeam(e.target.value)} />

      <label className="text-sm mt-2 opacity-80">League</label>
      <Input className="input" value={league} onChange={e=>setLeague(e.target.value)} />

      <label className="text-sm mt-2 opacity-80">State</label>
      <div className="relative">
        <select value={state} onChange={e=>setState(e.target.value)}
                className="input appearance-none pr-10">
          <option>VIC</option>
          <option>NSW</option>
          <option>QLD</option>
          <option>SA</option>
          <option>WA</option>
          <option>TAS</option>
          <option>NT</option>
          <option>ACT</option>
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn btn-primary" onClick={save} disabled={saving || needsVerify}>
          {saving ? 'Saving…' : 'Save & Continue'}
        </button>
      </div>
    </div>
    {needsVerify && (
      <div className="rounded-md border border-amber-400/40 bg-amber-500/10 p-3 text-amber-200 text-sm">
        <div className="font-medium mb-1">Verify your email to continue</div>
        <div>We’ve sent a confirmation link to your email. Open it on this device, then come back and tap Refresh.</div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" className="btn btn-secondary" onClick={refreshSession}>Refresh session</button>
          <div className="flex items-center gap-2">
            <input
              value={resendEmail}
              onChange={e=>setResendEmail(e.target.value)}
              placeholder="your@email.com"
              className="input h-9"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={resendVerification}
              disabled={resendSending}
            >{resendSending ? 'Sending…' : 'Resend verification'}</button>
          </div>
        </div>
        {resendNote && <div className="mt-2 text-xs opacity-80">{resendNote}</div>}
      </div>
    )}
  </div>
}
