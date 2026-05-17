import type {
  ReportsAnalyticsReportBlueprint,
  ReportsAnalyticsReportSectionId,
} from '../../../types/reports-analytics.types'
import { buildDefaultArtifactPlan, buildDefaultSections } from './defaults'
import { buildFallbackFeaturedMetrics } from './fallback-metrics'
import { getBlueprintCopy } from './copy'
import type { NormalizeReportsAnalyticsBlueprintContext } from './types'

export function normalizeBlueprint(
  blueprint: ReportsAnalyticsReportBlueprint,
  context: NormalizeReportsAnalyticsBlueprintContext,
): ReportsAnalyticsReportBlueprint {
  const { dataset, locale, model } = context
  const copy = getBlueprintCopy(locale)
  const fallback = {
    ...blueprint,
    generatedAt: blueprint.generatedAt || new Date().toISOString(),
    model: blueprint.model || model,
    summary: blueprint.summary || copy.summary(dataset.overview.averageProgress, dataset.overview.qualityScore),
  }
  const sectionMap = new Map<ReportsAnalyticsReportSectionId, ReportsAnalyticsReportBlueprint['sections'][number]>()
  for (const section of [...fallback.sections, ...buildDefaultSections(copy)]) {
    if (!sectionMap.has(section.id)) sectionMap.set(section.id, section)
  }
  const artifactMap = new Map<ReportsAnalyticsReportSectionId, ReportsAnalyticsReportBlueprint['artifactPlan'][number]>()
  for (const artifact of [...fallback.artifactPlan, ...buildDefaultArtifactPlan(copy)]) {
    if (!artifactMap.has(artifact.id)) artifactMap.set(artifact.id, artifact)
  }

  return {
    ...fallback,
    source: fallback.source,
    sections: Array.from(sectionMap.values()).sort((a, b) => a.priority - b.priority),
    featuredMetrics: fallback.featuredMetrics.length > 0
      ? fallback.featuredMetrics.slice(0, 8)
      : buildFallbackFeaturedMetrics(dataset, copy),
    findings: fallback.findings.slice(0, 8),
    risks: fallback.risks.slice(0, 8),
    recommendations: fallback.recommendations.slice(0, 8),
    artifactPlan: Array.from(artifactMap.values()),
  }
}
