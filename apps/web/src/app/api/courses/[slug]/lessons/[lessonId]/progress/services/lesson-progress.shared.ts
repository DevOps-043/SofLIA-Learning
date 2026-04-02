export interface LessonProgressLesson {
  lesson_id: string
  lesson_order_index: number
  module_order_index: number
}

export interface LessonProgressQuizSubmission {
  is_passed: boolean | null
}

export type LessonProgressErrorCode =
  | 'COURSE_NOT_FOUND'
  | 'COURSE_HAS_NO_MODULES'
  | 'COURSE_HAS_NO_LESSONS'
  | 'LESSON_NOT_FOUND'
  | 'PREVIOUS_LESSON_NOT_COMPLETED'
  | 'REQUIRED_QUIZ_NOT_PASSED'
  | 'ENROLLMENT_CREATE_FAILED'
  | 'LESSON_PROGRESS_UPDATE_FAILED'
  | 'LESSON_PROGRESS_INSERT_FAILED'

export class LessonProgressError extends Error {
  constructor(
    public readonly code: LessonProgressErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'LessonProgressError'
  }
}

export function sortLessonsForCourse<T extends LessonProgressLesson>(lessons: T[]) {
  return [...lessons].sort((left, right) => {
    if (left.module_order_index !== right.module_order_index) {
      return left.module_order_index - right.module_order_index
    }

    return left.lesson_order_index - right.lesson_order_index
  })
}

export function hasPassedRequiredQuizzes(
  totalRequiredQuizzes: number,
  submissions: LessonProgressQuizSubmission[],
) {
  return submissions.filter((submission) => submission.is_passed).length >=
    totalRequiredQuizzes
}
