// Canonical snapshot of kickchasers-mobile/lib/player-event-aggregate.ts.
// Keep changes fixture-driven and synchronized with the mobile source of truth.
export const QUARTER_ORDER = ['all', '1', '2', '3', '4'] as const;
export type QuarterKey = (typeof QUARTER_ORDER)[number];

export type PlayerEventRow = {
  stat_key: string | null;
  quarter: number | null;
  team_side?: string | null;
  player_number?: number | null;
};

export type AggregatedTotals = {
  kicks: number;
  handballs: number;
  disposals: number;
  marks: number;
  tackles: number;
  goals: number;
  behinds: number;
  freesFor: number;
  freesAgainst: number;
  clearances: number;
  inside50s: number;
  rebound50s: number;
  hitouts: number;
  groundBallGets: number;
  handballReceives: number;
  turnovers: number;
  intercepts: number;
  onePercenters: number;
  goalAssists: number;
  contestedPossessions: number;
  uncontestedPossessions: number;
  contestedMarks: number;
  uncontestedMarks: number;
  effectiveKicks: number;
  ineffectiveKicks: number;
  effectiveHandballs: number;
  ineffectiveHandballs: number;
  otherDisposals: number;
} & Record<string, number | null>;

export type TotalsWithDerived = AggregatedTotals & {
  points: number;
  fantasy: number;
  disposalOpportunities: number;
  disposalEfficiency: number | null;
};

export type AggregateResult = {
  totals: Record<QuarterKey, TotalsWithDerived>;
  quartersWithData: QuarterKey[];
  playerNumber: number | null;
  teamSide: 'home' | 'away' | null;
};

export type FantasyPointsInput = Pick<
  AggregatedTotals,
  'kicks' | 'handballs' | 'marks' | 'tackles' | 'hitouts' | 'goals' | 'behinds' | 'freesFor' | 'freesAgainst'
>;

/** Shared production AFL Fantasy calculation for every source adapter. */
export const computeFantasyPoints = (totals: FantasyPointsInput): number =>
  totals.kicks * 3 +
  totals.handballs * 2 +
  totals.marks * 3 +
  totals.tackles * 4 +
  totals.hitouts +
  totals.goals * 6 +
  totals.behinds +
  totals.freesFor -
  totals.freesAgainst * 3;

const KNOWN_CODES = new Set([
  'K',
  'K_EF',
  'K_IF',
  'HB',
  'HB_EF',
  'HB_IF',
  'M',
  'MC',
  'MUC',
  'T',
  'G',
  'B',
  'FF',
  'FA',
  'CL',
  'I50',
  'R50',
  'HO',
  'GBG',
  'HR',
  'TO',
  'INT',
  'ONE_PERCENT',
  'GA',
  'CON',
  'UC',
  'D',
]);

const createEmptyTotals = (): AggregatedTotals => ({
  kicks: 0,
  handballs: 0,
  disposals: 0,
  marks: 0,
  tackles: 0,
  goals: 0,
  behinds: 0,
  freesFor: 0,
  freesAgainst: 0,
  clearances: 0,
  inside50s: 0,
  rebound50s: 0,
  hitouts: 0,
  groundBallGets: 0,
  handballReceives: 0,
  turnovers: 0,
  intercepts: 0,
  onePercenters: 0,
  goalAssists: 0,
  contestedPossessions: 0,
  uncontestedPossessions: 0,
  contestedMarks: 0,
  uncontestedMarks: 0,
  effectiveKicks: 0,
  ineffectiveKicks: 0,
  effectiveHandballs: 0,
  ineffectiveHandballs: 0,
  otherDisposals: 0,
});

const applyEventToTotals = (totals: AggregatedTotals, code: string) => {
  switch (code) {
    case 'K':
      totals.kicks += 1;
      totals.disposals += 1;
      break;
    case 'K_EF': {
      const recordedAttempts = totals.effectiveKicks + totals.ineffectiveKicks;
      if (totals.kicks === recordedAttempts) {
        totals.kicks += 1;
        totals.disposals += 1;
      }
      totals.effectiveKicks += 1;
      break;
    }
    case 'K_IF': {
      const recordedAttempts = totals.effectiveKicks + totals.ineffectiveKicks;
      if (totals.kicks === recordedAttempts) {
        totals.kicks += 1;
        totals.disposals += 1;
      }
      totals.ineffectiveKicks += 1;
      break;
    }
    case 'HB':
      totals.handballs += 1;
      totals.disposals += 1;
      break;
    case 'HB_EF': {
      const recordedAttempts = totals.effectiveHandballs + totals.ineffectiveHandballs;
      if (totals.handballs === recordedAttempts) {
        totals.handballs += 1;
        totals.disposals += 1;
      }
      totals.effectiveHandballs += 1;
      break;
    }
    case 'HB_IF': {
      const recordedAttempts = totals.effectiveHandballs + totals.ineffectiveHandballs;
      if (totals.handballs === recordedAttempts) {
        totals.handballs += 1;
        totals.disposals += 1;
      }
      totals.ineffectiveHandballs += 1;
      break;
    }
    case 'D':
      totals.disposals += 1;
      totals.otherDisposals += 1;
      break;
    case 'M':
      totals.marks += 1;
      break;
    case 'MC':
      totals.contestedMarks += 1;
      break;
    case 'MUC':
      totals.uncontestedMarks += 1;
      break;
    case 'T':
      totals.tackles += 1;
      break;
    case 'G':
      totals.goals += 1;
      break;
    case 'B':
      totals.behinds += 1;
      break;
    case 'FF':
      totals.freesFor += 1;
      break;
    case 'FA':
      totals.freesAgainst += 1;
      break;
    case 'CL':
      totals.clearances += 1;
      break;
    case 'I50':
      totals.inside50s += 1;
      break;
    case 'R50':
      totals.rebound50s += 1;
      break;
    case 'HO':
      totals.hitouts += 1;
      break;
    case 'GBG':
      totals.groundBallGets += 1;
      break;
    case 'HR':
      totals.handballReceives += 1;
      break;
    case 'TO':
      totals.turnovers += 1;
      break;
    case 'INT':
      totals.intercepts += 1;
      break;
    case 'ONE_PERCENT':
      totals.onePercenters += 1;
      break;
    case 'GA':
      totals.goalAssists += 1;
      break;
    case 'CON':
      totals.contestedPossessions += 1;
      break;
    case 'UC':
      totals.uncontestedPossessions += 1;
      break;
    default:
      if (code.startsWith('CUS_')) {
        totals[code] = (totals[code] ?? 0) + 1;
      }
      break;
  }
};

const finalizeTotals = (totals: AggregatedTotals): TotalsWithDerived => {
  const points = totals.goals * 6 + totals.behinds;
  const fantasy = computeFantasyPoints(totals);

  const disposalOpportunities =
    totals.effectiveKicks +
    totals.ineffectiveKicks +
    totals.effectiveHandballs +
    totals.ineffectiveHandballs;
  const disposalEfficiency =
    disposalOpportunities > 0
      ? (totals.effectiveKicks + totals.effectiveHandballs) / disposalOpportunities
      : null;

  return {
    ...totals,
    points,
    fantasy,
    disposalOpportunities,
    disposalEfficiency,
  };
};

export const buildTotalsFromEvents = (events: PlayerEventRow[]): TotalsWithDerived => {
  const totals = createEmptyTotals();

  events
    .map(evt => ({
      ...evt,
      stat_key: (evt.stat_key ?? '').toUpperCase(),
    }))
    .filter(evt => typeof evt.stat_key === 'string' && (KNOWN_CODES.has(evt.stat_key) || evt.stat_key.startsWith('CUS_')))
    .forEach(evt => {
      applyEventToTotals(totals, evt.stat_key ?? '');
    });

  return finalizeTotals(totals);
};

export const buildTotalsFromCounts = (counts: Partial<AggregatedTotals>): TotalsWithDerived => {
  const base = createEmptyTotals();
  (Object.keys(base) as (keyof AggregatedTotals)[]).forEach(key => {
    const value = counts[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      base[key] = value;
    }
  });
  if (counts.disposals == null) {
    base.disposals = base.kicks + base.handballs + base.otherDisposals;
  }
  return finalizeTotals(base);
};

const totalsToArray = (totals: TotalsWithDerived): number[] => [
  totals.disposals,
  totals.kicks,
  totals.handballs,
  totals.marks,
  totals.tackles,
  totals.goals,
  totals.behinds,
  totals.freesFor,
  totals.freesAgainst,
  totals.clearances,
  totals.inside50s,
  totals.rebound50s,
  totals.hitouts,
  totals.groundBallGets,
  totals.handballReceives,
  totals.turnovers,
  totals.intercepts,
  totals.onePercenters,
  totals.goalAssists,
  totals.contestedPossessions,
  totals.uncontestedPossessions,
  totals.contestedMarks,
  totals.uncontestedMarks,
  totals.effectiveKicks,
  totals.ineffectiveKicks,
  totals.effectiveHandballs,
  totals.ineffectiveHandballs,
];

export const aggregatePlayerEvents = (
  events: PlayerEventRow[],
  preferredPlayerNumber: number | null,
): AggregateResult => {
  if (!events.length) {
    const emptyTotals: Record<QuarterKey, TotalsWithDerived> = {
      all: finalizeTotals(createEmptyTotals()),
      '1': finalizeTotals(createEmptyTotals()),
      '2': finalizeTotals(createEmptyTotals()),
      '3': finalizeTotals(createEmptyTotals()),
      '4': finalizeTotals(createEmptyTotals()),
    };
    return {
      totals: emptyTotals,
      quartersWithData: ['all'],
      playerNumber: preferredPlayerNumber,
      teamSide: null,
    };
  }

  const normalizedEvents = events
    .map(evt => ({
      ...evt,
      stat_key: (evt.stat_key ?? '').toUpperCase(),
    }))
    .filter(evt => typeof evt.stat_key === 'string' && (KNOWN_CODES.has(evt.stat_key) || evt.stat_key.startsWith('CUS_')));

  const countsByNumber = new Map<number, number>();
  normalizedEvents.forEach(evt => {
    if (typeof evt.player_number === 'number') {
      countsByNumber.set(evt.player_number, (countsByNumber.get(evt.player_number) ?? 0) + 1);
    }
  });

  let resolvedPlayerNumber: number | null = null;
  if (preferredPlayerNumber != null && countsByNumber.has(preferredPlayerNumber)) {
    resolvedPlayerNumber = preferredPlayerNumber;
  } else if (countsByNumber.size > 0) {
    let maxCount = -1;
    countsByNumber.forEach((count, number) => {
      if (count > maxCount) {
        maxCount = count;
        resolvedPlayerNumber = number;
      }
    });
  }

  const filteredByPlayer =
    resolvedPlayerNumber != null
      ? normalizedEvents.filter(evt => evt.player_number === resolvedPlayerNumber)
      : normalizedEvents;

  if (!filteredByPlayer.length) {
    const emptyTotals: Record<QuarterKey, TotalsWithDerived> = {
      all: finalizeTotals(createEmptyTotals()),
      '1': finalizeTotals(createEmptyTotals()),
      '2': finalizeTotals(createEmptyTotals()),
      '3': finalizeTotals(createEmptyTotals()),
      '4': finalizeTotals(createEmptyTotals()),
    };
    return {
      totals: emptyTotals,
      quartersWithData: ['all'],
      playerNumber: resolvedPlayerNumber,
      teamSide: null,
    };
  }

  const countsBySide = new Map<'home' | 'away', number>();
  filteredByPlayer.forEach(evt => {
    if (evt.team_side === 'home' || evt.team_side === 'away') {
      countsBySide.set(evt.team_side, (countsBySide.get(evt.team_side) ?? 0) + 1);
    }
  });

  let resolvedTeamSide: 'home' | 'away' | null = null;
  if (countsBySide.size) {
    let maxCount = -1;
    countsBySide.forEach((count, side) => {
      if (count > maxCount) {
        maxCount = count;
        resolvedTeamSide = side;
      }
    });
  }

  const filtered =
    resolvedTeamSide != null
      ? filteredByPlayer.filter(evt => evt.team_side === resolvedTeamSide)
      : filteredByPlayer;

  const totals: Record<QuarterKey, AggregatedTotals> = {
    all: createEmptyTotals(),
    '1': createEmptyTotals(),
    '2': createEmptyTotals(),
    '3': createEmptyTotals(),
    '4': createEmptyTotals(),
  };

  filtered.forEach(evt => {
    const code = evt.stat_key ?? '';
    const quarter =
      typeof evt.quarter === 'number' && evt.quarter >= 1 && evt.quarter <= 4
        ? (String(evt.quarter) as QuarterKey)
        : null;
    applyEventToTotals(totals.all, code);
    if (quarter) {
      applyEventToTotals(totals[quarter], code);
    }
  });

  const finalized: Record<QuarterKey, TotalsWithDerived> = {
    all: finalizeTotals(totals.all),
    '1': finalizeTotals(totals['1']),
    '2': finalizeTotals(totals['2']),
    '3': finalizeTotals(totals['3']),
    '4': finalizeTotals(totals['4']),
  };

  const quartersWithData: QuarterKey[] = ['all'];
  (['1', '2', '3', '4'] as const).forEach(quarter => {
    const values = totalsToArray(finalized[quarter]);
    if (values.some(value => value > 0)) {
      quartersWithData.push(quarter);
    }
  });

  return {
    totals: finalized,
    quartersWithData,
    playerNumber: resolvedPlayerNumber,
    teamSide: resolvedTeamSide,
  };
};
