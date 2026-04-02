import { describe, expect, it } from 'vitest'
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
      color_primary: '#3b82f6',
    })
  })

  it('solo autodetecta cuando el banner cambio despues de la carga inicial', () => {
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

  it('valida que la paleta detectada este completa', () => {
    expect(
      hasDetectedBrandingPalette({
        color_primary: '#111111',
        color_secondary: '#222222',
        color_accent: '#333333',
      }),
    ).toBe(true)
    expect(hasDetectedBrandingPalette({ color_primary: '#111111' })).toBe(false)
  })
})
