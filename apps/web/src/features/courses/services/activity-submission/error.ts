export type CourseActivityErrorCode =
  | 'COURSE_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'ENROLLMENT_NOT_FOUND'
  | 'ACTIVITY_NOT_FOUND'
  | 'ACTIVITY_NOT_INTERACTIVE'
  | 'SUBMISSION_NOT_FOUND'
  | 'INVALID_SUBMISSION'
  | 'VALIDATION_NOT_ENABLED'
  | 'VALIDATION_UNAVAILABLE'
  | 'VALIDATION_FAILED'

export class CourseActivityError extends Error {
  constructor(
    public readonly code: CourseActivityErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CourseActivityError'
  }
}
