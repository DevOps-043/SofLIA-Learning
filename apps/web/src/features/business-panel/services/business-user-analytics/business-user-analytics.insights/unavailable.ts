import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
} from '../../../types/business-user-analytics.types'
import { getFallbackText } from './copy'

export function buildUnavailableInsights(
  locale: BusinessUserAnalyticsLocale,
  model: string,
): BusinessUserAnalyticsInsights {
  const text = getFallbackText(locale)

  return {
    generatedAt: new Date().toISOString(),
    model: `${model}:unavailable`,
    cached: false,
    expiresAt: null,
    unavailable: true,
    summary: text.unavailable,
    metrics: [],
    strengths: [],
    opportunities: [],
    recommendations: [],
    nextSteps: [],
  }
}
