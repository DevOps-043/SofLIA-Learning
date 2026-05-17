import type { ReportsAnalyticsAiInsights } from '../../../types/reports-analytics.types'
import { extractJsonObject } from '../reports-analytics.ai-payload.service'

const toMetric = (metric: unknown) => ({
  label: String((metric as { label?: unknown }).label || ''),
  value: String((metric as { value?: unknown }).value || ''),
  detail: String((metric as { detail?: unknown }).detail || ''),
})

const toSection = (section: unknown) => ({
  title: String((section as { title?: unknown }).title || ''),
  points: Array.isArray((section as { points?: unknown }).points)
    ? ((section as { points: unknown[] }).points).map(String).slice(0, 5)
    : [],
})

export function parseInsights(value: string | undefined, model: string): ReportsAnalyticsAiInsights | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<ReportsAnalyticsAiInsights>
    if (!parsed.summary || !Array.isArray(parsed.findings)) return null

    return {
      generatedAt: new Date().toISOString(),
      model,
      summary: String(parsed.summary),
      executiveMetrics: Array.isArray(parsed.executiveMetrics)
        ? parsed.executiveMetrics.filter((metric) => metric && typeof metric === 'object').slice(0, 6).map(toMetric)
        : [],
      findings: parsed.findings.filter((section) => section && typeof section === 'object').slice(0, 8).map(toSection),
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 8) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String).slice(0, 8)
        : [],
      actionPlan: Array.isArray(parsed.actionPlan)
        ? parsed.actionPlan.filter((section) => section && typeof section === 'object').slice(0, 4).map(toSection)
        : [],
    }
  } catch {
    return null
  }
}
