import { describe, expect, it } from 'vitest'
import { userCourseAssignmentSchema } from '../schema'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const COURSE_ID = '00000000-0000-4000-8000-000000000002'

describe('userCourseAssignmentSchema', () => {
  it('accepts a valid user course assignment payload', () => {
    const result = userCourseAssignmentSchema.safeParse({
      userId: USER_ID,
      courseId: COURSE_ID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid course ids', () => {
    const result = userCourseAssignmentSchema.safeParse({
      userId: USER_ID,
      courseId: 'course-1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = userCourseAssignmentSchema.safeParse({
      userId: USER_ID,
      courseId: COURSE_ID,
      organizationId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
