import type {
  ReportsAnalyticsAiInsightSection,
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { buildFallbackInsights } from './fallback'

/**
 * Separa hechos de interpretacion: todas las cifras visibles se reconstruyen
 * deterministicamente desde el mismo dataset que alimenta el panel.
 */
export function reconcileReportsAnalyticsInsights(
  dataset: ReportsAnalyticsDataset,
  generated: ReportsAnalyticsAiInsights,
  locale: ReportsAnalyticsLocale,
): ReportsAnalyticsAiInsights {
  const verified = buildFallbackInsights(dataset, locale, generated.model)
  const recommendations = generated.recommendations
    .map((item) => item.trim())
    .filter(isOperationalText)
    .slice(0, 8)
  const actionPlan = sanitizeActionPlan(generated.actionPlan)

  return {
    ...verified,
    generatedAt: generated.generatedAt,
    model: generated.model,
    recommendations: recommendations.length >= 3
      ? recommendations
      : verified.recommendations,
    actionPlan: actionPlan.length > 0 ? actionPlan : verified.actionPlan,
  }
}

function sanitizeActionPlan(
  sections: ReportsAnalyticsAiInsightSection[] | undefined,
): ReportsAnalyticsAiInsightSection[] {
  if (!sections) return []

  return sections
    .map((section) => ({
      title: section.title.trim(),
      points: section.points
        .map((point) => point.trim())
        .filter(isOperationalText)
        .slice(0, 5),
    }))
    .filter((section) => section.title.length > 0 && section.points.length > 0)
    .slice(0, 5)
}

/** Las recomendaciones aportan criterio, pero las cifras solo salen del dataset. */
function isOperationalText(value: string): boolean {
  return value.length > 0 && !/\d/.test(value)
}
