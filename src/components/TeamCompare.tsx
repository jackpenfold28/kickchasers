import React, { useMemo } from "react";

// Helpers
const hk = (obj: Record<string, number>, key: string) => obj?.[key] ?? 0;

// Row allows derived keys and percent rows
type Row = { key: string; label: string; home: number; away: number; isPct?: boolean };

function betterSide(rowKey: string, homeVal: number, awayVal: number) {
  if (homeVal === awayVal) return 'tie';
  const invert = rowKey === 'INEFF'; // higher is worse only for Ineffective disposals
  const homeBetter = invert ? homeVal < awayVal : homeVal > awayVal;
  return homeBetter ? 'home' : 'away';
}

function DiffPill({ rowKey, home, away }: { rowKey: string; home: number; away: number }){
  const side = betterSide(rowKey, home, away);
  if (side === 'tie') return null;
  const diff = Math.abs(home - away);
  const green = 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40';
  const red = 'bg-red-500/20 text-red-300 ring-1 ring-red-400/40';
  const cls = side === 'home' ? green : red;
  return (
    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold tabular-nums ${cls}`}>
      {side === 'home' ? '+' : '-'}{diff}
    </span>
  );
}

// Build disposal-derived numbers from totals
function buildDisposalRows(homeTotals: Record<string, number>, awayTotals: Record<string, number>) {
  // Base counts only for K and H (HB fallback supported)
  const Kh = hk(homeTotals,'K');
  const Ka = hk(awayTotals,'K');
  const Hh = hk(homeTotals,'H') || hk(homeTotals,'HB');
  const Ha = hk(awayTotals,'H') || hk(awayTotals,'HB');

  // Disposals strictly = K + H (no effectiveness variants)
  const Dhome = Kh + Hh;
  const Daway = Ka + Ha;

  // Effective / Ineffective totals from modifiers
  const EffH = hk(homeTotals,'KEF') + hk(homeTotals,'HEF');
  const EffA = hk(awayTotals,'KEF') + hk(awayTotals,'HEF');
  const IneffH = hk(homeTotals,'KIF') + hk(homeTotals,'HIF');
  const IneffA = hk(awayTotals,'KIF') + hk(awayTotals,'HIF');

  // Disposal efficiency uses effective / (K + H)
  const deffH = Dhome > 0 ? Math.round((EffH / Dhome) * 100) : 0;
  const deffA = Daway > 0 ? Math.round((EffA / Daway) * 100) : 0;

  const rows: Row[] = [
    { key: 'K', label: 'Kicks', home: Kh, away: Ka },
    { key: 'H', label: 'Handballs', home: Hh, away: Ha },
    { key: 'D', label: 'Disposals', home: Dhome, away: Daway },
    { key: 'EFF', label: 'Effective (K+H)', home: EffH, away: EffA },
    { key: 'INEFF', label: 'Ineffective (K+H)', home: IneffH, away: IneffA },
    { key: 'DEFF_PCT', label: 'Disposal Efficiency %', home: deffH, away: deffA, isPct: true },
  ];
  return rows;
}

function makeSimpleRow(key: string, label: string, homeTotals: Record<string, number>, awayTotals: Record<string, number>): Row {
  return { key, label, home: hk(homeTotals, key), away: hk(awayTotals, key) };
}

function glowClass(rowKey: string, homeVal: number, awayVal: number, isPct?: boolean) {
  if (homeVal === awayVal) return '';
  const invert = rowKey === 'INEFF'; // higher is worse only for Ineffective disposals
  const homeBetter = invert ? homeVal < awayVal : homeVal > awayVal;
  // Green when home is better, red when worse
  return homeBetter
    ? 'shadow-[0_0_0_5px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/60'
    : 'shadow-[0_0_0_5px_rgba(239,68,68,0.35)] ring-2 ring-red-400/60';
}

type TeamCompareProps = {
  title?: string;
  homeLabel?: string;
  awayLabel?: string;
  homeTotals: Record<string, number>;
  awayTotals: Record<string, number>;
  metrics?: { key: string; label: string }[];
  maxScale?: number;
  segment?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeLogoSrc?: string; // URL for left club logo
  awayLogoSrc?: string; // URL for right club logo
};

export default function TeamCompare({
  title = "Team Stats",
  homeLabel = "Home",
  awayLabel = "Away",
  homeTotals,
  awayTotals,
  metrics,
  maxScale,
  segment,
  homeTeamName = homeLabel,
  awayTeamName = awayLabel,
  homeLogoSrc,
  awayLogoSrc,
}: TeamCompareProps) {

  // Sections: Disposals, Inside 50 & Stoppage, Possession
  const disposalsSection = useMemo(() => buildDisposalRows(homeTotals, awayTotals), [homeTotals, awayTotals]);

  const insideStoppageSection = useMemo<Row[]>(() => [
    makeSimpleRow('I50', 'Inside 50', homeTotals, awayTotals),
    makeSimpleRow('R50', 'Rebound 50', homeTotals, awayTotals),
    makeSimpleRow('CL', 'Clearances', homeTotals, awayTotals),
    makeSimpleRow('HO', 'Hitouts', homeTotals, awayTotals),
  ], [homeTotals, awayTotals]);

  const possessionSection = useMemo<Row[]>(() => [
    makeSimpleRow('GBG', 'Ground Ball Gets', homeTotals, awayTotals),
    makeSimpleRow('M', 'Marks', homeTotals, awayTotals),
    makeSimpleRow('MC', 'Marks (Contested)', homeTotals, awayTotals),
    makeSimpleRow('MUC', 'Marks (Uncontested)', homeTotals, awayTotals),
    makeSimpleRow('CON', 'Contested Possession', homeTotals, awayTotals),
    makeSimpleRow('UC', 'Uncontested Possession', homeTotals, awayTotals),
    makeSimpleRow('T', 'Tackles', homeTotals, awayTotals),
    makeSimpleRow('FF', 'Free For', homeTotals, awayTotals),
    makeSimpleRow('FA', 'Free Against', homeTotals, awayTotals),
    makeSimpleRow('G', 'Goals', homeTotals, awayTotals),
    makeSimpleRow('B', 'Behinds', homeTotals, awayTotals),
    makeSimpleRow('AF', 'Fantasy', homeTotals, awayTotals),
  ], [homeTotals, awayTotals]);

  const heading = segment ? `${title} — ${segment}` : title;

  return (
    <section
      className="rounded-2xl border border-white/10
                 bg-gradient-to-b from-white/5 to-white/0
                 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="relative mb-8 sm:mb-10">
        {homeLogoSrc && (
          <img
            src={homeLogoSrc}
            alt={`${homeTeamName} logo`}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-14 sm:h-16 w-auto opacity-95 drop-shadow"
          />
        )}
        {awayLogoSrc && (
          <img
            src={awayLogoSrc}
            alt={`${awayTeamName} logo`}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-14 sm:h-16 w-auto opacity-95 drop-shadow"
          />
        )}
        <h2 className="h2 text-center">{heading}</h2>
        <div className="mt-3 h-px w-full bg-white/10" />
      </div>

      {/* Disposals Section */}
      <h3 className="mt-2 mb-2 text-sm uppercase tracking-wide text-white/70">Disposals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {disposalsSection.map((m, idx) => {
          const isPct = !!m.isPct;
          const homeVal = m.home;
          const awayVal = m.away;
          const homeShare = isPct ? Math.round(homeVal) : (homeVal + awayVal > 0 ? Math.round((homeVal/(homeVal+awayVal))*100) : 0);
          const awayShare = isPct ? Math.round(awayVal) : Math.max(0, 100 - homeShare);
          const barScale = isPct ? 100 : 100; // we scale bar height by percentage anyway
          const glow = glowClass(m.key, homeVal, awayVal, isPct);
          return (
            <div key={`disp-${m.key}`} className={`rounded-xl border ${glow ? 'border-transparent' : 'border-white/10'} p-5 sm:p-6 transition-colors ${idx % 2 === 1 ? 'bg-white/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.06]'} ${glow}`}>
              <div className="text-center mb-3">
                <span className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-white/80 font-semibold">{m.label}</span>
                <DiffPill rowKey={m.key} home={homeVal} away={awayVal} />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-8">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{homeShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{homeTeamName}</div>
                </div>
                <div className="flex items-end justify-center gap-2 sm:gap-2.5">
                  <div className="relative flex items-end justify-center" style={{height: '40px'}}>
                    <div className="w-3 rounded-[4px] bg-blue-500/90" style={{ height: `${Math.max(12, Math.min(36, (homeShare/barScale)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white">{isPct ? `${homeVal}%` : homeVal}</span>
                  </div>
                  <div className="relative flex items-end justify-center" style={{height: '34px'}}>
                    <div className="w-3 rounded-[4px] bg-zinc-300/90" style={{ height: `${Math.max(12, Math.min(36, (awayShare/barScale)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white/90">{isPct ? `${awayVal}%` : awayVal}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{awayShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{awayTeamName}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inside 50 & Stoppage Section */}
      <h3 className="mt-6 mb-2 text-sm uppercase tracking-wide text-white/70">Inside 50 & Stoppage</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {insideStoppageSection.map((m, idx) => {
          const total = m.home + m.away;
          const homeShare = total > 0 ? Math.round((m.home / total) * 100) : 0;
          const awayShare = Math.max(0, 100 - homeShare);
          const glow = glowClass(m.key, m.home, m.away);
          return (
            <div key={`stop-${m.key}`} className={`rounded-xl border ${glow ? 'border-transparent' : 'border-white/10'} p-5 sm:p-6 transition-colors ${idx % 2 === 1 ? 'bg-white/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.06]'} ${glow}`}>
              <div className="text-center mb-3">
                <span className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-white/80 font-semibold">{m.label}</span>
                <DiffPill rowKey={m.key} home={m.home} away={m.away} />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-8">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{homeShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{homeTeamName}</div>
                </div>
                <div className="flex items-end justify-center gap-2 sm:gap-2.5">
                  <div className="relative flex items-end justify-center" style={{height: '40px'}}>
                    <div className="w-3 rounded-[4px] bg-blue-500/90" style={{ height: `${Math.max(12, Math.min(36, (homeShare/100)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white">{m.home}</span>
                  </div>
                  <div className="relative flex items-end justify-center" style={{height: '34px'}}>
                    <div className="w-3 rounded-[4px] bg-zinc-300/90" style={{ height: `${Math.max(12, Math.min(36, (awayShare/100)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white/90">{m.away}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{awayShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{awayTeamName}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Possession Section */}
      <h3 className="mt-6 mb-2 text-sm uppercase tracking-wide text-white/70">Possession</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {possessionSection.map((m, idx) => {
          const total = m.home + m.away;
          const homeShare = total > 0 ? Math.round((m.home / total) * 100) : 0;
          const awayShare = Math.max(0, 100 - homeShare);
          const glow = glowClass(m.key, m.home, m.away);
          return (
            <div key={`pos-${m.key}`} className={`rounded-xl border ${glow ? 'border-transparent' : 'border-white/10'} p-5 sm:p-6 transition-colors ${idx % 2 === 1 ? 'bg-white/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.06]'} ${glow}`}>
              <div className="text-center mb-3">
                <span className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-white/80 font-semibold">{m.label}</span>
                <DiffPill rowKey={m.key} home={m.home} away={m.away} />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-8">
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{homeShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{homeTeamName}</div>
                </div>
                <div className="flex items-end justify-center gap-2 sm:gap-2.5">
                  <div className="relative flex items-end justify-center" style={{height: '40px'}}>
                    <div className="w-3 rounded-[4px] bg-blue-500/90" style={{ height: `${Math.max(12, Math.min(36, (homeShare/100)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white">{m.home}</span>
                  </div>
                  <div className="relative flex items-end justify-center" style={{height: '34px'}}>
                    <div className="w-3 rounded-[4px] bg-zinc-300/90" style={{ height: `${Math.max(12, Math.min(36, (awayShare/100)*36))}px` }} />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold tabular-nums text-white/90">{m.away}</span>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl sm:text-2xl font-extrabold tabular-nums">{awayShare}%</div>
                  <div className="text-[10px] sm:text-xs text-white/60">{awayTeamName}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}