import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
} from '../../types'
import type {
  CourseListSection,
  DashboardTranslator,
} from './types'

export function clampCourseProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0
  return Math.max(0, Math.min(100, progress))
}

function getCourseStatusFromProgress(progress: number): AssignedCourse['status'] {
  if (progress >= 100) return 'Completado'
  if (progress > 0) return 'En progreso'
  return 'No iniciado'
}

export function formatDashboardText(
  t: DashboardTranslator,
  key: string,
  defaultValue: string,
  replacements: Record<string, string | number>,
) {
  let text = t(key, defaultValue)
  for (const [name, value] of Object.entries(replacements)) {
    text = text.split(`{{${name}}}`).join(String(value))
  }
  return text
}

export function buildCourseFromLearningPathItem(
  item: AssignedLearningPathItem,
  learningPath: AssignedLearningPath,
  t: DashboardTranslator,
): AssignedCourse {
  const progress = clampCourseProgress(item.progress)

  return {
    id: `${learningPath.id}-${item.courseId}`,
    course_id: item.courseId,
    title: item.title || t('dashboard.learningPaths.courseFallback', 'Curso sin titulo'),
    instructor: learningPath.title,
    progress,
    status: getCourseStatusFromProgress(progress),
    thumbnail: item.thumbnail || '/images/course-placeholder.png',
    slug: item.slug ?? '',
    assigned_at: '',
    has_certificate: item.hasCertificate,
  }
}

export function buildStandaloneCourseSection(
  courses: AssignedCourse[],
  t: DashboardTranslator,
): CourseListSection | null {
  if (courses.length === 0) return null

  const completed = courses.filter((course) => clampCourseProgress(course.progress) >= 100).length
  return {
    entries: courses.map((course) => ({ assigned: true, course, isLocked: false })),
    id: 'standalone-courses',
    summary: formatDashboardText(
      t,
      'dashboard.learningPaths.standaloneSummary',
      '{{completed}} de {{total}} cursos completados',
      { completed, total: courses.length },
    ),
    title: t('dashboard.learningPaths.standaloneTitle', 'Cursos independientes'),
  }
}
