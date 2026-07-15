import type {
  BusinessUserAnalyticsDataset,
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
} from '../../../types/business-user-analytics.types'
import { getFallbackText } from './copy'

export function buildFallbackInsights(
  dataset: BusinessUserAnalyticsDataset,
  locale: BusinessUserAnalyticsLocale,
  model: string,
): BusinessUserAnalyticsInsights {
  const text = getFallbackText(locale)
  const strongestCourse = [...dataset.learning.courses].sort((a, b) => b.progress - a.progress)[0]
  const weakestCourse = [...dataset.learning.courses].sort((a, b) => a.progress - b.progress)[0]

  return {
    generatedAt: new Date().toISOString(),
    model,
    cached: false,
    expiresAt: null,
    summary: text.summary(dataset.overview.averageProgress, dataset.quality.overallScore),
    metrics: [
      {
        label: text.progressMetric,
        value: `${dataset.overview.averageProgress}%`,
        detail: text.progressDetail(dataset.overview.completedCourses, dataset.overview.totalAssigned),
      },
      {
        label: text.aiMetric,
        value: `${dataset.aiAdoption.adoptionScore}%`,
        detail: text.aiDetail(dataset.aiAdoption.totalConversations, dataset.aiAdoption.questionQualityScore),
      },
    ],
    strengths: [
      strongestCourse ? text.strongCourse(strongestCourse.courseTitle, strongestCourse.progress) : text.noCourseStrength,
      text.activeDays(dataset.overview.activeDays, dataset.overview.longestStreak),
    ],
    opportunities: [
      weakestCourse ? text.weakCourse(weakestCourse.courseTitle, weakestCourse.progress) : text.noCourseOpportunity,
      text.notesOpportunity(dataset.notes.adoptionRate),
      text.activitiesOpportunity(dataset.activities.averageQualityScore),
    ],
    recommendations: [text.recommendSoflia, text.recommendNotes],
    nextSteps: [{
      title: text.nextStepsTitle,
      points: [text.nextStepCourse, text.nextStepQuestions, text.nextStepReview],
    }],
  }
}
