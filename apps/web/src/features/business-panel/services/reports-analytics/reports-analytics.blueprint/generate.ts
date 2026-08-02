import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '@/lib/utils/logger'
import { buildReportsAnalyticsAiPayload } from '../reports-analytics.ai-payload.service'
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
  const settings = await getAiModelSettings('reports_analytics_blueprint')
  const model = settings.model

  if (!(await isAiPurposeAvailable('reports_analytics_blueprint'))) {
    return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
  }

  try {
    const result = await generateAiText({
      circuitBreakerName: 'reports-analytics-blueprint',
      prompt: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)),
      purpose: 'reports_analytics_blueprint',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      systemInstruction: (dialect) => buildBlueprintSystemPrompt(dialect, locale, format),
      timeoutMs: parsePositiveInt(process.env.REPORTS_ANALYTICS_AI_TIMEOUT_MS, 12_000),
    })

    const parsed = parseReportsAnalyticsBlueprint(result.text, {
      dataset,
      locale,
      model: result.model,
      format,
      source: result.provider === 'openai' ? 'openai' : 'gemini',
    })

    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics AI blueprint failed', error)
  }

  return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
}
