import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { FALLBACK_TEXT } from './fallback-text'

export function buildFallbackInsights(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  model: string,
): ReportsAnalyticsAiInsights {
  const bestRegion = dataset.rankings.regions[0]
  const riskCourse = dataset.courses[0]
  const weakestAgeBand = [...dataset.segments.ageBands].sort((a, b) => a.qualityScore - b.qualityScore)[0]
  const language = FALLBACK_TEXT[locale] || FALLBACK_TEXT.es

  return {
    generatedAt: new Date().toISOString(),
    model: `${model}:fallback`,
    summary: language.summary(dataset.overview.qualityScore, dataset.overview.averageProgress),
    executiveMetrics: [
      {
        label: language.metricProgress,
        value: `${dataset.overview.averageProgress}%`,
        detail: language.metricProgressDetail(dataset.overview.completionRate, dataset.learning.medianCompletionDays),
      },
      {
        label: language.metricSoflia,
        value: `${dataset.overview.sofliaAdoptionRate}%`,
        detail: language.metricSofliaDetail(dataset.soflia.totalConversations, dataset.soflia.totalMessages),
      },
      {
        label: language.metricQuality,
        value: `${dataset.quality.overallScore}%`,
        detail: language.metricQualityDetail(dataset.quality.quizScore, dataset.quality.activityScore, dataset.quality.sofliaScore),
      },
    ],
    findings: [
      {
        title: language.learningTitle,
        points: [
          language.learningPoint(dataset.overview.completionRate, dataset.learning.averageCompletionDays),
          riskCourse ? language.riskCourse(riskCourse.courseTitle, riskCourse.overdueAssignments) : language.noRiskCourse,
        ],
      },
      {
        title: language.adoptionTitle,
        points: [
          language.adoptionPoint(dataset.overview.sofliaAdoptionRate, dataset.overview.notesAdoptionRate),
          bestRegion ? language.bestRegion(bestRegion.name, bestRegion.rankScore) : language.noHierarchy,
        ],
      },
      {
        title: language.qualityTitle,
        points: [
          language.qualityPoint(dataset.quality.overallScore, dataset.quality.offTopicRate),
          weakestAgeBand ? language.segmentPoint(weakestAgeBand.label, weakestAgeBand.qualityScore) : language.noSegment,
        ],
      },
    ],
    risks: [language.riskQuality(dataset.quality.helpRate), language.riskData(dataset.dataQuality.demographicsCompletionRate)],
    recommendations: [language.recommendSoflia, language.recommendHierarchy, language.recommendQuality],
    actionPlan: [{
      title: language.actionPlanTitle,
      points: [language.actionPlanSegment, language.actionPlanCourse, language.actionPlanData],
    }],
  }
}
