import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../types/reports-analytics.types'
import { buildReportsAnalyticsAiPayload } from './reports-analytics.ai-payload.service'
import { buildFallbackInsights } from './reports-analytics-insights/fallback'
import { reconcileReportsAnalyticsInsights } from './reports-analytics-insights/integrity'
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
 * Tope de espera del proveedor de IA. Sin él, si el proveedor se cuelga (modelo
 * saturado, payload grande), la FUNCIÓN SERVERLESS supera su límite de ejecución
 * y la plataforma la mata con un 502 antes de que podamos responder. Con este
 * timeout abortamos a tiempo y devolvemos el análisis de respaldo (200) en vez
 * de 502. Configurable por si el límite de la plataforma es mayor/menor.
 */
const AI_TIMEOUT_MS = Number(process.env.REPORTS_INSIGHTS_GEMINI_TIMEOUT_MS) || 22_000

export async function generateReportsAnalyticsInsights({
  dataset,
  locale,
}: GenerateReportsAnalyticsInsightsParams): Promise<ReportsAnalyticsAiInsights> {
  const settings = await getAiModelSettings('reports_analytics_insights')
  const model = settings.model

  if (!(await isAiPurposeAvailable('reports_analytics_insights'))) {
    return buildFallbackInsights(dataset, locale, model)
  }

  try {
    const result = await generateAiText({
      circuitBreakerName: 'reports-analytics-insights',
      prompt: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)),
      purpose: 'reports_analytics_insights',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      systemInstruction: (dialect) => buildSystemPrompt(dialect, locale),
      timeoutMs: AI_TIMEOUT_MS,
    })

    const parsed = parseInsights(result.text, result.model)
    if (parsed) return reconcileReportsAnalyticsInsights(dataset, parsed, locale)
  } catch (error) {
    logger.error('Reports analytics AI insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, model)
}
