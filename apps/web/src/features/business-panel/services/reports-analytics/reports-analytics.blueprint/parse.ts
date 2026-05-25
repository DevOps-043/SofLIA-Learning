import type { ReportsAnalyticsReportBlueprint } from '../../../types/reports-analytics.types'
import { extractJsonObject } from '../reports-analytics.ai-payload.service'
import { normalizeBlueprint } from './normalize'
import { blueprintSchema } from './schema'
import type { ParseReportsAnalyticsBlueprintContext } from './types'
import { sanitizeText } from './utils'

export function parseReportsAnalyticsBlueprint(
  rawValue: string | undefined,
  context: ParseReportsAnalyticsBlueprintContext,
): ReportsAnalyticsReportBlueprint | null {
  if (!rawValue) return null

  try {
    const parsed = blueprintSchema.parse(JSON.parse(extractJsonObject(rawValue)))
    return normalizeBlueprint(
      {
        generatedAt: new Date().toISOString(),
        model: context.model,
        source: context.source || 'gemini',
        summary: sanitizeText(parsed.summary, 900),
        sections: parsed.sections.map((section) => ({
          id: section.id,
          title: sanitizeText(section.title, 80),
          purpose: sanitizeText(section.purpose, 180),
          priority: section.priority,
        })),
        featuredMetrics: parsed.featuredMetrics.map((metric) => ({
          label: sanitizeText(metric.label, 80),
          value: sanitizeText(metric.value, 60),
          detail: sanitizeText(metric.detail, 160),
        })),
        findings: parsed.findings.map((section) => ({
          title: sanitizeText(section.title, 100),
          points: section.points.map((point) => sanitizeText(point, 220)),
        })),
        risks: parsed.risks.map((risk) => sanitizeText(risk, 220)),
        recommendations: parsed.recommendations.map((recommendation) => sanitizeText(recommendation, 220)),
        artifactPlan: parsed.artifactPlan.map((artifact) => ({
          id: artifact.id,
          title: sanitizeText(artifact.title, 80),
          description: sanitizeText(artifact.description, 180),
          includeInCsv: artifact.includeInCsv,
          includeInWorkbook: artifact.includeInWorkbook,
        })),
      },
      context,
    )
  } catch {
    return null
  }
}
