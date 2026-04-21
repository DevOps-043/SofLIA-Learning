import type {
  LearningRoute,
  LearningRouteReorderPreferences,
} from './learning-route.types'

export function reorganizeLearningRoute(
  route: LearningRoute,
  preferences: LearningRouteReorderPreferences,
): LearningRoute {
  const items = reorderItems(route.items, preferences).map((item, index) => ({
    ...item,
    order: index + 1,
  }))
  const totalMinutes = items.reduce((sum, item) => sum + item.estimatedMinutes, 0)
  const completedCourses = items.filter((item) => item.currentProgress >= 100).length

  return {
    ...route,
    items,
    totalMinutes,
    totalCourses: items.length,
    completedCourses,
    estimatedWeeks: Math.ceil(totalMinutes / (3.5 * 60)),
  }
}

function reorderItems(
  originalItems: LearningRoute['items'],
  preferences: LearningRouteReorderPreferences,
): LearningRoute['items'] {
  let items = [...originalItems]

  if (preferences.excludeCourseIds && preferences.excludeCourseIds.length > 0) {
    items = items.filter((item) => !preferences.excludeCourseIds?.includes(item.courseId))
  }

  if (preferences.prioritizeCourseIds && preferences.prioritizeCourseIds.length > 0) {
    items.sort((left, right) => {
      const leftPriority = preferences.prioritizeCourseIds?.includes(left.courseId) ? 0 : 1
      const rightPriority = preferences.prioritizeCourseIds?.includes(right.courseId) ? 0 : 1
      return leftPriority - rightPriority
    })
  }

  return preferences.maxCourses && preferences.maxCourses > 0
    ? items.slice(0, preferences.maxCourses)
    : items
}
