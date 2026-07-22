import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
import { logger } from '@/lib/utils/logger'
import {
  buildReportsAnalyticsAiPayload,
  withReportsAnalyticsAiTimeout,
} from '../reports-analytics.ai-payload.service'
import { buildFallbackReportsAnalyticsBlueprint } from './fallback'
import { parseReportsAnalyticsBlueprint } from './parse'
import { buildBlueprintSystemPrompt } from './prompt'
import type { GenerateReportsAnalyticsReportBlueprintParams } from './types'
import { parsePositiveInt } from './utils'

export async function generateReportsAnalyticsReportBlueprint({
  dataset,
  locale,
  format,
}: GenerateReportsAnalyticsReportBlueprintParams) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const settings = await getAiModelSettings('reports_analytics_blueprint')
  const model = settings.model

  if (!apiKey) {
    return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: buildBlueprintSystemPrompt(locale, format),
    })
    const result = await withReportsAnalyticsAiTimeout(
      generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)) }],
        }],
        generationConfig: buildManagedGenerationConfig(settings, {
          // No administrable: la respuesta se parsea como JSON obligatoriamente.
          responseMimeType: 'application/json',
        }),
      }),
      parsePositiveInt(process.env.REPORTS_ANALYTICS_AI_TIMEOUT_MS, 12_000),
    )
    const parsed = parseReportsAnalyticsBlueprint(result.response.text(), {
      dataset,
      locale,
      model,
      format,
      source: 'gemini',
    })

    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics Gemini blueprint failed', error)
  }

  return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
}
