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
  AF: 'bg-emerald-700/25 text-emerald-100',
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
  I50: 'from-teal-500 via-emerald-600 to-green-700',
  R50: 'from-cyan-500 via-teal-600 to-emerald-700',
  CL:  'from-orange-500 via-amber-600 to-rose-600',
  FF:  'from-teal-500 via-cyan-600 to-sky-700',
  FA:  'from-red-600 via-rose-700 to-pink-800',
  AF:  'from-emerald-600 via-teal-700 to-green-800',
  CON: 'from-emerald-500 via-teal-600 to-green-800',
  UC:  'from-teal-500 via-cyan-600 to-sky-800',
  GBG: 'from-green-500 via-emerald-700 to-lime-800',
  MUC: 'from-yellow-400 via-amber-600 to-orange-700',
  MC:  'from-amber-500 via-orange-700 to-rose-700',
  KEF: 'from-indigo-500 via-violet-600 to-fuchsia-700',
  KIF: 'from-teal-500 via-emerald-700 to-green-800',
  HEF: 'from-sky-500 via-cyan-600 to-blue-800',
  HIF: 'from-cyan-500 via-blue-700 to-indigo-800',
};

// Stat metadata map for labels and icons
const STAT_META: Record<string, {label: string; icon: string}> = {
  D:   { label: 'Disposals',    icon: '' },
  K:   { label: 'Kicks',        icon: '' },
  HB:  { label: 'Handballs',    icon: '' },
  M:   { label: 'Marks',        icon: '' },
  T:   { label: 'Tackles',      icon: '' },
  G:   { label: 'Goals',        icon: '' },
  B:   { label: 'Behinds',      icon: '' },
  I50: { label: 'Inside 50s',   icon: '' },
  R50: { label: 'Rebound 50s',  icon: '' },
  CL:  { label: 'Clearances',   icon: '' },
  FF:  { label: 'Frees For',    icon: '' },
  FA:  { label: 'Frees Against',icon: '' },
  AF:  { label: 'AFL Fantasy',  icon: '' },
  CON: { label: 'Contested', icon: '' },
  UC:  { label: 'Uncontested', icon: '' },
  GBG: { label: 'GBG', icon: '' },
  MUC: { label: 'Marks UC', icon: '' },
  MC:  { label: 'Marks C', icon: '' },
  KEF: { label: 'Kicks EF', icon: '' },
  KIF: { label: 'Kicks IF', icon: '' },
  HEF: { label: 'Handballs EF', icon: '' },
  HIF: { label: 'Handballs IF', icon: '' },
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
      {/* Professional Header with Enhanced Branding */}
      <header className="relative overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-green-600/10 rounded-3xl"></div>
        
        {/* Content */}
        <div className="relative rounded-3xl bg-white/[0.02] backdrop-blur-sm border border-white/10 shadow-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left Section - Branding & User Info */}
            <div className="flex items-center gap-6">
              {/* App Logo */}
              <div className="relative">
                <img
                  src="/kickchasers_logo.png"
                  alt="Kickchasers"
                  className="h-16 w-auto shrink-0 drop-shadow-lg md:h-20 lg:h-24"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl blur-sm -z-10"></div>
              </div>
              
              {/* Divider */}
              <div className="hidden md:block h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
              
              {/* Team & User Info */}
              <div className="flex items-center gap-4">
                {/* Team Logo */}
                <div className="relative">
                  {logoUrl ? (
                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center ring-2 ring-white/20 shadow-xl">
                      <img src={logoUrl} alt="team logo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 grid place-items-center ring-2 ring-white/20 shadow-xl text-2xl text-white/40">T</div>
                  )}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-2xl blur opacity-50 -z-10"></div>
                </div>
                
                {/* User Greeting */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-white/70 tracking-wide">Welcome back</div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{profile?.name || 'Coach'}</h1>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm"></div>
                      Season {new Date().getFullYear()}
                    </span>
                    {team && (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full shadow-sm"></div>
                        {team.name}
                      </span>
                    )}
                  </div>
                  {!logoUrl && (
                    <div className="mt-2 text-xs text-white/50 max-w-sm">
                      Add a club logo in <button type="button" onClick={() => nav('/profile')} className="text-emerald-400 hover:text-emerald-300 underline decoration-dotted underline-offset-2 transition-colors">Profile</button> to personalize your experience
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section - Quick Stats & Actions */}
            <div className="flex flex-col gap-4 lg:items-end">
              {/* Quick Stats Cards */}
              <div className="flex gap-3">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 rounded-xl p-3 backdrop-blur-sm border border-emerald-400/20">
                  <div className="text-xs text-emerald-200/80 tracking-wide">WINS</div>
                  <div className="text-xl font-bold text-white">{record.wins}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/30 rounded-xl p-3 backdrop-blur-sm border border-rose-400/20">
                  <div className="text-xs text-rose-200/80 tracking-wide">LOSSES</div>
                  <div className="text-xl font-bold text-white">{record.losses}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl p-3 backdrop-blur-sm border border-blue-400/20">
                  <div className="text-xs text-blue-200/80 tracking-wide">GAMES</div>
                  <div className="text-xl font-bold text-white">{games.length}</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-medium text-sm text-white transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95" 
                  onClick={()=>nav('/profile')}
                >
                  Profile
                </button>
                <Link 
                  to="/squad" 
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-medium text-sm text-white transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95" 
                  data-testid="load-squad"
                >
                  Load Squad
                </Link>
                <Link 
                  to="/new" 
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/50 rounded-xl font-semibold text-sm text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  New Game
                </Link>
                <button 
                  className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl font-medium text-sm text-red-200 hover:text-white transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95" 
                  onClick={onLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation Tabs */}
      <div className="relative">
        <div className="sticky top-0 z-20 -mx-6 px-6 py-4 backdrop-blur-2xl bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 border-b border-white/10 shadow-lg">
          {/* Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeTab==='games' ? 'Games Dashboard' : activeTab==='team' ? `Team Analytics${avgFilter!=='all' ? ` — ${avgFilter.charAt(0).toUpperCase() + avgFilter.slice(1)}` : ''}` : 'Player Rankings'}
              </h2>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-white/60 font-medium tracking-wide">QUICK ACCESS</div>
              <Link 
                to="/new" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-200 text-xs font-medium hover:from-emerald-500/30 hover:to-emerald-400/40 transition-all duration-200 hover:scale-105"
              >
                New Game
              </Link>
            </div>
          </div>
          
          {/* Enhanced Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
            {([
              ['games','Games', '', 'View and manage your game history'],
              ['team','Team Stats', '', 'Analyze team performance metrics'],
              ['players','Player Leaders', '', 'Top performing players this season'],
            ] as const).map(([key, label, icon, description]) => (
              <button
                key={key}
                onClick={()=>{ setActiveTab(key); nav(`/hub?tab=${key}`) }}
                aria-pressed={activeTab===key}
                title={description}
                className={`group relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95
                  ${activeTab===key 
                    ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 text-white shadow-lg ring-1 ring-white/20 scale-105' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'}
                `}
              >
                {/* Active indicator */}
                {activeTab === key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-400/30 shadow-inner"></div>
                )}
                
                {/* Content */}
                <span className="relative z-10 hidden sm:inline">{label}</span>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
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
          <div className="rounded-xl p-4 text-center ring-1 ring-white/15 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-700 text-white shadow-[0_6px_20px_rgba(16,185,129,.25)]">
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
        <section className="space-y-6">
          {/* Enhanced Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
              <div>
                <h3 className="text-xl font-bold text-white">Team Analytics</h3>
                <p className="text-sm text-white/60">Performance metrics and season averages</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Season Record */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60 font-medium tracking-wide">SEASON RECORD</span>
                <div className="flex items-center gap-1">
                  <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-sm font-bold text-emerald-300 tabular-nums">
                    {record.wins}W
                  </span>
                  <span className="text-white/40">-</span>
                  <span className="px-3 py-1.5 bg-rose-500/20 border border-rose-400/30 rounded-lg text-sm font-bold text-rose-300 tabular-nums">
                    {record.losses}L
                  </span>
                  {record.draws > 0 && (
                    <>
                      <span className="text-white/40">-</span>
                      <span className="px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-lg text-sm font-bold text-amber-300 tabular-nums">
                        {record.draws}D
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/10">
                {(['all','wins','losses'] as const).map(k => (
                  <button
                    key={k}
                    onClick={()=>setAvgFilter(k)}
                    aria-pressed={avgFilter===k}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      avgFilter===k
                        ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 text-white shadow-lg scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {k === 'all' ? 'All Games' : k === 'wins' ? 'Wins Only' : 'Losses Only'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Stats Grid Container */}
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] backdrop-blur-sm border border-white/10 p-6 shadow-2xl">
            <div className="mb-6 tracking-widest text-xs text-white/80 font-semibold uppercase">
              {avgFilter === 'all' ? 'Season Averages' : `${avgFilter} Averages`} • Per Game
            </div>
            
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {([
                ['D','DISPOSALS', ''],
                ['K','KICKS', ''],
                ['HB','HANDBALLS', ''],
                ['M','MARKS', ''],
                ['T','TACKLES', ''],
              ] as [keyof typeof perGame, string, string][]).map(([key,label,icon])=> {
                const bgGradient =
                  avgFilter==='wins' ? 'from-emerald-500/20 via-emerald-600/30 to-emerald-700/40'
                : avgFilter==='losses' ? 'from-rose-500/20 via-rose-600/30 to-rose-700/40'
                : (STAT_GRADIENTS[key] || 'from-emerald-500/20 via-teal-600/30 to-green-700/40');

                let arrow: JSX.Element | null = null;
                if (avgFilter !== 'all') {
                  const baseline = avgFilter==='wins' ? perGameLosses[key] : perGameWins[key];
                  const cur = perGame[key];
                  const EPS = 1e-6;
                  if (baseline !== undefined) {
                    const diff = Math.abs(cur - baseline);
                    if (diff > EPS) {
                      const better = cur > baseline;
                      arrow = (
                        <span className={`ml-2 text-sm ${
                          better ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {better ? '↗️' : '↘️'}
                        </span>
                      );
                    }
                  }
                }

                return (
                  <div key={key} className={`group relative rounded-2xl p-5 text-center ring-1 ring-white/15 text-white shadow-xl bg-gradient-to-br ${bgGradient} hover:scale-105 transition-all duration-300 backdrop-blur-sm`}>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xl">{icon}</span>
                    </div>
                    <div className="text-xs tracking-widest font-semibold mb-2 uppercase text-white/80">{label}</div>
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold tabular-nums">{(perGame as any)[key].toFixed(1)}</span>
                      {arrow}
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                );
              })}
            </div>
            
            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
              {([
                ['G','GOALS', '⚽'],
                ['B','BEHINDS', '🎯'],
                ['I50','INSIDE 50S', ''],
                ['R50','REBOUND 50s', ''],
                ['CL','CLEARANCES', ''],
                ['FF','FREES FOR', ''],
                ['FA','FREES AGAINST', ''],
                ['AF','AFL FANTASY', ''],
              ] as [keyof typeof perGame, string, string][]).map(([key,label,icon])=> {
                const bgGradient =
                  avgFilter==='wins' ? 'from-emerald-600/15 to-emerald-800/25'
                : avgFilter==='losses' ? 'from-rose-600/15 to-rose-800/25'
                : (STAT_GRADIENTS[key] || 'from-slate-600/15 to-slate-800/25');

                return (
                  <div key={key} className={`group rounded-xl p-4 text-center ring-1 ring-white/10 text-white bg-gradient-to-br ${bgGradient} hover:ring-white/20 transition-all duration-200 backdrop-blur-sm`}>
                    <div className="text-sm mb-1">{icon}</div>
                    <div className="text-[10px] tracking-widest font-medium mb-1 uppercase text-white/70">{label}</div>
                    <div className="text-lg font-bold tabular-nums">{(perGame as any)[key].toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Advanced Analytics Section */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="tracking-widest text-xs text-white/70 font-semibold uppercase">Advanced Analytics</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {([
                  ['CON','CONTESTED', ''],
                  ['UC','UNCONTESTED', ''],
                  ['GBG','GET THE BALL & GO', ''],
                  ['MUC','MARKS UNCONTESTED', ''],
                  ['MC','MARKS CONTESTED', ''],
                  ['KEF','KICKS EFFECTIVE', ''],
                  ['KIF','KICKS INEFFECTIVE', ''],
                  ['HEF','HANDBALLS EFFECTIVE', ''],
                  ['HIF','HANDBALLS INEFFECTIVE', ''],
                ] as [keyof typeof perGame, string, string][]).map(([key,label,icon])=>{
                  const bgGradient = (STAT_GRADIENTS as any)[key] || 'from-slate-600/15 to-slate-800/25';
                  return (
                    <div key={key} className={`group rounded-xl p-4 text-center ring-1 ring-white/10 text-white bg-gradient-to-br ${bgGradient} hover:ring-white/20 transition-all duration-200 backdrop-blur-sm`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="text-[10px] tracking-widest font-medium uppercase text-white/70">{label}</div>
                      </div>
                      <div className="text-xl font-bold tabular-nums">{(perGame as any)[key].toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
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
        <section className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
              <div>
                <h3 className="text-xl font-bold text-white">Game History</h3>
                <p className="text-sm text-white/60">Manage and review your season games</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 font-medium">
                {games.length} {games.length === 1 ? 'Game' : 'Games'}
              </div>
              <Link 
                to="/new" 
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-500/50 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Create Game
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-white/70">Loading games...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && games.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl flex items-center justify-center text-4xl text-white/40">
                T
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">No games yet</h4>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Start tracking your team's performance by creating your first game.
              </p>
              <Link 
                to="/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-500/50 rounded-xl font-semibold text-white transition-all duration-200 hover:from-emerald-500 hover:to-teal-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Create Your First Game
              </Link>
            </div>
          )}

          {/* Games Grid */}
          {!loading && games.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {games.map(g => {
                const gameDate = new Date(g.date);
                const isRecent = (Date.now() - gameDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // Within 7 days
                
                return (
                  <div key={g.id} className="group relative">
                    {/* Card Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl transition-all duration-300 group-hover:from-white/10 group-hover:to-white/15"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Card Content */}
                    <div className="relative p-6 border border-white/10 rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white text-lg">vs {g.opponent}</h4>
                            {isRecent && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs text-emerald-300 font-medium">
                                Recent
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/60 font-medium">
                            {gameDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric',
                              year: gameDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                            })}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          g.status === 'live' 
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                            : g.status === 'final'
                            ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                            : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            g.status === 'live' ? 'bg-emerald-400 animate-pulse' :
                            g.status === 'final' ? 'bg-blue-400' : 'bg-amber-400'
                          }`}></div>
                          {g.status.toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Venue */}
                      <div className="flex items-center gap-2 mb-6 text-sm text-white/60">
                        <span>{g.venue}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95" 
                          onClick={()=>nav(`/game/${g.id}`)}
                        >
                          Open Game
                        </button>
                        <Link 
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/30 hover:from-emerald-500/30 hover:to-teal-500/40 border border-emerald-500/30 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:scale-105 active:scale-95 text-center" 
                          to={`/summary/${g.id}`}
                        >
                          Stats
                        </Link>
                        <button 
                          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg font-medium text-sm text-red-200 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95" 
                          onClick={()=>onDelete(g.id)}
                          title="Delete game"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
      </main>
    </div>
  )
}