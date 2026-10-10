// Canonical snapshot of kickchasers-mobile/lib/stats-eval.ts with only the
// native debug logger removed. Calculation behaviour is intentionally unchanged.
import {
  currentSeason,
  getThresholds,
  getScaleFactor,
  resolveBenchmarkCohort,
  type BenchmarkContext,
  type Band,
  type PositionGroup,
  type Scope,
  type StatKey,
  type Threshold,
} from './benchmarks.ts';

const SUB20_COHORT_RATING_LIFTS = {
  Junior: 0.15,
  Youth: 0.08,
  Senior: 0,
} as const;

// evaluate which band a stat value falls into
export function evaluateBand(value: number | null | undefined, th: Threshold): Band {
  if (value == null) return 'Rookie';
  const v = value;
  if (th.lowerIsBetter) {
    if (th.eliteMin != null && v <= th.eliteMin) return 'Elite';
    if (th.aboveMin != null && v <= th.aboveMin) return 'Above Av';
    if (th.avgMin != null && v <= th.avgMin) return 'Average';
    return 'Rookie';
  }

  if (th.eliteMin != null && v >= th.eliteMin) return 'Elite';
  if (th.aboveMin != null && v >= th.aboveMin) return 'Above Av';
  if (th.avgMin != null && v >= th.avgMin) return 'Average';
  return 'Rookie';
}

// unified evaluation entry
export function evaluate(
  stat: StatKey,
  value: number | null | undefined,
  group: PositionGroup | 'Default' = 'Default',
  scope: Scope = 'game',
  season: number = currentSeason,
  ctx?: BenchmarkContext,
): Band {
  const th = getThresholds(season, group, stat, scope, ctx);
  return evaluateBand(value, th);
}

// convert a stat into a 0..1 continuous score
export function scoreStat(value: number | null | undefined, th: Threshold): number {
  if (value == null) return 0;
  const v = value;
  const elite = th.eliteMin ?? undefined;
  const above = th.aboveMin ?? undefined;
  const avg = th.avgMin ?? undefined;
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  if (th.lowerIsBetter) {
    if (elite != null && v <= elite) return 1;
    if (above != null && elite != null && v <= above) {
      return clamp01(0.7 + ((above - v) / Math.max(1, above - elite)) * 0.3);
    }
    if (avg != null && above != null && v <= avg) {
      return clamp01(0.3 + ((avg - v) / Math.max(1, avg - above)) * 0.4);
    }
    return 0;
  }

  if (elite != null && v >= elite) return 1;
  if (above != null && elite != null && v >= above) {
    return clamp01(0.7 + ((v - above) / Math.max(1, elite - above)) * 0.3);
  }
  if (avg != null && above != null && v >= avg) {
    return clamp01(0.3 + ((v - avg) / Math.max(1, above - avg)) * 0.4);
  }
  return 0;
}

// weighting for each stat in the overall rating
const WEIGHTS: Partial<Record<StatKey, number>> = {
  disposals: 2.0,
  contested_possessions: 1.0,
  clearances: 0.9,
  tackles: 0.9,
  contested_marks: 0.9,
  intercepts: 0.8,
  goals: 1.2,
  goal_assists: 0.8,
  inside_50s: 0.6,
  rebound_50s: 0.6,
  kicks: 0.6,
  handballs: 0.6,
  marks: 0.5,
  ground_ball_gets: 0.7,
  one_percenters: 0.6,
  turnovers: 0.7,
  frees_against: 0.2,
};

const EFFICIENCY_BONUS: Record<Band, number> = {
  Rookie: 0,
  Average: 0.2,
  'Above Av': 0.35,
  Elite: 0.5,
};

// main rating function → returns 0–10 (1 decimal)
export function computeGameRating(
  stats: Partial<Record<StatKey, number>>,
  season: number = currentSeason,
  group: PositionGroup | 'Default' = 'Default',
  ctx?: BenchmarkContext,
): number {
  let sum = 0;
  let wsum = 0;
  (Object.keys(WEIGHTS) as StatKey[]).forEach(key => {
    const weight = WEIGHTS[key];
    if (!weight) return;
    const th = getThresholds(season, group, key, 'game', ctx);
    const score = scoreStat(stats[key], th);
    sum += score * weight;
    wsum += weight;
  });

  const effBand = evaluate(
    'disposal_efficiency_pct',
    stats.disposal_efficiency_pct,
    group,
    'game',
    season,
    ctx,
  );
  const bonus = EFFICIENCY_BONUS[effBand] ?? 0;
  const base = wsum > 0 ? sum / wsum : 0;
  const score01 = Math.max(0, Math.min(1, base + bonus / 10));
  return Math.round(score01 * 100) / 10;
}

function scoreFromThreshold(value: number | null | undefined, th: Threshold): number {
  if (value == null) return 0;
  const v = value;
  const e = th.eliteMin ?? null;
  const a = th.aboveMin ?? null;
  const g = th.avgMin ?? null;
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  if (th.lowerIsBetter) {
    if (e != null && v <= e) return 1;
    if (a != null && e != null && v <= a) {
      return clamp01(0.7 + ((a - v) / Math.max(1, a - e)) * 0.3);
    }
    if (g != null && a != null && v <= g) {
      return clamp01(0.3 + ((g - v) / Math.max(1, g - a)) * 0.4);
    }
    return 0;
  }

  if (e != null && v >= e) return 1;
  if (a != null && e != null && v >= a) {
    return clamp01(0.7 + ((v - a) / Math.max(1, e - a)) * 0.3);
  }
  if (g != null && a != null && v >= g) {
    return clamp01(0.3 + ((v - g) / Math.max(1, a - g)) * 0.4);
  }
  return 0;
}

const IMPACT7_STATS: StatKey[] = [
  'hitouts',
  'disposals',
  'tackles',
  'goals',
  'behinds',
  'marks',
  'fantasy_points',
  'frees_for',
  'frees_against',
];

export type Impact7Group = 'Default' | 'Mid' | 'Forward' | 'Ruck' | 'Defender';

const DEFAULT_WEIGHTS: Partial<Record<StatKey, number>> = {
  goals: 0.45,
  disposals: 2.0,
  tackles: 0.6,
  marks: 0.7,
  behinds: 0.2,
  fantasy_points: 0.35,
  frees_for: 0.05,
  frees_against: -0.05,
};

export const IMPACT7_WEIGHTS_BY_GROUP: Record<Impact7Group, Partial<Record<StatKey, number>>> = {
  Default: DEFAULT_WEIGHTS,
  Mid: {
    disposals: 2.7,
    tackles: 0.38,
    goals: 0.2,
    behinds: 0.25,
    marks: 0.82,
    fantasy_points: 0.3,
    frees_for: 0.05,
    frees_against: -0.05,
  },
  Forward: {
    disposals: 2.4,
    tackles: 0.5,
    goals: 1.0,
    behinds: 0.05,
    marks: 1.4,
    fantasy_points: 0.4,
    frees_for: 0.05,
    frees_against: -0.05,
  },
  Ruck: {
    hitouts: 0.35,
    disposals: 0.2,
    marks: 0.15,
    tackles: 0.1,
    fantasy_points: 0.1,
    goals: 0.04,
    behinds: 0.01,
    frees_for: 0.025,
    frees_against: -0.025,
  },
  Defender: {
    disposals: 1.4,
    tackles: 1.0,
    goals: 0.15,
    behinds: 0.05,
    marks: 1.45,
    fantasy_points: 0.4,
    frees_for: 0.05,
    frees_against: -0.05,
  },
};

const IMPACT7_MIN_ACTIVE_RATING = 1.7;

type Impact7MilestoneRule = {
  key: Impact7MilestoneStat;
  threshold: number;
  bonus: number;
  label: string;
};

const IMPACT7_MILESTONE_STATS = ['hitouts', 'goals', 'tackles', 'marks', 'disposals'] as const;

type Impact7MilestoneStat = (typeof IMPACT7_MILESTONE_STATS)[number];

type Impact7MilestoneRuleSet = {
  tier1: Impact7MilestoneRule;
  tier2: Impact7MilestoneRule;
};

const IMPACT7_MILESTONE_RULES: Record<
  Impact7Group,
  Partial<Record<Impact7MilestoneStat, Impact7MilestoneRuleSet>>
> = {
  Default: {
    goals: {
      tier1: { key: 'goals', threshold: 2, bonus: 0.18, label: 'Goals 2+' },
      tier2: { key: 'goals', threshold: 4, bonus: 0.4, label: 'Goals 4+' },
    },
    tackles: {
      tier1: { key: 'tackles', threshold: 5, bonus: 0.15, label: 'Tackles 5+' },
      tier2: { key: 'tackles', threshold: 10, bonus: 0.35, label: 'Tackles 10+' },
    },
    marks: {
      tier1: { key: 'marks', threshold: 5, bonus: 0.15, label: 'Marks 5+' },
      tier2: { key: 'marks', threshold: 10, bonus: 0.35, label: 'Marks 10+' },
    },
    disposals: {
      tier1: { key: 'disposals', threshold: 30, bonus: 0.18, label: 'Disposals 30+' },
      tier2: { key: 'disposals', threshold: 40, bonus: 0.4, label: 'Disposals 40+' },
    },
  },
  Forward: {
    goals: {
      tier1: { key: 'goals', threshold: 2, bonus: 0.1, label: 'Goals 2+' },
      tier2: { key: 'goals', threshold: 4, bonus: 0.28, label: 'Goals 4+' },
    },
    tackles: {
      tier1: { key: 'tackles', threshold: 5, bonus: 0.06, label: 'Tackles 5+' },
      tier2: { key: 'tackles', threshold: 10, bonus: 0.16, label: 'Tackles 10+' },
    },
    marks: {
      tier1: { key: 'marks', threshold: 5, bonus: 0.28, label: 'Marks 5+' },
      tier2: { key: 'marks', threshold: 10, bonus: 0.48, label: 'Marks 10+' },
    },
    disposals: {
      tier1: { key: 'disposals', threshold: 30, bonus: 0.4, label: 'Disposals 30+' },
      tier2: { key: 'disposals', threshold: 40, bonus: 0.64, label: 'Disposals 40+' },
    },
  },
  Mid: {
    goals: {
      tier1: { key: 'goals', threshold: 2, bonus: 0.24, label: 'Goals 2+' },
      tier2: { key: 'goals', threshold: 4, bonus: 0.5, label: 'Goals 4+' },
    },
    tackles: {
      tier1: { key: 'tackles', threshold: 5, bonus: 0.18, label: 'Tackles 5+' },
      tier2: { key: 'tackles', threshold: 10, bonus: 0.42, label: 'Tackles 10+' },
    },
    marks: {
      tier1: { key: 'marks', threshold: 5, bonus: 0.08, label: 'Marks 5+' },
      tier2: { key: 'marks', threshold: 10, bonus: 0.2, label: 'Marks 10+' },
    },
    disposals: {
      tier1: { key: 'disposals', threshold: 30, bonus: 0.18, label: 'Disposals 30+' },
      tier2: { key: 'disposals', threshold: 40, bonus: 0.4, label: 'Disposals 40+' },
    },
  },
  Ruck: {
    hitouts: {
      tier1: { key: 'hitouts', threshold: 35, bonus: 0.12, label: 'Hitouts 35+' },
      tier2: { key: 'hitouts', threshold: 40, bonus: 1.5, label: 'Hitouts 40+' },
    },
    disposals: {
      tier1: { key: 'disposals', threshold: 20, bonus: 0.08, label: 'Disposals 20+' },
      tier2: { key: 'disposals', threshold: 30, bonus: 0.18, label: 'Disposals 30+' },
    },
    marks: {
      tier1: { key: 'marks', threshold: 7, bonus: 0.08, label: 'Marks 7+' },
      tier2: { key: 'marks', threshold: 10, bonus: 0.18, label: 'Marks 10+' },
    },
  },
  Defender: {
    goals: {
      tier1: { key: 'goals', threshold: 2, bonus: 0.05, label: 'Goals 2+' },
      tier2: { key: 'goals', threshold: 4, bonus: 0.12, label: 'Goals 4+' },
    },
    tackles: {
      tier1: { key: 'tackles', threshold: 5, bonus: 0.24, label: 'Tackles 5+' },
      tier2: { key: 'tackles', threshold: 10, bonus: 0.5, label: 'Tackles 10+' },
    },
    marks: {
      tier1: { key: 'marks', threshold: 5, bonus: 0.24, label: 'Marks 5+' },
      tier2: { key: 'marks', threshold: 10, bonus: 0.5, label: 'Marks 10+' },
    },
    disposals: {
      tier1: { key: 'disposals', threshold: 30, bonus: 0.16, label: 'Disposals 30+' },
      tier2: { key: 'disposals', threshold: 40, bonus: 0.34, label: 'Disposals 40+' },
    },
  },
};

export type Impact7MilestoneBonus = {
  key: StatKey;
  threshold: number;
  bonus: number;
  label: string;
  value: number;
};

export type Impact7RatingBreakdown = {
  rating: number;
  baseRating: number;
  milestoneBonus: number;
  milestones: Impact7MilestoneBonus[];
  normalizedScore01: number;
  group: Impact7Group;
  thresholdGroup: PositionGroup | 'Default';
};

export function computeImpact7MilestoneBonuses(
  stats: Partial<Record<StatKey, number>>,
  group: Impact7Group = 'Default',
): Impact7MilestoneBonus[] {
  const ruleSet = IMPACT7_MILESTONE_RULES[group] ?? IMPACT7_MILESTONE_RULES.Default;

  return IMPACT7_MILESTONE_STATS.flatMap(key => {
    const value = stats[key];
    if (value == null) return [];

    const rules = ruleSet[key];
    if (!rules) return [];
    const selectedRule =
      value >= rules.tier2.threshold
        ? rules.tier2
        : value >= rules.tier1.threshold
          ? rules.tier1
          : null;

    if (!selectedRule) return [];

    return [
      {
        ...selectedRule,
        value,
      },
    ];
  });
}

export function computeGameRatingImpact7Breakdown(
  stats: Partial<Record<StatKey, number>>,
  season: number = currentSeason,
  group: PositionGroup | Impact7Group = 'Default',
  ctx?: BenchmarkContext,
  debugKey?: string | number | null,
): Impact7RatingBreakdown {
  const normalizedGroup = String(group ?? 'Default').toLowerCase();
  const weightGroup: Impact7Group = normalizedGroup.includes('forward')
    ? 'Forward'
    : normalizedGroup.includes('ruck')
      ? 'Ruck'
      : normalizedGroup.includes('defender')
        ? 'Defender'
        : normalizedGroup.includes('mid')
          ? 'Mid'
          : group === 'Mid'
            ? 'Mid'
            : group === 'Forward' || group === 'Defender'
              ? group
              : 'Default';
  const thresholdGroup: PositionGroup | 'Default' = normalizedGroup.includes('forward')
    ? 'General Forward'
    : normalizedGroup.includes('ruck')
      ? 'Ruck'
      : normalizedGroup.includes('defender')
        ? 'General Defender'
        : normalizedGroup.includes('mid')
          ? 'Mid'
          : group === 'Mid'
            ? 'Mid'
            : 'Default';
  const weights = IMPACT7_WEIGHTS_BY_GROUP[weightGroup] ?? IMPACT7_WEIGHTS_BY_GROUP.Default;
  let sum = 0;
  let wsum = 0;
  let hasPositiveValue = false;

  for (const key of IMPACT7_STATS) {
    const rawWeight = weights[key] ?? 0;
    const w = Math.abs(rawWeight);
    if (w === 0) continue;

    const rawValue = stats[key];
    if (rawValue == null) continue;
    if (rawValue > 0) hasPositiveValue = true;

    const th = getThresholds(season, thresholdGroup, key, 'game', ctx);
    const s01 = scoreFromThreshold(rawValue, th);
    sum += s01 * w;
    wsum += w;
  }

  if (!hasPositiveValue || wsum <= 0) {
    return {
      rating: 0,
      baseRating: 0,
      milestoneBonus: 0,
      milestones: [],
      normalizedScore01: 0,
      group: weightGroup,
      thresholdGroup,
    };
  }

  const normalizedScore01 = Math.max(0, Math.min(1, sum / wsum));
  const baseRating01 =
    IMPACT7_MIN_ACTIVE_RATING / 10 +
    normalizedScore01 * ((10 - IMPACT7_MIN_ACTIVE_RATING) / 10);
  const milestones = computeImpact7MilestoneBonuses(stats, weightGroup);
  const milestoneBonus = milestones.reduce((total, milestone) => total + milestone.bonus, 0);
  const baseRating = Math.round(Math.max(0, Math.min(1, baseRating01)) * 100) / 10;
  const cohort = resolveBenchmarkCohort(ctx);
  const scaleFactor = getScaleFactor(ctx);
  const sub20Lift = scaleFactor < 1 ? SUB20_COHORT_RATING_LIFTS[cohort] ?? 0 : 0;
  const rating = Math.round(Math.max(0, Math.min(10, baseRating + milestoneBonus + sub20Lift)) * 10) / 10;

  return {
    rating,
    baseRating,
    milestoneBonus,
    milestones,
    normalizedScore01,
    group: weightGroup,
    thresholdGroup,
  };
}

export function computeGameRatingImpact7(
  stats: Partial<Record<StatKey, number>>,
  season: number = currentSeason,
  group: PositionGroup | Impact7Group = 'Default',
  ctx?: BenchmarkContext,
  debugKey?: string | number | null,
): number {
  return computeGameRatingImpact7Breakdown(stats, season, group, ctx, debugKey).rating;
}
