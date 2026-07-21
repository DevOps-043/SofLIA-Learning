import type { BusinessUserAnalyticsDataset } from '../../../types/business-user-analytics.types'
import { buildConnectionCalendar, calculateAverage } from '../../reports-analytics/reports-analytics.helpers'
import { buildActivities } from './build-activities'
import { buildAiAdoption } from './build-ai-adoption'
import { buildAiSamples } from './build-ai-samples'
import { buildAnalyticsOverview } from './build-analytics-overview'
import { buildBusinessUserAnalyticsPeriod } from './build-business-user-analytics-period'
import { buildCompletedCourseIds } from './build-completed-course-ids'
import { buildCourseRows } from './build-course-rows'
import { buildCourseTitleMap } from './build-course-title-map'
import { buildLatestEvaluationBySubmission } from './build-latest-evaluation-by-submission'
import { buildLearningSummary } from './build-learning-summary'
import { buildNotes } from './build-notes'
import { buildQuality } from './build-quality'
import { buildQuizzes } from './build-quizzes'
import { collectContributionDates } from './collect-contribution-dates'
import { countEvidenceRecords } from './count-evidence-records'
import { FetchBusinessUserAnalyticsParams } from './fetch-business-user-analytics-params'
import { fetchQueryData } from './fetch-query-data'
import { hashAnalyticsPayload } from './hash-analytics-payload'
import { summarizeCourseRows } from './summarize-course-rows'
import { uniqueDateKeys } from './unique-date-keys'

export async function fetchBusinessUserAnalyticsDataset({
  supabase,
  userId,
  organizationId,
  range,
  includeAllUserEnrollments = false,
}: FetchBusinessUserAnalyticsParams): Promise<BusinessUserAnalyticsDataset> {
  const period = buildBusinessUserAnalyticsPeriod(range)
  const data = await fetchQueryData(supabase, userId, organizationId, period, includeAllUserEnrollments)
  const courseTitleById = buildCourseTitleMap(data.assignments)
  const enrollmentCourseById = new Map(data.enrollments.map((enrollment) => [enrollment.enrollment_id, enrollment.course_id]))
  const contributionDates = collectContributionDates(data, period)
  const activeDateKeys = uniqueDateKeys(contributionDates)
  const courseRows = buildCourseRows(data, courseTitleById)
  const courseSummary = summarizeCourseRows(courseRows)
  const evaluationsBySubmission = buildLatestEvaluationBySubmission(data.activityEvaluations)
  const completedCourseIds = buildCompletedCourseIds(data.assignments, data.enrollments)

  const aiAdoption = buildAiAdoption(data, period)
  const notes = buildNotes(data, period, courseSummary.lessonsCompleted)
  const activities = buildActivities(data, period, evaluationsBySubmission, completedCourseIds)
  const quizzes = buildQuizzes(data, period)
  const quality = buildQuality({
    averageCourseProgress: calculateAverage(courseRows.map((course) => course.progress)),
    activitiesScore: activities.averageQualityScore,
    sofliaScore: aiAdoption.questionQualityScore,
    notesScore: notes.notesScore,
    quizScore: quizzes.qualityScore,
    evidenceCount: countEvidenceRecords(data),
  })

  const datasetWithoutHash = {
    success: true as const,
    generatedAt: new Date().toISOString(),
    period,
    overview: buildAnalyticsOverview({
      activeDateKeys,
      contributionDates,
      courseRows,
      data,
      quality,
      summary: courseSummary,
    }),
    learning: buildLearningSummary(data, period, courseRows),
    aiAdoption,
    notes,
    activities,
    quizzes,
    quality,
    contributionCalendar: buildConnectionCalendar(contributionDates, period),
    aiSamples: buildAiSamples(data, courseTitleById, enrollmentCourseById, evaluationsBySubmission),
  }

  return {
    ...datasetWithoutHash,
    dataHash: hashAnalyticsPayload(datasetWithoutHash),
  }
}
