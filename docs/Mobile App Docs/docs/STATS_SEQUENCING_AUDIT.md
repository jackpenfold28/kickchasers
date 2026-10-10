# Stats Sequencing Audit

Status: historical implementation audit; file/line references may drift
Last verified: 2026-07-23
Source of truth: this file for the historical audit; active tracker handlers and `STATS_SEQUENCING.md` for current behaviour

## Spec recap (from `docs/STATS_SEQUENCING.md`)
The iPad team tracker defines a sequence that starts with an active player selection, optionally records GBG/HR, then records a base stat (K/HB/M) which opens a CON/UC prompt followed by EFF/IN-EFF. Modifiers are pressable at any time, but only base stats require an active player. When base + CON/UC + EFF/IN-EFF are all set, derived stats are recorded and the sequence resets (clearing the active player). Quarter changes reset sequencing state. Undo does not rewind sequencing state.

## Tracker implementations (paths)
- iPad team tracker (source of truth): `app/new-game/team-tracker/game.tsx`
- Phone team tracker UI: `components/team-tracker/PhoneTeamTracker.tsx` (sequencing handlers live in `app/new-game/team-tracker/game.tsx`)
- Single-player tracker screen: `app/tracker.tsx`

## State machines

### iPad team tracker (expected)
State variables (key sequencing control):
- `activePlayerId` (store) and local sequencing state in `app/new-game/team-tracker/game.tsx:2451-3162`
- `modifierPromptStage`, `selectedGbgHr`, `selectedConUc`, `selectedEff`, `baseStatInSequence`, `sequenceAnimatingComplete`

States:
- Idle: `activePlayerId = null`, `modifierPromptStage = none`
- PlayerSelected: `activePlayerId != null`, `modifierPromptStage = gbg_or_hr`
- BaseStatSet: `baseStatInSequence = K/HB/M`, `modifierPromptStage = con_or_uc`
- ConUcSelected: `selectedConUc != null`, `modifierPromptStage = eff_or_ineff`
- EffSelected: `selectedEff != null`
- SequenceComplete: `sequenceAnimatingComplete = true` (then resets)

Transitions / triggers:
- Select player → `handleSelectPlayer` sets `activePlayerId`, starts quarter timer, primes `gbg_or_hr` (`app/new-game/team-tracker/game.tsx:2985-2993`).
- Tap GBG/HR → `handleSelectModifier` calls `handlePressStat`, records event, clears `gbg_or_hr` prompt (`app/new-game/team-tracker/game.tsx:3115-3123`).
- Tap base stat K/HB/M → `handlePressStat` records event, sets `baseStatInSequence`, advances prompt to `con_or_uc` (`app/new-game/team-tracker/game.tsx:3016-3060`).
- Tap CON/UC → `handleSelectModifier` sets `selectedConUc`, advances prompt to `eff_or_ineff` (`app/new-game/team-tracker/game.tsx:3125-3131`).
- Tap EFF/IN-EFF → `handleSelectModifier` sets `selectedEff` (`app/new-game/team-tracker/game.tsx:3134-3138`).
- Completion when base + CON/UC + EFF/IN-EFF present → `recordDerivedModifierStats` + `triggerSequenceComplete`, then reset + `activePlayerId = null` (`app/new-game/team-tracker/game.tsx:3143-3013`).
- Quarter change → `handleSelectQuarter` pauses timers and clears player + sequencing state (`app/new-game/team-tracker/game.tsx:2590-2595`).
- Undo → removes event only, no sequencing state changes (`app/new-game/team-tracker/game.tsx:3152-3162`).

Gating / UI:
- Stat pad disabled when `!activePlayerId` (`app/new-game/team-tracker/game.tsx:3816-3818`) and guarded in `handlePressStat` (`app/new-game/team-tracker/game.tsx:3016-3025`).
- Modifiers always pressable (no disabled prop); GBG/HR still blocked by player guard in `handlePressStat`.
- Timer starts on first player selection (`handleSelectPlayer`), and also on first stat capture (`handlePressStat`).

### Phone team tracker
Sequencing state lives in `app/new-game/team-tracker/game.tsx` (same handlers as iPad), but phone UI uses different selection flow:
- `PhoneTeamTracker` auto-selects the first player if none is active (`components/team-tracker/PhoneTeamTracker.tsx:160-168`).
- `PhoneTeamTracker` uses `onSelectPlayer={setActivePlayer}` instead of `handleSelectPlayer` (`app/new-game/team-tracker/game.tsx:3694-3696`).

Implications to state machine:
- Player selection on phone does **not** call `primeSequenceForPlayer` or `ensureQuarterTimerStarted` (only `handleSelectPlayer` does, `app/new-game/team-tracker/game.tsx:2985-2989`).
- Modifier prompt stage (`gbg_or_hr`) is not set on player selection; it stays at whatever it was previously (often `none`).
- Timer does not start on first player selection; it starts on first stat via `handlePressStat`.

Gating / UI:
- Base stat buttons are disabled via `actionButtonsForPhone` when `!activePlayerId` (`app/new-game/team-tracker/game.tsx:3437-3449`), but auto-selection removes the “idle” state.

### Single-player tracker (`app/tracker.tsx`)
State variables (sequencing control):
- `lastBase`, `pendingContest`, `pendingEffectiveness`, `activeModifier`, `activeBaseStat`, `sequenceFlash` (`app/tracker.tsx:1000-1045`).

States:
- Idle: `lastBase = null`, `pendingContest = false`, `pendingEffectiveness = false`.
- BaseSelectedAwaitContest: `lastBase = K/HB/M`, `pendingContest = true`.
- AwaitEffectiveness: `pendingEffectiveness = true` (after CON/UC).
- Complete: after EFF/INEF derived stat, resets `lastBase/pending*` and pulses `sequenceFlash`.

Transitions / triggers:
- Tap base stat K/HB/M → `addStat` records event and sets `lastBase`, `pendingContest=true` (`app/tracker.tsx:2117-2126`).
- Tap GBG/HR → `applyModifier` records event and clears pending state (`app/tracker.tsx:2171-2180`).
- Tap CON/UC:
  - If no `lastBase`, it **records CON/UC immediately** (`app/tracker.tsx:2183-2187`).
  - If `lastBase` is M, records `MC/MUC` and clears (`app/tracker.tsx:2191-2201`).
  - If `lastBase` is K/HB, records CON/UC and sets `pendingEffectiveness` (`app/tracker.tsx:2205-2212`).
- Tap EFF/INEF (EF/INEF IDs) → records derived `K_EF/K_IF/HB_EF/HB_IF`, clears pending (`app/tracker.tsx:2215-2235`).
- Undo → recomputes modifier state from history (`app/tracker.tsx:2000-2038`).
- Quarter change → does **not** reset modifier state; only toggles timer (`app/tracker.tsx:1047-1068`).

Gating / UI:
- Modifiers are disabled unless their pending state allows them (`app/tracker.tsx:1097-1149`).
- Timer starts on first stat recorded (`app/tracker.tsx:2117-2118`).

## Diff vs spec table

| Spec rule (name/step) | iPad implementation | Phone team implementation | Single-player implementation | Notes / risk |
| --- | --- | --- | --- | --- |
| Sequencing lock: base stats require an active player; grid disabled when no player | ✅ `handlePressStat` guard + `StatPadGrid disabled` (`app/new-game/team-tracker/game.tsx:3016-3025`, `app/new-game/team-tracker/game.tsx:3816-3818`) | ✅ `handlePressStat` guard + phone action buttons disabled when `!activePlayerId` (`app/new-game/team-tracker/game.tsx:3016-3025`, `app/new-game/team-tracker/game.tsx:3437-3449`) | ❌ No player gate in single-player (no active player concept) | Spec expects player gating; single-player is intentionally different, but sequencing parity beyond player UX is still off. |
| Player selection primes `gbg_or_hr` prompt and starts quarter timer | ✅ `handleSelectPlayer` (`app/new-game/team-tracker/game.tsx:2985-2989`) | ❌ Phone uses `setActivePlayer` directly; no prime/timer (`app/new-game/team-tracker/game.tsx:3694-3696`) | N/A (no player selection); timer starts on first stat (`app/tracker.tsx:2117-2118`) | Phone misses the prompt stage and “timer on player select” rule. |
| Modifiers are pressable at any time (no disabled state), but only GBG/HR record events | ✅ `handleSelectModifier` only records GBG/HR (`app/new-game/team-tracker/game.tsx:3115-3138`) | ✅ Same handler | ❌ Modifiers are disabled by pending state; CON/UC can record events even with no base (`app/tracker.tsx:1097-1149`, `app/tracker.tsx:2183-2187`) | Single-player sequencing diverges in both availability and event creation. |
| Modifiers can be selected before the base stat | ✅ Allowed; CON/UC/EFF/IN-EFF can be selected anytime (`app/new-game/team-tracker/game.tsx:3125-3138`) | ✅ Same handler | ❌ Disabled until pending state; EFF/INEF requires pendingEffectiveness (`app/tracker.tsx:1097-1149`) | Single-player enforces order, contrary to spec. |
| Base stats K/HB/M set base-in-sequence and advance prompt to CON/UC | ✅ `handlePressStat` (`app/new-game/team-tracker/game.tsx:3050-3057`) | ✅ Same handler | ✅ Sets `lastBase` + `pendingContest` (`app/tracker.tsx:2120-2126`) | Similar effect, but single-player uses different prompt model and disables modifiers until then. |
| Sequence completion: base + CON/UC + EFF/IN-EFF ⇒ derived stat(s) + reset + clear active player | ✅ `recordDerivedModifierStats` + `triggerSequenceComplete` (`app/new-game/team-tracker/game.tsx:3068-3149`, `app/new-game/team-tracker/game.tsx:2995-3013`) | ✅ Same handler | ❌ Derived stat recorded on EFF/INEF, but CON/UC is also recorded as its own stat; no active player clear (`app/tracker.tsx:2205-2235`) | Single-player logs extra stats and does not mirror reset behavior. |
| Quarter change resets sequencing state | ✅ `handleSelectQuarter` resets player + sequence (`app/new-game/team-tracker/game.tsx:2590-2595`) | ✅ Same handler | ❌ `handleQuarterPress` does not reset modifier state (`app/tracker.tsx:1047-1068`) | Single-player can carry pending modifiers across quarters. |
| Undo does not affect sequencing state | ✅ `handleUndo` only removes event (`app/new-game/team-tracker/game.tsx:3152-3162`) | ✅ Same handler | ❌ State is derived from history and changes after undo (`app/tracker.tsx:2000-2038`) | Single-player undo rewinds sequencing; iPad does not. |
| Modifiers only apply to the next base stat and then clear | ✅ Sequence resets after completion (`app/new-game/team-tracker/game.tsx:2995-3013`) | ✅ Same handler | ❌ CON/UC can be recorded without a base; modifier state persists until explicitly completed (`app/tracker.tsx:2183-2212`) | Single-player allows modifiers as standalone stats. |
| Modifier prompt glow/pulse matches iPad spec (gbg_or_hr → con_or_uc → eff_or_ineff) | ✅ `shouldFlashModifier` + `StatGroupSelector` glow/pulse (`app/new-game/team-tracker/game.tsx:3179-3205`, `app/new-game/team-tracker/game.tsx:1765-1904`) | ❌ Phone uses pulsing scale only and prompt stage often never set (player select bypasses prime) (`components/team-tracker/PhoneTeamTracker.tsx:476-513`, `app/new-game/team-tracker/game.tsx:3694-3696`) | ❌ Different prompt model; modifiers disabled by pending state, and flash logic is history-driven (`app/tracker.tsx:1097-1149`, `app/tracker.tsx:2000-2038`) | Phone loses glow state and prompt timing; single-player uses a different cue system. |
| Base stat highlight/pulse behavior matches iPad stat pad | ✅ Base stat highlight only for K/HB/M when not animating; completion pulse uses `sequenceCompleteStyle` (`app/new-game/team-tracker/game.tsx:1937-1961`) | ❌ Phone `ActionGrid` uses `activeStatId=baseStatInSequence` and `flashingStatId` simultaneously, so active highlight can persist during completion (`app/new-game/team-tracker/game.tsx:3698-3701`, `components/tracker/ActionButton.tsx:29-64`) | ❌ Single-player uses different flash model (`sequenceFlash`) and does not mirror the iPad “selected base unless animating” rule (`app/tracker.tsx:2000-2038`, `app/tracker.tsx:2250-2255`) | Visual cue parity is not guaranteed on phone or single-player. |

## Diff between implementations

### Phone vs iPad mismatches
- Player selection bypasses sequencing prime + timer start: phone uses `setActivePlayer` directly (`app/new-game/team-tracker/game.tsx:3694-3696`) while iPad uses `handleSelectPlayer` to prime `gbg_or_hr` and start the timer (`app/new-game/team-tracker/game.tsx:2985-2989`).
- Phone auto-selects the first player without a user action, skipping the idle state and prompt setup (`components/team-tracker/PhoneTeamTracker.tsx:160-168`).
- Modifier cue visuals differ: iPad uses glow + neon outline + pulse, phone uses pulsing scale only and no glow/outline styling (`app/new-game/team-tracker/game.tsx:1765-1904` vs `components/team-tracker/PhoneTeamTracker.tsx:476-513`).
- Base stat highlight differs: iPad removes base highlight during completion pulse; phone can show active highlight and flashing at the same time (`app/new-game/team-tracker/game.tsx:1937-1961`, `app/new-game/team-tracker/game.tsx:3698-3701`).

### Single-player vs iPad mismatches (excluding player-selection UX)
- Modifiers are disabled until pending state; iPad modifiers are always enabled (`app/tracker.tsx:1097-1149`).
- CON/UC records a stat even with no base selected; iPad treats CON/UC as selection-only and records no event (`app/tracker.tsx:2183-2187` vs `app/new-game/team-tracker/game.tsx:3125-3131`).
- K/HB/M sequence order is enforced (must select CON/UC then EFF/INEF), while iPad allows modifiers before base (`app/tracker.tsx:1097-1149`, `app/tracker.tsx:2205-2235`).
- Quarter change does not reset sequencing state in single-player (`app/tracker.tsx:1047-1068` vs `app/new-game/team-tracker/game.tsx:2590-2595`).
- Undo recalculates sequencing state in single-player (`app/tracker.tsx:2000-2038`), while iPad leaves sequencing state untouched (`app/new-game/team-tracker/game.tsx:3152-3162`).
- Derived modifier recording differs: single-player records CON/UC as a stat and then derives K_EF/HB_EF on EFF/INEF (`app/tracker.tsx:2205-2235`), while iPad only records derived stats on completion (`app/new-game/team-tracker/game.tsx:3068-3149`).
- Visual cue model differs: single-player uses `sequenceFlash` and disabled modifiers rather than iPad’s prompt glow + selected outline + completion pulse (`app/tracker.tsx:1097-1149`, `app/tracker.tsx:2000-2038`).

## Fix plan (no code)

Phone team tracker:
- Route player selection through `handleSelectPlayer` instead of `setActivePlayer` in `app/new-game/team-tracker/game.tsx` so the timer start + `gbg_or_hr` prime run on phone.
- Remove or gate the `PhoneTeamTracker` auto-select effect (`components/team-tracker/PhoneTeamTracker.tsx:160-168`) so the phone respects the idle state until a deliberate player selection occurs.
- Align modifier cue visuals with iPad (`StatGroupSelector`): add prompt glow + selected outline + completion pulse to phone modifier tabs, and ensure `modifierPromptStage` is actually primed on player selection so the same glow stages appear.
- Align base stat highlight/pulse behavior: match iPad’s “base highlight suppressed during completion pulse” rule on phone action grid.

Single-player tracker:
- Replace `pendingContest/pendingEffectiveness` gating so modifiers are always selectable (mirroring iPad), and treat CON/UC/EFF/INEF selections as state only (no event writes) until sequence completion.
- Align completion logic with iPad: only record derived stats when base + CON/UC + EFF/INEF are present; remove standalone CON/UC event logging in `applyModifier`.
- Reset sequencing state on quarter change in `handleQuarterPress` (clear `lastBase`, `pending*`, `activeModifier`, `activeBaseStat`, `sequenceFlash`).
- Keep undo behavior consistent with iPad by not recomputing sequencing state from `eventHistory` (or explicitly preserve current sequencing state when undoing).
- Ensure modifier IDs/keys match iPad (`EFF` / `IN-EFF` naming vs `EF` / `INEF`) to avoid mismatched stat keys in derived logic.
- Align modifier cue visuals with iPad (prompt glow + selected outline + completion pulse) instead of the current `sequenceFlash` + disabled-tabs model.
