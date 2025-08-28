// src/lib/stats.ts
export type Side = 'home' | 'away';
export type StatKey = 'K'|'HB'|'M'|'T'|'G'|'B'|'FF'|'FA'|'CL'|'I50'|'R50';
export const STAT_KEYS: StatKey[] = ['K','HB','M','T','G','B','FF','FA','CL','I50','R50'];

export type EventRow = {
  game_id: string;
  team_side?: Side;   // 'home' | 'away'
  side?: Side;        // tolerate alt field
  quarter: number;    // 1..4
  player_number?: number;
  number?: number;    // tolerate alt field
  stat_key: string;   // e.g. 'K','HB',...
};

export type RosterRow = {
  team_side?: Side;
  side?: Side;
  number?: number;
  player_number?: number;
  name?: string;
};

export type PlayerTotals = {
  side: Side;
  number: number;
  name: string;
} & Record<StatKey | 'D' | 'AF', number>;

const AF_WEIGHTS: Record<StatKey, number> = {
  K: 3, HB: 2, M: 3, T: 4, G: 6, B: 1, FF: 1, FA: -3, CL: 0, I50: 0, R50: 0,
};

const normSide = (s?: any): Side => (String(s ?? 'home').toLowerCase() === 'away' ? 'away' : 'home');
const n = (v: any) => Number(v ?? 0);

/** Filter events by quarter segment. segment = 1..4 or 'TOTAL' */
export function filterEventsBySegment(
  events: EventRow[],
  segment: 1 | 2 | 3 | 4 | 'TOTAL'
) {
  return segment === 'TOTAL' ? events : events.filter(e => n(e.quarter) === segment);
}

/** Build per‑player totals from roster + events (works even if roster missing). */
export function computePlayerTotals(
  roster: RosterRow[],
  events: EventRow[]
): PlayerTotals[] {
  const base = new Map<string, PlayerTotals>();

  // seed from roster so 0-stat players show
  for (const p of roster || []) {
    const side = normSide(p.team_side ?? p.side);
    const number = n(p.number ?? p.player_number);
    const name = String(p.name ?? '');
    const key = `${side}:${number}`;
    if (!base.has(key)) {
      base.set(key, {
        side, number, name,
        ...Object.fromEntries(STAT_KEYS.map(k => [k, 0])) as Record<StatKey, number>,
        D: 0, AF: 0
      });
    }
  }

  // ensure any event-only player also exists
  for (const e of events || []) {
    const side = normSide(e.team_side ?? e.side);
    const number = n(e.player_number ?? e.number);
    const key = `${side}:${number}`;
    if (!base.has(key)) {
      base.set(key, {
        side, number, name: '',
        ...Object.fromEntries(STAT_KEYS.map(k => [k, 0])) as Record<StatKey, number>,
        D: 0, AF: 0
      });
    }
  }

  // tally
  for (const e of events || []) {
    const side = normSide(e.team_side ?? e.side);
    const number = n(e.player_number ?? e.number);
    const stat = String(e.stat_key || '').toUpperCase() as StatKey;
    if (!STAT_KEYS.includes(stat)) continue;
    const key = `${side}:${number}`;
    const row = base.get(key);
    if (row) row[stat] = (row[stat] ?? 0) + 1;
  }

  // derived
  for (const r of base.values()) {
    r.D = (r.K ?? 0) + (r.HB ?? 0);
    r.AF = STAT_KEYS.reduce((sum, k) => sum + (r[k] ?? 0) * (AF_WEIGHTS[k] ?? 0), 0);
  }

  return Array.from(base.values());
}

/** Simple team totals (for the tiles on Live etc.). */
export function computeTeamTotals(
  events: EventRow[],
  side: Side
): Record<StatKey, number> {
  const out: Record<StatKey, number> = Object.fromEntries(STAT_KEYS.map(k => [k, 0])) as any;
  for (const e of events) {
    const s = normSide(e.team_side ?? e.side);
    if (s !== side) continue;
    const stat = String(e.stat_key || '').toUpperCase() as StatKey;
    if (STAT_KEYS.includes(stat)) out[stat] += 1;
  }
  return out;
}