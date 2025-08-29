// src/routes/Summary.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { STAT_DEFS, StatKey } from '@/types';
import TeamCompare from '@/components/TeamCompare';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

type GP = { team_side:'home'|'away'; number:number; name:string };
type Evt = { id:string; game_id:string; team_side:'home'|'away'; quarter:number; player_number:number; stat_key:StatKey };

type Row = {
  num: number;
  name: string;
  // Kick & Handball (with effectiveness splits)
  K: number; KEF: number; KIF: number;
  H: number; HEF: number; HIF: number;
  D: number;
  // Other primary stats
  M: number; MC: number; MUC: number; T: number; CON: number; UC: number;
  // The rest
  G: number; B: number; FF: number; FA: number; CL: number; I50: number; R50: number; GBG: number; HO: number;
  AF: number;
};

const AF_WEIGHTS: Record<string, number> = {
  K: 3,
  H: 2,
  M: 3,
  T: 4,
  G: 6,
  B: 1,
  FF: 1,
  FA: -3,
  CL: 3,
  I50: 0,
  R50: 0,
};

export default function Summary() {
  const { gameId } = useParams();
  const [players, setPlayers] = useState<GP[]>([]);
  const [events, setEvents] = useState<Evt[]>([]);

  const [sideView, setSideView] = useState<'home'|'away'>('home');
  const [segment, setSegment] = useState<0|1|2|3|4>(0); // 0 = Total, 1..4 = Q1..Q4
  const [view, setView] = useState<'players'|'compare'>('players');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [homeTeamLogo, setHomeTeamLogo] = useState<string | null>(null);
  const [awayTeamLogo, setAwayTeamLogo] = useState<string | null>(null);
  const [homeTeamName, setHomeTeamName] = useState<string>('Home');
  const [awayTeamName, setAwayTeamName] = useState<string>('Away');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: pl, error: pe } = await supabase
        .from('game_players')
        .select('team_side, number, name')
        .eq('game_id', gameId)
        .order('team_side')
        .order('number');
      if (!pe && pl) setPlayers(pl as GP[]);
    })();
    (async () => {
      const { data: ev, error: ee } = await supabase
        .from('events')
        .select('id, game_id, team_side, quarter, player_number, stat_key')
        .eq('game_id', gameId);
      if (!ee && ev) setEvents(ev as Evt[]);
    })();
    (async () => {
      try {
        // Who is logged in?
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id || null;

        // Game details
        const { data: g } = await supabase
          .from('games')
          .select('home_team_id, opponent, opponent_logo_path')
          .eq('id', gameId)
          .single();

        if (g?.opponent_logo_path) setAwayTeamLogo(g.opponent_logo_path as string);
        if (g?.opponent) setAwayTeamName(g.opponent as string);

        // Home team details (name + owner)
        let homeOwner: string | null = null;
        if (g?.home_team_id) {
          const { data: ht } = await supabase
            .from('teams')
            .select('name, owner_user_id')
            .eq('id', g.home_team_id as string)
            .single();
          if (ht?.name) setHomeTeamName(ht.name as string);
          // @ts-ignore allow owner_user_id access
          if (ht?.owner_user_id) homeOwner = ht.owner_user_id as string;
        }

        // Permission check
        if (uid && homeOwner) setIsOwner(uid === homeOwner);

        // Try to fetch the current user's profile logo (home)
        if (uid) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('team_logo_path')
            .eq('user_id', uid)
            .single();
          if (prof?.team_logo_path) setHomeTeamLogo(prof.team_logo_path as string);
        }
      } catch (e) {
        // ignore errors in summary view
      }
    })();
  }, [gameId]);

  const filteredEvents = useMemo(() => (
    segment === 0 ? events : events.filter(e => e.quarter === segment)
  ), [events, segment]);

  const bySide = useMemo(() => {
    const home = players.filter(p => p.team_side === 'home');
    const away = players.filter(p => p.team_side === 'away');

    const makeRows = (ps: GP[], side: 'home' | 'away'): Row[] => {
      // seed with zeros so players show even with no stats
      const seed: Row[] = ps.map(p => ({
        num: p.number, name: p.name || '',
        K:0, KEF:0, KIF:0,
        H:0, HEF:0, HIF:0,
        D:0,
        M:0, MC:0, MUC:0, T:0, CON:0, UC:0,
        G:0, B:0, FF:0, FA:0, CL:0, I50:0, R50:0, GBG:0, HO:0,
        AF:0
      }));

      const map = new Map<number, Row>(seed.map(r => [r.num, r]));

      for (const e of filteredEvents) {
        if (e.team_side !== side) continue;
        if (!ps.some(p => p.number === e.player_number)) continue;
        const row = map.get(e.player_number);
        if (!row) continue;
        switch (e.stat_key) {
          case 'K': row.K += 1; break;
          case 'K_EF': row.KEF += 1; break;
          case 'K_IF': row.KIF += 1; break;
          case 'HB': row.H += 1; break;
          case 'HB_EF': row.HEF += 1; break;
          case 'HB_IF': row.HIF += 1; break;
          case 'M': row.M += 1; break;
          case 'MC': row.MC += 1; break;
          case 'MUC': row.MUC += 1; break;
          case 'T': row.T += 1; break;
          case 'CON': row.CON += 1; break;
          case 'UC': row.UC += 1; break;
          case 'G': row.G += 1; break;
          case 'B': row.B += 1; break;
          case 'FF': row.FF += 1; break;
          case 'FA': row.FA += 1; break;
          case 'CL': row.CL += 1; break;
          case 'I50': row.I50 += 1; break;
          case 'R50': row.R50 += 1; break;
          case 'GBG': row.GBG += 1; break;
          case 'HO': row.HO += 1; break;
          default: break; // ignore other advanced or unknown keys here
        }
      }
      // compute D and AF (use base totals: Ktot = K+KEF+KIF, Htot = H+HEF+HIF)
      for (const row of map.values()) {
        const Ktot = row.K + row.KEF + row.KIF;
        const Htot = row.H + row.HEF + row.HIF;
        row.D = row.K + row.H;
        let af = 0;
        af += Ktot * (AF_WEIGHTS['K'] || 0);
        af += Htot * (AF_WEIGHTS['H'] || 0);
        af += row.M * (AF_WEIGHTS['M'] || 0);
        af += row.T * (AF_WEIGHTS['T'] || 0);
        af += row.G * (AF_WEIGHTS['G'] || 0);
        af += row.B * (AF_WEIGHTS['B'] || 0);
        af += row.FF * (AF_WEIGHTS['FF'] || 0);
        af += row.FA * (AF_WEIGHTS['FA'] || 0);
        af += row.CL * (AF_WEIGHTS['CL'] || 0);
        af += row.I50 * (AF_WEIGHTS['I50'] || 0);
        af += row.R50 * (AF_WEIGHTS['R50'] || 0);
        row.AF = af;
      }

      return [...map.values()].sort((a,b)=>a.num-b.num);
    };

    return {
      home: makeRows(home, 'home'),
      away: makeRows(away, 'away'),
    };
  }, [players, filteredEvents]);

  const teamTotals = useMemo(() => {
    const init = () => ({
      K:0, KEF:0, KIF:0,
      H:0, HEF:0, HIF:0,
      M:0, MC:0, MUC:0, T:0, CON:0, UC:0,
      G:0, B:0, FF:0, FA:0, CL:0, I50:0, R50:0, GBG:0, HO:0,
      AF:0,
    });
    const home = init();
    const away = init();

    for (const e of filteredEvents) {
      const tgt = e.team_side === 'home' ? home : away;
      // only increment keys we know about
      if (e.stat_key in tgt) (tgt as any)[e.stat_key] += 1;
      // support old 'HB' handball base (legacy: increment H for base HB)
      if (e.stat_key === 'HB') (tgt as any).H += 1;
    }

    // Derived AF using combined K/H totals
    const calcAF = (o: any) => {
      const Ktot = (o.K||0) + (o.KEF||0) + (o.KIF||0);
      const Htot = (o.H||0) + (o.HEF||0) + (o.HIF||0);
      let af = 0;
      af += Ktot * (AF_WEIGHTS['K'] || 0);
      af += Htot * (AF_WEIGHTS['H'] || 0);
      af += (o.M||0) * (AF_WEIGHTS['M'] || 0);
      af += (o.T||0) * (AF_WEIGHTS['T'] || 0);
      af += (o.G||0) * (AF_WEIGHTS['G'] || 0);
      af += (o.B||0) * (AF_WEIGHTS['B'] || 0);
      af += (o.FF||0) * (AF_WEIGHTS['FF'] || 0);
      af += (o.FA||0) * (AF_WEIGHTS['FA'] || 0);
      af += (o.CL||0) * (AF_WEIGHTS['CL'] || 0);
      af += (o.I50||0) * (AF_WEIGHTS['I50'] || 0);
      af += (o.R50||0) * (AF_WEIGHTS['R50'] || 0);
      return af;
    };
    home.AF = calcAF(home); away.AF = calcAF(away);

    return { home, away };
  }, [filteredEvents]);

  // Simple TOTAL score chips (no quarter breakdowns)
  const scoreTotals = useMemo(() => {
    let hg = 0, hb = 0, ag = 0, ab = 0;
    for (const e of events) {
      if (e.stat_key === 'G') {
        if (e.team_side === 'home') hg++; else ag++;
      } else if (e.stat_key === 'B') {
        if (e.team_side === 'home') hb++; else ab++;
      }
    }
    return {
      home: { g: hg, b: hb, pts: hg * 6 + hb },
      away: { g: ag, b: ab, pts: ag * 6 + ab },
    };
  }, [events]);

  // ------- Export helpers (Excel / PDF) -------
  const segLabel = useMemo(() => (segment === 0 ? 'TOTAL' : `Q${segment}`), [segment]);

  // Build plain objects suitable for sheets/tables from our Row[]
  const mapRowsForExport = (rows: Row[]) => rows.map(r => ({
    '#': r.num,
    Player: r.name,
    K: r.K, KEF: r.KEF, KIF: r.KIF,
    H: r.H, HEF: r.HEF, HIF: r.HIF,
    D: r.D,
    M: r.M, MC: r.MC, MUC: r.MUC,
    T: r.T, CON: r.CON, UC: r.UC, GBG: r.GBG,
    G: r.G, B: r.B,
    FF: r.FF, FA: r.FA, CL: r.CL, I50: r.I50, R50: r.R50, HO: r.HO,
    AF: r.AF,
  }));

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const homeSheet = XLSX.utils.json_to_sheet(mapRowsForExport(bySide.home));
    const awaySheet = XLSX.utils.json_to_sheet(mapRowsForExport(bySide.away));

    // Team totals
    const teamTotalsRows = [
      {
        Team: homeTeamName,
        K: teamTotals.home.K, KEF: teamTotals.home.KEF, KIF: teamTotals.home.KIF,
        H: teamTotals.home.H, HEF: teamTotals.home.HEF, HIF: teamTotals.home.HIF,
        D: (teamTotals.home.K + teamTotals.home.H),
        M: teamTotals.home.M, MC: teamTotals.home.MC, MUC: teamTotals.home.MUC,
        T: teamTotals.home.T, CON: teamTotals.home.CON, UC: teamTotals.home.UC, GBG: teamTotals.home.GBG,
        G: teamTotals.home.G, B: teamTotals.home.B,
        FF: teamTotals.home.FF, FA: teamTotals.home.FA, CL: teamTotals.home.CL, I50: teamTotals.home.I50, R50: teamTotals.home.R50, HO: teamTotals.home.HO,
        AF: teamTotals.home.AF,
      },
      {
        Team: awayTeamName,
        K: teamTotals.away.K, KEF: teamTotals.away.KEF, KIF: teamTotals.away.KIF,
        H: teamTotals.away.H, HEF: teamTotals.away.HEF, HIF: teamTotals.away.HIF,
        D: (teamTotals.away.K + teamTotals.away.H),
        M: teamTotals.away.M, MC: teamTotals.away.MC, MUC: teamTotals.away.MUC,
        T: teamTotals.away.T, CON: teamTotals.away.CON, UC: teamTotals.away.UC, GBG: teamTotals.away.GBG,
        G: teamTotals.away.G, B: teamTotals.away.B,
        FF: teamTotals.away.FF, FA: teamTotals.away.FA, CL: teamTotals.away.CL, I50: teamTotals.away.I50, R50: teamTotals.away.R50, HO: teamTotals.away.HO,
        AF: teamTotals.away.AF,
      },
    ];

    XLSX.utils.book_append_sheet(wb, homeSheet, `${homeTeamName} ${segLabel}`.slice(0,31));
    XLSX.utils.book_append_sheet(wb, awaySheet, `${awayTeamName} ${segLabel}`.slice(0,31));
    const totalsSheet = XLSX.utils.json_to_sheet(teamTotalsRows);
    XLSX.utils.book_append_sheet(wb, totalsSheet, `Team Totals ${segLabel}`.slice(0,31));

    const fname = `Stats Summary - ${segLabel}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

  const exportPDF = async () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
      const margin = 36;
      const title = `${homeTeamName} ${scoreTotals.home.pts} : ${scoreTotals.away.pts} ${awayTeamName} — Stats Summary (${segLabel})`;

      // Column order (must match what we render in app)
      const COLS = ['Team','K','KEF','KIF','H','HEF','HIF','D','M','MC','MUC','T','CON','UC','GBG','G','B','FF','FA','CL','I50','R50','HO','AF'] as const;
      const head = [COLS as unknown as string[]];

      type Tot = Record<string, number>;
      const empty = (): Tot => ({ K:0, KEF:0, KIF:0, H:0, HEF:0, HIF:0, D:0, M:0, MC:0, MUC:0, T:0, CON:0, UC:0, GBG:0, G:0, B:0, FF:0, FA:0, CL:0, I50:0, R50:0, HO:0, AF:0, PTS:0 });

      const aggregate = (q: 0|1|2|3|4): { home: Tot; away: Tot } => {
        const H = empty();
        const A = empty();
        const evs = q === 0 ? events : events.filter(e => e.quarter === q);
        for (const e of evs) {
          const tgt = e.team_side === 'home' ? H : A;
          if (e.stat_key in tgt) (tgt as any)[e.stat_key] += 1;
          if (e.stat_key === 'K_EF') (tgt as any).KEF += 1;
          if (e.stat_key === 'K_IF') (tgt as any).KIF += 1;
          if (e.stat_key === 'HB_EF') (tgt as any).HEF += 1;
          if (e.stat_key === 'HB_IF') (tgt as any).HIF += 1;
          if (e.stat_key === 'HB') (tgt as any).H += 1;
        }
        const finish = (t: Tot) => { t.D = (t.K||0) + (t.H||0); t.PTS = (t.G||0)*6 + (t.B||0); };
        finish(H); finish(A);
        return { home: H, away: A };
      };

      // Rows as objects
      const buildRows = ({home, away}: {home: Tot; away: Tot}) => {
        const homeRow: any = { Team: homeTeamName };
        const awayRow: any = { Team: awayTeamName };
        for (const key of COLS.slice(1)) { homeRow[key] = (home as any)[key] ?? 0; awayRow[key] = (away as any)[key] ?? 0; }
        return [homeRow, awayRow] as const;
      };

      // Convert to array-of-arrays for robust head/body mapping
      const toBody = (rows: readonly any[]) => rows.map(r => COLS.map(k => (r as any)[k] ?? ''));

      // Colour function (uses object rows for comparison but formats array bodies visually)
      const invertSet = new Set(['KIF','HIF']);
      const colorize = (homeRow: any, awayRow: any) => (data: any) => {
        if (data.section !== 'body') return;
        // Defensive: get column index, guard against undefined
        const colIdx = (data.column && typeof data.column.index === 'number') ? data.column.index : null;
        if (colIdx === null || colIdx === 0) return;
        const key = COLS[colIdx] as string;
        const h = Number(homeRow[key] ?? 0);
        const a = Number(awayRow[key] ?? 0);
        if (Number.isNaN(h) || Number.isNaN(a) || h === a) return;
        const homeBetter = invertSet.has(key) ? h < a : h > a;
        const GREEN = [16,185,129];
        const RED = [239,68,68];
        // Defensive: work with data.cell.styles per jspdf-autotable v3
        const styles = (data.cell && data.cell.styles) ? data.cell.styles : null;
        if (!styles) return;
        if (data.row.index === 0) {
          styles.textColor = homeBetter ? GREEN : RED;
          styles.fontStyle = 'bold';
        } else if (data.row.index === 1) {
          styles.textColor = homeBetter ? RED : GREEN;
          styles.fontStyle = 'bold';
        }
      };

      // ---------- PAGE 1 ----------
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text(title, margin, 40);

      const totalRows = buildRows(aggregate(0));
      autoTable(doc, {
        startY: 60,
        head,
        body: toBody(totalRows),
        styles: { fontSize: 9, halign: 'center' },
        headStyles: { fillColor: [20,20,20], textColor: 255 },
        columnStyles: { 0: { halign: 'left' } },
        margin: { left: margin, right: margin },
        didParseCell: colorize(totalRows[0], totalRows[1]),
      });

      let y = (doc as any).lastAutoTable.finalY + 18;
      for (let q = 1 as 1|2|3|4; q <= 4; q = (q + 1) as 1|2|3|4) {
        doc.setFont('helvetica','bold');
        doc.setFontSize(11);
        doc.text(`Q${q}`, margin, y);
        const rows = buildRows(aggregate(q));
        autoTable(doc, {
          startY: y + 6,
          head,
          body: toBody(rows),
          styles: { fontSize: 8, halign: 'center', cellPadding: 2 },
          headStyles: { fillColor: [20,20,20], textColor: 255 },
          columnStyles: { 0: { halign: 'left' } },
          margin: { left: margin, right: margin },
          didParseCell: colorize(rows[0], rows[1]),
        });
        y = (doc as any).lastAutoTable.finalY + 12;
        if (y > doc.internal.pageSize.getHeight() - 60 && q < 4) y -= 8;
      }

      // Home players
      doc.addPage();
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text(`${homeTeamName} — Players (${segLabel})`, margin, 40);
      const homeRows = mapRowsForExport(bySide.home);
      autoTable(doc, {
        startY: 60,
        head: [[ '#','Player','K','KEF','KIF','H','HEF','HIF','D','M','MC','MUC','T','CON','UC','GBG','G','B','FF','FA','CL','I50','R50','HO','AF' ]],
        body: homeRows.map(r => Object.values(r)),
        styles: { fontSize: 8, halign: 'center' },
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [20,20,20], textColor: 255 },
      });

      // Away players
      doc.addPage();
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text(`${awayTeamName} — Players (${segLabel})`, margin, 40);
      const awayRows = mapRowsForExport(bySide.away);
      autoTable(doc, {
        startY: 60,
        head: [[ '#','Player','K','KEF','KIF','H','HEF','HIF','D','M','MC','MUC','T','CON','UC','GBG','G','B','FF','FA','CL','I50','R50','HO','AF' ]],
        body: awayRows.map(r => Object.values(r)),
        styles: { fontSize: 8, halign: 'center' },
        columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' } },
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [20,20,20], textColor: 255 },
      });

      doc.save(`Stats Summary - ${segLabel}.pdf`);
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('Export PDF failed. See console for details.');
    }
  };

  return (
    <>
      {/* --- Summary Header (full‑width band to match Game) --- */}
      <div className="full-bleed sticky top-0 z-[60]">
        <div className="relative overflow-hidden rounded-none border-y border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-slate-800/30 px-4 md:px-6 py-4 md:py-5 shadow-xl glassy-header">
          {/* Subtle full-container team watermark logos */}
          <div className="relative z-10 w-full max-w-[1200px] md:max-w-[1400px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4 px-4 md:px-6">
            {/* Left: Home score chip (team name) */}
            <div className="flex items-center justify-self-start pr-2 md:pr-3">
              {/* Left group: Kickchasers logo and Live button */}
              <div className="flex items-center gap-2 md:gap-3">
                <img
                  src="/kickchasers_logo.png"
                  alt="Kickchasers"
                  className="h-auto w-28 sm:w-36 max-w-[45vw] object-contain flex-shrink-0 drop-shadow"
                  draggable={false}
                />
                {isOwner && (
                  <Link
                    to={`/game/${gameId}`}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-emerald-300/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[12px] text-emerald-100"
                    title="Back to live game"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-90"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Live</span>
                  </Link>
                )}
              </div>
              {/* Right group: Home team name and scores */}
              <div className="flex items-center gap-3 md:gap-5 ml-3 md:ml-6">
                <span className="text-xs md:text-sm opacity-85 truncate max-w-[160px] md:max-w-[200px]">{homeTeamName}</span>
                <span className="hidden sm:inline-block h-5 w-px bg-white/20 mx-1.5 md:mx-2" aria-hidden="true"></span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 shadow-sm tabular-nums text-sm md:text-base">
                  {scoreTotals.home.pts}
                </span>
                <span className="text-[10px] opacity-70 tabular-nums">{scoreTotals.home.g}.{scoreTotals.home.b}</span>
              </div>
            </div>

            {/* Center: Title */}
            <div className="justify-self-center text-center text-sm md:text-base font-medium opacity-90">Stats Summary</div>

            {/* Right: Away score chip (team name) */}
            <div className="flex items-center gap-3 md:gap-5 justify-center justify-self-center pr-2 md:pr-3">
              <span className="text-[10px] opacity-70 tabular-nums">{scoreTotals.away.g}.{scoreTotals.away.b}</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 shadow-sm tabular-nums text-sm md:text-base">
                {scoreTotals.away.pts}
              </span>
              <span className="hidden sm:inline-block h-5 w-px bg-white/20 mx-1.5 md:mx-2" aria-hidden="true"></span>
              <span className="text-xs md:text-sm opacity-85 truncate max-w-[160px] md:max-w-[200px]">{awayTeamName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page content container */}
      <div className="max-w-[1600px] mx-auto px-6 py-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2 mx-auto">
          {/* Team toggle */}
          <div className="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5">
            <button
              className={`px-3 py-1.5 text-sm ${sideView==='home'?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
              onClick={()=>setSideView('home')}
            >Home</button>
            <button
              className={`px-3 py-1.5 text-sm ${sideView==='away'?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
              onClick={()=>setSideView('away')}
            >Away</button>
          </div>
          {/* View toggle */}
          <div className="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5 ml-1">
            <button
              className={`px-3 py-1.5 text-sm ${view==='players'?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
              onClick={()=>setView('players')}
            >Players</button>
            <button
              className={`px-3 py-1.5 text-sm ${view==='compare'?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
              onClick={()=>setView('compare')}
            >Team Compare</button>
          </div>
          {/* Quarter filter */}
          <div className="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5 ml-1">
            {[1,2,3,4].map(q => (
              <button key={q}
                className={`h-8 px-3 text-sm tabular-nums ${segment===q?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
                onClick={()=>setSegment(q as 1|2|3|4)}
              >Q{q}</button>
            ))}
            <button
              className={`h-8 px-3 text-sm ${segment===0?'bg-white/15 text-white':'text-white/80 hover:bg-white/10'}`}
              onClick={()=>setSegment(0)}
            >Total</button>
          </div>
          {/* Advanced toggle */}
          {view==='players' && (
            <button
              className={`ml-1 px-3 py-1.5 text-sm rounded-lg border transition ${showAdvanced ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-100' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
              onClick={()=>setShowAdvanced(v=>!v)}
              title="Show/Hide advanced modifier stats"
            >
              {showAdvanced ? 'Advanced: On' : 'Advanced: Off'}
            </button>
          )}
          {/* Export buttons */}
          <div className="inline-flex rounded-lg overflow-hidden border border-white/10 bg-white/5 ml-1">
            <button
              className="px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              onClick={exportExcel}
              title="Export player tables + team totals to Excel"
            >Export Excel</button>
            <button
              className="px-3 py-1.5 text-sm text-white/90 hover:bg-white/10 border-l border-white/10"
              onClick={exportPDF}
              title="Export player tables + team totals to PDF"
            >Export PDF</button>
          </div>
        </div>
      </div>

      {view==='players' ? (
        <div className="grid grid-cols-1 gap-4">
          {sideView==='home' ? (
            <TeamTable side="home" title={`Home — Players ${segment===0? '(Total)': `(Q${segment})`}`} rows={bySide.home} showAdvanced={showAdvanced} />
          ) : (
            <TeamTable side="away" title={`Away — Players ${segment===0? '(Total)': `(Q${segment})`}`} rows={bySide.away} showAdvanced={showAdvanced} />
          )}
        </div>
      ) : (
        <div id="team-compare-root" className="grid grid-cols-1 gap-4">
          <TeamCompare
            title={`Team Compare ${segment===0? '(Total)': `(Q${segment})`} — ${homeTeamName} ${scoreTotals.home.pts} : ${scoreTotals.away.pts} ${awayTeamName}`}
            homeLabel="Home"
            awayLabel="Away"
            homeTotals={teamTotals.home as any}
            awayTotals={teamTotals.away as any}
          />
        </div>
      )}
    </div>
    </>
  );
}

function TeamTable({ title, rows, showAdvanced, side }: { title: string; rows: Row[]; showAdvanced: boolean; side: 'home'|'away' }) {
  // Header background color depending on side
  const headerBg = side === 'home' ? 'bg-emerald-600/40' : 'bg-rose-600/40';
  const [sortKey, setSortKey] = useState<keyof Row>('D');
  const [dir, setDir] = useState<'asc'|'desc'>('desc');
  // Base and advanced columns (interleaved so modifiers sit beside their base stats)
  const standardCols: (keyof Row)[] = ['K','H','D','M','T','G','B','FF','FA','CL','I50','R50','AF'];
  const interleavedAdvanced: (keyof Row)[] = [
    // K block
    'K','KEF','KIF',
    // H block
    'H','HEF','HIF',
    // Derived disposals
    'D',
    // Marks block
    'M','MC','MUC',
    // Tackles + possession modifiers
    'T','CON','UC','GBG',
    // Core rest
    'G','B','FF','FA','CL','I50','R50','HO',
    // Fantasy last
    'AF'
  ];
  const advancedCols: (keyof Row)[] = ['KEF','KIF','HEF','HIF','MC','MUC','CON','UC','GBG','HO'];
  const activeCols: (keyof Row)[] = showAdvanced ? interleavedAdvanced : standardCols;

  // If current sortKey is not visible, fall back to 'D'
  useEffect(() => {
    if (!activeCols.includes(sortKey)) setSortKey('D');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced]);

  const totals = useMemo(() => {
    const base = { K:0, KEF:0, KIF:0, H:0, HEF:0, HIF:0, D:0, M:0, MC:0, MUC:0, T:0, CON:0, UC:0, G:0, B:0, FF:0, FA:0, CL:0, I50:0, R50:0, GBG:0, HO:0, AF:0 };
    for (const r of rows) {
      base.K += r.K; base.KEF += r.KEF; base.KIF += r.KIF;
      base.H += r.H; base.HEF += r.HEF; base.HIF += r.HIF;
      base.D += r.D; base.M += r.M; base.MC += r.MC; base.MUC += r.MUC; base.T += r.T; base.CON += r.CON; base.UC += r.UC;
      base.G += r.G; base.B += r.B; base.FF += r.FF; base.FA += r.FA; base.CL += r.CL; base.I50 += r.I50; base.R50 += r.R50; base.GBG += r.GBG; base.HO += r.HO; base.AF += r.AF;
    }
    return base;
  }, [rows]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a,b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === 'string') return (''+va).localeCompare(''+vb);
      return (dir === 'asc' ? 1 : -1) * ((va as number) - (vb as number));
    });
    return arr;
  }, [rows, sortKey, dir]);

  const head = (key: keyof Row, label: string) => (
    <th
      className={`py-1.5 px-2 cursor-pointer select-none font-semibold tracking-tight ${headerBg} text-white ${key === 'name' ? 'text-left' : 'text-center'}${sortKey === key ? ' font-bold' : ''}`}
      onClick={() => {
        if (sortKey === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setDir('desc'); }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}{sortKey === key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
      </span>
    </th>
  );

  return (
    <section className="card overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-xl">
      <div className="h2 px-3 pt-3 pb-2 flex items-center justify-center">{title}</div>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="table-fixed mx-auto text-[12px] leading-tight">
          <colgroup>
            <col className="w-[30px]" />
            <col className="w-[130px]" />
            {activeCols.map((_,i)=>(<col key={i} className="w-[70px]" />))}
          </colgroup>
          <thead>
            <tr className="border-b border-white/10">
              <th className={`text-center py-1.5 px-2 ${headerBg} text-white`}>#</th>
              {head('name','Player')}
              {activeCols.map((k) => (
                <th
                  key={k as string}
                  className={`py-1.5 px-2 cursor-pointer select-none font-semibold tracking-tight text-center ${headerBg} text-white${sortKey === k ? ' font-bold' : ''}`}
                  onClick={() => {
                    if (sortKey === k) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
                    else { setSortKey(k); setDir('desc'); }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {k}{sortKey === k ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td className="py-5 px-3 opacity-60 text-center" colSpan={activeCols.length+2}>No players yet.</td></tr>
            ) : sorted.map(r => (
              <tr key={r.num} className="border-b border-white/5 odd:bg-white/2 hover:bg-white/5 transition-colors">
                <td className="py-2 px-2 opacity-70 text-center">{r.num}</td>
                <td className="py-2 px-2">{r.name}</td>
                {activeCols.map(k => (
                  <Cell key={String(k)} n={r[k] as number} highlight={sortKey===k} advanced={showAdvanced && advancedCols.includes(k)} />
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="sticky bottom-0 bg-white/5 backdrop-blur border-t border-white/10">
              <td className="py-2 px-2 font-semibold text-center" colSpan={1}>Total</td>
              <td className="py-2 px-2 font-semibold text-left">&nbsp;</td>
              {activeCols.map(k => (
                <Cell key={String(k)} n={(totals as any)[k] as number} advanced={showAdvanced && advancedCols.includes(k)} />
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Cell({ n, highlight, advanced }:{ n:number, highlight?:boolean; advanced?:boolean }) {
  const advBg = advanced ? ' bg-cyan-500/5' : '';
  const hi = highlight ? ' bg-white/5 font-semibold' : '';
  return <td className={`py-2 px-2 tabular-nums text-center${advBg}${hi}`}>{n}</td>;
}