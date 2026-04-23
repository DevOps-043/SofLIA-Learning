import type { CourseReport, EntityStatus, SummaryReport } from './types'

export function ensureCourseReport(
  reports: Map<string, CourseReport>,
  courseId: string,
): CourseReport {
  const existing = reports.get(courseId)
  if (existing) return existing

  const created = createCourseReport(courseId)
  reports.set(courseId, created)
  return created
}

export function updateReport(report: CourseReport, status: EntityStatus) {
  report.totalEntities += 1
  if (status === 'translated') report.translated += 1
  else if (status === 'pending') report.pending += 1
  else report.failed += 1
}

export function summarizeReports(reportByCourse: CourseReport[]): SummaryReport {
  return reportByCourse.reduce(createSummaryReducer, createEmptySummary())
}

export function createEmptySummary(): SummaryReport {
  return { totalEntities: 0, translated: 0, pending: 0, failed: 0 }
}

function createCourseReport(courseId: string): CourseReport {
  return { courseId, totalEntities: 0, translated: 0, pending: 0, failed: 0 }
}

function createSummaryReducer(acc: SummaryReport, item: CourseReport): SummaryReport {
  acc.totalEntities += item.totalEntities
  acc.translated += item.translated
  acc.pending += item.pending
  acc.failed += item.failed
  return acc
}
