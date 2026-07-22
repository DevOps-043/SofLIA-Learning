import {
  ReportsAnalyticsDataset,
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
} from '../../../types/reports-analytics.types'
import { PLATFORM_DEFAULT_GEMINI_MODEL } from '@/lib/ai/model-settings/purposes'
import { getBlueprintCopy } from './copy'
import { buildDefaultArtifactPlan, buildDefaultSections } from './defaults'
import { buildFallbackFeaturedMetrics } from './fallback-metrics'
import { normalizeBlueprint } from './normalize'

export function buildFallbackReportsAnalyticsBlueprint(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  // Los llamadores de producción siempre pasan el modelo efectivo; este default
  // solo etiqueta el blueprint cuando se construye sin contexto de modelo.
  model = PLATFORM_DEFAULT_GEMINI_MODEL,
  format: ReportsAnalyticsExportFormat = 'xlsx',
): ReportsAnalyticsReportBlueprint {
  const copy = getBlueprintCopy(locale)
  const topCourse = [...dataset.courses]
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments || a.averageProgress - b.averageProgress)[0]
  const weakestSegment = [
    ...dataset.segments.ageBands,
    ...dataset.segments.gender,
    ...dataset.segments.jobTitles,
    ...dataset.segments.roles,
  ].sort((a, b) => a.qualityScore - b.qualityScore || a.averageProgress - b.averageProgress)[0]

  return normalizeBlueprint(
    {
      generatedAt: new Date().toISOString(),
      model: `${model}:fallback`,
      source: 'fallback',
      summary: copy.summary(dataset.overview.averageProgress, dataset.overview.qualityScore),
      sections: buildDefaultSections(copy),
      featuredMetrics: buildFallbackFeaturedMetrics(dataset, copy),
      findings: [
        {
          title: copy.learningFinding,
          points: [
            copy.learningPoint(dataset.learning.completedCourses, dataset.learning.assignedCourses),
            topCourse ? copy.courseRisk(topCourse.courseTitle, topCourse.overdueAssignments) : copy.noCourseRisk,
          ],
        },
        {
          title: copy.segmentFinding,
          points: [
            weakestSegment ? copy.segmentRisk(weakestSegment.label, weakestSegment.qualityScore) : copy.noSegmentRisk,
            copy.dataQualityPoint(dataset.dataQuality.demographicsCompletionRate),
          ],
        },
      ],
      risks: [
        copy.overdueRisk(dataset.learning.overdueAssignments),
        copy.helpRisk(dataset.quality.helpRate),
      ],
      recommendations: [
        copy.recommendSoflia,
        copy.recommendCourse,
        copy.recommendData,
      ],
      artifactPlan: buildDefaultArtifactPlan(copy),
    },
    { dataset, locale, model, format },
  )
}
