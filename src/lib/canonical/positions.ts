export type CanonicalPlayerPosition = 'FWD' | 'MID' | 'RUC' | 'DEF'

export type PlayerPositionOption = {
  code: CanonicalPlayerPosition
  label: string
  shortLabel: string
  order: number
}

export const PLAYER_POSITIONS = [
  { code: 'FWD', label: 'Forward', shortLabel: 'FWD', order: 0 },
  { code: 'MID', label: 'Midfield', shortLabel: 'MID', order: 1 },
  { code: 'RUC', label: 'Ruck', shortLabel: 'RUC', order: 2 },
  { code: 'DEF', label: 'Defender', shortLabel: 'DEF', order: 3 },
] as const satisfies readonly PlayerPositionOption[]

const PLAYER_POSITION_ALIASES: Readonly<Record<string, CanonicalPlayerPosition>> = {
  FWD: 'FWD',
  FORWARD: 'FWD',
  FORWARDS: 'FWD',
  MID: 'MID',
  MIDFIELD: 'MID',
  MIDFIELDER: 'MID',
  RUC: 'RUC',
  RUCK: 'RUC',
  DEF: 'DEF',
  DEFENDER: 'DEF',
  DEFENCE: 'DEF',
  DEFENSE: 'DEF',
}

export const PLAYER_POSITION_LABELS = Object.fromEntries(
  PLAYER_POSITIONS.map(({ code, label }) => [code, label]),
) as Readonly<Record<CanonicalPlayerPosition, string>>

export function normalizePlayerPosition(value?: string | null): CanonicalPlayerPosition | null {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return normalized ? PLAYER_POSITION_ALIASES[normalized] ?? null : null
}

export function resolvePlayerPosition(
  ...sources: Array<string | null | undefined>
): CanonicalPlayerPosition | null {
  for (const source of sources) {
    const normalized = normalizePlayerPosition(source)
    if (normalized) return normalized
  }
  return null
}

export function isPlayerPosition(value?: string | null): value is CanonicalPlayerPosition {
  return normalizePlayerPosition(value) === value
}

export function getPlayerPositionLabel(value?: string | null): string | null {
  const normalized = normalizePlayerPosition(value)
  return normalized ? PLAYER_POSITION_LABELS[normalized] : null
}

export function canonicalizeOptionalPlayerPosition(value: unknown): CanonicalPlayerPosition | null {
  if (value == null || (typeof value === 'string' && !value.trim())) return null
  if (typeof value !== 'string') throw new Error('Select a valid player position.')

  const normalized = normalizePlayerPosition(value)
  if (!normalized) throw new Error('Select a valid player position.')
  return normalized
}
