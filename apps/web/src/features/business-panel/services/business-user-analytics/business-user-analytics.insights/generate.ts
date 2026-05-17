import { GoogleGenerativeAI } from '@google/generative-ai'
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
  const model = process.env.REPORTS_ANALYTICS_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'

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
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1800,
        responseMimeType: 'application/json',
      },
    })

    const parsed = parseInsights(result.response.text(), model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Business user analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, `${model}:fallback`)
}
