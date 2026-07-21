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

/**
 * Tope de espera para Gemini. La llamada al SDK NO tiene timeout propio: si Gemini se
 * cuelga (modelo saturado, payload grande), la FUNCIÓN SERVERLESS supera su límite de
 * ejecución y la plataforma la mata con un 502 antes de que podamos responder. Con este
 * timeout abortamos a tiempo y devolvemos el análisis de respaldo (200) en vez de 502.
 * Configurable por si el límite de la plataforma es mayor/menor.
 */
const GEMINI_TIMEOUT_MS = Number(process.env.REPORTS_INSIGHTS_GEMINI_TIMEOUT_MS) || 22_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('gemini-timeout')), ms),
    ),
  ])
}

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
    const result = await withTimeout(
      generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      }),
      GEMINI_TIMEOUT_MS,
    )

    const parsed = parseInsights(result.response.text(), model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, model)
}
