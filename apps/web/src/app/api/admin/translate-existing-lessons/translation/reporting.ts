import type {
  CourseReport,
  EntityStatus,
  TranslationRunContext,
  TranslationSupabaseClient,
} from './types'

export function createTranslationRunContext(
  supabase: TranslationSupabaseClient,
  userId: string
): TranslationRunContext {
  return {
    details: [],
    reports: new Map<string, CourseReport>(),
    supabase,
    userId,
  }
}

export function ensureCourseReport(
  reports: Map<string, CourseReport>,
  courseId: string
): CourseReport {
  const existing = reports.get(courseId)
  if (existing) {
    return existing
  }

  const created: CourseReport = {
    courseId,
    failed: 0,
    pending: 0,
    totalEntities: 0,
    translated: 0,
  }
  reports.set(courseId, created)
  return created
}

export function updateReport(report: CourseReport, status: EntityStatus) {
  report.totalEntities += 1
  if (status === 'translated') {
    report.translated += 1
    return
  }

  if (status === 'pending') {
    report.pending += 1
    return
  }

  report.failed += 1
}

export function buildEmptyTranslationResponse() {
  return {
    details: [],
    message: 'No se encontraron lecciones para procesar',
    reportByCourse: [],
    success: true,
    summary: {
      failed: 0,
      pending: 0,
      totalEntities: 0,
      translated: 0,
    },
  }
}

export function buildTranslationResponse(context: TranslationRunContext) {
  const reportByCourse = Array.from(context.reports.values())
  const summary = reportByCourse.reduce(
    (acc, item) => {
      acc.totalEntities += item.totalEntities
      acc.translated += item.translated
      acc.pending += item.pending
      acc.failed += item.failed
      return acc
    },
    { failed: 0, pending: 0, totalEntities: 0, translated: 0 }
  )

  return {
    details: context.details,
    message: `Procesadas ${summary.totalEntities} entidades de contenido`,
    reportByCourse,
    success: true,
    summary,
  }
}
