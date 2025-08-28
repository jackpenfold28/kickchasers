import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'

type Row = { number:number; name:string }

export default function Setup(){
  const { gameId } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const [home, setHome] = useState<Row[]>([])
  const [away, setAway] = useState<Row[]>([])
  const [bothTeams, setBothTeams] = useState(true)
  const [opponentName, setOpponentName] = useState<string>('')
  const [homeTeamName, setHomeTeamName] = useState<string>('')
  const [gameTitle, setGameTitle] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  useEffect(()=>{ (async()=>{
    // 1) Read game config (to know if we track both teams) and opponent label
    const { data: gameData } = await supabase
      .from('games')
      .select(`
        opponent,
        away_team_name,
        date,
        home_team_id,
        track_both_teams,
        track_both_sides,
        track_both,
        home_team:home_team_id ( name )
      `)
      .eq('id', gameId)
      .maybeSingle()

    // Prefer URL param (?both=1|0) → localStorage → DB column
    let decided: boolean | null = null

    // URL param first
    const params = new URLSearchParams(location.search)
    const qsBoth = params.get('both')
    if (qsBoth != null) {
      decided = qsBoth === '1' || qsBoth === 'true'
    }

    // localStorage fallback by game id
    if (decided == null && gameId) {
      try {
        const ls = localStorage.getItem(`game:trackBoth:${gameId}`)
        if (ls != null) decided = ls === '1' || ls === 'true'
      } catch {}
    }

    // DB value last
    if (decided == null) {
      const raw = (gameData as any)?.track_both_teams ?? (gameData as any)?.track_both_sides ?? (gameData as any)?.track_both
      if (raw == null) {
        decided = true // default to true if nothing set anywhere
      } else {
        decided = raw === true || raw === 1 || raw === '1' || raw === 'true'
      }
    }

    setBothTeams(Boolean(decided))

    const oppName = (gameData as any)?.away_team_name ?? (gameData as any)?.opponent ?? ''
    const homeName = (gameData as any)?.home_team?.name ?? ''
    setOpponentName(oppName)
    setHomeTeamName(homeName)

    const d = (gameData as any)?.date ? new Date((gameData as any).date) : null
    const niceDate = d ? d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }) : ''
    setDateStr(niceDate)

    // 2) Load any existing player rows
    const { data } = await supabase.from('game_players')
      .select('team_side, number, name').eq('game_id',gameId).order('team_side, number')

    const h = (data??[]).filter(r=>r.team_side==='home').map(r=>({number:r.number, name:r.name}))
    const a = (data??[]).filter(r=>r.team_side==='away').map(r=>({number:r.number, name:r.name}))

    let homeRows: Row[] = h
    if (!homeRows.length && (gameData as any)?.home_team_id) {
      // Try the most recent 5 games for this home team and pick the first that has saved players
      const homeTeamId = (gameData as any)?.home_team_id
      const { data: recentGames } = await supabase
        .from('games')
        .select('id, date')
        .eq('home_team_id', homeTeamId)
        .neq('id', gameId)
        .order('date', { ascending: false, nullsFirst: false })
        .limit(5)

      const ids = (recentGames ?? []).map(g => g.id)
      if (ids.length) {
        const { data: gp } = await supabase
          .from('game_players')
          .select('game_id, team_side, number, name')
          .in('game_id', ids)
          .eq('team_side', 'home')
          .order('number', { ascending: true })

        if (gp && gp.length) {
          // Choose the most recent game (by ids order above) that actually had rows
          for (const gid of ids) {
            const rowsForGame = gp.filter(r => r.game_id === gid)
            if (rowsForGame.length) {
              homeRows = rowsForGame.map(r => ({ number: r.number, name: r.name || '' }))
              break
            }
          }
        }
      }
    }

    setHome(homeRows.length ? homeRows : Array.from({length:26},(_,i)=>({number:i+1,name:''})))
    setAway(a.length ? a : Array.from({length:26},(_,i)=>({number:i+1,name:''})))
  })() }, [gameId, location.search])

  function reset(){
    setHome(Array.from({length:26},(_,i)=>({number:i+1,name:''})))
    setAway(Array.from({length:26},(_,i)=>({number:i+1,name:''})))
  }

  async function start(){
    await supabase.from('game_players').delete().eq('game_id',gameId)
    const h = home.filter(r=>r.number && r.name.trim()).map(r=>({game_id:gameId,team_side:'home',...r}))
    const a = bothTeams ? away.filter(r=>r.number && r.name.trim()).map(r=>({game_id:gameId,team_side:'away',...r})) : []
    if(h.length) await supabase.from('game_players').insert(h)
    if(a.length) await supabase.from('game_players').insert(a)
    nav(`/game/${gameId}`)
  }

  const displayTitle = `${homeTeamName || 'Home Team'} vs ${opponentName || 'Opponent'}${dateStr ? ' — ' + dateStr : ''}`

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div className="mb-4 flex items-center gap-4">
        <img src="/kickchasers_logo.png" alt="Kickchasers" className="w-[140px] h-auto drop-shadow-lg" />
        <div className="flex-1 min-w-0">
          <div className="text-xl md:text-2xl font-semibold tracking-tight truncate">{displayTitle}</div>
          <div className="text-xs md:text-sm text-white/70 flex items-center gap-2">
            Pre‑Game • Player Setup
            {!bothTeams && (
              <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">Single‑team</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost whitespace-nowrap" title="Reset all player slots" onClick={reset}>Reset 1–26</button>
          <button className="btn btn-primary whitespace-nowrap" title="Save and start match" onClick={start}>Start Match</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/2.5 backdrop-blur p-4 md:p-6">
        {bothTeams ? (
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <TeamEditor title={homeTeamName || 'Home'} rows={home} setRows={setHome}/>
            <TeamEditor title={opponentName || 'Away'} rows={away} setRows={setAway}/>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            <TeamEditor title={homeTeamName || 'Home'} rows={home} setRows={setHome}/>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-sm text-white/70 mb-2">Opponent</div>
              <div className="text-lg font-semibold">{opponentName || 'Away team'}</div>
              <p className="mt-1 text-xs text-white/50">Away player entry is hidden in single‑team mode. You can still track their score on the live screen.</p>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-5 pt-2">
          <Link to="/hub" className="btn btn-ghost text-white/60 hover:text-white" title="Back to hub">Back</Link>
        </div>
      </div>
    </div>
  )
}

function TeamEditor({ title, rows, setRows }:{
  title:string; rows:Row[]; setRows:(r:Row[])=>void
}){
  function update(i:number, field:'number'|'name', val:string){
    const next=[...rows]
    if(field==='number') next[i].number = parseInt(val||'0',10) || 0
    else next[i].name = val
    setRows(next)
  }
  function remove(i:number){
    const next=[...rows]; next.splice(i,1); setRows(next)
  }

  // Compute live filled count
  const filled = rows.filter(r=>r.name.trim()).length
  const total = rows.length

  return (
    <div>
      <div className="flex items-center mb-3 gap-2">
        <div className="text-base md:text-lg font-semibold tracking-tight">{title}</div>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">{filled}/{total}</span>
      </div>
      <div className="space-y-2">
        {rows.map((r,i)=>(
          <div
            key={i}
            className={
              `group grid grid-cols-[72px,1fr,44px] gap-2 items-center rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors
              ${i%2 ? 'bg-white/[0.02]' : 'bg-white/[0.04]'} p-2`
            }
          >
            <input
              className="input text-center font-semibold tracking-wider text-lg md:text-xl tabular-nums rounded-xl"
              style={{minWidth:'72px'}}
              type="number"
              min={0}
              value={r.number||''}
              onChange={e=>update(i,'number',e.target.value)}
            />
            <input
              className="input rounded-xl text-[15px] md:text-base font-medium placeholder:text-white/30"
              placeholder="Player name"
              value={r.name}
              onChange={e=>update(i,'name',e.target.value)}
            />
            <button
              className="btn btn-ghost h-10 text-xl px-0"
              aria-label="Remove row"
              onClick={()=>remove(i)}
              type="button"
            >×</button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-white/40">Tip: Use Tab ↹ to move across, Enter ↵ to jump to next row.</p>
    </div>
  )
}
