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
  const [selectedPlayers, setSelectedPlayers] = useState<{player: Player, position: 'FWD' | 'MID' | 'DEF' | 'INT'}[]>([]);
  const [venue, setVenue] = useState("");
  const [opponent, setOpponent] = useState("");
  const [gameTime, setGameTime] = useState("");
  const [exportFormat, setExportFormat] = useState<'square' | 'widescreen'>('square');
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

  const openSharingModal = (format: 'square' | 'widescreen' = 'square') => {
    // Don't clear selectedPlayers - keep the user's selection for export
    setVenue("");
    setOpponent("");
    setGameTime("");
    setExportFormat(format);
    setTeamColors({ primary: "#1e3a8a", secondary: "#3b82f6", accent: "#ffffff" });
    setShowSharingModal(true);
  };

  const addPlayerToPosition = (player: Player, position: 'FWD' | 'MID' | 'DEF' | 'INT') => {
    setSelectedPlayers(prev => {
      // Remove player if already selected
      const filtered = prev.filter(p => p.player.number !== player.number);
      
      // Check position limits: FWD(6), MID(6), DEF(6), INT(4)
      const positionLimits = { FWD: 6, MID: 6, DEF: 6, INT: 4 };
      const positionCounts = {
        FWD: filtered.filter(p => p.position === 'FWD').length,
        MID: filtered.filter(p => p.position === 'MID').length,
        DEF: filtered.filter(p => p.position === 'DEF').length,
        INT: filtered.filter(p => p.position === 'INT').length,
      };
      
      // Check if position is full or overall limit reached
      if (filtered.length >= 25 || positionCounts[position] >= positionLimits[position]) {
        return prev; // Don't add if limits exceeded
      }
      
      return [...filtered, { player, position }];
    });
  };

  const removePlayerFromSelection = (player: Player) => {
    setSelectedPlayers(prev => prev.filter(p => p.player.number !== player.number));
  };

  const isPlayerSelected = (player: Player) => {
    return selectedPlayers.some(p => p.player.number === player.number);
  };

  const getPlayerPosition = (player: Player) => {
    const selected = selectedPlayers.find(p => p.player.number === player.number);
    return selected?.position;
  };

  const generateLineupImage = async (format: 'square' | 'widescreen' = 'square') => {
    if (selectedPlayers.length === 0) {
      alert("Please select at least one player for the lineup.");
      return;
    }

    // Check position distribution and warn about empty positions
    const positionCounts = {
      FWD: selectedPlayers.filter(p => p.position === 'FWD').length,
      MID: selectedPlayers.filter(p => p.position === 'MID').length,
      DEF: selectedPlayers.filter(p => p.position === 'DEF').length,
      INT: selectedPlayers.filter(p => p.position === 'INT').length,
    };
    
    const emptyPositions = [];
    if (positionCounts.FWD === 0) emptyPositions.push('Forwards');
    if (positionCounts.MID === 0) emptyPositions.push('Midfield');
    if (positionCounts.DEF === 0) emptyPositions.push('Defence');
    if (positionCounts.INT === 0) emptyPositions.push('Interchange');
    
    if (emptyPositions.length > 0) {
      const message = `The following positions are empty: ${emptyPositions.join(', ')}. Continue generating the lineup anyway?`;
      if (!confirm(message)) {
        return;
      }
    }

    try {
      // Map players to AFL field positions
      const forwards = selectedPlayers.filter(p => p.position === 'FWD').map(p => p.player);
      const midfield = selectedPlayers.filter(p => p.position === 'MID').map(p => p.player);
      const defence = selectedPlayers.filter(p => p.position === 'DEF').map(p => p.player);
      const interchange = selectedPlayers.filter(p => p.position === 'INT').map(p => p.player);

      // AFL field positions mapping to match Adelaide Crows reference
      const fieldPositions = {
        // Forward line - top arc
        FF: forwards[0] || null,      // Full Forward (center top)
        LFP: forwards[1] || null,     // Left Forward Pocket  
        RFP: forwards[2] || null,     // Right Forward Pocket
        CHF: forwards[3] || null,     // Centre Half Forward
        LHF: forwards[4] || null,     // Left Half Forward
        RHF: forwards[5] || null,     // Right Half Forward
        
        // Midfield - center area
        LW: midfield[0] || null,      // Left Wing
        C: midfield[1] || null,       // Centre
        RW: midfield[2] || null,      // Right Wing
        
        // Defense line - bottom arc  
        CHB: defence[0] || null,      // Centre Half Back
        LHB: defence[1] || null,      // Left Half Back
        RHB: defence[2] || null,      // Right Half Back
        FB: defence[3] || null,       // Full Back (center bottom)
        LBP: defence[4] || null,      // Left Back Pocket
        RBP: defence[5] || null,      // Right Back Pocket
        
        // Followers (ruck/rovers) - separate section
        FOLLOWERS: midfield.slice(3) || [],
        
        // Interchange
        INTERCHANGE: interchange || [],
      };

      // Sanitize function for XSS prevention
      const sanitize = (str: string) => str.replace(/[<>&"']/g, (char) => {
        const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return map[char] || char;
      });

      // Create player box component with accurate Adelaide Crows styling
      const createPlayerBox = (player: Player | null, position: string, widthPercent = '8%', heightPx = 30) => {
        if (!player) {
          return `<div style="width: ${widthPercent}; height: ${heightPx}px; background: rgba(247,196,0,0.2); border: 2px dashed rgba(247,196,0,0.4); border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: rgba(247,196,0,0.6); font-weight: 900; letter-spacing: 0.5px;">${position}</div>`;
        }

        const playerName = sanitize((player.name || 'Player ' + player.number).split(' ').pop() || '').toUpperCase();
        
        return `
          <div style="width: ${widthPercent}; height: ${heightPx}px; background: #F7C400; border: 2px solid #E6B800; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: black; font-weight: 900; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); font-family: 'Oswald', Impact, 'Arial Black', Arial, sans-serif; letter-spacing: 0.3px; font-stretch: condensed;">
            <div style="display: flex; align-items: center; gap: 2px;">
              <span style="font-size: 14px; font-weight: 900;">${player.number}.</span>
              <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">${playerName}</span>
            </div>
          </div>
        `;
      };

      // Create followers list component
      const createFollowersList = (followers: Player[]) => {
        if (followers.length === 0) return '';
        return `
          <div style="background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px; margin: 20px;">
            <h4 style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">FOLLOWERS</h4>
            ${followers.map((player, index) => `
              <div style="color: white; font-size: 12px; margin: 3px 0; font-weight: bold;">
                ${player.number}. ${sanitize((player.name || 'Player ' + player.number).split(' ').pop() || '').toUpperCase()}
              </div>
            `).join('')}
          </div>
        `;
      };

      // Create interchange list component  
      const createInterchangeList = (interchange: Player[]) => {
        if (interchange.length === 0) return '';
        return `
          <div style="background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px; margin: 20px;">
            <h4 style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">INTER. FROM</h4>
            ${interchange.map((player, index) => `
              <div style="color: white; font-size: 12px; margin: 3px 0; font-weight: bold;">
                ${player.number}. ${sanitize((player.name || 'Player ' + player.number).split(' ').pop() || '').toUpperCase()}
              </div>
            `).join('')}
          </div>
        `;
      };

      // Set dimensions based on format
      const dimensions = format === 'square' ? { width: 1080, height: 1080 } : { width: 1920, height: 1080 };
      
      // Create a temporary element for the AFL field
      const lineupElement = document.createElement('div');
      lineupElement.style.position = 'absolute';
      lineupElement.style.left = '-9999px';
      lineupElement.style.top = '-9999px';
      lineupElement.style.width = `${dimensions.width}px`;
      lineupElement.style.height = `${dimensions.height}px`;
      lineupElement.style.background = `
        linear-gradient(135deg, #001F3F 0%, #002B5C 50%, #001122 100%),
        linear-gradient(90deg, transparent 48%, rgba(227,24,55,0.15) 50%, transparent 52%),
        radial-gradient(circle at 70% 30%, rgba(247,196,0,0.1) 0%, transparent 50%)
      `;
      lineupElement.style.backgroundSize = '100% 100%, 100px 100px, 400px 400px';
      lineupElement.style.color = 'white';
      // Load condensed webfont for reliable rendering (avoid duplicates)
      if (!document.querySelector('link[href*="Oswald"]')) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      
      lineupElement.style.fontFamily = '"Oswald", Impact, "Arial Black", Arial, sans-serif';
      lineupElement.style.overflow = 'hidden';

      const safeOpponent = opponent ? sanitize(opponent) : '';
      const safeVenue = venue ? sanitize(venue) : '';
      const safeGameTime = gameTime ? sanitize(gameTime) : '';
      const safeCurrentSet = sanitize(currentSet);

      lineupElement.innerHTML = `
        <!-- Header matching Adelaide Crows reference -->
        <div style="position: relative; height: 120px; display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; background: linear-gradient(135deg, #001F3F 0%, #002B5C 100%);">
          <!-- Team Logo -->
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #001F3F;">LOGO</div>
          </div>
          
          <!-- Team Selection Title -->
          <div style="text-align: right;">
            <h1 style="font-size: 52px; font-weight: 900; margin: 0; color: #F7C400; text-shadow: 3px 3px 6px rgba(0,0,0,0.8); letter-spacing: 3px; font-family: 'Oswald', Impact, 'Arial Black', Arial, sans-serif; font-stretch: condensed;">TEAM</h1>
            <h1 style="font-size: 52px; font-weight: 900; margin: -12px 0 0 0; color: #F7C400; text-shadow: 3px 3px 6px rgba(0,0,0,0.8); letter-spacing: 3px; font-family: 'Oswald', Impact, 'Arial Black', Arial, sans-serif; font-stretch: condensed;">SELECTION</h1>
            <div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 8px; font-weight: bold; letter-spacing: 1px;">BROUGHT TO YOU BY</div>
          </div>
          
          <!-- Sponsor Logo Placeholder -->
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.9); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #001F3F;">SPONSOR</div>
        </div>

        <!-- Main Content Area -->
        <div style="position: relative; height: ${dimensions.height - 120}px; display: flex;">
          
          <!-- Left Section - Followers -->
          <div style="width: 200px; padding: 30px 20px;">
            ${createFollowersList(fieldPositions.FOLLOWERS)}
          </div>

          <!-- Center Section - AFL Field -->
          <div style="flex: 1; position: relative; padding: 20px;">
            
            <!-- AFL Oval with proper proportions -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70%; height: 85%; border: 4px solid white; border-radius: 50%; background: rgba(255,255,255,0.02);"></div>
            
            <!-- Center Circle (AFL Standard Size) -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6%; height: 7%; border: 3px solid white; border-radius: 50%; background: transparent;"></div>
            
            <!-- Inner Center Circle -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 2.5%; height: 3%; border: 2px solid white; border-radius: 50%; background: transparent;"></div>
            
            <!-- 50m Arc (Top Goal End) -->
            <div style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); width: 40%; height: 20%; border: 2px solid rgba(255,255,255,0.4); border-radius: 50% 50% 50% 50%; background: transparent; clip-path: polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%);"></div>
            
            <!-- 50m Arc (Bottom Goal End) -->
            <div style="position: absolute; bottom: 15%; left: 50%; transform: translateX(-50%); width: 40%; height: 20%; border: 2px solid rgba(255,255,255,0.4); border-radius: 50% 50% 50% 50%; background: transparent; clip-path: polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%);"></div>
            
            <!-- Goal Squares (Top) -->
            <div style="position: absolute; top: 8%; left: 50%; transform: translateX(-50%); width: 15%; height: 8%; border: 3px solid white; background: transparent;"></div>
            
            <!-- Goal Squares (Bottom) -->
            <div style="position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%); width: 15%; height: 8%; border: 3px solid white; background: transparent;"></div>
            
            <!-- Goal Posts (Top) - 2 tall goal posts, 2 shorter behind posts -->
            <div style="position: absolute; top: 2%; left: 50%; transform: translateX(-50%); display: flex; gap: 15px;">
              <div style="width: 5px; height: 25px; background: white;"></div>
              <div style="width: 5px; height: 60px; background: white;"></div>
              <div style="width: 5px; height: 60px; background: white;"></div>
              <div style="width: 5px; height: 25px; background: white;"></div>
            </div>
            
            <!-- Goal Posts (Bottom) - 2 tall goal posts, 2 shorter behind posts -->
            <div style="position: absolute; bottom: 2%; left: 50%; transform: translateX(-50%); display: flex; gap: 15px;">
              <div style="width: 5px; height: 25px; background: white;"></div>
              <div style="width: 5px; height: 60px; background: white;"></div>
              <div style="width: 5px; height: 60px; background: white;"></div>
              <div style="width: 5px; height: 25px; background: white;"></div>
            </div>
            
            <!-- Center Square (Perfect Square) -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 10%; height: 10%; border: 3px solid white; background: transparent;"></div>

            <!-- Forward Line (Top) -->
            <div style="position: absolute; top: 12%; left: 50%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.FF, 'FF', '10%', 35)}
            </div>
            <div style="position: absolute; top: 14%; left: 30%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.LFP, 'LFP', '8%', 30)}
            </div>
            <div style="position: absolute; top: 14%; right: 30%; transform: translateX(50%);">
              ${createPlayerBox(fieldPositions.RFP, 'RFP', '8%', 30)}
            </div>
            
            <!-- Half Forward Line -->
            <div style="position: absolute; top: 28%; left: 50%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.CHF, 'CHF', '10%', 35)}
            </div>
            <div style="position: absolute; top: 30%; left: 20%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.LHF, 'LHF', '8%', 30)}
            </div>
            <div style="position: absolute; top: 30%; right: 20%; transform: translateX(50%);">
              ${createPlayerBox(fieldPositions.RHF, 'RHF', '8%', 30)}
            </div>

            <!-- Center Line -->
            <div style="position: absolute; top: 50%; left: 15%; transform: translate(-50%, -50%);">
              ${createPlayerBox(fieldPositions.LW, 'LW', '8%', 30)}
            </div>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
              ${createPlayerBox(fieldPositions.C, 'C', '8%', 30)}
            </div>
            <div style="position: absolute; top: 50%; right: 15%; transform: translate(50%, -50%);">
              ${createPlayerBox(fieldPositions.RW, 'RW', '8%', 30)}
            </div>

            <!-- Half Back Line -->
            <div style="position: absolute; bottom: 30%; left: 50%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.CHB, 'CHB', '10%', 35)}
            </div>
            <div style="position: absolute; bottom: 28%; left: 20%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.LHB, 'LHB', '8%', 30)}
            </div>
            <div style="position: absolute; bottom: 28%; right: 20%; transform: translateX(50%);">
              ${createPlayerBox(fieldPositions.RHB, 'RHB', '8%', 30)}
            </div>

            <!-- Back Line -->
            <div style="position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.FB, 'FB', '10%', 35)}
            </div>
            <div style="position: absolute; bottom: 14%; left: 30%; transform: translateX(-50%);">
              ${createPlayerBox(fieldPositions.LBP, 'LBP', '8%', 30)}
            </div>
            <div style="position: absolute; bottom: 14%; right: 30%; transform: translateX(50%);">
              ${createPlayerBox(fieldPositions.RBP, 'RBP', '8%', 30)}
            </div>
          </div>

          <!-- Right Section - Interchange -->
          <div style="width: 200px; padding: 30px 20px;">
            ${createInterchangeList(fieldPositions.INTERCHANGE)}
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 10px; right: 20px; font-size: 10px; color: rgba(255,255,255,0.5);">
          Generated with AFL Stats App
        </div>
      `;

      document.body.appendChild(lineupElement);

      // Wait for fonts to load before capture
      await document.fonts.ready;
      
      // Generate the image
      const canvas = await html2canvas(lineupElement, {
        backgroundColor: null,
        scale: 1,
        logging: false,
        useCORS: true,
        width: dimensions.width,
        height: dimensions.height
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
                <div className="flex gap-2">
                  <button 
                    className="btn btn-secondary" 
                    onClick={(e) => {
                      e.preventDefault();
                      openSharingModal('square');
                    }}
                    disabled={players.filter(p => p.name.trim()).length === 0}
                  >
                    📱 Square Export
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={(e) => {
                      e.preventDefault();
                      openSharingModal('widescreen');
                    }}
                    disabled={players.filter(p => p.name.trim()).length === 0}
                  >
                    🖥️ Widescreen Export
                  </button>
                </div>
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
                <div>
                  <h4 className="text-lg font-medium text-white">Select Players ({selectedPlayers.length}/25)</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/70">
                    <span>FWD: {selectedPlayers.filter(p => p.position === 'FWD').length}/6</span>
                    <span>MID: {selectedPlayers.filter(p => p.position === 'MID').length}/6</span>
                    <span>DEF: {selectedPlayers.filter(p => p.position === 'DEF').length}/6</span>
                    <span>INT: {selectedPlayers.filter(p => p.position === 'INT').length}/4</span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedPlayers([])}
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-2">
                {players.filter(p => p.name.trim()).map((player, i) => {
                  const isSelected = isPlayerSelected(player);
                  const selectedPosition = getPlayerPosition(player);
                  
                  // Position limits: FWD(6), MID(6), DEF(6), INT(4)
                  const positionLimits = { FWD: 6, MID: 6, DEF: 6, INT: 4 };
                  const positionCounts = {
                    FWD: selectedPlayers.filter(p => p.position === 'FWD').length,
                    MID: selectedPlayers.filter(p => p.position === 'MID').length,
                    DEF: selectedPlayers.filter(p => p.position === 'DEF').length,
                    INT: selectedPlayers.filter(p => p.position === 'INT').length,
                  };
                  
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-between
                        ${isSelected 
                          ? 'bg-blue-600/30 border-blue-400/50' 
                          : 'bg-white/5 border-white/20'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-white">
                          <div className="font-semibold">#{player.number}</div>
                          <div className="text-sm">{player.name}</div>
                        </div>
                        {isSelected && (
                          <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            {selectedPosition}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {(['FWD', 'MID', 'DEF', 'INT'] as const).map(position => {
                          const positionFull = positionCounts[position] >= positionLimits[position];
                          const isDisabled = (selectedPlayers.length >= 25 && !isSelected) || (positionFull && selectedPosition !== position);
                          
                          return (
                            <button
                              key={position}
                              onClick={() => {
                                if (selectedPosition === position) {
                                  removePlayerFromSelection(player);
                                } else if (!isDisabled) {
                                  addPlayerToPosition(player, position);
                                }
                              }}
                              disabled={isDisabled}
                              className={`px-2 py-1 text-xs rounded transition-all duration-200 relative
                                ${selectedPosition === position 
                                  ? 'bg-blue-500 text-white font-semibold' 
                                  : isDisabled
                                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }
                              `}
                              title={`${position} (${positionCounts[position]}/${positionLimits[position]})`}
                            >
                              {position}
                              <span className="ml-1 text-xs opacity-60">
                                {positionCounts[position]}/{positionLimits[position]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
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
                  onClick={(e) => {
                    e.preventDefault();
                    generateLineupImage(exportFormat);
                  }}
                  disabled={selectedPlayers.length === 0}
                >
                  Generate & Download {exportFormat === 'square' ? '(1080x1080)' : '(1920x1080)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}