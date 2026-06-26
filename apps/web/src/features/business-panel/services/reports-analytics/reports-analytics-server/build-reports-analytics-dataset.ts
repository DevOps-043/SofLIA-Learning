import type { ReportsAnalyticsDataset, ReportsAnalyticsFilters } from '../../../types/reports-analytics.types'
import { buildConnectionCalendar, buildLoginHeatmap } from '../reports-analytics.helpers'
import { applyReportsAnalyticsRecords } from './apply-reports-analytics-records'
import { buildActivities } from './build-activities'
import { buildDataQuality } from './build-data-quality'
import { buildDemographics } from './build-demographics'
import { buildFilterOptions } from './build-filter-options'
import { buildLearning } from './build-learning'
import { buildNotes } from './build-notes'
import { buildOverviewMetrics } from './build-overview-metrics'
import { buildPlanner } from './build-planner'
import { buildQuality } from './build-quality'
import { buildRankings } from './build-rankings'
import { buildSegments } from './build-segments'
import { buildSoflia } from './build-soflia'
import { computePriorityUsers } from './compute-priority-users'
import { createBuildContext } from './create-build-context'
import { finalizeCourses } from './finalize-courses'
import { finalizeUserDetails } from './finalize-user-details'
import type { AnalyticsQueryData } from './analytics-query-data'

export function buildReportsAnalyticsDataset(
  queryData: AnalyticsQueryData,
  filters: ReportsAnalyticsFilters,
): ReportsAnalyticsDataset {
  const context = createBuildContext(queryData, filters)
  applyReportsAnalyticsRecords(context, queryData)
  const userDetails = finalizeUserDetails(context)
  const courses = finalizeCourses(context)
  const totalUsers = userDetails.length

  const demographics = buildDemographics(context.dimensions)
  const learning = buildLearning(context, userDetails)
  const soflia = buildSoflia(context, queryData.liaConversations, queryData.liaMessages)
  const activities = buildActivities(
    context,
    queryData.activityCompletions,
    queryData.activitySubmissions,
    queryData.activityEvaluations,
    queryData.quizSubmissions,
  )
  const notes = buildNotes(context, queryData.lessonNotes, totalUsers)
  const planner = buildPlanner(context, queryData.studySessions)
  const quality = buildQuality(
    context,
    queryData.activityCompletions,
    queryData.activitySubmissions,
    queryData.activityEvaluations,
    queryData.liaConversations,
    queryData.liaMessages,
    queryData.quizSubmissions,
    queryData.lessonNotes,
  )
  const segments = buildSegments(userDetails)
  const rankings = buildRankings(userDetails)
  const dataQuality = buildDataQuality(context.dimensions)
  const overview = buildOverviewMetrics(context, queryData, userDetails, quality)
  const priorityUsers = computePriorityUsers(userDetails, new Date(filters.to))

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    period: {
      from: filters.from,
      to: filters.to,
    },
    filters,
    overview,
    demographics,
    learning,
    courses,
    soflia,
    activities,
    quality,
    notes,
    planner,
    loginHeatmap: buildLoginHeatmap(context.dimensions.map((dimension) => dimension.lastConnectionAt)),
    connectionCalendar: buildConnectionCalendar(
      context.dimensions.map((dimension) => dimension.lastConnectionAt),
      filters,
    ),
    segments,
    rankings,
    dataQuality,
    filterOptions: buildFilterOptions(queryData, context.dimensions),
    priorityUsers,
    userDetails,
    aiSamples: context.aiSamples,
  }
}
