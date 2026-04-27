interface PlannedLessonTitleSource {
  courseTitle?: string | null
}

interface StudySessionTitleSource {
  title?: string | null
  plannedLessons?: PlannedLessonTitleSource[] | null
  metrics?: unknown
}

function parseMetrics(metrics: unknown): { plannedLessons?: PlannedLessonTitleSource[] | null } | null {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return null
  }

  return metrics as { plannedLessons?: PlannedLessonTitleSource[] | null }
}

function getCourseTitleFromLessons(
  plannedLessons?: PlannedLessonTitleSource[] | null,
): string | null {
  if (!Array.isArray(plannedLessons)) {
    return null
  }

  const courseTitle = plannedLessons.find(
    (lesson) => typeof lesson.courseTitle === 'string' && lesson.courseTitle.trim() !== '',
  )?.courseTitle

  return typeof courseTitle === 'string' ? courseTitle.trim() : null
}

export function buildStudySessionTitleFromCourseTitle(courseTitle?: string | null): string {
  const normalizedCourseTitle = typeof courseTitle === 'string' ? courseTitle.trim() : ''
  return normalizedCourseTitle
    ? `Sesión de estudio de ${normalizedCourseTitle}`
    : 'Sesión de estudio'
}

export function resolveStudySessionTitle(source: StudySessionTitleSource): string {
  const courseTitle =
    getCourseTitleFromLessons(source.plannedLessons)
    || getCourseTitleFromLessons(parseMetrics(source.metrics)?.plannedLessons)

  if (courseTitle) {
    return buildStudySessionTitleFromCourseTitle(courseTitle)
  }

  const fallbackTitle = typeof source.title === 'string' ? source.title.trim() : ''
  return fallbackTitle || buildStudySessionTitleFromCourseTitle()
}
