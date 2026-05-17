import type { BusinessUserAnalyticsInsights } from '../../../types/business-user-analytics.types'
import { extractJsonObject } from './json'

type UnknownRecord = Record<string, unknown>

export function parseInsights(value: string | undefined, model: string): BusinessUserAnalyticsInsights | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<BusinessUserAnalyticsInsights>
    if (!parsed.summary) return null

    return {
      generatedAt: new Date().toISOString(),
      model,
      cached: false,
      expiresAt: null,
      summary: String(parsed.summary),
      metrics: normalizeMetrics(parsed.metrics),
      strengths: normalizeTextList(parsed.strengths),
      opportunities: normalizeTextList(parsed.opportunities),
      recommendations: normalizeTextList(parsed.recommendations),
      nextSteps: normalizeNextSteps(parsed.nextSteps),
    }
  } catch {
    return null
  }
}

function normalizeMetrics(value: unknown) {
  return Array.isArray(value)
    ? value.filter(isRecord).slice(0, 6).map((metric) => ({
      label: String(metric.label || ''),
      value: String(metric.value || ''),
      detail: String(metric.detail || ''),
    }))
    : []
}

function normalizeNextSteps(value: unknown) {
  return Array.isArray(value)
    ? value.filter(isRecord).slice(0, 4).map((section) => ({
      title: String(section.title || ''),
      points: Array.isArray(section.points) ? section.points.map(String).slice(0, 5) : [],
    }))
    : []
}

function normalizeTextList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).slice(0, 6) : []
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
