import type {
  OrderValidationResult,
  PendingLessonRef,
  SessionOrderEntry,
} from './lesson-order.types'

export function validateLessonOrderEntries(
  entries: SessionOrderEntry[],
): OrderValidationResult {
  const sortedEntries = [...entries].sort((left, right) => {
    const startDiff =
      new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
    return startDiff !== 0
      ? startDiff
      : compareSequence(left.sequence, right.sequence)
  })

  for (let index = 0; index < sortedEntries.length - 1; index += 1) {
    const current = sortedEntries[index]
    const next = sortedEntries[index + 1]

    if (current.courseId !== next.courseId) continue

    if (compareSequence(current.sequence, next.sequence) > 0) {
      return {
        valid: false,
        code: 'lesson_order_violation',
        message:
          `No puedo dejar "${current.title}" antes que "${next.title}" ` +
          'porque romper\u00eda el orden estricto de lecciones pendientes del curso.',
      }
    }
  }

  return { valid: true }
}

export function comparePendingLessonRefs(
  left: PendingLessonRef,
  right: PendingLessonRef,
): number {
  return compareSequence(
    {
      moduleOrderIndex: left.moduleOrderIndex,
      lessonOrderIndex: left.lessonOrderIndex,
    },
    {
      moduleOrderIndex: right.moduleOrderIndex,
      lessonOrderIndex: right.lessonOrderIndex,
    },
  )
}

export function compareSequence(
  left: { moduleOrderIndex: number; lessonOrderIndex: number },
  right: { moduleOrderIndex: number; lessonOrderIndex: number },
): number {
  if (left.moduleOrderIndex !== right.moduleOrderIndex) {
    return left.moduleOrderIndex - right.moduleOrderIndex
  }

  return left.lessonOrderIndex - right.lessonOrderIndex
}

export function buildValidationFailureResult(message: string): OrderValidationResult {
  return {
    valid: false,
    code: 'lesson_order_validation_failed',
    message,
  }
}
