# AFL Player Benchmarking

Last verified: 2026-08-12
Source of truth: benchmark definitions and consumers under `lib/` and profile/summary components; implementation values override this explanation

This document defines the per-game benchmarking bands used across the Kickchasers app. Benchmarks translate raw stat totals into qualitative tiers so players can quickly understand how their performance stacks up against typical AFL standards.

## Bands & Colours

| Band        | Colour (hex) | Description                      |
|-------------|--------------|----------------------------------|
| Elite       | `#1E63FF`    | Top-tier AFL output              |
| Above Av    | `#2EAC66`    | Strong contribution above median |
| Average     | `#D79A00`    | Solid AFL-level performance      |
| Rookie      | `#D86C45`    | Developing / below AFL average   |

All chips and bars in the UI use these colours. In dark themes we lighten the background tint to preserve contrast.

## Scope & Assumptions

- **Competition**: AFL (senior level).
- **Unit**: Per-game totals (not per-minute).
- **Positioning**: The selectable domain is `FWD`, `MID`, `RUC`, and `DEF`. These resolve to General Forward, Mid, Ruck, and General Defender profiles. Unknown values use Default. Dormant Key Forward and Key Defender profiles are not selectable.
- **Season specificity**: Benchmarks can vary by season. The current configuration ships with **season 2025**.
- **Threshold type**: Fixed numeric cut-offs. Future work may allow percentile-based bands.

## Position Groups

Position groups are referenced in code and documentation:

The live mapping is `FWD → General Forward`, `MID → Mid`, `RUC → Ruck`, and `DEF → General Defender`. Key Forward and Key Defender remain dormant for a future taxonomy expansion.

## Stat Keys

Benchmarks exist for the following per-game statistics:

`disposals`, `kicks`, `handballs`, `marks`, `tackles`, `goals`, `goals_behinds`, `contested_possessions`, `uncontested_possessions`, `disposal_efficiency_pct`, `turnovers`, `intercepts`, `goal_assists`, `one_percenters`, `ground_ball_gets`, `hitouts`

> Notes: we currently skip benchmarking for behinds directly; the `goals_behinds` stat captures scoring efficiency.

## Threshold Encoding

Each threshold entry defines the minimum (or maximum when lower is better) values required to achieve a band. For higher-is-better metrics we encode:

```ts
{
  eliteMin: number;   // value >= eliteMin => Elite
  aboveMin: number;   // else value >= aboveMin => Above Av
  avgMin: number;     // else value >= avgMin => Average
  rookieMax: number;  // values <= rookieMax are Rookie
}
```

For lower-is-better stats (e.g., turnovers) we flag `lowerIsBetter: true` and interpret the same numbers from the low end upward: value ≤ eliteMin ⇒ Elite, ≤ aboveMin ⇒ Above Av, ≤ avgMin ⇒ Average, else Rookie. For these cases we usually set `rookieMax` to a high sentinel (e.g., 99) to keep the shape consistent.

## Season 2025 Default Thresholds

The table below lists the default per-game thresholds shared by all position groups for the **2025** season.

| Stat | Rookie | Average | Above Av | Elite | Notes |
|------|--------|---------|------------|-------|-------|
| Disposals | ≤13 | 14–21 | 22–29 | ≥30 | Higher is better |
| Kicks | ≤6 | 7–11 | 12–15 | ≥16 |  |
| Handballs | ≤5 | 6–9 | 10–13 | ≥14 |  |
| Marks | ≤2 | 3–5 | 6–8 | ≥9 |  |
| Tackles | ≤2 | 3–5 | 6–7 | ≥8 |  |
| Goals | 0 | 1 | 2–3 | ≥4 | Lower bands are discrete totals |
| Goals/Behinds (ratio) | <0.3 | 0.3–0.9 | 1.0–1.9 | ≥2.0 | Treated as ratio when data exists |
| Contested Possessions | ≤3 | 4–7 | 8–11 | ≥12 |  |
| Uncontested Possessions | ≤6 | 7–11 | 12–17 | ≥18 |  |
| Disposal Efficiency % | <50 | 50–64 | 65–74 | ≥75 | Percentage (0–100) |
| Turnovers | ≥8 | 6–7 | 4–5 | ≤3 | Lower is better |
| Intercepts | ≤2 | 3–5 | 6–7 | ≥8 |  |
| Goal Assists | 0 | 1 | 2 | ≥3 |  |
| One-Percenters | ≤1 | 2–4 | 5–7 | ≥8 |  |
| Ground Ball Gets | ≤3 | 4–6 | 7–9 | ≥10 |  |

### Additional Benchmarked Stats (Per Game)

| Stat | Rookie | Average | Above Av | Elite | Notes |
|------|--------|---------|------------|-------|-------|
| Contested marks | 0 | 1 | 3 | ≥4 |  |
| Clearances | ≤2 | 3–5 | 6–7 | ≥8 |  |
| Inside 50s | ≤2 | 3–4 | 5–6 | ≥7 |  |
| Rebound 50s | ≤2 | 3–4 | 5–6 | ≥7 |  |
| Hitouts | ≤14 | 15–24 | 25–34 | ≥35 | Generic Default profile |
| Frees for | 0 | 1–2 | 3–4 | ≥5 |  |
| Frees against | ≥5 | 3–4 | 2 | ≤1 | Lower is better |
| Behinds | 0 | 1 | 2 | ≥3 | Included by request; may not indicate positive impact |
| Fantasy points | ≤59 | 60–89 | 90–119 | ≥120 |  |

## Active Ruck profile

Ruck uses the existing continuous benchmark curve and the normal cohort/quarter-length scaling architecture.

| Stat | Rookie | Average | Above Av | Elite | Impact 7 weight |
|------|--------|---------|----------|-------|-----------------|
| Hitouts | 0–11 | 12–23 | 24–34 | 35+ | 35% |
| Disposals | 0–7 | 8–13 | 14–19 | 20+ | 20% |
| Marks | 0–1 | 2–3 | 4–6 | 7+ | 15% |

Ruck is a normal Impact 7 positional configuration, not a separate formula. Its remaining weights are Tackles 10%, Fantasy Points 10%, scoring contribution 5% (Goals 4%, Behinds 1%), and free-kick contribution 5% (Frees For 2.5%, Frees Against 2.5% using the existing lower-is-better threshold treatment). Hitouts and every other input use the same continuous threshold scoring, normalization, cohort scaling, and 0–10 output as other positions.

Ruck milestone bonuses use the existing positional milestone layer: 35 Hitouts adds 0.12 and 40+ Hitouts adds 1.5, recognising truly dominant primary ruck output; 20/30 Disposals add 0.08/0.18, and 7/10 Marks add 0.08/0.18. Forward, Mid and Defender weights and milestones are unchanged. Explicit manual rating overrides remain authoritative.

## Future Enhancements

- **Percentile-based bands**: convert thresholds to dynamic percentiles once we ingest league-wide data.
- **Position expansion**: decide whether to expose the dormant Key Forward and Key Defender profiles in a dedicated taxonomy stage.
- **Season archives**: add past season entries into the `BENCHMARKS` map for historical comparison.

Keep this document in sync with updates to `constants/benchmarks.ts` so UI and logic always reflect the source of truth.
