import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

type Player = { id?: string; number: number; name: string };
type SquadSet = { name: string };
const DEFAULT_SET_NAME = "Default";

export default function Squad() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sets, setSets] = useState<SquadSet[]>([]);
  const [currentSet, setCurrentSet] = useState<string>(DEFAULT_SET_NAME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      // 1) load distinct set names for this user
      const { data: setRows, error: setErr } = await supabase
        .from("squads")
        .select("set_name")
        .eq("user_id", user.user.id)
        .order("set_name", { ascending: true });

      if (setErr) {
        console.warn("Could not load squad sets", setErr);
      }

      const unique = Array.from(
        new Set((setRows ?? []).map((r: any) => r.set_name || DEFAULT_SET_NAME))
      );

      const initialSet = unique[0] || DEFAULT_SET_NAME;
      setSets(unique.map((name) => ({ name })));
      setCurrentSet(initialSet);

      // 2) load players for that set
      const { data, error } = await supabase
        .from("squads")
        .select("id, number, name")
        .eq("user_id", user.user.id)
        .eq("set_name", initialSet)
        .order("number");

      if (!error && data) setPlayers(data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("squads")
        .select("id, number, name")
        .eq("user_id", user.user.id)
        .eq("set_name", currentSet)
        .order("number");
      if (!error && data) setPlayers(data);
      else setPlayers([]);
      setLoading(false);
    })();
  }, [currentSet]);

  const addPlayer = () => {
    if (players.length >= 60) return;
    setPlayers([...players, { number: players.length + 1, name: "" }]);
  };

  const updatePlayer = (i: number, field: keyof Player, value: any) => {
    const next = [...players];
    // @ts-ignore
    next[i][field] = value;
    setPlayers(next);
  };

  const deletePlayer = (i: number) => {
    const next = [...players];
    next.splice(i, 1);
    setPlayers(next);
  };

  const canAddMoreSets = sets.length < 5;

  const createSet = async () => {
    if (!canAddMoreSets) return alert("You can have up to 5 squads.");
    const proposed = prompt("Name this squad (e.g., League, Reserves)", "New Squad");
    if (!proposed) return;
    if (sets.some((s) => s.name.toLowerCase() === proposed.toLowerCase()))
      return alert("A squad with that name already exists.");
    setSavedAt(null); setErrorMsg(null);
    setSets((prev) => [...prev, { name: proposed }]);
    setCurrentSet(proposed);
    setPlayers([]);
  };

  const renameSet = async () => {
    const next = prompt("Rename squad", currentSet);
    if (!next || next === currentSet) return;
    if (sets.some((s) => s.name.toLowerCase() === next.toLowerCase()))
      return alert("A squad with that name already exists.");

    // Move existing rows to the new set name
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      try {
        const { error: renameErr } = await supabase
          .from("squads")
          .update({ set_name: next })
          .eq("user_id", user.user.id)
          .eq("set_name", currentSet);
        if (renameErr) throw renameErr;
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to rename squad");
        return;
      }
    }

    setSets((prev) => prev.map((s) => (s.name === currentSet ? { name: next } : s)));
    setCurrentSet(next);
  };

  const deleteSet = async () => {
    if (!confirm(`Delete squad "${currentSet}"? This removes its players.`)) return;
    const { data: user } = await supabase.auth.getUser();
    if (user?.user) {
      try {
        const { error: delErr } = await supabase
          .from("squads")
          .delete()
          .eq("user_id", user.user.id)
          .eq("set_name", currentSet);
        if (delErr) throw delErr;
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to delete squad");
        return;
      }
    }
    const remaining = sets.filter((s) => s.name !== currentSet);
    const next = remaining[0]?.name || DEFAULT_SET_NAME;
    setSets(remaining.length ? remaining : [{ name: DEFAULT_SET_NAME }]);
    setCurrentSet(next);
    setPlayers([]);
  };

  const save = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    setSaving(true);
    setSavedAt(null);
    setErrorMsg(null);

    // Basic validation
    const cleaned = players
      .filter((p) => (p.name && p.name.trim().length) || (Number.isFinite(p.number) && p.number > 0))
      .map((p) => ({
        user_id: user.user.id,
        number: Number(p.number) || 0,
        name: (p.name || "").trim(),
        set_name: currentSet,
      }));

    try {
      // Clear existing rows for this set (so removing players works)
      const { error: delErr } = await supabase
        .from("squads")
        .delete()
        .eq("user_id", user.user.id)
        .eq("set_name", currentSet);
      if (delErr) throw delErr;

      if (cleaned.length) {
        // Insert fresh rows. If you add a UNIQUE constraint later (user_id,set_name,number),
        // switch to upsert with onConflict below and remove the delete above.
        const { error: insErr } = await supabase
          .from("squads")
          .insert(cleaned);
        // Alternative (if you add a unique index):
        // const { error: insErr } = await supabase
        //   .from("squads")
        //   .upsert(cleaned, { onConflict: "user_id,set_name,number" });
        if (insErr) throw insErr;
      }

      setSavedAt(new Date());
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not save squad");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="h1">Squad Management</h1>
            <button
              className="btn btn-secondary"
              onClick={() => nav('/hub')}
            >
              ← Back to Hub
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Squad Tab Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Squads</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">{sets.length}/5 squads</span>
              <button 
                className="btn btn-primary"
                onClick={createSet} 
                disabled={!canAddMoreSets}
              >
                + Create Squad
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="relative">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm overflow-x-auto scrollbar-hide">
              {sets.map((squad) => (
                <button
                  key={squad.name}
                  onClick={() => setCurrentSet(squad.name)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0
                    ${
                      currentSet === squad.name
                        ? 'bg-white text-slate-900 shadow-lg shadow-white/20 scale-[1.02]'
                        : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                    }
                  `}
                >
                  <span className="relative z-10">{squad.name.toUpperCase()}</span>
                  {currentSet === squad.name && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white to-white/95 shadow-[0_4px_20px_rgba(255,255,255,.15)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Squad Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button 
              className="btn btn-secondary"
              onClick={renameSet}
            >
              Rename Squad
            </button>
            <button 
              className="btn btn-ghost hover:bg-red-600/70"
              onClick={deleteSet}
            >
              Delete Squad
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6 text-center">
            <div className="text-white/70">Loading squad data...</div>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 ring-1 ring-rose-400/20 px-6 py-4 text-rose-200">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{errorMsg}</p>
              <button className="btn btn-secondary" onClick={() => setErrorMsg(null)}>Dismiss</button>
            </div>
          </div>
        )}

        {savedAt && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 ring-1 ring-emerald-400/20 px-6 py-4 text-emerald-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Squad "{currentSet}" saved successfully</p>
                <p className="text-sm opacity-80">{savedAt.toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <button
                  className="btn btn-primary"
                  onClick={() => nav('/hub')}
                >
                  Go to Hub
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSavedAt(null)}
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Players Section */}
        {!loading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Players</h3>
                <p className="text-sm text-white/60">Up to 60 players per squad</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">{players.length}/60</span>
                <button 
                  className="btn btn-primary" 
                  onClick={addPlayer} 
                  disabled={players.length >= 60}
                >
                  + Add Player
                </button>
              </div>
            </div>
            
            {/* Players by Position */}
            <div className="space-y-8">
              {/* Forwards Section */}
              {(players.length > 0 || players.slice(0, 6).length > 0) && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">FORWARDS</h4>
                    <div className="h-px bg-white/20 w-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.slice(0, 6).map((p, i) => (
                      <div key={i} className="group rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/[0.08] transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NUMBER</label>
                            <input
                              type="number"
                              value={p.number}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || "0", 10);
                                updatePlayer(i, "number", Number.isFinite(val) ? val : 0);
                              }}
                              className="input w-16 h-8 text-center text-sm font-semibold bg-white/10 border-white/20 focus:border-white/40"
                              min="1"
                              max="99"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide">Name</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => updatePlayer(i, "name", e.target.value)}
                              placeholder="Player name"
                              className="input w-full h-8 text-sm bg-white/10 border-white/20 focus:border-white/40"
                            />
                          </div>
                          <button 
                            className="btn btn-ghost text-xs px-2 py-1 hover:bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                            onClick={() => deletePlayer(i)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {players.length < 6 && (
                      <button 
                        className="rounded-lg border-2 border-dashed border-white/30 p-3 hover:border-white/50 hover:bg-white/5 transition-all duration-200 flex items-center justify-center text-white/60 hover:text-white/80"
                        onClick={addPlayer}
                        disabled={players.length >= 60}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Midfield Section */}
              {players.length > 6 && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">MIDFIELD</h4>
                    <div className="h-px bg-white/20 w-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.slice(6, 12).map((p, i) => (
                      <div key={i + 6} className="group rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/[0.08] transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NUMBER</label>
                            <input
                              type="number"
                              value={p.number}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || "0", 10);
                                updatePlayer(i + 6, "number", Number.isFinite(val) ? val : 0);
                              }}
                              className="input w-16 h-8 text-center text-sm font-semibold bg-white/10 border-white/20 focus:border-white/40"
                              min="1"
                              max="99"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide">Name</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => updatePlayer(i + 6, "name", e.target.value)}
                              placeholder="Player name"
                              className="input w-full h-8 text-sm bg-white/10 border-white/20 focus:border-white/40"
                            />
                          </div>
                          <button 
                            className="btn btn-ghost text-xs px-2 py-1 hover:bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                            onClick={() => deletePlayer(i + 6)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {players.length >= 6 && players.length < 12 && (
                      <button 
                        className="rounded-lg border-2 border-dashed border-white/30 p-3 hover:border-white/50 hover:bg-white/5 transition-all duration-200 flex items-center justify-center text-white/60 hover:text-white/80"
                        onClick={addPlayer}
                        disabled={players.length >= 60}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Forwards Section (2nd) */}
              {players.length > 12 && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">FORWARDS</h4>
                    <div className="h-px bg-white/20 w-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.slice(12, 18).map((p, i) => (
                      <div key={i + 12} className="group rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/[0.08] transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NUMBER</label>
                            <input
                              type="number"
                              value={p.number}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || "0", 10);
                                updatePlayer(i + 12, "number", Number.isFinite(val) ? val : 0);
                              }}
                              className="input w-16 h-8 text-center text-sm font-semibold bg-white/10 border-white/20 focus:border-white/40"
                              min="1"
                              max="99"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide">Name</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => updatePlayer(i + 12, "name", e.target.value)}
                              placeholder="Player name"
                              className="input w-full h-8 text-sm bg-white/10 border-white/20 focus:border-white/40"
                            />
                          </div>
                          <button 
                            className="btn btn-ghost text-xs px-2 py-1 hover:bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                            onClick={() => deletePlayer(i + 12)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {players.length >= 12 && players.length < 18 && (
                      <button 
                        className="rounded-lg border-2 border-dashed border-white/30 p-3 hover:border-white/50 hover:bg-white/5 transition-all duration-200 flex items-center justify-center text-white/60 hover:text-white/80"
                        onClick={addPlayer}
                        disabled={players.length >= 60}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Interchange Section */}
              {players.length > 18 && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">INTERCHANGE</h4>
                    <div className="h-px bg-white/20 w-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.slice(18).map((p, i) => (
                      <div key={i + 18} className="group rounded-lg bg-white/5 ring-1 ring-white/10 p-3 hover:bg-white/[0.08] transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NUMBER</label>
                            <input
                              type="number"
                              value={p.number}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || "0", 10);
                                updatePlayer(i + 18, "number", Number.isFinite(val) ? val : 0);
                              }}
                              className="input w-16 h-8 text-center text-sm font-semibold bg-white/10 border-white/20 focus:border-white/40"
                              min="1"
                              max="99"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide">Name</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => updatePlayer(i + 18, "name", e.target.value)}
                              placeholder="Player name"
                              className="input w-full h-8 text-sm bg-white/10 border-white/20 focus:border-white/40"
                            />
                          </div>
                          <button 
                            className="btn btn-ghost text-xs px-2 py-1 hover:bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                            onClick={() => deletePlayer(i + 18)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      className="rounded-lg border-2 border-dashed border-white/30 p-3 hover:border-white/50 hover:bg-white/5 transition-all duration-200 flex items-center justify-center text-white/60 hover:text-white/80"
                      onClick={addPlayer}
                      disabled={players.length >= 60}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  </div>
                </div>
              )}
              
              {players.length === 0 && (
                <div className="text-center py-12 text-white/50">
                  <p className="text-lg mb-2">No players added yet</p>
                  <p className="text-sm mb-4">Click "Add Player" to start building your squad</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={addPlayer} 
                    disabled={players.length >= 60}
                  >
                    + Add First Player
                  </button>
                </div>
              )}
            </div>
            
            {/* Bottom Actions */}
            <div className="flex items-center justify-center pt-6">
              <button 
                className="btn btn-primary text-lg px-8 py-3" 
                onClick={save} 
                disabled={saving}
              >
                {saving ? "Saving..." : `Save "${currentSet}" Squad`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}