import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsAiKudo,
  ReportsAnalyticsAiSegmentHighlight,
  ReportsAnalyticsAiUrgentAction,
} from '../../../types/reports-analytics.types'
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

const toUrgentAction = (action: unknown): ReportsAnalyticsAiUrgentAction => ({
  priority: (action as { priority?: string }).priority === 'high' ? 'high' : 'medium',
  title: String((action as { title?: unknown }).title || ''),
  description: String((action as { description?: unknown }).description || ''),
  affectedUsers: Number((action as { affectedUsers?: unknown }).affectedUsers ?? 0),
  timeline: String((action as { timeline?: unknown }).timeline || ''),
})

const toSegmentHighlight = (item: unknown): ReportsAnalyticsAiSegmentHighlight => ({
  segment: String((item as { segment?: unknown }).segment || ''),
  insight: String((item as { insight?: unknown }).insight || ''),
})

const toKudo = (item: unknown): ReportsAnalyticsAiKudo => ({
  title: String((item as { title?: unknown }).title || ''),
  description: String((item as { description?: unknown }).description || ''),
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
        ? parsed.executiveMetrics.filter((m) => m && typeof m === 'object').slice(0, 6).map(toMetric)
        : [],
      findings: parsed.findings.filter((s) => s && typeof s === 'object').slice(0, 8).map(toSection),
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 8) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String).slice(0, 8)
        : [],
      actionPlan: Array.isArray(parsed.actionPlan)
        ? parsed.actionPlan.filter((s) => s && typeof s === 'object').slice(0, 5).map(toSection)
        : [],
      urgentActions: Array.isArray(parsed.urgentActions)
        ? parsed.urgentActions.filter((a) => a && typeof a === 'object').slice(0, 5).map(toUrgentAction)
        : [],
      segmentHighlights: Array.isArray(parsed.segmentHighlights)
        ? parsed.segmentHighlights.filter((s) => s && typeof s === 'object').slice(0, 6).map(toSegmentHighlight)
        : [],
      kudos: Array.isArray(parsed.kudos)
        ? parsed.kudos.filter((k) => k && typeof k === 'object').slice(0, 4).map(toKudo)
        : [],
    }
  } catch {
    return null
  }
}
