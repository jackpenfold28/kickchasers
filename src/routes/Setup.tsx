import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'

type Row = { number:number; name:string }

export default function Setup(){
  const { gameId } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  // Squads: allow selecting a named saved squad for the HOME team
  const [squadNames, setSquadNames] = useState<string[]>([])
  const [selectedSquad, setSelectedSquad] = useState<string>('')
  const [isLoadingSquad, setIsLoadingSquad] = useState<boolean>(false)
  const [home, setHome] = useState<Row[]>([])
  const [away, setAway] = useState<Row[]>([])
  const [bothTeams, setBothTeams] = useState(true)
  const [opponentName, setOpponentName] = useState<string>('')
  const [homeTeamName, setHomeTeamName] = useState<string>('')
  const [gameTitle, setGameTitle] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')
  const [loadSuccess, setLoadSuccess] = useState<string | null>(null)

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
    const loadSquad = params.get('loadSquad') === '1' || params.get('loadSquad') === 'true';
    const qsSquad = params.get('squad') || ''
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

    // Fetch saved squad names for the current user (distinct set_name)
    let userId: string | null = null
    try {
      const { data: userData } = await supabase.auth.getUser()
      userId = userData?.user?.id ?? null
    } catch {}

    let allSquads: { set_name?: string | null; number?: number; name?: string }[] = []
    if (userId) {
      const { data: squadsData } = await supabase
        .from('squads')
        .select('set_name, number, name')
        .eq('user_id', userId)
        .order('number', { ascending: true })

      allSquads = (squadsData ?? []) as any

      // Build unique list of set names
      const names = Array.from(
        new Set(
          (allSquads as any[])
            .map(r => (r.set_name ?? '').trim())
            .filter(n => n.length > 0)
        )
      )
      setSquadNames(names)

      // Preselect if present in query string, else keep current
      if (qsSquad && names.includes(qsSquad)) setSelectedSquad(qsSquad)
      else if (!selectedSquad && names.length) setSelectedSquad(names[0])
    }

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

    // If the page was opened with ?loadSquad=1|true, try to override home list from user's saved squad
    if (loadSquad && userId) {
      try {
        const chosen = qsSquad || selectedSquad
        let filter = supabase
          .from('squads')
          .select('number, name, set_name')
          .eq('user_id', userId)
          .order('number', { ascending: true })

        if (chosen) filter = filter.eq('set_name', chosen)

        const { data: squadRows, error: squadErr } = await filter
        if (!squadErr && Array.isArray(squadRows) && squadRows.length) {
          const byNumber = new Map<number, string>()
          for (const r of squadRows as any[]) {
            const n = Number(r.number)
            if (Number.isFinite(n) && n > 0) byNumber.set(n, (r.name ?? '').trim())
          }
          const normalised = Array.from({ length: 26 }, (_, i) => ({
            number: i + 1,
            name: byNumber.get(i + 1) ?? ''
          }))
          if (normalised.some(p => p.name.trim().length > 0)) homeRows = normalised
        }
      } catch (e) {
        console.warn('Failed to load squad for home team:', e)
      }
    }

    setHome(homeRows.length ? homeRows : Array.from({length:26},(_,i)=>({number:i+1,name:''})))
    setAway(a.length ? a : Array.from({length:26},(_,i)=>({number:i+1,name:''})))
  })() }, [gameId, location.search])

  useEffect(() => {
    if (!loadSuccess) return
    const t = setTimeout(() => setLoadSuccess(null), 2200)
    return () => clearTimeout(t)
  }, [loadSuccess])

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

  async function cancelGame() {
    if (!gameId) return
    try {
      setIsCancelling(true)
      // Best-effort: delete players first (even though FK may cascade)
      await supabase.from('game_players').delete().eq('game_id', gameId)
      await supabase.from('games').delete().eq('id', gameId)
      setShowCancelConfirm(false)
      nav('/hub')
    } finally {
      setIsCancelling(false)
    }
  }

  async function loadSelectedSquadIntoHome() {
    try {
      setIsLoadingSquad(true)
      setLoadSuccess(null)
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id
      if (!uid || !selectedSquad) return

      const { data: squadRows } = await supabase
        .from('squads')
        .select('number, name')
        .eq('user_id', uid)
        .eq('set_name', selectedSquad)
        .order('number', { ascending: true })

      const byNumber = new Map<number, string>()
      for (const r of (squadRows ?? []) as any[]) {
        const n = Number(r.number)
        if (Number.isFinite(n) && n > 0) byNumber.set(n, (r.name ?? '').trim())
      }
      // Determine how many slots to show: at least 26, at most 50,
      // and enough to include the highest numbered player in the saved squad
      const highest = Math.max(0, ...Array.from(byNumber.keys()));
      const slotCount = Math.max(26, Math.min(50, highest));
      const normalised = Array.from({ length: slotCount }, (_, i) => ({
        number: i + 1,
        name: byNumber.get(i + 1) ?? ''
      }));
      setHome(normalised)
      setLoadSuccess(`Loaded${selectedSquad ? ` “${selectedSquad}”` : ''} ✓`)
    } finally {
      setIsLoadingSquad(false)
    }
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
          <button
            type="button"
            className="whitespace-nowrap rounded-xl bg-red-500/90 hover:bg-red-400 active:bg-red-500 text-white font-medium px-3.5 py-2 ring-1 ring-red-400/40 transition-colors"
            onClick={()=>setShowCancelConfirm(true)}
            title="Cancel and delete this game setup"
          >
            Cancel Game
          </button>
          {gameId ? (
            <Link
              to={`/newgame/${gameId}`}
              className="whitespace-nowrap rounded-xl bg-amber-400/95 hover:bg-amber-300 active:bg-amber-400 text-black font-medium px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] ring-1 ring-amber-500/40 transition-colors"
              title="Edit the game details (teams, date, venue)"
            >
              Edit game setup
            </Link>
          ) : (
            <span
              className="whitespace-nowrap rounded-xl bg-amber-400/40 text-black/50 font-medium px-3.5 py-2 ring-1 ring-amber-500/20 cursor-not-allowed select-none"
              title="Game ID missing"
            >
              Edit game setup
            </span>
          )}
          <button className="btn btn-primary whitespace-nowrap" title="Save and start match" onClick={start}>Start Match</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/2.5 backdrop-blur p-4 md:p-6">
        {/* Load saved squad for HOME team */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 text-sm text-white/70">

            {/* Fancy field wrapper with inside label "Select squad" */}
            <div className="relative inline-block w-[200px] sm:w-[220px]">
              {/* Field outline */}
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] pr-10 pl-4 py-1.5 backdrop-blur-sm">
                <select
                  className="w-full bg-transparent text-white/90 outline-none appearance-none truncate text-sm"
                  value={selectedSquad}
                  onChange={(e)=>setSelectedSquad(e.target.value)}
                  aria-label="Choose saved squad"
                >
                  {squadNames.length === 0 && <option value="">No saved squads</option>}
                  {squadNames.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Floating label & thin rule to the right (keeps app colours) */}
              <div className="absolute -top-2 left-3 flex items-center gap-2">
                <span className="px-2 text-[11px] font-medium tracking-wide text-white/75 rounded-md" style={{background:'#0b1220'}}>
                  Select squad
                </span>
                <span className="h-px w-16 bg-white/20" />
              </div>

              {/* Single caret icon */}
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M7 9l5 6 5-6H7z" fill="currentColor"/>
              </svg>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadSelectedSquadIntoHome}
              disabled={!selectedSquad || isLoadingSquad}
              title="Overwrite the Home list with this saved squad"
            >
              {isLoadingSquad ? 'Loading…' : 'Load'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={reset}
              title="Reset Home & Away slots to 1–26 blanks"
            >
              Reset 1–26
            </button>
            {loadSuccess && (
              <span
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 px-2.5 py-1 text-xs"
                role="status"
                aria-live="polite"
              >
                {/* Check icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium">{loadSuccess}</span>
              </span>
            )}
          </div>
          <div className="sm:hidden h-px w-full bg-white/5" />
        </div>
        {bothTeams ? (
          <div className="space-y-6">
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
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>!isCancelling && setShowCancelConfirm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <div className="text-lg font-semibold mb-2">Delete game setup?</div>
            <p className="text-sm text-white/70">
              This will permanently delete the current game and any players you’ve entered for it.
              You can’t undo this action.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={()=>setShowCancelConfirm(false)}
                disabled={isCancelling}
              >
                Never mind
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-500/90 hover:bg-red-400 active:bg-red-500 text-white font-medium px-4 py-2 ring-1 ring-red-400/40 transition-colors disabled:opacity-60"
                onClick={cancelGame}
                disabled={isCancelling}
              >
                {isCancelling ? 'Deleting…' : 'Delete game'}
              </button>
            </div>
          </div>
        </div>
      )}
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

  function addRow(){
    if (rows.length >= 50) return;
    // pick the next number as one more than the current max number
    const maxNum = rows.reduce((m,r)=> Math.max(m, Number(r.number)||0), 0);
    const nextNumber = Math.min(50, Math.max(1, maxNum + 1));
    setRows([...rows, { number: nextNumber, name: '' }]);
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

      {/* Compact, responsive grid: 1 col on mobile, 2 on small, 3 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {rows.map((r,i)=> (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-2 flex items-center gap-2"
          >
            <input
              className="input text-center font-semibold tracking-wider text-base md:text-lg tabular-nums rounded-lg h-9 w-[64px]"
              type="number"
              min={0}
              value={r.number||''}
              onChange={e=>update(i,'number',e.target.value)}
            />
            <input
              className="input rounded-lg text-[14px] md:text-[15px] font-medium placeholder:text-white/30 h-9 flex-1"
              placeholder="Player name"
              value={r.name}
              onChange={e=>update(i,'name',e.target.value)}
            />
            <button
              className="btn btn-ghost h-9 text-lg px-2 shrink-0"
              aria-label="Remove row"
              onClick={()=>remove(i)}
              type="button"
              title="Remove player"
            >×</button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-white/40">Max 50 players. Currently showing {rows.length}.</p>
        {rows.length < 50 && (
          <button
            type="button"
            onClick={addRow}
            className="btn btn-secondary h-9 px-3"
            title="Add another player slot"
          >
            + Add player
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-white/40">Tip: Use Tab ↹ to move across, Enter ↵ to jump to next row.</p>
    </div>
  )
}
