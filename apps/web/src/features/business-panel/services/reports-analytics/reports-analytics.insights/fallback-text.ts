import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'
import { fallbackTextEn } from './fallback-text.en'
import { fallbackTextEs } from './fallback-text.es'
import { fallbackTextPt } from './fallback-text.pt'

export const FALLBACK_TEXT = {
  es: fallbackTextEs,
  en: fallbackTextEn,
  pt: fallbackTextPt,
} satisfies Record<ReportsAnalyticsLocale, typeof fallbackTextEs>
