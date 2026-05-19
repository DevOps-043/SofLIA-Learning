import { describe, expect, it } from 'vitest'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'
import {
  createBrandingFormState,
  hasDetectedBrandingPalette,
  shouldAutoDetectBrandingColors,
} from '../branding-tab/service'

describe('branding-tab.service', () => {
  it('crea el estado local con defaults seguros', () => {
    expect(createBrandingFormState()).toMatchObject({
      favicon_url: '',
      banner_url: '',
      color_primary: DESIGN_HEX_COLOR.primary,
      color_secondary: DESIGN_HEX_COLOR.accent,
      color_accent: DESIGN_HEX_COLOR.bgLight,
    })
  })

  it('solo autodetecta cuando el banner cambió después de la carga inicial', () => {
    expect(
      shouldAutoDetectBrandingColors({
        isInitialLoad: true,
        bannerUrl: 'https://a.test/banner.png',
        previousBannerUrl: '',
      }),
    ).toBe(false)

    expect(
      shouldAutoDetectBrandingColors({
        isInitialLoad: false,
        bannerUrl: 'https://a.test/banner.png',
        previousBannerUrl: 'https://a.test/old.png',
      }),
    ).toBe(true)
  })

  it('valida que la paleta detectada esté completa', () => {
    expect(
      hasDetectedBrandingPalette({
        color_primary: 'var(--color-legacy-111111)',
        color_secondary: 'var(--color-legacy-222222)',
        color_accent: 'var(--color-legacy-333333)',
      }),
    ).toBe(true)
    expect(hasDetectedBrandingPalette({ color_primary: 'var(--color-legacy-111111)' })).toBe(false)
  })
})
