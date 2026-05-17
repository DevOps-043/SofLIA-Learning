import type { BusinessUserAnalyticsDataset } from '../../../types/business-user-analytics.types'

export function buildInsightPayload(dataset: BusinessUserAnalyticsDataset) {
  return {
    period: dataset.period,
    overview: dataset.overview,
    learning: {
      courses: dataset.learning.courses.slice(0, 20),
      progressDistribution: dataset.learning.progressDistribution,
      completionsTrend: dataset.learning.completionsTrend,
    },
    aiAdoption: dataset.aiAdoption,
    planning: dataset.planning,
    notes: dataset.notes,
    activities: dataset.activities,
    quizzes: dataset.quizzes,
    quality: dataset.quality,
    strongestDays: dataset.contributionCalendar
      .filter((cell) => cell.value > 0)
      .sort((a, b) => b.value - a.value || b.date.localeCompare(a.date))
      .slice(0, 15),
    anonymizedSamples: dataset.aiSamples.slice(0, 35),
  }
}
