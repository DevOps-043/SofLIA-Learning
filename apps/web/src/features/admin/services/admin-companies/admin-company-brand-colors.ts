import { DESIGN_HEX_COLOR, type HexColor } from '@/core/theme/color-tokens'

export const DEFAULT_BRAND_PRIMARY = DESIGN_HEX_COLOR.info
export const DEFAULT_BRAND_SECONDARY = DESIGN_HEX_COLOR.success
export const DEFAULT_BRAND_ACCENT = DESIGN_HEX_COLOR.secondary

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const LEGACY_HEX_TOKEN_PATTERN = /^var\(--color-legacy-([0-9a-f]{6})\)$/i

const CSS_TOKEN_TO_HEX_COLOR: Record<string, HexColor> = {
  'var(--color-accent)': DESIGN_HEX_COLOR.accent,
  'var(--color-bg-dark)': DESIGN_HEX_COLOR.bgDark,
  'var(--color-bg-light)': DESIGN_HEX_COLOR.bgLight,
  'var(--color-error)': DESIGN_HEX_COLOR.error,
  'var(--color-gray-200)': DESIGN_HEX_COLOR.gray200,
  'var(--color-gray-500)': DESIGN_HEX_COLOR.gray500,
  'var(--color-gray-800)': DESIGN_HEX_COLOR.gray800,
  'var(--color-info)': DESIGN_HEX_COLOR.info,
  'var(--color-primary)': DESIGN_HEX_COLOR.primary,
  'var(--color-secondary)': DESIGN_HEX_COLOR.secondary,
  'var(--color-success)': DESIGN_HEX_COLOR.success,
  'var(--color-warning)': DESIGN_HEX_COLOR.warning,
}

export function resolveBrandHexColor(value: string | null | undefined): HexColor | null {
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

export function normalizeBrandHexColor(
  value: string | null | undefined,
  fallback: HexColor,
): HexColor {
  return resolveBrandHexColor(value) ?? fallback
}
