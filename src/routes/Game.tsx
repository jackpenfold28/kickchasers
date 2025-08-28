import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { STAT_DEFS, StatKey } from '@/types'
type Totals = Record<StatKey, number>
import TeamCompare from '@/components/TeamCompare'
// Lightweight user profile type for fallback fetch
type ProfileLite = { id: string; team_name?: string; team_logo_url?: string }
// Helper: fetches a minimal user profile for fallback team info

// Types
type GP={ team_side:'home'|'away'; number:number; name:string }
type Evt={ id:string; game_id:string; team_side:'home'|'away'; quarter:number; timestamp_ms:number; player_number:number; stat_key:StatKey }

export default function Game(){
  const { gameId }=useParams()
  const location = useLocation()
  const [home,setHome]=useState<GP[]>([]), [away,setAway]=useState<GP[]>([])
  const [sel,setSel]=useState<{side:'home'|'away'; num:number}|null>(null)

  // Synchronous restore of selected quarter/segment (avoids Q1 flash on refresh)
  const initialSeg: 1|2|3|4|'TOTAL' = (() => {
    if (typeof window === 'undefined' || !gameId) return 1
    try {
      const saved = localStorage.getItem(`game:seg:${gameId}`)
      if (saved === 'TOTAL') return 'TOTAL'
      const n = saved ? parseInt(saved, 10) : NaN
      if ([1,2,3,4].includes(n)) return n as 1|2|3|4
    } catch {}
    return 1
  })()
  const [seg,setSeg]=useState<1|2|3|4|'TOTAL'>(initialSeg)
  const [q,setQ]=useState<number>(typeof initialSeg === 'number' ? initialSeg : 1)

  // Persist selected quarter/segment across navigation
  useEffect(() => {
    if (!gameId) return
    try { localStorage.setItem(`game:seg:${gameId}`, String(seg)) } catch {}
  }, [seg, gameId])
  const [events,setEvents]=useState<Evt[]>([])
  const [homeTeamName, setHomeTeamName] = useState<string | null>(null)
  const [awayTeamName, setAwayTeamName] = useState<string | null>(null)
  const [homeTeamLogo, setHomeTeamLogo] = useState<string | undefined>(undefined)
  const [awayTeamLogo, setAwayTeamLogo] = useState<string | undefined>(undefined)
  // --- Single/dual team tracking state
  const [bothTeams, setBothTeams] = useState(true)
  const [oppScoreNote, setOppScoreNote] = useState<string>('') // unused, for extensibility
  const [authWarning, setAuthWarning] = useState<string | null>(null)

  const toPublicLogoUrl = (path?: string) => {
    if (!path) return undefined
    if (/^https?:\/\//.test(path)) return path
    let p = path.replace(/^\/+/, '')
    p = p.replace(/^team-logos\//, '')
    const { data } = supabase.storage.from('team-logos').getPublicUrl(p)
    return data?.publicUrl
  }

  // Helper: checks if a URL/path is likely an image file (png, jpg, webp, svg)
  const isLikelyImageUrl = (u?: string) => {
    if (!u) return false
    try {
      const path = new URL(u).pathname.toLowerCase()
      return /(\.(png|jpe?g|webp|svg))$/.test(path)
    } catch {
      // If it's not a full URL, still do a best-effort check
      return /(\.(png|jpe?g|webp|svg))$/.test(String(u).toLowerCase())
    }
  }

  // Accepts several possible column names and returns a public URL if any is present
  const pickLogoPublicUrl = (row?: Record<string, any>) => {
    if (!row) return undefined
    const path = row.team_logo_url || row.team_logo_path || row.logo_url || row.logo_path || row.logo
    return toPublicLogoUrl(path)
  }

  // List logo file under team-logos/<folderId>/ and return a public URL
  const getTeamLogoFromBucket = async (folderId?: string) => {
    if (!folderId) return undefined
    try {
      const { data: files, error } = await supabase.storage.from('team-logos').list(folderId, {
        limit: 1,
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error || !files || files.length === 0) return undefined
      const file = files[0]
      const { data } = supabase.storage.from('team-logos').getPublicUrl(`${folderId}/${file.name}`)
      return data?.publicUrl
    } catch {
      return undefined
    }
  }

  // Resolve a logo from a raw path that might be:
  // - full URL (https://...png)
  // - storage file path (e.g. c456.../opponents/team_123.png or c456.../team.png)
  // - folder id (e.g. c456...)
  const getLogoFromPathOrFolder = async (raw?: string) => {
    if (!raw) return undefined
    if (/^https?:\/\//i.test(raw)) return raw
    // Clean to a storage-relative path
    let p = String(raw).replace(/^\/+/, '').replace(/^team-logos\//, '')
    // If it looks like a file path with an image extension, return its public URL
    if (/\.(png|jpe?g|webp|svg)$/i.test(p)) {
      const { data } = supabase.storage.from('team-logos').getPublicUrl(p)
      return data?.publicUrl
    }
    // Otherwise, treat it as a folder. Prefer an `opponents` subfolder, then the folder root.
    for (const folder of [`${p}/opponents`, p]) {
      try {
        const { data: files } = await supabase.storage.from('team-logos').list(folder, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' },
        })
        if (files && files.length > 0) {
          const file = files[0]
          const { data } = supabase.storage.from('team-logos').getPublicUrl(`${folder}/${file.name}`)
          if (data?.publicUrl) return data.publicUrl
        }
      } catch {}
    }
    return undefined
  }

  const [shareOn, setShareOn] = useState(false)
  // Global help modal for stat workflow
  const [helpOpen, setHelpOpen] = useState(false)
  // Compact header toggle
  const [hdrCompact, setHdrCompact] = useState(false)
  // Quick Stats (single-team mode) base + stage state
  const [qBase, setQBase] = useState<StatKey | null>(null)
  const [qStage, setQStage] = useState<'idle' | 'gbg' | 'pos' | 'eff'>('idle')
  // Arm GBG when a player is selected in single-team view
  useEffect(() => {
    if (!bothTeams && sel) setQStage('gbg');
    else if (!bothTeams) setQStage('idle');
  }, [bothTeams, sel])

  // Load players and team names/logos (robust to different schemas)
  useEffect(() => {
    (async () => {
      // 1) Players
      const { data: players, error: gpErr } = await supabase
        .from('game_players')
        .select('team_side, number, name')
        .eq('game_id', gameId)
        .order('team_side', { ascending: true })
        .order('number', { ascending: true })
      if (gpErr) console.error(gpErr)
      if (Array.isArray(players)) {
        setHome(players.filter(r => r.team_side === 'home'))
        setAway(players.filter(r => r.team_side === 'away'))
      }

      // 2) Home team name/logo and away team info
      let homeName: string | undefined
      let homeLogo: string | undefined
      let oppName: string | undefined
      let awayLogo: string | undefined

      // --------- HOME LOGO: PROFILE PRIORITY ---------
      let user: { id: string } | undefined
      try {
        const { data: userData } = await supabase.auth.getUser()
        user = userData?.user
      } catch (err) {
        // ignore
      }
      // If user, check profile for logo URL (highest priority)
      if (user && user.id) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('team_logo_url, team_logo_path')
            .eq('user_id', user.id)
            .maybeSingle()
          let usedProfileLogo = false
          if (prof?.team_logo_url && isLikelyImageUrl(prof.team_logo_url)) {
            // Only trust URLs that look like an actual image file, e.g. ends with .png/.jpg etc.
            homeLogo = prof.team_logo_url
            usedProfileLogo = true
          }
          if (!usedProfileLogo && prof?.team_logo_path) {
            // Stored a path in the bucket (e.g. c456.../team.png)
            const maybe = toPublicLogoUrl(String(prof.team_logo_path))
            if (maybe) {
              homeLogo = maybe
              usedProfileLogo = true
            }
          }
          if (!usedProfileLogo) {
            // Fall back to listing the user's folder and taking the most-recent image
            const fromBucket = await getTeamLogoFromBucket(user.id)
            if (fromBucket) homeLogo = fromBucket
          }
        } catch (err) {
          // ignore
        }
      }

      // 3) Read the game to get home_team_id and opponent, and track_both_teams mode
      try {
        const { data: gameData, error: gameErr } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single()
        if (gameErr) console.error('[Game] games fetch error:', gameErr)

        if (gameData) {
          // --- Detect bothTeams mode (URL overrides; then DB; then default true) ---
          let decided: boolean | undefined

          // 1) URL param (?both=1|0) overrides everything if present
          try {
            const params = new URLSearchParams(location.search)
            const qsBoth = params.get('both')
            if (qsBoth != null) {
              decided = (qsBoth === '1' || qsBoth === 'true')
            }
          } catch {}

          // 2) DB columns (track_both_teams | track_both_sides | track_both)
          if (decided === undefined) {
            const raw =
              (gameData as any)?.track_both_teams ??
              (gameData as any)?.track_both_sides ??
              (gameData as any)?.track_both
            if (raw === null || raw === undefined) decided = true
            else decided = (raw === true || raw === 1 || raw === '1' || raw === 'true')
          }

          // 3) Apply + persist (so future loads are fast; no longer used as a higher‑priority source)
          setBothTeams(!!decided)
          try {
            if (gameId) localStorage.setItem(`game:trackBoth:${gameId}`, decided ? '1' : '0')
          } catch {}
          if (decided === false) {
            setSel(prev => (prev && prev.side==='home') ? prev : (home[0] ? { side:'home', num: home[0].number } : null))
          }

          // Set AWAY label and logo directly from the games row so it always shows
          const rawOpp = (gameData as any)?.opponent
          const rawOppLogo = (gameData as any)?.opponent_logo_path
          const oppLabel = (typeof rawOpp === 'string' ? rawOpp.trim() : '') || 'Away'
          setAwayTeamName(oppLabel)

          // Try a fast path first (URL or explicit file path), then folder scan as fallback
          if (rawOppLogo) {
            const asStr = String(rawOppLogo)
            let direct: string | undefined
            if (/^https?:\/\//i.test(asStr) || /\.(png|jpe?g|webp|svg)$/i.test(asStr)) {
              direct = toPublicLogoUrl(asStr) || ( /^https?:\/\//i.test(asStr) ? asStr : undefined )
            }
            if (direct) {
              setAwayTeamLogo(direct)
            } else {
              getLogoFromPathOrFolder(asStr).then((url) => {
                if (url) setAwayTeamLogo(url)
              })
            }
          }

          // TEMP: debug what we read/resolve (remove after confirming)
          try {
            console.log('[Game] opponent from games:', rawOpp)
            console.log('[Game] opponent_logo_path from games:', rawOppLogo)
          } catch {}

          // Home from teams by id; prefer owner_user_id for logo folder if available
          if (gameData.home_team_id) {
            const { data: homeTeam } = await supabase
              .from('teams')
              .select('id, name, owner_user_id')
              .eq('id', gameData.home_team_id)
              .maybeSingle()
            if (homeTeam) {
              homeName = homeTeam.name ?? 'Home'
              // Only set homeLogo if not already set from profile
              if (!homeLogo) {
                let logoFolderId = homeTeam.owner_user_id || homeTeam.id
                homeLogo = await getTeamLogoFromBucket(logoFolderId)
                // If still missing, try by team id folder
                if (!homeLogo && homeTeam.id) {
                  homeLogo = await getTeamLogoFromBucket(homeTeam.id)
                }
              }
            }
          }

          // --- Opponent (use only games.opponent) ---
          oppName = (gameData as any)?.opponent || 'Away'

          // --- Opponent logo (use only games.opponent_logo_path, which may be a URL, file path, or folder id) ---
          if ((gameData as any)?.opponent_logo_path) {
            awayLogo = await getLogoFromPathOrFolder(String((gameData as any).opponent_logo_path))
          }
        }
      } catch (e) {
        console.warn('Game/team lookup failed:', e)
      }

      // If homeLogo is still missing after profile and team folder, try user bucket fallback
      if (!homeLogo && user && user.id) {
        try {
          const logoUrl = await getTeamLogoFromBucket(user.id)
          if (logoUrl) {
            homeLogo = logoUrl
          }
        } catch (err) {
          // ignore
        }
      }

      // If homeName is still missing, try to get team name for this user
      if (!homeName && user && user.id) {
        try {
          const { data: myTeam } = await supabase
            .from('teams')
            .select('name')
            .eq('owner_user_id', user.id)
            .maybeSingle()
          if (myTeam?.name) {
            homeName = myTeam.name
          }
        } catch (err) {
          // ignore
        }
      }

      // 5) Commit state
      setHomeTeamName(homeName ?? 'Home')
      setHomeTeamLogo(homeLogo)
    })()
  }, [gameId, location.search])

  // Ensure selection stays on home in single‑team mode
  useEffect(() => {
    if (!bothTeams) {
      setSel(prev => (prev && prev.side === 'home') ? prev : (home[0] ? { side: 'home', num: home[0].number } : null))
    }
  }, [bothTeams, home])

  // If there are no away players at all, fall back to single‑team view
  useEffect(() => {
    if (away.length === 0) {
      setBothTeams(false)
    }
  }, [away.length])

  // If away players later appear (e.g. dual‑team game), restore the user's preference (default: both teams)
  useEffect(() => {
    if (away.length > 0) {
      let pref: string | null = null
      try { pref = localStorage.getItem(`game:trackBoth:${gameId}`) } catch {}
      const wantBoth = pref ? (pref === '1' || pref === 'true') : true
      if (wantBoth) setBothTeams(true)
    }
  }, [away.length, gameId])

  // Load + subscribe to events
  useEffect(()=>{ 
    const ch=supabase.channel(`rt:events:${gameId}`).on('postgres_changes',
      {event:'*',schema:'public',table:'events',filter:`game_id=eq.${gameId}`},
      (p:any)=>{ if(p.new) setEvents(ev=> ev.some(e=>e.id===p.new.id)?ev:[...ev,p.new as Evt]) }
    ).subscribe()
    ;(async()=>{ const {data}=await supabase.from('events').select('*').eq('game_id',gameId).order('timestamp_ms'); setEvents((data as Evt[])||[]) })()
    return ()=>{ supabase.removeChannel(ch) }
  },[gameId])

  async function log(stat:StatKey){
    if(!sel) return
    const optimistic:Evt={ id:crypto.randomUUID(), game_id:gameId!, team_side:sel.side, quarter:q, timestamp_ms:Date.now(), player_number:sel.num, stat_key:stat }
    setEvents(ev=>[...ev, optimistic])

    // Require session to satisfy RLS
    const { data: sessData } = await supabase.auth.getSession()
    const session = sessData?.session
    if (!session) {
      // rollback optimistic
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('You are not signed in. Please sign in to record stats (RLS blocked the insert).')
      console.warn('[events] insert blocked by RLS (no session)')
      return
    }

    const { error } = await supabase.from('events').insert({
      ...optimistic,
      created_by: session.user.id,
    } as any)

    if (error) {
      // rollback optimistic and surface
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('Could not save to Supabase: ' + error.message)
      console.error('[events] insert failed:', error)
      return
    }

    // clear warning on success
    if (authWarning) setAuthWarning(null)
  }

  async function logAwayScore(stat: 'G'|'B'){
    const optimistic: Evt = { id: crypto.randomUUID(), game_id: gameId!, team_side:'away', quarter:q, timestamp_ms: Date.now(), player_number: 0, stat_key: stat as StatKey }
    setEvents(ev=>[...ev, optimistic])

    const { data: sessData } = await supabase.auth.getSession()
    const session = sessData?.session
    if (!session) {
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('You are not signed in. Please sign in to record stats (RLS blocked the insert).')
      console.warn('[events] insert blocked by RLS (no session)')
      return
    }

    const { error } = await supabase.from('events').insert({
      ...optimistic,
      created_by: session.user.id,
    } as any)

    if (error) {
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('Could not save to Supabase: ' + error.message)
      console.error('[events] insert failed:', error)
      return
    }

    if (authWarning) setAuthWarning(null)
  }

  // Log away-team (opponent) non-scoring stat (GBG/CON/UC/MC/MUC)
  async function logAwayStat(stat: StatKey){
    const optimistic: Evt = { id: crypto.randomUUID(), game_id: gameId!, team_side:'away', quarter:q, timestamp_ms: Date.now(), player_number: 0, stat_key: stat }
    setEvents(ev=>[...ev, optimistic])

    const { data: sessData } = await supabase.auth.getSession()
    const session = sessData?.session
    if (!session) {
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('You are not signed in. Please sign in to record stats (RLS blocked the insert).')
      console.warn('[events] insert blocked by RLS (no session)')
      return
    }

    const { error } = await supabase.from('events').insert({
      ...optimistic,
      created_by: session.user.id,
    } as any)

    if (error) {
      setEvents(ev=>ev.filter(e=>e.id!==optimistic.id))
      setAuthWarning('Could not save to Supabase: ' + error.message)
      console.error('[events] insert failed:', error)
      return
    }

    if (authWarning) setAuthWarning(null)
  }

  async function undoById(id:string){
    const before = events
    // optimistic remove
    setEvents(ev=>ev.filter(e=>e.id!==id))

    const { data: sessData } = await supabase.auth.getSession()
    const session = sessData?.session
    if (!session) {
      setEvents(before)
      setAuthWarning('You are not signed in. Please sign in to undo (RLS blocked the delete).')
      return
    }

    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      setEvents(before)
      setAuthWarning('Could not undo: ' + error.message)
    } else if (authWarning) {
      setAuthWarning(null)
    }
  }

  // Totals (supports per-quarter when quarter passed)
  const totals=(side:'home'|'away', quarter?: 1|2|3|4|'TOTAL'):Totals=>{
    const out=Object.fromEntries(STAT_DEFS.map(s=>[s.key,0])) as Totals
    for(const e of events){
      if(e.team_side!==side) continue
      if(typeof quarter==='number' && e.quarter!==quarter) continue
      // Safe increment supports combined/unknown keys
      // @ts-ignore
      out[e.stat_key] = (out[e.stat_key] ?? 0) + 1
    }
    // Derive Disposals strictly from base K + HB
    // @ts-ignore
    out['D' as StatKey] = (out['K' as StatKey] ?? 0) + (out['HB' as StatKey] ?? 0)
    return out
  }
  const th=useMemo(()=>totals('home', seg),[events, seg])
  const ta=useMemo(()=>totals('away', seg),[events, seg])

  // -------- Live header helpers (score + clock) --------
  type Score = { g: number; b: number; pts: number }
  const scoreFor = (side:'home'|'away', quarter: 1|2|3|4|'TOTAL'): Score => {
    let g=0, b=0
    for (const e of events) {
      if (e.team_side!==side) continue
      if (typeof quarter==='number' && e.quarter!==quarter) continue
      if (e.stat_key==='G') g++
      if (e.stat_key==='B') b++
    }
    return { g, b, pts: g*6 + b }
  }
  const scores = useMemo(() => ({
    home: scoreFor('home', seg),
    away: scoreFor('away', seg)
  }), [events, seg])

  // Always-needed totals (TOTAL) and per-quarter breakdowns for header display
  const totalScores = useMemo(() => ({
    home: scoreFor('home', 'TOTAL'),
    away: scoreFor('away', 'TOTAL'),
  }), [events])

  const quarterScores = useMemo(() => ({
    home: ([1,2,3,4] as (1|2|3|4)[]).map(q => scoreFor('home', q)),
    away: ([1,2,3,4] as (1|2|3|4)[]).map(q => scoreFor('away', q)),
  }), [events])

  const fmtBreak = (arr: {g:number;b:number}[]) => arr.map(s => `${s.g}.${s.b}`).join(' | ')

  // simple per-quarter clock
  const [running, setRunning] = useState(false)
  const [startTs, setStartTs]   = useState<number|null>(null)
  const [elapsed, setElapsed]   = useState(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed(Date.now() - (startTs ?? Date.now())), 250)
    return () => clearInterval(id)
  }, [running, startTs])

  const formatClock = (ms:number) => {
    const total = Math.max(0, Math.floor(ms/1000))
    const mm = String(Math.floor(total/60)).padStart(2,'0')
    const ss = String(total%60).padStart(2,'0')
    return `${mm}:${ss}`
  }

  const handleStartStop = () => {
    if (!running) { setStartTs(Date.now()); setElapsed(0); setRunning(true) }
    else { setRunning(false) }
  }

  const segLabel = typeof seg === 'number' ? `Q${seg}` : 'Total'

  const viewerUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/summary/${gameId}`  // placeholder: player stats page
    : ''

  // --- StatPad component ---
  function StatPad({ onLog }:{ onLog:(s:StatKey)=>void }){
    // Reuse the Tile from TeamCol
    const Tile = ({cls, title, keyTxt, stat}:{cls:string; title:string; keyTxt:string; stat:StatKey}) => (
      <button className={`stat-tile ${cls} relative overflow-hidden`} onClick={e=>{
        const btn = e.currentTarget
        const ripple = btn.querySelector('.ripple') as HTMLSpanElement
        if (ripple) {
          ripple.classList.remove('show')
          void ripple.offsetWidth
          ripple.classList.add('show')
          const rect = btn.getBoundingClientRect()
          const size = Math.max(rect.width, rect.height)
          const x = e.clientX - rect.left - size/2
          const y = e.clientY - rect.top - size/2
          ripple.style.left = `${x}px`
          ripple.style.top = `${y}px`
          ripple.style.width = ripple.style.height = `${size}px`
        }
        onLog(stat)
      }}>
        <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
        <div className="stat-title">{title}</div>
        <div></div>
        <div className="stat-key">{keyTxt}</div>
      </button>
    )
    return (
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-2 md:gap-x-3 md:gap-y-2.5 auto-rows-[5.5rem] md:auto-rows-[6rem]">
        <Tile cls="k"  title="Kick"         keyTxt="K"  stat="K"/>
        <Tile cls="hb" title="Handball"     keyTxt="HB" stat="HB"/>
        <Tile cls="m"  title="Mark"         keyTxt="M"  stat="M"/>
        <Tile cls="t"  title="Tackle"       keyTxt="T"  stat="T"/>
        <Tile cls="g"  title="Goal"         keyTxt="G"  stat="G"/>
        <Tile cls="bh" title="Behind"       keyTxt="B"  stat="B"/>
        <Tile cls="ff" title="Free For"     keyTxt="FF" stat="FF"/>
        <Tile cls="fa" title="Free Against" keyTxt="FA" stat="FA"/>
        <Tile cls="cl" title="Clearance"    keyTxt="CL" stat="CL"/>
        <Tile cls="i50" title="Inside 50"   keyTxt="I50" stat="I50"/>
        <Tile cls="r50" title="Rebound 50"  keyTxt="R50" stat="R50"/>
        <Tile cls="ho" title="Hitout"       keyTxt="HO" stat="HO"/>
      </div>
    )
  }

  return (
    <>
      {/* --- Live Match Header (full‑width band) --- */}
      <div className="sticky top-0 z-[60]">
        <div className="full-bleed">
          <div
            className={
              `relative overflow-hidden rounded-none border-y border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-slate-800/30 ${hdrCompact ? 'px-2 md:px-3 py-1.5 md:py-2' : 'px-4 md:px-6 py-4 md:py-5'} shadow-xl glassy-header`
            }
          >
        {/* Header compact toggle */}
        <button
          onClick={() => setHdrCompact(v => !v)}
          aria-pressed={hdrCompact}
          title={hdrCompact ? 'Expand header' : 'Condense header'}
          className="absolute right-2 top-2 z-20 h-7 w-7 grid place-items-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className={`${hdrCompact ? 'rotate-180' : ''} transition-transform`}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* Compact actions cluster (to the left of chevron) */}
        {hdrCompact && (
          <div className="absolute right-10 top-1.5 z-20 flex items-center gap-1.5">
            <Link
              to="/hub"
              className="h-7 w-7 grid place-items-center rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
              aria-label="Game Hub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M3 11.5L12 5l9 6.5M5 10v9a1 1 0 001 1h3a1 1 0 001-1v-4h2v4a1 1 0 001 1h3a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link
              to={`/summary/${gameId}`}
              className="h-7 w-7 grid place-items-center rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
              aria-label="Stats Summary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M5 21V10m7 11V3m7 18v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </Link>
            <button
              role="switch"
              aria-checked={shareOn}
              onClick={() => setShareOn(v => !v)}
              title="Share live"
              className={`relative h-7 w-12 rounded-full border transition ${shareOn ? 'bg-emerald-500/30 border-emerald-400/40' : 'bg-white/10 border-white/20'}`}
            >
              <span className={`absolute top-1 left-1 inline-block h-5 w-5 transform rounded-full bg-white transition ${shareOn ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}
        {/* Radial overlays for glassy light */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-20%] w-2/3 h-2/3 bg-white/20 blur-2xl rounded-full opacity-40"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-1/3 h-1/3 bg-emerald-300/10 blur-3xl rounded-full opacity-40"></div>
        </div>
        {/* Subtle full-container team watermark logos */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {homeTeamLogo && (
            <img
              src={homeTeamLogo}
              alt=""
              aria-hidden="true"
              className="absolute left-[-8%] top-1/2 -translate-y-1/2 w-[46%] max-w-none opacity-[0.07] object-contain blur-[0.5px]"
            />
          )}
          {awayTeamLogo && (
            <img
              src={awayTeamLogo}
              alt=""
              aria-hidden="true"
              className="absolute right-[-8%] top-1/2 -translate-y-1/2 w-[46%] max-w-none opacity-[0.07] object-contain blur-[0.5px]"
            />
          )}
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4 max-w-[1100px] mx-auto">
          {/* Left: Home team logo and score */}
          <div className={`relative overflow-hidden flex items-center gap-3 md:gap-4 flex-none ${hdrCompact ? 'w-[200px]' : 'w-[240px]'} text-center`}>
            {/* Score block */}
            <div className="relative z-10 flex flex-col justify-center items-center flex-1 text-center">
              <div className="text-[11px] md:text-sm opacity-70 -mb-0.5 text-center">{homeTeamName || "Home"}</div>
              <ScoreGlow value={totalScores.home.pts} compact={hdrCompact} />
              <div className="text-[10px] md:text-xs opacity-70 whitespace-nowrap">| {fmtBreak(quarterScores.home)} |</div>
            </div>
          </div>

          {/* Center: meta (title + clock + controls) */}
          <div className={`flex-1 flex flex-col items-center justify-center ${hdrCompact ? 'min-h-[72px]' : 'min-h-[132px]'}`}>
            {/* Wide toolbar only when not compact */}
            {!hdrCompact && (
              <div className="mb-2 w-full max-w-[760px]">
                <div className="flex items-center justify-center gap-2">
                  <Link
                    to="/hub"
                    className={`inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 ${hdrCompact ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'}`}
                    aria-label="Game Hub"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M3 11.5L12 5l9 6.5M5 10v9a1 1 0 001 1h3a1 1 0 001-1v-4h2v4a1 1 0 001 1h3a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className={hdrCompact ? 'sr-only' : ''}>Game Hub</span>
                  </Link>

                  <Link
                    to={`/summary/${gameId}`}
                    className={`inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 ${hdrCompact ? 'px-2 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'}`}
                    aria-label="Stats Summary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-80"><path d="M5 21V10m7 11V3m7 18v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span className={hdrCompact ? 'sr-only' : ''}>Stats Summary</span>
                  </Link>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/15 bg-white/5">
                    <button
                      role="switch"
                      aria-checked={shareOn}
                      onClick={() => setShareOn(v => !v)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition border ${shareOn ? 'bg-emerald-500/30 border-emerald-400/40' : 'bg-white/10 border-white/20'}`}
                      title="Share a live, read‑only viewer"
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${shareOn ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span className={`${hdrCompact ? 'sr-only' : 'text-[13px] opacity-80 select-none'}`}>Share live</span>
                  </div>
                </div>
              </div>
            )}
            <div className={`flex items-center justify-center ${hdrCompact ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4'} leading-none`}>
              <div className={`${hdrCompact ? 'sr-only' : 'text-sm md:text-base opacity-80 leading-none'}`}>Live — {segLabel}</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border leading-none ${running ? 'bg-green-500/20 border-green-400/40 text-green-200' : 'bg-white/10 border-white/20 text-white/90'}`}>
                {formatClock(elapsed)}
              </div>
              <button onClick={handleStartStop}
                className={`px-3 py-1 rounded-md text-sm font-medium border transition leading-none ${running ? 'bg-red-500/20 border-red-400/40 hover:bg-red-500/30' : 'bg-emerald-500/20 border-emerald-400/40 hover:bg-emerald-500/30'}`}>
                {hdrCompact ? (
                  running ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M8 5l12 7-12 7V5z" fill="currentColor"/></svg>
                  )
                ) : (
                  running ? 'Stop' : 'Start quarter'
                )}
              </button>
            </div>

            {/* Quarter tabs (centered) – fixed height so the header doesn't jump */}
            <div className="mt-3 flex items-center justify-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[1,2,3,4].map(n => {
                  const on = n === seg
                  return (
                    <button
                      key={n}
                      onClick={() => { setQ(n as 1|2|3|4); setSeg(n as 1|2|3|4) }}
                      className={`inline-flex items-center justify-center ${hdrCompact ? 'h-7 px-2' : 'h-9 px-4'} rounded-full border ${hdrCompact ? 'text-[12px]' : 'text-sm'} transition-all duration-150
                        ${on ? 'bg-white text-slate-900 border-white shadow-[0_0_8px_0_rgba(255,255,255,0.45)] ring-2 ring-emerald-400/40' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/15'}
                        active:scale-95`}
                      style={{ boxShadow: on ? '0 0 12px 2px rgba(52,211,153,0.16)' : undefined }}
                    >
                      Q{n}
                    </button>
                  )
                })}
                {(() => {
                  const on = seg === 'TOTAL'
                  return (
                    <button
                      onClick={() => setSeg('TOTAL')}
                      className={`inline-flex items-center justify-center ${hdrCompact ? 'h-7 px-2' : 'h-9 px-4'} rounded-full border ${hdrCompact ? 'text-[12px]' : 'text-sm'} transition-all duration-150
                        ${on ? 'bg-white text-slate-900 border-white shadow-[0_0_8px_0_rgba(255,255,255,0.45)] ring-2 ring-emerald-400/40' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/15'}
                        active:scale-95`}
                      style={{ boxShadow: on ? '0 0 12px 2px rgba(52,211,153,0.16)' : undefined }}
                    >
                      Total
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Right: Away team score and logo */}
          <div className={`relative overflow-hidden flex items-center gap-3 md:gap-4 flex-none ${hdrCompact ? 'w-[200px]' : 'w-[240px]'} justify-end text-center`}>
            {/* Score block */}
            <div className="relative z-10 flex flex-col justify-center items-center flex-1 text-center">
              <div className="text-[11px] md:text-sm opacity-70 -mb-0.5 text-center">{awayTeamName || "Away"}</div>
              <ScoreGlow value={totalScores.away.pts} compact={hdrCompact} />
              <div className="text-[10px] md:text-xs opacity-70 whitespace-nowrap">| {fmtBreak(quarterScores.away)} |</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
      <div className="max-w-[1200px] mx-auto p-4 space-y-4">
      {authWarning && (
        <div className="mt-2 rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-[13px] text-amber-100">
          {authWarning}
        </div>
      )}

      {shareOn && (
        <div className="bg-white/[0.04] border border-white/10 rounded-md p-3 max-w-[1200px] mx-auto -mt-1">
          <label className="block text-sm mb-1 opacity-80">Live viewer link</label>
          <div className="flex items-center gap-2">
            <input readOnly value={viewerUrl} className="bg-white/[0.06] border border-white/10 rounded-md px-2 py-1 text-xs flex-1" />
            <button
              className="btn !px-2 !py-1 text-xs"
              onClick={() => { navigator.clipboard?.writeText(viewerUrl) }}
            >Copy</button>
            <a className="btn !px-2 !py-1 text-xs" href={viewerUrl} target="_blank" rel="noreferrer">Open</a>
          </div>
        </div>
      )}

      {bothTeams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamCol
            title={homeTeamName || 'Home'}
            side="home"
            players={home}
            selected={sel?.side==='home'?sel.num:null}
            onSelect={n=>setSel({side:'home',num:n})}
            onLog={log}
            onUndo={undoById}
            events={events}
            onHelp={() => setHelpOpen(true)}
          />
          <TeamCol
            title={awayTeamName || 'Away'}
            side="away"
            players={away}
            selected={sel?.side==='away'?sel.num:null}
            onSelect={n=>setSel({side:'away',num:n})}
            onLog={log}
            onUndo={undoById}
            events={events}
            onHelp={() => setHelpOpen(true)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TeamCol
            title={homeTeamName || 'Home'}
            side="home"
            players={home}
            selected={sel?.side==='home'?sel.num:null}
            onSelect={n=>setSel({side:'home',num:n})}
            onLog={log}
            onUndo={undoById}
            events={events}
            hideStats
            onHelp={() => setHelpOpen(true)}
          />
          <div className="card">
            <div className="h2 mb-2.5 text-center">Quick Stats</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 md:p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm opacity-80">Record Stat (selected player)</div>
                <button
                  onClick={() => setHelpOpen(true)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-white/20 bg-white/10 text-xs hover:bg-white/15"
                  title="How this works"
                >?
                </button>
              </div>
              {/* Base grid (includes Hitout) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2.5 gap-y-2 md:gap-x-3 md:gap-y-2.5 auto-rows-[5.2rem] md:auto-rows-[5.6rem]">
                {/* Kick */}
                <button className={`stat-tile k relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('K' as StatKey); log('K' as StatKey); setQStage('pos'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Kick</div><div></div><div className="stat-key">K</div>
                </button>
                {/* Handball */}
                <button className={`stat-tile hb relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('HB' as StatKey); log('HB' as StatKey); setQStage('pos'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Handball</div><div></div><div className="stat-key">HB</div>
                </button>
                {/* Mark */}
                <button className={`stat-tile m relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('M' as StatKey); log('M' as StatKey); setQStage('pos'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Mark</div><div></div><div className="stat-key">M</div>
                </button>
                {/* Tackle */}
                <button className={`stat-tile t relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('T' as StatKey); log('T' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Tackle</div><div></div><div className="stat-key">T</div>
                </button>
                {/* Goal */}
                <button className={`stat-tile g relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('G' as StatKey); log('G' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Goal</div><div></div><div className="stat-key">G</div>
                </button>
                {/* Behind */}
                <button className={`stat-tile bh relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('B' as StatKey); log('B' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Behind</div><div></div><div className="stat-key">B</div>
                </button>
                {/* Free For */}
                <button className={`stat-tile ff relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('FF' as StatKey); log('FF' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Free For</div><div></div><div className="stat-key">FF</div>
                </button>
                {/* Free Against */}
                <button className={`stat-tile fa relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('FA' as StatKey); log('FA' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Free Against</div><div></div><div className="stat-key">FA</div>
                </button>
                {/* Clearance */}
                <button className={`stat-tile cl relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('CL' as StatKey); log('CL' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Clearance</div><div></div><div className="stat-key">CL</div>
                </button>
                {/* Inside 50 */}
                <button className={`stat-tile i50 relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('I50' as StatKey); log('I50' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Inside 50</div><div></div><div className="stat-key">I50</div>
                </button>
                {/* Rebound 50 */}
                <button className={`stat-tile r50 relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('R50' as StatKey); log('R50' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Rebound 50</div><div></div><div className="stat-key">R50</div>
                </button>
                {/* Hitout */}
                <button className={`stat-tile ho relative overflow-hidden`} onClick={(e)=>{ const btn=e.currentTarget; const r=btn.querySelector('.ripple') as HTMLSpanElement; if(r){r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; } setQBase('HO' as StatKey); log('HO' as StatKey); setQBase(null); setQStage('idle'); }}>
                  <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                  <div className="stat-title">Hitout</div><div></div><div className="stat-key">HO</div>
                </button>
              </div>

              {/* Modifier row below the grid */}
              <div className="mt-3 grid grid-cols-5 gap-2">
                {(['GBG','CON','UC','EF','IF'] as const).map((key) => {
                  const label = key
                  let variant = 'bg-white/10 border-white/20 text-white/90 hover:bg-white/15'
                  if (key === 'EF') variant = 'bg-green-400/20 border-green-400/40 text-green-100'
                  if (key === 'IF') variant = 'bg-red-400/20 border-red-400/40 text-red-100'

                  const isBaseThatCanModify = (b: StatKey | null): b is StatKey => !!b && (b==='K'||b==='HB'||b==='M')

                  const active = (
                    (key === 'GBG' && qStage === 'gbg') ||
                    ((key === 'CON' || key === 'UC') && qStage === 'pos' && isBaseThatCanModify(qBase)) ||
                    ((key === 'EF' || key === 'IF') && qStage === 'eff' && (qBase === 'K' || qBase === 'HB'))
                  )

                  const glow = active ? 'ring-2 ring-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.6)]' : 'opacity-50'

                  return (
                    <button
                      key={key}
                      className={`relative overflow-hidden h-10 rounded-md border text-sm font-semibold tracking-wide transition ${variant} ${glow} ${!active ? 'pointer-events-none opacity-50' : ''} focus:outline-none`}
                      onClick={(e)=>{
                        if (!active) return
                        const btn=e.currentTarget as HTMLButtonElement
                        const r=btn.querySelector('.ripple') as HTMLSpanElement
                        if(r){ r.classList.remove('show'); void r.offsetWidth; r.classList.add('show'); const rect=btn.getBoundingClientRect(); const s=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-s/2; const y=(e as any).clientY-rect.top-s/2; r.style.left=`${x}px`; r.style.top=`${y}px`; r.style.width=r.style.height=`${s}px`; }

                        if (key==='GBG') {
                          log('GBG' as unknown as StatKey)
                          // stay on current stage
                        } else if (key==='CON' || key==='UC') {
                          if (qBase === 'M') {
                            // Marks: record MC/MUC; do not increment generic CON/UC
                            const markKey = (key === 'CON' ? 'MC' : 'MUC') as StatKey
                            log(markKey)
                            setQBase(null)
                            setQStage('idle')
                          } else {
                            // K/HB path: possession first, then effectiveness
                            log(key as StatKey)
                            setQStage('eff')
                          }
                        } else if (key==='EF' || key==='IF') {
                          const base = qBase
                          if (base === 'K' || base === 'HB') {
                            const combined = `${base}_${key}` as unknown as StatKey
                            log(combined)
                          }
                          setQBase(null); setQStage('idle')
                        }
                      }}
                    >
                      <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 md:p-3">
              <div className="text-sm opacity-80 mb-2">Opponent</div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm opacity-75">Score: <span className="font-semibold">{scores.away.g}.{scores.away.b}</span> (<span className="tabular-nums">{scores.away.pts}</span>)</div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-md bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/30" onClick={()=>logAwayScore('G')}>+ Goal</button>
                  <button className="px-3 py-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/15" onClick={()=>logAwayScore('B')}>+ Behind</button>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm opacity-80 mb-1">Quick keys (team totals)</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    className="h-7 px-2.5 rounded-md border text-[12px] bg-blue-500/15 border-blue-400/30 text-blue-100 hover:bg-blue-500/25"
                    onClick={()=>logAwayStat('GBG' as unknown as StatKey)}
                    title="Ground Ball Get"
                  >GBG</button>
                  <button
                    className="h-7 px-2.5 rounded-md border text-[12px] bg-white/10 border-white/20 hover:bg-white/15"
                    onClick={()=>logAwayStat('CON' as unknown as StatKey)}
                    title="Contested Possession"
                  >CON</button>
                  <button
                    className="h-7 px-2.5 rounded-md border text-[12px] bg-white/10 border-white/20 hover:bg-white/15"
                    onClick={()=>logAwayStat('UC' as unknown as StatKey)}
                    title="Uncontested Possession"
                  >UC</button>
                  <button
                    className="h-7 px-2.5 rounded-md border text-[12px] bg-white/10 border-white/20 hover:bg-white/15"
                    onClick={()=>logAwayStat('MC' as unknown as StatKey)}
                    title="Mark (Contested)"
                  >MC</button>
                  <button
                    className="h-7 px-2.5 rounded-md border text-[12px] bg-white/10 border-white/20 hover:bg-white/15"
                    onClick={()=>logAwayStat('MUC' as unknown as StatKey)}
                    title="Mark (Uncontested)"
                  >MUC</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setHelpOpen(false)}></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[560px] rounded-xl border border-white/10 bg-slate-900/95 p-4 md:p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">How to record advanced stats</div>
              <button className="h-7 w-7 grid place-items-center rounded-md bg-white/10 hover:bg-white/15 border border-white/20" onClick={()=>setHelpOpen(false)}>✕</button>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Select a player (left panel).</li>
              <li>(Optional) Tap <span className="font-semibold">GBG</span> to log a Ground Ball Get for that player.</li>
              <li>Tap a base stat: <span className="font-semibold">K</span>, <span className="font-semibold">HB</span>, <span className="font-semibold">M</span>, <span className="font-semibold">T</span>, <span className="font-semibold">G</span>, <span className="font-semibold">B</span>, <span className="font-semibold">FF</span>, <span className="font-semibold">FA</span>, <span className="font-semibold">CL</span>, <span className="font-semibold">I50</span>, <span className="font-semibold">R50</span>, or <span className="font-semibold">HO</span>.</li>
              <li>If you chose <span className="font-semibold">K</span>/<span className="font-semibold">HB</span>/<span className="font-semibold">M</span> you’ll be prompted for possession: <span className="font-semibold">CON</span> (contested) or <span className="font-semibold">UC</span> (uncontested).</li>
              <li>If you chose <span className="font-semibold">K</span>/<span className="font-semibold">HB</span>, you’ll then be prompted for effectiveness: <span className="text-emerald-300 font-semibold">EF</span> or <span className="text-rose-300 font-semibold">IF</span>.</li>
              <li>Each press shows a ripple and briefly highlights to confirm the log. Use <span className="font-semibold">Undo</span> to revert the last event for the selected player.</li>
            </ol>
            <div className="mt-3 text-xs opacity-70">Example sequence: <span className="tabular-nums">1</span>, <span className="font-semibold">K</span>, <span className="font-semibold">CON</span>, <span className="font-semibold">EF</span> → logs a contested, effective kick; <span className="font-semibold">GBG</span> can be logged independently at any time.</div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

function TeamCol({ title, side, players, selected, onSelect, onLog, onUndo, events, hideStats, onHelp }:{
  title:string; side:'home'|'away'; players:GP[]; selected:number|null; onSelect:(n:number)=>void; onLog:(s:StatKey)=>void; onUndo:(id:string)=>void; events:Evt[]; hideStats?: boolean; onHelp: () => void
}){
  const lastForSelected = useMemo(() => {
    if (selected == null) return null
    const arr = events.filter(e => e.team_side === side && e.player_number === selected)
    return arr.length ? arr[arr.length - 1] : null
  }, [events, side, selected])
  // Local state for base stat selection and modifiers
  const [baseStat, setBaseStat] = useState<StatKey | null>(null)
  const [gbgArmed, setGbgArmed] = useState<boolean>(selected != null)
  useEffect(()=>{ setGbgArmed(selected != null) }, [selected])
  // Stage: 'gbg' (suggest GBG), 'pos' (CON/UC), 'eff' (EF/IF), 'idle'
  const [stage, setStage] = useState<'idle' | 'gbg' | 'pos' | 'eff'>('idle')
  useEffect(() => {
    if (selected != null) setStage('gbg')
    else setStage('idle')
  }, [selected])
  // Helper: only allow modifiers for K, HB, M
  const isBaseThatCanModify = (b: StatKey | null): b is StatKey => !!b && (b === 'K' || b === 'HB' || b === 'M')
  const MODS = [
    { key: 'GBG', label: 'GBG' },
    { key: 'CON', label: 'CON' },
    { key: 'UC',  label: 'UC'  },
    { key: 'EF',  label: 'EF'  },
    { key: 'IF',  label: 'IF'  },
  ] as const

  // Ripple animation for stat-tile button (not used in new grid, but keep for reference)
  const Tile = ({cls, title, keyTxt, stat}:{cls:string; title:string; keyTxt:string; stat:StatKey}) => (
    <button className={`stat-tile ${cls} relative overflow-hidden`} onClick={e=>{
      // Animate ripple
      const btn = e.currentTarget
      const ripple = btn.querySelector('.ripple') as HTMLSpanElement
      if (ripple) {
        ripple.classList.remove('show')
        // trigger reflow for restart
        void ripple.offsetWidth
        ripple.classList.add('show')
        // Position ripple where clicked
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size/2
        const y = e.clientY - rect.top - size/2
        ripple.style.left = `${x}px`
        ripple.style.top = `${y}px`
        ripple.style.width = ripple.style.height = `${size}px`
      }
      onLog(stat)
    }}>
      <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
      <div className="stat-title">{title}</div>
      <div></div>
      <div className="stat-key">{keyTxt}</div>
    </button>
  )

  return (
    <div className="card">

      {/* Players section (no inner card to add depth) */}
      <div className="mb-3">
        <div className="text-sm opacity-80 mb-2">Select Player</div>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(72px,1fr))] gap-1.5 sm:gap-2.5 justify-items-stretch items-stretch">
          {players.map(p => {
            const last = (p.name||'').trim().split(/\s+/).slice(-1)[0] || '—'
            return (
              <button
                key={p.number}
                onClick={() => onSelect(p.number)}
                className={`aspect-square w-full rounded-xl border grid place-items-center transition
                  ${selected===p.number
                    ? 'bg-white/20 border-white/40 ring-2 ring-white/60 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="text-2xl md:text-3xl font-semibold leading-none">{p.number}</div>
                  <div className="text-[9px] md:text-[10px] opacity-80 truncate max-w-[92%] text-center">{last}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stat buttons container - new base+mod layout */}
      {!hideStats && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 md:p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-80">Record Stat</div>
            <button
              onClick={onHelp}
              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-white/20 bg-white/10 text-xs hover:bg-white/15"
              title="How this works"
            >?
            </button>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="grid grid-cols-4 gap-x-2.5 gap-y-2 md:gap-x-3 md:gap-y-2.5 auto-rows-[5.5rem] md:auto-rows-[6rem] flex-1">
              {/* Base stat tiles (select/lock, including Hitout) */}
            {/* Kick */}
            <button className={`stat-tile k relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY-rect.top-size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('K' as StatKey)
                onLog('K' as StatKey)
                setStage('pos')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Kick</div><div></div><div className="stat-key">K</div>
              </button>
            {/* Handball */}
            <button className={`stat-tile hb relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY-rect.top-size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('HB' as StatKey)
                onLog('HB' as StatKey)
                setStage('pos')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Handball</div><div></div><div className="stat-key">HB</div>
              </button>
            {/* Mark */}
            <button className={`stat-tile m relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('M' as StatKey)
                onLog('M' as StatKey)
                setStage('pos')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Mark</div><div></div><div className="stat-key">M</div>
              </button>
            {/* Tackle */}
            <button className={`stat-tile t relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('T' as StatKey)
                onLog('T' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Tackle</div><div></div><div className="stat-key">T</div>
              </button>
            {/* Goal */}
            <button className={`stat-tile g relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('G' as StatKey)
                onLog('G' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Goal</div><div></div><div className="stat-key">G</div>
              </button>
            {/* Behind */}
            <button className={`stat-tile bh relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('B' as StatKey)
                onLog('B' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Behind</div><div></div><div className="stat-key">B</div>
              </button>
            {/* Free For */}
            <button className={`stat-tile ff relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('FF' as StatKey)
                onLog('FF' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Free For</div><div></div><div className="stat-key">FF</div>
              </button>
            {/* Free Against */}
            <button className={`stat-tile fa relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('FA' as StatKey)
                onLog('FA' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Free Against</div><div></div><div className="stat-key">FA</div>
              </button>
            {/* Clearance */}
            <button className={`stat-tile cl relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('CL' as StatKey)
                onLog('CL' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Clearance</div><div></div><div className="stat-key">CL</div>
              </button>
            {/* Inside 50 */}
            <button className={`stat-tile i50 relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('I50' as StatKey)
                onLog('I50' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Inside 50</div><div></div><div className="stat-key">I50</div>
              </button>
            {/* Rebound 50 */}
            <button className={`stat-tile r50 relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('R50' as StatKey)
                onLog('R50' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Rebound 50</div><div></div><div className="stat-key">R50</div>
              </button>
            {/* Hitout */}
            <button className={`stat-tile ho relative overflow-hidden`} onClick={(e)=>{
                const btn=e.currentTarget as HTMLButtonElement; const ripple=btn.querySelector('.ripple') as HTMLSpanElement; if(ripple){ ripple.classList.remove('show'); void ripple.offsetWidth; ripple.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY - rect.top - size/2; ripple.style.left=`${x}px`; ripple.style.top=`${y}px`; ripple.style.width=ripple.style.height=`${size}px`; }
                setBaseStat('HO' as StatKey)
                onLog('HO' as StatKey)
                setBaseStat(null)
                setStage('idle')
              }}>
                <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                <div className="stat-title">Hitout</div><div></div><div className="stat-key">HO</div>
              </button>
            </div>
            {/* Side modifiers column */}
            <div className="w-[72px] grid grid-rows-5 gap-2">
              {MODS.map(m => {
                // colour base
                let variant = ''
                if (m.key === 'EF') variant = 'bg-green-400/20 border-green-400/40 text-green-100'
                else if (m.key === 'IF') variant = 'bg-red-400/20 border-red-400/40 text-red-100'
                else if (m.key === 'GBG') variant = 'bg-blue-500/20 border-blue-400/40 text-blue-100'
                else variant = 'bg-white/10 border-white/20 text-white/90 hover:bg-white/15'

                const active = (
                  (m.key === 'GBG' && stage === 'gbg') ||
                  ((m.key === 'CON' || m.key === 'UC') && stage === 'pos' && isBaseThatCanModify(baseStat)) ||
                  ((m.key === 'EF' || m.key === 'IF') && stage === 'eff' && (baseStat === 'K' || baseStat === 'HB'))
                )

                const glow = active ? 'ring-2 ring-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.6)]' : 'opacity-50'

                return (
                  <button
                    key={m.key}
                    className={`relative overflow-hidden h-full rounded-md border text-sm font-semibold tracking-wide transition ${variant} ${glow} ${!active ? 'pointer-events-none opacity-50' : ''} focus:outline-none`}
                    onClick={(e) => {
                      if (!active) return
                      const btn = e.currentTarget as HTMLButtonElement
                      const rip = btn.querySelector('.ripple') as HTMLSpanElement
                      if (rip) { rip.classList.remove('show'); void rip.offsetWidth; rip.classList.add('show'); const rect=btn.getBoundingClientRect(); const size=Math.max(rect.width,rect.height); const x=(e as any).clientX-rect.left-size/2; const y=(e as any).clientY-rect.top-size/2; rip.style.left=`${x}px`; rip.style.top=`${y}px`; rip.style.width=rip.style.height=`${size}px`; }

                      if (m.key === 'GBG') {
                        onLog('GBG' as unknown as StatKey)
                        setGbgArmed(false)
                        // stay in current stage
                      } else if (m.key === 'CON' || m.key === 'UC') {
                        if (baseStat === 'M') {
                          // Marks: record MC/MUC; do not increment generic CON/UC
                          const markKey = (m.key === 'CON' ? 'MC' : 'MUC') as StatKey
                          onLog(markKey)
                          setBaseStat(null)
                          setStage('idle')
                        } else {
                          // K/HB path: possession first, then effectiveness
                          onLog(m.key as StatKey)
                          setStage('eff')
                        }
                      } else if (m.key === 'EF' || m.key === 'IF') {
                        // Combine with base for K/HB only
                        const base = baseStat
                        if (base === 'K' || base === 'HB') {
                          const combined = `${base}_${m.key}` as unknown as StatKey
                          onLog(combined)
                        }
                        setBaseStat(null)
                        setStage('idle')
                      }

                      const wrap = btn.closest('.rounded-xl') as HTMLElement | null
                      if (wrap) { wrap.classList.remove('flash-stats'); void wrap.offsetWidth; wrap.classList.add('flash-stats'); setTimeout(()=>wrap.classList.remove('flash-stats'), 450) }
                    }}
                  >
                    <span className="ripple pointer-events-none absolute rounded-full opacity-30 bg-white/80"></span>
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-[28px] rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-white/80 flex items-center">
              {lastForSelected ? (
                <>
                  <span className="opacity-60 mr-1.5">Last</span>
                  <span className="font-semibold">#{lastForSelected.player_number}</span>
                  <span className="mx-1">·</span>
                  <span className="tabular-nums">Q{lastForSelected.quarter}</span>
                  <span className="mx-1">·</span>
                  <span className="font-semibold">{lastForSelected.stat_key}</span>
                </>
              ) : (
                <span className="opacity-60">No stat yet</span>
              )}
            </div>
            <button
              className={`h-[28px] px-2 rounded-md border text-[11px] font-medium transition ${lastForSelected ? 'bg-red-500/15 border-red-400/30 hover:bg-red-500/25' : 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed'}`}
              disabled={!lastForSelected}
              onClick={() => lastForSelected && onUndo(lastForSelected.id)}
              title="Undo last stat for this player"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ScoreGlow: animates score number glow on change
import { useRef } from 'react'
function ScoreGlow({ value, compact }:{ value:number; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef<number>(value)
  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove('score-glow-animate')
      void ref.current.offsetWidth
      ref.current.classList.add('score-glow-animate')
    }
    prev.current = value
  }, [value])
  return (
    <div
      ref={ref}
      className={`score-glow ${compact ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl'} font-semibold leading-none tabular-nums w-[5ch] min-w-[5ch] text-center transition-colors`}
    >
      {value}
    </div>
  )
}
// --- Styles for glassy header, team logo, score glow, stat-tile ripple ---
// (If using Tailwind, add these to your global CSS or inject via style tag)
// For demo, inject as a <style> tag here (remove if handled elsewhere)
if (typeof document !== 'undefined' && !document.getElementById('game-extra-styles')) {
  const style = document.createElement('style')
  style.id = 'game-extra-styles'
  style.innerHTML = `
  .glassy-header {
    backdrop-filter: blur(8px) saturate(1.2);
    -webkit-backdrop-filter: blur(8px) saturate(1.2);
    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
    border: 1.5px solid rgba(255,255,255,0.10);
  }
  .team-logo-glass {
    box-shadow: 0 2px 16px 0 rgba(0,0,0,0.07), 0 0 0 2px rgba(255,255,255,0.14) inset;
    background: linear-gradient(135deg,rgba(255,255,255,0.13) 0%,rgba(255,255,255,0.04) 100%);
    max-width:10.5rem;
    max-height:10.5rem;
  }
  .team-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .shadow-inner-glass {
    box-shadow: 0 1px 12px 0 rgba(255,255,255,0.08) inset, 0 0px 1px 0 rgba(52,211,153,0.04);
  }
  .score-glow {
    position: relative;
    color: #fff;
    text-shadow: 0 0 8px #fff8, 0 0 16px #34d39955;
    transition: text-shadow 0.25s, color 0.25s;
  }
  .score-glow-animate {
    animation: scoreGlowPulse 0.7s;
  }
  @keyframes scoreGlowPulse {
    0%   { text-shadow: 0 0 0px #fff8, 0 0 0px #34d39955; color: #fff;}
    20%  { text-shadow: 0 0 18px #fff, 0 0 32px #34d399aa; color: #e6ffe7;}
    80%  { text-shadow: 0 0 18px #fff, 0 0 32px #34d399aa; color: #e6ffe7;}
    100% { text-shadow: 0 0 8px #fff8, 0 0 16px #34d39955; color: #fff;}
  }
  .stat-tile {
    position: relative;
    overflow: hidden;
  }
  .stat-tile .ripple {
    position: absolute;
    pointer-events: none;
    border-radius: 9999px;
    transform: scale(0);
    opacity: 0.25;
    background: rgba(255,255,255,0.6);
    animation: none;
    z-index: 10;
  }
  .stat-tile .ripple.show {
    animation: statTileRipple 0.45s cubic-bezier(.4,0,.2,1);
  }
  /* ---- Unified, responsive typography for stat buttons ---- */
  .stat-tile{
    padding: 10px;
    border-radius: 16px;
  }
  .stat-tile .stat-title{
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    font-weight: 600;
    font-size: clamp(10px, 1.6vw, 13px);
    line-height: 1;
    letter-spacing: .02em;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: .9;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .stat-tile .stat-key{
    font-family: inherit;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    font-size: clamp(24px, 5vw, 40px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  /* prevent text overflow on very small screens */
  @media (max-width: 360px){
    .stat-tile .stat-key{ font-size: clamp(22px, 8vw, 32px); }
    .stat-tile .stat-title{ font-size: 10px; }
  }
  @keyframes statTileRipple {
    0%   { transform: scale(0); opacity: 0.32;}
    60%  { transform: scale(1.1); opacity: 0.22;}
    100% { transform: scale(1.7); opacity: 0;}
  }
  .flash-stats { animation: flashStats 0.45s ease-out; }
  @keyframes flashStats {
    0% { box-shadow: 0 0 0 rgba(255,255,255,0); }
    20% { box-shadow: 0 0 22px rgba(255,255,255,0.35); }
    100% { box-shadow: 0 0 0 rgba(255,255,255,0); }
  }
  .sash-mask { position: absolute; inset: 0; overflow: hidden; }
  /* Left sash: full height, slanted parallelogram */
  .sash-left { clip-path: polygon(0% 0%, 96% 0%, 72% 100%, 0% 100%); }
  /* Right sash: mirror of left */
  .sash-right { clip-path: polygon(4% 0%, 100% 0%, 100% 100%, 28% 100%); }
  @media (min-width: 768px) {
    .sash-left { clip-path: polygon(0% 0%, 94% 0%, 70% 100%, 0% 100%); }
    .sash-right { clip-path: polygon(6% 0%, 100% 0%, 100% 100%, 30% 100%); }
  }
  .full-bleed {
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    width: 100vw;
  }
  `
  document.head.appendChild(style)
}