export interface GeneratedCourseInstructorHint {
  instructorId: string | null
  email: string | null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getStringFromRecord(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null
  }

  for (const key of keys) {
    const value = getString(record[key])
    if (value) {
      return value
    }
  }

  return null
}

function getFirstRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (isRecord(value)) {
      return value
    }
  }

  return null
}

export function extractGeneratedCourseInstructorHint(payload: unknown): GeneratedCourseInstructorHint {
  if (!isRecord(payload)) {
    return { instructorId: null, email: null }
  }

  const course = isRecord(payload.course) ? payload.course : null
  const source = isRecord(payload.source) ? payload.source : null
  const instructor = getFirstRecord(course?.instructor, payload.instructor, source?.instructor, source?.user)

  const idCandidate = getStringFromRecord(course, [
    'instructor_id',
    'instructorId',
    'created_by',
    'createdBy',
    'user_id',
    'userId'
  ]) ||
    getStringFromRecord(instructor, ['id', 'user_id', 'userId']) ||
    getStringFromRecord(source, ['user_id', 'userId', 'created_by', 'createdBy']) ||
    getStringFromRecord(payload, ['instructor_id', 'instructorId', 'created_by', 'createdBy', 'user_id', 'userId'])

  const emailCandidate = getStringFromRecord(course, [
    'instructor_email',
    'instructorEmail',
    'created_by_email',
    'createdByEmail',
    'user_email',
    'userEmail'
  ]) ||
    getStringFromRecord(instructor, ['email']) ||
    getStringFromRecord(source, ['email', 'user_email', 'userEmail', 'created_by_email', 'createdByEmail']) ||
    getStringFromRecord(payload, [
      'instructor_email',
      'instructorEmail',
      'created_by_email',
      'createdByEmail',
      'user_email',
      'userEmail'
    ])

  return {
    instructorId: idCandidate && UUID_PATTERN.test(idCandidate) ? idCandidate : null,
    email: emailCandidate && EMAIL_PATTERN.test(emailCandidate) ? emailCandidate : null
  }
}
