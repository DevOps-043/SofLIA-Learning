import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsAiKudo,
  ReportsAnalyticsAiSegmentHighlight,
  ReportsAnalyticsAiUrgentAction,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED } from '../reports-analytics.helpers'
import { FALLBACK_TEXT } from './fallback-text'

export function buildFallbackInsights(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  model: string,
): ReportsAnalyticsAiInsights {
  const language = FALLBACK_TEXT[locale] ?? FALLBACK_TEXT.es
  const ov = dataset.overview

  // Rankings — assumed sorted best-first by rankScore
  const hasComparableRegions = dataset.rankings.regions.length > 1
  const hasComparableTeams = dataset.rankings.teams.length > 1
  const bestRegion = hasComparableRegions ? dataset.rankings.regions[0] : undefined
  const worstRegion = hasComparableRegions
    ? dataset.rankings.regions[dataset.rankings.regions.length - 1]
    : undefined
  const bestTeam = hasComparableTeams ? dataset.rankings.teams[0] : undefined
  const worstTeam = hasComparableTeams
    ? dataset.rankings.teams[dataset.rankings.teams.length - 1]
    : undefined

  // Riskiest course by overdue count
  const riskCourse = [...dataset.courses]
    .filter((c) => c.overdueAssignments > 0)
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments)[0]

  // Weakest age band — exclude 'unspecified' sentinel and segments with no users
  const validAgeBands = dataset.segments.ageBands.filter(
    (b) => b.label !== REPORTS_ANALYTICS_UNSPECIFIED && b.users > 0,
  )
  const weakestAgeBand = validAgeBands.length > 1
    ? [...validAgeBands].sort((a, b) => a.qualityScore - b.qualityScore)[0]
    : null

  // ─── Summary (richer, 4 data points) ───────────────────────────────────────
  const summary = language.summary(
    dataset.quality.overallScore,
    ov.averageProgress,
    ov.atRiskUsersCount,
    ov.complianceRate,
    dataset.quality.evidenceCount,
  )

  // ─── Executive metrics (6) ─────────────────────────────────────────────────
  const executiveMetrics = [
    {
      label: language.metricProgress,
      value: `${ov.averageProgress}%`,
      detail: language.metricProgressDetail(ov.completionRate, dataset.learning.medianCompletionDays),
    },
    {
      label: language.metricSoflia,
      value: `${ov.sofliaAdoptionRate}%`,
      detail: language.metricSofliaDetail(dataset.soflia.totalConversations, dataset.soflia.totalMessages),
    },
    {
      label: language.metricQuality,
      value: `${dataset.quality.overallScore}%`,
      detail: language.metricQualityDetail(dataset.quality.quizScore, dataset.quality.activityScore, dataset.quality.evidenceCount),
    },
    {
      label: language.metricAtRisk,
      value: `${ov.atRiskUsersCount}`,
      detail: language.metricAtRiskDetail(ov.atRiskUsersCount, ov.atRiskRate),
    },
    {
      label: language.metricActiveLearners,
      value: `${ov.activeLearners}`,
      detail: language.metricActiveLearnerDetail(ov.activeLearners, ov.activeLearnerRate),
    },
    {
      label: language.metricCompliance,
      value: `${ov.complianceRate}%`,
      detail: language.metricComplianceDetail(ov.complianceRate),
    },
  ]

  // ─── Findings (3 sections) ─────────────────────────────────────────────────
  const findings = [
    {
      title: language.learningTitle,
      points: [
        language.learningPoint(ov.completionRate, dataset.learning.averageCompletionDays),
        riskCourse
          ? language.riskCourse(riskCourse.courseTitle, riskCourse.overdueAssignments)
          : language.noRiskCourse,
      ],
    },
    {
      title: language.adoptionTitle,
      points: [
        language.adoptionPoint(ov.sofliaAdoptionRate, ov.notesAdoptionRate),
        bestRegion
          ? language.bestRegion(bestRegion.name, bestRegion.rankScore)
          : language.noHierarchy,
      ],
    },
    {
      title: language.qualityTitle,
      points: [
        language.qualityPoint(dataset.quality.overallScore, dataset.quality.evidenceCount),
        weakestAgeBand
          ? language.segmentPoint(
            formatAgeBandLabel(weakestAgeBand.label, locale),
            weakestAgeBand.qualityScore,
            weakestAgeBand.users,
          )
          : language.noSegment,
      ],
    },
  ]

  // ─── Risks (up to 5) ───────────────────────────────────────────────────────
  const risks: string[] = [
    language.riskQuality(dataset.quality.helpRate),
    language.riskData(dataset.dataQuality.demographicsCompletionRate),
  ]
  if (ov.inactiveUsersCount > 0) {
    risks.push(language.riskInactive(ov.inactiveUsersCount))
  }
  if (ov.overdueAssignments > 0) {
    risks.push(language.riskOverdue(ov.overdueAssignments))
  }

  // ─── Recommendations (5) ──────────────────────────────────────────────────
  const recommendations = [language.recommendSoflia, language.recommendQuality]
  if (hasComparableRegions || hasComparableTeams) {
    recommendations.push(language.recommendHierarchy)
  }
  if (ov.inactiveUsersCount > 0) {
    recommendations.push(language.recommendInactive)
  }

  // ─── Action plan (2 sections) ─────────────────────────────────────────────
  const actionPlan = [
    {
      title: language.actionPlanTitle,
      points: [
        language.actionPlanAtRiskUsers,
        language.actionPlanCourse,
        language.actionPlanSegment,
      ],
    },
    {
      title: language.actionPlanAtRiskTitle,
      points: [
        language.actionPlanData,
      ],
    },
  ]

  // ─── Urgent actions (conditional) ─────────────────────────────────────────
  const urgentActions: ReportsAnalyticsAiUrgentAction[] = []
  if (ov.atRiskUsersCount > 0) {
    urgentActions.push({
      priority: ov.atRiskUsersCount >= 5 ? 'high' : 'medium',
      title: language.urgentAtRiskTitle,
      description: language.urgentAtRiskDesc(ov.atRiskUsersCount),
      affectedUsers: ov.atRiskUsersCount,
      timeline: language.urgentAtRiskTimeline,
    })
  }
  if (ov.overdueAssignments > 0) {
    urgentActions.push({
      priority: ov.overdueAssignments >= 10 ? 'high' : 'medium',
      title: language.urgentOverdueTitle,
      description: language.urgentOverdueDesc(ov.overdueAssignments),
      affectedUsers: Math.min(ov.overdueAssignments, ov.assignedUsersCount),
      timeline: language.urgentOverdueTimeline,
    })
  }

  // ─── Segment highlights (from rankings) ───────────────────────────────────
  const segmentHighlights: ReportsAnalyticsAiSegmentHighlight[] = []
  if (bestRegion) {
    segmentHighlights.push({
      segment: bestRegion.name,
      insight: language.bestRegionHighlight(bestRegion.name, bestRegion.rankScore),
    })
  }
  if (worstRegion && worstRegion.id !== bestRegion?.id) {
    segmentHighlights.push({
      segment: worstRegion.name,
      insight: language.worstRegionHighlight(worstRegion.name, worstRegion.rankScore),
    })
  }
  if (bestTeam) {
    segmentHighlights.push({
      segment: bestTeam.name,
      insight: language.bestTeamHighlight(bestTeam.name, bestTeam.rankScore),
    })
  }
  if (worstTeam && worstTeam.id !== bestTeam?.id) {
    segmentHighlights.push({
      segment: worstTeam.name,
      insight: language.worstTeamHighlight(worstTeam.name, worstTeam.rankScore),
    })
  }

  // ─── Kudos (when metrics exceed healthy thresholds) ───────────────────────
  const kudos: ReportsAnalyticsAiKudo[] = []
  if (ov.completionRate >= 70) {
    kudos.push({
      title: language.kudoCompletionTitle,
      description: language.kudoCompletionDesc(ov.completionRate),
    })
  }
  if (dataset.quality.overallScore >= 70) {
    kudos.push({
      title: language.kudoQualityTitle,
      description: language.kudoQualityDesc(dataset.quality.overallScore),
    })
  }
  if (ov.sofliaAdoptionRate >= 50) {
    kudos.push({
      title: language.kudoAdoptionTitle,
      description: language.kudoAdoptionDesc(ov.sofliaAdoptionRate),
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    model: `${model}:fallback`,
    summary,
    executiveMetrics,
    findings,
    risks,
    recommendations,
    actionPlan,
    urgentActions: urgentActions.length > 0 ? urgentActions : undefined,
    segmentHighlights: segmentHighlights.length > 0 ? segmentHighlights : undefined,
    kudos: kudos.length > 0 ? kudos : undefined,
  }
}

function formatAgeBandLabel(label: string, locale: ReportsAnalyticsLocale): string {
  const range = label.match(/^(\d{2})_(\d{2})$/)
  if (range) return `${range[1]}–${range[2]}`
  if (label === 'under_25') {
    return locale === 'en' ? 'Under 25' : locale === 'pt' ? 'Menos de 25' : 'Menos de 25'
  }
  if (label === '55_plus') {
    return locale === 'en' ? '55 or older' : locale === 'pt' ? '55 ou mais' : '55 o más'
  }
  return label.replaceAll('_', ' ')
}
