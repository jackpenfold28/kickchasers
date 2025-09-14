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
  const [teamColors, setTeamColors] = useState({ primary: "#1e3a8a", secondary: "#3b82f6", accent: "#ffffff" });
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
    setTeamColors({ primary: "#1e3a8a", secondary: "#3b82f6", accent: "#ffffff" });
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
      // Organize players by their position in the squad (based on array index, not jersey number)
      const sortedPlayers = [...selectedPlayers].sort((a, b) => a.number - b.number);
      
      // Map selected players to their position based on where they appear in the players array
      const forwards = selectedPlayers.filter(player => {
        const index = players.findIndex(p => p.number === player.number);
        return index >= 0 && index <= 5;
      });
      const midfield = selectedPlayers.filter(player => {
        const index = players.findIndex(p => p.number === player.number);
        return index >= 6 && index <= 11;
      });
      const defence = selectedPlayers.filter(player => {
        const index = players.findIndex(p => p.number === player.number);
        return index >= 12 && index <= 17;
      });
      const interchange = selectedPlayers.filter(player => {
        const index = players.findIndex(p => p.number === player.number);
        return index >= 18;
      });

      const createPositionSection = (title: string, players: Player[], shortCode: string) => {
        if (players.length === 0) return '';
        // Sort players within each position by number
        const sortedPositionPlayers = players.sort((a, b) => a.number - b.number);
        return `
          <div style="margin-bottom: 25px;">
            <div style="background: linear-gradient(90deg, ${teamColors.secondary}40 0%, ${teamColors.primary}60 50%, ${teamColors.secondary}40 100%); padding: 8px 0; margin-bottom: 12px; border-radius: 4px;">
              <h3 style="color: ${teamColors.accent}; font-size: 14px; font-weight: bold; text-align: center; letter-spacing: 3px; margin: 0;">${title}</h3>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
              ${sortedPositionPlayers.map(player => `
                <div style="background: ${teamColors.primary}; border-left: 4px solid ${teamColors.secondary}; padding: 6px 12px; min-width: 140px; text-align: left;">
                  <div style="color: ${teamColors.secondary}; font-size: 10px; font-weight: bold; margin-bottom: 1px;">${shortCode}:</div>
                  <div style="color: ${teamColors.accent}; font-size: 16px; font-weight: bold;">${player.number}. ${(player.name || 'Player ' + player.number).toUpperCase()}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      };

      // Create a temporary element for the lineup
      const lineupElement = document.createElement('div');
      lineupElement.style.position = 'absolute';
      lineupElement.style.left = '-9999px';
      lineupElement.style.top = '-9999px';
      lineupElement.style.width = '650px';
      lineupElement.style.background = `linear-gradient(135deg, ${teamColors.primary} 0%, #1a1a2e 50%, ${teamColors.primary} 100%)`;
      lineupElement.style.color = teamColors.accent;
      lineupElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      lineupElement.style.padding = '30px';
      lineupElement.style.borderRadius = '15px';
      lineupElement.style.border = `3px solid ${teamColors.secondary}`;

      lineupElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; position: relative;">
          <div style="background: linear-gradient(45deg, ${teamColors.primary} 0%, ${teamColors.secondary} 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid ${teamColors.secondary};">
            <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 10px 0; color: ${teamColors.accent}; letter-spacing: 4px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">SELECTION</h1>
            <div style="width: 100px; height: 4px; background: ${teamColors.accent}; margin: 0 auto 15px auto; border-radius: 2px;"></div>
            <h2 style="font-size: 24px; font-weight: 600; margin: 0; color: ${teamColors.accent}; text-transform: uppercase;">${currentSet}</h2>
          </div>
          <div style="background: ${teamColors.primary}80; padding: 15px; border-radius: 8px; border: 1px solid ${teamColors.secondary}40;">
            ${opponent ? `<p style="font-size: 16px; margin: 5px 0; color: ${teamColors.accent}; font-weight: bold;">vs ${opponent.toUpperCase()}</p>` : ''}
            ${venue ? `<p style="font-size: 14px; margin: 3px 0; color: ${teamColors.accent};">@ ${venue}</p>` : ''}
            ${gameTime ? `<p style="font-size: 14px; margin: 3px 0; color: ${teamColors.accent};">${gameTime}</p>` : ''}
          </div>
        </div>
        
        ${createPositionSection('FORWARDS', forwards, 'F')}
        ${createPositionSection('MIDFIELD', midfield, 'M')}
        ${createPositionSection('DEFENCE', defence, 'D')}
        ${createPositionSection('INTERCHANGE', interchange, 'INT')}
        
        <div style="text-align: center; margin-top: 20px; font-size: 11px; opacity: 0.7; color: ${teamColors.accent};">
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
      link.download = `${currentSet.toLowerCase().replace(/\s+/g, '-')}-selection.png`;
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

            {/* Team Colors */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-4">Team Colors</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={teamColors.primary}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, primary: e.target.value }))}
                      className="w-12 h-10 rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={teamColors.primary}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, primary: e.target.value }))}
                      className="input flex-1 text-sm"
                      placeholder="#1e3a8a"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={teamColors.secondary}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, secondary: e.target.value }))}
                      className="w-12 h-10 rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={teamColors.secondary}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, secondary: e.target.value }))}
                      className="input flex-1 text-sm"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={teamColors.accent}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, accent: e.target.value }))}
                      className="w-12 h-10 rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={teamColors.accent}
                      onChange={(e) => setTeamColors(prev => ({ ...prev, accent: e.target.value }))}
                      className="input flex-1 text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preset Color Schemes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-white/70 mb-2">Quick Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTeamColors({ primary: "#000080", secondary: "#FFD700", accent: "#FFFFFF" })}
                    className="px-3 py-1 rounded text-xs bg-blue-900 text-yellow-300 border border-yellow-400/30 hover:bg-blue-800"
                  >
                    West Coast
                  </button>
                  <button
                    onClick={() => setTeamColors({ primary: "#8B0000", secondary: "#FFD700", accent: "#FFFFFF" })}
                    className="px-3 py-1 rounded text-xs bg-red-900 text-yellow-300 border border-yellow-400/30 hover:bg-red-800"
                  >
                    Adelaide
                  </button>
                  <button
                    onClick={() => setTeamColors({ primary: "#000000", secondary: "#FFFF00", accent: "#FFFFFF" })}
                    className="px-3 py-1 rounded text-xs bg-black text-yellow-300 border border-yellow-400/30 hover:bg-gray-900"
                  >
                    Richmond
                  </button>
                  <button
                    onClick={() => setTeamColors({ primary: "#000080", secondary: "#FFFFFF", accent: "#FFFFFF" })}
                    className="px-3 py-1 rounded text-xs bg-blue-900 text-white border border-white/30 hover:bg-blue-800"
                  >
                    Carlton
                  </button>
                  <button
                    onClick={() => setTeamColors({ primary: "#8B4513", secondary: "#FFD700", accent: "#FFFFFF" })}
                    className="px-3 py-1 rounded text-xs bg-amber-800 text-yellow-300 border border-yellow-400/30 hover:bg-amber-700"
                  >
                    Hawthorn
                  </button>
                </div>
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