import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'
import { FALLBACK_TEXT_EN } from './fallback-text.en'
import { FALLBACK_TEXT_ES } from './fallback-text.es'
import { FALLBACK_TEXT_PT } from './fallback-text.pt'

export const FALLBACK_TEXT = {
  en: FALLBACK_TEXT_EN,
  es: FALLBACK_TEXT_ES,
  pt: FALLBACK_TEXT_PT,
} satisfies Record<ReportsAnalyticsLocale, typeof FALLBACK_TEXT_ES>
