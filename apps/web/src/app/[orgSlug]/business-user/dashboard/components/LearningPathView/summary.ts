import { formatTranslation } from './format'
import { clampProgress } from './progress'
import type { AssignedCourse, AssignedLearningPath } from '../../types'
import type { LearningPathTranslator } from './types'

export function getLearningPathCompletedSummary(
  learningPath: AssignedLearningPath,
  t: LearningPathTranslator,
) {
  return `${learningPath.completedItemsCount} ${t(
    'dashboard.learningPaths.of',
    'de',
  )} ${learningPath.totalItemsCount} ${t(
    'dashboard.learningPaths.completedCoursesSuffix',
    'cursos completados',
  )}`
}

export function getStandaloneSummary(
  courses: AssignedCourse[],
  t: LearningPathTranslator,
) {
  const completed = courses.filter((course) => clampProgress(course.progress) >= 100).length

  return formatTranslation(
    t,
    'dashboard.learningPaths.standaloneSummary',
    '{{completed}} de {{total}} cursos completados',
    { completed, total: courses.length },
  )
}
