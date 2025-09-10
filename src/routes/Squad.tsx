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
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">Your Squads</h1>
        <button
          className="btn border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => nav('/hub')}
        >
          ← Back to Hub
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <label className="text-sm opacity-80">Active squad</label>
        <div className="relative">
          <select
            className="input appearance-none py-2 pl-3 pr-10 rounded-md bg-white/10 border border-white/15 hover:bg-white/[0.15] focus:outline-none focus:ring-2 focus:ring-rose-500/60 focus:border-rose-500/50 transition w-56"
            value={currentSet}
            onChange={(e) => setCurrentSet(e.target.value)}
          >
            {sets.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {/* chevron icon */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.17l-4.24 3.36a.75.75 0 0 1-.94 0L5.25 8.4a.75.75 0 0 1-.02-1.19z" />
          </svg>
        </div>
        <button className="btn" onClick={createSet} disabled={!canAddMoreSets}>
          + New
        </button>
        <button className="btn" onClick={renameSet}>Rename</button>
        <button className="btn hover:bg-red-600/70" onClick={deleteSet}>Delete</button>
        <span className="ml-auto text-xs opacity-70">{sets.length}/5 squads</span>
      </div>

      {loading && <div>Loading…</div>}

      {errorMsg && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{errorMsg}</p>
            <button className="btn" onClick={() => setErrorMsg(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {savedAt && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-200 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Squad "{currentSet}" saved</p>
            <p className="text-xs opacity-80">{savedAt.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => nav('/hub')}
            >
              Go to Hub
            </button>
            <button
              className="btn"
              onClick={() => setSavedAt(null)}
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <p className="text-xs opacity-70 mb-2">Up to 60 players.</p>
          {players.map((p, i) => (
            <div key={i} className="flex gap-3 items-center mb-2">
              <input
                type="number"
                value={p.number}
                onChange={(e) => {
                  const val = parseInt(e.target.value || "0", 10);
                  updatePlayer(i, "number", Number.isFinite(val) ? val : 0);
                }}
                className="input w-24 py-2 px-3"
              />
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePlayer(i, "name", e.target.value)}
                placeholder="Player name"
                className="input flex-1 py-2 px-3"
              />
              <button className="btn hover:bg-red-600/60" onClick={() => deletePlayer(i)}>
                Delete
              </button>
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <button className="btn" onClick={addPlayer} disabled={players.length >= 60}>
              + Add Player
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : `Save "${currentSet}"`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}