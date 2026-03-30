export function formatRoundLabel(round: number | string | null | undefined, fallback: string | null = null) {
  if (round == null || round === '') return fallback
  const normalized = String(round).trim()
  if (!normalized) return fallback
  if (normalized === '106') return 'TRIAL'
  return `Round ${normalized}`
}
