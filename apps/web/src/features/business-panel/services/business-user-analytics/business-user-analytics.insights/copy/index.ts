import type { BusinessUserAnalyticsLocale } from '../../../../types/business-user-analytics.types'
import type { FallbackInsightsText } from '../types'
import { enFallbackText } from './en'
import { esFallbackText } from './es'
import { ptFallbackText } from './pt'

const FALLBACK_TEXT: Record<BusinessUserAnalyticsLocale, FallbackInsightsText> = {
  es: esFallbackText,
  en: enFallbackText,
  pt: ptFallbackText,
}

export function getFallbackText(locale: BusinessUserAnalyticsLocale): FallbackInsightsText {
  return FALLBACK_TEXT[locale] || FALLBACK_TEXT.es
}
