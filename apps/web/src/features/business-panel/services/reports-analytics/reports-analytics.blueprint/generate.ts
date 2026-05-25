import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/utils/logger'
import {
  buildReportsAnalyticsAiPayload,
  resolveReportsAnalyticsGeminiModel,
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
  const model = resolveReportsAnalyticsGeminiModel()

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
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: parsePositiveInt(process.env.REPORTS_ANALYTICS_AI_MAX_OUTPUT_TOKENS, 3200),
          responseMimeType: 'application/json',
        },
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
