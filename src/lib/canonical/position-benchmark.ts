import type { PositionGroup } from './benchmarks.ts'
import type { Impact7Group } from './stats-eval.ts'
import { normalizePlayerPosition } from './positions.ts'

const HISTORICAL_FORWARD_GROUPS = new Set(['FWD/MID', 'MID/FWD'])
const HISTORICAL_DEFENDER_GROUPS = new Set(['MID/DEF', 'DEF/MID'])

const normalizePosition = (positionCode?: string | null) => positionCode?.trim().toUpperCase() ?? ''

export function resolveBenchmarkGroup(positionCode?: string | null): Impact7Group {
  const normalized = normalizePosition(positionCode)
  const canonical = normalizePlayerPosition(positionCode)
  if (canonical === 'RUC') return 'Ruck'
  if (canonical === 'FWD' || HISTORICAL_FORWARD_GROUPS.has(normalized)) return 'Forward'
  if (canonical === 'DEF' || HISTORICAL_DEFENDER_GROUPS.has(normalized)) return 'Defender'
  if (canonical === 'MID') return 'Mid'
  return 'Default'
}

export function resolveThresholdBenchmarkGroup(positionCode?: string | null): PositionGroup | 'Default' {
  const normalized = normalizePosition(positionCode)
  const canonical = normalizePlayerPosition(positionCode)
  if (canonical === 'RUC') return 'Ruck'
  if (canonical === 'FWD' || HISTORICAL_FORWARD_GROUPS.has(normalized)) return 'General Forward'
  if (canonical === 'DEF' || HISTORICAL_DEFENDER_GROUPS.has(normalized)) return 'General Defender'
  if (canonical === 'MID') return 'Mid'
  return 'Default'
}
