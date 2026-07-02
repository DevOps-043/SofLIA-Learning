import {
  BRANDING_THEME_ID,
  generateOrganizationBrandingTheme,
} from '@/core/theme/organization-branding-theme'
import { PRESET_THEMES, type ThemeModeStyles, type ThemeStyle } from '../config/preset-themes'

export interface OrganizationStylesRow {
  panel_styles?: unknown
  user_dashboard_styles?: unknown
  login_styles?: unknown
  selected_theme?: string | null
  brand_color_primary?: string | null
  brand_color_secondary?: string | null
  brand_color_accent?: string | null
  brand_font_family?: string | null
  /**
   * Full-branding gate. `false` → every surface uses the SofLIA preset.
   * `undefined` (caller did not select the column) keeps the branded theme
   * for backward compatibility with legacy callers.
   */
  branding_enabled?: boolean | null
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
  // When custom branding is explicitly disabled the platform SofLIA preset is
  // the source of truth for every surface. Brand colors stay stored in the row
  // so re-enabling the toggle restores them without data loss.
  if (row.branding_enabled === false) {
    const sofliaTheme = PRESET_THEMES['SOFLIA']
    return {
      panel: sofliaTheme.panel,
      userDashboard: sofliaTheme.userDashboard,
      login: sofliaTheme.login,
      selectedTheme: 'SOFLIA',
      supportsDualMode: sofliaTheme.supportsDualMode ?? true,
      lightMode: sofliaTheme.lightMode,
    }
  }

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
