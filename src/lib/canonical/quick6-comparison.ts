type ComparableStat = { available: boolean; value: number | null }

/** Match the one-decimal comparison shown below a Quick 6 value. */
export function quick6Delta(current: ComparableStat, reference: ComparableStat): number | null {
  if (!current.available || !reference.available || current.value == null || reference.value == null || !Number.isFinite(current.value) || !Number.isFinite(reference.value)) return null
  const delta = Number((current.value - reference.value).toFixed(1))
  return delta === 0 ? 0 : delta
}
