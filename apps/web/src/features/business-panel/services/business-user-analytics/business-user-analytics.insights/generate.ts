import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '@/lib/utils/logger'
import type {
  BusinessUserAnalyticsDataset,
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
} from '../../../types/business-user-analytics.types'
import { buildFallbackInsights } from './fallback'
import { buildInsightPayload } from './payload'
import { parseInsights } from './parse'
import { buildSystemPrompt } from './prompt'
import { buildUnavailableInsights } from './unavailable'

interface GenerateBusinessUserAnalyticsInsightsParams {
  dataset: BusinessUserAnalyticsDataset
  locale: BusinessUserAnalyticsLocale
}

export async function generateBusinessUserAnalyticsInsights({
  dataset,
  locale,
}: GenerateBusinessUserAnalyticsInsightsParams): Promise<BusinessUserAnalyticsInsights> {
  const settings = await getAiModelSettings('business_user_analytics')
  const model = settings.model

  if (!(await isAiPurposeAvailable('business_user_analytics'))) {
    return buildUnavailableInsights(locale, model)
  }

  try {
    const result = await generateAiText({
      circuitBreakerName: 'business-user-analytics-insights',
      prompt: JSON.stringify(buildInsightPayload(dataset)),
      purpose: 'business_user_analytics',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      systemInstruction: (dialect) => buildSystemPrompt(dialect, locale),
    })

    const parsed = parseInsights(result.text, result.model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Business user analytics AI insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, `${model}:fallback`)
}
