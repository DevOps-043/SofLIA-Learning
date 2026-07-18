import { describe, expect, it } from 'vitest'
import {
  buildOrganizationAuthPalette,
  resolveOrganizationAuthStylesForMode,
  toInputBackgroundColor,
} from '../organization-auth.styles'

describe('organization-auth.styles', () => {
  it('genera paleta consistente para tema oscuro', () => {
    const palette = buildOrganizationAuthPalette(
      {
        primary_button_color: 'var(--color-legacy-112233)',
        card_background: 'var(--color-legacy-1a1a2e)',
        text_color: 'var(--color-bg-light)',
      },
      true,
    )

    expect(palette.primaryColor).toBe('var(--color-legacy-112233)')
    expect(palette.inputBgColor).toContain('rgba(')
    expect(palette.isDark).toBe(true)
  })

  it('convierte backgrounds rgba sin perder el alpha dinámico', () => {
    expect(toInputBackgroundColor('rgba(10, 20, 30, 0.8)', false)).toBe(
      'rgba(10, 20, 30, 0.05)',
    )
  })
  it('convierte estilos oscuros almacenados a superficies claras', () => {
    const styles = resolveOrganizationAuthStylesForMode(
      {
        background_type: 'color',
        background_value: '#0f1419',
        card_background: '#1e2329',
        text_color: '#ffffff',
        border_color: '#334155',
        primary_button_color: '#0a2540',
        secondary_button_color: '#10b981',
        accent_color: '#00d4b3',
      },
      false,
    )

    expect(styles?.background_value).not.toBe('#0f1419')
    expect(styles?.card_background).toBe('#ffffff')
    expect(styles?.text_color).toBe('#1e293b')
    expect(styles?.primary_button_color).toBe('#0a2540')
    expect(styles?.accent_color).toBe('#00d4b3')
  })

  it('conserva intacta la variante oscura configurada', () => {
    const darkStyles = {
      background_type: 'color' as const,
      background_value: '#0f1419',
      card_background: '#1e2329',
    }

    expect(resolveOrganizationAuthStylesForMode(darkStyles, true)).toBe(
      darkStyles,
    )
  })
})
