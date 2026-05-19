import { describe, expect, it } from 'vitest'
import { addLearningPathItemSchema } from '../schema'

const COURSE_ID = '00000000-0000-4000-8000-000000000001'

describe('addLearningPathItemSchema', () => {
  it('accepts a valid course id', () => {
    const result = addLearningPathItemSchema.safeParse({
      courseId: COURSE_ID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid course ids', () => {
    const result = addLearningPathItemSchema.safeParse({
      courseId: 'course-1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = addLearningPathItemSchema.safeParse({
      courseId: COURSE_ID,
      position: 1,
    })

    expect(result.success).toBe(false)
  })
})
