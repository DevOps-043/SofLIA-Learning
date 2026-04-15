import type { CertificatePlatformBrand, CertificateVisualTokens } from '@/features/certificates/types/certificate'

export const SOFLIA_PLATFORM_BRAND: CertificatePlatformBrand = {
  name: 'SofLIA',
  logoUrl: '/icono.png',
}

export const DEFAULT_CERTIFICATE_VISUAL_TOKENS: CertificateVisualTokens = {
  primaryColor: '#0A2540',
  accentColor: '#00D4B3',
  borderColor: '#D6E3F1',
  backgroundColor: '#F7FBFF',
  textColor: '#0F172A',
  mutedColor: '#475569',
}

export const CERTIFICATE_RENDER_WIDTH_PX = 1200
export const CERTIFICATE_RENDER_HEIGHT_PX = 849
