import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useMemo } from 'react'

const LOGO_BUCKET = 'team-logos';
function toPublicLogoUrl(path?: string | null){
  if(!path) return ''
  const isHttp = /^https?:\/\//i.test(path)
  if(isHttp) return path
  try{
    // @ts-ignore
    const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
    return data?.publicUrl || ''
  }catch{ return '' }
}

const AF_WEIGHTS: Record<string, number> = { K:3, HB:2, M:3, T:4, G:6, B:1, FF:1, FA:-3, CL:3, I50:0, R50:0 };
const STAT_COLORS: Record<string, string> = {
  D: 'bg-blue-600/20 text-blue-100',
  K: 'bg-indigo-600/20 text-indigo-100',
  HB: 'bg-sky-600/20 text-sky-100',
  M: 'bg-amber-600/20 text-amber-100',
  T: 'bg-rose-600/20 text-rose-100',
  G: 'bg-emerald-600/20 text-emerald-100',
  B: 'bg-lime-600/20 text-lime-100',
  I50: 'bg-fuchsia-600/20 text-fuchsia-100',
  R50: 'bg-cyan-600/20 text-cyan-100',
  CL: 'bg-orange-600/20 text-orange-100',
  FF: 'bg-teal-600/20 text-teal-100',
  FA: 'bg-red-700/25 text-red-100',
  AF: 'bg-purple-700/25 text-purple-100',
  CON: 'bg-emerald-600/20 text-emerald-100',
  UC:  'bg-teal-600/20 text-teal-100',
  GBG: 'bg-green-700/20 text-green-100',
  MUC: 'bg-yellow-600/20 text-yellow-100',
  MC:  'bg-amber-700/20 text-amber-100',
  KEF: 'bg-indigo-700/20 text-indigo-100',
  KIF: 'bg-violet-700/20 text-violet-100',
  HEF: 'bg-sky-700/20 text-sky-100',
  HIF: 'bg-cyan-700/20 text-cyan-100',
};

const STAT_GRADIENTS: Record<string, string> = {
  D:   'from-sky-500 via-blue-600 to-indigo-700',
  K:   'from-indigo-500 via-violet-600 to-fuchsia-700',
  HB:  'from-cyan-500 via-sky-600 to-blue-700',
  M:   'from-amber-500 via-orange-600 to-rose-600',
  T:   'from-rose-500 via-red-600 to-amber-600',
  G:   'from-emerald-500 via-teal-600 to-green-700',
  B:   'from-lime-500 via-emerald-600 to-emerald-800',
  I50: 'from-fuchsia-500 via-purple-600 to-violet-700',
  R50: 'from-cyan-500 via-teal-600 to-emerald-700',
  CL:  'from-orange-500 via-amber-600 to-rose-600',
  FF:  'from-teal-500 via-cyan-600 to-sky-700',
  FA:  'from-red-600 via-rose-700 to-pink-800',
  AF:  'from-purple-600 via-violet-700 to-fuchsia-800',
  CON: 'from-emerald-500 via-teal-600 to-green-800',
  UC:  'from-teal-500 via-cyan-600 to-sky-800',
  GBG: 'from-green-500 via-emerald-700 to-lime-800',
  MUC: 'from-yellow-400 via-amber-600 to-orange-700',
  MC:  'from-amber-500 via-orange-700 to-rose-700',
  KEF: 'from-indigo-500 via-violet-600 to-fuchsia-700',
  KIF: 'from-fuchsia-500 via-purple-700 to-violet-800',
  HEF: 'from-sky-500 via-cyan-600 to-blue-800',
  HIF: 'from-cyan-500 via-blue-700 to-indigo-800',
};

// Stat metadata map for labels and icons
const STAT_META: Record<string, {label: string; icon: string}> = {
  D:   { label: 'Disposals',    icon: '🟦' },
  K:   { label: 'Kicks',        icon: '👟' },
  HB:  { label: 'Handballs',    icon: '🤲' },
  M:   { label: 'Marks',        icon: '✋' },
  T:   { label: 'Tackles',      icon: '🤼' },
  G:   { label: 'Goals',        icon: '🥅' },
  B:   { label: 'Behinds',      icon: '🎯' },
  I50: { label: 'Inside 50s',   icon: '↘️' },
  R50: { label: 'Rebound 50s',  icon: '↗️' },
  CL:  { label: 'Clearances',   icon: '🚀' },
  FF:  { label: 'Frees For',    icon: '👍' },
  FA:  { label: 'Frees Against',icon: '👎' },
  AF:  { label: 'AFL Fantasy',  icon: '📊' },
  CON: { label: 'Contested', icon: '🧨' },
  UC:  { label: 'Uncontested', icon: '🎯' },
  GBG: { label: 'GBG', icon: '🟢' },
  MUC: { label: 'Marks UC', icon: '📐' },
  MC:  { label: 'Marks C', icon: '📏' },
  KEF: { label: 'Kicks EF', icon: '✅' },
  KIF: { label: 'Kicks IF', icon: '❌' },
  HEF: { label: 'Handballs EF', icon: '✅' },
  HIF: { label: 'Handballs IF', icon: '❌' },
};

type Game = {
  id:string; opponent:string; date:string; venue:string;
  status:'scheduled'|'live'|'final';
}

type Profile = { user_id:string; name:string|null; team_logo_path:string|null; team_logo_url:string|null }
type Team = { id:string; name:string }

export default function Hub(){
  const [searchParams] = useSearchParams();
  const nav=useNavigate()
  const initialTab = ((): 'games'|'team'|'players' => {
    const t = (searchParams.get('tab')||'').toLowerCase()
    if(t==='team') return 'team'
    if(t==='players') return 'players'
    return 'games'
  })()
  const [activeTab, setActiveTab] = useState<'games'|'team'|'players'>(initialTab)
  const [games,setGames]=useState<Game[]>([])
  const [loading,setLoading]=useState(true)
  const [profile,setProfile] = useState<Profile|null>(null)
  const [team,setTeam] = useState<Team|null>(null)
  const [logoUrl,setLogoUrl] = useState<string>('')
  const [seasonStats,setSeasonStats] = useState<Record<string,number>>({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0})
  const [seasonStatsWin,setSeasonStatsWin] = useState<Record<string,number>>({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});
  const [seasonStatsLoss,setSeasonStatsLoss] = useState<Record<string,number>>({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});
  const [record,setRecord] = useState({wins:0, losses:0, draws:0});
  const [avgFilter,setAvgFilter] = useState<'all'|'wins'|'losses'>('all');
  const [topDisposals, setTopDisposals] = useState<{name:string,total:number}[]>([])
  const [leadersByStat, setLeadersByStat] = useState<Record<string, {name:string,total:number}[]>>({});
  const [leaderStat, setLeaderStat] = useState<'D'|'K'|'HB'|'M'|'T'|'G'|'B'|'CL'|'I50'|'R50'|'FF'|'FA'>('D');

  useEffect(()=>{ (async()=>{
    setLoading(true)
    // 1) Who is signed in?
    const { data: u } = await supabase.auth.getUser()
    const user = u?.user
    if(!user){ setLoading(false); return }

    // 2) Profile & logo
    const { data: prof } = await supabase.from('profiles').select('user_id,name,team_logo_path,team_logo_url').eq('user_id', user.id).maybeSingle()
    if(prof){ setProfile(prof) }
    const direct = toPublicLogoUrl(prof?.team_logo_path || prof?.team_logo_url || '')
    if(direct) setLogoUrl(direct)

    // 3) Team owned by this user
    const { data: t } = await supabase.from('teams').select('id,name').eq('owner_user_id', user.id).maybeSingle()
    if(t){ setTeam(t) }

    // 4) Games for this team (as home)
    const { data: g } = await supabase
      .from('games')
      .select('id,opponent,date,venue,status')
      .eq('home_team_id', t?.id || '')
      .order('date',{ascending:false})
    setGames(g||[])

    // 5) Season events (sum only our side = home)
    if(g && g.length){
      const ids = g.map(x=>x.id)
      const { data: evts } = await supabase
        .from('events')
        .select('game_id, team_side, stat_key, player_number')
        .in('game_id', ids)

      // Map numbers to names per game for home side
      const { data: gps } = await supabase
        .from('game_players')
        .select('game_id, team_side, number, name')
        .in('game_id', ids)
        .eq('team_side','home');

      const nameByGameAndNumber = new Map<string,string>();
      (gps||[]).forEach(p=>{
        if(p && p.game_id!=null && p.number!=null){
          nameByGameAndNumber.set(`${p.game_id}:${p.number}`, p.name || `#${p.number}`);
        }
      });

      const STAT_KEYS = ['K','HB','M','T','G','B','FF','FA','CL','I50','R50','CON','UC','GBG','MUC','MC','KEF','KIF','HEF','HIF'] as const;

      // Overall totals (home only)
      const acc = {K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0} as Record<string,number>;

      // Per-game buckets for home counts
      const perGameHomeCounts = new Map<string, Record<string,number>>();
      const zeroCounts = () => ({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});

      // Per-game scoring for win/loss determination
      const homeScore = new Map<string,{G:number,B:number}>();
      const awayScore = new Map<string,{G:number,B:number}>();

      (evts||[]).forEach(e=>{
        // Build per-game tallies
        if(e.team_side==='home'){
          acc[e.stat_key] = (acc[e.stat_key]||0) + 1;
          const cur = perGameHomeCounts.get(e.game_id) || zeroCounts();
          // @ts-ignore
          cur[e.stat_key] = (cur[e.stat_key]||0) + 1;
          perGameHomeCounts.set(e.game_id, cur);
        }
        // Track scoring both sides
        if(e.stat_key==='G' || e.stat_key==='B'){
          const m = e.team_side==='home' ? homeScore : awayScore;
          const prev = m.get(e.game_id) || {G:0,B:0};
          // @ts-ignore
          prev[e.stat_key] += 1;
          m.set(e.game_id, prev);
        }
      });

      // Fold per-game home counts into Win/Loss buckets based on points
      const winTotals = zeroCounts();
      const lossTotals = zeroCounts();
      let wins = 0, losses = 0, draws = 0;
      ids.forEach(gid => {
        const h = homeScore.get(gid) || {G:0,B:0};
        const a = awayScore.get(gid) || {G:0,B:0};
        const hPts = h.G*6 + h.B;
        const aPts = a.G*6 + a.B;
        const c = perGameHomeCounts.get(gid) || zeroCounts();
        if(hPts > aPts){
          wins++; STAT_KEYS.forEach(k=>{ // @ts-ignore
            winTotals[k] += c[k]||0; });
        } else if(hPts < aPts){
          losses++; STAT_KEYS.forEach(k=>{ // @ts-ignore
            lossTotals[k] += c[k]||0; });
        } else {
          draws++; // ignore for now
        }
      });

      // Leaders (per-player) for a set of stats on the HOME team only
      const countsByStat: Record<string, Map<string, number>> = {};
      STAT_KEYS.forEach(k => { countsByStat[k] = new Map(); });
      const dispCounts = new Map<string, number>(); // D = K + HB

      (evts||[]).forEach(e => {
        if(e.team_side !== 'home') return;
        const key = `${e.game_id}:${e.player_number ?? ''}`;
        const name = nameByGameAndNumber.get(key) || (e.player_number!=null ? `#${e.player_number}` : 'Unknown');
        // D (disposals)
        if(e.stat_key === 'K' || e.stat_key === 'HB'){
          dispCounts.set(name, (dispCounts.get(name)||0) + 1);
        }
        // Specific stats
        if ((STAT_KEYS as readonly string[]).includes(e.stat_key)){
          const m = countsByStat[e.stat_key]!;
          m.set(name, (m.get(name)||0) + 1);
        }
      });

      // Turn into sorted top-5 lists per stat
      const nextLeaders: Record<string, {name:string,total:number}[]> = {};
      const calcTop = (map: Map<string, number>) => Array.from(map.entries())
        .map(([name,total])=>({name,total}))
        .sort((a,b)=> b.total - a.total)
        .slice(0,5);

      nextLeaders['D'] = calcTop(dispCounts);
      STAT_KEYS.forEach(k => { nextLeaders[k] = calcTop(countsByStat[k]!); });
      setLeadersByStat(nextLeaders);
      setTopDisposals(nextLeaders['D'] || []);

      // Derived totals
      acc.D = (acc.K||0) + (acc.HB||0);
      let af = 0; Object.entries(AF_WEIGHTS).forEach(([k,w])=>{ af += (acc[k]||0) * w });
      // @ts-ignore
      acc.AF = af;

      const addDerived = (obj: Record<string,number>) => {
        obj.D = (obj.K||0) + (obj.HB||0);
        let afv = 0; Object.entries(AF_WEIGHTS).forEach(([k,w])=>{ afv += (obj[k]||0) * (w as number) });
        // @ts-ignore
        obj.AF = afv;
      };
      addDerived(winTotals);
      addDerived(lossTotals);

      setSeasonStats(acc);
      setSeasonStatsWin(winTotals);
      setSeasonStatsLoss(lossTotals);
      setRecord({wins, losses, draws});
    } else {
      setSeasonStats({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});
      setSeasonStatsWin({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});
      setSeasonStatsLoss({K:0,HB:0,M:0,T:0,G:0,B:0,FF:0,FA:0,CL:0,I50:0,R50:0,D:0,AF:0,CON:0,UC:0,GBG:0,MUC:0,MC:0,KEF:0,KIF:0,HEF:0,HIF:0});
      setRecord({wins:0, losses:0, draws:0});
      setTopDisposals([]);
    }

    setLoading(false)
  })() },[])

  const gamesPlayed = useMemo(()=> games.length, [games])
  const perGame = useMemo(()=>{
    const pick = avgFilter==='wins' ? seasonStatsWin : avgFilter==='losses' ? seasonStatsLoss : seasonStats;
    const gp = Math.max(1, avgFilter==='wins' ? record.wins : avgFilter==='losses' ? record.losses : games.length);
    const D = (pick.K + pick.HB) / gp;
    const AF = (pick.AF || 0) / gp;
    return {
      D,
      K: (pick.K||0)/gp,
      HB: (pick.HB||0)/gp,
      M: (pick.M||0)/gp,
      T: (pick.T||0)/gp,
      G: (pick.G||0)/gp,
      B: (pick.B||0)/gp,
      I50: (pick.I50||0)/gp,
      R50: (pick.R50||0)/gp,
      CL: (pick.CL||0)/gp,
      FF: (pick.FF||0)/gp,
      FA: (pick.FA||0)/gp,
      AF,
      CON: (pick.CON||0)/gp,
      UC: (pick.UC||0)/gp,
      GBG: (pick.GBG||0)/gp,
      MUC: (pick.MUC||0)/gp,
      MC: (pick.MC||0)/gp,
      KEF: (pick.KEF||0)/gp,
      KIF: (pick.KIF||0)/gp,
      HEF: (pick.HEF||0)/gp,
      HIF: (pick.HIF||0)/gp,
    }
  }, [avgFilter, seasonStats, seasonStatsWin, seasonStatsLoss, record, games.length])

  const perGameWins = useMemo(()=>{
    const pick = seasonStatsWin;
    const gp = Math.max(1, record.wins || 0);
    const D = (pick.K + pick.HB) / gp;
    const AF = (pick.AF || 0) / gp;
    return {
      D,
      K: (pick.K||0)/gp,
      HB: (pick.HB||0)/gp,
      M: (pick.M||0)/gp,
      T: (pick.T||0)/gp,
      G: (pick.G||0)/gp,
      B: (pick.B||0)/gp,
      I50: (pick.I50||0)/gp,
      R50: (pick.R50||0)/gp,
      CL: (pick.CL||0)/gp,
      FF: (pick.FF||0)/gp,
      FA: (pick.FA||0)/gp,
      AF,
      CON: (pick.CON||0)/gp,
      UC: (pick.UC||0)/gp,
      GBG: (pick.GBG||0)/gp,
      MUC: (pick.MUC||0)/gp,
      MC: (pick.MC||0)/gp,
      KEF: (pick.KEF||0)/gp,
      KIF: (pick.KIF||0)/gp,
      HEF: (pick.HEF||0)/gp,
      HIF: (pick.HIF||0)/gp,
    }
  }, [seasonStatsWin, record.wins]);

  const perGameLosses = useMemo(()=>{
    const pick = seasonStatsLoss;
    const gp = Math.max(1, record.losses || 0);
    const D = (pick.K + pick.HB) / gp;
    const AF = (pick.AF || 0) / gp;
    return {
      D,
      K: (pick.K||0)/gp,
      HB: (pick.HB||0)/gp,
      M: (pick.M||0)/gp,
      T: (pick.T||0)/gp,
      G: (pick.G||0)/gp,
      B: (pick.B||0)/gp,
      I50: (pick.I50||0)/gp,
      R50: (pick.R50||0)/gp,
      CL: (pick.CL||0)/gp,
      FF: (pick.FF||0)/gp,
      FA: (pick.FA||0)/gp,
      AF,
      CON: (pick.CON||0)/gp,
      UC: (pick.UC||0)/gp,
      GBG: (pick.GBG||0)/gp,
      MUC: (pick.MUC||0)/gp,
      MC: (pick.MC||0)/gp,
      KEF: (pick.KEF||0)/gp,
      KIF: (pick.KIF||0)/gp,
      HEF: (pick.HEF||0)/gp,
      HIF: (pick.HIF||0)/gp,
    }
  }, [seasonStatsLoss, record.losses]);

  async function onLogout(){
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      // Hard redirect to app root so the router re-evaluates auth and shows the sign-in screen
      window.location.replace('/');
    }
  }

  async function onDelete(id:string){
    if(!confirm('Delete this game? This cannot be undone.')) return
    await supabase.from('games').delete().eq('id',id)
    setGames(g=>g.filter(x=>x.id!==id))
  }

  return (
    <div className="relative min-h-screen">
      <main className="max-w-5xl mx-auto p-6 space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers"
            className="h-[4.5rem] w-auto shrink-0 drop-shadow md:h-[5.5rem] lg:h-24"
          />
          <div className="hidden sm:block h-14 w-px bg-white/15 mx-3"></div>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                <img src={logoUrl} alt="team logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/10 grid place-items-center">🏉</div>
            )}
            <div>
              <div className="text-sm opacity-80">Welcome back</div>
              <h1 className="h1 leading-tight">{profile?.name || 'Coach'}</h1>
              {!logoUrl && (
                <div className="mt-0.5 text-xs text-white/70">
                  Tip: add a club logo in <button type="button" onClick={() => nav('/profile')} className="underline decoration-dotted underline-offset-2 hover:text-white">Profile</button> to personalise your experience.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={()=>nav('/profile')}>Profile</button>
            <Link to="/squad" className="btn btn-secondary" data-testid="manage-squad">Manage Squad</Link>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <Link to="/new" className="btn btn-primary">+ New Game</Link>
            <button className="btn btn-ghost hover:bg-red-600/70" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </header>

      {/* Sticky mini-nav */}
      <div className="relative">
        <div className="sticky top-0 z-20 -mx-6 px-6 py-3 backdrop-blur-xl 
        bg-[linear-gradient(90deg,rgba(56,189,248,.12)_0%,rgba(147,51,234,.12)_100%)] 
        border-b border-white/10 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-2 relative z-10">
            <h2 className="text-sm tracking-widest font-semibold text-white uppercase drop-shadow-md">
              {activeTab==='games' ? 'Games' : activeTab==='team' ? `Season Averages${avgFilter!=='all' ? ` — ${avgFilter}` : ''}` : 'Season Leaders'}
            </h2>
          </div>
          <div className="flex items-center gap-2 justify-end relative z-10">
            {([
              ['games','Games'],
              ['team','Team Averages'],
              ['players','Player Leaders'],
            ] as const).map(([key,label]) => (
              <button
                key={key}
                onClick={()=>{ setActiveTab(key); nav(`/hub?tab=${key}`) }}
                aria-pressed={activeTab===key}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors active:scale-[.97] 
                  ${activeTab===key 
                    ? 'bg-gradient-to-r from-sky-500/30 to-purple-500/30 text-white shadow-md ring-1 ring-white/20' 
                    : 'bg-white/[.04] hover:bg-white/[.08] text-white/70 ring-1 ring-white/10'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stat highlights between nav and content */}
      {activeTab==='games' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {/* Disposals / game */}
          <div className="rounded-xl p-4 text-center ring-1 ring-white/15 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-[0_6px_20px_rgba(56,189,248,.25)]">
            <div className="text-[10px] sm:text-xs tracking-widest font-medium mb-1 uppercase/70">Disposals / Game</div>
            <div className="text-2xl font-semibold tabular-nums drop-shadow-sm">{perGame.D.toFixed(1)}</div>
          </div>
          {/* Inside 50s / game */}
          <div className="rounded-xl p-4 text-center ring-1 ring-white/15 bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-700 text-white shadow-[0_6px_20px_rgba(168,85,247,.25)]">
            <div className="text-[10px] sm:text-xs tracking-widest font-medium mb-1 uppercase/70">Inside 50s / Game</div>
            <div className="text-2xl font-semibold tabular-nums drop-shadow-sm">{perGame.I50.toFixed(1)}</div>
          </div>
          {/* Leader — Disposals */}
          <div className="rounded-xl p-4 text-center ring-1 ring-white/15 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-700 text-white shadow-[0_6px_20px_rgba(16,185,129,.25)]">
            <div className="text-[10px] sm:text-xs tracking-widest font-medium mb-1 uppercase/70">Leader — Disposals</div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-medium truncate drop-shadow-sm">{(leadersByStat['D']?.[0]?.name) || '—'}</div>
              <div className="text-2xl font-semibold tabular-nums drop-shadow-sm">{leadersByStat['D']?.[0]?.total ?? '—'}</div>
            </div>
          </div>
          {/* Leader — Tackles */}
          <div className="rounded-xl p-4 text-center ring-1 ring-white/15 bg-gradient-to-br from-rose-400 via-red-500 to-amber-600 text-white shadow-[0_6px_20px_rgba(244,63,94,.25)]">
            <div className="text-[10px] sm:text-xs tracking-widest font-medium mb-1 uppercase/70">Leader — Tackles</div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-medium truncate drop-shadow-sm">{(leadersByStat['T']?.[0]?.name) || '—'}</div>
              <div className="text-2xl font-semibold tabular-nums drop-shadow-sm">{leadersByStat['T']?.[0]?.total ?? '—'}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='team' && (
        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="tracking-widest text-xs text-white/80">SEASON AVERAGES</div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded-full text-[11px] tabular-nums bg-white/5 ring-1 ring-white/10 text-white/80">
                {record.wins}–{record.losses}{record.draws?`–${record.draws}`:''}
              </span>
              <div className="inline-flex rounded-full overflow-hidden ring-1 ring-white/10">
                {(['all','wins','losses'] as const).map(k => (
                  <button
                    key={k}
                    onClick={()=>setAvgFilter(k)}
                    aria-pressed={avgFilter===k}
                    className={`px-3 py-1 text-xs transition-colors ${
                      avgFilter===k
                        ? 'bg-gradient-to-r from-sky-500/30 to-purple-500/30 text-white ring-1 ring-white/20'
                        : 'bg-white/[.04] hover:bg-white/[.08] text-white/70'
                    }`}
                  >
                    {k.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {([
              ['D','DISPOSALS'],
              ['K','KICKS'],
              ['HB','HANDBALLS'],
              ['M','MARKS'],
              ['T','TACKLES'],
              ['G','GOALS'],
              ['B','BEHINDS'],
              ['I50','INSIDE 50S'],
              ['R50','REBOUND 50s'],
              ['CL','CLEARANCES'],
              ['FF','FREES FOR'],
              ['FA','FREES AGAINST'],
              ['AF','AFL FANTASY'],
            ] as [keyof typeof perGame, string][]).map(([key,label])=> {
              const bgGradient =
                avgFilter==='wins' ? 'from-emerald-600 via-emerald-700 to-emerald-900'
              : avgFilter==='losses' ? 'from-rose-600 via-rose-700 to-rose-900'
              : (STAT_GRADIENTS[key] || 'from-slate-600 to-slate-800');

              let arrow: JSX.Element | null = null;
              if (avgFilter !== 'all') {
                const baseline = avgFilter==='wins' ? perGameLosses[key] : perGameWins[key];
                const cur = perGame[key];
                const EPS = 1e-6;
                if (baseline !== undefined) {
                  if (cur - baseline > EPS) {
                    arrow = <span className="ml-2 text-emerald-400 align-middle">▲</span>;
                  } else if (baseline - cur > EPS) {
                    arrow = <span className="ml-2 text-rose-400 align-middle">▼</span>;
                  }
                }
              }
              return (
                <div
                  key={key}
                  className={`rounded-xl p-4 text-center ring-1 ring-white/15 text-white shadow-[0_6px_20px_rgba(0,0,0,.25)] bg-gradient-to-br ${bgGradient} `}
                >
                  <div className="text-[10px] sm:text-xs tracking-widest font-semibold mb-1 uppercase drop-shadow">
                    {label}
                  </div>
                  <div className="text-2xl font-bold tabular-nums drop-shadow-sm">
                    {perGame[key].toFixed(1)}{arrow}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Advanced block */}
          <div className="mt-4 mb-2 tracking-widest text-[10px] sm:text-xs text-white/70">ADVANCED</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {([
              ['CON','CONTESTED'],
              ['UC','UNCONTESTED'],
              ['GBG','GBG'],
              ['MUC','MARKS UC'],
              ['MC','MARKS C'],
              ['KEF','KICKS EF'],
              ['KIF','KICKS IF'],
              ['HEF','HANDBALLS EF'],
              ['HIF','HANDBALLS IF'],
            ] as [keyof typeof perGame, string][]).map(([key,label])=>{
              const bgGradient = (STAT_GRADIENTS as any)[key] || 'from-slate-600 to-slate-800';
              return (
                <div key={key} className={`rounded-xl p-4 text-center ring-1 ring-white/15 text-white shadow-[0_6px_20px_rgba(0,0,0,.25)] bg-gradient-to-br ${bgGradient}`}>
                  <div className="text-[10px] sm:text-xs tracking-widest font-semibold mb-1 uppercase drop-shadow">{label}</div>
                  <div className="text-2xl font-bold tabular-nums drop-shadow-sm">{(perGame as any)[key].toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab==='players' && (
        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
          <div className="mb-3 tracking-widest text-xs text-white/80">SEASON LEADERS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(['D','K','HB','M','T','G','B','CL','I50','R50','FF','FA','CON','UC','GBG','MUC','MC','KEF','KIF','HEF','HIF'] as const).map(k => {
              const list = leadersByStat[k] || [];
              const first = list[0];
              const second = list[1];
              const third = list[2];
              const grad = STAT_GRADIENTS[k] || 'from-slate-500 via-slate-600 to-slate-700';
              return (
                <div key={k} className="rounded-xl p-4 ring-1 ring-white/10 bg-white/5 hover:bg-white/[.07] transition shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
                  <div className="text-[10px] sm:text-xs tracking-widest font-semibold uppercase text-white/80 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/10 ring-1 ring-white/10 text-[10px]">{STAT_META[k]?.icon || '•'}</span>
                    {STAT_META[k]?.label || k}
                  </div>

                  {!first ? (
                    <div className="opacity-60 text-sm mt-3">No data yet.</div>
                  ) : (
                    <>
                      {/* colorful clipped underline */}
                      <div className={`mt-2 h-[3px] rounded-full bg-gradient-to-r ${grad}`} />

                      {/* Leader row */}
                      <div className="mt-3 flex items-baseline justify-between gap-3">
                        <div className="text-lg sm:text-xl font-semibold truncate">{first.name}</div>
                        <div className="text-2xl font-bold tabular-nums">{first.total}</div>
                      </div>

                      {/* Thin accent divider */}
                      <div className={`mt-2 h-px bg-gradient-to-r ${grad} opacity-60`} />

                      {/* 2nd / 3rd rows */}
                      <div className="mt-3 grid grid-rows-2 gap-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate opacity-85">{second ? `2. ${second.name}` : '—'}</div>
                          <div className="tabular-nums opacity-80">{second?.total ?? ''}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate opacity-70">{third ? `3. ${third.name}` : '—'}</div>
                          <div className="tabular-nums opacity-70">{third?.total ?? ''}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {activeTab==='games' && (
        <section className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
          <div className="flex items-center justify-between mb-3">
            <div className="h2">Previous Games</div>
            <div className="text-sm opacity-70">{games.length} total</div>
          </div>
          {loading && <div className="opacity-70">Loading…</div>}
          {!loading && games.length===0 && <div className="opacity-70">No games yet.</div>}

          <ul className="divide-y divide-white/10">
            {games.map(g=>(
              <li key={g.id} className="py-3 px-2 rounded-xl transition-colors hover:bg-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">{new Date(g.date).toLocaleDateString()} — vs {g.opponent}</div>
                  <div className="text-sm opacity-70 flex items-center gap-2">
                    <span>{g.venue}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className={`inline-block size-1.5 rounded-full ${g.status==='live'?'bg-emerald-400':g.status==='final'?'bg-white/40':'bg-sky-400'}`} />
                      {g.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-primary text-sm px-3 py-1.5" 
                      onClick={()=>nav(`/game/${g.id}`)}
                    >
                      {g.status === 'live' ? '🔴 Resume' : g.status === 'final' ? '📊 View' : '▶️ Start'}
                    </button>
                    <Link 
                      className="btn btn-secondary text-sm px-3 py-1.5" 
                      to={`/summary/${g.id}`}
                    >
                      📈 Summary
                    </Link>
                  </div>
                  <div className="h-6 w-px bg-white/10 mx-1"></div>
                  <button 
                    className="btn btn-ghost hover:bg-red-600/60 text-sm px-2 py-1.5 text-red-400" 
                    onClick={()=>onDelete(g.id)}
                    title="Delete game"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      </main>
    </div>
  )
}