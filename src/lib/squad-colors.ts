const logoColorCache = new Map<string, string>()

export const ACCENT_SOFT_FALLBACK = 'rgba(57,255,136,0.16)'

export function normalizeHexColor(input: string | null | undefined) {
  if (!input) return null
  let trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) {
    trimmed = trimmed.slice(1)
  }
  if (trimmed.length === 3) {
    trimmed = trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (trimmed.length !== 6) return null
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return `#${trimmed.toUpperCase()}`
}

function averageImageColorToHex(image: HTMLImageElement) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)

  let totalRed = 0
  let totalGreen = 0
  let totalBlue = 0
  let totalWeight = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255
    if (alpha < 0.08) continue

    totalRed += data[index] * alpha
    totalGreen += data[index + 1] * alpha
    totalBlue += data[index + 2] * alpha
    totalWeight += alpha
  }

  if (!totalWeight) return null

  const red = Math.round(totalRed / totalWeight)
  const green = Math.round(totalGreen / totalWeight)
  const blue = Math.round(totalBlue / totalWeight)

  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0').toUpperCase())
    .join('')}`
}

export async function resolveLogoPrimaryColor(logoUrl: string | null | undefined, fallbackColor: string) {
  if (!logoUrl || typeof window === 'undefined') return fallbackColor

  const cached = logoColorCache.get(logoUrl)
  if (cached) return cached

  const resolved = await new Promise<string>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      try {
        resolve(averageImageColorToHex(image) ?? fallbackColor)
      } catch {
        resolve(fallbackColor)
      }
    }
    image.onerror = () => resolve(fallbackColor)
    image.src = logoUrl
  })

  logoColorCache.set(logoUrl, resolved)
  return resolved
}

export async function resolveSquadPrimaryColor({
  primaryColorHex,
  logoUrl,
  fallbackColor = ACCENT_SOFT_FALLBACK,
}: {
  primaryColorHex?: string | null
  logoUrl?: string | null
  fallbackColor?: string
}) {
  const direct = normalizeHexColor(primaryColorHex)
  if (direct) return direct
  const sampled = normalizeHexColor(await resolveLogoPrimaryColor(logoUrl, fallbackColor))
  return sampled ?? fallbackColor
}
