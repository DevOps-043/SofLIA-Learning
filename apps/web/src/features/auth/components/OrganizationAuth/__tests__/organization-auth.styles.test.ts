import { describe, expect, it } from 'vitest'
import {
  buildOrganizationAuthPalette,
  toInputBackgroundColor,
} from '../organization-auth.styles'

describe('organization-auth.styles', () => {
  it('genera paleta consistente para tema oscuro', () => {
    const palette = buildOrganizationAuthPalette(
      {
        primary_button_color: '#112233',
        card_background: '#1a1a2e',
        text_color: '#ffffff',
      },
      true,
    )

    expect(palette.primaryColor).toBe('#112233')
    expect(palette.inputBgColor).toContain('rgba(')
    expect(palette.isDark).toBe(true)
  })

  it('convierte backgrounds rgba sin perder el alpha dinámico', () => {
    expect(toInputBackgroundColor('rgba(10, 20, 30, 0.8)', false)).toBe(
      'rgba(10, 20, 30, 0.05)',
    )
  })
})
