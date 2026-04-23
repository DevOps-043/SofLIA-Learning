import type { RelatedCourseSummary, RelatedCourseValue } from './types'

export function getRelatedCourseSummary(
  value: RelatedCourseValue,
): RelatedCourseSummary | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}
