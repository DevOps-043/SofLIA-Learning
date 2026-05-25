import type { ReportsAnalyticsAiInsights } from '../../types/reports-analytics.types'
import { extractJsonObject } from './reports-analytics.ai-payload.service'

type UnknownSection = { title?: unknown; points?: unknown }
type UnknownMetric = { label?: unknown; value?: unknown; detail?: unknown }

export function parseReportsAnalyticsInsights(
  value: string | undefined,
  model: string,
): ReportsAnalyticsAiInsights | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<ReportsAnalyticsAiInsights>
    if (!parsed.summary || !Array.isArray(parsed.findings)) return null
    return {
      generatedAt: new Date().toISOString(),
      model,
      summary: String(parsed.summary),
      executiveMetrics: normalizeMetrics(parsed.executiveMetrics),
      findings: normalizeSections(parsed.findings, 8),
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 8) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String).slice(0, 8) : [],
      actionPlan: Array.isArray(parsed.actionPlan) ? normalizeSections(parsed.actionPlan, 4) : [],
    }
  } catch {
    return null
  }
}

function normalizeMetrics(value: unknown): ReportsAnalyticsAiInsights['executiveMetrics'] {
  if (!Array.isArray(value)) return []
  return value
    .filter((metric) => metric && typeof metric === 'object')
    .slice(0, 6)
    .map((metric) => {
      const item = metric as UnknownMetric
      return { label: String(item.label || ''), value: String(item.value || ''), detail: String(item.detail || '') }
    })
}

function normalizeSections(value: unknown[], limit: number): ReportsAnalyticsAiInsights['findings'] {
  return value
    .filter((section) => section && typeof section === 'object')
    .slice(0, limit)
    .map((section) => {
      const item = section as UnknownSection
      const points = Array.isArray(item.points) ? item.points.map(String).slice(0, 5) : []
      return { title: String(item.title || ''), points }
    })
}
