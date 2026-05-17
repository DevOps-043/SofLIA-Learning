import type {
  AssignedCourse,
  AssignedLearningPath,
  AssignedLearningPathItem,
} from '../../types'
import type { LearningPathTranslator } from './types'
import { clampProgress } from './progress'
import { getItemCourseStatus } from './status'

export function buildCourseFromPathItem(
  item: AssignedLearningPathItem,
  learningPath: AssignedLearningPath,
  t: LearningPathTranslator,
): AssignedCourse {
  return {
    id: `${learningPath.id}-${item.courseId}`,
    course_id: item.courseId,
    title: item.title || t('dashboard.learningPaths.courseFallback', 'Curso sin titulo'),
    instructor: learningPath.title,
    progress: clampProgress(item.progress),
    status: getItemCourseStatus(item),
    thumbnail: item.thumbnail || '/images/course-placeholder.png',
    slug: item.slug ?? '',
    assigned_at: '',
    has_certificate: item.hasCertificate,
  }
}

export function buildStandalonePathItem(
  course: AssignedCourse,
  index: number,
): AssignedLearningPathItem {
  const progress = clampProgress(course.progress)

  return {
    courseId: course.course_id,
    title: course.title,
    slug: course.slug || null,
    thumbnail: course.thumbnail || null,
    position: index + 1,
    progress,
    status: progress >= 100 ? 'completed' : 'available',
    isUnlocked: true,
    isCompleted: progress >= 100,
    hasCertificate: Boolean(course.has_certificate),
  }
}
