import {
  BRANDING_THEME_ID,
  generateOrganizationBrandingTheme,
} from '@/core/theme/organization-branding-theme'
import type { ThemeModeStyles, ThemeStyle } from '../config/preset-themes'

export interface OrganizationStylesRow {
  panel_styles?: unknown
  user_dashboard_styles?: unknown
  login_styles?: unknown
  selected_theme?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
}

export interface OrganizationStylesPayload {
  panel: ThemeStyle | null
  userDashboard: ThemeStyle | null
  login: ThemeStyle | null
  selectedTheme: string | null
  supportsDualMode: boolean
  lightMode?: ThemeModeStyles
}

export function buildOrganizationStylesPayload(row: OrganizationStylesRow): OrganizationStylesPayload {
  const theme = generateOrganizationBrandingTheme(row)

  return {
    panel: theme.panel,
    userDashboard: theme.userDashboard,
    login: theme.login,
    selectedTheme: BRANDING_THEME_ID,
    supportsDualMode: true,
    lightMode: theme.lightMode,
  }
}
