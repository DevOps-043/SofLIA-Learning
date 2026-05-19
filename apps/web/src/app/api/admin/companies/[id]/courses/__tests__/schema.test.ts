import { describe, expect, it } from 'vitest'
import { companyCourseAssignmentSchema } from '../schema'

const COURSE_ID = '00000000-0000-4000-8000-000000000001'

describe('companyCourseAssignmentSchema', () => {
  it('accepts a valid course assignment payload', () => {
    const result = companyCourseAssignmentSchema.safeParse({
      courseId: COURSE_ID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid course ids', () => {
    const result = companyCourseAssignmentSchema.safeParse({
      courseId: 'course-1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = companyCourseAssignmentSchema.safeParse({
      courseId: COURSE_ID,
      role: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
