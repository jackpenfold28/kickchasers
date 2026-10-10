// Canonical snapshot of kickchasers-mobile/constants/benchmarks.ts.
// Keep changes fixture-driven and synchronized with the mobile source of truth.
export type Band = 'Elite' | 'Above Av' | 'Average' | 'Rookie';

export const BAND_ORDER: Band[] = ['Elite', 'Above Av', 'Average', 'Rookie'];

export const BAND_COLORS: Record<Band, string> = {
  Elite: '#1E63FF',
  'Above Av': '#2EAC66',
  Average: '#D79A00',
  Rookie: '#D86C45',
};

export type PositionGroup =
  | 'Key Forward'
  | 'General Forward'
  | 'Mid'
  | 'Ruck'
  | 'General Defender'
  | 'Key Defender';

export type BenchmarkCohort = 'Junior' | 'Youth' | 'Senior';

export const currentSeason = 2025;

export type StatKey =
  | 'disposals'
  | 'kicks'
  | 'handballs'
  | 'marks'
  | 'tackles'
  | 'goals'
  | 'goals_behinds'
  | 'contested_possessions'
  | 'uncontested_possessions'
  | 'disposal_efficiency_pct'
  | 'turnovers'
  | 'intercepts'
  | 'goal_assists'
  | 'one_percenters'
  | 'ground_ball_gets'
  | 'contested_marks'
  | 'clearances'
  | 'inside_50s'
  | 'rebound_50s'
  | 'hitouts'
  | 'frees_for'
  | 'frees_against'
  | 'behinds'
  | 'fantasy_points';

export type Threshold = {
  eliteMin?: number;
  aboveMin?: number;
  avgMin?: number;
  rookieMax?: number;
  lowerIsBetter?: boolean;
};

export type SeasonThresholds = Partial<Record<PositionGroup | 'Default', Record<StatKey, Threshold>>>;

export type Scope = 'game' | 'quarter';
export type QuarterThresholds = Partial<Record<PositionGroup | 'Default', Record<StatKey, Threshold>>>;

export type BenchmarkContext = {
  quarterLengthMinutes?: number | null;
  gradeId?: string | null;
  playerDob?: string | null;
  gameDate?: string | null;
};

const DEFAULT_THRESHOLDS: Record<StatKey, Threshold> = {
  disposals: { eliteMin: 28, aboveMin: 21, avgMin: 14, rookieMax: 13 },
  kicks: { eliteMin: 15, aboveMin: 10, avgMin: 5, rookieMax: 4 },
  handballs: { eliteMin: 13, aboveMin: 8, avgMin: 4, rookieMax: 3 },
  marks: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  tackles: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  goals: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  goals_behinds: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  contested_possessions: { eliteMin: 10, aboveMin: 7, avgMin: 4, rookieMax: 3 },
  uncontested_possessions: { eliteMin: 18, aboveMin: 12, avgMin: 6, rookieMax: 5 },
  disposal_efficiency_pct: { eliteMin: 78, aboveMin: 68, avgMin: 58, rookieMax: 57 },
  turnovers: { lowerIsBetter: true, eliteMin: 1, aboveMin: 3, avgMin: 5, rookieMax: 99 },
  intercepts: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  goal_assists: { eliteMin: 2, aboveMin: 1, avgMin: 1, rookieMax: 0 },
  one_percenters: { eliteMin: 6, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  ground_ball_gets: { eliteMin: 8, aboveMin: 5, avgMin: 2, rookieMax: 1 },
  contested_marks: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  clearances: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  inside_50s: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  rebound_50s: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  hitouts: { eliteMin: 30, aboveMin: 20, avgMin: 10, rookieMax: 9 },
  frees_for: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  frees_against: { lowerIsBetter: true, eliteMin: 0, aboveMin: 1, avgMin: 3, rookieMax: 99 },
  behinds: { eliteMin: 2, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  fantasy_points: { eliteMin: 105, aboveMin: 80, avgMin: 55, rookieMax: 54 },
};

const GENERAL_FORWARD_THRESHOLDS: Record<StatKey, Threshold> = {
  disposals: { eliteMin: 11, aboveMin: 8, avgMin: 4, rookieMax: 3 },
  kicks: { eliteMin: 9, aboveMin: 6, avgMin: 3, rookieMax: 2 },
  handballs: { eliteMin: 6, aboveMin: 4, avgMin: 1, rookieMax: 0 },
  marks: { eliteMin: 7, aboveMin: 5, avgMin: 1, rookieMax: 0 },
  tackles: { eliteMin: 3, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  goals: { eliteMin: 5, aboveMin: 4, avgMin: 1, rookieMax: 0 },
  goals_behinds: { eliteMin: 5, aboveMin: 4, avgMin: 1, rookieMax: 0 },
  contested_possessions: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  uncontested_possessions: { eliteMin: 8, aboveMin: 5, avgMin: 2, rookieMax: 1 },
  disposal_efficiency_pct: { eliteMin: 76, aboveMin: 66, avgMin: 56, rookieMax: 55 },
  turnovers: { lowerIsBetter: true, eliteMin: 1, aboveMin: 3, avgMin: 5, rookieMax: 99 },
  intercepts: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  goal_assists: { eliteMin: 2, aboveMin: 1, avgMin: 1, rookieMax: 0 },
  one_percenters: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  ground_ball_gets: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  contested_marks: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  clearances: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  inside_50s: { eliteMin: 5, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  rebound_50s: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  hitouts: { eliteMin: 8, aboveMin: 4, avgMin: 1, rookieMax: 0 },
  frees_for: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  frees_against: { lowerIsBetter: true, eliteMin: 0, aboveMin: 1, avgMin: 3, rookieMax: 99 },
  behinds: { eliteMin: 2, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  fantasy_points: { eliteMin: 98, aboveMin: 70, avgMin: 30, rookieMax: 29 },
};

const MID_THRESHOLDS: Record<StatKey, Threshold> = {
  disposals: { eliteMin: 25, aboveMin: 19, avgMin: 11, rookieMax: 10 },
  kicks: { eliteMin: 13, aboveMin: 8, avgMin: 4, rookieMax: 3 },
  handballs: { eliteMin: 13, aboveMin: 8, avgMin: 4, rookieMax: 3 },
  marks: { eliteMin: 5, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  tackles: { eliteMin: 5, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  goals: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  goals_behinds: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  contested_possessions: { eliteMin: 10, aboveMin: 7, avgMin: 4, rookieMax: 3 },
  uncontested_possessions: { eliteMin: 16, aboveMin: 10, avgMin: 6, rookieMax: 5 },
  disposal_efficiency_pct: { eliteMin: 78, aboveMin: 68, avgMin: 58, rookieMax: 57 },
  turnovers: { lowerIsBetter: true, eliteMin: 1, aboveMin: 3, avgMin: 5, rookieMax: 99 },
  intercepts: { eliteMin: 5, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  goal_assists: { eliteMin: 2, aboveMin: 1, avgMin: 1, rookieMax: 0 },
  one_percenters: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  ground_ball_gets: { eliteMin: 7, aboveMin: 5, avgMin: 3, rookieMax: 2 },
  contested_marks: { eliteMin: 2, aboveMin: 1, avgMin: 1, rookieMax: 0 },
  clearances: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  inside_50s: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  rebound_50s: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  hitouts: { eliteMin: 10, aboveMin: 5, avgMin: 1, rookieMax: 0 },
  frees_for: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  frees_against: { lowerIsBetter: true, eliteMin: 0, aboveMin: 1, avgMin: 3, rookieMax: 99 },
  behinds: { eliteMin: 2, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  fantasy_points: { eliteMin: 88, aboveMin: 68, avgMin: 42, rookieMax: 41 },
};

const GENERAL_DEFENDER_THRESHOLDS: Record<StatKey, Threshold> = {
  disposals: { eliteMin: 24, aboveMin: 18, avgMin: 12, rookieMax: 11 },
  kicks: { eliteMin: 15, aboveMin: 10, avgMin: 5, rookieMax: 4 },
  handballs: { eliteMin: 10, aboveMin: 6, avgMin: 3, rookieMax: 2 },
  marks: { eliteMin: 8, aboveMin: 5, avgMin: 2, rookieMax: 1 },
  tackles: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  goals: { eliteMin: 2, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  goals_behinds: { eliteMin: 2, aboveMin: 1, avgMin: 0, rookieMax: -1 },
  contested_possessions: { eliteMin: 8, aboveMin: 5, avgMin: 3, rookieMax: 2 },
  uncontested_possessions: { eliteMin: 16, aboveMin: 11, avgMin: 6, rookieMax: 5 },
  disposal_efficiency_pct: { eliteMin: 80, aboveMin: 70, avgMin: 60, rookieMax: 59 },
  turnovers: { lowerIsBetter: true, eliteMin: 1, aboveMin: 3, avgMin: 5, rookieMax: 99 },
  intercepts: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  goal_assists: { eliteMin: 2, aboveMin: 1, avgMin: 1, rookieMax: 0 },
  one_percenters: { eliteMin: 6, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  ground_ball_gets: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  contested_marks: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  clearances: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  inside_50s: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  rebound_50s: { eliteMin: 6, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  hitouts: { eliteMin: 8, aboveMin: 4, avgMin: 1, rookieMax: 0 },
  frees_for: { eliteMin: 3, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  frees_against: { lowerIsBetter: true, eliteMin: 0, aboveMin: 1, avgMin: 3, rookieMax: 99 },
  behinds: { eliteMin: 1, aboveMin: 0, avgMin: 0, rookieMax: -1 },
  fantasy_points: { eliteMin: 95, aboveMin: 75, avgMin: 50, rookieMax: 49 },
};

const KEY_FORWARD_THRESHOLDS: Record<StatKey, Threshold> = {
  ...GENERAL_FORWARD_THRESHOLDS,
  marks: { eliteMin: 8, aboveMin: 5, avgMin: 2, rookieMax: 1 },
  contested_marks: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  goals: { eliteMin: 5, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  fantasy_points: { eliteMin: 95, aboveMin: 68, avgMin: 28, rookieMax: 27 },
};

const KEY_DEFENDER_THRESHOLDS: Record<StatKey, Threshold> = {
  ...GENERAL_DEFENDER_THRESHOLDS,
  marks: { eliteMin: 9, aboveMin: 6, avgMin: 3, rookieMax: 2 },
  contested_marks: { eliteMin: 4, aboveMin: 2, avgMin: 1, rookieMax: 0 },
  intercepts: { eliteMin: 8, aboveMin: 5, avgMin: 3, rookieMax: 2 },
  fantasy_points: { eliteMin: 100, aboveMin: 80, avgMin: 52, rookieMax: 51 },
};

const RUCK_THRESHOLDS: Record<StatKey, Threshold> = {
  ...DEFAULT_THRESHOLDS,
  disposals: { eliteMin: 20, aboveMin: 14, avgMin: 8, rookieMax: 7 },
  marks: { eliteMin: 7, aboveMin: 4, avgMin: 2, rookieMax: 1 },
  clearances: { eliteMin: 6, aboveMin: 3, avgMin: 1, rookieMax: 0 },
  hitouts: { eliteMin: 35, aboveMin: 24, avgMin: 12, rookieMax: 11 },
  fantasy_points: { eliteMin: 98, aboveMin: 74, avgMin: 48, rookieMax: 47 },
};

export const BENCHMARKS: Record<number, SeasonThresholds> = {
  [currentSeason]: {
    Default: DEFAULT_THRESHOLDS,
    'General Forward': GENERAL_FORWARD_THRESHOLDS,
    Mid: MID_THRESHOLDS,
    'General Defender': GENERAL_DEFENDER_THRESHOLDS,
    'Key Forward': KEY_FORWARD_THRESHOLDS,
    'Key Defender': KEY_DEFENDER_THRESHOLDS,
    Ruck: RUCK_THRESHOLDS,
  },
};

const COHORT_FACTORS: Record<BenchmarkCohort, number> = {
  Junior: 0.62,
  Youth: 0.82,
  Senior: 1,
};

const SUB20_COHORT_THRESHOLD_LIFT_FACTORS: Record<BenchmarkCohort, number> = {
  Junior: 0.97,
  Youth: 0.99,
  Senior: 1,
};

const QUARTER_FACTOR = 0.25;
// Benchmarks are authored for 20-minute quarters (80-minute matches); scale relative to that baseline.
export const BASELINE_QUARTER_MINUTES = 20;

const AGE_QUARTER_LENGTHS: Array<{ maxAge: number; quarterMinutes: number }> = [
  { maxAge: 8, quarterMinutes: 10 },
  { maxAge: 10, quarterMinutes: 12 },
  { maxAge: 12, quarterMinutes: 15 },
  { maxAge: 15, quarterMinutes: 18 },
  { maxAge: 99, quarterMinutes: 20 },
];

const gradeAgeRanges = new Map<string, { minAge?: number | null; maxAge?: number | null }>();

export const registerGradeAgeRange = (
  gradeId: string,
  range: { minAge?: number | null; maxAge?: number | null },
) => {
  if (!gradeId) return;
  gradeAgeRanges.set(gradeId, {
    minAge: range.minAge ?? null,
    maxAge: range.maxAge ?? null,
  });
};

const clampPositive = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

const parseAgeFromGradeId = (gradeId?: string | null): number | null => {
  if (!gradeId) return null;
  const raw = gradeId.trim().toLowerCase();
  const match = raw.match(/(?:^|[^a-z0-9])(u|under)\s*([0-9]{1,2})(?:s|[^a-z0-9]|$)/i) ?? raw.match(/u([0-9]{1,2})/i);
  if (!match) return null;
  const age = Number(match[2] ?? match[1]);
  return Number.isFinite(age) ? age : null;
};

const ageFromDob = (dobIso?: string | null, gameDateIso?: string | null): number | null => {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const baseDate = gameDateIso ? new Date(gameDateIso) : new Date();
  if (Number.isNaN(baseDate.getTime())) return null;
  let age = baseDate.getFullYear() - dob.getFullYear();
  const monthDelta = baseDate.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && baseDate.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const quarterLengthFromAge = (age?: number | null): number | null => {
  if (age == null) return null;
  const match = AGE_QUARTER_LENGTHS.find(entry => age <= entry.maxAge);
  return match?.quarterMinutes ?? null;
};

const resolveContextAge = (ctx?: BenchmarkContext): number | null => {
  if (!ctx) return null;
  if (ctx.gradeId) {
    const range = gradeAgeRanges.get(ctx.gradeId);
    const gradeAge =
      clampPositive(range?.maxAge ?? null) ?? clampPositive(range?.minAge ?? null) ?? parseAgeFromGradeId(ctx.gradeId);
    if (gradeAge != null) return gradeAge;
  }
  return ageFromDob(ctx.playerDob ?? null, ctx.gameDate ?? null);
};

// Fallback when quarter length is missing: prefer grade catalog age ranges, else DOB-derived age.
const deriveQuarterLengthFromGradeOrAge = (ctx?: BenchmarkContext): number | null => {
  const age = resolveContextAge(ctx);
  return quarterLengthFromAge(age);
};

export function resolveBenchmarkCohort(ctx?: BenchmarkContext): BenchmarkCohort {
  const age = resolveContextAge(ctx);
  if (age != null) {
    if (age <= 12) return 'Junior';
    if (age <= 17) return 'Youth';
    return 'Senior';
  }

  const scaleFactor = getScaleFactor(ctx);
  if (scaleFactor <= 0.76) return 'Junior';
  if (scaleFactor < 1) return 'Youth';
  return 'Senior';
}

export function getScaleFactor(ctx?: BenchmarkContext): number {
  // scaleFactor = (quarterLengthMinutes / 20); if missing, fall back to grade/age mapping, then 1.
  const directQuarter = clampPositive(ctx?.quarterLengthMinutes ?? null);
  if (directQuarter) return directQuarter / BASELINE_QUARTER_MINUTES;
  const derivedQuarter = clampPositive(deriveQuarterLengthFromGradeOrAge(ctx));
  if (derivedQuarter) return derivedQuarter / BASELINE_QUARTER_MINUTES;
  return 1;
}

const isPercent = (key: StatKey) => key === 'disposal_efficiency_pct';
const scale = (v: number | undefined, factor: number) => (v == null ? undefined : v * factor);
const up = (v?: number) => (v == null ? undefined : Math.ceil(v));
const down = (v?: number) => (v == null ? undefined : Math.floor(v));

export function scaleThresholdsObject(thresholds: Threshold, factor: number, key: StatKey): Threshold {
  if (factor === 1 || isPercent(key)) return thresholds;
  return {
    lowerIsBetter: thresholds.lowerIsBetter,
    eliteMin: up(scale(thresholds.eliteMin, factor)),
    aboveMin: up(scale(thresholds.aboveMin, factor)),
    avgMin: up(scale(thresholds.avgMin, factor)),
    rookieMax: down(scale(thresholds.rookieMax, factor)),
  };
}

function scaleSeasonThresholds(
  season: SeasonThresholds,
  factor: number,
): SeasonThresholds {
  const out = {} as SeasonThresholds;
  (Object.keys(season) as (PositionGroup | 'Default')[]).forEach(group => {
    out[group] = {} as SeasonThresholds[typeof group];
    const outputGroup = out[group] as Record<StatKey, Threshold>;
    const seasonGroup = (season[group] ?? {}) as Record<StatKey, Threshold>;
    (Object.keys(seasonGroup) as StatKey[]).forEach(key => {
      const threshold = seasonGroup[key];
      if (!threshold) return;
      outputGroup[key] = scaleThresholdsObject(threshold, factor, key);
    });
  });
  return out;
}

export const BENCHMARKS_BY_COHORT: Record<number, Record<BenchmarkCohort, SeasonThresholds>> = Object.entries(
  BENCHMARKS,
).reduce((acc: Record<number, Record<BenchmarkCohort, SeasonThresholds>>, [seasonKey, seasonThresholds]) => {
  const seasonNumber = Number(seasonKey);
  acc[seasonNumber] = {
    Junior: scaleSeasonThresholds(seasonThresholds, COHORT_FACTORS.Junior),
    Youth: scaleSeasonThresholds(seasonThresholds, COHORT_FACTORS.Youth),
    Senior: seasonThresholds,
  };
  return acc;
}, {});

export function deriveQuarterThresholds(
  season: SeasonThresholds,
  factor = QUARTER_FACTOR,
): QuarterThresholds {
  const out = {} as QuarterThresholds;
  (Object.keys(season) as (PositionGroup | 'Default')[]).forEach(group => {
    out[group] = {} as QuarterThresholds[typeof group];
    const outputGroup = out[group] as Record<StatKey, Threshold>;
    const seasonGroup = (season[group] ?? {}) as Record<StatKey, Threshold>;
    (Object.keys(seasonGroup) as StatKey[]).forEach(key => {
      const t = seasonGroup[key];
      if (!t) {
        outputGroup[key] = {};
        return;
      }
      if (isPercent(key)) {
        outputGroup[key] = { ...t };
        return;
      }
      outputGroup[key] = {
        lowerIsBetter: t.lowerIsBetter,
        eliteMin: up(scale(t.eliteMin, factor)),
        aboveMin: up(scale(t.aboveMin, factor)),
        avgMin: up(scale(t.avgMin, factor)),
        rookieMax: down(scale(t.rookieMax, factor)),
      };
    });
  });
  return out;
}

export const BENCHMARKS_QTR: Record<number, QuarterThresholds> = Object.entries(BENCHMARKS).reduce(
  (acc: Record<number, QuarterThresholds>, [seasonKey, seasonThresholds]) => {
    const seasonNumber = Number(seasonKey);
    acc[seasonNumber] = deriveQuarterThresholds(seasonThresholds);
    return acc;
  },
  {},
);

const DEFAULT_GROUP: 'Default' = 'Default';

const getSeasonThresholdsInternal = (season: number, ctx?: BenchmarkContext): SeasonThresholds => {
  const cohort = resolveBenchmarkCohort(ctx);
  const seasonThresholds =
    BENCHMARKS_BY_COHORT[season]?.[cohort] ??
    BENCHMARKS_BY_COHORT[season]?.Senior ??
    BENCHMARKS_BY_COHORT[currentSeason]?.[cohort] ??
    BENCHMARKS_BY_COHORT[currentSeason]?.Senior ??
    BENCHMARKS[currentSeason];

  const scaleFactor = getScaleFactor(ctx);
  if (scaleFactor >= 1) return seasonThresholds;

  const thresholdLiftFactor = SUB20_COHORT_THRESHOLD_LIFT_FACTORS[cohort] ?? 1;
  if (thresholdLiftFactor === 1) return seasonThresholds;

  return scaleSeasonThresholds(seasonThresholds, thresholdLiftFactor);
};

const getQuarterThresholdsInternal = (season: number, ctx?: BenchmarkContext): QuarterThresholds =>
  deriveQuarterThresholds(getSeasonThresholdsInternal(season, ctx));

export function getThresholds(
  season: number,
  group: PositionGroup | 'Default',
  key: StatKey,
  scope: Scope,
  ctx?: BenchmarkContext,
): Threshold {
  const seasonThresholds = getSeasonThresholdsInternal(season, ctx);
  const groupThresholds = (seasonThresholds[group] ?? seasonThresholds[DEFAULT_GROUP] ?? {}) as Record<
    StatKey,
    Threshold
  >;
  const defaultThresholds = (seasonThresholds[DEFAULT_GROUP] ?? {}) as Record<StatKey, Threshold>;
  const game = groupThresholds[key] ?? defaultThresholds[key];

  if (!game) return {};

  const scaleFactor = getScaleFactor(ctx);
  const scopedFactor = scope === 'quarter' ? scaleFactor * QUARTER_FACTOR : scaleFactor;
  const scaled = scaleThresholdsObject(game, scopedFactor, key);
  if (scope === 'quarter' && scaleFactor === 1) {
    const quarterThresholds = getQuarterThresholdsInternal(season, ctx);
    const quarterGroup = (quarterThresholds[group] ?? quarterThresholds[DEFAULT_GROUP] ?? {}) as Record<
      StatKey,
      Threshold
    >;
    return quarterGroup[key] ?? quarterThresholds[DEFAULT_GROUP]?.[key] ?? scaled;
  }
  return scaled;
}
