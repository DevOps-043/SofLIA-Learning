import { type HexColor } from '@/core/theme/color-tokens'
import { DEFAULT_ORGANIZATION_BRANDING_COLORS } from '@/core/theme/organization-branding-theme'
import { normalizeHexColor, resolveHexColor } from '@/core/theme/color-engine'

export const DEFAULT_BRAND_PRIMARY = DEFAULT_ORGANIZATION_BRANDING_COLORS.color_primary
export const DEFAULT_BRAND_SECONDARY = DEFAULT_ORGANIZATION_BRANDING_COLORS.color_secondary
export const DEFAULT_BRAND_ACCENT = DEFAULT_ORGANIZATION_BRANDING_COLORS.color_accent

export function resolveBrandHexColor(value: string | null | undefined): HexColor | null {
  return resolveHexColor(value)
}

export function normalizeBrandHexColor(
  value: string | null | undefined,
  fallback: HexColor,
): HexColor {
  return normalizeHexColor(value, fallback)
}
