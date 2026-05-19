import { describe, expect, it } from 'vitest'
import { assignUserLearningPathSchema } from '../schema'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const LEARNING_PATH_ID = '00000000-0000-4000-8000-000000000002'

describe('assignUserLearningPathSchema', () => {
  it('accepts a valid user learning path assignment payload', () => {
    const result = assignUserLearningPathSchema.safeParse({
      userId: USER_ID,
      learningPathId: LEARNING_PATH_ID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid user ids', () => {
    const result = assignUserLearningPathSchema.safeParse({
      userId: 'user-1',
      learningPathId: LEARNING_PATH_ID,
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = assignUserLearningPathSchema.safeParse({
      userId: USER_ID,
      learningPathId: LEARNING_PATH_ID,
      organizationId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
