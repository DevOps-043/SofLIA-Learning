import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../types/reports-analytics.types'
import {
  buildReportsAnalyticsAiPayload,
  resolveReportsAnalyticsGeminiModel,
} from './reports-analytics.ai-payload.service'
import { buildFallbackInsights } from './reports-analytics-insights/fallback'
import { parseInsights } from './reports-analytics-insights/parse'
import { buildSystemPrompt } from './reports-analytics-insights/prompt'

interface GenerateReportsAnalyticsInsightsParams {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  requestedByUserId?: string
}

export { buildReportsAnalyticsInsightsFilename } from './reports-analytics-insights/filename'
export { generateReportsAnalyticsInsightsPdf } from './reports-analytics-insights/pdf'

export async function generateReportsAnalyticsInsights({
  dataset,
  locale,
}: GenerateReportsAnalyticsInsightsParams): Promise<ReportsAnalyticsAiInsights> {
  const apiKey = process.env.GOOGLE_API_KEY
  const model = resolveReportsAnalyticsGeminiModel()

  if (!apiKey) {
    return buildFallbackInsights(dataset, locale, model)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: buildSystemPrompt(locale),
    })
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    })

    const parsed = parseInsights(result.response.text(), model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, model)
}
