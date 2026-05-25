import { describe, expect, it } from 'vitest'
import { assignLearningPathSchema } from '../schema'

const LEARNING_PATH_ID = '00000000-0000-4000-8000-000000000001'

describe('assignLearningPathSchema', () => {
  it('accepts a valid learning path assignment payload', () => {
    const result = assignLearningPathSchema.safeParse({
      learningPathId: LEARNING_PATH_ID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid learning path ids', () => {
    const result = assignLearningPathSchema.safeParse({
      learningPathId: 'learning-path-1',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const result = assignLearningPathSchema.safeParse({
      learningPathId: LEARNING_PATH_ID,
      userId: 'not-allowed',
    })

    expect(result.success).toBe(false)
  })
})
