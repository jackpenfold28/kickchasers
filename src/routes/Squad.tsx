import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

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
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [venue, setVenue] = useState("");
  const [opponent, setOpponent] = useState("");
  const [gameTime, setGameTime] = useState("");
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
    // Create 22 default player spots for AFL team size
    const defaultPlayers = Array.from({ length: 22 }, (_, i) => ({
      number: i + 1,
      name: ""
    }));
    setPlayers(defaultPlayers);
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

    // Basic validation - only save players with actual names
    const cleaned = players
      .filter((p) => p.name && p.name.trim().length > 0 && Number.isFinite(p.number) && p.number > 0)
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

  const openSharingModal = () => {
    setSelectedPlayers([]);
    setVenue("");
    setOpponent("");
    setGameTime("");
    setShowSharingModal(true);
  };

  const togglePlayerSelection = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.number === player.number);
      if (isSelected) {
        return prev.filter(p => p.number !== player.number);
      } else if (prev.length < 25) {
        return [...prev, player];
      }
      return prev;
    });
  };

  const generateLineupImage = async () => {
    if (selectedPlayers.length === 0) {
      alert("Please select at least one player for the lineup.");
      return;
    }

    try {
      // Create a temporary element for the lineup
      const lineupElement = document.createElement('div');
      lineupElement.style.position = 'absolute';
      lineupElement.style.left = '-9999px';
      lineupElement.style.top = '-9999px';
      lineupElement.style.width = '600px';
      lineupElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)';
      lineupElement.style.color = 'white';
      lineupElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      lineupElement.style.padding = '40px';
      lineupElement.style.borderRadius = '20px';

      lineupElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 10px 0;">AFL LINEUP</h1>
          <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">${currentSet.toUpperCase()}</h2>
          ${opponent ? `<p style="font-size: 18px; margin: 5px 0;">vs ${opponent}</p>` : ''}
          ${venue ? `<p style="font-size: 16px; margin: 5px 0;">@ ${venue}</p>` : ''}
          ${gameTime ? `<p style="font-size: 16px; margin: 5px 0;">${gameTime}</p>` : ''}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          ${selectedPlayers.sort((a, b) => a.number - b.number).map(player => `
            <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 15px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">#${player.number}</div>
              <div style="font-size: 14px; font-weight: 500;">${player.name || 'Player ' + player.number}</div>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 14px; opacity: 0.7;">
          Generated with AFL Stats App
        </div>
      `;

      document.body.appendChild(lineupElement);

      // Generate the image
      const canvas = await html2canvas(lineupElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      document.body.removeChild(lineupElement);

      // Download the image
      const link = document.createElement('a');
      link.download = `${currentSet.toLowerCase().replace(/\s+/g, '-')}-lineup.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setShowSharingModal(false);
    } catch (error) {
      console.error('Error generating lineup image:', error);
      alert('Failed to generate lineup image. Please try again.');
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
                  className="btn btn-secondary" 
                  onClick={openSharingModal}
                  disabled={players.filter(p => p.name.trim()).length === 0}
                >
                  Share Lineup
                </button>
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
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NAME</label>
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
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NAME</label>
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

              {/* Defence Section */}
              {players.length > 12 && (
                <div>
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-white mb-2">DEFENCE</h4>
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
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NAME</label>
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
                            <label className="text-[10px] text-white/50 block mb-1 uppercase tracking-wide text-center">NAME</label>
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

      {/* Social Media Sharing Modal */}
      {showSharingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Share Team Lineup</h3>
              <button
                className="btn btn-ghost"
                onClick={() => setShowSharingModal(false)}
              >
                ×
              </button>
            </div>

            {/* Game Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., MCG, Optus Stadium"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Opponent</label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="e.g., Richmond Tigers"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Game Time</label>
                <input
                  type="text"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  placeholder="e.g., Saturday 2:30pm"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Player Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-white">Select Players ({selectedPlayers.length}/25)</h4>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedPlayers([])}
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.filter(p => p.name.trim()).map((player, i) => {
                  const isSelected = selectedPlayers.some(p => p.number === player.number);
                  const canSelect = selectedPlayers.length < 25 || isSelected;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => togglePlayerSelection(player)}
                      disabled={!canSelect}
                      className={`p-3 rounded-lg border transition-all duration-200 text-left
                        ${isSelected 
                          ? 'bg-blue-600/30 border-blue-400/50 text-white' 
                          : canSelect
                            ? 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                            : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="font-semibold">#{player.number}</div>
                      <div className="text-sm truncate">{player.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                Select up to 25 players to include in your lineup image
              </p>
              <div className="flex items-center gap-3">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSharingModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={generateLineupImage}
                  disabled={selectedPlayers.length === 0}
                >
                  Generate & Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}