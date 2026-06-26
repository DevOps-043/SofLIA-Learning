import type { ReportsAnalyticsCourseRow } from '../../types/reports-analytics.types'

export type CourseRiskLevel = 'high' | 'medium' | 'low'

export interface CourseWithRisk extends ReportsAnalyticsCourseRow {
  riskLevel: CourseRiskLevel
  riskScore: number
  completionRate: number
}

export function deriveCourseRisk(course: ReportsAnalyticsCourseRow): CourseWithRisk {
  const assigned = course.assignedUsers || 1
  const overdueRate = course.overdueAssignments / assigned
  const inactiveRate = 1 - course.activeLearners / assigned
  const lowProgressRate = course.averageProgress < 25 ? 1 : 0
  const incompleteRate = 1 - course.completedUsers / assigned

  const score =
    overdueRate * 0.4 +
    inactiveRate * 0.3 +
    lowProgressRate * 0.2 +
    incompleteRate * 0.1

  const riskLevel: CourseRiskLevel =
    score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low'

  const completionRate =
    assigned > 0 ? Math.round((course.completedUsers / assigned) * 100) : 0

  return {
    ...course,
    riskScore: Math.round(score * 100),
    riskLevel,
    completionRate,
  }
}

const RISK_ORDER: Record<CourseRiskLevel, number> = { high: 0, medium: 1, low: 2 }

export function deriveCourseRiskList(courses: ReportsAnalyticsCourseRow[]): CourseWithRisk[] {
  return courses
    .map(deriveCourseRisk)
    .sort((a, b) => {
      const levelDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]
      if (levelDiff !== 0) return levelDiff
      return b.riskScore - a.riskScore
    })
}
