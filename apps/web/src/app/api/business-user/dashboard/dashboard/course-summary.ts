import type { RelatedCourseSummary, RelatedCourseValue } from './types'

export function getRelatedCourseSummary(
  value: RelatedCourseValue
): RelatedCourseSummary | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export function getCourseThumbnail(courseTitle: string | undefined, thumbnailUrl?: string | null) {
  if (thumbnailUrl) return thumbnailUrl

  const title = courseTitle?.toLowerCase() || ''
  if (title.includes('python')) return '🐍'
  if (title.includes('ia') || title.includes('ai') || title.includes('generativa')) return '🤖'
  if (title.includes('diseño') || title.includes('ux') || title.includes('ui')) return '🎨'
  if (title.includes('machine learning') || title.includes('ml')) return '🧠'
  if (title.includes('datos') || title.includes('data')) return '📊'
  return '📚'
}
