import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useParams, useNavigate } from "react-router-dom";

// NOTE: we now show a soft error banner when inserts/loads fail via setBanner()

// Modifier glow utility
const activeGlow = "ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]";

// --- Allowed stat keys (mirrors DB constraint) ---
const STAT_KEYS = [
  "K","HB","M","T","G","B",
  "FF","FA","CL","I50","R50","HO",
  "GBG","CON","UC","MC","MUC",
  "K_EF","K_IF","HB_EF","HB_IF",
] as const;

export type StatKey = typeof STAT_KEYS[number];

type Player = { id: string; name: string; number: number };
type PlayerEvent = { id: string; type: string; quarter: number; created_at: string };

// Color/style map per stat (tuned to match the app’s vibrant style)
const BTN_STYLE: Record<StatKey, string> = {
  K: "bg-emerald-600 hover:bg-emerald-500 border-emerald-400",
  HB: "bg-sky-600 hover:bg-sky-500 border-sky-400",
  M: "bg-amber-600 hover:bg-amber-500 border-amber-400",
  T: "bg-rose-600 hover:bg-rose-500 border-rose-400",
  G: "bg-lime-600 hover:bg-lime-500 border-lime-400",
  B: "bg-indigo-600 hover:bg-indigo-500 border-indigo-400",
  FF: "bg-teal-600 hover:bg-teal-500 border-teal-400",
  FA: "bg-fuchsia-600 hover:bg-fuchsia-500 border-fuchsia-400",
  CL: "bg-orange-600 hover:bg-orange-500 border-orange-400",
  I50: "bg-cyan-600 hover:bg-cyan-500 border-cyan-400",
  R50: "bg-blue-700 hover:bg-blue-600 border-blue-400",
  HO: "bg-purple-700 hover:bg-purple-600 border-purple-400",
  GBG: "bg-zinc-700 hover:bg-zinc-600 border-zinc-400",
  CON: "bg-slate-700 hover:bg-slate-600 border-slate-400",
  UC: "bg-neutral-700 hover:bg-neutral-600 border-neutral-400",
  MC: "bg-pink-700 hover:bg-pink-600 border-pink-400",
  MUC: "bg-pink-800 hover:bg-pink-700 border-pink-500",
  K_EF: "bg-emerald-800 hover:bg-emerald-700 border-emerald-500",
  K_IF: "bg-emerald-900 hover:bg-emerald-800 border-emerald-600",
  HB_EF: "bg-sky-800 hover:bg-sky-700 border-sky-500",
  HB_IF: "bg-sky-900 hover:bg-sky-800 border-sky-600",
};

const card = "rounded-2xl border border-white/10 bg-[#121a2b]/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]";
const bigBtn =
  "rounded-xl border text-white font-bold shadow-lg shadow-black/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.98]";
const bigBtnSquare = "aspect-square p-4 text-2xl flex flex-col items-center justify-center";
const smallBtn = "px-4 py-2 rounded-lg border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.95]";

const STAT_DESCRIPTIONS: Record<string, string> = {
  K: "Kick",
  HB: "Handball",
  M: "Mark",
  T: "Tackle",
  G: "Goal",
  B: "Behind",
  FF: "Free Kick For",
  FA: "Free Kick Against",
  CL: "Clearance",
  I50: "Inside 50",
  R50: "Rebound 50",
  HO: "Hitout",
  GBG: "Ground Ball Get",
  CON: "Contested",
  UC: "Uncontested",
  MC: "Metres Carried",
  MUC: "Metres Uncontested",
  K_EF: "Kick Effective",
  K_IF: "Kick Ineffective",
  HB_EF: "Handball Effective",
  HB_IF: "Handball Ineffective",
};

export default function PlayerGame() {
  const navigate = useNavigate();
  const { gameId, playerId } = useParams<{ gameId: string; playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [events, setEvents] = useState<PlayerEvent[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [currentQuarter, setCurrentQuarter] = useState<1 | 2 | 3 | 4>(1);
  const lastInsertId = useRef<string | null>(null);

  // Modifiers: GBG (ground ball get), UC (uncontested), INEF (ineffective)
  const [modGBG, setModGBG] = useState(false);
  const [modUC, setModUC] = useState(false);
  const [modINEF, setModINEF] = useState(false);

  const [flashGBG, setFlashGBG] = useState(false);
  const [flashUC, setFlashUC] = useState(false);
  const [flashINEF, setFlashINEF] = useState(false);
  const pulseMods = () => {
    if (modGBG) setFlashGBG(true);
    if (modUC) setFlashUC(true);
    if (modINEF) setFlashINEF(true);
    setTimeout(() => { setFlashGBG(false); setFlashUC(false); setFlashINEF(false); }, 350);
  };

  const resetModifiers = () => {
    setModGBG(false);
    setModUC(false);
    setModINEF(false);
  };

  // fetch player
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("game_players")
        .select("id, name, number")
        .eq("id", playerId)
        .single();
      if (!error) setPlayer(data as Player);
    };
    load();
  }, [playerId]);

  // fetch events for this player
  const fetchEvents = async () => {
    // Try new table first
    const tryPlayerEvents = await supabase
      .from("player_events")
      .select("id, type, quarter, created_at")
      .eq("game_id", gameId)
      .eq("player_id", playerId!)
      .order("created_at", { ascending: true });

    if (!tryPlayerEvents.error && tryPlayerEvents.data) {
      setEvents(tryPlayerEvents.data as PlayerEvent[]);
      return;
    }

    // Fallback: old `events` table where stats are per player_number/stat_key
    const fallback = await supabase
      .from("events")
      .select("id, quarter, created_at, player_number, stat_key")
      .eq("game_id", gameId)
      .eq("player_number", player?.number || -1)
      .order("created_at", { ascending: true });

    if (fallback.error) {
      console.error("fetchEvents error", tryPlayerEvents.error || fallback.error);
      // surface a small banner in UI
      setBanner(`Load failed: ${ (tryPlayerEvents.error || fallback.error).message }`);
      setEvents([]);
      return;
    }

    const mapped = (fallback.data || []).map((e: any) => ({
      id: e.id,
      type: e.stat_key,
      quarter: e.quarter,
      created_at: e.created_at,
    })) as PlayerEvent[];
    setEvents(mapped);
  };

  useEffect(() => { if (player) fetchEvents(); }, [gameId, player]);

  // derived counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of STAT_KEYS) c[k] = 0;
    for (const e of events) c[e.type] = (c[e.type] || 0) + 1;
    return c as Record<StatKey, number>;
  }, [events]);

  const disposals = (counts.K_EF||0) + (counts.K_IF||0) + (counts.HB_EF||0) + (counts.HB_IF||0);
  const score = (counts.G || 0) * 6 + (counts.B || 0);

  // haptic (mobile)
  const vibrate = (ms = 12) => { if ("vibrate" in navigator) (navigator as any).vibrate(ms); };

  async function insertEvents(statKeys: StatKey[]) {
    if (!playerId) return;
    const rows = statKeys.map((k) => ({
      game_id: gameId,
      player_id: playerId,
      type: k,
      quarter: currentQuarter,
    }));

    // Optimistic UI (works for both tables)
    const temps = rows.map((r) => ({ id: `temp-${crypto.randomUUID()}`, type: r.type, quarter: r.quarter, created_at: new Date().toISOString() })) as PlayerEvent[];
    setEvents((prev) => [...prev, ...temps]);
    vibrate(10);

    // Try new table
    const ins = await supabase.from("player_events").insert(rows).select("id");
    if (!ins.error && Array.isArray(ins.data)) {
      const lastId = (ins.data as any[]).at(-1)?.id as string | undefined;
      if (lastId) lastInsertId.current = lastId;
      setEvents((prev) => {
        let i = 0;
        return prev.map((e) => {
          if (temps.some(t => t.id === e.id)) {
            const real = (ins.data as any[])[i++]?.id ?? e.id;
            return { ...e, id: real } as PlayerEvent;
          }
          return e;
        });
      });
      return;
    }

    // Fallback: insert into old `events` table
    const fallbackRows = statKeys.map((k) => ({
      game_id: gameId,
      team_side: 'home', // best-effort default; adjust if you track side elsewhere
      quarter: currentQuarter,
      timestamp_ms: Date.now(),
      player_number: player?.number || 0,
      stat_key: k,
    }));

    const fb = await supabase.from("events").insert(fallbackRows).select("id");
    if (fb.error) {
      // rollback optimistic temps
      setEvents((prev) => prev.filter((e) => !temps.some(t => t.id === e.id)));
      setBanner(`Save failed: ${ (ins.error || fb.error).message }`);
      console.error("insert error", ins.error || fb.error);
      return;
    }

    // On success, replace temp ids
    if (Array.isArray(fb.data)) {
      const lastId = (fb.data as any[]).at(-1)?.id as string | undefined;
      if (lastId) lastInsertId.current = lastId;
      setEvents((prev) => {
        let i = 0;
        return prev.map((e) => {
          if (temps.some(t => t.id === e.id)) {
            const real = (fb.data as any[])[i++]?.id ?? e.id;
            return { ...e, id: real } as PlayerEvent;
          }
          return e;
        });
      });
    }
  }

  // insert + optimistic UI with modifiers logic
  const logEvent = async (type: StatKey) => {
    if (!player?.number) return;

    // Goal/Behind: log and reset modifiers afterwards
    if (type === "G" || type === "B") {
      await insertEvents([type]);
      resetModifiers();
      return;
    }

    // Kicks & Handballs: default to Effective + Contested
    if (type === "K" || type === "HB") {
      pulseMods();
      const main: StatKey =
        type === "K"
          ? (modINEF ? "K_IF" : "K_EF")
          : (modINEF ? "HB_IF" : "HB_EF");

      const contest: StatKey = modUC ? "UC" : "CON";
      const extra: StatKey[] = [];
      if (modGBG) extra.push("GBG");

      await insertEvents([main, contest, ...extra]);
      // after a disposal, keep UC/INEF/GBG ON until end of possession, unless you prefer auto‑reset:
      // resetModifiers();
      return;
    }

    // Other direct stats (M, T, FF, FA, CL, I50, R50, HO, MC, MUC, GBG etc.)
    await insertEvents([type]);
  };

  const undo = async () => {
    // delete the most recent event we created (falls back to the last event)
    const last = lastInsertId.current || events[events.length - 1]?.id;
    if (!last) return;
    await supabase.from("player_events").delete().eq("id", last);
    lastInsertId.current = null;
    fetchEvents();
  };

  const endPossession = () => {
    resetModifiers();
  };

  // UI helpers
  const QuarterPill = ({ q }: { q: 1 | 2 | 3 | 4 }) => (
    <button
      onClick={() => setCurrentQuarter(q)}
      className={`px-3 h-9 rounded-xl border text-sm font-medium transition ${
        currentQuarter === q
          ? "bg-emerald-600/90 border-emerald-400 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
          : "bg-[#0f1729] border-white/10 hover:bg-[#13203b]"
      }`}
    >
      Q{q}
    </button>
  );

  useEffect(() => {
    // Note: fallback `events` table does not emit these realtime events
    const channel = supabase
      .channel(`player-events-${gameId}-${playerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_events',
        filter: `game_id=eq.${gameId} and player_id=eq.${playerId}`,
      }, () => {
        fetchEvents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameId, playerId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1220] text-white">
      {/* Top Nav / Header */}
      <header className="sticky top-0 z-30 bg-[#0b1220]/80 backdrop-blur border-b border-white/10">
        <div className="px-3 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5">Back</button>
          <div className="min-w-0 px-2 text-center">
            <div className="text-lg font-bold truncate">{player?.name || "Player"}</div>
            <div className="text-xs text-white/60">#{player?.number ?? "--"}</div>
          </div>
          <div className="text-4xl font-extrabold text-emerald-400 tabular-nums transition-transform">{disposals}</div>
          <div className="text-xs text-white/60">Disposals</div>
        </div>
        {/* Quarter selector */}
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            {[1,2,3,4].map((q)=> <QuarterPill key={q} q={q as 1|2|3|4} />)}
          </div>
        </div>
      </header>

      {/* Body: recent list + buttons */}
      <main className="flex-1 overflow-y-auto p-3 grid gap-3">
        {banner && (
          <div className="p-2 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm">
            {banner}
          </div>
        )}
        {/* Recent events */}
        <section className={`p-3 ${card}`}>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">Recent</h3>
          <ul className="grid gap-1 text-sm">
            {events.slice(-10).reverse().map((e) => (
              <li key={e.id} className="flex justify-between px-2 py-1 rounded-xl bg-white/5">
                <span className="capitalize">{e.type.replace("_","-")}</span>
                <span className="text-xs text-white/60">Q{e.quarter}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Record Stat Section */}
        <section className={`p-3 ${card}`}>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-4">Record Stat</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              "K","HB","M","T","G","B",
              "FF","FA","CL","I50","R50","HO"
            ].map((k) => (
              <button
                key={k}
                onClick={() => logEvent(k as StatKey)}
                className={`${bigBtn} ${bigBtnSquare} ${BTN_STYLE[k as StatKey]}`}
                title={STAT_DESCRIPTIONS[k] || k}
              >
                <span>{k.replace("_","-")}</span>
                <span className="text-xs font-normal mt-1">{STAT_DESCRIPTIONS[k]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Modifiers Row */}
        <section className={`p-3 ${card}`}>
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-2">Modifiers</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setModGBG(v => !v)}
              className={`${smallBtn} ${BTN_STYLE.GBG} ${modGBG ? activeGlow : ""}${flashGBG ? " animate-pulse" : ""}`}
              title="Ground Ball Get"
            >
              GBG
            </button>
            <button
              onClick={() => setModUC(v => !v)}
              className={`${smallBtn} ${BTN_STYLE.UC} ${modUC ? activeGlow : ""}${flashUC ? " animate-pulse" : ""}`}
              title="Uncontested"
            >
              UC
            </button>
            <button
              onClick={() => setModINEF(v => !v)}
              className={`${smallBtn} ${BTN_STYLE.K_IF} ${modINEF ? activeGlow : ""}${flashINEF ? " animate-pulse" : ""}`}
              title="Ineffective"
            >
              IN‑EF
            </button>
            <button
              onClick={endPossession}
              className={`${smallBtn} bg-white/10 border-white/20 text-white hover:bg-white/20`}
              title="End possession (reset modifiers)"
            >
              End Possession
            </button>
          </div>
        </section>

        <div className="h-24" />
      </main>

      {/* Sticky bottom action bar */}
      <footer className="fixed inset-x-0 bottom-0 z-40 bg-[#0b1220]/90 backdrop-blur border-t border-white/10">
        <div className="px-3 py-2 flex items-center gap-2">
          <button onClick={undo} className="flex-1 h-12 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold active:scale-[0.98]">Undo</button>
          <div className="text-xs text-white/60 flex items-center gap-2">
            <span>Q{currentQuarter}</span>
            {modGBG || modUC || modINEF ? (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-400/30">
                {modGBG ? "GBG " : ""}{modUC ? "UC " : ""}{modINEF ? "IN‑EF" : ""}
              </span>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}