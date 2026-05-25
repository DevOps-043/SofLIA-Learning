import { buildBreakdown, calculateQualityScore } from '../../reports-analytics/reports-analytics.helpers'

export function buildQuality(input: {
  averageCourseProgress: number
  activitiesScore: number
  sofliaScore: number
  notesScore: number
  quizScore: number
  evidenceCount: number
}) {
  const courseScore = input.averageCourseProgress
  const overallScore = calculateQualityScore([
    courseScore,
    input.activitiesScore,
    input.sofliaScore,
    input.notesScore,
    input.quizScore,
  ])

  const radarValues = new Map<string, number>([
    ['courses', Math.round(courseScore)],
    ['activities', Math.round(input.activitiesScore)],
    ['soflia', Math.round(input.sofliaScore)],
    ['notes', Math.round(input.notesScore)],
    ['quizzes', Math.round(input.quizScore)],
  ])

  return {
    overallScore,
    courseScore,
    activityScore: input.activitiesScore,
    sofliaQuestionScore: input.sofliaScore,
    notesScore: input.notesScore,
    quizScore: input.quizScore,
    evidenceCount: input.evidenceCount,
    radar: buildBreakdown(radarValues, 100),
  }
}
