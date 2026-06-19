import { describe, expect, it } from 'vitest'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import { BRANDING_THEME_ID } from '@/core/theme/organization-branding-theme'
import { buildOrganizationStylesPayload } from '../organization-styles-response.service'

const sofliaDarkStyle = {
  background_type: 'color' as const,
  background_value: DESIGN_HEX_COLOR.bgDark,
  primary_button_color: DESIGN_HEX_COLOR.primary,
  secondary_button_color: DESIGN_HEX_COLOR.slate700,
  accent_color: DESIGN_HEX_COLOR.accent,
  sidebar_background: DESIGN_HEX_COLOR.bgDark,
  card_background: DESIGN_HEX_COLOR.gray800,
}

const manualStyle = {
  background_type: 'gradient' as const,
  background_value: `linear-gradient(135deg, ${DESIGN_HEX_COLOR.secondary}, ${DESIGN_HEX_COLOR.info})`,
  primary_button_color: DESIGN_HEX_COLOR.secondary,
  secondary_button_color: DESIGN_HEX_COLOR.info,
  accent_color: DESIGN_HEX_COLOR.success,
  sidebar_background: DESIGN_HEX_COLOR.slate800,
  card_background: DESIGN_HEX_COLOR.slate700,
}

describe('organization-styles-response.service', () => {
  it('resolves selected branding from organization colors with light mode styles', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: BRANDING_THEME_ID,
      brand_color_primary: DESIGN_HEX_COLOR.info,
      brand_color_secondary: DESIGN_HEX_COLOR.success,
      brand_color_accent: DESIGN_HEX_COLOR.secondary,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.supportsDualMode).toBe(true)
    expect(payload.panel?.primary_button_color).toBeDefined()
    expect(payload.lightMode?.panel.primary_button_color).toBeDefined()
    expect(payload.lightMode?.panel.background_value).not.toBe(payload.panel?.background_value)
  })

  it('falls back to branding when persisted styles are missing but a custom palette exists', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: null,
      panel_styles: null,
      user_dashboard_styles: null,
      login_styles: null,
      brand_color_primary: DESIGN_HEX_COLOR.accent,
      brand_color_secondary: DESIGN_HEX_COLOR.success,
      brand_color_accent: DESIGN_HEX_COLOR.secondary,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.panel?.background_type).toBe('gradient')
  })

  it('repairs legacy rows where custom branding coexists with the default SofLIA theme', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: 'SOFLIA',
      panel_styles: sofliaDarkStyle,
      user_dashboard_styles: sofliaDarkStyle,
      login_styles: sofliaDarkStyle,
      brand_color_primary: DESIGN_HEX_COLOR.black,
      brand_color_secondary: DESIGN_HEX_COLOR.info,
      brand_color_accent: DESIGN_HEX_COLOR.blue400,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.panel?.accent_color).not.toBe(DESIGN_HEX_COLOR.accent)
  })

  it('repairs legacy rows with null theme when only default SofLIA styles were persisted', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: null,
      panel_styles: sofliaDarkStyle,
      user_dashboard_styles: sofliaDarkStyle,
      login_styles: sofliaDarkStyle,
      brand_color_primary: DESIGN_HEX_COLOR.black,
      brand_color_secondary: DESIGN_HEX_COLOR.info,
      brand_color_accent: DESIGN_HEX_COLOR.blue400,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
  })

  it('ignores complete manual styles when branding colors are present', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: null,
      panel_styles: manualStyle,
      user_dashboard_styles: manualStyle,
      login_styles: manualStyle,
      brand_color_primary: DESIGN_HEX_COLOR.black,
      brand_color_secondary: DESIGN_HEX_COLOR.info,
      brand_color_accent: DESIGN_HEX_COLOR.blue400,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.panel?.background_value).not.toBe(manualStyle.background_value)
    expect(payload.panel?.primary_button_color).toBe(DESIGN_HEX_COLOR.black)
  })

  it('ignores unresolved legacy CSS style functions when generating the visual payload', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: null,
      panel_styles: {
        ...sofliaDarkStyle,
        background_value: 'color-mix(in srgb, var(--color-bg-dark) 90%, transparent)',
      },
      brand_color_primary: DESIGN_HEX_COLOR.black,
      brand_color_secondary: DESIGN_HEX_COLOR.info,
      brand_color_accent: DESIGN_HEX_COLOR.blue400,
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.panel?.primary_button_color).toBe(DESIGN_HEX_COLOR.black)
  })

  it('uses default branding colors when no palette is stored', () => {
    const payload = buildOrganizationStylesPayload({
      selected_theme: null,
      panel_styles: {
        background_type: 'color',
        background_value: DESIGN_HEX_COLOR.gray50,
        primary_button_color: DESIGN_HEX_COLOR.primary,
        secondary_button_color: DESIGN_HEX_COLOR.gray200,
        accent_color: DESIGN_HEX_COLOR.accent,
        sidebar_background: DESIGN_HEX_COLOR.bgLight,
        card_background: DESIGN_HEX_COLOR.bgLight,
      },
    })

    expect(payload.selectedTheme).toBe(BRANDING_THEME_ID)
    expect(payload.panel?.primary_button_color).toBe(DESIGN_HEX_COLOR.info)
  })
})
