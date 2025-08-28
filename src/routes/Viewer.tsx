import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { STAT_DEFS, StatKey } from '@/types'
type Totals = Record<StatKey, number>
export default function Viewer(){
  const { gameId }=useParams(); const [events,setEvents]=useState<any[]>([])
  useEffect(()=>{
    const ch=supabase.channel('realtime:events').on('postgres_changes',{event:'*',schema:'public',table:'events',filter:`game_id=eq.${gameId}`},(p)=>{ setEvents(ev=>[...ev, p.new]) }).subscribe()
    ;(async()=>{ const {data}=await supabase.from('events').select('*').eq('game_id',gameId).order('timestamp_ms'); setEvents(data||[]) })()
    return ()=>{ supabase.removeChannel(ch) }
  },[gameId])
  const totalsFor=(side:'home'|'away')=>{ const out=Object.fromEntries(STAT_DEFS.map(s=>[s.key,0])) as Totals; for(const e of events) if(e.team_side===side) out[e.stat_key as StatKey]++; return out }
  const th=useMemo(()=>totalsFor('home'),[events]); const ta=useMemo(()=>totalsFor('away'),[events])
  return <div className="max-w-3xl mx-auto p-6 space-y-3">
    <h1 className="h1">Live Viewer</h1>
    <div className="grid grid-cols-2 gap-4">
      {['home','away'].map(side=>(
        <div key={side}><div className="font-semibold mb-2">{side==='home'?'Home':'Away'}</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {STAT_DEFS.map(s=>(<div key={s.key} className="rounded-lg bg-slate-200 dark:bg-slate-800 p-3 text-center">
              <div className="text-xs text-slate-600 dark:text-slate-400">{s.key}</div>
              <div className="text-xl font-bold">{(side==='home'?th:ta)[s.key]}</div>
            </div>))}
          </div>
        </div>
      ))}
    </div>
  </div>
}
