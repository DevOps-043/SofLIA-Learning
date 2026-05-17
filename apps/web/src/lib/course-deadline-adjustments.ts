import type {
  CourseMetadata,
  DeadlineApproach,
} from './course-deadline-calculator.types'

export function applyComplexityAdjustments(
  days: number,
  metadata: CourseMetadata,
  approach: DeadlineApproach,
): number {
  let adjusted = days
  const totalHours = metadata.duration_total_minutes / 60

  if (metadata.activity_count > metadata.lesson_count * 2) {
    adjusted = Math.ceil(adjusted * 1.15)
  }

  if (metadata.material_count > metadata.lesson_count * 3) {
    adjusted = Math.ceil(adjusted * 1.1)
  }

  if (totalHours < 2) {
    const minimums = { fast: 3, balanced: 7, long: 14 }
    adjusted = Math.max(adjusted, minimums[approach])
  } else if (totalHours > 50) {
    adjusted = Math.ceil(adjusted * 1.25)
  }

  return adjusted
}
