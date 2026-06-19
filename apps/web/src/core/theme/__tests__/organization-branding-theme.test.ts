import { describe, expect, it } from 'vitest'
import { DESIGN_HEX_COLOR } from '../color-tokens'
import {
  BRANDING_THEME_ID,
  DEFAULT_ORGANIZATION_BRANDING_COLORS,
  generateOrganizationBrandingTheme,
  hasCustomOrganizationBrandingColors,
  normalizeOrganizationBrandingColors,
} from '../organization-branding-theme'

describe('organization-branding-theme', () => {
  it('normalizes missing and token colors with stable defaults', () => {
    expect(normalizeOrganizationBrandingColors(null)).toEqual(DEFAULT_ORGANIZATION_BRANDING_COLORS)
    expect(
      normalizeOrganizationBrandingColors({
        color_primary: 'var(--color-info)',
        color_secondary: '#0f0',
        color_accent: 'var(--color-legacy-112233)',
      }),
    ).toMatchObject({
      color_primary: DESIGN_HEX_COLOR.info,
      color_secondary: '#00ff00',
      color_accent: '#112233',
    })
  })

  it('generates a dual-mode branding theme with exact brand action tokens', () => {
    const theme = generateOrganizationBrandingTheme({
      color_primary: DESIGN_HEX_COLOR.bgLight,
      color_secondary: DESIGN_HEX_COLOR.success,
      color_accent: DESIGN_HEX_COLOR.secondary,
    })

    expect(theme.id).toBe(BRANDING_THEME_ID)
    expect(theme.supportsDualMode).toBe(true)
    expect(theme.lightMode.panel.background_value).not.toBe(theme.panel.background_value)
    expect(theme.panel.primary_button_color).toBe(DESIGN_HEX_COLOR.bgLight)
    expect(theme.lightMode.panel.primary_button_color).toBe(DESIGN_HEX_COLOR.bgLight)
  })

  it('detects whether the organization has a non-default palette', () => {
    expect(hasCustomOrganizationBrandingColors(DEFAULT_ORGANIZATION_BRANDING_COLORS)).toBe(false)
    expect(
      hasCustomOrganizationBrandingColors({
        brand_color_primary: DESIGN_HEX_COLOR.accent,
        brand_color_secondary: DESIGN_HEX_COLOR.success,
        brand_color_accent: DESIGN_HEX_COLOR.secondary,
      }),
    ).toBe(true)
  })
})
