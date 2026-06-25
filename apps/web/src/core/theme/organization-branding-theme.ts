import { DESIGN_HEX_COLOR, type HexColor } from './color-tokens'
import {
  darkenHexColor,
  mixHexColors,
  normalizeHexColor,
} from './color-engine'

export const BRANDING_THEME_ID = 'branding-personalizado'
export const BRANDING_THEME_NAME = 'Branding Personalizado'

export interface OrganizationThemeStyle {
  background_type: 'image' | 'color' | 'gradient'
  background_value: string
  primary_button_color: string
  secondary_button_color: string
  accent_color: string
  sidebar_background: string
  card_background: string
  text_color?: string
  border_color?: string
  modal_opacity?: number
  card_opacity?: number
  sidebar_opacity?: number
}

export interface OrganizationThemeModeStyles {
  panel: OrganizationThemeStyle
  userDashboard: OrganizationThemeStyle
  login: OrganizationThemeStyle
}

export interface GeneratedOrganizationBrandingTheme extends OrganizationThemeModeStyles {
  id: typeof BRANDING_THEME_ID
  name: typeof BRANDING_THEME_NAME
  description: string
  supportsDualMode: true
  lightMode: OrganizationThemeModeStyles
}

export interface OrganizationBrandingColors {
  color_primary?: string | null
  color_secondary?: string | null
  color_accent?: string | null
  font_family?: string | null
}

export interface OrganizationBrandingRowColors {
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
}

export interface NormalizedOrganizationBrandingColors {
  color_primary: HexColor
  color_secondary: HexColor
  color_accent: HexColor
  font_family: string
}

export const DEFAULT_ORGANIZATION_BRANDING_COLORS = {
  color_primary: DESIGN_HEX_COLOR.info,
  color_secondary: DESIGN_HEX_COLOR.success,
  color_accent: DESIGN_HEX_COLOR.secondary,
  font_family: 'Inter',
} as const satisfies NormalizedOrganizationBrandingColors

export function normalizeOrganizationBrandingColors(
  branding: OrganizationBrandingColors | OrganizationBrandingRowColors | null | undefined,
): NormalizedOrganizationBrandingColors {
  const colorPrimary = 'color_primary' in (branding ?? {})
    ? (branding as OrganizationBrandingColors | null | undefined)?.color_primary
    : (branding as OrganizationBrandingRowColors | null | undefined)?.brand_color_primary
  const colorSecondary = 'color_secondary' in (branding ?? {})
    ? (branding as OrganizationBrandingColors | null | undefined)?.color_secondary
    : (branding as OrganizationBrandingRowColors | null | undefined)?.brand_color_secondary
  const colorAccent = 'color_accent' in (branding ?? {})
    ? (branding as OrganizationBrandingColors | null | undefined)?.color_accent
    : (branding as OrganizationBrandingRowColors | null | undefined)?.brand_color_accent
  const fontFamily = 'font_family' in (branding ?? {})
    ? (branding as OrganizationBrandingColors | null | undefined)?.font_family
    : (branding as OrganizationBrandingRowColors | null | undefined)?.brand_font_family

  return {
    color_primary: normalizeHexColor(colorPrimary, DEFAULT_ORGANIZATION_BRANDING_COLORS.color_primary),
    color_secondary: normalizeHexColor(colorSecondary, DEFAULT_ORGANIZATION_BRANDING_COLORS.color_secondary),
    color_accent: normalizeHexColor(colorAccent, DEFAULT_ORGANIZATION_BRANDING_COLORS.color_accent),
    font_family: fontFamily?.trim() || DEFAULT_ORGANIZATION_BRANDING_COLORS.font_family,
  }
}

export function hasCustomOrganizationBrandingColors(
  branding: OrganizationBrandingColors | OrganizationBrandingRowColors | null | undefined,
): boolean {
  if (!branding) return false

  const normalizedBranding = normalizeOrganizationBrandingColors(branding)
  return (
    normalizedBranding.color_primary !== DEFAULT_ORGANIZATION_BRANDING_COLORS.color_primary ||
    normalizedBranding.color_secondary !== DEFAULT_ORGANIZATION_BRANDING_COLORS.color_secondary ||
    normalizedBranding.color_accent !== DEFAULT_ORGANIZATION_BRANDING_COLORS.color_accent
  )
}

function buildDarkModeStyles(
  colors: NormalizedOrganizationBrandingColors,
): OrganizationThemeModeStyles {
  // Factors: (1 - factor) = fraction of brand color visible.
  const darkPrimary    = darkenHexColor(colors.color_primary, 0.60)   // 40% primary visible
  const darkPrimaryMid = darkenHexColor(colors.color_primary, 0.45)   // 55% primary — slightly lighter for gradient end
  const darkAccent     = darkenHexColor(colors.color_accent, 0.48)    // used in login gradient + border mix
  const darkCard       = mixHexColors(colors.color_primary, DESIGN_HEX_COLOR.gray800, 0.22)
  const darkBorder     = mixHexColors(colors.color_accent, DESIGN_HEX_COLOR.slate700, 0.35)

  const sharedPanelStyle: OrganizationThemeStyle = {
    background_type: 'gradient',
    // Page background derives only from primary so it stays on-brand with the
    // org's primary hue. Secondary/accent colors are reserved for interactive
    // elements (buttons, borders, chart lines) — not the page canvas.
    // Previously included darkSecondary at 54% which caused a blue bleed when
    // the primary was very dark (#000000) and the secondary was light-colored.
    background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${darkPrimaryMid} 100%)`,
    primary_button_color: colors.color_primary,
    secondary_button_color: colors.color_secondary,
    accent_color: colors.color_accent,
    sidebar_background: darkPrimary,
    card_background: darkCard,
    text_color: DESIGN_HEX_COLOR.bgLight,
    border_color: darkBorder,
    modal_opacity: 0.95,
    card_opacity: 0.95,
    sidebar_opacity: 0.98,
  }

  return {
    panel: sharedPanelStyle,
    userDashboard: {
      ...sharedPanelStyle,
      card_opacity: 0.97,
    },
    login: {
      ...sharedPanelStyle,
      // Login keeps accent in gradient for visual richness (gated by brandingEnabled anyway)
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${darkAccent} 100%)`,
      sidebar_background: 'transparent',
      card_background: mixHexColors(colors.color_primary, DESIGN_HEX_COLOR.slate800, 0.16),
      sidebar_opacity: 1,
    },
  }
}

function buildLightModeStyles(
  colors: NormalizedOrganizationBrandingColors,
): OrganizationThemeModeStyles {
  const lightPrimaryWash = mixHexColors(colors.color_primary, DESIGN_HEX_COLOR.gray50, 0.08)
  const lightSecondaryWash = mixHexColors(colors.color_secondary, DESIGN_HEX_COLOR.bgLight, 0.06)
  const lightAccentWash = mixHexColors(colors.color_accent, DESIGN_HEX_COLOR.gray50, 0.09)
  const lightSidebar = mixHexColors(colors.color_primary, DESIGN_HEX_COLOR.bgLight, 0.06)
  const lightBorder = mixHexColors(colors.color_primary, DESIGN_HEX_COLOR.gray200, 0.16)

  const sharedPanelStyle: OrganizationThemeStyle = {
    background_type: 'gradient',
    background_value: `linear-gradient(135deg, ${lightPrimaryWash} 0%, ${lightSecondaryWash} 54%, ${lightAccentWash} 100%)`,
    primary_button_color: colors.color_primary,
    secondary_button_color: colors.color_secondary,
    accent_color: colors.color_accent,
    sidebar_background: lightSidebar,
    card_background: DESIGN_HEX_COLOR.bgLight,
    text_color: DESIGN_HEX_COLOR.slate800,
    border_color: lightBorder,
    modal_opacity: 0.98,
    card_opacity: 1,
    sidebar_opacity: 1,
  }

  return {
    panel: sharedPanelStyle,
    userDashboard: sharedPanelStyle,
    login: {
      ...sharedPanelStyle,
      background_value: `linear-gradient(135deg, ${lightPrimaryWash} 0%, ${lightAccentWash} 100%)`,
      sidebar_background: 'transparent',
    },
  }
}

export function generateOrganizationBrandingTheme(
  branding: OrganizationBrandingColors | OrganizationBrandingRowColors | null | undefined,
): GeneratedOrganizationBrandingTheme {
  const colors = normalizeOrganizationBrandingColors(branding)
  const darkModeStyles = buildDarkModeStyles(colors)
  const lightModeStyles = buildLightModeStyles(colors)

  return {
    id: BRANDING_THEME_ID,
    name: BRANDING_THEME_NAME,
    description: 'Tema generado automaticamente con los colores de marca de la organizacion',
    supportsDualMode: true,
    ...darkModeStyles,
    lightMode: lightModeStyles,
  }
}
