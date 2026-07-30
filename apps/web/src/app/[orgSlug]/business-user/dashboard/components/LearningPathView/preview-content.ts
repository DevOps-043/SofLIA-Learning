import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
} from '../../types'
import type { InfoHoverCardContent, LearningPathTranslator } from './types'
import { formatTranslation } from './format'
import { clampProgress } from './progress'
import { translateCourseStatus } from './status'

export function buildCoursePreviewContent(
  course: AssignedCourse,
  item: AssignedLearningPathItem,
  learningPathTitle: string,
  t: LearningPathTranslator,
): InfoHoverCardContent {
  const progress = clampProgress(course.progress)
  const displayStatus: AssignedCourse['status'] =
    progress <= 0 && course.status !== 'Completado' ? 'No iniciado' : course.status
  const status = !item.isUnlocked
    ? t('dashboard.learningPaths.status.locked', 'Bloqueado')
    : progress >= 100
      ? t('dashboard.learningPaths.status.completed', 'Completado')
      : translateCourseStatus(displayStatus, t)

  return {
    key: `course:${course.course_id}`,
    kind: 'course',
    targetId: course.course_id,
    title: course.title,
    meta: formatTranslation(
      t,
      'dashboard.learningPaths.coursePreviewMeta',
      'Curso {{position}} de la ruta {{pathTitle}}',
      { position: item.position, pathTitle: learningPathTitle },
    ),
    description: '',
    points: [],
    progress,
    status,
    loading: false,
  }
}

export function buildStandaloneCoursePreviewContent(
  course: AssignedCourse,
  t: LearningPathTranslator,
): InfoHoverCardContent {
  const progress = clampProgress(course.progress)
  const displayStatus: AssignedCourse['status'] =
    progress <= 0 && course.status !== 'Completado' ? 'No iniciado' : course.status

  return {
    key: `course:${course.course_id}`,
    kind: 'course',
    targetId: course.course_id,
    title: course.title,
    meta: course.instructor
      ? formatTranslation(
          t,
          'dashboard.learningPaths.standaloneCoursePreviewMeta',
          'Curso impartido por {{instructor}}',
          { instructor: course.instructor },
        )
      : t('dashboard.learningPaths.standaloneCoursePreviewFallback', 'Curso asignado'),
    description: '',
    points: [],
    progress,
    status: translateCourseStatus(displayStatus, t),
    loading: false,
  }
}

export function buildLearningPathPreviewContent(
  learningPath: AssignedLearningPath,
  t: LearningPathTranslator,
): InfoHoverCardContent {
  return {
    key: `learning_path:${learningPath.id}`,
    kind: 'learning_path',
    targetId: learningPath.id,
    title: learningPath.title,
    meta: formatTranslation(
      t,
      'dashboard.learningPaths.pathPreviewMeta',
      '{{count}} cursos en secuencia',
      { count: learningPath.totalItemsCount },
    ),
    description: '',
    points: [],
    progress: clampProgress(learningPath.progressPercentage),
    status: formatTranslation(
      t,
      'dashboard.learningPaths.pathPreviewStatus',
      '{{completed}} de {{total}} completados',
      {
        completed: learningPath.completedItemsCount,
        total: learningPath.totalItemsCount,
      },
    ),
    loading: false,
  }
}
