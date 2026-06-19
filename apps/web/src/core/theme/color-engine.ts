import { DESIGN_HEX_COLOR, type HexColor, rgbToHexColor } from './color-tokens'

type RgbColor = {
  red: number
  green: number
  blue: number
}

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const LEGACY_HEX_TOKEN_PATTERN = /^var\(--color-legacy-([0-9a-f]{6})\)$/i

const CSS_TOKEN_TO_HEX_COLOR: Record<string, HexColor> = {
  'var(--color-accent)': DESIGN_HEX_COLOR.accent,
  'var(--color-accent-hover)': DESIGN_HEX_COLOR.accentHover,
  'var(--color-bg-dark)': DESIGN_HEX_COLOR.bgDark,
  'var(--color-bg-light)': DESIGN_HEX_COLOR.bgLight,
  'var(--color-black)': DESIGN_HEX_COLOR.black,
  'var(--color-blue-400)': DESIGN_HEX_COLOR.blue400,
  'var(--color-blue-600)': DESIGN_HEX_COLOR.blue600,
  'var(--color-blue-800)': DESIGN_HEX_COLOR.blue800,
  'var(--color-blue-900)': DESIGN_HEX_COLOR.blue900,
  'var(--color-error)': DESIGN_HEX_COLOR.error,
  'var(--color-gray-50)': DESIGN_HEX_COLOR.gray50,
  'var(--color-gray-200)': DESIGN_HEX_COLOR.gray200,
  'var(--color-gray-500)': DESIGN_HEX_COLOR.gray500,
  'var(--color-gray-800)': DESIGN_HEX_COLOR.gray800,
  'var(--color-gray-950)': DESIGN_HEX_COLOR.gray950,
  'var(--color-info)': DESIGN_HEX_COLOR.info,
  'var(--color-primary)': DESIGN_HEX_COLOR.primary,
  'var(--color-primary-hover)': DESIGN_HEX_COLOR.primaryHover,
  'var(--color-secondary)': DESIGN_HEX_COLOR.secondary,
  'var(--color-slate-700)': DESIGN_HEX_COLOR.slate700,
  'var(--color-slate-800)': DESIGN_HEX_COLOR.slate800,
  'var(--color-slate-900)': DESIGN_HEX_COLOR.slate900,
  'var(--color-success)': DESIGN_HEX_COLOR.success,
  'var(--color-warning)': DESIGN_HEX_COLOR.warning,
  'var(--color-white)': DESIGN_HEX_COLOR.white,
}

function normalizeRgbChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function resolveHexColor(value: string | null | undefined): HexColor | null {
  if (!value) return null

  const normalizedValue = value.trim()
  if (!normalizedValue) return null

  const tokenColor = CSS_TOKEN_TO_HEX_COLOR[normalizedValue]
  if (tokenColor) return tokenColor

  const legacyHexToken = normalizedValue.match(LEGACY_HEX_TOKEN_PATTERN)
  if (legacyHexToken?.[1]) {
    return `#${legacyHexToken[1].toLowerCase()}`
  }

  if (!HEX_COLOR_PATTERN.test(normalizedValue)) {
    return null
  }

  const hexValue = normalizedValue.toLowerCase()
  if (hexValue.length === 4) {
    const [, red, green, blue] = hexValue
    return `#${red}${red}${green}${green}${blue}${blue}`
  }

  return hexValue as HexColor
}

export function normalizeHexColor(
  value: string | null | undefined,
  fallback: HexColor,
): HexColor {
  return resolveHexColor(value) ?? fallback
}

export function hexToRgbColor(hex: string): RgbColor | null {
  const normalizedHex = resolveHexColor(hex)
  if (!normalizedHex) return null

  return {
    red: Number.parseInt(normalizedHex.slice(1, 3), 16),
    green: Number.parseInt(normalizedHex.slice(3, 5), 16),
    blue: Number.parseInt(normalizedHex.slice(5, 7), 16),
  }
}

export function hexToRgbChannels(
  hex: string | null | undefined,
  fallback: HexColor = DESIGN_HEX_COLOR.slate900,
): string {
  const rgb = hexToRgbColor(normalizeHexColor(hex, fallback))
  if (!rgb) {
    const fallbackRgb = hexToRgbColor(fallback)
    if (!fallbackRgb) {
      return hexToRgbChannels(DESIGN_HEX_COLOR.black)
    }

    return `${fallbackRgb.red}, ${fallbackRgb.green}, ${fallbackRgb.blue}`
  }

  return `${rgb.red}, ${rgb.green}, ${rgb.blue}`
}

export function mixHexColors(
  foreground: string,
  background: string,
  foregroundWeight: number,
): HexColor {
  const foregroundRgb = hexToRgbColor(foreground) ?? hexToRgbColor(DESIGN_HEX_COLOR.black)
  const backgroundRgb = hexToRgbColor(background) ?? hexToRgbColor(DESIGN_HEX_COLOR.bgLight)
  const weight = Math.max(0, Math.min(1, foregroundWeight))

  if (!foregroundRgb || !backgroundRgb) {
    return DESIGN_HEX_COLOR.black
  }

  return rgbToHexColor(
    normalizeRgbChannel((foregroundRgb.red * weight) + (backgroundRgb.red * (1 - weight))),
    normalizeRgbChannel((foregroundRgb.green * weight) + (backgroundRgb.green * (1 - weight))),
    normalizeRgbChannel((foregroundRgb.blue * weight) + (backgroundRgb.blue * (1 - weight))),
  )
}

export function lightenHexColor(hex: string, amount: number): HexColor {
  return mixHexColors(DESIGN_HEX_COLOR.bgLight, hex, amount)
}

export function darkenHexColor(hex: string, amount: number): HexColor {
  return mixHexColors(DESIGN_HEX_COLOR.black, hex, amount)
}

function getLinearizedChannel(channel: number): number {
  const normalizedChannel = channel / 255
  return normalizedChannel <= 0.03928
    ? normalizedChannel / 12.92
    : ((normalizedChannel + 0.055) / 1.055) ** 2.4
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgbColor(hex)
  if (!rgb) return 0

  return (
    0.2126 * getLinearizedChannel(rgb.red) +
    0.7152 * getLinearizedChannel(rgb.green) +
    0.0722 * getLinearizedChannel(rgb.blue)
  )
}

export function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground)
  const backgroundLuminance = getRelativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

export function chooseReadableTextColor(
  background: string | null | undefined,
  options?: {
    light?: string
    dark?: string
  },
): string {
  const resolvedBackground = resolveHexColor(background) ?? DESIGN_HEX_COLOR.primary
  const lightText = resolveHexColor(options?.light) ?? DESIGN_HEX_COLOR.bgLight
  const darkText = resolveHexColor(options?.dark) ?? DESIGN_HEX_COLOR.slate900
  const lightContrast = getContrastRatio(lightText, resolvedBackground)
  const darkContrast = getContrastRatio(darkText, resolvedBackground)

  return lightContrast >= darkContrast ? lightText : darkText
}

export function adjustColorForContrast(
  color: string,
  surface: string,
  targetRatio = 3,
  direction?: 'lighten' | 'darken',
): HexColor {
  const resolvedColor = resolveHexColor(color) ?? DESIGN_HEX_COLOR.primary
  const resolvedSurface = resolveHexColor(surface) ?? DESIGN_HEX_COLOR.bgLight
  const preferredDirection = direction
    ?? (getRelativeLuminance(resolvedSurface) < 0.5 ? 'lighten' : 'darken')

  let bestColor = resolvedColor
  let bestRatio = getContrastRatio(resolvedColor, resolvedSurface)
  if (bestRatio >= targetRatio) return resolvedColor

  for (let step = 1; step <= 14; step += 1) {
    const amount = step * 0.05
    const candidate = preferredDirection === 'lighten'
      ? lightenHexColor(resolvedColor, amount)
      : darkenHexColor(resolvedColor, amount)
    const ratio = getContrastRatio(candidate, resolvedSurface)

    if (ratio > bestRatio) {
      bestColor = candidate
      bestRatio = ratio
    }

    if (ratio >= targetRatio) return candidate
  }

  return bestColor
}
