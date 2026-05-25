import type { BrandingFormState, BrandingPalette } from './types'
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens'

const DEFAULT_BRANDING_STATE: BrandingFormState = {
  favicon_url: '',
  banner_url: '',
  color_primary: DESIGN_HEX_COLOR.primary,
  color_secondary: DESIGN_HEX_COLOR.accent,
  color_accent: DESIGN_HEX_COLOR.bgLight,
}

export function createBrandingFormState(
  branding?:
    | Partial<BrandingFormState>
    | {
        favicon_url?: string | null
        banner_url?: string | null
        color_primary?: string | null
        color_secondary?: string | null
        color_accent?: string | null
      }
    | null,
): BrandingFormState {
  return {
    favicon_url: branding?.favicon_url || '',
    banner_url: branding?.banner_url || '',
    color_primary: branding?.color_primary || DEFAULT_BRANDING_STATE.color_primary,
    color_secondary:
      branding?.color_secondary || DEFAULT_BRANDING_STATE.color_secondary,
    color_accent: branding?.color_accent || DEFAULT_BRANDING_STATE.color_accent,
  }
}

export function shouldAutoDetectBrandingColors(params: {
  isInitialLoad: boolean
  bannerUrl: string
  previousBannerUrl: string
}): boolean {
  if (params.isInitialLoad) {
    return false
  }

  return Boolean(
    params.bannerUrl &&
      params.bannerUrl.trim() !== '' &&
      params.bannerUrl !== params.previousBannerUrl,
  )
}

export function hasDetectedBrandingPalette(
  colors: Partial<BrandingPalette> | null | undefined,
): colors is BrandingPalette {
  return Boolean(
    colors?.color_primary && colors.color_secondary && colors.color_accent,
  )
}
