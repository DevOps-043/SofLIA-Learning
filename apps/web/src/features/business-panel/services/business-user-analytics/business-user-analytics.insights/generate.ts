import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
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
  const apiKey = process.env.GOOGLE_API_KEY
  const settings = await getAiModelSettings('business_user_analytics')
  const model = settings.model

  if (!apiKey) {
    return buildUnavailableInsights(locale, model)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: buildSystemPrompt(locale),
    })
    const result = await generativeModel.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: JSON.stringify(buildInsightPayload(dataset)) }],
      }],
      generationConfig: buildManagedGenerationConfig(settings, {
        // No administrable: la respuesta se parsea como JSON obligatoriamente.
        responseMimeType: 'application/json',
      }),
    })

    const parsed = parseInsights(result.response.text(), model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Business user analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, `${model}:fallback`)
}
