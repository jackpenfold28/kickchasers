/** Pure scroll mapping keeps the scene reversible and independent of scroll speed. */
export function openingScrollProgress(scrollY: number, top: number, height: number, viewport: number, header: number): number {
  const start = top - header
  const distance = Math.max(1, height - viewport + header)
  return Math.max(0, Math.min(1, (scrollY - start) / distance))
}

export function reverseVideoTime(progress: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  // Stay inside the last decodable frame rather than seeking to the ended state.
  return Math.max(0, duration - 0.05) * (1 - Math.max(0, Math.min(1, progress)))
}
