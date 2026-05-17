import type { BaseCompletionQueryData } from './completion.data'
import { unwrapRelation } from './completion.relations'

export interface CompletionDerivedIds {
  lessonIds: string[]
  courseIds: string[]
  instructorIds: string[]
}

export function collectCompletionDerivedIds(data: BaseCompletionQueryData): CompletionDerivedIds {
  const lessonIds = Array.from(
    new Set(data.lessonProgress.map((progress) => progress.lesson_id).filter(Boolean)),
  )
  const courseIds = Array.from(
    new Set(
      [
        ...data.enrollments.map((enrollment) => enrollment.course_id),
        ...data.assignments.map((assignment) => assignment.course_id),
      ].filter(Boolean),
    ),
  )
  const instructorIds = Array.from(
    new Set(
      data.certificates
        .map((certificate) => unwrapRelation(certificate.courses)?.instructor_id)
        .filter(Boolean),
    ),
  ) as string[]

  return { lessonIds, courseIds, instructorIds }
}
