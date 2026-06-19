import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import {
  generateOrganizationBrandingTheme,
  type OrganizationBrandingColors,
} from '@/core/theme/organization-branding-theme'

export interface ThemeStyle {
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

export interface ThemeModeStyles {
  panel: ThemeStyle
  userDashboard: ThemeStyle
  login: ThemeStyle
}

export interface ThemeConfig {
  id: string
  name: string
  description: string
  supportsDualMode?: boolean
  panel: ThemeStyle
  userDashboard: ThemeStyle
  login: ThemeStyle
  lightMode?: ThemeModeStyles
}

export type BrandingColors = OrganizationBrandingColors

export function generateBrandingTheme(branding: BrandingColors): ThemeConfig {
  return generateOrganizationBrandingTheme(branding)
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  SOFLIA: {
    id: 'SOFLIA',
    name: 'SofLIA',
    description: 'Tema oficial basado en el Sistema de Diseno SofLIA con soporte para modo claro y oscuro',
    supportsDualMode: true,
    panel: {
      background_type: 'color',
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: DESIGN_HEX_COLOR.bgDark,
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    userDashboard: {
      background_type: 'color',
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: DESIGN_HEX_COLOR.bgDark,
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98,
    },
    login: {
      background_type: 'color',
      background_value: DESIGN_HEX_COLOR.bgDark,
      primary_button_color: DESIGN_HEX_COLOR.primary,
      secondary_button_color: DESIGN_HEX_COLOR.slate700,
      accent_color: DESIGN_HEX_COLOR.accent,
      sidebar_background: 'transparent',
      card_background: DESIGN_HEX_COLOR.gray800,
      text_color: DESIGN_HEX_COLOR.bgLight,
      border_color: DESIGN_HEX_COLOR.slate700,
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1,
    },
    lightMode: {
      panel: {
        background_type: 'color',
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: DESIGN_HEX_COLOR.bgLight,
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
      userDashboard: {
        background_type: 'color',
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: DESIGN_HEX_COLOR.bgLight,
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
      login: {
        background_type: 'color',
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: 'transparent',
        card_background: DESIGN_HEX_COLOR.bgLight,
        text_color: DESIGN_HEX_COLOR.slate800,
        border_color: DESIGN_HEX_COLOR.gray200,
        modal_opacity: 0.98,
        card_opacity: 1,
        sidebar_opacity: 1,
      },
    },
  },
}

export const DEFAULT_THEME = 'SOFLIA'

function normalizeThemeId(themeId: string): string {
  return (
    themeId === 'SOFLIA-predeterminado' ||
    themeId === 'SOFLIA-claro' ||
    themeId === 'SofLIA-predeterminado'
  )
    ? DEFAULT_THEME
    : themeId
}

export function getThemeById(themeId: string): ThemeConfig | null {
  return PRESET_THEMES[normalizeThemeId(themeId)] || null
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(PRESET_THEMES)
}

export function getThemeStylesForMode(
  themeId: string,
  mode: 'light' | 'dark',
): ThemeModeStyles | null {
  const theme = PRESET_THEMES[normalizeThemeId(themeId)]
  if (!theme) return null

  if (theme.supportsDualMode && mode === 'light' && theme.lightMode) {
    return theme.lightMode
  }

  return {
    panel: theme.panel,
    userDashboard: theme.userDashboard,
    login: theme.login,
  }
}
