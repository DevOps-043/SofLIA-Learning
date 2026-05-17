/**
 * Courses assigned through learning paths are ordered first by their path
 * position. Courses outside any path keep their stable relative order.
 */
export function sortCoursesByLearningPathOrder<T extends { course_id: string }>(
  courses: T[],
  courseOrder: Map<string, number>,
): T[] {
  if (courseOrder.size === 0) return courses

  const fallbackOrder = Number.MAX_SAFE_INTEGER

  return [...courses].sort(
    (left, right) =>
      (courseOrder.get(left.course_id) ?? fallbackOrder) -
      (courseOrder.get(right.course_id) ?? fallbackOrder),
  )
}
